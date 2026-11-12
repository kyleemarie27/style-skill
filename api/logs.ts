import type { VercelRequest, VercelResponse } from "@vercel/node";
import { method, requireRole, route } from "./_lib/auth.js";
import { HttpError, q } from "./_lib/db.js";
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
  const m = method(req, "GET", "PUT");
  if (m === "GET") {
    const [days, lh, nights, status] = await Promise.all([
      q(`SELECT ${DAY_COLS} FROM day_logs ORDER BY date`),
      q(`SELECT ${LH_COLS} FROM lh_tests ORDER BY date, id`),
      q(`SELECT date, temp_dev AS "tempDev", rhr, hrv FROM wearable_days WHERE date > now() - interval '400 days' ORDER BY date`),
      ouraStatus(req),
    ]);
    return { dayLogs: days.rows, lhTests: lh.rows, wearable: nights.rows, oura: status };
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
