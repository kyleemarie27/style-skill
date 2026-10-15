import { useEffect, useMemo, useState } from "react";
import { addDays, localToday } from "../../shared/dates";
import { gaLabel, gaLong, type Gestation } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import type { WeekContent } from "../content/pregnancy";
import { api, type DeepDive as Dive } from "../lib/api";
import { newId, useSavePregnancy } from "../lib/pregnancy";
import { useStore } from "../lib/store";
import { Prose } from "./WeekGuide";

/** Today's deep dive for this gestational day: written once a day by AI, cached on the server. */
export function useDeepDive(g: Gestation, preg: Pregnancy, week: WeekContent) {
  const { byDate } = useStore();
  const [dive, setDive] = useState<Dive | null>(null);
  const [err, setErr] = useState("");
  const date = localToday();
  const key = `dive2-${gaLabel(g).replace(" ", "")}`;

  const context = useMemo(() => ({
    pregnant: true,
    today: date,
    gestationalAge: gaLong(g),
    trimester: g.trimester,
    dayOfWeek: g.days,
    dueDate: preg.dueDate,
    thisWeekSummary: week.headline,
    babyThisWeek: week.baby.map((b) => b.t),
    todaysLine: week.days[Math.max(0, Math.min(6, g.days))],
    recentLogs: [0, 1, 2, 3, 4, 5, 6].map((n) => addDays(date, -n)).map((d) => {
      const l = byDate.get(d);
      return l ? { date: d, symptoms: l.symptoms, mood: l.mood, ...l.preg } : null;
    }).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [date, key]);

  useEffect(() => {
    let live = true;
    api.deepDive(date, key, context)
      .then((d) => live && setDive(d))
      .catch((e) => live && setErr((e as Error).message));
    return () => {
      live = false;
    };
  }, [date, key, context]);
  return { dive, err };
}

/** Today's in-depth article: written once a day by AI for this exact gestational day. */
export function DeepDive({ g, preg, week }: { g: Gestation; preg: Pregnancy; week: WeekContent }) {
  const save = useSavePregnancy();
  const { dive, err } = useDeepDive(g, preg, week);
  const [added, setAdded] = useState<string[]>([]);
  const date = localToday();

  if (err) return <p className="small muted">Couldn't write today's deep dive: {err}</p>;
  if (!dive) return <p className="muted row"><span className="spin" /> Writing today's deep dive…</p>;

  const ask = (t: string) => {
    save({ questions: [...preg.questions, { id: newId(), text: t, created: date, done: null }] });
    setAdded([...added, t]);
  };
  return (
    <article className="deep-dive stack">
      <div>
        <div className="tiny muted">Today's deep dive · grab a tea, about {dive.minutes || 4} min</div>
        <h3 className="dive-title">{dive.title}</h3>
      </div>
      {dive.opener && <p className="dive-opener">{dive.opener}</p>}
      {dive.sections.map((s) => (
        <section key={s.heading}>
          <h4>{s.heading}</h4>
          <Prose text={s.body} />
        </section>
      ))}
      {dive.takeaways.length > 0 && (
        <div className="takeaways">
          <div className="tip-label">If you only remember this</div>
          <ul className="tips">{dive.takeaways.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      {dive.signoff && <p className="dive-signoff">{dive.signoff}</p>}
      {dive.tomorrow && <p className="dive-next">🔮 {dive.tomorrow}</p>}
      <button className="btn ghost small" style={{ alignSelf: "flex-start" }} disabled={added.includes(dive.title)} onClick={() => ask(`About today's read, "${dive.title}": `)}>
        {added.includes(dive.title) ? "Added to your questions ✓" : "+ Add a question about this for my doctor"}
      </button>
    </article>
  );
}
