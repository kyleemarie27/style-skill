import type { Pixels, Point } from "./stripMeasure.js";

/**
 * Finding the two lines on an LH strip photo without taps. LH dyes are pink/purple: red and
 * blue both well above green. White paper has all three about equal, and most tables (wood, gray,
 * white) don't have that pattern, so "magenta-ness" = min(R, B) − G picks out the lines.
 *
 * 1. Map magenta-ness on a downsampled copy and keep the strongest pixels.
 * 2. The strongest elongated blob is a line; its long axis is the line's direction, and the strip
 *    runs across it.
 * 3. Walk along the strip from that line and find the other line as the next strongest band.
 * Returns both lines (darkest first) in full-resolution coordinates, or null if no line is clear.
 */
export interface Detected {
  /** The darker line and the lighter one (which is C is decided by the caller). */
  dark: Point;
  light: Point | null;
  /** Unit vector along the strip (from one line to the other), for orientation memory. */
  axis: { x: number; y: number };
}

const MAX_SIDE = 400;

export function detectLines(img: Pixels): Detected | null {
  const f = Math.max(1, Math.ceil(Math.max(img.width, img.height) / MAX_SIDE));
  const w = Math.floor(img.width / f), h = Math.floor(img.height / f);
  const mag = new Float32Array(w * h);
  // For the second line: how much darker than white, counted only where the color leans pink
  // (a faint test line is barely pink but clearly darker in green; gray or wood edges aren't pink).
  const dye = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Average the f×f block so noise doesn't win.
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y * f; yy < (y + 1) * f; yy++) {
        for (let xx = x * f; xx < (x + 1) * f; xx++) {
          const i = (yy * img.width + xx) * 4;
          r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
        }
      }
      const hue = Math.min(r, b) / n - g / n;
      mag[y * w + x] = Math.max(0, hue);
      dye[y * w + x] = hue > -3 ? 255 - g / n : 0;
    }
  }
  const sorted = Array.from(mag).sort((a, b) => b - a);
  // The lines are a tiny part of the photo: judge by the strongest handful of pixels.
  const top = sorted[Math.min(5, sorted.length - 1)] ?? 0;
  if (top < 20) return null; // nothing pink enough to be a line
  const thr = Math.max(14, top * 0.45);

  // Connected blobs above the threshold.
  const seen = new Uint8Array(w * h);
  type Blob = { sum: number; n: number; sx: number; sy: number; sxx: number; syy: number; sxy: number };
  const blobs: Blob[] = [];
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || mag[start] < thr) continue;
    const blob: Blob = { sum: 0, n: 0, sx: 0, sy: 0, sxx: 0, syy: 0, sxy: 0 };
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % w, y = (i / w) | 0, v = mag[i];
      blob.sum += v; blob.n++; blob.sx += x * v; blob.sy += y * v; blob.sxx += x * x * v; blob.syy += y * y * v; blob.sxy += x * y * v;
      for (const j of [i - 1, i + 1, i - w, i + w]) {
        if (j < 0 || j >= w * h || seen[j] || mag[j] < thr) continue;
        if ((j === i - 1 && x === 0) || (j === i + 1 && x === w - 1)) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
    if (blob.n >= 4) blobs.push(blob);
  }
  if (!blobs.length) return null;
  blobs.sort((a, b) => b.sum - a.sum);
  const best = blobs[0];

  // The line's direction from its spread (principal axis); the strip runs across it.
  const cx = best.sx / best.sum, cy = best.sy / best.sum;
  const vxx = best.sxx / best.sum - cx * cx, vyy = best.syy / best.sum - cy * cy, vxy = best.sxy / best.sum - cx * cy;
  const angle = 0.5 * Math.atan2(2 * vxy, vxx - vyy);
  const lx = Math.cos(angle), ly = Math.sin(angle); // along the line
  const ax = -ly, ay = lx; // along the strip
  const major = Math.sqrt(Math.max(1, (vxx + vyy) / 2 + Math.sqrt(((vxx - vyy) / 2) ** 2 + vxy ** 2)));
  const halfLen = Math.max(2, major * 1.2);

  // Walk along the strip and find the next band (the other line), excluding the first line itself.
  const reach = Math.max(12, halfLen * 6);
  const at = (x: number, y: number) => {
    const xi = Math.round(x), yi = Math.round(y);
    return xi < 0 || yi < 0 || xi >= w || yi >= h ? 0 : dye[yi * w + xi];
  };
  const prof: { s: number; v: number }[] = [];
  for (let s = -reach; s <= reach; s++) {
    let v = 0, n = 0;
    for (let t = -halfLen * 0.6; t <= halfLen * 0.6; t++) {
      v += at(cx + ax * s + lx * t, cy + ay * s + ly * t);
      n++;
    }
    prof.push({ s, v: v / n });
  }
  const width = Math.max(2, Math.sqrt(Math.max(0.5, (vxx + vyy) / 2 - Math.sqrt(((vxx - vyy) / 2) ** 2 + vxy ** 2))) * 3);
  let second: { s: number; v: number } | null = null;
  for (let k = 1; k < prof.length - 1; k++) {
    const p = prof[k];
    if (Math.abs(p.s) <= width + 1) continue;
    const isPeak = p.v >= prof[k - 1].v && p.v >= prof[k + 1].v;
    if (isPeak && (!second || p.v > second.v)) second = p;
  }
  // A second line needs to stand out from the paper around it, even if faint.
  const peakV = prof.find((p) => p.s === 0)?.v ?? 1;
  const floor = prof.filter((p) => Math.abs(p.s) > width + 1).map((p) => p.v).sort((a, b) => a - b)[Math.floor(prof.length * 0.3)] ?? 0;
  const lightOk = second && second.v - floor > Math.max(4, (peakV - floor) * 0.06);

  const full = (x: number, y: number): Point => ({ x: Math.round((x + 0.5) * f), y: Math.round((y + 0.5) * f) });
  const dark = full(cx, cy);
  const light = lightOk ? full(cx + ax * second!.s, cy + ay * second!.s) : null;
  const dir = light ? { x: light.x - dark.x, y: light.y - dark.y } : { x: ax, y: ay };
  const len = Math.hypot(dir.x, dir.y) || 1;
  return { dark, light, axis: { x: dir.x / len, y: dir.y / len } };
}

/**
 * Which detected line is the control. With a remembered orientation (the direction from C to T in
 * earlier photos), follow it; otherwise the darker line is the control (true except near a peak).
 */
export function assignCT(d: Detected, remembered: { x: number; y: number } | null): { c: Point; t: Point } | null {
  if (!d.light) return null;
  if (remembered) {
    const v = { x: d.light.x - d.dark.x, y: d.light.y - d.dark.y };
    const dot = v.x * remembered.x + v.y * remembered.y;
    return dot >= 0 ? { c: d.dark, t: d.light } : { c: d.light, t: d.dark };
  }
  return { c: d.dark, t: d.light };
}
