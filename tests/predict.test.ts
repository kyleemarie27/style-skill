import { describe, expect, it } from "vitest";
import { enginePrediction, guard, PREDICT_SCHEMA } from "../api/_lib/predict";
import { buildModel } from "../shared/cycle";
import { addDays } from "../shared/dates";
import { parseLabCsv, parseLabJson, parseLabLines, parseLabText, parseRange } from "../shared/labs";
import { sameCall, type Prediction } from "../shared/prediction";
import { DEFAULT_SETTINGS, type DayLog } from "../shared/types";
import type { WearableDay } from "../shared/wearable";

const period = (start: string): DayLog[] => Array.from({ length: 5 }, (_, i) => ({ date: addDays(start, i), flow: i < 3 ? "medium" : "light" }));
const logs = [...period("2026-09-01"), ...period("2026-09-30"), ...period("2026-10-29")];

describe("reading lab results", () => {
  it("reads the transcription format, with pending tests, ranges and flags", () => {
    const r = parseLabLines("Date: 2025-03-10\nProgesterone | 0.5 | ng/mL |  | \nTSH | 2.0 | uIU/mL | 0.45-4.5 | \nLDL | 120 | mg/dL | <99 | H\nhCG | Pending |  |  | \nnot a result line");
    expect(r.rows).toHaveLength(4);
    expect(r.rows[0]).toMatchObject({ date: "2025-03-10", test: "Progesterone", value: "0.5", unit: "ng/mL", refLow: null, refHigh: null, flag: null, status: "final" });
    expect(r.rows[1]).toMatchObject({ refLow: 0.45, refHigh: 4.5 });
    expect(r.rows[2]).toMatchObject({ refHigh: 99, flag: "high" });
    expect(r.rows[3]).toMatchObject({ test: "hCG", status: "pending", value: "" });
  });
  it("flags against the range when the report didn't", () => {
    expect(parseLabLines("Date: 2025-03-10\nPlatelets | 120 | x10E3/uL | 150-450 | ").rows[0].flag).toBe("low");
  });
  it("warns instead of guessing when there's no date", () => {
    expect(parseLabLines("TSH | 1.2 | uIU/mL").warnings.join(" ")).toMatch(/No date/);
  });
  it("reads ranges in the usual shapes", () => {
    expect(parseRange("0.45 - 4.50")).toEqual({ low: 0.45, high: 4.5 });
    expect(parseRange(">59")).toEqual({ low: 59, high: null });
    expect(parseRange("<199")).toEqual({ low: null, high: 199 });
  });
  it("reads CSV", () => {
    const r = parseLabCsv("date,test,value,unit,ref_low,ref_high,flag\n2025-03-10,Estradiol,88,pg/mL,,,\n2025-03-10,Iron,70,ug/dL,27,159,");
    expect(r.rows.map((x) => [x.test, x.value, x.refLow])).toEqual([["Estradiol", "88", null], ["Iron", "70", 27]]);
  });
  it("reads the labs-and-ovulation JSON: results, pending, priors, events, analysis and dates to correct", () => {
    const r = parseLabJson({
      lab_panel: { service_date: "2025-03-10", pending_known: ["hCG"], results: [{ panel: "Reproductive", test: "Progesterone", value: 0.5, unit: "ng/mL", ref_low: null, ref_high: null, flag: null }, { panel: "Thyroid", test: "Thyroid Ab", value: "<5", unit: "IU/mL", ref_low: 0, ref_high: 34, flag: null }] },
      prior_values_for_trends: [{ test: "Iron", points: [["2024-06-01", 60], ["2025-03-10", 70]] }],
      cycle_context: { loss_date: "2025-02-20", "hcg_2025-02-21": 1200, home_pregnancy_test_negative: "2025-03-02", events: [{ date: "2025-03-04", type: "lh_strip", value: "T/C about 0.5", interpretation: "false start" }] },
      ovulation_prediction: { as_of: "2025-03-11", scenarios: [{ label: "Follicle continues", likelihood: "more likely", ovulation_window: ["2025-03-14", "2025-03-19"], rationale: "E2 fits a growing follicle." }], update_rules: [] },
    });
    expect(r.lossDate).toBe("2025-02-20");
    expect(r.negativeTest).toBe("2025-03-02");
    expect(r.rows.find((x) => x.test === "Thyroid Ab")?.value).toBe("<5");
    expect(r.rows.filter((x) => x.status === "pending").map((x) => x.test)).toEqual(["hCG"]);
    expect(r.rows.some((x) => x.test === "Iron" && x.date === "2024-06-01")).toBe(true);
    expect(r.rows.some((x) => x.test === "Iron" && x.date === "2025-03-10")).toBe(false); // the prior list repeats today's value
    expect(r.rows.find((x) => x.test === "hCG" && x.status === "final")).toMatchObject({ date: "2025-02-21", value: "1200" });
    expect(r.evidence.map((e) => e.kind)).toEqual(["event", "analysis"]);
    expect(r.evidence[1].text).toMatch(/Outside analysis.*2025-03-14 to 2025-03-19/);
  });
  it("picks the reader from the text", () => {
    expect(parseLabText('{"lab_panel":{"service_date":"2025-03-10","results":[{"test":"LH","value":6.2}]}}').rows[0].test).toBe("LH");
    expect(parseLabText("date,test,value\n2025-03-10,FSH,7.1").rows[0].test).toBe("FSH");
    expect(parseLabText("FSH | 7.1 | mIU/mL", "2025-03-10").rows[0].date).toBe("2025-03-10");
  });
});

describe("prediction guardrails", () => {
  const model = buildModel(logs, [], DEFAULT_SETTINGS);
  const base = { ...enginePrediction(model, "2026-11-25"), change: "" };

  it("never keeps a not-yet window in the past", () => {
    const p = guard({ ...base, ovulation: "not_yet", likely: { start: "2026-11-20", end: "2026-11-23" } }, model, "2026-11-25");
    expect(p.likely.start).toBe("2026-11-25");
    expect(p.likely.end >= "2026-11-27").toBe(true);
  });

  it("treats a temperature rise that held as confirmed ovulation, whatever the reasoning said", () => {
    const nights: WearableDay[] = [];
    for (let d = "2026-10-29", i = 0; d <= "2026-11-25"; d = addDays(d, 1), i++) nights.push({ date: d, tempDev: (d >= "2026-11-14" ? 0.4 : -0.1) + (i % 2 ? 0.03 : -0.03), rhr: 55, hrv: 60 });
    const m = buildModel(logs, [], DEFAULT_SETTINGS, nights);
    const p = guard({ ...base, ovulation: "not_yet", likely: { start: "2026-11-26", end: "2026-11-30" } }, m, "2026-11-25");
    expect(p).toMatchObject({ ovulation: "confirmed", ovulationDate: "2026-11-13", confidence: "high" });
  });

  it("calls it stable only when nothing a person would notice changed", () => {
    const a = { phase: "follicular", ovulation: "not_yet", likely: { start: "2026-11-27", end: "2026-12-02" }, confidence: "medium", backup: { start: "2026-12-05", end: "2026-12-12" } } as Pick<Prediction, "phase" | "ovulation" | "likely" | "confidence" | "backup">;
    expect(sameCall(a, { ...a })).toBe(true);
    expect(sameCall(a, { ...a, confidence: "high" })).toBe(false);
    expect(sameCall(a, { ...a, likely: { start: "2026-11-28", end: "2026-12-02" } })).toBe(false);
    expect(sameCall(a, { ...a, backup: null })).toBe(false);
  });

  it("has a schema with no optional or union fields", () => {
    expect(PREDICT_SCHEMA.required).toHaveLength(Object.keys(PREDICT_SCHEMA.properties).length);
  });
});
