import { addDays, diffDays, prettyDate } from "../../shared/dates";
import { LH_BANDS } from "../../shared/lh";
import type { LhTest } from "../../shared/types";

/** Premom-style LH curve for one cycle: max reading per day, with High/Peak bands. */
export function LhChart({ tests, start, days, ovulation }: { tests: LhTest[]; start: string; days: number; ovulation?: string | null }) {
  const W = 640;
  const H = 180;
  const pad = { l: 30, r: 8, t: 10, b: 22 };
  const maxY = 1.6;
  const byDay = new Map<number, number>();
  for (const t of tests) {
    const i = diffDays(t.date, start);
    if (i < 0 || i >= days) continue;
    const v = t.ratio ?? (t.level === "peak" ? 1.1 : t.level === "high" ? 0.7 : 0.2);
    byDay.set(i, Math.max(byDay.get(i) ?? 0, v));
  }
  const x = (i: number) => pad.l + (i / Math.max(1, days - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - Math.min(v, maxY) / maxY) * (H - pad.t - pad.b);
  const pts = [...byDay.entries()].sort((a, b) => a[0] - b[0]);
  const path = pts.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ovI = ovulation ? diffDays(ovulation, start) : null;

  if (!pts.length) return <p className="muted small">No LH readings in this cycle yet.</p>;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="LH readings by cycle day">
      <rect x={pad.l} y={y(maxY)} width={W - pad.l - pad.r} height={y(LH_BANDS.peak) - y(maxY)} fill="var(--period-soft)" opacity="0.6" />
      <rect x={pad.l} y={y(LH_BANDS.peak)} width={W - pad.l - pad.r} height={y(LH_BANDS.high) - y(LH_BANDS.peak)} fill="var(--fertile-soft)" opacity="0.6" />
      {[0, 0.5, 1, 1.5].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pad.l - 6} y={y(v) + 3} textAnchor="end">{v.toFixed(1)}</text>
        </g>
      ))}
      {ovI !== null && ovI >= 0 && ovI < days && (
        <line x1={x(ovI)} x2={x(ovI)} y1={pad.t} y2={H - pad.b} stroke="var(--ovulation)" strokeDasharray="4 3" />
      )}
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinejoin="round" />
      {pts.map(([i, v]) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="4" fill={v >= LH_BANDS.peak ? "var(--peak)" : v >= LH_BANDS.high ? "var(--high)" : "var(--low)"} stroke="var(--surface)" strokeWidth="1.5">
          <title>{`${prettyDate(addDays(start, i))} (CD${i + 1}): ${v.toFixed(2)}`}</title>
        </circle>
      ))}
      {Array.from({ length: days }, (_, i) => i)
        .filter((i) => i % 5 === 0 || i === days - 1)
        .map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle">CD{i + 1}</text>
        ))}
    </svg>
  );
}
