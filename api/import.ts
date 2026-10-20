import type { VercelRequest } from "@vercel/node";
import { method, route } from "./_lib/auth.js";
import { HttpError, q } from "./_lib/db.js";
import { cleanDayLog, cleanLhTest } from "./_lib/rows.js";

/**
 * GET    /api/import                       → past imports
 * POST   /api/import {source, dayLogs, lhTests} → save an import as one batch
 * DELETE /api/import?id=3                  → undo that batch
 *
 * Imports never overwrite anything already in Bloom: for days that exist, empty fields are
 * filled in, intercourse is OR-ed and symptoms are unioned. Undo removes the days and LH tests
 * that the import created.
 */
export default route(async (req: VercelRequest) => {
  const m = method(req, "GET", "POST", "DELETE");

  if (m === "GET") {
    const { rows } = await q("SELECT id, source, created_at, counts FROM import_batches ORDER BY created_at DESC");
    return { batches: rows };
  }

  if (m === "DELETE") {
    const id = Number(req.query.id);
    if (!id) throw new HttpError(400, "Missing id");
    await q("DELETE FROM day_logs WHERE batch_id=$1", [id]);
    await q("DELETE FROM import_batches WHERE id=$1", [id]); // cascades to lh_tests
    await q("DELETE FROM daily_notes"); // cached notes may describe the old data
    return { ok: true };
  }

  const source = String(req.body?.source ?? "import").slice(0, 40);
  const dayLogs = (Array.isArray(req.body?.dayLogs) ? req.body.dayLogs : []).map(cleanDayLog);
  const lhTests = (Array.isArray(req.body?.lhTests) ? req.body.lhTests : []).map(cleanLhTest);
  if (!dayLogs.length && !lhTests.length) throw new HttpError(400, "Nothing to import.");
  if (dayLogs.length > 20000 || lhTests.length > 20000) throw new HttpError(413, "That's more data than expected. Try a smaller export.");

  const batch = await q<{ id: number }>("INSERT INTO import_batches (source) VALUES ($1) RETURNING id", [source]);
  const batchId = batch.rows[0].id;

  const days = await q<{ inserted: boolean }>(
    `INSERT INTO day_logs AS d (date, flow, intercourse, symptoms, mood, cervical_mucus, bbt, pregnancy_test, notes, ovulation, source, batch_id)
     SELECT r.date, r.flow, r.intercourse, r.symptoms, r.mood, r.cervical_mucus, r.bbt, r.pregnancy_test, r.notes, r.ovulation, $2, $3
     FROM jsonb_to_recordset($1::jsonb) AS r(
       date date, flow text, intercourse boolean, symptoms text[], mood text,
       cervical_mucus text, bbt numeric, pregnancy_test text, notes text, ovulation boolean)
     ON CONFLICT (date) DO UPDATE SET
       flow = COALESCE(d.flow, EXCLUDED.flow),
       intercourse = CASE WHEN d.intercourse OR EXCLUDED.intercourse THEN true ELSE COALESCE(d.intercourse, EXCLUDED.intercourse) END,
       symptoms = CASE WHEN d.symptoms IS NULL THEN EXCLUDED.symptoms
                       WHEN EXCLUDED.symptoms IS NULL THEN d.symptoms
                       ELSE ARRAY(SELECT DISTINCT unnest(d.symptoms || EXCLUDED.symptoms)) END,
       mood = COALESCE(d.mood, EXCLUDED.mood),
       cervical_mucus = COALESCE(d.cervical_mucus, EXCLUDED.cervical_mucus),
       bbt = COALESCE(d.bbt, EXCLUDED.bbt),
       pregnancy_test = COALESCE(d.pregnancy_test, EXCLUDED.pregnancy_test),
       notes = COALESCE(d.notes, EXCLUDED.notes),
       ovulation = COALESCE(d.ovulation, EXCLUDED.ovulation),
       updated_at = now()
     RETURNING (xmax = 0) AS inserted`,
    [JSON.stringify(dayLogs.map(toSqlJson)), source, batchId],
  );

  const lh = await q(
    `INSERT INTO lh_tests (date, taken_at, ratio, level, source, batch_id)
     SELECT r.date, r.taken_at, r.ratio, r.level, $2, $3
     FROM jsonb_to_recordset($1::jsonb) AS r(date date, taken_at text, ratio numeric, level text)
     WHERE NOT EXISTS (
       SELECT 1 FROM lh_tests t
       WHERE t.date = r.date AND t.ratio IS NOT DISTINCT FROM r.ratio
         -- The same reading exported twice (e.g. Premom's chart CSV and its full export) writes the time
         -- differently, so a numeric reading on the same day counts as a duplicate whatever its time.
         AND (r.ratio IS NOT NULL OR (t.level = r.level AND t.taken_at IS NOT DISTINCT FROM r.taken_at)))`,
    [JSON.stringify(lhTests), source, batchId],
  );

  const counts = {
    newDays: days.rows.filter((r) => r.inserted).length,
    mergedDays: days.rows.filter((r) => !r.inserted).length,
    lhTests: lh.rowCount ?? 0,
  };
  await q("UPDATE import_batches SET counts=$2 WHERE id=$1", [batchId, JSON.stringify(counts)]);
  await q("DELETE FROM daily_notes");
  return { batchId, counts };
}, { roles: ["me"] });

// jsonb_to_recordset wants JSON arrays for text[] columns, which JSON.stringify already gives us.
function toSqlJson(d: ReturnType<typeof cleanDayLog>) {
  return { ...d, symptoms: d.symptoms?.length ? d.symptoms : null };
}
