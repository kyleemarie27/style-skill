import { describe, expect, it } from "vitest";
import { dayPoints, FALLBACK_QUIZ, guessAbout, norm, scores, themeFor, weekStart, type DuelRecord } from "../shared/duel";
import { addDays } from "../shared/dates";

const day = (date: string, about: "me" | "partner" = "me"): DuelRecord["day"] => ({
  date, level: "Window week", theme: "Sperm health",
  quiz: [FALLBACK_QUIZ[0], FALLBACK_QUIZ[1]],
  guess: { about, self: "Pick tonight:", guess: "What would Kylee pick?", options: ["a", "b", "c"] },
});

describe("Daily Duel scoring", () => {
  it("gives a point per right answer, and the guesser a point for a right guess", () => {
    const r: DuelRecord = { date: "2026-11-13", day: day("2026-11-13", "me"), picks: {
      me: { quiz: [1, 0], guess: 2 },        // both right; it's about "me", so no guess point
      partner: { quiz: [0, 0], guess: 2 },   // one right, guessed right
    } };
    expect(dayPoints(r, "me")).toBe(2);
    expect(dayPoints(r, "partner")).toBe(2);
    // Before the person it's about has played, the guess can't score.
    expect(dayPoints({ ...r, picks: { partner: r.picks.partner } }, "partner")).toBe(1);
  });

  it("counts this week, last week and a streak of days you both played", () => {
    const both = (d: string): DuelRecord => ({ date: d, day: day(d), picks: { me: { quiz: [1, 0], guess: 0 }, partner: { quiz: [1, 1], guess: 0 } } });
    const today = "2026-11-13"; // a Friday
    const recs = [both("2026-11-05"), both("2026-11-11"), both("2026-11-12"), { date: today, day: day(today), picks: { me: { quiz: [1, 0], guess: 0 } } }];
    const s = scores(recs, today);
    expect(weekStart(today)).toBe("2026-11-09");
    expect(s.week.me).toBe(6);
    expect(s.lastWeek.me).toBe(2);
    expect(s.streak).toBe(2); // today isn't done by both yet, so it counts from yesterday
  });
});

describe("no repeats", () => {
  it("treats rewordings that only differ in names, case or punctuation as the same question", () => {
    expect(norm("What would Kylee pick tonight?", ["Kylee"])).toBe(norm("what would  pick TONIGHT", []));
  });
  it("alternates who's guessed and moves the theme every week", () => {
    expect(guessAbout("2026-11-13")).not.toBe(guessAbout("2026-11-14"));
    expect(themeFor("ttc", "2026-11-09")).toBe(themeFor("ttc", "2026-11-15"));
    expect(themeFor("ttc", "2026-11-09")).not.toBe(themeFor("ttc", addDays("2026-11-09", 7)));
  });
  it("has a fallback bank with no duplicates and valid answers", () => {
    const seen = new Set(FALLBACK_QUIZ.map((q) => norm(q.q)));
    expect(seen.size).toBe(FALLBACK_QUIZ.length);
    for (const q of FALLBACK_QUIZ) expect(q.answer).toBeLessThan(q.options.length);
  });
});
