import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HttpError } from "./db.js";

const COOKIE = "bloom_session";
const MAX_AGE_DAYS = 90;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new HttpError(500, "SESSION_SECRET must be set (16+ characters).");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function checkPassword(given: unknown): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new HttpError(500, "APP_PASSWORD is not set.");
  if (typeof given !== "string") return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function setSession(res: VercelResponse) {
  const expires = Date.now() + MAX_AGE_DAYS * 86_400_000;
  const token = `${expires}.${sign(String(expires))}`;
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_DAYS * 86400}${secure}`,
  );
}

export function clearSession(res: VercelResponse) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export function isAuthed(req: VercelRequest): boolean {
  const raw = req.headers.cookie ?? "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [expires, sig] = m[1].split(".");
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  const expected = Buffer.from(sign(expires));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown;

/** Wrap a handler: require login, turn thrown HttpErrors into JSON responses. */
export function route(handler: Handler, opts: { public?: boolean } = {}): Handler {
  return async (req, res) => {
    try {
      if (!opts.public && !isAuthed(req)) return res.status(401).json({ error: "Please log in." });
      const out = await handler(req, res);
      if (!res.headersSent && out !== undefined) res.status(200).json(out);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      if (!res.headersSent) res.status(status).json({ error: err instanceof Error ? err.message : "Something went wrong." });
    }
  };
}

export function method(req: VercelRequest, ...allowed: string[]) {
  if (!allowed.includes(req.method ?? "GET")) throw new HttpError(405, "Method not allowed");
  return req.method ?? "GET";
}
