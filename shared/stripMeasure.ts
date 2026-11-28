/**
 * Measuring an LH strip from its photo, the way Premom's scale is defined: T/C = how dark the
 * test line is ÷ how dark the control line is, each measured against the strip's own background.
 * Pure arithmetic on pixels, so the same photo and the same two taps always give the same number.
 *
 * You tap near the control line and near the test line. Bloom samples a band along the line
 * between the taps (a little past each end, to see background), finds the darkest point near
 * each tap (so a tap a few pixels off gives the same answer), and compares line darkness with
 * the background between and around the lines. Darkness is read in the green channel, which
 * the pink/purple dye absorbs most; that's where the line stands out from the paper.
 */
export interface Pixels {
  width: number;
  height: number;
  /** RGBA, row by row (ImageData.data). */
  data: Uint8ClampedArray | number[];
}

export interface Point {
  x: number;
  y: number;
}

export interface StripMeasurement {
  /** T/C ratio on Premom's scale, 2 decimals. */
  ratio: number;
  /** How far each line stands out from the background (0–255 green-channel units). */
  control: number;
  test: number;
  background: number;
  /** Where the darkest points were found (refined taps), so they can be shown and reused. */
  controlAt: Point;
  testAt: Point;
  /** "good", or why the number shouldn't be trusted. */
  quality: "good" | "faint-control" | "too-close" | "off-strip";
  /** The control line's color, for drawing the benchmark in the strip's own color. */
  controlColor: [number, number, number];
  /** Darkness along the strip, for a small profile chart (index 0 = past the control end). */
  profile: number[];
}

/** Control lines dimmer than this (in 0–255 units above background) are too faint to measure against. */
const MIN_CONTROL = 14;

function px(img: Pixels, x: number, y: number): [number, number, number] {
  const xi = Math.min(img.width - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(img.height - 1, Math.max(0, Math.round(y)));
  const i = (yi * img.width + xi) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function measureStrip(img: Pixels, control: Point, test: Point): StripMeasurement {
  const dx = test.x - control.x;
  const dy = test.y - control.y;
  const D = Math.hypot(dx, dy);
  const empty = (quality: StripMeasurement["quality"]): StripMeasurement => ({
    ratio: 0, control: 0, test: 0, background: 0, controlAt: control, testAt: test, quality, controlColor: [200, 80, 120], profile: [],
  });
  if (D < 8) return empty("too-close");
  const ux = dx / D, uy = dy / D; // along the strip, control → test
  const vx = -uy, vy = ux; // across the strip
  const halfWidth = Math.max(3, Math.round(D * 0.12)); // band across the line
  const from = -Math.round(D * 0.6), to = Math.round(D * 1.6);

  // Darkness profile along the strip: 255 − mean green across the band.
  const profile: number[] = [];
  for (let s = from; s <= to; s++) {
    let g = 0, n = 0;
    for (let w = -halfWidth; w <= halfWidth; w++) {
      const x = control.x + ux * s + vx * w;
      const y = control.y + uy * s + vy * w;
      if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
      g += px(img, x, y)[1];
      n++;
    }
    profile.push(n ? 255 - g / n : NaN);
  }
  const at = (s: number) => profile[s - from];
  if (profile.filter((v) => Number.isNaN(v)).length > profile.length / 2) return empty("off-strip");

  // The darkest point near each tap, averaged over 3 pixels so one noisy pixel can't swing it.
  const search = Math.max(3, Math.round(D * 0.15));
  const peak = (center: number) => {
    let best = center, bestV = -Infinity;
    for (let s = center - search; s <= center + search; s++) {
      const v = (at(s - 1) + at(s) + at(s + 1)) / 3;
      if (Number.isFinite(v) && v > bestV) { bestV = v; best = s; }
    }
    return { s: best, v: bestV };
  };
  const c = peak(0);
  const t = peak(Math.round(D));

  // Background: the strip away from both lines (between them and past each end).
  const guard = Math.max(3, Math.round(D * 0.22));
  const bgVals: number[] = [];
  for (let s = from; s <= to; s++) {
    const v = at(s);
    if (!Number.isFinite(v)) continue;
    if (Math.abs(s - c.s) <= guard || Math.abs(s - t.s) <= guard) continue;
    bgVals.push(v);
  }
  const background = bgVals.length ? median(bgVals) : Math.min(...profile.filter(Number.isFinite));
  const cDark = Math.max(0, c.v - background);
  const tDark = Math.max(0, t.v - background);
  const point = (s: number): Point => ({ x: Math.round(control.x + ux * s), y: Math.round(control.y + uy * s) });
  const controlAt = point(c.s);

  // The control line's own color, averaged over a small patch, for the benchmark drawing.
  let r = 0, g = 0, b = 0, n = 0;
  for (let w = -halfWidth; w <= halfWidth; w++) {
    const [pr, pg, pb] = px(img, controlAt.x + vx * w, controlAt.y + vy * w);
    r += pr; g += pg; b += pb; n++;
  }
  const controlColor: [number, number, number] = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];

  return {
    ratio: cDark >= MIN_CONTROL ? Math.min(2, Math.round((tDark / cDark) * 100) / 100) : 0,
    control: Math.round(cDark),
    test: Math.round(tDark),
    background: Math.round(background),
    controlAt,
    testAt: point(t.s),
    quality: cDark < MIN_CONTROL ? "faint-control" : "good",
    controlColor,
    profile: profile.map((v) => (Number.isFinite(v) ? Math.round(Math.max(0, v - background)) : 0)),
  };
}

/** A short, stable fingerprint of a photo, so the same photo always gets the same saved reading. */
export async function photoHash(dataUrl: string): Promise<string> {
  const bytes = new TextEncoder().encode(dataUrl);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].slice(0, 16).map((x) => x.toString(16).padStart(2, "0")).join("");
}
