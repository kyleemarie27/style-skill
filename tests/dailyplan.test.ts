import { describe, expect, it } from "vitest";
import { cleanPlan } from "../api/daily-note";
import { isComplete } from "../api/deep-dive";
import { dailyTodos, weekContent } from "../src/content/pregnancy";

describe("today's read", () => {
  const body = "A paragraph long enough to count as a real section of the read, with some actual detail in it.";
  it("rejects a read with no sections (the blank read bug)", () => {
    expect(isComplete({ title: "What to eat at 6 weeks", opener: "Okay…", sections: [], takeaways: [] })).toBe(false);
    expect(isComplete({ title: "T", sections: [{ heading: "Q?", body }], takeaways: ["x"] })).toBe(false);
    expect(isComplete({ title: "T", minutes: 4, sections: [{ heading: "Q?", body }, { heading: "Q2?", body }], takeaways: ["x"] })).toBe(true);
  });
});

describe("today's plan", () => {
  it("keeps usable plans and drops thin ones", () => {
    expect(cleanPlan({ todos: [{ t: "Only one", why: "" }] })).toBeNull();
    const p = cleanPlan({ todos: [{ t: " A ", why: "a" }, { t: "B", why: "b" }, { t: "C", why: "c" }, { t: "D", why: "d" }], partner: { t: "Cook", why: "" }, ask: ["Q1", "", "Q2"] });
    expect(p?.todos.map((t) => t.t)).toEqual(["A", "B", "C"]);
    expect(p?.ask).toEqual(["Q1", "Q2"]);
  });

  it("without AI, still gives three to-dos and one aimed at a logged symptom", () => {
    const todos = dailyTodos(weekContent(6), 2, 44, ["Nausea"]);
    expect(todos).toHaveLength(3);
    expect(todos.some((t) => /nausea/i.test(t.why ?? ""))).toBe(true);
    expect(dailyTodos(weekContent(6), 2, 44)).toHaveLength(3);
  });
});
