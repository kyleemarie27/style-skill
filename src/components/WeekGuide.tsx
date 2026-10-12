import { useState, type ReactNode } from "react";
import { prettyDate } from "../../shared/dates";
import { standardSchedule } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { rotate, type Item } from "../content/phases";
import {
  CALL_NOW, CALORIES, FOOD_SAFETY, HCG, NUTRIENTS, SYMPTOMS, TRIMESTERS, WEIGHT_GAIN,
  trimesterOf, weekDeep, type WeekContent,
} from "../content/pregnancy";
import { readLocal, writeLocal } from "../lib/pregnancy";

type TabId = "deep" | "baby" | "body" | "care" | "watch" | "decide" | "faq" | "todo" | "partner";

/**
 * "This week": the week's guide in tabs. Each tab leads with a real explainer, then tables,
 * explainers for symptoms you've logged, and short tappable cards. `seed` (gestational day)
 * rotates the trimester tips so they change daily. `deepDive` (Today only) adds the daily
 * AI deep dive as the first tab.
 */
export function WeekGuide({ week, preg, seed, recentSymptoms = [], deepDive }: {
  week: WeekContent; preg: Pregnancy; seed: number; recentSymptoms?: string[]; deepDive?: ReactNode;
}) {
  const deep = weekDeep(week.week);
  const tabs: { id: TabId; label: string; icon: string }[] = [
    ...(deepDive ? [{ id: "deep" as const, label: "Deep dive", icon: "📖" }] : []),
    { id: "baby", label: "Baby", icon: "👶" },
    { id: "body", label: "Your body", icon: "🌙" },
    { id: "care", label: "Take care", icon: "🫖" },
    { id: "watch", label: "Watch for", icon: "⚠️" },
    ...(deep.decisions?.length ? [{ id: "decide" as const, label: "Decisions", icon: "🧭" }] : []),
    { id: "faq", label: "FAQ", icon: "💬" },
    { id: "todo", label: "To-do", icon: "✅" },
    { id: "partner", label: "Partner", icon: "🤝" },
  ];
  const [tab, setTab] = useState<TabId>(tabs[0].id);
  const tri = TRIMESTERS[trimesterOf(week.week)];
  const pick = (pool: Item[], n: number, s: number) => rotate(pool, seed + s).slice(0, n);
  const logged = recentSymptoms.filter((s) => SYMPTOMS[s]);

  return (
    <section className="card stack week-guide" aria-label={`Week ${week.week} guide`}>
      <div>
        <div className="section-title"><span className="ico" aria-hidden>🗓️</span>Week {week.week} · {tri.name}</div>
        <h2 style={{ marginTop: 6 }}>{week.headline}</h2>
      </div>
      <div className="seg scroll" role="tablist" aria-label="Guide sections">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="fade-in stack" key={tab}>
        {tab === "deep" && deepDive}

        {tab === "baby" && (
          <>
            <Prose text={deep.baby} />
            <Group label="This week's milestones" items={week.baby} />
          </>
        )}

        {tab === "body" && (
          <>
            <Prose text={deep.body} />
            {logged.length > 0 && (
              <div className="guide-group">
                <div className="tip-label">What you've logged lately</div>
                <div className="tip-grid">{logged.map((s) => <SymptomCard key={s} name={s} />)}</div>
              </div>
            )}
            <Group label="Body" items={week.body} />
            <Group label="Mind & mood" items={week.mind} />
            {week.week <= 16 && (
              <details className="ref">
                <summary>Typical hCG levels by week</summary>
                <table className="ref-table">
                  <thead><tr><th>Weeks</th><th>hCG (mIU/mL)</th></tr></thead>
                  <tbody>{HCG.map((r) => <tr key={r.weeks}><td>{r.weeks}</td><td>{r.range}</td></tr>)}</tbody>
                </table>
                <p className="tiny muted">Ranges are very wide. Doctors look at whether hCG rises over 48 hours, not at a single number.</p>
              </details>
            )}
            <details className="ref">
              <summary>Every symptom, explained</summary>
              <div className="tip-grid">{Object.keys(SYMPTOMS).map((s) => <SymptomCard key={s} name={s} />)}</div>
            </details>
          </>
        )}

        {tab === "care" && (
          <>
            <p className="prose-note">{CALORIES}</p>
            <Group label="Food" items={[...(week.care.food ?? []), ...pick(tri.food, 3, 1)]} />
            <details className="ref">
              <summary>Daily nutrient targets</summary>
              <ul className="nutrients">
                {NUTRIENTS.map((n) => (
                  <li key={n.name}>
                    <div className="row between" style={{ alignItems: "baseline" }}><b>{n.name}</b><span className="nut-target">{n.target}</span></div>
                    <div className="small">{n.why}</div>
                    <div className="tiny muted">{n.sources}</div>
                  </li>
                ))}
              </ul>
            </details>
            <details className="ref">
              <summary>Food & medicine safety</summary>
              <p className="small"><b>Enjoy:</b> {FOOD_SAFETY.enjoy}</p>
              <p className="small"><b>Avoid:</b> {FOOD_SAFETY.avoid}</p>
              <p className="small"><b>Medicines:</b> {FOOD_SAFETY.meds}</p>
            </details>
            <Group label="Movement" items={[...(week.care.movement ?? []), ...pick(tri.movement, 2, 2)]} />
            <Group label="Rest & self-care" items={[...(week.care.rest ?? []), ...pick(tri.rest, 2, 3)]} />
            <details className="ref">
              <summary>Healthy weight gain</summary>
              <table className="ref-table">
                <thead><tr><th>BMI before pregnancy</th><th>Total</th><th>Per week (2nd–3rd tri)</th></tr></thead>
                <tbody>{WEIGHT_GAIN.map((r) => <tr key={r.bmi}><td>{r.bmi}</td><td>{r.total}</td><td>{r.perWeek}</td></tr>)}</tbody>
              </table>
              <p className="tiny muted">Institute of Medicine guidance. About 1–4.5 lb in the whole first trimester is typical.</p>
            </details>
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

        {tab === "decide" && deep.decisions && (
          <>
            <p className="prose-note">Choices coming up. There's no wrong answer; these are yours to talk through with your doctor.</p>
            <Cards items={deep.decisions} />
          </>
        )}

        {tab === "faq" && (
          <div className="faq">
            {deep.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        )}

        {tab === "todo" && <Todo week={week} preg={preg} />}
        {tab === "partner" && <Cards items={week.partner} />}
      </div>
    </section>
  );
}

export function Prose({ text }: { text: string }) {
  return <div className="prose">{text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p.trim()}</p>)}</div>;
}

function SymptomCard({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const s = SYMPTOMS[name];
  return (
    <button className="tip-card has-why symptom-card" aria-expanded={open} onClick={() => setOpen(!open)}>
      <p><b>{name}</b></p>
      <p className="why">{s.why}</p>
      {open ? (
        <>
          <div className="tip-label">What helps</div>
          <ul className="tips small">{s.helps.map((h) => <li key={h}>{h}</li>)}</ul>
          <div className="tip-label">Call your doctor if</div>
          <p className="small">{s.call}</p>
        </>
      ) : <span className="why-hint">What helps · when to call</span>}
    </button>
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
  return <div className="tip-grid">{items.map((i) => <TipCard key={i.t} item={i} tone={tone} />)}</div>;
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
