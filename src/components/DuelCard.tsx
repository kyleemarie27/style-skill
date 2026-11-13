import { useEffect, useMemo, useState } from "react";
import { PHASE_NAME, phaseFor, type Phase } from "../../shared/cycle";
import { diffDays, localToday } from "../../shared/dates";
import { other, type Author, type DuelPicks, type Stage } from "../../shared/duel";
import { gaLong } from "../../shared/pregnancy";
import { namesOf } from "../../shared/types";
import { api, type DuelState } from "../lib/api";
import { usePregnancy } from "../lib/pregnancy";
import { useStore } from "../lib/store";

/** The level badge for a cycle phase: it shifts about once a week with the cycle. */
export const LEVEL: Record<Phase, string> = {
  menstrual: "Period week",
  follicular: "Build-up",
  fertile: "Window week",
  ovulation: "Window week",
  tww_early: "The wait",
  tww_mid: "The wait",
  tww_late: "The wait",
  late: "Test day",
  unknown: "Getting started",
};

/** What the duel is written for today: the stage, the level, one line on where you are. */
function useDuelContext() {
  const { model, settings } = useStore();
  const p = usePregnancy();
  const today = localToday();
  return useMemo(() => {
    const names = namesOf(settings);
    if (p) {
      return { stage: "pregnancy" as Stage, level: `Week ${p.g.weeks}`, now: `${gaLong(p.g)} pregnant, trimester ${p.g.trimester}`, gentle: false, names };
    }
    if (settings.pregnancy?.ended?.reason === "birth") {
      return { stage: "baby" as Stage, level: "Baby's first year", now: `Baby born ${settings.pregnancy.ended.date}`, gentle: false, names };
    }
    const info = phaseFor(today, model);
    const loss = model.afterLoss && info.cycle?.start === model.afterLoss.start ? diffDays(today, model.afterLoss.start) : null;
    const now = info.cycleDay
      ? `Cycle day ${info.cycleDay}, ${PHASE_NAME[info.phase].toLowerCase()}${info.fertileStart ? `, fertile window ${info.fertileStart} to ${info.fertileEnd}` : ""}${info.ovulationConfirmed ? ", ovulation confirmed" : ""}`
      : "Just getting started with tracking";
    return { stage: "ttc" as Stage, level: LEVEL[info.phase], now, gentle: info.phase === "late" || (loss !== null && loss < 14), names };
  }, [model, settings, p, today]);
}

/** Two players, both answer the same three questions, picks revealed once both have played. */
export function DuelCard() {
  const { role, aiEnabled } = useStore();
  const ctx = useDuelContext();
  const today = localToday();
  const [state, setState] = useState<DuelState | null>(null);
  const [err, setErr] = useState("");
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    api.duel(today, ctx).then((s) => live && setState(s)).catch((e) => live && setErr((e as Error).message));
    return () => { live = false; };
    // Written once per day; the context only matters on the first open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const me: Author = role;
  const name = (a: Author) => (a === me ? "You" : (a === "me" ? ctx.names.me : ctx.names.partner) || (a === "me" ? "Your partner" : "Your partner"));
  const themName = name(other(me));

  if (err) return <div className="card small muted">Couldn't load today's duel: {err}</div>;
  if (!state) return <div className="card duel"><span className="muted row"><span className="spin" /> Writing today's duel…</span></div>;

  const { day, scores } = state;
  const g = day.guess;
  const iAmSubject = g.about === me;
  const total = day.quiz.length + 1;

  const choose = async (i: number) => {
    const next = [...picks, i];
    setPicks(next);
    if (next.length < total) return setStep(step + 1);
    setBusy(true);
    try {
      const body: DuelPicks = { quiz: next.slice(0, day.quiz.length), guess: next[day.quiz.length] };
      setState(await api.playDuel(today, body));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const lead = scores.week.me === scores.week.partner ? null : scores.week.me > scores.week.partner ? "me" : "partner";

  return (
    <div className="card duel stack">
      <div className="row between" style={{ alignItems: "center" }}>
        <div className="section-title"><span className="ico" aria-hidden>⚡</span>Daily Duel</div>
        <div className="row" style={{ gap: 6 }}>
          <span className="duel-chip">{day.level}</span>
          {scores.streak > 0 && <span className="duel-chip streak" title="Days in a row you both played">🔥 {scores.streak}</span>}
        </div>
      </div>

      <div className="duel-board" aria-label="This week's score">
        {(["me", "partner"] as Author[]).map((a) => (
          <div key={a} className={`duel-player${lead === a ? " lead" : ""}`}>
            <span className="tiny muted">{name(a)}{lead === a ? " 👑" : ""} · this week</span>
            <b>{scores.week[a]}</b>
          </div>
        ))}
      </div>

      {!state.mine ? (
        <Play
          key={step}
          step={step}
          total={total}
          q={step < day.quiz.length ? day.quiz[step].q : iAmSubject ? g.self : g.guess}
          tag={step < day.quiz.length ? (step === 1 ? `This week: ${day.theme}` : "Right now") : iAmSubject ? `${themName} will guess this` : `Guess ${themName}`}
          options={step < day.quiz.length ? day.quiz[step].options : g.options}
          busy={busy}
          onPick={choose}
        />
      ) : (
        <Results state={state} me={me} name={name} themName={themName} />
      )}

      {!aiEnabled && <p className="tiny muted">Turn on AI (ANTHROPIC_API_KEY) for a fresh set every day.</p>}
      {scores.lastWeek.me + scores.lastWeek.partner > 0 && new Date(today + "T00:00:00").getDay() <= 2 && (
        <p className="tiny muted">
          Last week: {scores.lastWeek.me === scores.lastWeek.partner ? `a tie, ${scores.lastWeek.me}–${scores.lastWeek.partner}` : `${name(scores.lastWeek.me > scores.lastWeek.partner ? "me" : "partner")} won ${Math.max(scores.lastWeek.me, scores.lastWeek.partner)}–${Math.min(scores.lastWeek.me, scores.lastWeek.partner)}`}
        </p>
      )}
    </div>
  );
}

function Play({ step, total, q, tag, options, busy, onPick }: {
  step: number; total: number; q: string; tag: string; options: string[]; busy: boolean; onPick: (i: number) => void;
}) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="duel-dots" aria-label={`Question ${step + 1} of ${total}`}>
        {Array.from({ length: total }, (_, i) => <i key={i} className={i < step ? "done" : i === step ? "now" : ""} />)}
      </div>
      <div className="tiny muted">{tag}</div>
      <p className="duel-q">{q}</p>
      <div className="duel-options">
        {options.map((o, i) => (
          <button key={o} className="btn duel-opt" disabled={busy} onClick={() => onPick(i)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function Results({ state, me, name, themName }: { state: DuelState; me: Author; name: (a: Author) => string; themName: string }) {
  const { day, mine, theirs, theyPlayed } = state;
  const g = day.guess;
  const subjectPick = g.about === me ? mine!.guess : theirs?.guess;
  const guesserPick = g.about === me ? theirs?.guess : mine!.guess;
  const right = (i: number, p?: DuelPicks | null) => (p ? p.quiz[i] === day.quiz[i].answer : null);
  const myPts = day.quiz.reduce((n, _q, i) => n + (right(i, mine) ? 1 : 0), 0) + (g.about !== me && subjectPick !== undefined && subjectPick === guesserPick ? 1 : 0);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="duel-today">
        <span>Today: <b>{myPts}</b> for you</span>
        <span className="muted">{theyPlayed ? "" : `· waiting for ${themName}`}</span>
      </div>
      {day.quiz.map((q, i) => (
        <div key={q.q} className="duel-result">
          <p className="small"><b>{q.q}</b></p>
          <div className="duel-picks">
            <Pick who="You" text={q.options[mine!.quiz[i]]} ok={right(i, mine)} />
            {theirs ? <Pick who={themName} text={q.options[theirs.quiz[i]]} ok={right(i, theirs)} /> : <Pick who={themName} text="…" ok={null} />}
          </div>
          {!right(i, mine) && q.answer !== undefined && <p className="tiny"><b>Answer:</b> {q.options[q.answer]}</p>}
          {q.explain && <p className="tiny muted">{q.explain}</p>}
        </div>
      ))}
      <div className="duel-result">
        <p className="small"><b>{g.about === me ? g.self : g.guess}</b></p>
        <div className="duel-picks">
          <Pick who={g.about === me ? "You picked" : `${name(g.about)} picked`} text={subjectPick !== undefined ? g.options[subjectPick] : "…"} ok={null} />
          <Pick
            who={g.about === me ? `${themName} guessed` : "You guessed"}
            text={guesserPick !== undefined ? g.options[guesserPick] : "…"}
            ok={subjectPick !== undefined && guesserPick !== undefined ? subjectPick === guesserPick : null}
          />
        </div>
      </div>
      {!theyPlayed && <p className="tiny muted">{themName}'s answers show up here once they play.</p>}
    </div>
  );
}

function Pick({ who, text, ok }: { who: string; text: string; ok: boolean | null }) {
  return (
    <div className={`duel-pick${ok === true ? " ok" : ok === false ? " no" : ""}`}>
      <span className="tiny muted">{who}</span>
      <span className="small">{ok === true ? "✓ " : ok === false ? "✗ " : ""}{text}</span>
    </div>
  );
}
