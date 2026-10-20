import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isISODate } from "../shared/dates.js";
import { getSession, method, route } from "./_lib/auth.js";
import { HttpError, q } from "./_lib/db.js";

const MAX_PHOTO_BYTES = 1_500_000;

const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const week = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 45 ? n : null;
};

/**
 * Keepsakes: answers to the daily question (one each per day, for both of you) and weekly bump photos.
 * Your partner's answer for a day only comes back once you've answered that day too; until then
 * it's returned as {date, author, locked: true}, with no question or answer.
 * GET    /api/memories?preg=YYYY-MM-DD           → {entries, photos} (photos without image data)
 * GET    /api/memories?preg=…&week=12            → that week's bump photo (JPEG)
 * PUT    /api/memories {entry: {date, prompt, answer}}   save your answer (empty answer deletes it)
 * POST   /api/memories {preg, week, date, photo}         save a bump photo (base64 JPEG, already resized)
 * DELETE /api/memories?preg=…&week=12            remove a bump photo
 */
export default route(async (req: VercelRequest, res: VercelResponse) => {
  const m = method(req, "GET", "PUT", "POST", "DELETE");
  const me = (await getSession(req))!.role;
  const preg = isISODate(req.query.preg) ? (req.query.preg as string) : null;

  if (m === "GET" && req.query.week !== undefined) {
    const w = week(req.query.week);
    if (!preg || !w) throw new HttpError(400, "Missing pregnancy or week");
    const { rows } = await q<{ photo: Buffer }>("SELECT photo FROM bump_photos WHERE preg=$1 AND week=$2", [preg, w]);
    if (!rows[0]) throw new HttpError(404, "No photo");
    res.setHeader("Content-Type", "image/jpeg");
    // The URL carries the photo's date, so a replaced photo gets a new URL.
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    return res.status(200).send(rows[0].photo);
  }
  if (m === "GET") {
    const [entries, photos] = await Promise.all([
      q<{ date: string; author: string; prompt: string; answer: string }>("SELECT date, author, prompt, answer FROM journal ORDER BY date DESC"),
      preg ? q("SELECT week, date FROM bump_photos WHERE preg=$1 ORDER BY week", [preg]) : Promise.resolve({ rows: [] }),
    ]);
    const answered = new Set(entries.rows.filter((e) => e.author === me).map((e) => e.date));
    return {
      entries: entries.rows.map((e) => (e.author === me || answered.has(e.date) ? e : { date: e.date, author: e.author, locked: true })),
      photos: photos.rows,
    };
  }
  if (m === "PUT") {
    const e = req.body?.entry;
    if (!e || !isISODate(e.date)) throw new HttpError(400, "Each answer needs a date.");
    const prompt = text(e.prompt, 500);
    const answer = text(e.answer, 10_000);
    if (!answer) {
      await q("DELETE FROM journal WHERE date=$1 AND author=$2", [e.date, me]);
      return { entry: null };
    }
    if (!prompt) throw new HttpError(400, "Missing the question.");
    const { rows } = await q(
      `INSERT INTO journal (date, author, prompt, answer, updated_at) VALUES ($1,$4,$2,$3,now())
       ON CONFLICT (date, author) DO UPDATE SET prompt=$2, answer=$3, updated_at=now() RETURNING date, author, prompt, answer`,
      [e.date, prompt, answer, me],
    );
    return { entry: rows[0] };
  }
  if (m === "DELETE") {
    const w = week(req.query.week);
    if (!preg || !w) throw new HttpError(400, "Missing pregnancy or week");
    await q("DELETE FROM bump_photos WHERE preg=$1 AND week=$2", [preg, w]);
    return { ok: true };
  }
  const b = req.body ?? {};
  const w = week(b.week);
  if (!isISODate(b.preg) || !w || !isISODate(b.date) || typeof b.photo !== "string") throw new HttpError(400, "Missing photo details.");
  const photo = Buffer.from(b.photo.replace(/^data:image\/\w+;base64,/, ""), "base64");
  if (photo.length > MAX_PHOTO_BYTES) throw new HttpError(413, "Photo is too large.");
  const { rows } = await q(
    `INSERT INTO bump_photos (preg, week, date, photo) VALUES ($1,$2,$3,$4)
     ON CONFLICT (preg, week) DO UPDATE SET date=$3, photo=$4, created_at=now() RETURNING week, date`,
    [b.preg, w, b.date, photo],
  );
  return { photo: rows[0] };
});
