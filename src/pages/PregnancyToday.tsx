import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, localToday, prettyDate } from "../../shared/dates";
import { gaLabel, gaLong, type Gestation, type PregFlag } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { nextMilestone, TRIMESTERS, type WeekContent } from "../content/pregnancy";
import { BabySize } from "../components/BabySize";
import { DailyBites } from "../components/DailyBites";
import { useDeepDive } from "../components/DeepDive";
import { QuickCheckIn } from "../components/QuickCheckIn";
import { api } from "../lib/api";
import { newId, usePregnancy, useSavePregnancy } from "../lib/pregnancy";
import { useStore } from "../lib/store";

export function PregnancyToday() {
  const p = usePregnancy()!;
  const { aiEnabled } = useStore();
  const { preg, g, week, flags, today } = p;
  const dayLine = week.days[Math.max(0, Math.min(6, g.days))];
  const next = nextMilestone(g.totalDays);

  return (
    <div className="stack preg today-stack">
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

      {flags.length > 0 && <Alerts flags={flags} preg={preg} />}

      <section className="card stack today-card">
        <h3 className="card-h">Today</h3>
        <p className="today-line">{dayLine}</p>
        {aiEnabled && <PregLine g={g} preg={preg} week={week} />}
        {next && (
          <p className="milestone-line">
            <b>In {next.inDays} {next.inDays === 1 ? "day" : "days"}:</b> {next.t} <span aria-hidden>{next.icon}</span>
          </p>
        )}
      </section>

      <DailyBites key={today} g={g} preg={preg} week={week} today={today} />

      <QuickCheckIn today={today} />

      <ThisWeek g={g} preg={preg} week={week} ai={aiEnabled} />

      <p className="tiny muted center">Bloom gives general information, not medical advice. Your doctor or midwife knows your situation best.</p>
    </div>
  );
}

/** A thin trimester progress bar with the due date and days to go. */
function Progress({ g, preg }: { g: Gestation; preg: Pregnancy }) {
  const tri = TRIMESTERS[g.trimester];
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
    </div>
  );
}

/** A teaser for the week: today's read and quick links into the week's guide. */
function ThisWeek({ g, preg, week, ai }: { g: Gestation; preg: Pregnancy; week: WeekContent; ai: boolean }) {
  const base = `#/week/${g.weeks}`;
  return (
    <section className="card stack">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <h3 className="card-h">Week {g.weeks}</h3>
        <a className="small" href={base}>Full guide ›</a>
      </div>
      <p className="week-teaser">{week.headline}</p>
      {ai && <ReadTeaser g={g} preg={preg} week={week} href={`${base}/read`} />}
      <div className="week-links">
        <a href={`${base}/baby`}>👶 Baby</a>
        <a href={`${base}/you`}>🌙 You</a>
        <a href={`${base}/plan`}>🗓️ Plan</a>
      </div>
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

function Alerts({ flags, preg }: { flags: PregFlag[]; preg: Pregnancy }) {
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
              {asked(f) ? "On your questions list ✓" : "+ Add to my questions for the doctor"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** The AI's personal line for today, cached once per gestational day. */
function PregLine({ g, preg, week }: { g: Gestation; preg: Pregnancy; week: WeekContent }) {
  const { byDate } = useStore();
  const [line, setLine] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [more, setMore] = useState(false);
  const date = localToday();
  const key = `preg-${gaLabel(g).replace(" ", "")}`;
  const ctx = useRef<unknown>(null);
  ctx.current = useMemo(() => {
    const days = [1, 2, 3].map((n) => addDays(date, -n + 1)).map((d) => ({ date: d, log: byDate.get(d) ?? null }));
    return {
      pregnant: true,
      today: date,
      gestationalAge: gaLong(g),
      trimester: g.trimester,
      dueDate: preg.dueDate,
      thisWeek: week.headline,
      babyThisWeek: week.baby.map((b) => b.t),
      recentLogs: days.map(({ date: d, log }) => ({ date: d, symptoms: log?.symptoms, mood: log?.mood, pregnancy: log?.preg })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, key]);

  useEffect(() => {
    let live = true;
    api.dailyNote(date, key, ctx.current)
      .then((r) => live && setLine(r.line))
      .catch((e) => live && setErr((e as Error).message));
    return () => {
      live = false;
    };
  }, [date, key]);

  if (err) return <p className="small muted">Couldn't write today's note: {err}</p>;
  if (!line) return <p className="muted row small"><span className="spin" /> Writing your note…</p>;
  return (
    <button className={`for-you-note${more ? " open" : ""}`} onClick={() => setMore(!more)} aria-expanded={more}>
      <span className="note-text">{line}</span>
      {!more && line.length > 150 && <span className="why-hint">more</span>}
    </button>
  );
}



