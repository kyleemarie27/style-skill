import { describe, expect, it } from "vitest";
import { mergeNights } from "../api/_lib/oura";
import { buildModel, phaseFor } from "../shared/cycle";
import { addDays } from "../shared/dates";
import { DEFAULT_SETTINGS, type DayLog, type LhTest, type Settings } from "../shared/types";
import { thermalShift, type WearableDay } from "../shared/wearable";
import { focusFor, signalsFor, waitListActive, windowDays } from "../src/lib/cycleToday";
import { invitationFor } from "../src/content/invitations";

const period = (start: string, days = 5): DayLog[] =>
  Array.from({ length: days }, (_, i) => ({ date: addDays(start, i), flow: i < 3 ? "medium" : "light" }));

/** Nights from `start`: low (−0.1 °C) until `riseOn`, then +0.35 °C. */
function nights(start: string, count: number, riseOn: string | null, wobble = 0.05): WearableDay[] {
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(start, i);
    const high = riseOn !== null && date >= riseOn;
    return { date, tempDev: (high ? 0.35 : -0.1) + (i % 2 ? wobble : -wobble), rhr: 55, hrv: 60 };
  });
}

describe("thermalShift", () => {
  it("finds three nights in a row 0.2 °C over the six before, and puts ovulation the day before", () => {
    const s = thermalShift(nights("2026-01-01", 28, "2026-01-16"), "2026-01-08", "2026-01-28");
    expect(s).toMatchObject({ firstHigh: "2026-01-16", ovulation: "2026-01-15" });
    expect(s!.rise).toBeGreaterThan(0.3);
  });

  it("ignores a one- or two-night blip", () => {
    const n = nights("2026-01-01", 28, null);
    n[14].tempDev = 0.4;
    n[15].tempDev = 0.4;
    expect(thermalShift(n, "2026-01-08", "2026-01-28")).toBeNull();
  });

  it("needs enough nights before the rise and no gap inside the three", () => {
    const n = nights("2026-01-01", 28, "2026-01-16").filter((x) => x.date !== "2026-01-17");
    expect(thermalShift(n, "2026-01-08", "2026-01-28")).toMatchObject({ firstHigh: "2026-01-18" });
    expect(thermalShift(nights("2026-01-14", 10, "2026-01-16"), "2026-01-14", "2026-01-28")).toBeNull();
  });
});

describe("buildModel with temperature", () => {
  it("uses a temperature shift when there's no LH peak, and LH still wins when there is one", () => {
    const logs = [...period("2026-01-01"), ...period("2026-01-29")];
    const w = nights("2026-01-01", 28, "2026-01-16");
    const m = buildModel(logs, [], DEFAULT_SETTINGS, w);
    expect(m.cycles[0]).toMatchObject({ ovulation: "2026-01-15", ovulationConfirmed: true, ovulationSource: "temp" });
    const lh: LhTest[] = [{ date: "2026-01-13", ratio: 1.2, level: "peak" }];
    const m2 = buildModel(logs, lh, DEFAULT_SETTINGS, w);
    expect(m2.cycles[0]).toMatchObject({ ovulation: "2026-01-14", ovulationSource: "lh" });
    expect(m2.cycles[0].tempShift?.firstHigh).toBe("2026-01-16");
  });
});

describe("first cycle after a loss", () => {
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    pregnancy: {
      positiveTestDate: "2026-09-20", lmp: "2026-09-01", dueDate: "2027-06-08", dueDateSource: "lmp",
      ended: { date: "2026-10-28", reason: "loss" }, questions: [], appointments: [],
    },
  };
  const history = [...period("2026-07-06"), ...period("2026-08-04"), ...period("2026-09-01")];

  it("starts a new cycle on the day the pregnancy ended and leaves the pregnancy out of the averages", () => {
    const m = buildModel(history, [], settings);
    expect(m.cycles.at(-1)!.start).toBe("2026-10-28");
    expect(m.avgCycleLength).toBe(29);
    expect(m.afterLoss).toMatchObject({ start: "2026-10-28", negativeTest: null });
    expect(phaseFor("2026-11-12", m).cycleDay).toBe(16);
  });

  it("uses a period logged near the loss as day 1 instead", () => {
    const m = buildModel([...history, ...period("2026-10-30")], [], settings);
    expect(m.cycles.at(-1)!.start).toBe("2026-10-30");
    expect(m.cycles.filter((c) => c.start >= "2026-10-01")).toHaveLength(1);
  });

  it("sets LH peaks aside until a negative pregnancy test", () => {
    const lh: LhTest[] = [{ date: "2026-11-04", ratio: 1.1, level: "peak" }, { date: "2026-11-10", ratio: 1.3, level: "peak" }];
    const m = buildModel(history, lh, settings);
    expect(m.afterLoss!.ignoredPeaks).toEqual(["2026-11-04", "2026-11-10"]);
    expect(m.cycles.at(-1)!.ovulationSource).toBe("estimate");
    const withTest = buildModel([...history, { date: "2026-11-08", pregnancy_test: "negative" }], lh, settings);
    expect(withTest.afterLoss).toMatchObject({ negativeTest: "2026-11-08", ignoredPeaks: ["2026-11-04"] });
    expect(withTest.cycles.at(-1)).toMatchObject({ ovulation: "2026-11-11", ovulationSource: "lh" });
  });

  it("is a gentler invitation for the first week", () => {
    const m = buildModel(history, [], settings);
    expect(invitationFor(phaseFor("2026-10-29", m), "2026-10-28")?.name).toBe("The Held One");
  });
});

describe("Today in cycle mode", () => {
  const logs = [...period("2026-01-01"), ...period("2026-01-29")];
  const model = buildModel(logs, [], DEFAULT_SETTINGS);
  const byDate = new Map(logs.map((l) => [l.date, l]));

  it("says what to do today, and keeps the wait quiet", () => {
    const at = (d: string) => focusFor(phaseFor(d, model), model, [], byDate, true);
    expect(at("2026-01-30").headline).toBe("Nothing to time today.");
    expect(at("2026-02-05").headline).toBe("Nothing to time yet.");
    expect(at("2026-02-08").headline).toMatch(/window is open/);
    expect(at("2026-02-11").headline).toMatch(/best days/);
    expect(at("2026-02-13").headline).toMatch(/Last day/);
    const wait = at("2026-02-18");
    expect(wait.headline).toBe("Your part is done.");
    expect(wait.sub).not.toMatch(/days past ovulation/);
    expect(focusFor(phaseFor("2026-02-18", model), model, [], byDate, false).sub).toMatch(/days past ovulation/);
  });

  it("turns on for fertile mucus and LH", () => {
    const d = "2026-02-08";
    const b = new Map(byDate).set(d, { date: d, cervical_mucus: "egg_white" });
    expect(focusFor(phaseFor(d, model), model, [], b, true).counts).toBe(true);
    const lh: LhTest[] = [{ date: d, ratio: 1.1, level: "peak" }];
    const m2 = buildModel(logs, lh, DEFAULT_SETTINGS);
    expect(focusFor(phaseFor(d, m2), m2, lh, byDate, true).headline).toMatch(/LH peak/);
  });

  it("shows the wait list from ovulation day until the period", () => {
    const ov = phaseFor("2026-02-01", model).ovulation!;
    expect(waitListActive(phaseFor(addDays(ov, -1), model))).toBe(false);
    expect(waitListActive(phaseFor(ov, model))).toBe(true);
    expect(waitListActive(phaseFor(addDays(ov, 10), model))).toBe(true);
    expect(waitListActive(phaseFor("2026-01-30", model))).toBe(false);
  });

  it("builds signals and a seven-day window", () => {
    const d = "2026-02-12";
    const info = phaseFor(d, model);
    const sig = signalsFor(info, model, [], logs, byDate, false);
    expect(sig.map((s) => s.key)).toEqual(["cm", "lh", "temp", "timing"]);
    expect(sig[2].note).toMatch(/Connect Oura/);
    const w = windowDays(info, model, [], byDate);
    expect(w).toHaveLength(7);
    expect(w.filter((x) => x.best)).toHaveLength(3);
  });

  it("has an invitation for every day of a cycle", () => {
    for (let i = 0; i < 30; i++) {
      const info = phaseFor(addDays("2026-01-29", i), model);
      expect(invitationFor(info), info.date).not.toBeNull();
    }
  });
});

describe("mergeNights", () => {
  it("joins Oura readiness temperature with the main sleep's heart rate and HRV", () => {
    const rows = mergeNights(
      [{ day: "2026-11-10", temperature_deviation: 0.123 }, { day: "2026-11-11", temperature_deviation: null }],
      [
        { day: "2026-11-10", type: "long_sleep", lowest_heart_rate: 52, average_hrv: 61, total_sleep_duration: 27000 },
        { day: "2026-11-10", type: "late_nap", lowest_heart_rate: 60, average_hrv: 40, total_sleep_duration: 1800 },
        { day: "2026-11-11", type: "long_sleep", lowest_heart_rate: 54, average_hrv: 58, total_sleep_duration: 25000 },
      ],
    );
    expect(rows).toEqual([
      { date: "2026-11-10", tempDev: 0.12, rhr: 52, hrv: 61 },
      { date: "2026-11-11", tempDev: null, rhr: 54, hrv: 58 },
    ]);
  });
});

describe("averages after a loss", () => {
  it("leave out the first cycle after the loss once it's finished", () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      pregnancy: { positiveTestDate: "2026-09-20", lmp: "2026-09-01", dueDate: "2027-06-08", dueDateSource: "lmp", ended: { date: "2026-10-28", reason: "loss" }, questions: [], appointments: [] },
    };
    const logs = [...period("2026-07-06"), ...period("2026-08-04"), ...period("2026-09-01"), ...period("2026-12-10")];
    const m = buildModel(logs, [], settings);
    expect(m.cycles.map((c) => c.start)).toContain("2026-10-28");
    expect(m.avgCycleLength).toBe(29); // the 43-day cycle after the loss doesn't count
  });
});
