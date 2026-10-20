import type { VercelRequest, VercelResponse } from "@vercel/node";
import { method, route } from "./_lib/auth.js";
import { q } from "./_lib/db.js";

const esc = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const pregText = (p: Record<string, unknown> | null) =>
  p ? Object.entries(p).map(([k, v]) => `${k}=${v}`).join("; ") : null;

/** GET /api/export → one CSV row per day with the day's log and its LH readings. */
export default route(async (req: VercelRequest, res: VercelResponse) => {
  method(req, "GET");
  const { rows } = await q(`
    WITH lh AS (
      SELECT date, string_agg(COALESCE(ratio::text, '') || ' ' || level, ' | ' ORDER BY id) AS lh
      FROM lh_tests GROUP BY date)
    SELECT COALESCE(d.date, lh.date) AS date, d.flow, d.intercourse, lh.lh, d.cervical_mucus, d.bbt,
           d.pregnancy_test, d.symptoms, d.mood, d.notes, d.preg, d.source
    FROM day_logs d FULL OUTER JOIN lh ON lh.date = d.date
    ORDER BY 1`);
  const header = ["date", "flow", "intercourse", "lh", "cervical_mucus", "bbt", "pregnancy_test", "symptoms", "mood", "notes", "pregnancy_log", "source"];
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => esc(h === "pregnancy_log" ? pregText(r.preg) : r[h])).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bloom-export.csv"`);
  return res.status(200).send(csv);
}, { roles: ["me"] });
