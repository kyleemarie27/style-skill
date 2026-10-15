import { describe, expect, it } from "vitest";
import { actionLabel, mergeLog, parseAnswer } from "../src/lib/chatActions";

describe("chat actions", () => {
  it("pulls save suggestions out of an answer and hides the markup", () => {
    const { text, actions } = parseAnswer(
      'Rest up.\n[[bloom:{"type":"log","date":"2026-10-15","pain":"mild","symptoms":["Fatigue"]}]]\n[[bloom:{"type":"question","text":"Is this normal?"}]]',
    );
    expect(text).toBe("Rest up.");
    expect(actions).toEqual([
      { type: "log", date: "2026-10-15", pain: "mild", symptoms: ["Fatigue"] },
      { type: "question", text: "Is this normal?" },
    ]);
  });

  it("hides a tag that is still streaming in, and drops malformed or empty ones", () => {
    expect(parseAnswer('Hi\n[[bloom:{"type":"que').text).toBe("Hi");
    expect(parseAnswer("Hi\n[").text).toBe("Hi\n[".trim());
    const { actions } = parseAnswer('[[bloom:{oops}]][[bloom:{"type":"log","date":"2026-10-15"}]][[bloom:{"type":"appointment","date":"soon","title":"Scan"}]]');
    expect(actions).toEqual([]);
  });

  it("merges into an existing day without wiping it", () => {
    const merged = mergeLog(
      { date: "2026-10-15", symptoms: ["Bloating"], mood: "Calm", preg: { nausea: "mild", prenatal: true } },
      { type: "log", date: "2026-10-15", symptoms: ["Fatigue", "Bloating"], mood: "Anxious", pain: "mild" },
      true,
    );
    expect(merged.symptoms).toEqual(["Bloating", "Fatigue"]);
    expect(merged.mood).toBe("Calm, Anxious");
    expect(merged.preg).toEqual({ nausea: "mild", prenatal: true, pain: "mild" });
  });

  it("describes each action in plain words", () => {
    expect(actionLabel({ type: "log", date: "2026-10-15", nausea: "moderate", symptoms: ["Fatigue"] })).toMatch(/nausea moderate, fatigue/);
  });
});
