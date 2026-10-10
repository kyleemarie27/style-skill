import { isISODate } from "../../shared/dates.js";
import type { DayLog, LhTest } from "../../shared/types.js";
import { HttpError } from "./db.js";

const FLOWS = ["none", "spotting", "light", "medium", "heavy"];
const MUCUS = ["dry", "sticky", "creamy", "watery", "egg_white"];
const PREG = ["negative", "positive", "faint"];
const LEVELS = ["low", "high", "peak"];

const oneOf = (v: unknown, xs: string[]) => (typeof v === "string" && xs.includes(v) ? v : null);
const num = (v: unknown, min: number, max: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return v === null || v === undefined || v === "" || !Number.isFinite(n) || n < min || n > max ? null : n;
};
const str = (v: unknown, max = 2000) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Validate and normalize a day log coming from the browser or an import. */
export function cleanDayLog(raw: any): DayLog {
  if (!raw || !isISODate(raw.date)) throw new HttpError(400, "Each day needs a valid date.");
  return {
    date: raw.date,
    flow: oneOf(raw.flow, FLOWS) as DayLog["flow"],
    intercourse: typeof raw.intercourse === "boolean" ? raw.intercourse : null,
    symptoms: Array.isArray(raw.symptoms) ? raw.symptoms.map((s: unknown) => str(s, 80)).filter(Boolean).slice(0, 40) : null,
    mood: str(raw.mood, 200),
    cervical_mucus: oneOf(raw.cervical_mucus, MUCUS) as DayLog["cervical_mucus"],
    bbt: num(raw.bbt, 30, 110),
    pregnancy_test: oneOf(raw.pregnancy_test, PREG) as DayLog["pregnancy_test"],
    ovulation: typeof raw.ovulation === "boolean" ? raw.ovulation : null,
    notes: str(raw.notes),
  };
}

export function cleanLhTest(raw: any): LhTest {
  if (!raw || !isISODate(raw.date)) throw new HttpError(400, "Each LH test needs a valid date.");
  const level = oneOf(raw.level, LEVELS) as LhTest["level"] | null;
  if (!level) throw new HttpError(400, "LH level must be low, high or peak.");
  return {
    date: raw.date,
    taken_at: str(raw.taken_at, 40),
    ratio: num(raw.ratio, 0, 5),
    level,
    ai_ratio: num(raw.ai_ratio, 0, 5),
    ai_level: oneOf(raw.ai_level, LEVELS) as LhTest["level"] | null,
  };
}

export const DAY_COLS =
  "date, flow, intercourse, symptoms, mood, cervical_mucus, bbt, pregnancy_test, notes, ovulation, source";
export const LH_COLS = "id, date, taken_at, ratio, level, ai_ratio, ai_level, (photo IS NOT NULL) AS has_photo, source";
