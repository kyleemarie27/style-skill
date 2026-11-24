import { addDays, diffDays } from "./dates.js";
import type { DayLog, LhTest, Settings } from "./types.js";
import { thermalShift, type ThermalShift, type WearableDay } from "./wearable.js";
import { lhPattern } from "./lhPattern.js";

/**
 * The cycle engine. Pure functions only, so the browser and the API share them.
 *
 * Rules:
 * - A period day is a day with light/medium/heavy flow. Spotting counts as bleeding for
 *   period *length*, but never starts a new cycle on its own.
 * - A new cycle starts on a period day when there was no period day in the previous 10 days.
 * - LH surges are read against the cycle's own baseline (about 2× your quiet readings, or a
 *   strip Peak), so a surge that never reaches Peak still counts. See lhPattern.ts.
 * - Ovulation = the surge's top day + 1. With wearable data, a surge only stands if the temperature rises
 *   within 5 days; after 5 flat nights it's a "surge without ovulation" and Bloom looks again.
 *   Without a Peak: a day marked as ovulation, then a sustained temperature rise (the day before
 *   the first high night), then a prediction: (next period − luteal length), or your usual day.
 * - The open cycle's prediction adapts: a low LH strip or a flat temperature means ovulation
 *   hasn't happened yet, so the estimate moves to the earliest day the data still allows. After a
 *   surge that sputtered out, the clock restarts: the next ovulation is expected 10–14 days after
 *   LH fell back (the gap from your usual ovulation day minus your period length).
 * - After a pregnancy loss, the day it ended starts a new cycle (unless a period was logged
 *   around then), and LH peaks in that first cycle only count after a negative pregnancy test:
 *   leftover hCG can turn LH strips positive.
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
  /** Ovulation date: from an LH peak, a day marked as ovulation (e.g. by Premom), a temperature shift, else estimated. */
  ovulation: string;
  ovulationConfirmed: boolean;
  ovulationSource: "lh" | "marked" | "temp" | "estimate";
  /** Sustained temperature rise from the wearable in this cycle, if any. Confirms ovulation happened. */
  tempShift: ThermalShift | null;
  /**
   * The cycle a pregnancy happened in (the one your positive test falls in). Its "length" is really
   * last period to the end of the pregnancy, so it's shown as a pregnancy and left out of cycle stats.
   */
  pregnancy: boolean;
  /** The cycle that starts when a pregnancy ended in a loss. Its first bleed is the loss, not a period. */
  firstAfterLoss: boolean;
  /**
   * With wearable data, an LH Peak is checked against temperature: "confirmed" when the rise follows
   * within 5 days, "pending" while Bloom is still waiting for those nights. Null without wearable data.
   */
  surgeStatus: "confirmed" | "pending" | null;
  /** LH Peaks with no temperature rise in the 5+ nights after: surges that likely didn't release an egg. */
  failedSurges: string[];
  /** The open cycle's estimate was moved later because the latest data shows ovulation hasn't happened yet. */
  ovulationDelayed: boolean;
  /** Your quiet LH level this cycle, and the surge line (about 2× it). Null with too few readings. */
  lhBaseline: number | null;
  lhThreshold: number | null;
  /** Whether the standing surge reached the strip's Peak line or only stood out against your baseline. */
  surgeKind: "peak" | "relative" | null;
  /**
   * After a surge that sputtered out, a new follicle takes about 10–14 days: the restart date
   * (when LH fell back), the likely day and the range. Null otherwise.
   */
  restart: { from: string; likely: string; earliest: string; latest: string } | null;
}

/** The first cycle after a pregnancy loss, while it's the current one. */
export interface AfterLoss {
  /** Day 1 of this cycle (the day the pregnancy ended, or the period logged around it). */
  start: string;
  /** First negative pregnancy test since, if any. LH strips are trusted from then on. */
  negativeTest: string | null;
  /** LH peaks Bloom set aside because they came before a negative test. */
  ignoredPeaks: string[];
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
  afterLoss: AfterLoss | null;
  /** Nightly wearable data, oldest first (empty without a connected wearable). */
  wearable: WearableDay[];
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
/** Nights after an LH Peak that Bloom waits for a temperature rise before calling it a surge without ovulation. */
export const VERIFY_NIGHTS = 5;
/** After a surge that fizzles, a new follicle takes about this long to grow and release (days). */
const RESTART_MIN = 10;
const RESTART_MAX = 14;
/** The rise has to start within this many days of the Peak to count as confirming it. */
const SURGE_TO_RISE = 5;
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

export function buildModel(logs: DayLog[], lhTests: LhTest[], settings: Settings, wearable: WearableDay[] = []): CycleModel {
  const starts = findPeriodStarts(logs);
  const bleedSet = new Set(logs.filter((l) => l.flow && ANY_BLEED.has(l.flow)).map((l) => l.date));
  let peaks = lhTests
    .filter((t) => t.level === "peak")
    .map((t) => t.date)
    .sort();

  // After a loss: the day it ended is day 1, unless a period start was logged close to it.
  const ended = settings.pregnancy?.ended;
  const loss = ended && ended.reason !== "birth" ? ended : null;
  let lossStart: string | null = null;
  if (loss) {
    const near = starts.find((d) => Math.abs(diffDays(d, loss.date)) <= 10);
    lossStart = near ?? loss.date;
    if (!near) {
      starts.push(loss.date);
      starts.sort();
      bleedSet.add(loss.date);
    }
  }
  // The cycle the pregnancy happened in: the one the positive test falls in (or that starts at the
  // last period Bloom has for it). It isn't a normal cycle, so it stays out of the averages.
  const preg = settings.pregnancy;
  const isPregCycle = (start: string, end: string | null) =>
    !!preg && ((start <= preg.positiveTestDate && (end === null || preg.positiveTestDate <= end)) || Math.abs(diffDays(start, preg.lmp)) <= 5);

  let afterLoss: AfterLoss | null = null;
  if (lossStart && starts.at(-1) === lossStart) {
    const negativeTest = logs.filter((l) => l.date >= lossStart! && l.pregnancy_test === "negative").map((l) => l.date).sort()[0] ?? null;
    const ignoredPeaks = peaks.filter((d) => d >= lossStart! && (!negativeTest || d < negativeTest));
    peaks = peaks.filter((d) => !ignoredPeaks.includes(d));
    afterLoss = { start: lossStart, negativeTest, ignoredPeaks };
  }
  const nights = [...wearable].sort((a, b) => a.date.localeCompare(b.date));
  const marked = logs
    .filter((l) => l.ovulation)
    .map((l) => l.date)
    .sort();

  // First pass: raw cycles with lengths and LH peaks.
  const raw = starts.map((start, i) => {
    const nextStart = starts[i + 1] ?? null;
    const end = nextStart ? addDays(nextStart, -1) : null;
    const length = nextStart ? diffDays(nextStart, start) : null;
    const periodEnd = periodEndFrom(start, bleedSet, end);
    const inCycle = (d: string) => d > periodEnd && (end === null || d <= end);
    const markedOv = marked.find(inCycle) ?? null;
    const tempShift = nights.length ? thermalShift(nights, addDays(periodEnd, 3), end ?? "9999-12-31") : null;
    // Surges, read against this cycle's own baseline (an actual Peak always counts). In the first
    // cycle after a loss, readings before a negative pregnancy test are left out: hCG can raise them.
    const lossCycle = afterLoss && start === afterLoss.start;
    const usable = lhTests.filter((t) => inCycle(t.date) && !(lossCycle && (!afterLoss!.negativeTest || t.date < afterLoss!.negativeTest)));
    const pattern = lhPattern(usable);
    const surgeList = pattern.surges;
    const surges = surgeList.map((x) => x.top);
    const nightsHere = nights.filter((n) => n.tempDev !== null && inCycle(n.date));
    const checkable = nightsHere.length >= 3;
    let lhPeak: string | null = null;
    let surgeStatus: Cycle["surgeStatus"] = null;
    const failedSurges: string[] = [];
    let lastFailedEnd: string | null = null;
    for (const sDay of surges) {
      if (tempShift && tempShift.firstHigh >= sDay && tempShift.firstHigh <= addDays(sDay, SURGE_TO_RISE)) {
        lhPeak = sDay;
        surgeStatus = "confirmed";
        break;
      }
      const after = nightsHere.filter((n) => n.date > addDays(sDay, 1) && n.date <= addDays(sDay, 1 + VERIFY_NIGHTS + 2)).length;
      if (checkable && after >= VERIFY_NIGHTS) {
        failedSurges.push(sDay);
        lastFailedEnd = surgeList.find((x) => x.top === sDay)?.end ?? addDays(sDay, 3);
      }
      else {
        lhPeak = sDay; // the latest surge still waiting on its nights
        surgeStatus = checkable ? "pending" : null;
      }
    }
    // A temperature rise with no surge before it still confirms ovulation.
    const tempOnly = !lhPeak && tempShift ? tempShift.ovulation : null;
    const knownOv = lhPeak ? addDays(lhPeak, 1) : (markedOv ?? tempOnly);
    const source = lhPeak ? ("lh" as const) : markedOv ? ("marked" as const) : tempOnly ? ("temp" as const) : null;
    // What the latest data says about the open cycle: ovulation can't be earlier than this.
    let notBefore: string | null = null;
    if (end === null && !knownOv) {
      // Below your surge line: at least 2 days away. At or above it: as soon as tomorrow.
      const last = pattern.points.at(-1);
      if (last) {
        const up = last.value >= 1 || (pattern.threshold !== null && last.value >= pattern.threshold);
        notBefore = addDays(last.date, up ? 1 : 2);
      }
      // Without a rise, ovulation can't be more than 2 nights before the last night (3 high nights confirm it).
      if (nightsHere.length >= 6) {
        const tFloor = addDays(nightsHere.at(-1)!.date, -2);
        if (!notBefore || tFloor > notBefore) notBefore = tFloor;
      }
      const failed = failedSurges.at(-1);
      if (failed && (!notBefore || addDays(failed, VERIFY_NIGHTS + 2) > notBefore)) notBefore = addDays(failed, VERIFY_NIGHTS + 2);
    }
    const surgeKind = lhPeak ? (surgeList.find((x) => x.top === lhPeak)?.kind ?? null) : null;
    return {
      start, end, length, periodEnd, lhPeak, knownOv, source, tempShift, surgeStatus, failedSurges, notBefore, lastFailedEnd, surgeKind,
      lhBaseline: pattern.baseline, lhThreshold: pattern.threshold,
    };
  });
  // Neither the cycle the pregnancy was in nor the first one after a loss counts toward your averages.
  const normal = raw.filter((c) => !isPregCycle(c.start, c.end) && c.start !== lossStart);

  const plausible = normal
    .map((c) => c.length)
    .filter((l): l is number => l !== null && l >= 18 && l <= 50);
  const recent = plausible.slice(-6);
  const avgCycleLength = recent.length ? Math.round(mean(recent)) : settings.cycleLength;

  const lutealSamples = normal
    .filter((c) => c.knownOv && c.length)
    .map((c) => diffDays(addDays(c.start, c.length!), c.knownOv!))
    .filter((l) => l >= 7 && l <= 18)
    .slice(-6);
  const avgLutealLength =
    lutealSamples.length >= 2 ? Math.round(mean(lutealSamples)) : settings.lutealLength;

  const periodLens = normal
    .filter((c) => c.end !== null)
    .map((c) => diffDays(c.periodEnd, c.start) + 1)
    .filter((l) => l >= 2 && l <= 10)
    .slice(-6);
  const avgPeriodLength = periodLens.length ? Math.round(mean(periodLens)) : settings.periodLength;

  const ovDays = normal
    .filter((c) => c.knownOv)
    .map((c) => diffDays(c.knownOv!, c.start) + 1)
    .slice(-6);
  const typicalOvulationDay = ovDays.length ? Math.round(mean(ovDays)) : null;

  const cycles: Cycle[] = raw.map((c) => {
    const len = c.length ?? avgCycleLength;
    // Without an LH peak: completed cycles count back from the next period; the open cycle
    // uses the ovulation day learned from past LH peaks when there is one.
    // A pregnancy cycle has no next period to count back from, so use your usual ovulation day.
    const pregnancy = isPregCycle(c.start, c.end);
    const usualDay = typicalOvulationDay ? typicalOvulationDay - 1 : avgCycleLength - avgLutealLength;
    const estDay = pregnancy || (c.length === null && typicalOvulationDay) ? usualDay : len - avgLutealLength;
    const estimate = c.knownOv ?? addDays(c.start, Math.max(estDay, diffDays(c.periodEnd, c.start) + 2));
    // After a sputtered surge the clock restarts: a new follicle takes 10–14 days from when LH fell
    // back, the exact gap from your own pattern (your usual ovulation day minus your period).
    let restart: Cycle["restart"] = null;
    let floor = c.notBefore;
    if (!c.knownOv && c.end === null && c.lastFailedEnd) {
      const usualOvDay = typicalOvulationDay ?? avgCycleLength - avgLutealLength + 1;
      const gap = Math.min(RESTART_MAX, Math.max(RESTART_MIN, usualOvDay - avgPeriodLength));
      const likely = addDays(c.lastFailedEnd, gap);
      restart = { from: c.lastFailedEnd, likely, earliest: addDays(c.lastFailedEnd, RESTART_MIN), latest: addDays(c.lastFailedEnd, RESTART_MAX) };
      if (!floor || likely > floor) floor = likely;
    }
    // Adaptive: when the latest LH strip or temperature says it hasn't happened yet, move it later.
    const ovulationDelayed = !c.knownOv && !!floor && floor > estimate;
    const ovulation = ovulationDelayed ? floor! : estimate;
    const { knownOv, source, notBefore: _nb, lastFailedEnd: _lf, ...rest } = c;
    return {
      ...rest,
      ovulation,
      ovulationDelayed,
      restart,
      // A surge still waiting on its temperature nights is expected, not confirmed.
      ovulationConfirmed: !!knownOv && c.surgeStatus !== "pending",
      ovulationSource: source ?? ("estimate" as const),
      pregnancy,
      firstAfterLoss: c.start === lossStart,
    };
  });

  return {
    cycles,
    avgCycleLength,
    avgLutealLength,
    avgPeriodLength,
    typicalOvulationDay,
    cycleLengthSamples: recent.length,
    settings,
    afterLoss,
    wearable: nights,
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
      : // Unconfirmed: your usual length, unless ovulation is running late, which pushes the period too.
        [addDays(cycle.start, model.avgCycleLength), addDays(ovulation, model.avgLutealLength)].sort().at(-1)!;
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
    // A pregnancy cycle only shows its fertile window when ovulation was actually confirmed.
    if (c.pregnancy && !c.ovulationConfirmed) continue;
    for (let i = -FERTILE_BEFORE; i <= FERTILE_AFTER; i++) mark(addDays(c.ovulation, i), { fertile: true });
    mark(c.ovulation, { ovulation: true, ovulationConfirmed: c.ovulationConfirmed });
  }

  // While pregnant there are no more periods or fertile windows to predict.
  const preg = model.settings.pregnancy;
  if (preg && !preg.ended) {
    for (const [d, m] of marks) {
      if (d > preg.lmp && (m.fertile || m.ovulation) && d > addDays(preg.lmp, 21)) marks.set(d, { period: m.period });
    }
    return marks;
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
