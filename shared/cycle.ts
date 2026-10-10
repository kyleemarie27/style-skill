import { addDays, diffDays } from "./dates.js";
import type { DayLog, LhTest, Settings } from "./types.js";

/**
 * The cycle engine. Pure functions only, so the browser and the API share them.
 *
 * Rules:
 * - A period day is a day with light/medium/heavy flow. Spotting counts as bleeding for
 *   period *length*, but never starts a new cycle on its own.
 * - A new cycle starts on a period day when there was no period day in the previous 10 days.
 * - Ovulation = first LH Peak in the cycle + 1 day. Without a Peak it's predicted as
 *   (next period − luteal length).
 * - Fertile window = ovulation − 5 … ovulation + 1.
 */

export type Phase =
  | "menstrual"
  | "follicular"
  | "fertile"
  | "ovulation"
  | "tww_early"
  | "tww_mid"
  | "tww_late"
  | "late"
  | "unknown";

export const PHASE_NAME: Record<Phase, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  fertile: "Fertile window",
  ovulation: "Ovulation",
  tww_early: "Two-week wait",
  tww_mid: "Two-week wait",
  tww_late: "Two-week wait",
  late: "Period due",
  unknown: "Getting started",
};

export interface Cycle {
  start: string;
  /** Last day of this cycle (day before next start), or null if it's the current one. */
  end: string | null;
  length: number | null;
  /** Last bleeding day of the period that opened this cycle. */
  periodEnd: string;
  /** First LH Peak date in this cycle, if any. */
  lhPeak: string | null;
  /** Ovulation date: LH-confirmed if lhPeak, else estimated. */
  ovulation: string;
  ovulationConfirmed: boolean;
}

export interface CycleModel {
  cycles: Cycle[];
  avgCycleLength: number;
  avgLutealLength: number;
  avgPeriodLength: number;
  /** cycle-day of ovulation averaged over cycles with an LH peak (null if none). */
  typicalOvulationDay: number | null;
  cycleLengthSamples: number;
  settings: Settings;
}

export interface Today {
  date: string;
  phase: Phase;
  cycleDay: number | null;
  cycle: Cycle | null;
  fertileStart: string | null;
  fertileEnd: string | null;
  ovulation: string | null;
  ovulationConfirmed: boolean;
  nextPeriod: string | null;
  /** Days past ovulation (≥1 once ovulation has passed). */
  dpo: number | null;
  /** Suggested first pregnancy-test date (12 DPO). */
  testDate: string | null;
  /** 1-based day within the fertile window, and its length. */
  fertileDay: number | null;
  fertileLength: number;
  daysUntilOvulation: number | null;
  daysUntilPeriod: number | null;
}

const BLEED = new Set(["light", "medium", "heavy"]);
const ANY_BLEED = new Set(["spotting", "light", "medium", "heavy"]);
const NEW_CYCLE_GAP = 10;
const FERTILE_BEFORE = 5;
const FERTILE_AFTER = 1;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function findPeriodStarts(logs: DayLog[]): string[] {
  const bleedDays = logs
    .filter((l) => l.flow && BLEED.has(l.flow))
    .map((l) => l.date)
    .sort();
  const starts: string[] = [];
  let last: string | null = null;
  for (const d of bleedDays) {
    if (last === null || diffDays(d, last) > NEW_CYCLE_GAP) starts.push(d);
    last = d;
  }
  return starts;
}

/** Last day of the bleeding run starting at `start` (allows one-day gaps, includes spotting). */
function periodEndFrom(start: string, bleedSet: Set<string>, limit: string | null): string {
  let end = start;
  let cursor = start;
  for (let i = 0; i < 14; i++) {
    const next1 = addDays(cursor, 1);
    const next2 = addDays(cursor, 2);
    if (limit && next1 > limit) break;
    if (bleedSet.has(next1)) cursor = next1;
    else if (bleedSet.has(next2) && (!limit || next2 <= limit)) cursor = next2;
    else break;
    end = cursor;
  }
  return end;
}

export function buildModel(logs: DayLog[], lhTests: LhTest[], settings: Settings): CycleModel {
  const starts = findPeriodStarts(logs);
  const bleedSet = new Set(logs.filter((l) => l.flow && ANY_BLEED.has(l.flow)).map((l) => l.date));
  const peaks = lhTests
    .filter((t) => t.level === "peak")
    .map((t) => t.date)
    .sort();

  // First pass: raw cycles with lengths and LH peaks.
  const raw = starts.map((start, i) => {
    const nextStart = starts[i + 1] ?? null;
    const end = nextStart ? addDays(nextStart, -1) : null;
    const length = nextStart ? diffDays(nextStart, start) : null;
    const periodEnd = periodEndFrom(start, bleedSet, end);
    const lhPeak =
      peaks.find((p) => p > periodEnd && (end === null || p <= end)) ?? null;
    return { start, end, length, periodEnd, lhPeak };
  });

  const plausible = raw
    .map((c) => c.length)
    .filter((l): l is number => l !== null && l >= 18 && l <= 50);
  const recent = plausible.slice(-6);
  const avgCycleLength = recent.length ? Math.round(mean(recent)) : settings.cycleLength;

  const lutealSamples = raw
    .filter((c) => c.lhPeak && c.length)
    .map((c) => diffDays(addDays(c.start, c.length!), addDays(c.lhPeak!, 1)))
    .filter((l) => l >= 7 && l <= 18)
    .slice(-6);
  const avgLutealLength =
    lutealSamples.length >= 2 ? Math.round(mean(lutealSamples)) : settings.lutealLength;

  const periodLens = raw
    .filter((c) => c.end !== null)
    .map((c) => diffDays(c.periodEnd, c.start) + 1)
    .filter((l) => l >= 2 && l <= 10)
    .slice(-6);
  const avgPeriodLength = periodLens.length ? Math.round(mean(periodLens)) : settings.periodLength;

  const ovDays = raw
    .filter((c) => c.lhPeak)
    .map((c) => diffDays(addDays(c.lhPeak!, 1), c.start) + 1)
    .slice(-6);
  const typicalOvulationDay = ovDays.length ? Math.round(mean(ovDays)) : null;

  const cycles: Cycle[] = raw.map((c) => {
    const len = c.length ?? avgCycleLength;
    // Without an LH peak: completed cycles count back from the next period; the open cycle
    // uses the ovulation day learned from past LH peaks when there is one.
    const estDay = c.length === null && typicalOvulationDay ? typicalOvulationDay - 1 : len - avgLutealLength;
    const ovulation = c.lhPeak
      ? addDays(c.lhPeak, 1)
      : addDays(c.start, Math.max(estDay, diffDays(c.periodEnd, c.start) + 2));
    return { ...c, ovulation, ovulationConfirmed: !!c.lhPeak };
  });

  return {
    cycles,
    avgCycleLength,
    avgLutealLength,
    avgPeriodLength,
    typicalOvulationDay,
    cycleLengthSamples: recent.length,
    settings,
  };
}

function cycleFor(model: CycleModel, date: string): Cycle | null {
  for (let i = model.cycles.length - 1; i >= 0; i--) {
    if (model.cycles[i].start <= date) return model.cycles[i];
  }
  return null;
}

export function phaseFor(date: string, model: CycleModel): Today {
  const empty: Today = {
    date,
    phase: "unknown",
    cycleDay: null,
    cycle: null,
    fertileStart: null,
    fertileEnd: null,
    ovulation: null,
    ovulationConfirmed: false,
    nextPeriod: null,
    dpo: null,
    testDate: null,
    fertileDay: null,
    fertileLength: FERTILE_BEFORE + FERTILE_AFTER + 1,
    daysUntilOvulation: null,
    daysUntilPeriod: null,
  };
  const cycle = cycleFor(model, date);
  if (!cycle) return empty;
  // Too long since the last logged period to say anything sensible.
  if (cycle.end === null && diffDays(date, cycle.start) > model.avgCycleLength + 30) return empty;

  const cycleDay = diffDays(date, cycle.start) + 1;
  // For the current (open) cycle, the period may still be going: if the last bleed day is
  // today or yesterday, assume the period lasts at least the typical length.
  let periodEnd = cycle.periodEnd;
  if (cycle.end === null && diffDays(date, periodEnd) <= 1) {
    const typicalEnd = addDays(cycle.start, model.avgPeriodLength - 1);
    if (typicalEnd > periodEnd) periodEnd = typicalEnd;
  }

  const ovulation = cycle.ovulation;
  const fertileStart = addDays(ovulation, -FERTILE_BEFORE);
  const fertileEnd = addDays(ovulation, FERTILE_AFTER);
  const nextPeriod = cycle.end
    ? addDays(cycle.end, 1)
    : cycle.ovulationConfirmed
      ? addDays(ovulation, model.avgLutealLength)
      : addDays(cycle.start, model.avgCycleLength);
  const dpoRaw = diffDays(date, ovulation);
  const dpo = dpoRaw >= 1 ? dpoRaw : null;

  let phase: Phase;
  if (date <= periodEnd) phase = "menstrual";
  else if (date < fertileStart) phase = "follicular";
  else if (date < addDays(ovulation, -1)) phase = "fertile";
  else if (date <= ovulation) phase = "ovulation";
  else if (date >= nextPeriod) phase = "late";
  else if (dpoRaw <= 5) phase = "tww_early";
  else if (dpoRaw <= 9) phase = "tww_mid";
  else phase = "tww_late";

  const inFertile = date >= fertileStart && date <= fertileEnd;
  return {
    date,
    phase,
    cycleDay,
    cycle,
    fertileStart,
    fertileEnd,
    ovulation,
    ovulationConfirmed: cycle.ovulationConfirmed,
    nextPeriod,
    dpo,
    testDate: addDays(ovulation, 12),
    fertileDay: inFertile ? diffDays(date, fertileStart) + 1 : null,
    fertileLength: FERTILE_BEFORE + FERTILE_AFTER + 1,
    daysUntilOvulation: date < ovulation ? diffDays(ovulation, date) : null,
    daysUntilPeriod: date < nextPeriod ? diffDays(nextPeriod, date) : null,
  };
}

export type DayMark = {
  period?: boolean;
  predictedPeriod?: boolean;
  fertile?: boolean;
  ovulation?: boolean;
  ovulationConfirmed?: boolean;
};

/**
 * Marks for every day in [from, to]: past cycles use their own data, the current cycle uses
 * its estimate, and future cycles are projected with the average cycle length.
 */
export function timeline(model: CycleModel, logs: DayLog[], from: string, to: string): Map<string, DayMark> {
  const marks = new Map<string, DayMark>();
  const mark = (d: string, m: DayMark) => {
    if (d < from || d > to) return;
    marks.set(d, { ...marks.get(d), ...m });
  };
  for (const l of logs) if (l.flow && ANY_BLEED.has(l.flow)) mark(l.date, { period: true });

  for (const c of model.cycles) {
    for (let i = -FERTILE_BEFORE; i <= FERTILE_AFTER; i++) mark(addDays(c.ovulation, i), { fertile: true });
    mark(c.ovulation, { ovulation: true, ovulationConfirmed: c.ovulationConfirmed });
  }

  const last = model.cycles.at(-1);
  if (last) {
    const t = phaseFor(last.start, model);
    let start = t.nextPeriod!;
    for (let n = 0; n < 12 && start <= to; n++) {
      for (let i = 0; i < model.avgPeriodLength; i++) {
        const d = addDays(start, i);
        if (!marks.get(d)?.period) mark(d, { predictedPeriod: true });
      }
      const ov = addDays(start, model.typicalOvulationDay ? model.typicalOvulationDay - 1 : model.avgCycleLength - model.avgLutealLength);
      for (let i = -FERTILE_BEFORE; i <= FERTILE_AFTER; i++) mark(addDays(ov, i), { fertile: true });
      mark(ov, { ovulation: true });
      start = addDays(start, model.avgCycleLength);
    }
  }
  return marks;
}
