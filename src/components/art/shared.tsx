import type { JSX } from "react";

export type ArtMap = Record<string, () => JSX.Element>;

/** Soft highlight that gives flat shapes a bit of roundness. */
export function Shine({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity="0.35" />;
}

/** A friendly eye: dark pupil with a glint. */
export function Eye({ cx, cy, r = 3.2 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#2b2230" />
      <circle cx={cx + r * 0.35} cy={cy - r * 0.35} r={r * 0.35} fill="#fff" />
    </g>
  );
}

/** Rosy cheek. */
export function Cheek({ cx, cy }: { cx: number; cy: number }) {
  return <ellipse cx={cx} cy={cy} rx="4.5" ry="3" fill="#f28b9b" opacity="0.55" />;
}
