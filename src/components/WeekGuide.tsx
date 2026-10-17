import { useEffect, useRef, useState, type ReactNode } from "react";
import { prettyDate } from "../../shared/dates";
import { standardSchedule } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { rotate, type Item } from "../content/phases";
import {
  CALL_NOW, CALORIES, FOOD_SAFETY, HCG, NUTRIENTS, SYMPTOMS, TRIMESTERS, WEIGHT_GAIN,
  partnerItems, trimesterOf, weekDeep, type WeekContent,
} from "../content/pregnancy";
import { readLocal, writeLocal } from "../lib/pregnancy";
import { useViewer } from "../lib/viewer";
import { BodyMind } from "./BodyMind";

export type GuideTab = "read" | "baby" | "you" | "plan";

/**
 * The week's guide in four tabs: Today's read (the daily AI deep dive, current week only),
 * Baby, You (body and mind, symptoms, food and self-care) and Plan (to-dos, decisions, FAQ). Partner tips
 * live on the partner's own Today; on the partner's phone, Plan shows their role for the week instead.
 * "When to call" sits under every tab so safety info is never hidden. `seed` (gestational day)
 * rotates the trimester tips so they change daily.
 */
export function WeekGuide({ week, preg, seed, recentSymptoms = [], deepDive, initial, current = false }: {
  week: WeekContent; preg: Pregnancy; seed: number; recentSymptoms?: string[]; deepDive?: ReactNode; initial?: GuideTab; current?: boolean;
}) {
  const deep = weekDeep(week.week);
  const viewer = useViewer();
  const tabs: { id: GuideTab; label: string }[] = [
    ...(deepDive ? [{ id: "read" as const, label: "Read" }] : []),
    { id: "baby", label: "Baby" },
    { id: "you", label: "You" },
    { id: "plan", label: "Plan" },
  ];
  const [tab, setTab] = useState<GuideTab>(tabs.some((t) => t.id === initial) ? initial! : tabs[0].id);
  const tri = TRIMESTERS[trimesterOf(week.week)];
  const pick = (pool: Item[], n: number, s: number) => rotate(pool, seed + s).slice(0, n);
  const logged = recentSymptoms.filter((s) => SYMPTOMS[s]);
  const ref = useRef<HTMLElement>(null);
  // Arriving from a Today link (#/week/N/baby): bring the guide into view.
  useEffect(() => {
    if (initial) ref.current?.scrollIntoView({ block: "start" });
  }, [initial]);

  return (
    <section ref={ref} className="card stack week-guide" aria-label={`Week ${week.week} guide`}>
      <div className="tabs guide-tabs" role="tablist" aria-label="Guide sections">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div role="tabpanel" className="fade-in stack" key={tab}>
        {tab === "read" && deepDive}

        {tab === "baby" && (
          <>
            <Prose text={deep.baby} />
            <Group label="This week's milestones" items={week.baby} />
          </>
        )}

        {tab === "you" && (
          <>
            <Prose text={deep.body} />
            <BodyMind week={week.week} logged={recentSymptoms} />
            {logged.length > 0 && (
              <div className="guide-group">
                <div className="tip-label">What you've logged lately</div>
                <div className="tip-grid">{logged.map((s) => <SymptomCard key={s} name={s} />)}</div>
              </div>
            )}
            <Group label="Take care this week" items={[...(week.care.food ?? []), ...pick(tri.food, 2, 1), ...(week.care.movement ?? []), ...pick(tri.movement, 1, 2), ...(week.care.rest ?? []), ...pick(tri.rest, 1, 3)]} />
            <details className="ref">
              <summary>Every symptom, explained</summary>
              <div className="tip-grid">{Object.keys(SYMPTOMS).map((s) => <SymptomCard key={s} name={s} />)}</div>
            </details>
            <details className="ref">
              <summary>Daily nutrient targets</summary>
              <p className="prose-note">{CALORIES}</p>
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
            <details className="ref">
              <summary>Healthy weight gain</summary>
              <table className="ref-table">
                <thead><tr><th>BMI before pregnancy</th><th>Total</th><th>Per week (2nd–3rd tri)</th></tr></thead>
                <tbody>{WEIGHT_GAIN.map((r) => <tr key={r.bmi}><td>{r.bmi}</td><td>{r.total}</td><td>{r.perWeek}</td></tr>)}</tbody>
              </table>
              <p className="tiny muted">Institute of Medicine guidance. About 1–4.5 lb in the whole first trimester is typical.</p>
            </details>
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
          </>
        )}

        {tab === "plan" && (
          <>
            <div className="guide-group">
              <div className="tip-label">To-do this week</div>
              <Todo week={week} preg={preg} />
            </div>
            {deep.decisions?.length ? (
              <details className="ref" open>
                <summary>Decisions coming up</summary>
                <p className="small muted">There's no wrong answer; these are yours to talk through with your doctor.</p>
                <Cards items={deep.decisions} />
              </details>
            ) : null}
            {viewer === "partner" ? (
              <Group label="Your role this week" items={partnerItems(week, preg.momName ?? "")} />
            ) : current ? (
              <a className="partner-link" href="#/partner">
                <span aria-hidden>🤝</span>
                <span><b>{preg.partnerName?.trim() || "Your partner"}'s page</b><span className="tiny muted block">How to help this week, one thing to do each day</span></span>
                <span aria-hidden>›</span>
              </a>
            ) : null}
            <details className="ref">
              <summary>Questions people ask this week</summary>
              <div className="faq">
                {deep.faq.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </details>
          </>
        )}
      </div>

      <details className="ref when-to-call">
        <summary>⚠️ When to call your doctor</summary>
        <Cards items={[...week.watchouts, ...pick(tri.watchouts, 2, 4)]} tone="watch" />
        <div className="tip-label">Call right away for</div>
        <ul className="tips">{CALL_NOW.map((i) => <li key={i.t}>{i.t}</li>)}</ul>
      </details>
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
