import type { VercelRequest } from "@vercel/node";
import { isISODate } from "../shared/dates.js";
import { DEFAULT_SETTINGS, type Settings } from "../shared/types.js";
import { method, route } from "./_lib/auth.js";
import { q } from "./_lib/db.js";

const clamp = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d;
};

export default route(async (req: VercelRequest) => {
  const m = method(req, "GET", "PUT");
  if (m === "PUT") {
    const b = req.body?.settings ?? {};
    const s: Settings = {
      cycleLength: clamp(b.cycleLength, 20, 45, DEFAULT_SETTINGS.cycleLength),
      lutealLength: clamp(b.lutealLength, 9, 17, DEFAULT_SETTINGS.lutealLength),
      periodLength: clamp(b.periodLength, 2, 10, DEFAULT_SETTINGS.periodLength),
      ttc: b.ttc !== false,
      ttcSince: isISODate(b.ttcSince) ? b.ttcSince : null,
      over35: b.over35 === true,
    };
    await q(
      "INSERT INTO settings (key, value) VALUES ('main', $1) ON CONFLICT (key) DO UPDATE SET value=$1",
      [JSON.stringify(s)],
    );
    return { settings: s };
  }
  const { rows } = await q<{ value: Settings }>("SELECT value FROM settings WHERE key='main'");
  return { settings: { ...DEFAULT_SETTINGS, ...(rows[0]?.value ?? {}) } };
});
