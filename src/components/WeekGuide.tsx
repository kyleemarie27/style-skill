import { useState } from "react";
import { prettyDate } from "../../shared/dates";
import { standardSchedule } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { rotate, type Item } from "../content/phases";
import { CALL_NOW, TRIMESTERS, trimesterOf, type WeekContent } from "../content/pregnancy";
import { readLocal, writeLocal } from "../lib/pregnancy";

type TabId = "baby" | "body" | "care" | "watch" | "todo" | "partner";
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "baby", label: "Baby", icon: "👶" },
  { id: "body", label: "Your body", icon: "🌙" },
  { id: "care", label: "Take care", icon: "🫖" },
  { id: "watch", label: "Watch for", icon: "⚠️" },
  { id: "todo", label: "To-do", icon: "✅" },
  { id: "partner", label: "Partner", icon: "🤝" },
];

/**
 * "This week": the week's guide as a scrollable tab bar of short, tappable cards instead of
 * one long list. `seed` (gestational day) rotates the trimester tips so they change daily.
 */
export function WeekGuide({ week, preg, seed, initialTab = "baby" }: { week: WeekContent; preg: Pregnancy; seed: number; initialTab?: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const tri = TRIMESTERS[trimesterOf(week.week)];
  const pick = (pool: Item[], n: number, s: number) => rotate(pool, seed + s).slice(0, n);

  return (
    <section className="card stack week-guide" aria-label={`Week ${week.week} guide`}>
      <div>
        <div className="section-title"><span className="ico" aria-hidden>🗓️</span>Week {week.week} · {tri.name}</div>
        <h2 style={{ marginTop: 6 }}>{week.headline}</h2>
      </div>
      <div className="seg scroll" role="tablist" aria-label="Guide sections">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="fade-in" key={tab}>
        {tab === "baby" && <Cards items={week.baby} />}
        {tab === "body" && (
          <>
            <Group label="Body" items={week.body} />
            <Group label="Mind & mood" items={week.mind} />
          </>
        )}
        {tab === "care" && (
          <>
            <Group label="Food" items={[...(week.care.food ?? []), ...pick(tri.food, 3, 1)]} />
            <Group label="Movement" items={[...(week.care.movement ?? []), ...pick(tri.movement, 2, 2)]} />
            <Group label="Rest & self-care" items={[...(week.care.rest ?? []), ...pick(tri.rest, 2, 3)]} />
          </>
        )}
        {tab === "watch" && (
          <>
            <Cards items={[...week.watchouts, ...pick(tri.watchouts, 2, 4)]} tone="watch" />
            <div className="call-now">
              <div className="tip-label">Call your doctor right away for</div>
              <ul className="tips">{CALL_NOW.map((i) => <li key={i.t}>{i.t}</li>)}</ul>
            </div>
          </>
        )}
        {tab === "todo" && <Todo week={week} preg={preg} />}
        {tab === "partner" && <Cards items={week.partner} />}
      </div>
    </section>
  );
}

function Group({ label, items }: { label: string; items: Item[] }) {
  if (!items.length) return null;
  return (
    <div className="guide-group">
      <div className="tip-label">{label}</div>
      <Cards items={items} />
    </div>
  );
}

function Cards({ items, tone }: { items: Item[]; tone?: "watch" }) {
  return (
    <div className="tip-grid">
      {items.map((i) => <TipCard key={i.t} item={i} tone={tone} />)}
    </div>
  );
}

function TipCard({ item, tone }: { item: Item; tone?: "watch" }) {
  const [open, setOpen] = useState(false);
  const cls = `tip-card${tone ? " " + tone : ""}`;
  if (!item.why) return <div className={cls}><p>{item.t}</p></div>;
  return (
    <button className={cls + " has-why"} aria-expanded={open} onClick={() => setOpen(!open)}>
      <p>{item.t}</p>
      {open ? <p className="why">{item.why}</p> : <span className="why-hint">Why?</span>}
    </button>
  );
}

function Todo({ week, preg }: { week: WeekContent; preg: Pregnancy }) {
  const key = `bloom-todo-${preg.positiveTestDate}-w${week.week}`;
  const [done, setDone] = useState<string[]>(() => readLocal(key, []));
  const toggle = (t: string) => {
    const next = done.includes(t) ? done.filter((x) => x !== t) : [...done, t];
    setDone(next);
    writeLocal(key, next);
  };
  const due = standardSchedule(preg).filter((s) => week.week >= s.fromWeek && week.week <= s.toWeek);
  return (
    <div className="stack" style={{ gap: 10 }}>
      <ul className="checklist">
        {week.todo.map((i) => (
          <li key={i.t}>
            <label>
              <input type="checkbox" checked={done.includes(i.t)} onChange={() => toggle(i.t)} />
              <span>{i.t}{i.why && <span className="why"> {i.why}</span>}</span>
            </label>
          </li>
        ))}
      </ul>
      {due.length > 0 && (
        <div className="call-now">
          <div className="tip-label">Usually around now</div>
          <ul className="tips">
            {due.map((s) => (
              <li key={s.id}>
                <b>{s.title}</b>{s.optional ? " (optional)" : ""} <span className="muted small">· weeks {s.fromWeek}{s.toWeek !== s.fromWeek ? `–${s.toWeek}` : ""}, {prettyDate(s.from)}–{prettyDate(s.to)}</span>
              </li>
            ))}
          </ul>
          <a className="btn ghost small" href="#/doctor">See all appointments →</a>
        </div>
      )}
    </div>
  );
}
