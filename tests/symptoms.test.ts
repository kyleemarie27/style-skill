import { describe, expect, it } from "vitest";
import { hasSymptom, normalizeSymptom, recurringSymptoms, setSymptom, TOP_SYMPTOMS } from "../src/lib/symptoms";
import type { DayLog } from "../shared/types";

const day = (date: string, symptoms: string[]): DayLog => ({ date, symptoms });

describe("symptoms", () => {
  it("offers exactly ten built-in symptoms", () => {
    expect(TOP_SYMPTOMS).toHaveLength(10);
  });

  it("turns your own symptom into a regular option after 3 different days", () => {
    const logs = [day("2026-09-01", ["Stuffy nose"]), day("2026-09-02", ["stuffy nose", "Fatigue"])];
    expect(recurringSymptoms(logs, "2026-08-01")).toEqual([]);
    const more = [...logs, day("2026-09-05", ["Stuffy Nose "])];
    expect(recurringSymptoms(more, "2026-08-01")).toEqual(["Stuffy Nose"]);
  });

  it("ignores built-ins, warning signs and anything before the pregnancy", () => {
    const logs = [
      day("2026-07-01", ["Acne"]), day("2026-07-02", ["Acne"]), day("2026-09-03", ["Acne"]),
      ...["2026-09-01", "2026-09-02", "2026-09-03"].map((d) => day(d, ["Fatigue", "Severe headache"])),
    ];
    expect(recurringSymptoms(logs, "2026-08-01")).toEqual([]);
  });

  it("counts a symptom once per day and sorts the most-logged first", () => {
    const logs = ["01", "02", "03", "04"].map((d) => day(`2026-09-${d}`, ["Insomnia", "Insomnia"]))
      .concat(["05", "06", "07", "08", "09"].map((d) => day(`2026-09-${d}`, ["Leg cramps"])));
    expect(recurringSymptoms(logs, "2026-08-01")).toEqual(["Leg cramps", "Insomnia"]);
  });

  it("keeps nausea in its own field so severity and warning flags still work", () => {
    const on = setSymptom({ date: "2026-09-01" }, "Nausea", true);
    expect(on.preg?.nausea).toBe("mild");
    expect(on.symptoms).toEqual([]);
    expect(hasSymptom(on, "Nausea")).toBe(true);
    const severe = setSymptom({ date: "2026-09-01", preg: { nausea: "severe" } }, "Nausea", true);
    expect(severe.preg?.nausea).toBe("severe");
    expect(hasSymptom(setSymptom(severe, "Nausea", false), "Nausea")).toBe(false);
  });

  it("matches typed symptoms to existing options", () => {
    expect(normalizeSymptom("  back PAIN ", TOP_SYMPTOMS)).toBe("Back pain");
    expect(normalizeSymptom("stuffy   nose", TOP_SYMPTOMS)).toBe("Stuffy nose");
  });
});
