import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiKey } from "./_lib/claude.js";
import {
  checkNewPassword, endSession, getSession, login, method, passwordHashes, requireRole, route, setPassword,
  startSession, verifyPassword, clearCookie,
} from "./_lib/auth.js";
import { HttpError, q } from "./_lib/db.js";

/**
 * GET    /api/auth                       → {authed, role, ai, setup, partner}
 * GET    /api/auth?sessions=1            → signed-in devices (main account only)
 * POST   /api/auth {password}            → log in
 * PUT    /api/auth {action: "password", current, next}   change your own password
 * PUT    /api/auth {action: "partner", password}         set or reset the partner's password (main account)
 * PUT    /api/auth {action: "claim-partner", password}   on a new device logged in with the setup password:
 *                                                         become the partner, with a password of their own
 * DELETE /api/auth                       → log out this device
 * DELETE /api/auth?session=ID            → log out one device (main account)
 * DELETE /api/auth?others=1              → log out every other device of yours
 * DELETE /api/auth?partner=1             → remove the partner's login (main account)
 */
export default route(
  async (req: VercelRequest, res: VercelResponse) => {
    const m = method(req, "GET", "POST", "PUT", "DELETE");

    if (m === "POST") {
      const { role, setup } = await login(req, req.body?.password);
      await startSession(req, res, role);
      return { ok: true, role, setup };
    }

    const s = await getSession(req);
    if (m === "GET" && req.query.sessions === undefined) {
      const hashes = s ? await passwordHashes() : {};
      return {
        authed: !!s,
        role: s?.role ?? null,
        ai: !!apiKey() || process.env.BLOOM_FAKE_AI === "1",
        setup: s?.role === "me" && !hashes.me,
        partner: !!hashes.partner,
      };
    }
    if (!s) throw new HttpError(401, "Please log in.");

    if (m === "GET") {
      await requireRole(req, "me");
      const { rows } = await q(
        `SELECT id_hash AS id, role, label, created_at, last_seen FROM sessions WHERE expires_at > now() ORDER BY last_seen DESC`,
      );
      return { sessions: rows.map((r) => ({ ...r, current: r.id === s.id })) };
    }

    if (m === "PUT") {
      const action = req.body?.action;
      const hashes = await passwordHashes();
      if (action === "password") {
        const current = String(req.body?.current ?? "");
        const ok = hashes[s.role]
          ? await verifyPassword(current, hashes[s.role]!)
          : s.role === "me" && current === process.env.APP_PASSWORD;
        if (!ok) throw new HttpError(400, "Your current password isn't right.");
        const next = checkNewPassword(req.body?.next);
        if (s.role === "me" && hashes.partner && (await verifyPassword(next, hashes.partner))) {
          throw new HttpError(400, "Pick a password that's different from your partner's.");
        }
        await setPassword(s.role, next);
        // Everyone else who was signed in as you (say, with the old shared password) is logged out.
        await q("DELETE FROM sessions WHERE role=$1 AND id_hash<>$2", [s.role, s.id]);
        return { ok: true };
      }
      if (action === "partner") {
        await requireRole(req, "me");
        const pw = checkNewPassword(req.body?.password);
        if (hashes.me ? await verifyPassword(pw, hashes.me) : pw === process.env.APP_PASSWORD) {
          throw new HttpError(400, "Pick a password that's different from yours.");
        }
        await setPassword("partner", pw);
        await q("DELETE FROM sessions WHERE role='partner'");
        return { ok: true };
      }
      if (action === "claim-partner") {
        // Only while the shared setup password is still the main one and no partner login exists yet.
        if (s.role !== "me" || hashes.me || hashes.partner) throw new HttpError(403, "Ask for a partner password from the main account.");
        const pw = checkNewPassword(req.body?.password);
        if (pw === process.env.APP_PASSWORD) throw new HttpError(400, "Pick a password of your own, not the shared one.");
        await setPassword("partner", pw);
        await endSession(req);
        await startSession(req, res, "partner");
        return { ok: true, role: "partner" };
      }
      throw new HttpError(400, "Unknown action.");
    }

    // DELETE
    if (req.query.session !== undefined) {
      await requireRole(req, "me");
      await q("DELETE FROM sessions WHERE id_hash=$1", [String(req.query.session)]);
      return { ok: true };
    }
    if (req.query.others !== undefined) {
      await q(s.role === "me" ? "DELETE FROM sessions WHERE id_hash<>$1" : "DELETE FROM sessions WHERE role='partner' AND id_hash<>$1", [s.id]);
      return { ok: true };
    }
    if (req.query.partner !== undefined) {
      await requireRole(req, "me");
      await q("DELETE FROM accounts WHERE role='partner'");
      await q("DELETE FROM sessions WHERE role='partner'");
      return { ok: true };
    }
    await endSession(req);
    clearCookie(res);
    return { ok: true };
  },
  { public: true },
);
