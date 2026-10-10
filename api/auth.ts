import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiKey } from "./_lib/claude.js";
import { checkPassword, clearSession, isAuthed, method, route, setSession } from "./_lib/auth.js";

export default route(
  async (req: VercelRequest, res: VercelResponse) => {
    const m = method(req, "GET", "POST", "DELETE");
    if (m === "GET") return { authed: isAuthed(req), ai: !!apiKey() || process.env.BLOOM_FAKE_AI === "1" };
    if (m === "DELETE") {
      clearSession(res);
      return { ok: true };
    }
    if (!checkPassword(req.body?.password)) {
      await new Promise((r) => setTimeout(r, 800)); // slow down guessing
      return res.status(401).json({ error: "That password isn't right." });
    }
    setSession(res);
    return { ok: true };
  },
  { public: true },
);
