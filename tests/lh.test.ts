import { describe, expect, it } from "vitest";
import { levelForRatio, levelFromText, normalizeRatio } from "../shared/lh";
import { normalizeDate } from "../shared/dates";

describe("Premom LH scale", () => {
  it("bands ratios into Low / High / Peak", () => {
    expect(levelForRatio(0)).toBe("low");
    expect(levelForRatio(0.49)).toBe("low");
    expect(levelForRatio(0.5)).toBe("high");
    expect(levelForRatio(0.99)).toBe("high");
    expect(levelForRatio(1)).toBe("peak");
    expect(levelForRatio(1.6)).toBe("peak");
  });

  it("normalizes percentage-style readings", () => {
    expect(normalizeRatio("85%")).toBe(0.85);
    expect(normalizeRatio(120)).toBe(1.2);
    expect(normalizeRatio("0.62")).toBe(0.62);
    expect(normalizeRatio("")).toBeNull();
    expect(normalizeRatio("n/a")).toBeNull();
  });

  it("reads level words", () => {
    expect(levelFromText("PEAK")).toBe("peak");
    expect(levelFromText("High")).toBe("high");
    expect(levelFromText("Negative")).toBe("low");
    expect(levelFromText("")).toBeNull();
  });
});

describe("normalizeDate", () => {
  it("handles common export date formats", () => {
    expect(normalizeDate("2025-03-04T00:00:00Z")).toBe("2025-03-04");
    expect(normalizeDate("2025/3/4")).toBe("2025-03-04");
    expect(normalizeDate("03/04/2025")).toBe("2025-03-04"); // US
    expect(normalizeDate("25/04/2025")).toBe("2025-04-25"); // clearly D/M
    expect(normalizeDate(45720)).toBe("2025-03-04"); // Excel serial
    expect(normalizeDate("nope")).toBeNull();
  });
});
