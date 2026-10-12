import type { VercelRequest } from "@vercel/node";
import { method, route } from "./_lib/auth.js";
import { q } from "./_lib/db.js";
import { cleanDayLog, DAY_COLS, LH_COLS } from "./_lib/rows.js";

/**
 * GET  /api/logs            → every day log + LH test (small enough for one person's history)
 * PUT  /api/logs  {log}     → save one day as entered by hand (replaces that day's fields)
 */
export default route(async (req: VercelRequest) => {
  const m = method(req, "GET", "PUT");
  if (m === "GET") {
    const [days, lh] = await Promise.all([
      q(`SELECT ${DAY_COLS} FROM day_logs ORDER BY date`),
      q(`SELECT ${LH_COLS} FROM lh_tests ORDER BY date, id`),
    ]);
    return { dayLogs: days.rows, lhTests: lh.rows };
  }
  const log = cleanDayLog(req.body?.log);
  const { rows } = await q(
    `INSERT INTO day_logs (date, flow, intercourse, symptoms, mood, cervical_mucus, bbt, pregnancy_test, notes, ovulation, preg, source, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'manual',now())
     ON CONFLICT (date) DO UPDATE SET
       flow=$2, intercourse=$3, symptoms=$4, mood=$5, cervical_mucus=$6, bbt=$7, pregnancy_test=$8, notes=$9, ovulation=$10, preg=$11,
       source='manual', batch_id=NULL, updated_at=now()
     RETURNING ${DAY_COLS}`,
    [log.date, log.flow, log.intercourse, log.symptoms, log.mood, log.cervical_mucus, log.bbt, log.pregnancy_test, log.notes, log.ovulation, log.preg ? JSON.stringify(log.preg) : null],
  );
  return { log: rows[0] };
});
