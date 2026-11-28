import { describe, expect, it } from "vitest";
import { assignCT, detectLines } from "../shared/stripDetect";
import { measureStrip, type Pixels } from "../shared/stripMeasure";

/** A photo: table, a strip, a control line and a test line at `k` × the control's darkness. */
function photo(opts: { k: number; horizontal?: boolean; table?: [number, number, number]; size?: [number, number]; testFirst?: boolean }): { img: Pixels; c: [number, number]; t: [number, number] } {
  const [W, H] = opts.size ?? [900, 600];
  const data = new Uint8ClampedArray(W * H * 4);
  const table = opts.table ?? [190, 188, 180];
  const paper = [244, 240, 233], line = [186, 64, 120];
  const testCol = paper.map((p, i) => p - opts.k * (p - line[i]));
  // Strip and lines, in "strip coordinates" (u along the strip, v across it).
  const horiz = opts.horizontal ?? true;
  const cU = opts.testFirst ? 470 : 440, tU = opts.testFirst ? 440 : 470;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = horiz ? x : y, v = horiz ? y - H / 2 : x - W / 2;
    let col: number[] = table;
    if (Math.abs(v) <= 22 && u > 150 && u < (horiz ? W : H) - 150) {
      col = paper;
      if (Math.abs(u - cU) <= 2) col = line;
      if (Math.abs(u - tU) <= 2 && opts.k > 0) col = testCol;
    }
    const i = (y * W + x) * 4;
    data[i] = col[0]; data[i + 1] = col[1]; data[i + 2] = col[2]; data[i + 3] = 255;
  }
  const pt = (u: number): [number, number] => (horiz ? [u, H / 2] : [W / 2, u]);
  return { img: { width: W, height: H, data }, c: pt(cU), t: pt(tU) };
}
const near = (p: { x: number; y: number }, q: [number, number], tol = 6) => Math.hypot(p.x - q[0], p.y - q[1]) <= tol;

describe("finding the lines on a strip photo", () => {
  it("finds both lines on a horizontal or a vertical strip", () => {
    for (const horizontal of [true, false]) {
      const s = photo({ k: 0.5, horizontal, size: horizontal ? [900, 600] : [600, 900] });
      const d = detectLines(s.img)!;
      expect(near(d.dark, s.c)).toBe(true);
      expect(near(d.light!, s.t)).toBe(true);
    }
  });

  it("finds a faint test line too", () => {
    const s = photo({ k: 0.15 });
    const d = detectLines(s.img)!;
    expect(near(d.light!, s.t)).toBe(true);
  });

  it("isn't fooled by a warm wood table", () => {
    const s = photo({ k: 0.4, table: [176, 132, 92] });
    const d = detectLines(s.img)!;
    expect(near(d.dark, s.c)).toBe(true);
    expect(near(d.light!, s.t)).toBe(true);
  });

  it("returns no second line when there isn't one", () => {
    expect(detectLines(photo({ k: 0 }).img)?.light).toBeNull();
  });

  it("measures the same ratio as careful taps", () => {
    const s = photo({ k: 0.62 });
    const ct = assignCT(detectLines(s.img)!, null)!;
    expect(measureStrip(s.img, ct.c, ct.t).ratio).toBeCloseTo(0.62, 1);
  });

  it("uses the remembered orientation near a peak, when the test line is the darker one", () => {
    const s = photo({ k: 1.3, testFirst: false });
    const d = detectLines(s.img)!;
    // Without memory it would take the darker (test) line as C; with memory (T is to the right of C) it doesn't.
    const remembered = { x: 1, y: 0 };
    const ct = assignCT(d, remembered)!;
    expect(near(ct.c, s.c)).toBe(true);
    expect(near(ct.t, s.t)).toBe(true);
    expect(measureStrip(s.img, ct.c, ct.t).ratio).toBeGreaterThan(1);
  });
});
