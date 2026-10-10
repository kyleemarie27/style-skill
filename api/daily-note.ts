import type { VercelRequest } from "@vercel/node";
import { isISODate } from "../shared/dates.js";
import { method, route } from "./_lib/auth.js";
import { askJson, fakeAi } from "./_lib/claude.js";
import { HttpError, q } from "./_lib/db.js";

const SYSTEM = `You write the short personal line at the top of a private cycle and fertility tracker's daily note. The user is trying to conceive.

Write 2–3 warm, specific sentences, like a knowledgeable friend:
- Mention one concrete thing from yesterday's log or the recent trend (an LH reading going up, intercourse timing in the fertile window, a symptom, or what she logged). If nothing was logged, gently invite a quick check-in.
- Then give one practical focus for today that fits the phase.
- Keep it encouraging but honest. Never promise pregnancy, never diagnose, and avoid toxic positivity. If you mention timing, be accurate: the most fertile days are the 2–3 days before ovulation and ovulation day itself.
- Plain text only, no emoji, no greeting like "Good morning".`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["line"],
  properties: { line: { type: "string" } },
};

/**
 * POST /api/daily-note {date, phase, context} → {line}
 * Cached per day, so Claude is called at most once a day (pass refresh=true to regenerate).
 */
export default route(async (req: VercelRequest) => {
  method(req, "POST");
  const { date, phase, context, refresh } = req.body ?? {};
  if (!isISODate(date)) throw new HttpError(400, "Missing date.");

  if (!refresh) {
    const cached = await q<{ ai_line: string; phase: string }>("SELECT ai_line, phase FROM daily_notes WHERE date=$1", [date]);
    if (cached.rows[0]?.ai_line && cached.rows[0].phase === phase) return { line: cached.rows[0].ai_line, cached: true };
  }

  const line = fakeAi()
    ? "Yesterday's LH reading was higher than the day before, so your surge may be close. Keep testing this afternoon and plan some time together tonight."
    : (
        await askJson<{ line: string }>({
          system: SYSTEM,
          schema: SCHEMA,
          effort: "low",
          maxTokens: 2000,
          content: [{ type: "text", text: `Today's context (JSON):\n${JSON.stringify(context ?? {}).slice(0, 6000)}` }],
        })
      ).line.trim();

  await q(
    `INSERT INTO daily_notes (date, phase, ai_line) VALUES ($1,$2,$3)
     ON CONFLICT (date) DO UPDATE SET phase=$2, ai_line=$3, created_at=now()`,
    [date, String(phase ?? ""), line],
  );
  return { line, cached: false };
});
