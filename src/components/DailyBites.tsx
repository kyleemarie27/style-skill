import { useState } from "react";
import { addDays } from "../../shared/dates";
import type { Gestation } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { dailyBites, dailyTodos, nextMilestone, type Bite, type WeekContent } from "../content/pregnancy";
import { readLocal, writeLocal } from "../lib/pregnancy";

const dayKey = (date: string) => `bloom-bites-${date}`;

/** Days in a row (ending today, or yesterday if nothing is checked yet today) with at least one to-do done. */
function streak(today: string): number {
  let d = readLocal<string[]>(dayKey(today), []).length ? today : addDays(today, -1);
  let n = 0;
  while (n < 365 && readLocal<string[]>(dayKey(d), []).length) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Today's bites: three quick insights to tap through and three small to-dos to check off. New every day. */
export function DailyBites({ g, preg, week, today }: { g: Gestation; preg: Pregnancy; week: WeekContent; today: string }) {
  const bites = dailyBites(week, g.days, g.totalDays);
  const todos = dailyTodos(week, g.days, g.totalDays);
  const weekKey = `bloom-todo-${preg.positiveTestDate}-w${week.week}`;
  const [done, setDone] = useState<string[]>(() => readLocal(dayKey(today), []));
  const [weekDone, setWeekDone] = useState<string[]>(() => readLocal(weekKey, []));
  const isDone = (t: string, scope: "day" | "week") => done.includes(t) || (scope === "week" && weekDone.includes(t));

  const toggle = (t: string, scope: "day" | "week") => {
    const on = !isDone(t, scope);
    const next = on ? [...done, t] : done.filter((x) => x !== t);
    setDone(next);
    writeLocal(dayKey(today), next);
    if (scope === "week") {
      const w = on ? [...weekDone, t] : weekDone.filter((x) => x !== t);
      setWeekDone(w);
      writeLocal(weekKey, w);
    }
  };

  const count = todos.filter((i) => isDone(i.t, i.scope)).length;
  const days = streak(today);
  const next = nextMilestone(g.totalDays);

  return (
    <section className="card stack bites" aria-label="Today's bites">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <div className="section-title"><span className="ico" aria-hidden>🍪</span>Today's bites</div>
        <span className="tiny muted">New every morning</span>
      </div>

      {next && (
        <div className="milestone">
          <div className="ms-days"><b>{next.inDays}</b><span>{next.inDays === 1 ? "day" : "days"}</span></div>
          <div className="small"><span className="tiny muted">Coming up · week {next.week}</span><br />{next.icon} {next.t}</div>
        </div>
      )}

      <div className="bite-rail">
        {bites.map((b) => <BiteCard key={b.t} bite={b} />)}
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <div className="row between" style={{ alignItems: "center" }}>
          <h3 className="bites-h">Little things for today</h3>
          <span className={`bite-count${count === todos.length ? " all" : ""}`}>{count}/{todos.length}</span>
        </div>
        <ul className="checklist">
          {todos.map((i) => (
            <li key={i.t}>
              <label>
                <input type="checkbox" checked={isDone(i.t, i.scope)} onChange={() => toggle(i.t, i.scope)} />
                <span>
                  {i.t}
                  {i.scope === "week" && <span className="week-tag">This week</span>}
                  {i.why && <span className="why"> {i.why}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {count === todos.length ? (
          <p className="bites-done">All done for today. That's real care for you and the baby. 🎉</p>
        ) : days >= 2 ? (
          <p className="tiny muted">🔥 {days} days in a row. Keep it going.</p>
        ) : null}
      </div>
    </section>
  );
}

function BiteCard({ bite }: { bite: Bite }) {
  const [open, setOpen] = useState(false);
  const Tag = bite.why ? "button" : "div";
  return (
    <Tag className={`bite${bite.why ? " has-why" : ""}`} aria-expanded={bite.why ? open : undefined} onClick={bite.why ? () => setOpen(!open) : undefined}>
      <span className="bite-tag"><span aria-hidden>{bite.icon}</span> {bite.tag}</span>
      <p>{bite.t}</p>
      {bite.why && (open ? <p className="why">{bite.why}</p> : <span className="why-hint">Tell me more</span>)}
    </Tag>
  );
}
