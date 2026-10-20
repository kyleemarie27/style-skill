import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HttpError, q } from "./db.js";

/**
 * Two logins: "me" (the person tracking) and "partner". Each has its own password, stored as a
 * scrypt hash. Until "me" sets one, APP_PASSWORD from the Vercel setup works as hers.
 * Sessions live in the database, so logging out (or "log out other devices") really ends them.
 */
export type Role = "me" | "partner";
export interface Session {
  id: string;
  role: Role;
}

const COOKIE = "bloom_session";
const SESSION_DAYS = 60;
/** Wrong passwords allowed per device (IP) in the window, and across everyone, before logins pause. */
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_TOTAL = 30;
const FAIL_WINDOW_MIN = 15;
export const MIN_PASSWORD = 10;

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const given = await scrypt(pw, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(expected, given);
}

/** Constant-time compare for the setup password (hashing first evens out the lengths). */
function sameText(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export async function passwordHashes(): Promise<Partial<Record<Role, string>>> {
  const { rows } = await q<{ role: Role; hash: string }>("SELECT role, hash FROM accounts");
  return Object.fromEntries(rows.map((r) => [r.role, r.hash]));
}

export function checkNewPassword(pw: unknown): string {
  if (typeof pw !== "string" || pw.length < MIN_PASSWORD) throw new HttpError(400, `Use at least ${MIN_PASSWORD} characters.`);
  if (pw.length > 200) throw new HttpError(400, "That password is too long.");
  return pw;
}

export async function setPassword(role: Role, pw: string) {
  await q(
    "INSERT INTO accounts (role, hash, updated_at) VALUES ($1,$2,now()) ON CONFLICT (role) DO UPDATE SET hash=$2, updated_at=now()",
    [role, await hashPassword(pw)],
  );
}

export function clientIp(req: VercelRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
  return (req.headers["x-real-ip"] as string | undefined) ?? first ?? req.socket?.remoteAddress ?? "unknown";
}

/**
 * Check a password and say whose it is. Wrong guesses are counted per IP and overall; past the
 * limit, logins pause for 15 minutes even with the right password, so guessing doesn't pay.
 */
export async function login(req: VercelRequest, pw: unknown): Promise<{ role: Role; setup: boolean }> {
  const ip = clientIp(req);
  await q(`DELETE FROM login_attempts WHERE at < now() - interval '1 day'`);
  const { rows } = await q<{ ip_fails: string; all_fails: string }>(
    `SELECT count(*) FILTER (WHERE ip=$1) AS ip_fails, count(*) AS all_fails
     FROM login_attempts WHERE at > now() - interval '${FAIL_WINDOW_MIN} minutes'`,
    [ip],
  );
  if (Number(rows[0].ip_fails) >= MAX_FAILS_PER_IP || Number(rows[0].all_fails) >= MAX_FAILS_TOTAL) {
    throw new HttpError(429, `Too many wrong passwords. Try again in ${FAIL_WINDOW_MIN} minutes.`);
  }
  const given = typeof pw === "string" ? pw.slice(0, 200) : "";
  const hashes = await passwordHashes();
  let found: { role: Role; setup: boolean } | null = null;
  if (hashes.me) {
    if (await verifyPassword(given, hashes.me)) found = { role: "me", setup: false };
  } else {
    const setupPw = process.env.APP_PASSWORD;
    if (!setupPw) throw new HttpError(500, "APP_PASSWORD is not set.");
    if (given && sameText(given, setupPw)) found = { role: "me", setup: true };
  }
  if (!found && hashes.partner && (await verifyPassword(given, hashes.partner))) found = { role: "partner", setup: false };
  if (!found) {
    await q("INSERT INTO login_attempts (ip) VALUES ($1)", [ip]);
    await new Promise((r) => setTimeout(r, 600));
    throw new HttpError(401, "That password isn't right.");
  }
  await q("DELETE FROM login_attempts WHERE ip=$1", [ip]);
  return found;
}

const secure = () => (process.env.NODE_ENV === "production" || process.env.VERCEL ? "; Secure" : "");

/** Device name for the "signed in" list, from the browser's user agent. */
function deviceLabel(ua: string): string {
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Device";
  const app = /CriOS|Chrome/.test(ua) && !/Edg/.test(ua) ? "Chrome" : /Edg/.test(ua) ? "Edge" : /Firefox|FxiOS/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "";
  return app ? `${os} · ${app}` : os;
}

export async function startSession(req: VercelRequest, res: VercelResponse, role: Role) {
  const token = randomBytes(32).toString("base64url");
  await q(
    `INSERT INTO sessions (id_hash, role, label, expires_at) VALUES ($1,$2,$3, now() + interval '${SESSION_DAYS} days')`,
    [sha256(token), role, deviceLabel(String(req.headers["user-agent"] ?? ""))],
  );
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure()}`);
}

export function clearCookie(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure()}`);
}

function token(req: VercelRequest): string | null {
  const m = (req.headers.cookie ?? "").match(new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{20,})`));
  return m ? m[1] : null;
}

/** The session for this request, or null. Active sessions slide forward, at most once a day. */
export async function getSession(req: VercelRequest): Promise<Session | null> {
  const cached = (req as { _session?: Session | null })._session;
  if (cached !== undefined) return cached;
  const t = token(req);
  let s: Session | null = null;
  if (t) {
    const { rows } = await q<{ id_hash: string; role: Role }>(
      `UPDATE sessions SET last_seen = now(),
         expires_at = CASE WHEN last_seen < now() - interval '1 day' THEN now() + interval '${SESSION_DAYS} days' ELSE expires_at END
       WHERE id_hash=$1 AND expires_at > now() RETURNING id_hash, role`,
      [sha256(t)],
    );
    if (rows[0]) s = { id: rows[0].id_hash, role: rows[0].role };
  }
  (req as { _session?: Session | null })._session = s;
  return s;
}

export async function endSession(req: VercelRequest) {
  const t = token(req);
  if (t) await q("DELETE FROM sessions WHERE id_hash=$1", [sha256(t)]);
}

/** The logged-in session; throws 403 when `roles` doesn't include it. Use inside a route. */
export async function requireRole(req: VercelRequest, ...roles: Role[]): Promise<Session> {
  const s = await getSession(req);
  if (!s) throw new HttpError(401, "Please log in.");
  if (roles.length && !roles.includes(s.role)) throw new HttpError(403, "Only available on the main account.");
  return s;
}

/**
 * Writes must come from Bloom's own pages. Browsers send Origin on cross-site requests, so a
 * page elsewhere can't use a logged-in cookie to change anything (on top of SameSite=Lax).
 */
function sameOrigin(req: VercelRequest): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method ?? "GET")) return true;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers["x-forwarded-host"] ?? req.headers.host);
  } catch {
    return false;
  }
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown;

/**
 * Wrap a handler: require login (and one of `roles`, if given), refuse cross-site writes,
 * and turn thrown HttpErrors into JSON responses.
 */
export function route(handler: Handler, opts: { public?: boolean; roles?: Role[] } = {}): Handler {
  return async (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      if (!sameOrigin(req)) throw new HttpError(403, "Cross-site request refused.");
      if (!opts.public) await requireRole(req, ...(opts.roles ?? []));
      const out = await handler(req, res);
      if (!res.headersSent && out !== undefined) res.status(200).json(out);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      else if (status >= 502) console.error(`${req.method} ${req.url} → ${status}: ${(err as Error).message}`);
      if (!res.headersSent) res.status(status).json({ error: err instanceof HttpError ? err.message : "Something went wrong." });
    }
  };
}

export function method(req: VercelRequest, ...allowed: string[]) {
  if (!allowed.includes(req.method ?? "GET")) throw new HttpError(405, "Method not allowed");
  return req.method ?? "GET";
}
