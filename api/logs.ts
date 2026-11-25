import type { VercelRequest, VercelResponse } from "@vercel/node";
import { method, requireRole, route } from "./_lib/auth.js";
import { HttpError, q } from "./_lib/db.js";
import { isISODate } from "../shared/dates.js";
import { authorizeUrl, disconnectOura, finishConnect, ouraStatus, syncOura } from "./_lib/oura.js";
import { cleanDayLog, DAY_COLS, LH_COLS } from "./_lib/rows.js";

/**
 * GET  /api/logs            → every day log + LH test + wearable night (small enough for one person's history)
 * PUT  /api/logs  {log}     → save one day as entered by hand (replaces that day's fields)
 *
 * Oura lives here too (Vercel rewrites /api/oura/<step> to /api/logs?oura=<step>):
 *   GET    connect   → off to Oura's sign-in
 *   GET    callback  → back from Oura; saves tokens, pulls 90 nights, returns to Settings
 *   POST   sync      → pull the last 10 nights now
 *   DELETE disconnect
 *   GET    cron      → the daily Vercel cron job (needs CRON_SECRET)
 */
const main = route(async (req: VercelRequest, res: VercelResponse) => {
  if (req.query.oura) return oura(req, res, String(req.query.oura));
  if (req.query.evidence) return evidence(req);
  if (req.query.labs) return labs(req);
  const m = method(req, "GET", "PUT");
  if (m === "GET") {
    const [days, lh, nights, status, ev, lab] = await Promise.all([
      q(`SELECT ${DAY_COLS} FROM day_logs ORDER BY date`),
      q(`SELECT ${LH_COLS} FROM lh_tests ORDER BY date, id`),
      q(`SELECT date, temp_dev AS "tempDev", rhr, hrv FROM wearable_days WHERE date > now() - interval '400 days' ORDER BY date`),
      ouraStatus(req),
      q("SELECT id, date, kind, text, source, created_at AS \"createdAt\" FROM evidence ORDER BY date DESC, id DESC"),
      q(`SELECT id, date, panel, test, value_num AS "valueNum", value_text AS "valueText", unit, ref_low AS "refLow", ref_high AS "refHigh", flag, status, source FROM lab_results ORDER BY date, test`),
    ]);
    return { dayLogs: days.rows, lhTests: lh.rows, wearable: nights.rows, oura: status, evidence: ev.rows, labs: lab.rows };
  }
  await requireRole(req, "me");
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

function redirect(res: VercelResponse, to: string) {
  res.statusCode = 302;
  res.setHeader("Location", to);
  res.end();
}

async function oura(req: VercelRequest, res: VercelResponse, step: string) {
  await requireRole(req, "me");
  if (step === "connect") {
    method(req, "GET");
    return redirect(res, await authorizeUrl(req));
  }
  if (step === "callback") {
    method(req, "GET");
    try {
      if (req.query.error) throw new HttpError(400, req.query.error === "access_denied" ? "You cancelled the Oura sign-in." : `Oura said: ${req.query.error}`);
      await finishConnect(req, req.query.code, req.query.state);
      return redirect(res, "/#/settings/oura-connected");
    } catch (e) {
      return redirect(res, `/#/settings/oura-failed/${encodeURIComponent((e as Error).message.slice(0, 160))}`);
    }
  }
  if (step === "sync") {
    method(req, "POST");
    const saved = await syncOura(10);
    return { saved, oura: await ouraStatus(req) };
  }
  if (step === "disconnect") {
    method(req, "DELETE");
    await disconnectOura();
    return { oura: await ouraStatus(req) };
  }
  throw new HttpError(404, "Not found");
}

/** Vercel's cron job sends "Authorization: Bearer $CRON_SECRET". Without the secret set, the cron does nothing. */
const cron = route(
  async (req: VercelRequest) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) throw new HttpError(401, "Not allowed.");
    return { saved: await syncOura(10) };
  },
  { public: true },
);

export default function handler(req: VercelRequest, res: VercelResponse) {
  return req.query.oura === "cron" ? cron(req, res) : main(req, res);
}

const str = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);
const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * Evidence: notes, dated observations and outside analyses that inform the prediction.
 *   POST   ?evidence=1 {items: [{date, kind, text, data?}]}   add (kind: note | event | analysis)
 *   DELETE ?evidence=1&id=…
 */
async function evidence(req: VercelRequest) {
  await requireRole(req, "me");
  const m = method(req, "POST", "DELETE");
  if (m === "DELETE") {
    await q("DELETE FROM evidence WHERE id=$1", [Number(req.query.id)]);
    return { ok: true };
  }
  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 200) : [];
  let n = 0;
  for (const it of items) {
    const text = str(it?.text, 2000);
    if (!isISODate(it?.date) || !text) continue;
    const kind = ["note", "event", "analysis"].includes(it.kind) ? it.kind : "note";
    await q("INSERT INTO evidence (date, kind, text, data, source) VALUES ($1,$2,$3,$4,$5)", [it.date, kind, text, it.data ? JSON.stringify(it.data) : null, str(it.source, 40) ?? "manual"]);
    n++;
  }
  return { saved: n };
}

/**
 * Lab results, saved only after she's reviewed them.
 *   POST   ?labs=1 {results: [{date, panel, test, value, unit, refLow, refHigh, flag, status}], source}
 *          A row for the same date and test replaces the earlier one (so a final result replaces "pending").
 *   DELETE ?labs=1&id=…
 */
async function labs(req: VercelRequest) {
  await requireRole(req, "me");
  const m = method(req, "POST", "DELETE");
  if (m === "DELETE") {
    await q("DELETE FROM lab_results WHERE id=$1", [Number(req.query.id)]);
    return { ok: true };
  }
  const rows = Array.isArray(req.body?.results) ? req.body.results.slice(0, 400) : [];
  const source = str(req.body?.source, 40) ?? "manual";
  let n = 0;
  for (const r of rows) {
    const test = str(r?.test, 120);
    if (!isISODate(r?.date) || !test) continue;
    const vNum = typeof r.value === "number" ? r.value : num(r.valueNum ?? (typeof r.value === "string" && /^[<>]?\s*-?\d+(\.\d+)?$/.test(r.value.trim()) ? r.value.replace(/[<>\s]/g, "") : null));
    const vText = vNum === null || (typeof r.value === "string" && /[<>]/.test(r.value)) ? str(typeof r.value === "string" ? r.value : r.valueText, 120) : null;
    const status = r.status === "pending" ? "pending" : "final";
    await q(
      `INSERT INTO lab_results (date, panel, test, value_num, value_text, unit, ref_low, ref_high, flag, status, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (date, test) DO UPDATE SET panel=$2, value_num=$4, value_text=$5, unit=$6, ref_low=$7, ref_high=$8, flag=$9, status=$10, source=$11, created_at=now()`,
      [r.date, str(r.panel, 60), test, vNum, vText, str(r.unit, 40), num(r.refLow), num(r.refHigh), ["low", "high"].includes(r.flag) ? r.flag : null, status, source],
    );
    n++;
  }
  return { saved: n };
}
