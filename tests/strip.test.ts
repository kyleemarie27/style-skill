import { describe, expect, it } from "vitest";
import { measureStrip, type Pixels } from "../shared/stripMeasure";

/** A synthetic vertical strip: off-white paper, a control line, and a test line at `k` × the control's darkness. */
function strip(k: number, opts: { noise?: number; tint?: number; seed?: number } = {}): Pixels {
  const width = 60, height = 200;
  const data = new Uint8ClampedArray(width * height * 4);
  let seed = opts.seed ?? 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) - 0.5;
  const paper = [246 - (opts.tint ?? 0), 244 - (opts.tint ?? 0), 240 - (opts.tint ?? 0)];
  const line = [188, 62, 118]; // pink-purple dye
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let c = paper;
      const inStrip = x >= 15 && x <= 45;
      if (inStrip && y >= 60 && y <= 64) c = line;
      if (inStrip && y >= 120 && y <= 124) c = paper.map((p, i) => p - k * (p - line[i]));
      const i = (y * width + x) * 4;
      for (let ch = 0; ch < 3; ch++) data[i + ch] = c[ch] + (opts.noise ?? 0) * rand();
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("measuring an LH strip from pixels", () => {
  it("reads the test line against the control line, on Premom's scale", () => {
    for (const k of [0, 0.2, 0.5, 0.8, 1, 1.3]) {
      expect(measureStrip(strip(k), { x: 30, y: 62 }, { x: 30, y: 122 }).ratio).toBeCloseTo(Math.min(k, 2), 1);
    }
  });

  it("gives exactly the same answer every time for the same photo", () => {
    const img = strip(0.62, { noise: 10 });
    const a = measureStrip(img, { x: 30, y: 62 }, { x: 30, y: 122 });
    for (let i = 0; i < 5; i++) expect(measureStrip(img, { x: 30, y: 62 }, { x: 30, y: 122 })).toEqual(a);
  });

  it("doesn't care if a tap is a few pixels off", () => {
    const img = strip(0.62, { noise: 6 });
    const base = measureStrip(img, { x: 30, y: 62 }, { x: 30, y: 122 }).ratio;
    for (const [c, t] of [[[27, 59], [33, 125]], [[34, 65], [26, 119]], [[30, 60], [30, 124]]] as const) {
      expect(Math.abs(measureStrip(img, { x: c[0], y: c[1] }, { x: t[0], y: t[1] }).ratio - base)).toBeLessThanOrEqual(0.03);
    }
  });

  it("holds up to a warmer or darker photo (the background is measured, not assumed)", () => {
    const a = measureStrip(strip(0.5), { x: 30, y: 62 }, { x: 30, y: 122 }).ratio;
    const b = measureStrip(strip(0.5, { tint: 40 }), { x: 30, y: 62 }, { x: 30, y: 122 }).ratio;
    expect(Math.abs(a - b)).toBeLessThanOrEqual(0.05);
  });

  it("refuses to guess when the control line is too faint", () => {
    const img = strip(0.5);
    // Tap blank paper instead of the control line.
    expect(measureStrip(img, { x: 30, y: 20 }, { x: 30, y: 122 }).quality).toBe("faint-control");
    expect(measureStrip(img, { x: 30, y: 62 }, { x: 31, y: 63 }).quality).toBe("too-close");
  });
});
