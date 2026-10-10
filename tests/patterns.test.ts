import { describe, expect, it } from "vitest";
import { buildModel, phaseFor } from "../shared/cycle";
import { addDays } from "../shared/dates";
import { patternFor } from "../shared/patterns";
import { DEFAULT_SETTINGS, type DayLog } from "../shared/types";

describe("patternFor", () => {
  it("finds symptoms you log at the same point in past cycles, aligned to the next period in the luteal phase", () => {
    const logs: DayLog[] = [];
    const lengths = [28, 32, 28, 30];
    let start = "2026-01-01";
    for (const len of lengths) {
      for (let i = 0; i < 4; i++) logs.push({ date: addDays(start, i), flow: "medium" });
      logs.push({ date: addDays(start, 14), ovulation: true });
      // bloating 3 days before each next period, whatever the cycle length
      logs.push({ date: addDays(start, len - 3), symptoms: ["Bloating"], mood: "Irritable" });
      start = addDays(start, len);
    }
    for (let i = 0; i < 4; i++) logs.push({ date: addDays(start, i), flow: "medium" });
    logs.push({ date: addDays(start, 14), ovulation: true });

    const model = buildModel(logs, [], DEFAULT_SETTINGS);
    // 3 days before the predicted next period of the current cycle
    const info = phaseFor(addDays(info0(model).nextPeriod!, -3), model);
    expect(info.dpo).not.toBeNull();
    const p = patternFor(info, model, logs);
    expect(p.tags.map((t) => t.label)).toEqual(["Bloating", "Irritable"]);
    expect(p.tags[0]).toMatchObject({ cycles: 4, of: 4 });
    expect(p.facts[0]).toBe("You usually ovulate on cycle day 15 (from 5 confirmed cycles).");

    function info0(m: typeof model) {
      return phaseFor(addDays(start, 15), m);
    }
  });
});
