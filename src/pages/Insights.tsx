import { useMemo, useState } from "react";
import { addDays, diffDays, localToday, prettyDate } from "../../shared/dates";
import { LhChart } from "../components/LhChart";
import { useStore } from "../lib/store";

export function InsightsPage() {
  const { model, lhTests, dayLogs } = useStore();
  const cycles = model.cycles;
  const [sel, setSel] = useState(cycles.length - 1);
  const today = localToday();

  const rows = useMemo(
    () =>
      cycles
        .map((c) => {
          const len = c.length ?? diffDays(today, c.start) + 1;
          const fs = addDays(c.ovulation, -5);
          const fe = addDays(c.ovulation, 1);
          const loveInWindow = dayLogs.filter((d) => d.intercourse && d.date >= fs && d.date <= fe).length;
          return { c, len, loveInWindow, periodLen: diffDays(c.periodEnd, c.start) + 1, ovDay: diffDays(c.ovulation, c.start) + 1 };
        })
        .reverse(),
    [cycles, dayLogs, today],
  );

  if (!cycles.length) {
    return (
      <div className="stack">
        <h1>Insights</h1>
        <div className="card stack">
          <p className="muted">Once you log a couple of periods (or import your history) you'll see your patterns here.</p>
          <a className="btn primary" href="#/import">Import history</a>
        </div>
      </div>
    );
  }

  const selected = cycles[Math.max(0, Math.min(sel, cycles.length - 1))];
  const selLen = selected.length ?? Math.max(model.avgCycleLength, diffDays(today, selected.start) + 1);
  const maxLen = Math.max(...rows.map((r) => r.len), model.avgCycleLength);
  const lhCycles = cycles.filter((c) => c.lhPeak).length;

  return (
    <div className="stack">
      <h1>Insights</h1>
      <div className="grid2">
        <div className="stat"><b>{model.avgCycleLength}</b><span>avg cycle length (days)</span></div>
        <div className="stat"><b>{model.avgPeriodLength}</b><span>avg period length (days)</span></div>
        <div className="stat"><b>{model.typicalOvulationDay ? `CD ${model.typicalOvulationDay}` : "—"}</b><span>typical ovulation (from LH)</span></div>
        <div className="stat"><b>{model.avgLutealLength}</b><span>luteal phase (days){lhCycles < 2 ? ", default" : ""}</span></div>
      </div>

      <div className="card stack">
        <div className="row between wrap">
          <h2>LH curve</h2>
          <select value={sel} onChange={(e) => setSel(Number(e.target.value))} style={{ width: "auto" }}>
            {cycles.map((c, i) => (
              <option key={c.start} value={i}>
                {prettyDate(c.start)}{i === cycles.length - 1 ? " (current)" : ""}
              </option>
            ))}
          </select>
        </div>
        <LhChart tests={lhTests} start={selected.start} days={selLen} ovulation={selected.ovulationConfirmed ? selected.ovulation : null} />
        <p className="tiny muted">Premom scale: yellow band = High (0.5–0.99), pink band = Peak (≥1.0). Dashed line = LH-confirmed ovulation.</p>
      </div>

      <div className="card stack">
        <h2>Cycle history</h2>
        {rows.map(({ c, len, loveInWindow, periodLen, ovDay }) => (
          <div key={c.start} className="stack" style={{ gap: 4 }}>
            <div className="row between small">
              <b>{prettyDate(c.start)}{c.end ? "" : " · current"}</b>
              <span className="muted">
                {c.length ? `${c.length} days` : `day ${len}`} · ovulation CD{ovDay}{c.ovulationConfirmed ? " (LH)" : " (est.)"} · ♥ {loveInWindow} in window
              </span>
            </div>
            <div className="cycle-bar" aria-hidden>
              <div className="f" style={{ left: `${((ovDay - 6) / maxLen) * 100}%`, width: `${(7 / maxLen) * 100}%` }} />
              <div className="p" style={{ left: 0, width: `${(periodLen / maxLen) * 100}%` }} />
              <div className="o" style={{ left: `${((ovDay - 1) / maxLen) * 100}%` }} />
              {!c.length && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(len / maxLen) * 100}%`, width: 2, background: "var(--ink)" }} />}
            </div>
          </div>
        ))}
        <div className="legend">
          <span><i style={{ background: "var(--period)" }} />Period</span>
          <span><i style={{ background: "var(--fertile-soft)" }} />Fertile window</span>
          <span><i style={{ background: "var(--ovulation)" }} />Ovulation</span>
        </div>
      </div>
    </div>
  );
}
