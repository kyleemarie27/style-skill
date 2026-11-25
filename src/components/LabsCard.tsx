import { useMemo, useState } from "react";
import { prettyDate } from "../../shared/dates";
import type { LabResult } from "../lib/api";
import { useStore } from "../lib/store";

/** Personal targets that override a lab's own range for display. */
const TARGETS: Record<string, [number, number]> = { "vitamin d": [60, 80] };

/** "LDL (calc, NIH)" and "LDL (calc)" are the same test for trends. */
const base = (t: string) => t.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();

type Dot = "ok" | "watch" | "none" | "pending";

function dotFor(r: LabResult): Dot {
  if (r.status === "pending") return "pending";
  if (r.flag) return "watch";
  const v = r.valueNum;
  const target = Object.entries(TARGETS).find(([k]) => base(r.test).startsWith(k))?.[1];
  if (v !== null && target) return v >= target[0] && v <= target[1] ? "ok" : "watch";
  if (v !== null && (r.refLow !== null || r.refHigh !== null)) return (r.refLow === null || v >= r.refLow) && (r.refHigh === null || v <= r.refHigh) ? "ok" : "watch";
  if (r.valueText && /non.?reactive|negative|immune/i.test(r.valueText)) return "ok";
  return "none";
}

/** Labs as dots and trend lines; tap a panel to open it, tap a test to ask about it. */
export function LabsCard() {
  const { labs } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const latestDate = labs.length ? [...labs].sort((a, b) => b.date.localeCompare(a.date))[0].date : null;
  const panels = useMemo(() => {
    if (!latestDate) return [];
    // The latest draw, grouped by panel; earlier values feed the trend lines.
    const latest = labs.filter((r) => r.date === latestDate);
    const byPanel = new Map<string, LabResult[]>();
    for (const r of latest) {
      const k = r.panel ?? "Other";
      byPanel.set(k, [...(byPanel.get(k) ?? []), r]);
    }
    const order = ["Reproductive", "Thyroid", "Nutrients", "Metabolic", "Lipids", "CBC", "CMP", "Infectious/Immunity", "Other"];
    return [...byPanel.entries()].sort((a, b) => (order.indexOf(a[0]) + 99) % 99 - (order.indexOf(b[0]) + 99) % 99);
  }, [labs, latestDate]);
  if (!latestDate) return null;
  const history = (r: LabResult) => labs.filter((x) => base(x.test) === base(r.test) && x.valueNum !== null).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="card stack">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <h2>Labs</h2>
        <span className="tiny muted">{prettyDate(latestDate)}, {latestDate.slice(0, 4)}</span>
      </div>
      {panels.map(([panel, rows]) => {
        const dots = rows.map(dotFor);
        const isOpen = open === panel;
        return (
          <div key={panel} className="lab-panel">
            <button className="lab-panel-head" onClick={() => setOpen(isOpen ? null : panel)} aria-expanded={isOpen}>
              <b className="small">{panel}</b>
              <span className="lab-dots" aria-hidden>{dots.map((d, i) => <i key={i} className={`ld-${d}`} />)}</span>
            </button>
            {isOpen && (
              <div className="lab-rows">
                {rows.map((r) => {
                  const h = history(r);
                  return (
                    <a key={r.id} className="lab-row" href={`#/ask/${encodeURIComponent(`What does my ${r.test} of ${r.valueText ?? r.valueNum ?? "pending"} ${r.unit ?? ""} mean?`)}`}>
                      <i className={`ld-${dotFor(r)}`} />
                      <span className="small">{r.test}</span>
                      {h.length >= 2 ? <Trend points={h.map((x) => x.valueNum!)} /> : <span />}
                      <b className="small">{r.status === "pending" ? "pending" : (r.valueText ?? r.valueNum)}<span className="tiny muted"> {r.unit ?? ""}</span></b>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <div className="legend tiny"><span><i className="ld-ok" />In range</span><span><i className="ld-watch" />Outside range</span><span><i className="ld-none" />No range</span><span><i className="ld-pending" />Pending</span></div>
    </div>
  );
}

function Trend({ points }: { points: number[] }) {
  const W = 56, H = 18;
  const lo = Math.min(...points), hi = Math.max(...points);
  const x = (i: number) => 2 + (i / (points.length - 1)) * (W - 4);
  const y = (v: number) => (hi === lo ? H / 2 : 2 + (1 - (v - lo) / (hi - lo)) * (H - 4));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <path d={points.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(points.at(-1)!)} r="2.2" fill="var(--brand)" />
    </svg>
  );
}
