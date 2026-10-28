import { useState } from "react";
import { localToday, prettyDate } from "../../shared/dates";
import { gaLong, type Gestation, type PregFlag } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { nextMilestone, TRIMESTERS, type WeekContent } from "../content/pregnancy";
import { BabySize } from "../components/BabySize";
import { LittleThings } from "../components/LittleThings";
import { useDeepDive } from "../components/DeepDive";
import { QuickCheckIn } from "../components/QuickCheckIn";
import { TodaysQuestion } from "../components/TodaysQuestion";
import { newId, usePregnancy, useSavePregnancy } from "../lib/pregnancy";
import { useStore } from "../lib/store";
import { useTodayPlan } from "../lib/todayPlan";

/**
 * Today, in the order a day goes: see the baby, read what today means, check in, do the little
 * things, then a question to end on. Each piece lives here once; the deeper layers sit in Weeks.
 */
export function PregnancyToday() {
  const p = usePregnancy()!;
  const { aiEnabled } = useStore();
  const { preg, g, week, flags, today } = p;

  return (
    <div className="stack preg today-stack">
      <PregnancyHero g={g} preg={preg} />
      {flags.length > 0 && <Alerts flags={flags} preg={preg} />}
      <TodayCard g={g} preg={preg} week={week} ai={aiEnabled} />
      <QuickCheckIn today={today} preg={preg} />
      <LittleThings key={today} g={g} preg={preg} week={week} today={today} />
      <TodaysQuestion g={g} preg={preg} today={today} />
      <p className="tiny muted center">Bloom gives general information, not medical advice. Your doctor or midwife knows your situation best.</p>
    </div>
  );
}

/** The hero on both partners' Today: baby next to a fruit, how far along, and the next thing to look forward to. */
export function PregnancyHero({ g, preg }: { g: Gestation; preg: Pregnancy }) {
  return (
    <BabySize
      g={g}
      href={`#/week/${g.weeks}`}
      className={`hero-size tri-${g.trimester}`}
      header={
        <div className="stack" style={{ gap: 2 }}>
          <div className="muted small">{prettyDate(localToday(), true)}</div>
          <h1>{gaLong(g)}</h1>
        </div>
      }
      footer={<Progress g={g} preg={preg} />}
    />
  );
}

/** A thin trimester progress bar with the due date, days to go and the next milestone. */
function Progress({ g, preg }: { g: Gestation; preg: Pregnancy }) {
  const tri = TRIMESTERS[g.trimester];
  const next = nextMilestone(g.totalDays);
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="preg-bar" role="img" aria-label={`${Math.round(g.pct * 100)}% of the way to your due date`}>
        <span style={{ width: `${Math.max(2, g.pct * 100)}%` }} />
        <i style={{ left: `${(13 / 40) * 100}%` }} />
        <i style={{ left: `${(27 / 40) * 100}%` }} />
      </div>
      <div className="row between small muted">
        <span>{tri.name}</span>
        <span>Due {prettyDate(preg.dueDate)} · {g.daysToGo} days to go</span>
      </div>
      {next && (
        <p className="milestone-line">
          <b>In {next.inDays} {next.inDays === 1 ? "day" : "days"}:</b> {next.t} <span aria-hidden>{next.icon}</span>
        </p>
      )}
    </div>
  );
}

/** Today's line, the personal note and today's read: everything to know about today, in one card. */
function TodayCard({ g, preg, week, ai }: { g: Gestation; preg: Pregnancy; week: WeekContent; ai: boolean }) {
  const dayLine = week.days[Math.max(0, Math.min(6, g.days))];
  return (
    <section className="card stack today-card">
      <h3 className="card-h">Today</h3>
      <p className="today-line">{dayLine}</p>
      {ai && <PregLine g={g} preg={preg} week={week} />}
      {ai && <ReadTeaser g={g} preg={preg} week={week} href={`#/week/${g.weeks}/read`} />}
    </section>
  );
}

function ReadTeaser({ g, preg, week, href }: { g: Gestation; preg: Pregnancy; week: WeekContent; href: string }) {
  const { dive, err } = useDeepDive(g, preg, week);
  if (err) return null;
  return (
    <a className="read-teaser" href={href}>
      <span className="tiny muted">Today's read{dive ? ` · ${dive.minutes || 4} min` : ""}</span>
      <b>{dive ? dive.title : <span className="row muted small"><span className="spin" /> Writing today's read…</span>}</b>
    </a>
  );
}

const LEVEL_LABEL = { urgent: "Call now", call: "Call your doctor today", mention: "Keep an eye on it" };

export function Alerts({ flags, preg }: { flags: PregFlag[]; preg: Pregnancy }) {
  const save = useSavePregnancy();
  const asked = (f: PregFlag) => preg.questions.some((q) => q.text.startsWith(f.title));
  const ask = (f: PregFlag) =>
    save({ questions: [...preg.questions, { id: newId(), text: `${f.title} (logged ${prettyDate(f.date)})`, created: localToday(), done: null }] });
  return (
    <div className="stack" style={{ gap: 8 }} role="alert">
      {flags.map((f) => (
        <div key={f.id} className={`alert ${f.level}`}>
          <div className="alert-level">{LEVEL_LABEL[f.level]} · logged {prettyDate(f.date)}</div>
          <b>{f.title}</b>
          <p className="small">{f.detail}</p>
          {f.level !== "urgent" && (
            <button className="btn ghost small alert-ask" onClick={() => ask(f)} disabled={asked(f)}>
              {asked(f) ? "On the questions list ✓" : "+ Add to the questions for the doctor"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** The AI's personal line for today, written once per gestational day along with today's plan. */
function PregLine({ g, preg, week }: { g: Gestation; preg: Pregnancy; week: WeekContent }) {
  const { line, err } = useTodayPlan(localToday(), { g, preg, week });
  const [more, setMore] = useState(false);
  if (err) return <p className="small muted">Couldn't write today's note: {err}</p>;
  if (!line) return <p className="muted row small"><span className="spin" /> Writing your note…</p>;
  return (
    <button className={`for-you-note${more ? " open" : ""}`} onClick={() => setMore(!more)} aria-expanded={more}>
      <span className="note-text">{line}</span>
      {!more && line.length > 150 && <span className="why-hint">more</span>}
    </button>
  );
}
