import { describe, expect, it } from "vitest";
import { buildModel, findPeriodStarts, phaseFor, timeline } from "../shared/cycle";
import { addDays } from "../shared/dates";
import { DEFAULT_SETTINGS, type DayLog, type LhTest } from "../shared/types";

function period(start: string, days = 5, flows = ["medium", "heavy", "medium", "light", "spotting"]): DayLog[] {
  return Array.from({ length: days }, (_, i) => ({
    date: addDays(start, i),
    flow: (flows[i] ?? "light") as DayLog["flow"],
  }));
}

describe("findPeriodStarts", () => {
  it("starts a cycle on the first bleeding day and ignores the rest of the same period", () => {
    const logs = [...period("2026-01-01"), ...period("2026-01-29")];
    expect(findPeriodStarts(logs)).toEqual(["2026-01-01", "2026-01-29"]);
  });

  it("does not start a cycle on spotting alone", () => {
    const logs: DayLog[] = [...period("2026-01-01"), { date: "2026-01-20", flow: "spotting" }];
    expect(findPeriodStarts(logs)).toEqual(["2026-01-01"]);
  });
});

describe("buildModel", () => {
  it("averages the last cycles and falls back to settings with no history", () => {
    const logs = [...period("2026-01-01"), ...period("2026-01-31"), ...period("2026-03-01")];
    const m = buildModel(logs, [], DEFAULT_SETTINGS);
    expect(m.cycles.map((c) => c.length)).toEqual([30, 29, null]);
    expect(m.avgCycleLength).toBe(30); // round(29.5)
    expect(buildModel([], [], DEFAULT_SETTINGS).avgCycleLength).toBe(28);
  });

  it("uses LH peak + 1 for ovulation and learns the luteal phase", () => {
    const logs = [...period("2026-01-01"), ...period("2026-01-29"), ...period("2026-02-26")];
    const lh: LhTest[] = [
      { date: "2026-01-13", ratio: 1.1, level: "peak" },
      { date: "2026-02-10", ratio: 1.3, level: "peak" },
    ];
    const m = buildModel(logs, lh, DEFAULT_SETTINGS);
    expect(m.cycles[0].ovulation).toBe("2026-01-14");
    expect(m.cycles[0].ovulationConfirmed).toBe(true);
    // next start Jan 29 − ovulation Jan 14 = 15 days luteal
    expect(m.avgLutealLength).toBe(15);
    expect(m.typicalOvulationDay).toBe(14);
  });

  it("estimates ovulation from cycle length when no peak was recorded", () => {
    const logs = [...period("2026-01-01"), ...period("2026-01-29")];
    const m = buildModel(logs, [], DEFAULT_SETTINGS);
    expect(m.cycles[0].ovulation).toBe("2026-01-15"); // day 15 of a 28-day cycle with 14-day luteal
    expect(m.cycles[0].ovulationConfirmed).toBe(false);
  });
});

describe("phaseFor", () => {
  const logs = [...period("2026-01-01"), ...period("2026-01-29"), ...period("2026-02-26")];
  const m = buildModel(logs, [], DEFAULT_SETTINGS);

  it("walks through the phases of a 28-day cycle", () => {
    const at = (d: string) => phaseFor(d, m);
    expect(at("2026-02-26").phase).toBe("menstrual");
    expect(at("2026-02-26").cycleDay).toBe(1);
    expect(at("2026-03-04").phase).toBe("follicular");
    // ovulation estimated Mar 12 (start + 28 − 14); fertile from Mar 7
    expect(at("2026-03-12").ovulation).toBe("2026-03-12");
    expect(at("2026-03-08").phase).toBe("fertile");
    expect(at("2026-03-08").fertileDay).toBe(2);
    expect(at("2026-03-11").phase).toBe("ovulation");
    expect(at("2026-03-12").phase).toBe("ovulation");
    expect(at("2026-03-13").phase).toBe("tww_early");
    expect(at("2026-03-13").dpo).toBe(1);
    expect(at("2026-03-20").phase).toBe("tww_mid");
    expect(at("2026-03-24").phase).toBe("tww_late");
    expect(at("2026-03-24").testDate).toBe("2026-03-24");
    expect(at("2026-03-26").phase).toBe("late");
    expect(at("2026-03-26").nextPeriod).toBe("2026-03-26");
  });

  it("assumes an ongoing period lasts the typical length", () => {
    const logs2 = [...period("2026-01-01"), ...period("2026-01-29"), { date: "2026-02-26", flow: "heavy" as const }];
    const m2 = buildModel(logs2, [], DEFAULT_SETTINGS);
    expect(phaseFor("2026-02-27", m2).phase).toBe("menstrual");
  });

  it("counts DPO from an LH-confirmed ovulation", () => {
    const lh: LhTest[] = [{ date: "2026-03-08", ratio: 1.2, level: "peak" }];
    const m3 = buildModel(logs, lh, DEFAULT_SETTINGS);
    const t = phaseFor("2026-03-15", m3);
    expect(t.ovulation).toBe("2026-03-09");
    expect(t.ovulationConfirmed).toBe(true);
    expect(t.dpo).toBe(6);
    expect(t.nextPeriod).toBe("2026-03-23");
  });

  it("predicts the open cycle's ovulation from the LH-learned ovulation day", () => {
    const lh: LhTest[] = [
      { date: "2026-01-12", ratio: 1.1, level: "peak" },
      { date: "2026-02-09", ratio: 1.2, level: "peak" },
    ];
    const m4 = buildModel(logs, lh, DEFAULT_SETTINGS);
    expect(m4.typicalOvulationDay).toBe(13);
    expect(phaseFor("2026-03-01", m4).ovulation).toBe("2026-03-10"); // CD13 of the Feb 26 cycle
  });

  it("uses a marked ovulation day (e.g. Premom-confirmed) when there's no LH peak", () => {
    const withMark: DayLog[] = [...logs, { date: "2026-02-12", ovulation: true }];
    const m5 = buildModel(withMark, [], DEFAULT_SETTINGS);
    expect(m5.cycles[1]).toMatchObject({ ovulation: "2026-02-12", ovulationConfirmed: true, ovulationSource: "marked" });
    // an LH peak still wins over a mark in the same cycle
    const m6 = buildModel(withMark, [{ date: "2026-02-08", ratio: 1.1, level: "peak" }], DEFAULT_SETTINGS);
    expect(m6.cycles[1]).toMatchObject({ ovulation: "2026-02-09", ovulationSource: "lh" });
  });

  it("returns unknown with no data", () => {
    expect(phaseFor("2026-03-01", buildModel([], [], DEFAULT_SETTINGS)).phase).toBe("unknown");
  });
});

describe("timeline", () => {
  it("projects future periods and fertile windows", () => {
    const logs = [...period("2026-01-01"), ...period("2026-01-29")];
    const m = buildModel(logs, [], DEFAULT_SETTINGS);
    const marks = timeline(m, logs, "2026-01-01", "2026-04-30");
    expect(marks.get("2026-01-01")?.period).toBe(true);
    expect(marks.get("2026-02-26")?.predictedPeriod).toBe(true);
    expect(marks.get("2026-02-12")?.ovulation).toBe(true);
    expect(marks.get("2026-03-12")?.ovulation).toBe(true);
    expect(marks.get("2026-03-10")?.fertile).toBe(true);
  });
});
