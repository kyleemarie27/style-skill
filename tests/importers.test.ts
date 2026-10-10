import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildModel } from "../shared/cycle";
import { DEFAULT_SETTINGS } from "../shared/types";
import { parseClueJson, readClueFile, PasswordNeeded } from "../src/lib/importers/clue";
import { mergeWithReport, summarize } from "../src/lib/importers/merge";
import { parseTableFile, parseTableRows } from "../src/lib/importers/table";

const fixture = (name: string) => new URL(`./fixtures/${name}`, import.meta.url);
const asFile = (name: string) => new File([readFileSync(fixture(name))], name);

describe("Clue importer", () => {
  it("reads the legacy day-record shape", () => {
    const b = parseClueJson(JSON.parse(readFileSync(fixture("clue-legacy.cluedata"), "utf8")));
    const first = b.dayLogs.find((d) => d.date === "2026-05-02")!;
    expect(first.flow).toBe("heavy");
    expect(first.symptoms).toContain("Cramps");
    expect(first.mood).toBe("Sensitive");
    expect(b.dayLogs.find((d) => d.date === "2026-05-06")!.flow).toBe("spotting");
    const sexDay = b.dayLogs.find((d) => d.date === "2026-05-15")!;
    expect(sexDay.intercourse).toBe(true);
    expect(sexDay.cervical_mucus).toBe("egg_white");
    expect(sexDay.symptoms).toContain("High libido");
    expect(b.lhTests.filter((t) => t.level === "peak")).toHaveLength(4);
  });

  it("reads the newer measurement-row shape and doesn't count sex drive or protected sex as ♥", () => {
    const b = parseClueJson(JSON.parse(readFileSync(fixture("clue-measurements.json"), "utf8")));
    expect(b.dayLogs.find((d) => d.date === "2026-09-02")!.flow).toBe("heavy");
    expect(b.dayLogs.find((d) => d.date === "2026-09-02")!.symptoms).toEqual(["Headache", "Cramps"]);
    expect(b.dayLogs.find((d) => d.date === "2026-09-14")!.intercourse).toBeUndefined();
    expect(b.dayLogs.find((d) => d.date === "2026-09-14")!.symptoms).toEqual(["Protected sex", "High libido"]);
    expect(b.dayLogs.find((d) => d.date === "2026-09-16")!.bbt).toBe(36.7);
    expect(b.lhTests).toEqual([{ date: "2026-09-15", ratio: null, level: "peak", source: "clue" }]);
  });

  it("reads only measurements.json from a newer export, ignoring reminders and account files", async () => {
    const b = await readClueFile(asFile("clue-new-export.zip"), "bloom123");
    expect(b.dayLogs.some((d) => d.date === "2026-03-03")).toBe(false); // the "period" reminder
    expect(b.dayLogs.find((d) => d.date === "2026-09-02")!.flow).toBe("heavy");
    expect(b.warnings).toEqual([]);
  });

  it("skips neutral answers, keeps protected sex out of ♥ counts, and reads the mind category as mood", () => {
    const b = parseClueJson([
      { id: "1", date: "2026-02-01", type: "sex_life", value: [{ option: "protected" }] },
      { id: "2", date: "2026-02-02", type: "sex_life", value: [{ option: "unprotected" }] },
      { id: "3", date: "2026-02-03", type: "pain", value: [{ option: "pain_free" }, { option: "lower_back" }] },
      { id: "4", date: "2026-02-03", type: "energy", value: [{ option: "ok" }] },
      { id: "5", date: "2026-02-03", type: "sleep_duration", value: { minutes: 480 } },
      { id: "6", date: "2026-02-03", type: "mind", value: [{ option: "calm" }] },
      { id: "7", date: "2026-02-03", type: "craving", value: [{ option: "sweet" }] },
    ]);
    const day = (d: string) => b.dayLogs.find((x) => x.date === d)!;
    expect(day("2026-02-01").intercourse).toBeUndefined();
    expect(day("2026-02-01").symptoms).toEqual(["Protected sex"]);
    expect(day("2026-02-02").intercourse).toBe(true);
    expect(day("2026-02-03").symptoms).toEqual(["Back pain", "Craving sweet"]);
    expect(day("2026-02-03").mood).toBe("Calm");
  });

  it("opens the password-protected zip", async () => {
    await expect(readClueFile(asFile("clue-export.zip"))).rejects.toBeInstanceOf(PasswordNeeded);
    await expect(readClueFile(asFile("clue-export.zip"), "wrong")).rejects.toBeInstanceOf(PasswordNeeded);
    const b = await readClueFile(asFile("clue-export.zip"), "bloom123");
    expect(b.dayLogs.length).toBeGreaterThan(20);
    expect(b.dayLogs.some((d) => d.date === "2026-09-01")).toBe(true);
  });
});

describe("Premom / table importer", () => {
  it("reads LH readings on the Premom scale plus period, intercourse and BBT", async () => {
    const b = await parseTableFile(asFile("premom.csv"), "premom");
    expect(b.lhTests).toHaveLength(32);
    const peak = b.lhTests.find((t) => t.level === "peak")!;
    expect(peak).toMatchObject({ date: "2026-05-15", ratio: 1.15 });
    expect(b.lhTests.find((t) => t.date === "2026-05-14")).toMatchObject({ ratio: 0.6, level: "high" });
    expect(b.dayLogs.find((d) => d.date === "2026-05-14")!.intercourse).toBe(true);
    expect(b.dayLogs.find((d) => d.date === "2026-05-02")).toMatchObject({ flow: "medium", bbt: 97.2, notes: "first day" });
  });

  it("reads Premom's chart export with a Time(...) column before each test brand", async () => {
    const b = await parseTableFile(asFile("premom-chart.csv"), "premom");
    expect(b.lhTests.map((t) => [t.date, t.ratio, t.level, t.taken_at])).toEqual([
      ["2026-03-10", 0.12, "low", "2026-03-10 2:05 PM"],
      ["2026-03-11", 0.58, "high", "2026-03-11 3:15 PM"],
      ["2026-03-12", 1.08, "peak", "2026-03-12 1:40 PM"],
      ["2026-03-12", 0.9, "high", "2026-03-12 9:00 PM"],
      ["2026-03-13", 0.31, "low", "2026-03-13 12:30 PM"],
    ]);
    expect(b.dayLogs).toEqual([{ date: "2026-03-11", bbt: 97.4, source: "premom" }]);
  });

  it("supports long Date | Type | Value tables", () => {
    const b = parseTableRows(
      [
        { Date: "2026-01-03", Type: "Ovulation Test", Value: "85%" },
        { Date: "2026-01-04", Type: "Period", Value: "Heavy" },
        { Date: "2026-01-05", Type: "Intercourse", Value: "" },
      ],
      "premom",
    );
    expect(b.lhTests[0]).toMatchObject({ ratio: 0.85, level: "high" });
    expect(b.dayLogs.map((d) => d.date)).toEqual(["2026-01-04", "2026-01-05"]);
  });
});

describe("merging Clue + Premom", () => {
  it("prefers Clue for flow, Premom for LH, and reports conflicts", async () => {
    const clue = await readClueFile(asFile("clue-export.zip"), "bloom123");
    const premom = await parseTableFile(asFile("premom.csv"), "premom");
    const { bundle, conflicts } = mergeWithReport([clue, premom]);
    expect(bundle.dayLogs.find((d) => d.date === "2026-05-02")!.flow).toBe("heavy");
    expect(conflicts.some((c) => c.date === "2026-05-02" && c.field === "flow")).toBe(true);
    // Clue's yes/no positive on 05-16 is dropped because Premom has numeric readings that day
    expect(bundle.lhTests.filter((t) => t.date === "2026-05-16").every((t) => t.ratio !== null)).toBe(true);

    const model = buildModel(bundle.dayLogs, bundle.lhTests, DEFAULT_SETTINGS);
    const s = summarize(bundle, model.cycles.length);
    expect(s.periods).toBe(5);
    expect(model.cycles.map((c) => c.length)).toEqual([29, 30, 28, 35, null]);
    expect(model.avgCycleLength).toBe(31);
    expect(model.typicalOvulationDay).toBe(15);
  });
});
