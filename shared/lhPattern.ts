import { addDays, diffDays } from "./dates.js";
import { LH_BANDS } from "./lh.js";
import type { LhTest } from "./types.js";

/**
 * Reading LH relative to your own baseline, the way clinics read it, instead of only by the strip's
 * fixed Peak line (T/C ≥ 1.0). Plenty of people ovulate without ever testing at Peak: their surge
 * shows as readings well above their own quiet days. Bloom calls it a surge when readings reach
 * about twice your baseline (or an actual Peak), takes the highest day of that run as the surge
 * day, and the first reading back below the line as the day it ended.
 */
export interface LhPoint {
  date: string;
  value: number;
}

export interface LhSurge {
  /** First day at or above the surge line. */
  start: string;
  /** The highest day of the run: ovulation usually follows within about a day. */
  top: string;
  topValue: number;
  /** First reading back below the line, or null while it's still up. */
  end: string | null;
  /** "peak" when it reached the strip's Peak line, "relative" when it only stood out against your baseline. */
  kind: "peak" | "relative";
}

export interface LhPattern {
  points: LhPoint[];
  /** Your quiet level: the middle of your lower readings. Null with fewer than 3 readings. */
  baseline: number | null;
  /** The surge line: about 2× baseline, never below 0.4. Null without a baseline. */
  threshold: number | null;
  surges: LhSurge[];
}

/** How many times your baseline counts as a surge. */
export const RELATIVE_SURGE = 2;
/** The surge line never sits below this, so a very low baseline doesn't turn noise into a surge. */
const MIN_SURGE = 0.4;
/** Readings this close together are one surge. */
const SAME_SURGE_DAYS = 2;
/** Without a test soon after, assume a surge faded within this many days of its top. */
const ASSUMED_FADE_DAYS = 3;

export const lhValue = (t: LhTest) => t.ratio ?? (t.level === "peak" ? 1.1 : t.level === "high" ? 0.7 : 0.2);

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function lhPattern(tests: LhTest[]): LhPattern {
  // One value per day: the highest reading that day.
  const byDay = new Map<string, number>();
  for (const t of tests) byDay.set(t.date, Math.max(byDay.get(t.date) ?? 0, lhValue(t)));
  const points = [...byDay.entries()].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));

  let baseline: number | null = null;
  let threshold: number | null = null;
  if (points.length >= 3) {
    const lower = [...points.map((p) => p.value)].sort((a, b) => a - b).slice(0, Math.ceil(points.length / 2));
    baseline = Math.round(median(lower) * 100) / 100;
    threshold = Math.round(Math.max(baseline * RELATIVE_SURGE, baseline + 0.25, MIN_SURGE) * 100) / 100;
  }
  const high = (p: LhPoint) => p.value >= LH_BANDS.peak || (threshold !== null && p.value >= threshold);

  const surges: LhSurge[] = [];
  let run: LhPoint[] = [];
  const close = (next: LhPoint | null) => {
    if (!run.length) return;
    const top = run.reduce((a, b) => (b.value > a.value ? b : a));
    const last = run.at(-1)!;
    // The first reading back down, if it came soon enough to tell; otherwise assume it faded in a few days.
    const end = next ? (diffDays(next.date, last.date) <= ASSUMED_FADE_DAYS + 1 ? next.date : addDays(last.date, ASSUMED_FADE_DAYS)) : null;
    surges.push({ start: run[0].date, top: top.date, topValue: top.value, end, kind: top.value >= LH_BANDS.peak ? "peak" : "relative" });
    run = [];
  };
  for (const p of points) {
    if (high(p)) {
      if (run.length && diffDays(p.date, run.at(-1)!.date) > SAME_SURGE_DAYS) close(null);
      run.push(p);
    } else if (run.length) close(p);
  }
  // Still up at the last reading: the surge hasn't ended (or there's no reading since).
  if (run.length) close(null);
  // A run closed by a later surge (not by a low reading) still needs an end: assume it faded.
  for (const s of surges) {
    if (s.end === null && surges.at(-1) !== s) s.end = addDays(s.top, ASSUMED_FADE_DAYS);
  }
  return { points, baseline, threshold, surges };
}

/** How a reading compares with your baseline, e.g. 3.1. Null without a baseline. */
export function timesBaseline(value: number, baseline: number | null): number | null {
  return baseline && baseline > 0 ? Math.round((value / baseline) * 10) / 10 : null;
}
