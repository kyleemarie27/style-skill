import { addDays, diffDays } from "./dates.js";

/**
 * Nightly numbers from a wearable (Oura today). One row per night, dated by the morning you woke up,
 * the same way a basal temperature taken on waking is dated.
 */
export interface WearableDay {
  date: string;
  /** Skin temperature vs. your own baseline, °C (Oura's temperature_deviation). */
  tempDev: number | null;
  /** Lowest resting heart rate in the night, bpm. */
  rhr: number | null;
  /** Average overnight HRV, ms. */
  hrv: number | null;
}

export interface ThermalShift {
  /** First of the nights that stayed high. */
  firstHigh: string;
  /** Ovulation is taken as the day before the first high night. */
  ovulation: string;
  /** How far above the earlier nights, °C (average of the high nights minus the baseline). */
  rise: number;
  /** The baseline the high nights were compared with (average of up to 6 earlier nights), °C. */
  baseline: number;
}

/** How far above the earlier nights each of the high nights must be. */
export const SHIFT_RISE = 0.2;
/** Nights in a row that must stay high. */
export const SHIFT_NIGHTS = 3;

/**
 * A sustained temperature rise: the wearable version of the basal temperature "three over six"
 * rule. Progesterone after ovulation lifts temperature by roughly 0.2–0.5 °C and keeps it up until
 * the period. Bloom looks for 3 nights in a row each at least 0.2 °C above the average of the 6
 * nights before them (at least 4 of those 6 must have data, and the 3 high nights can't be split by
 * a missing night). Only nights in [from, to] are searched, so a shift is found within one cycle.
 */
export function thermalShift(days: WearableDay[], from: string, to: string): ThermalShift | null {
  const nights = days
    .filter((d) => d.tempDev !== null && d.date >= addDays(from, -6) && d.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i + SHIFT_NIGHTS <= nights.length; i++) {
    const first = nights[i];
    if (first.date < from) continue;
    const high = nights.slice(i, i + SHIFT_NIGHTS);
    if (diffDays(high.at(-1)!.date, first.date) !== SHIFT_NIGHTS - 1) continue;
    const before = nights.filter((n) => n.date < first.date && n.date >= addDays(first.date, -6));
    if (before.length < 4) continue;
    const baseline = mean(before.map((n) => n.tempDev!));
    if (high.every((n) => n.tempDev! >= baseline + SHIFT_RISE)) {
      return {
        firstHigh: first.date,
        ovulation: addDays(first.date, -1),
        rise: round2(mean(high.map((n) => n.tempDev!)) - baseline),
        baseline: round2(baseline),
      };
    }
  }
  return null;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round2 = (n: number) => Math.round(n * 100) / 100;
