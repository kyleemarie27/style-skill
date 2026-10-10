import { useMemo, useState } from "react";
import { timeline } from "../../shared/cycle";
import { addDays, localToday, parseISO } from "../../shared/dates";
import { useStore } from "../lib/store";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function CalendarPage() {
  const { model, dayLogs, lhTests, byDate } = useStore();
  const today = localToday();
  const [cursor, setCursor] = useState(() => today.slice(0, 7) + "-01");
  const first = parseISO(cursor);
  const gridStart = addDays(cursor, -first.getUTCDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const marks = useMemo(() => timeline(model, dayLogs, days[0], days[41]), [model, dayLogs, days[0]]);
  const lhByDate = useMemo(() => {
    const m = new Map<string, string>();
    const rank = { low: 0, high: 1, peak: 2 };
    for (const t of lhTests) {
      const cur = m.get(t.date) as keyof typeof rank | undefined;
      if (!cur || rank[t.level] > rank[cur]) m.set(t.date, t.level);
    }
    return m;
  }, [lhTests]);

  const shift = (n: number) => {
    const d = parseISO(cursor);
    d.setUTCMonth(d.getUTCMonth() + n);
    setCursor(d.toISOString().slice(0, 10));
  };

  return (
    <div className="stack">
      <div className="row between">
        <button className="btn ghost" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <h1>{MONTHS[first.getUTCMonth()]} {first.getUTCFullYear()}</h1>
        <button className="btn ghost" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>
      <div className="card">
        <div className="cal">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="dow">{d}</div>)}
          {days.map((d) => {
            const m = marks.get(d) ?? {};
            const log = byDate.get(d);
            const lh = lhByDate.get(d);
            const cls = [
              d.slice(0, 7) !== cursor.slice(0, 7) && "out",
              d === today && "today",
              m.period ? "period" : m.ovulation ? `ovulation${m.ovulationConfirmed ? "" : " est"}` : m.predictedPeriod ? "pperiod" : m.fertile ? "fertile" : "",
            ].filter(Boolean).join(" ");
            return (
              <button key={d} className={cls} onClick={() => (window.location.hash = `#/day/${d}`)} aria-label={d}>
                <span>{parseISO(d).getUTCDate()}</span>
                <span className="marks">
                  {log?.intercourse && <span className="m-love">♥</span>}
                  {lh && <span className="m-lh" style={{ background: `var(--${lh})` }} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="legend">
        <span><i style={{ background: "var(--period)" }} />Period</span>
        <span><i style={{ border: "1.5px dashed var(--period)" }} />Predicted period</span>
        <span><i style={{ background: "var(--fertile-soft)" }} />Fertile window</span>
        <span><i style={{ background: "var(--ovulation)" }} />Ovulation (LH)</span>
        <span><i style={{ border: "1.5px dashed var(--ovulation)", background: "var(--ovulation-soft)" }} />Ovulation (est.)</span>
        <span><span style={{ color: "var(--brand)" }}>♥</span>Intercourse</span>
        <span><i style={{ background: "var(--peak)", borderRadius: 99, width: 8, height: 8 }} />LH peak</span>
      </div>
      <button className="btn" onClick={() => setCursor(today.slice(0, 7) + "-01")}>Back to today</button>
    </div>
  );
}
