import { useState } from "react";
import { addDays, prettyDate } from "../../shared/dates";
import { standardSchedule, type Gestation } from "../../shared/pregnancy";
import type { DayLog, Pregnancy } from "../../shared/types";
import { fillName, HOW_TO_HELP, moodsOf, partnerFeeling, partnerItems, partnerMove, type WeekContent } from "../content/pregnancy";
import { readLocal, usePregnancy, writeLocal } from "../lib/pregnancy";
import { useStore } from "../lib/store";
import { useTodayPlan } from "../lib/todayPlan";
import { TodaysQuestion } from "../components/TodaysQuestion";
import { Alerts, PregnancyHero } from "./PregnancyToday";

/**
 * Today for the partner: the same baby, then how their person is doing (from today's check-in, with
 * how to help), one thing to do, and what this week means for them. No logging, no homework.
 */
export function PartnerToday() {
  const p = usePregnancy()!;
  const { byDate } = useStore();
  const { preg, g, week, flags, today } = p;
  const name = preg.momName?.trim() || "";

  return (
    <div className="stack preg today-stack">
      <PregnancyHero g={g} preg={preg} />
      {flags.length > 0 && <Alerts flags={flags} preg={preg} />}
      <HowTheyreDoing name={name} log={byDate.get(today)} yesterday={byDate.get(addDays(today, -1))} />
      <YourMove key={today} name={name} today={today} g={g} preg={preg} week={week} />

      <section className="card stack">
        <div className="row between" style={{ alignItems: "baseline" }}>
          <h3 className="card-h">Week {g.weeks} for you</h3>
          <a className="small" href={`#/week/${g.weeks}`}>The week's guide ›</a>
        </div>
        <p className="small muted">{week.headline}</p>
        <div className="guide-group">
          <div className="tip-label">Your role this week</div>
          <ul className="tips">{partnerItems(week, name).map((i) => <li key={i.t}>{i.t}{i.why && <span className="muted"> {i.why}</span>}</li>)}</ul>
        </div>
        <div className="guide-group">
          <div className="tip-label">You might be feeling</div>
          <p className="small">{partnerFeeling(g.weeks).t}</p>
        </div>
        <ComingUp />
      </section>

      <TodaysQuestion g={g} preg={preg} today={today} />

      <p className="tiny muted center">Bloom gives general information, not medical advice.</p>
    </div>
  );
}

function HowTheyreDoing({ name, log, yesterday }: { name: string; log?: DayLog; yesterday?: DayLog }) {
  const items = (l?: DayLog) => {
    if (!l) return [];
    const out = [...moodsOf(l.mood), ...(l.symptoms ?? [])];
    if (l.preg?.nausea && l.preg.nausea !== "none") out.unshift(l.preg.nausea === "mild" ? "Nausea" : `Nausea (${l.preg.nausea})`);
    if (l.preg?.bleeding && l.preg.bleeding !== "none") out.push("Spotting");
    if (l.preg?.pain && l.preg.pain !== "none") out.push("Cramping");
    return out;
  };
  const todayItems = items(log);
  const showing = todayItems.length ? todayItems : items(yesterday);
  const when = todayItems.length ? "today" : showing.length ? "yesterday" : null;
  const tips = showing.map((s) => [s, HOW_TO_HELP[s.replace(/ \(.*\)$/, "")]] as const).filter(([, t]) => t).slice(0, 4);

  return (
    <section className="card stack">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <h3 className="card-h">How {name || "your partner"} is doing</h3>
        {when && <span className="tiny muted">Logged {when}</span>}
      </div>
      {!when ? (
        <p className="small">Nothing logged yet today. A simple “how are you feeling, really?” goes a long way.</p>
      ) : (
        <>
          <div className="chips">{showing.map((s) => <span key={s} className="chip static">{s}</span>)}</div>
          {tips.length > 0 && (
            <div className="guide-group">
              <div className="tip-label">How you can help</div>
              <ul className="tips">{tips.map(([s, t]) => <li key={s}><b>{s.replace(/ \(.*\)$/, "")}:</b> {fillName(t, name)}</li>)}</ul>
            </div>
          )}
          {(log ?? yesterday)?.preg?.prenatal && when === "today" && <p className="tiny muted">💊 Prenatal taken today.</p>}
        </>
      )}
    </section>
  );
}

/** Today's move: written by AI to match how she's doing, or from the trimester's list without AI. */
function YourMove({ name, today, g, preg, week }: { name: string; today: string; g: Gestation; preg: Pregnancy; week: WeekContent }) {
  const { plan, loading } = useTodayPlan(today, { g, preg, week });
  const move = plan?.partner ?? partnerMove(g.totalDays);
  const key = `bloom-partner-move-${today}`;
  const [done, setDone] = useState(() => readLocal(key, false));
  const toggle = () => {
    setDone(!done);
    writeLocal(key, !done);
  };
  return (
    <section className="card stack your-move">
      <h3 className="card-h">Your move today</h3>
      {loading ? <p className="muted row small"><span className="spin" /> Picking today's move…</p> : <label className="move">
        <input type="checkbox" checked={done} onChange={toggle} />
        <span>
          <span className="move-text">{fillName(move.t, name)}</span>
          {move.why && <span className="why small muted"> {fillName(move.why, name)}</span>}
        </span>
      </label>}
      {done && <p className="bites-done">Done. That counts for a lot. 💛</p>}
    </section>
  );
}

/** The next appointment on the calendar, or what's typically coming up if none is booked. */
function ComingUp() {
  const p = usePregnancy()!;
  const next = p.preg.appointments.filter((a) => a.date >= p.today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const typical = standardSchedule(p.preg).find((s) => s.to >= p.today && !s.optional);
  if (!next && !typical) return null;
  return (
    <div className="guide-group">
      <div className="tip-label">Coming up</div>
      {next ? (
        <p className="small"><b>{prettyDate(next.date, true)}:</b> {next.title}. Put it in your calendar and go if you can.</p>
      ) : (
        <p className="small"><b>{typical!.title}</b> is usually between {prettyDate(typical!.from)} and {prettyDate(typical!.to)}. Ask when it's booked.</p>
      )}
    </div>
  );
}
