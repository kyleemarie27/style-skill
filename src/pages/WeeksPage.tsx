import { addDays, prettyDate } from "../../shared/dates";
import { gestation, lmpForDueDate } from "../../shared/pregnancy";
import { FIRST_WEEK, LAST_WEEK, TRIMESTERS, WEEKS, weekContent } from "../content/pregnancy";
import { SizeArt } from "../components/art";
import { BabySize } from "../components/BabySize";
import { BodyMind } from "../components/BodyMind";
import { WeekGuide } from "../components/WeekGuide";
import { recentSymptoms, usePregnancy } from "../lib/pregnancy";
import { useStore } from "../lib/store";

/** #/weeks: every week at a glance, grouped by trimester. */
export function WeeksPage() {
  const p = usePregnancy();
  if (!p) return <NotPregnant />;
  const theme = "fruit" as const;
  const lmp = lmpForDueDate(p.preg.dueDate);
  return (
    <div className="stack">
      <div className="row between wrap">
        <h1>Your weeks</h1>
        <a className="btn ghost" href="#/calendar">Calendar →</a>
      </div>
      {([1, 2, 3] as const).map((t) => (
        <section key={t} className="stack" style={{ gap: 8 }}>
          <div>
            <h2>{TRIMESTERS[t].name}</h2>
            <p className="muted small">{TRIMESTERS[t].tagline}</p>
          </div>
          <div className="weeks-grid">
            {WEEKS.filter((w) => (t === 1 ? w.week < 14 : t === 2 ? w.week >= 14 && w.week < 28 : w.week >= 28)).map((w) => (
              <a key={w.week} href={`#/week/${w.week}`} className={`week-tile tri-${t}${w.week === p.g.weeks ? " now" : w.week < p.g.weeks ? " past" : ""}`}>
                <SizeArt theme={theme} art={w.size[theme].art} size={56} title={w.size[theme].name} />
                <span>
                  <b>Week {w.week}</b>{w.week === p.g.weeks && <span className="now-pill">You're here</span>}
                  <span className="tiny muted block">{prettyDate(addDays(lmp, w.week * 7))} · {w.size[theme].name}</span>
                  <span className="small block clamp2">{w.headline}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** #/week/N: the full guide for any week, to read ahead or look back. */
export function WeekPage({ week }: { week: number }) {
  const p = usePregnancy();
  const { dayLogs } = useStore();
  if (!p) return <NotPregnant />;
  const w = Math.max(FIRST_WEEK, Math.min(LAST_WEEK, week || p.g.weeks));
  const content = weekContent(w);
  const lmp = lmpForDueDate(p.preg.dueDate);
  const start = addDays(lmp, w * 7);
  const g = w === p.g.weeks ? p.g : gestation(start, p.preg);
  const go = (n: number) => (window.location.hash = `#/week/${n}`);
  return (
    <div className="stack">
      <div className="row between">
        <button className="btn ghost" onClick={() => go(w - 1)} disabled={w <= FIRST_WEEK} aria-label="Previous week">‹</button>
        <div className="center">
          <h1>Week {w}</h1>
          <div className="muted small">{prettyDate(start)} – {prettyDate(addDays(start, 6))}{w === p.g.weeks ? " · this week" : ""}</div>
        </div>
        <button className="btn ghost" onClick={() => go(w + 1)} disabled={w >= LAST_WEEK} aria-label="Next week">›</button>
      </div>
      <BabySize key={w} g={g} />
      <BodyMind key={"b" + w} week={w} logged={w === p.g.weeks ? recentSymptoms(dayLogs, p.today) : []} />
      <WeekGuide key={"g" + w} week={content} preg={p.preg} seed={w * 7} recentSymptoms={w === p.g.weeks ? recentSymptoms(dayLogs, p.today) : []} />
      <section className="card stack">
        <div className="section-title"><span className="ico" aria-hidden>📅</span>Day by day</div>
        <ol className="day-list">
          {content.days.map((d, i) => (
            <li key={i} className={w === p.g.weeks && i === p.g.days ? "today" : ""}>
              <span className="tiny muted">{prettyDate(addDays(start, i), true)} · {w}w {i}d</span>
              <span>{d}</span>
            </li>
          ))}
        </ol>
      </section>
      <a className="btn" href="#/weeks">All weeks</a>
    </div>
  );
}

function NotPregnant() {
  return (
    <div className="card stack">
      <h2>Pregnancy guide</h2>
      <p className="muted">This guide turns on once you log a positive pregnancy test.</p>
      <a className="btn primary" href="#/today">Back to today</a>
    </div>
  );
}
