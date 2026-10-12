import { describe, expect, it } from "vitest";
import { buildModel, timeline } from "../shared/cycle";
import { addDays } from "../shared/dates";
import { babySize, dueDateFrom, gestation, pregnancyFlags, standardSchedule } from "../shared/pregnancy";
import { DEFAULT_SETTINGS, type DayLog, type LhTest, type Pregnancy } from "../shared/types";
import { ART } from "../src/components/art";
import { WEEKS } from "../src/content/pregnancy";

function period(start: string): DayLog[] {
  return ["heavy", "heavy", "medium", "light"].map((flow, i) => ({ date: addDays(start, i), flow: flow as DayLog["flow"] }));
}

const preg = (over: Partial<Pregnancy> = {}): Pregnancy => ({
  positiveTestDate: "2026-10-12",
  lmp: "2026-09-12",
  dueDate: "2027-06-19",
  dueDateSource: "lmp",
  ended: null,
  questions: [],
  appointments: [],
  ...over,
});

describe("dueDateFrom", () => {
  const logs = [...period("2026-07-17"), ...period("2026-08-14"), ...period("2026-09-11")];

  it("uses LMP + 280 days for 28-day cycles", () => {
    const m = buildModel(logs, [], DEFAULT_SETTINGS);
    const est = dueDateFrom(m, "2026-10-12");
    expect(est).toMatchObject({ lmp: "2026-09-11", dueDate: "2027-06-18", source: "lmp" });
  });

  it("shifts the due date for longer cycles", () => {
    const long = [...period("2026-07-01"), ...period("2026-08-02"), ...period("2026-09-03")];
    const m = buildModel(long, [], DEFAULT_SETTINGS);
    // 32-day cycles: LMP + 280 + 4
    expect(dueDateFrom(m, "2026-10-12").dueDate).toBe(addDays("2026-09-03", 284));
  });

  it("prefers an LH-confirmed ovulation: ovulation + 266 days", () => {
    const lh: LhTest[] = [{ date: "2026-09-25", ratio: 1.2, level: "peak" }];
    const m = buildModel(logs, lh, DEFAULT_SETTINGS);
    const est = dueDateFrom(m, "2026-10-12");
    expect(est.source).toBe("ovulation");
    expect(est.dueDate).toBe(addDays("2026-09-26", 266));
  });

  it("assumes about 4 weeks along when no recent period is logged", () => {
    const est = dueDateFrom(buildModel([], [], DEFAULT_SETTINGS), "2026-10-12");
    expect(gestation("2026-10-12", est)).toMatchObject({ weeks: 4, days: 0 });
  });
});

describe("gestation", () => {
  it("counts weeks and days from the due date", () => {
    const p = preg();
    expect(gestation("2026-10-11", p)).toMatchObject({ weeks: 4, days: 1, trimester: 1, daysToGo: 251 });
    expect(gestation("2027-01-01", p).trimester).toBe(2);
    expect(gestation("2027-04-01", p).trimester).toBe(3);
    expect(gestation("2027-06-19", p)).toMatchObject({ weeks: 40, days: 0, daysToGo: 0, pct: 1 });
  });
});

describe("babySize", () => {
  it("grows every day and switches to head-to-heel at 20 weeks", () => {
    let prevW = -1;
    for (let d = 28; d <= 294; d++) {
      const s = babySize(d);
      expect(s.weightG).toBeGreaterThanOrEqual(prevW);
      prevW = s.weightG;
    }
    for (let d = 28; d < 140; d++) expect(babySize(d + 1).lengthMm).toBeGreaterThanOrEqual(babySize(d).lengthMm);
    expect(babySize(139).measure).toBe("crown to rump");
    expect(babySize(140).measure).toBe("head to heel");
    expect(Math.round(babySize(12 * 7).lengthMm)).toBe(54);
  });
});

describe("pregnancyFlags", () => {
  const p = preg();
  const day = (d: Partial<DayLog>): DayLog => ({ date: "2026-10-12", ...d });

  it("is quiet when nothing worrying is logged", () => {
    expect(pregnancyFlags([day({ preg: { nausea: "mild", prenatal: true } })], p, "2026-10-12")).toEqual([]);
  });

  it("asks for a call about spotting and says urgent for heavy bleeding or one-sided pain", () => {
    expect(pregnancyFlags([day({ preg: { bleeding: "spotting" } })], p, "2026-10-12")[0]).toMatchObject({ id: "bleeding", level: "call" });
    expect(pregnancyFlags([day({ preg: { bleeding: "heavy" } })], p, "2026-10-12")[0]).toMatchObject({ level: "urgent" });
    const ectopic = pregnancyFlags([day({ preg: { pain: "strong", painOneSided: true } })], p, "2026-10-12");
    expect(ectopic[0]).toMatchObject({ id: "ectopic", level: "urgent" });
  });

  it("flags severe vomiting more strongly when it lasts two days", () => {
    const one = pregnancyFlags([day({ preg: { vomits: 5 } })], p, "2026-10-12");
    expect(one[0]).toMatchObject({ id: "hyperemesis", level: "mention" });
    const two = pregnancyFlags([day({ preg: { vomits: 5 } }), day({ date: "2026-10-11", preg: { nausea: "severe" } })], p, "2026-10-12");
    expect(two[0]).toMatchObject({ id: "hyperemesis", level: "call" });
  });

  it("checks blood pressure only from 20 weeks", () => {
    const early = pregnancyFlags([day({ preg: { bpSys: 145, bpDia: 92 } })], p, "2026-10-12");
    expect(early).toEqual([]);
    const later = "2027-02-10"; // 21+ weeks
    expect(pregnancyFlags([day({ date: later, preg: { bpSys: 145, bpDia: 92 } })], p, later)[0]).toMatchObject({ id: "bp-high", level: "call" });
    expect(pregnancyFlags([day({ date: later, preg: { bpSys: 165, bpDia: 100 } })], p, later)[0]).toMatchObject({ id: "bp-severe", level: "urgent" });
  });

  it("ignores logs older than a few days", () => {
    expect(pregnancyFlags([day({ date: "2026-10-01", preg: { bleeding: "heavy" } })], p, "2026-10-12")).toEqual([]);
  });
});

describe("standardSchedule", () => {
  it("dates each visit from the current due date", () => {
    const s = standardSchedule(preg());
    const anatomy = s.find((x) => x.id === "anatomy")!;
    expect(anatomy.from).toBe(addDays("2026-09-12", 18 * 7));
    expect(s.find((x) => x.id === "gbs")!.fromWeek).toBe(36);
  });
});

describe("timeline while pregnant", () => {
  it("stops predicting periods and fertile windows", () => {
    const logs = [...period("2026-08-15"), ...period("2026-09-12")];
    const settings = { ...DEFAULT_SETTINGS, pregnancy: preg() };
    const marks = timeline(buildModel(logs, [], settings), logs, "2026-10-01", "2026-12-31");
    expect([...marks.values()].some((m) => m.predictedPeriod || m.fertile)).toBe(false);
    const notPregnant = timeline(buildModel(logs, [], DEFAULT_SETTINGS), logs, "2026-10-01", "2026-12-31");
    expect([...notPregnant.values()].some((m) => m.predictedPeriod)).toBe(true);
  });
});

describe("pregnancy content", () => {
  it("covers weeks 4–42 with every section filled and an illustration in every theme", () => {
    expect(WEEKS.map((w) => w.week)).toEqual(Array.from({ length: 39 }, (_, i) => i + 4));
    for (const w of WEEKS) {
      expect(w.days, `week ${w.week} days`).toHaveLength(7);
      for (const k of ["baby", "body", "mind", "watchouts", "todo", "partner"] as const) expect(w[k].length, `week ${w.week} ${k}`).toBeGreaterThan(0);
      for (const theme of ["fruit", "object", "animal"] as const) {
        expect(ART[theme][w.size[theme].art], `week ${w.week} ${theme} art "${w.size[theme].art}"`).toBeTypeOf("function");
      }
    }
  });
});
