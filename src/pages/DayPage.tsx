import { PHASE_NAME, phaseFor } from "../../shared/cycle";
import { addDays, isISODate, localToday, prettyDate } from "../../shared/dates";
import { LH_LABEL } from "../../shared/lh";
import { gaLabel, gestation } from "../../shared/pregnancy";
import { DayEditor } from "../components/DayEditor";
import { PregnancyEditor } from "../components/PregnancyEditor";
import { usePregnancy } from "../lib/pregnancy";
import { LhUploadButton } from "../components/LhUpload";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import type { DayLog, LhTest } from "../../shared/types";

export function DayPage({ date }: { date: string }) {
  const { model, lhTests, reload, role, byDate } = useStore();
  const p = usePregnancy();
  if (!isISODate(date)) return <p>That date doesn't look right.</p>;
  const pregDay = p && date >= p.preg.lmp;
  const info = phaseFor(date, model);
  const tests = lhTests.filter((t) => t.date === date);
  const go = (d: string) => (window.location.hash = `#/day/${d}`);

  return (
    <div className="stack">
      <div className="row between">
        <button className="btn ghost" onClick={() => go(addDays(date, -1))} aria-label="Previous day">‹</button>
        <div className="center">
          <h1>{prettyDate(date, true)}</h1>
          {pregDay ? <div className="muted small">{gaLabel(gestation(date, p.preg))} pregnant</div>
            : info.cycleDay && <div className="muted small">Cycle day {info.cycleDay} · {PHASE_NAME[info.phase]}</div>}
        </div>
        <button className="btn ghost" onClick={() => go(addDays(date, 1))} disabled={date >= localToday()} aria-label="Next day">›</button>
      </div>

      {role === "partner" && !pregDay ? <DaySummary log={byDate.get(date)} tests={tests} /> : <>
      <div className="card">
        {pregDay ? <PregnancyEditor date={date} preg={p.preg} /> : <DayEditor date={date} />}
      </div>

      {!pregDay && <div className="card stack">
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
      </div>}
      </>}
    </div>
  );
}

/** What was logged that day, for the partner (who can read but not change logs). */
function DaySummary({ log, tests }: { log?: DayLog; tests: LhTest[] }) {
  const rows: [string, string][] = [];
  if (log?.flow && log.flow !== "none") rows.push(["Flow", log.flow[0].toUpperCase() + log.flow.slice(1)]);
  if (log?.intercourse) rows.push(["♥", "Yes"]);
  if (log?.cervical_mucus) rows.push(["Mucus", log.cervical_mucus === "egg_white" ? "Egg white" : log.cervical_mucus[0].toUpperCase() + log.cervical_mucus.slice(1)]);
  for (const t of tests) rows.push(["LH", `${t.ratio !== null ? Number(t.ratio).toFixed(2) + " " : ""}${LH_LABEL[t.level]}`]);
  if (log?.mood) rows.push(["Mood", log.mood]);
  if (log?.symptoms?.length) rows.push(["Symptoms", log.symptoms.join(", ")]);
  if (log?.pregnancy_test) rows.push(["Pregnancy test", log.pregnancy_test[0].toUpperCase() + log.pregnancy_test.slice(1)]);
  return (
    <div className="card stack">
      {rows.length ? rows.map(([k, v]) => (
        <div key={k + v} className="row between small"><span className="muted">{k}</span><b>{v}</b></div>
      )) : <p className="muted small">Nothing logged this day.</p>}
    </div>
  );
}
