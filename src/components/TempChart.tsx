import { addDays, diffDays, prettyDate } from "../../shared/dates";
import { SHIFT_RISE, type ThermalShift, type WearableDay } from "../../shared/wearable";

const fmt = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}°C`;

/**
 * Nightly temperature for one cycle (Oura's deviation from your own baseline), with the shift
 * Bloom found: the baseline it compared against, the high nights shaded, ovulation dashed,
 * the LH peak marked on the axis and ♥ days along the bottom.
 */
export function TempChart({ nights, start, days, shift, lhPeak, ovulation, loveDates }: {
  nights: WearableDay[];
  start: string;
  days: number;
  shift: ThermalShift | null;
  lhPeak: string | null;
  ovulation: string | null;
  loveDates: string[];
}) {
  const W = 640;
  const H = 200;
  const pad = { l: 44, r: 8, t: 10, b: 36 };
  const pts = nights
    .filter((n) => n.tempDev !== null)
    .map((n) => [diffDays(n.date, start), n.tempDev!] as const)
    .filter(([i]) => i >= 0 && i < days);
  if (pts.length < 2) return <p className="muted small">No Oura temperature for this cycle yet.</p>;

  const vals = pts.map(([, v]) => v).concat(shift ? [shift.baseline] : []);
  const lo = Math.floor((Math.min(...vals) - 0.15) * 10) / 10;
  const hi = Math.ceil((Math.max(...vals) + 0.15) * 10) / 10;
  const x = (i: number) => pad.l + (i / Math.max(1, days - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const ticks = [lo, (lo + hi) / 2, hi].map((v) => Math.round(v * 10) / 10);
  // Break the line where a night is missing, so gaps read as gaps.
  let path = "";
  pts.forEach(([i, v], k) => {
    const joined = k > 0 && i - pts[k - 1][0] === 1;
    path += `${joined ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
  });
  const rel = (d: string | null) => (d ? diffDays(d, start) : null);
  const ovI = rel(ovulation);
  const peakI = rel(lhPeak);
  const highFrom = shift ? rel(shift.firstHigh)! : null;
  const inRange = (i: number | null): i is number => i !== null && i >= 0 && i < days;
  const axisY = H - pad.b;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Nightly temperature by cycle day${shift ? `, rise of ${fmt(shift.rise)} from ${prettyDate(shift.firstHigh)}` : ", no sustained rise yet"}`}>
      {inRange(highFrom) && (
        <rect x={x(highFrom) - 4} y={pad.t} width={W - pad.r - x(highFrom) + 4} height={axisY - pad.t} fill="var(--luteal-soft)" opacity="0.7" rx="4" />
      )}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pad.l - 6} y={y(v) + 3} textAnchor="end">{v > 0 ? "+" : ""}{v.toFixed(1)}°</text>
        </g>
      ))}
      {shift && (
        <>
          <line x1={pad.l} x2={W - pad.r} y1={y(shift.baseline)} y2={y(shift.baseline)} stroke="var(--muted)" strokeDasharray="2 3" />
          <line x1={pad.l} x2={W - pad.r} y1={y(shift.baseline + SHIFT_RISE)} y2={y(shift.baseline + SHIFT_RISE)} stroke="var(--luteal)" strokeDasharray="5 3" opacity="0.8" />
        </>
      )}
      {inRange(ovI) && <line x1={x(ovI)} x2={x(ovI)} y1={pad.t} y2={axisY} stroke="var(--ovulation)" strokeDasharray="4 3" />}
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([i, v]) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="4" fill={highFrom !== null && i >= highFrom ? "var(--luteal)" : "var(--brand)"} stroke="var(--surface)" strokeWidth="2" />
          <circle cx={x(i)} cy={y(v)} r="11" fill="transparent">
            <title>{`${prettyDate(addDays(start, i), true)} (CD${i + 1}): ${fmt(v)}`}</title>
          </circle>
        </g>
      ))}
      {inRange(peakI) && (
        <g>
          <path d={`M${x(peakI)},${axisY - 9} l5,9 h-10 z`} fill="var(--ovulation)" />
          <title>{`LH peak ${prettyDate(lhPeak!)}`}</title>
        </g>
      )}
      {loveDates.map((d) => rel(d)).filter(inRange).map((i) => (
        <text key={`l${i}`} x={x(i)} y={axisY + 13} textAnchor="middle" style={{ fontSize: 11, fill: "var(--brand)" }}>♥</text>
      ))}
      {Array.from({ length: days }, (_, i) => i)
        .filter((i) => i % 5 === 0 || i === days - 1)
        .map((i) => (
          <text key={i} x={x(i)} y={H - 4} textAnchor={i === days - 1 ? "end" : i === 0 ? "start" : "middle"}>CD{i + 1}</text>
        ))}
    </svg>
  );
}

/** A tiny line of the last nights, for the Temperature tile. Text next to it carries the value. */
export function TempSpark({ values, highFrom }: { values: (number | null)[]; highFrom?: number | null }) {
  const pts = values.map((v, i) => [i, v] as const).filter((p): p is readonly [number, number] => p[1] !== null);
  if (pts.length < 3) return null;
  const W = 96;
  const H = 22;
  const lo = Math.min(...pts.map((p) => p[1])) - 0.05;
  const hi = Math.max(...pts.map((p) => p[1])) + 0.05;
  const x = (i: number) => 2 + (i / Math.max(1, values.length - 1)) * (W - 4);
  const y = (v: number) => 2 + (1 - (v - lo) / (hi - lo)) * (H - 4);
  const d = pts.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = pts.at(-1)!;
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden>
      {highFrom != null && highFrom >= 0 && <rect x={x(highFrom) - 2} y="0" width={W - x(highFrom) + 2} height={H} fill="var(--luteal-soft)" rx="3" />}
      <path d={d} fill="none" stroke="var(--brand)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last[0])} cy={y(last[1])} r="2.6" fill="var(--brand)" />
    </svg>
  );
}
