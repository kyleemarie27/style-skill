import type { VercelRequest, VercelResponse } from "@vercel/node";
import { method, requireRole, route } from "./_lib/auth.js";
import { HttpError, q } from "./_lib/db.js";
import { cleanLhTest, LH_COLS } from "./_lib/rows.js";

const MAX_PHOTO_BYTES = 1_500_000;

/**
 * POST   /api/lh {test, photo?, hash?, taps?}   save a confirmed LH reading (photo = base64 JPEG, already resized)
 * GET    /api/lh?hash=…           the saved reading for this exact photo, if any
 * GET    /api/lh?id=1&photo=1     the strip photo
 * DELETE /api/lh?id=1
 */
export default route(async (req: VercelRequest, res: VercelResponse) => {
  const m = method(req, "GET", "POST", "DELETE");
  if (m !== "GET") await requireRole(req, "me");
  const id = Number(req.query.id);
  if (m === "GET" && typeof req.query.hash === "string") {
    // Seen this exact photo before? Return that reading, so the same photo never gets two answers.
    const { rows } = await q("SELECT date, ratio, level, ai_ratio, taps FROM lh_tests WHERE photo_hash=$1 ORDER BY id DESC LIMIT 1", [req.query.hash.slice(0, 64)]);
    return { match: rows[0] ?? null };
  }
  if (m === "GET") {
    if (!id) throw new HttpError(400, "Missing id");
    const { rows } = await q<{ photo: Buffer | null }>("SELECT photo FROM lh_tests WHERE id=$1", [id]);
    if (!rows[0]?.photo) throw new HttpError(404, "No photo");
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    return res.status(200).send(rows[0].photo);
  }
  if (m === "DELETE") {
    if (!id) throw new HttpError(400, "Missing id");
    await q("DELETE FROM lh_tests WHERE id=$1", [id]);
    return { ok: true };
  }
  const t = cleanLhTest(req.body?.test);
  let photo: Buffer | null = null;
  if (typeof req.body?.photo === "string") {
    photo = Buffer.from(req.body.photo.replace(/^data:image\/\w+;base64,/, ""), "base64");
    if (photo.length > MAX_PHOTO_BYTES) throw new HttpError(413, "Photo is too large.");
  }
  const { rows } = await q(
    `INSERT INTO lh_tests (date, taken_at, ratio, level, ai_ratio, ai_level, photo, source, photo_hash, taps)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'manual',$8,$9) RETURNING ${LH_COLS}`,
    [t.date, t.taken_at ?? new Date().toISOString(), t.ratio, t.level, t.ai_ratio, t.ai_level, photo,
     typeof req.body?.hash === "string" ? req.body.hash.slice(0, 64) : null,
     req.body?.taps && typeof req.body.taps === "object" ? JSON.stringify(req.body.taps) : null],
  );
  return { test: rows[0] };
});
