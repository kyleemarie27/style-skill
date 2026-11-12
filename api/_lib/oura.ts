import type { VercelRequest } from "@vercel/node";
import { randomBytes } from "node:crypto";
import { addDays } from "../../shared/dates.js";
import { getPool, HttpError, q } from "./db.js";

/**
 * Oura, over its OAuth2 API (v2). Bloom keeps the tokens in the settings table (key 'oura'),
 * never sends them to the browser, and pulls three numbers per night: skin temperature deviation,
 * lowest resting heart rate and average HRV.
 *
 * Setup (once): register an app at https://cloud.ouraring.com/oauth/applications with the redirect
 * URI https://<your Bloom domain>/api/oura/callback, then add OURA_CLIENT_ID and OURA_CLIENT_SECRET
 * in Vercel. Settings → Oura → Connect does the rest.
 */
const AUTHORIZE = "https://cloud.ouraring.com/oauth/authorize";
const TOKEN = "https://api.ouraring.com/oauth/token";
const API = "https://api.ouraring.com/v2/usercollection";
const SCOPES = "daily personal";

interface Tokens {
  access: string;
  refresh: string;
  /** ms since epoch */
  expiresAt: number;
  connectedAt: string;
  lastSync?: string | null;
  lastError?: string | null;
}

export interface OuraStatus {
  /** OURA_CLIENT_ID and OURA_CLIENT_SECRET are set. */
  configured: boolean;
  connected: boolean;
  lastSync: string | null;
  lastError: string | null;
  /** The redirect URI to register with Oura. */
  redirectUri: string;
}

export const ouraConfigured = () => !!(process.env.OURA_CLIENT_ID && process.env.OURA_CLIENT_SECRET);

export function redirectUri(req: VercelRequest): string {
  if (process.env.OURA_REDIRECT_URI) return process.env.OURA_REDIRECT_URI;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers.host ?? "localhost:5173";
  const local = /^localhost|^127\./.test(host);
  return `${local ? "http" : "https"}://${host}/api/oura/callback`;
}

async function load(): Promise<Tokens | null> {
  const { rows } = await q<{ value: Tokens }>("SELECT value FROM settings WHERE key='oura'");
  return rows[0]?.value ?? null;
}

async function store(t: Tokens) {
  await q("INSERT INTO settings (key, value) VALUES ('oura', $1) ON CONFLICT (key) DO UPDATE SET value=$1", [JSON.stringify(t)]);
}

export async function ouraStatus(req: VercelRequest): Promise<OuraStatus> {
  const t = await load();
  return {
    configured: ouraConfigured(),
    connected: !!t,
    lastSync: t?.lastSync ?? null,
    lastError: t?.lastError ?? null,
    redirectUri: redirectUri(req),
  };
}

/** Where to send the browser to start connecting. The state is checked on the way back. */
export async function authorizeUrl(req: VercelRequest): Promise<string> {
  if (!ouraConfigured()) throw new HttpError(400, "Add OURA_CLIENT_ID and OURA_CLIENT_SECRET in Vercel first.");
  const state = randomBytes(24).toString("base64url");
  await q("INSERT INTO settings (key, value) VALUES ('oura_state', $1) ON CONFLICT (key) DO UPDATE SET value=$1", [
    JSON.stringify({ state, at: Date.now() }),
  ]);
  const u = new URL(AUTHORIZE);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", process.env.OURA_CLIENT_ID!);
  u.searchParams.set("redirect_uri", redirectUri(req));
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("state", state);
  return u.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<Omit<Tokens, "connectedAt">> {
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...body, client_id: process.env.OURA_CLIENT_ID!, client_secret: process.env.OURA_CLIENT_SECRET! }),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !data.access_token || !data.refresh_token) {
    throw new HttpError(502, `Oura didn't accept the sign-in (${data.error ?? res.status}).`);
  }
  return { access: data.access_token, refresh: data.refresh_token, expiresAt: Date.now() + (data.expires_in ?? 86400) * 1000 };
}

/** The end of the Oura sign-in: check the state, swap the code for tokens, then pull the last 90 nights. */
export async function finishConnect(req: VercelRequest, code: unknown, state: unknown) {
  const { rows } = await q<{ value: { state: string; at: number } }>("SELECT value FROM settings WHERE key='oura_state'");
  const saved = rows[0]?.value;
  await q("DELETE FROM settings WHERE key='oura_state'");
  if (!saved || typeof state !== "string" || state !== saved.state || Date.now() - saved.at > 15 * 60_000) {
    throw new HttpError(400, "That Oura sign-in link expired. Try Connect again.");
  }
  if (typeof code !== "string" || !code) throw new HttpError(400, "Oura didn't send a sign-in code.");
  const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri(req) });
  await store({ ...t, connectedAt: new Date().toISOString(), lastSync: null, lastError: null });
  await syncOura(90);
}

export async function disconnectOura() {
  await q("DELETE FROM settings WHERE key IN ('oura','oura_state')");
}

/** Oura refresh tokens work once, so the new pair is saved straight away. */
async function freshAccess(t: Tokens): Promise<Tokens> {
  if (t.expiresAt - Date.now() > 5 * 60_000) return t;
  const next = { ...t, ...(await tokenRequest({ grant_type: "refresh_token", refresh_token: t.refresh })) };
  await store(next);
  return next;
}

async function get<T>(access: string, path: string, start: string, end: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = null;
  for (let page = 0; page < 10; page++) {
    const u = new URL(`${API}/${path}`);
    u.searchParams.set("start_date", start);
    u.searchParams.set("end_date", end);
    if (next) u.searchParams.set("next_token", next);
    const res = await fetch(u, { headers: { Authorization: `Bearer ${access}` } });
    if (res.status === 401) throw new HttpError(409, "Oura signed Bloom out. Connect again in Settings.");
    if (!res.ok) throw new HttpError(502, `Oura returned ${res.status} for ${path}.`);
    const data = (await res.json()) as { data: T[]; next_token?: string | null };
    out.push(...data.data);
    next = data.next_token ?? null;
    if (!next) break;
  }
  return out;
}

interface Readiness { day: string; temperature_deviation: number | null }
interface Sleep { day: string; type: string; lowest_heart_rate: number | null; average_hrv: number | null; total_sleep_duration: number | null }

/** One row per night from Oura's readiness (temperature) and sleep (heart rate, HRV) data. */
export function mergeNights(readiness: Readiness[], sleep: Sleep[]) {
  const nights = new Map<string, { date: string; tempDev: number | null; rhr: number | null; hrv: number | null }>();
  const row = (day: string) => nights.get(day) ?? nights.set(day, { date: day, tempDev: null, rhr: null, hrv: null }).get(day)!;
  for (const r of readiness) if (typeof r.temperature_deviation === "number") row(r.day).tempDev = Math.round(r.temperature_deviation * 100) / 100;
  // A day can have naps too; the main sleep is the longest "long_sleep".
  const score = (s: Sleep) => (s.type === "long_sleep" ? 1e9 : 0) + (s.total_sleep_duration ?? 0);
  const main = new Map<string, Sleep>();
  for (const s of sleep) {
    const cur = main.get(s.day);
    if (!cur || score(s) > score(cur)) main.set(s.day, s);
  }
  for (const s of main.values()) {
    const r = row(s.day);
    r.rhr = s.lowest_heart_rate ?? null;
    r.hrv = s.average_hrv ?? null;
  }
  return [...nights.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Pull the last `days` nights and save them. Only one sync runs at a time: Oura refresh tokens
 * work once, so two at once could sign Bloom out. Returns how many nights were saved, or null
 * when not connected or another sync is running.
 */
export async function syncOura(days = 10): Promise<number | null> {
  const t0 = await load();
  if (!t0 || !ouraConfigured()) return null;
  const client = await getPool().connect();
  try {
    const { rows } = await client.query<{ ok: boolean }>("SELECT pg_try_advisory_lock(727275) AS ok");
    if (!rows[0].ok) return null;
    try {
      const t = await freshAccess((await load()) ?? t0);
      const end = new Date().toISOString().slice(0, 10);
      const start = addDays(end, -days);
      // Oura's end_date is exclusive for some collections; ask for one extra day.
      const [readiness, sleep] = await Promise.all([
        get<Readiness>(t.access, "daily_readiness", start, addDays(end, 1)),
        get<Sleep>(t.access, "sleep", start, addDays(end, 1)),
      ]);
      const nights = mergeNights(readiness, sleep);
      for (const n of nights) {
        await q(
          `INSERT INTO wearable_days (date, temp_dev, rhr, hrv, source, updated_at) VALUES ($1,$2,$3,$4,'oura',now())
           ON CONFLICT (date) DO UPDATE SET temp_dev=$2, rhr=$3, hrv=$4, updated_at=now()`,
          [n.date, n.tempDev, n.rhr, n.hrv],
        );
      }
      await store({ ...((await load()) ?? t), lastSync: new Date().toISOString(), lastError: null });
      return nights.length;
    } catch (e) {
      const cur = await load();
      if (cur) await store({ ...cur, lastError: (e as Error).message.slice(0, 200) });
      throw e;
    } finally {
      await client.query("SELECT pg_advisory_unlock(727275)");
    }
  } finally {
    client.release();
  }
}
