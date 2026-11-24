import { describe, expect, it } from "vitest";
import { buildModel, phaseFor } from "../shared/cycle";
import { addDays } from "../shared/dates";
import { DEFAULT_SETTINGS, type DayLog, type LhTest, type Settings } from "../shared/types";
import type { WearableDay } from "../shared/wearable";
import { focusFor, surgeNote } from "../src/lib/cycleToday";

const period = (start: string, days = 5): DayLog[] =>
  Array.from({ length: days }, (_, i) => ({ date: addDays(start, i), flow: i < 3 ? "medium" : "light" }));
/** Flat nights from `from` to `to`, optionally rising from `riseOn`. */
const nights = (from: string, to: string, riseOn: string | null = null): WearableDay[] => {
  const out: WearableDay[] = [];
  for (let d = from, i = 0; d <= to; d = addDays(d, 1), i++) out.push({ date: d, tempDev: (riseOn && d >= riseOn ? 0.4 : -0.1) + (i % 2 ? 0.04 : -0.04), rhr: 55, hrv: 60 });
  return out;
};

// Kylee's shape: 29-day cycles, a loss on Nov 1, a negative test Nov 8, an LH Peak Nov 9.
const settings: Settings = {
  ...DEFAULT_SETTINGS,
  pregnancy: { positiveTestDate: "2026-09-30", lmp: "2026-09-12", dueDate: "2027-06-19", dueDateSource: "lmp", ended: { date: "2026-11-01", reason: "loss" }, questions: [], appointments: [] },
};
const logs: DayLog[] = [...period("2026-07-16"), ...period("2026-08-14"), ...period("2026-09-12"), ...period("2026-11-01"), { date: "2026-11-08", pregnancy_test: "negative" }];
const peak: LhTest[] = [{ date: "2026-11-08", ratio: 0.3, level: "low" }, { date: "2026-11-09", ratio: 1.2, level: "peak" }];
const byDate = new Map(logs.map((l) => [l.date, l]));

describe("an LH surge is checked against temperature", () => {
  it("waits on the nights after a Peak before calling it ovulation", () => {
    const m = buildModel(logs, peak, settings, nights("2026-10-25", "2026-11-11"));
    const c = m.cycles.at(-1)!;
    expect(c).toMatchObject({ lhPeak: "2026-11-09", surgeStatus: "pending", ovulation: "2026-11-10" });
    const info = phaseFor("2026-11-12", m);
    expect(focusFor(info, m, peak, byDate, true).kind).toBe("confirming");
    expect(surgeNote(info)).toMatch(/5 nights/);
  });

  it("confirms it when the temperature rises", () => {
    const m = buildModel(logs, peak, settings, nights("2026-10-25", "2026-11-16", "2026-11-11"));
    expect(m.cycles.at(-1)).toMatchObject({ surgeStatus: "confirmed", ovulation: "2026-11-10", ovulationConfirmed: true });
  });

  it("calls it a surge without ovulation after 5 flat nights, and moves the estimate past the latest low strip", () => {
    const lows: LhTest[] = [...peak, { date: "2026-11-22", ratio: 0.12, level: "low" }, { date: "2026-11-24", ratio: 0.1, level: "low" }];
    const m = buildModel(logs, lows, settings, nights("2026-10-25", "2026-11-24"));
    const c = m.cycles.at(-1)!;
    expect(c.failedSurges).toEqual(["2026-11-09"]);
    expect(c.ovulationConfirmed).toBe(false);
    expect(c.ovulationDelayed).toBe(true);
    expect(c.ovulation >= "2026-11-26").toBe(true); // a low strip on the 24th: not before the 26th
    const info = phaseFor("2026-11-24", m);
    expect(info.phase.startsWith("tww")).toBe(false); // not stuck in a two-week wait that never started
    expect(focusFor(info, m, lows, byDate, true)).toMatchObject({ kind: "late-ov", counts: false });
    expect(info.nextPeriod! > "2026-12-05").toBe(true); // the period date moves with it
  });

  it("takes a second surge when the first came to nothing", () => {
    const two: LhTest[] = [...peak, { date: "2026-11-25", ratio: 1.3, level: "peak" }];
    const m = buildModel(logs, two, settings, nights("2026-10-25", "2026-11-26"));
    expect(m.cycles.at(-1)).toMatchObject({ failedSurges: ["2026-11-09"], lhPeak: "2026-11-25", surgeStatus: "pending", ovulation: "2026-11-26" });
  });

  it("keeps the old behavior without a wearable", () => {
    const m = buildModel(logs, peak, settings);
    expect(m.cycles.at(-1)).toMatchObject({ lhPeak: "2026-11-09", surgeStatus: null, failedSurges: [], ovulationConfirmed: true });
  });
});
