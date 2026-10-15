import { describe, expect, it } from "vitest";
import { CHANGES, changesAt, dailyBites, dailyTodos, nextMilestone, SYMPTOMS, WEEKS, weekContent } from "../src/content/pregnancy";

describe("body & mind changes", () => {
  it("has sane windows and only links to symptoms that exist", () => {
    for (const c of CHANGES) {
      expect(c.from).toBeLessThanOrEqual(c.to);
      if (c.peak) {
        expect(c.peak[0]).toBeGreaterThanOrEqual(c.from);
        expect(c.peak[1]).toBeLessThanOrEqual(c.to);
      }
      if (c.symptom) expect(SYMPTOMS[c.symptom], c.symptom).toBeDefined();
    }
    expect(new Set(CHANGES.map((c) => c.id)).size).toBe(CHANGES.length);
  });

  it("sorts each change into now, coming or fading", () => {
    const w9 = changesAt(9);
    expect(w9.now.find((c) => c.id === "nausea")?.status).toBe("peak");
    expect(w9.now[0].status).toBe("peak");
    const w12 = changesAt(12);
    expect(w12.now.find((c) => c.id === "nausea")?.status).toBe("easing");
    expect(w12.coming.map((c) => c.id)).toContain("energy");
    expect(changesAt(16).fading.map((c) => c.id)).toContain("nausea");
  });

  it("always has something happening in body and mind, every week", () => {
    for (const { week } of WEEKS) {
      const { now } = changesAt(week);
      expect(now.some((c) => c.kind === "body"), `week ${week} body`).toBe(true);
      expect(now.some((c) => c.kind === "mind"), `week ${week} mind`).toBe(true);
    }
  });
});

describe("today's bites", () => {
  it("gives three insights and three to-dos every day, different across the week", () => {
    const week = weekContent(10);
    const seen = new Set<string>();
    for (let d = 0; d < 7; d++) {
      const bites = dailyBites(week, d, 70 + d);
      const todos = dailyTodos(week, d, 70 + d);
      expect(bites).toHaveLength(3);
      expect(todos).toHaveLength(3);
      expect(new Set(todos.map((t) => t.t)).size).toBe(3);
      seen.add(bites.map((b) => b.t).join("|"));
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it("only suggests kick counts from 28 weeks", () => {
    const all = (w: number) => Array.from({ length: 7 }, (_, d) => dailyTodos(weekContent(w), d, w * 7 + d)).flat().map((t) => t.t);
    expect(all(27).some((t) => /kick count/i.test(t))).toBe(false);
  });

  it("counts down to the next milestone", () => {
    expect(nextMilestone(29)).toMatchObject({ week: 6, inDays: 13 });
    expect(nextMilestone(42)).toMatchObject({ week: 8, inDays: 14 });
    expect(nextMilestone(280)).toBeNull();
  });
});
