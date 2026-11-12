import { useMemo, useState } from "react";
import { addDays, diffDays, localToday, prettyDate } from "../../shared/dates";
import { AskBloomCard } from "../components/AskBloom";
import { HealthChecks } from "../components/HealthChecks";
import { LhChart } from "../components/LhChart";
import { TempChart } from "../components/TempChart";
import { tempPattern } from "../../shared/wearable";
import { useStore } from "../lib/store";

export function InsightsPage() {
  const { model, lhTests, dayLogs } = useStore();
  const cycles = model.cycles;
  const [sel, setSel] = useState(cycles.length - 1);
  const [allHistory, setAllHistory] = useState(false);
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
  // A pregnancy would stretch the scale; size the bars by real cycles only.
  const maxLen = Math.max(...rows.filter((r) => !r.c.pregnancy).map((r) => r.len), model.avgCycleLength);
  const preg = model.settings.pregnancy;
  const confirmedCycles = cycles.filter((c) => c.ovulationConfirmed && c.end).length;

  return (
    <div className="stack">
      <h1>Insights</h1>
      <HealthChecks />
      <AskBloomCard suggestions={["Is my cycle normal?", "Why didn't I catch an LH Peak?", "What does my luteal phase tell me?", "Should I talk to a doctor about anything?"]} />
      <div className="grid2">
        <div className="stat"><b>{model.avgCycleLength}</b><span>avg cycle length (days)</span></div>
        <div className="stat"><b>{model.avgPeriodLength}</b><span>avg period length (days)</span></div>
        <div className="stat"><b>{model.typicalOvulationDay ? `CD ${model.typicalOvulationDay}` : "—"}</b><span>typical ovulation (confirmed cycles)</span></div>
        <div className="stat"><b>{model.avgLutealLength}</b><span>luteal phase (days){confirmedCycles < 2 ? ", default" : ""}</span></div>
      </div>

      <div className="card stack">
        <div className="row between wrap">
          <h2>LH curve</h2>
          <select value={sel} onChange={(e) => setSel(Number(e.target.value))} style={{ width: "auto" }}>
            {cycles.map((c, i) => (
              <option key={c.start} value={i}>
                {prettyDate(c.start)}{c.pregnancy ? " (pregnancy)" : ""}{i === cycles.length - 1 ? " (current)" : ""}
              </option>
            ))}
          </select>
        </div>
        <LhChart tests={lhTests} start={selected.start} days={selLen} ovulation={selected.ovulationConfirmed ? selected.ovulation : null} />
        <p className="tiny muted">Premom scale: yellow band = High (0.5–0.99), pink band = Peak (≥1.0). Dashed line = confirmed ovulation.</p>
      </div>

      {model.wearable.length > 0 ? (
        <div className="card stack">
          <h2>Temperature</h2>
          <TempChart
            nights={model.wearable}
            start={selected.start}
            days={selLen}
            shift={selected.tempShift}
            lhPeak={selected.lhPeak}
            ovulation={selected.ovulationConfirmed ? selected.ovulation : null}
            loveDates={dayLogs.filter((d) => d.intercourse && d.date >= selected.start).map((d) => d.date)}
          />
          <p className="small">
            {selected.tempShift
              ? `Your temperature rose ${selected.tempShift.rise.toFixed(2)}°C on ${prettyDate(selected.tempShift.firstHigh)} and held for 3 nights or more, so ovulation was confirmed${selected.lhPeak ? ` (LH peaked ${prettyDate(selected.lhPeak)})` : ""}.`
              : "No sustained rise in this cycle yet. It usually shows 1–3 days after ovulation."}
          </p>
          <p className="tiny muted">
            Oura's nightly skin temperature vs. your own baseline, same cycle as above. Gray dotted line = the 6 nights before the rise; purple dashed = 0.2°C above them;
            purple shading = high nights; ▲ = LH peak; ♥ = sex logged. Tap a point for the night.
          </p>
          <TempPatternNote />
        </div>
      ) : null}

      <div className="card stack">
        <h2>Cycle history</h2>
        {(allHistory ? rows : rows.slice(0, 6)).map(({ c, len, loveInWindow, periodLen, ovDay }) => c.pregnancy ? (
          <div key={c.start} className="stack" style={{ gap: 4 }}>
            <div className="row between small">
              <b>{prettyDate(c.start)} · Pregnancy</b>
              <span className="muted">
                {preg ? `positive test ${prettyDate(preg.positiveTestDate)}` : ""}
                {preg?.ended ? ` · ended ${prettyDate(preg.ended.date)}` : ""}
                {c.ovulationConfirmed ? ` · ovulation CD${ovDay}` : ""}
              </span>
            </div>
            <div className="cycle-bar preg" aria-hidden>
              <div className="p" style={{ left: 0, width: `${(periodLen / maxLen) * 100}%` }} />
              {c.ovulationConfirmed && <div className="o" style={{ left: `${Math.min(99, ((ovDay - 1) / maxLen) * 100)}%` }} />}
            </div>
            <p className="tiny muted">Not counted as a cycle: it isn't in your averages, health checks or patterns.</p>
          </div>
        ) : (
          <div key={c.start} className="stack" style={{ gap: 4 }}>
            <div className="row between small">
              <b>{prettyDate(c.start)}{c.end ? "" : " · current"}{c.firstAfterLoss ? " · first cycle back" : ""}</b>
              <span className="muted">
                {c.length ? `${c.length} days` : `day ${len}`} · ovulation CD{ovDay}{c.ovulationSource === "lh" ? (c.tempShift ? " (LH + temp)" : " (LH)") : c.ovulationSource === "marked" ? " (confirmed)" : c.ovulationSource === "temp" ? " (temp)" : " (est.)"} · ♥ {loveInWindow} in window
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
        {rows.length > 6 && (
          <button className="btn ghost small more" onClick={() => setAllHistory(!allHistory)}>
            {allHistory ? "Show recent only" : `Show all ${rows.length} cycles`}
          </button>
        )}
        <div className="legend">
          <span><i style={{ background: "var(--period)" }} />Period</span>
          <span><i style={{ background: "var(--fertile-soft)" }} />Fertile window</span>
          <span><i style={{ background: "var(--ovulation)" }} />Ovulation</span>
        </div>
      </div>
    </div>
  );
}

/** What past cycles say about your temperature and heart rate. Shown once there's at least one cycle to learn from. */
function TempPatternNote() {
  const { model } = useStore();
  const p = useMemo(() => tempPattern(model.cycles, model.wearable), [model]);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const range = (xs: number[]) => (Math.min(...xs) === Math.max(...xs) ? `${xs[0]}` : `${Math.min(...xs)}–${Math.max(...xs)}`);
  const lines: string[] = [];
  if (p.peakToRise.length) {
    const d = `${range(p.peakToRise)} day${Math.max(...p.peakToRise) === 1 ? "" : "s"}`;
    lines.push(p.peakToRise.length === 1
      ? `So far, your temperature rose ${d} after your LH peak. Bloom will learn your usual gap over the next cycles.`
      : `Your temperature usually rises ${d} after your LH peak (${p.peakToRise.length} cycles).`);
  }
  if (p.rises.length) lines.push(`Your rise is about ${avg(p.rises).toFixed(2)}°C.`);
  if (p.rhrLift.length) {
    const lift = avg(p.rhrLift);
    lines.push(
      lift >= 1
        ? `Your resting heart rate runs about ${lift.toFixed(1)} bpm higher after ovulation than before (${p.rhrLift.length} cycle${p.rhrLift.length === 1 ? "" : "s"}). That's normal: progesterone does it.`
        : `Your resting heart rate stays about the same after ovulation (${p.rhrLift.length} cycle${p.rhrLift.length === 1 ? "" : "s"}).`,
    );
  }
  if (!lines.length) return <p className="tiny muted">After a cycle or two, Bloom will show your own pattern here: when your temperature rises after LH peaks, and how your resting heart rate changes.</p>;
  return (
    <div className="pattern">
      <div className="section-title"><span className="ico" aria-hidden>📈</span>Your pattern</div>
      <ul className="tips">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
    </div>
  );
}
