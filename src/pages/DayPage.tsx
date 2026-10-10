import { PHASE_NAME, phaseFor } from "../../shared/cycle";
import { addDays, isISODate, localToday, prettyDate } from "../../shared/dates";
import { LH_LABEL } from "../../shared/lh";
import { DayEditor } from "../components/DayEditor";
import { LhUploadButton } from "../components/LhUpload";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export function DayPage({ date }: { date: string }) {
  const { model, lhTests, reload } = useStore();
  if (!isISODate(date)) return <p>That date doesn't look right.</p>;
  const info = phaseFor(date, model);
  const tests = lhTests.filter((t) => t.date === date);
  const go = (d: string) => (window.location.hash = `#/day/${d}`);

  return (
    <div className="stack">
      <div className="row between">
        <button className="btn ghost" onClick={() => go(addDays(date, -1))} aria-label="Previous day">‹</button>
        <div className="center">
          <h1>{prettyDate(date, true)}</h1>
          {info.cycleDay && <div className="muted small">Cycle day {info.cycleDay} · {PHASE_NAME[info.phase]}</div>}
        </div>
        <button className="btn ghost" onClick={() => go(addDays(date, 1))} disabled={date >= localToday()} aria-label="Next day">›</button>
      </div>

      <div className="card">
        <DayEditor date={date} />
      </div>

      <div className="card stack">
        <h2>LH tests</h2>
        {tests.length === 0 && <p className="muted small">No LH tests logged for this day.</p>}
        {tests.map((t) => (
          <div key={t.id} className="row between">
            <div className="row">
              {t.has_photo && <img className="thumb" src={`/api/lh?id=${t.id}`} alt="LH strip" loading="lazy" />}
              <span className={`lh-badge lh-${t.level}`}>{LH_LABEL[t.level]}</span>
              {t.ratio !== null && <b>{Number(t.ratio).toFixed(2)}</b>}
              {t.source && t.source !== "manual" && <span className="tiny muted">from {t.source}</span>}
            </div>
            <button
              className="btn ghost danger small"
              onClick={async () => {
                if (!confirm("Delete this LH reading?")) return;
                await api.deleteLh(t.id!);
                await reload();
              }}
            >
              Delete
            </button>
          </div>
        ))}
        <div className="row wrap"><LhUploadButton date={date} /></div>
      </div>
    </div>
  );
}
