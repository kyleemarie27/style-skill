import { describe, expect, it } from "vitest";
import {
  fillName, HOW_TO_HELP, MOMENTS, partnerFeeling, partnerItems, partnerMove, todaysPrompt, WEEKS,
} from "../src/content/pregnancy";
import { TOP_SYMPTOMS } from "../src/lib/symptoms";

describe("today's question", () => {
  it("has a filled-in prompt for every day of the pregnancy", () => {
    for (let d = 28; d <= 42 * 7 + 6; d++) {
      const p = todaysPrompt(d, "Ty");
      expect(p.t.length, `day ${d}`).toBeGreaterThan(10);
      expect(p.t, `day ${d}`).not.toMatch(/\{/);
    }
  });

  it("puts each moment on its own day and shows it then", () => {
    const keys = MOMENTS.map((m) => `${m.week}-${m.day}`);
    expect(new Set(keys).size).toBe(keys.length);
    const letter = MOMENTS.find((m) => m.week === 8)!;
    expect(todaysPrompt(8 * 7 + letter.day)).toMatchObject({ moment: true });
    expect(todaysPrompt(8 * 7 + letter.day).t).toMatch(/letter/i);
  });

  it("uses the partner's name, or 'your partner' when there isn't one", () => {
    const date = MOMENTS.find((m) => m.p.t.includes("{partner}"))!;
    const day = date.week * 7 + date.day;
    expect(todaysPrompt(day, "Ty").t).toContain("Ty");
    expect(todaysPrompt(day, null).t).toContain("your partner");
  });

  it("changes from day to day", () => {
    const week = Array.from({ length: 7 }, (_, d) => todaysPrompt(15 * 7 + d).t);
    expect(new Set(week).size).toBe(7);
  });
});

describe("partner view", () => {
  it("has a role, a daily move and a feeling for every week", () => {
    for (const w of WEEKS) {
      expect(partnerItems(w, "Kylee").length, `week ${w.week}`).toBeGreaterThan(0);
      for (let d = 0; d < 7; d++) expect(partnerMove(w.week * 7 + d).t).toBeTruthy();
      expect(partnerFeeling(w.week).t).toBeTruthy();
    }
  });

  it("knows how to help with every built-in symptom", () => {
    for (const s of [...TOP_SYMPTOMS, "Spotting", "Cramping"]) expect(HOW_TO_HELP[s], s).toBeTruthy();
  });

  it("fills names without leaving placeholders", () => {
    expect(fillName("Refill {name}'s water bottle.", "Kylee")).toBe("Refill Kylee's water bottle.");
    expect(fillName("{name} needs rest.", "")).toBe("Your partner needs rest.");
    expect(fillName("Take something off your partner's plate.", "Kylee", true)).toBe("Take something off Kylee's plate.");
  });
});

describe("partner's question", () => {
  it("has a filled-in prompt for every day, separate from hers", () => {
    let differs = 0;
    for (let d = 28; d <= 42 * 7 + 6; d++) {
      const p = todaysPrompt(d, "Kylee", "partner");
      expect(p.t, `day ${d}`).not.toMatch(/\{/);
      if (p.t !== todaysPrompt(d, "Ty", "me").t) differs++;
    }
    expect(differs).toBeGreaterThan(200);
  });
});
