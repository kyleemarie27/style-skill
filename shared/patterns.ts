import type { CycleModel, Today } from "./cycle.js";
import { addDays, diffDays } from "./dates.js";
import type { DayLog } from "./types.js";

export interface PatternTag {
  label: string;
  cycles: number;
  of: number;
}

export interface Pattern {
  /** Symptoms / moods you logged around this point in past cycles, most common first. */
  tags: PatternTag[];
  /** How many past cycles had any log around this point. */
  comparedCycles: number;
  /** Plain sentences about your timing ("You usually ovulate on day 15–17."). */
  facts: string[];
}

/**
 * "Your pattern": what you tended to log around this point in past cycles.
 * Before ovulation, cycles line up by cycle day; after it, by days until the next period
 * (so a long cycle doesn't shift the luteal comparison).
 */
export function patternFor(info: Today, model: CycleModel, logs: DayLog[]): Pattern {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const past = model.cycles.filter((c) => c.end !== null && info.cycle && c.start < info.cycle.start).slice(-12);
  const luteal = info.dpo !== null && info.daysUntilPeriod !== null;

  const counts = new Map<string, number>();
  let compared = 0;
  if (info.cycleDay) {
    for (const c of past) {
      const center = luteal ? addDays(c.end!, 1 - info.daysUntilPeriod!) : addDays(c.start, info.cycleDay - 1);
      const seen = new Set<string>();
      let any = false;
      for (let d = -1; d <= 1; d++) {
        const log = byDate.get(addDays(center, d));
        if (!log) continue;
        any = true;
        for (const s of log.symptoms ?? []) if (!/protected sex/i.test(s)) seen.add(s);
        for (const m of (log.mood ?? "").split(/,\s*/)) if (m && !/^(fine|ok|good)$/i.test(m)) seen.add(m);
      }
      if (any) compared++;
      for (const s of seen) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  const tags = [...counts]
    .filter(([, n]) => n >= 2 && n / Math.max(compared, 1) >= 0.25)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, n]) => ({ label, cycles: n, of: compared }));

  const facts: string[] = [];
  const ovDays = model.cycles
    .filter((c) => c.ovulationConfirmed)
    .slice(-6)
    .map((c) => diffDays(c.ovulation, c.start) + 1);
  if (ovDays.length >= 2) {
    const lo = Math.min(...ovDays);
    const hi = Math.max(...ovDays);
    facts.push(`You usually ovulate on cycle day ${lo === hi ? lo : `${lo}–${hi}`} (from ${ovDays.length} confirmed cycles).`);
  }
  if (info.phase === "menstrual") facts.push(`Your periods usually last about ${model.avgPeriodLength} days.`);
  if (luteal && model.avgLutealLength) facts.push(`Your period usually comes about ${model.avgLutealLength} days after ovulation.`);
  if (model.cycleLengthSamples >= 3) facts.push(`Your cycles average ${model.avgCycleLength} days.`);

  return { tags, comparedCycles: compared, facts };
}
