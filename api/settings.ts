import type { VercelRequest } from "@vercel/node";
import { isISODate } from "../shared/dates.js";
import { DEFAULT_SETTINGS, type Pregnancy, type Settings } from "../shared/types.js";
import { method, route } from "./_lib/auth.js";
import { q } from "./_lib/db.js";

const clamp = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d;
};

const text = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const id = (v: unknown) => text(v, 40) ?? Math.random().toString(36).slice(2, 10);

/** Validate the pregnancy object; anything malformed becomes null (cycle mode). */
function cleanPregnancy(p: any): Pregnancy | null {
  if (!p || typeof p !== "object") return null;
  if (!isISODate(p.lmp) || !isISODate(p.dueDate) || !isISODate(p.positiveTestDate)) return null;
  const source = ["lmp", "ovulation", "doctor"].includes(p.dueDateSource) ? p.dueDateSource : "lmp";
  const ended =
    p.ended && isISODate(p.ended.date) && ["birth", "loss", "other"].includes(p.ended.reason)
      ? { date: p.ended.date, reason: p.ended.reason }
      : null;
  const questions = (Array.isArray(p.questions) ? p.questions : [])
    .filter((x: any) => text(x?.text))
    .slice(0, 200)
    .map((x: any) => ({
      id: id(x.id),
      text: text(x.text)!,
      created: isISODate(x.created) ? x.created : p.positiveTestDate,
      done: isISODate(x.done) ? x.done : null,
    }));
  const appointments = (Array.isArray(p.appointments) ? p.appointments : [])
    .filter((x: any) => isISODate(x?.date) && text(x?.title))
    .slice(0, 200)
    .map((x: any) => ({ id: id(x.id), date: x.date, title: text(x.title, 120)!, notes: text(x.notes) }));
  return {
    positiveTestDate: p.positiveTestDate, lmp: p.lmp, dueDate: p.dueDate, dueDateSource: source, ended, questions, appointments,
    momName: text(p.momName, 40), partnerName: text(p.partnerName, 40),
  };
}

export default route(async (req: VercelRequest) => {
  const m = method(req, "GET", "PUT");
  if (m === "PUT") {
    const b = req.body?.settings ?? {};
    const pregnancy = cleanPregnancy(b.pregnancy);
    const s: Settings = {
      cycleLength: clamp(b.cycleLength, 20, 45, DEFAULT_SETTINGS.cycleLength),
      lutealLength: clamp(b.lutealLength, 9, 17, DEFAULT_SETTINGS.lutealLength),
      periodLength: clamp(b.periodLength, 2, 10, DEFAULT_SETTINGS.periodLength),
      ttc: pregnancy && !pregnancy.ended ? false : b.ttc !== false,
      ttcSince: isISODate(b.ttcSince) ? b.ttcSince : null,
      over35: b.over35 === true,
      pregnancy,
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
