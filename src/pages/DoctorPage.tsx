import { useMemo, useState } from "react";
import { addDays, diffDays, localToday, prettyDate } from "../../shared/dates";
import { gaLabel, gestation, pregnancyFlags, standardSchedule } from "../../shared/pregnancy";
import type { Appointment, DayLog, Pregnancy } from "../../shared/types";
import { FIRST_VISIT } from "../content/pregnancy";
import { newId, usePregnancy, useSavePregnancy } from "../lib/pregnancy";
import { useStore } from "../lib/store";

/** #/doctor: appointments, questions, and a visit summary to print or show. */
export function DoctorPage() {
  const p = usePregnancy();
  if (!p) {
    return (
      <div className="card stack">
        <h2>Doctor</h2>
        <p className="muted">Appointments, questions and visit summaries turn on once you log a positive pregnancy test.</p>
      </div>
    );
  }
  const { preg } = p;
  return (
    <div className="stack">
      <h1>Doctor</h1>
      <Appointments preg={preg} />
      <Questions preg={preg} />
      <VisitSummary preg={preg} />
      {p.g.weeks < 13 && (
        <section className="card stack">
          <div className="section-title"><span className="ico" aria-hidden>🩺</span>What they'll ask at your first visit</div>
          <ul className="tips">
            {FIRST_VISIT.map((i) => <li key={i.t}>{i.t}{i.why && <span className="why"> {i.why}</span>}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function Appointments({ preg }: { preg: Pregnancy }) {
  const save = useSavePregnancy();
  const today = localToday();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Appointment>({ id: "", date: today, title: "", notes: "" });
  const mine = [...preg.appointments].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = mine.filter((a) => a.date >= today);
  const schedule = standardSchedule(preg);
  const [showAll, setShowAll] = useState(false);

  const add = async () => {
    if (!draft.title.trim()) return;
    await save({ appointments: [...preg.appointments, { ...draft, id: newId(), title: draft.title.trim() }] });
    setDraft({ id: "", date: today, title: "", notes: "" });
    setAdding(false);
  };
  const remove = (id: string) => save({ appointments: preg.appointments.filter((a) => a.id !== id) });

  return (
    <section className="card stack">
      <div className="row between">
        <div className="section-title"><span className="ico" aria-hidden>📅</span>Appointments</div>
        <button className="btn ghost small" onClick={() => setAdding(!adding)}>{adding ? "Cancel" : "+ Add"}</button>
      </div>
      {adding && (
        <div className="stack add-box">
          <div className="grid2">
            <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} aria-label="Date" />
            <input type="text" placeholder="e.g. First prenatal visit" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="What" />
          </div>
          <input type="text" placeholder="Notes (time, place, who)" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} aria-label="Notes" />
          <button className="btn primary" onClick={add} disabled={!draft.title.trim()}>Save appointment</button>
        </div>
      )}
      {upcoming.length === 0 && !adding && <p className="small muted">No appointments saved yet. Add yours so they show up on your visit summary.</p>}
      {mine.map((a) => (
        <div key={a.id} className={`appt${a.date < today ? " past" : ""}`}>
          <div className="appt-date"><b>{prettyDate(a.date).split(" ")[1]}</b><span>{prettyDate(a.date).split(" ")[0]}</span></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{a.title}</b>
            <div className="tiny muted">{a.date === today ? "Today" : a.date > today ? `In ${diffDays(a.date, today)} days` : "Done"} · {gaLabel(gestation(a.date, preg))}{a.notes ? ` · ${a.notes}` : ""}</div>
          </div>
          <button className="btn ghost danger small" onClick={() => remove(a.id)} aria-label={`Delete ${a.title}`}>✕</button>
        </div>
      ))}

      <div className="schedule">
        <div className="row between"><b>Typical prenatal schedule</b><span className="small muted">dates for you</span></div>
        <ol className="timeline">
          {(showAll ? schedule : schedule.filter((s) => s.to >= today).slice(0, 4)).map((s) => {
            const state = today > s.to ? "past" : today >= s.from ? "now" : "next";
            return (
              <li key={s.id} className={state}>
                <span className="tl-dot" aria-hidden />
                <div>
                  <b>{s.title}</b>{s.optional && <span className="tiny muted"> · optional</span>}{state === "now" && <span className="now-pill">Now</span>}
                  <div className="tiny muted">Weeks {s.fromWeek}{s.toWeek !== s.fromWeek ? `–${s.toWeek}` : ""} · {prettyDate(s.from)} – {prettyDate(s.to)}</div>
                  <div className="small">{s.what}</div>
                </div>
              </li>
            );
          })}
        </ol>
        <button className="btn ghost small" onClick={() => setShowAll(!showAll)}>{showAll ? "Show what's next" : "Show the full schedule"}</button>
        <p className="tiny muted">Based on ACOG guidance. Your practice may do things in a different order.</p>
      </div>
    </section>
  );
}

function Questions({ preg }: { preg: Pregnancy }) {
  const save = useSavePregnancy();
  const [text, setText] = useState("");
  const open = preg.questions.filter((q) => !q.done);
  const done = preg.questions.filter((q) => q.done);
  const add = async () => {
    if (!text.trim()) return;
    await save({ questions: [...preg.questions, { id: newId(), text: text.trim(), created: localToday(), done: null }] });
    setText("");
  };
  const toggle = (id: string) =>
    save({ questions: preg.questions.map((q) => (q.id === id ? { ...q, done: q.done ? null : localToday() } : q)) });
  const remove = (id: string) => save({ questions: preg.questions.filter((q) => q.id !== id) });

  return (
    <section className="card stack">
      <div className="section-title"><span className="ico" aria-hidden>❓</span>Questions for my doctor</div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input type="text" placeholder="Write it down before you forget…" value={text} onChange={(e) => setText(e.target.value)} aria-label="New question" />
        <button className="btn primary" disabled={!text.trim()}>Add</button>
      </form>
      {open.length === 0 && <p className="small muted">Nothing yet. Ideas: Which prenatal do you recommend? Is my medication safe? When is my first ultrasound?</p>}
      <ul className="checklist">
        {open.map((q) => (
          <li key={q.id}>
            <label><input type="checkbox" checked={false} onChange={() => toggle(q.id)} /><span>{q.text}</span></label>
            <button className="btn ghost danger small" onClick={() => remove(q.id)} aria-label="Delete question">✕</button>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <details>
          <summary className="small muted">{done.length} answered</summary>
          <ul className="checklist done">
            {done.map((q) => (
              <li key={q.id}>
                <label><input type="checkbox" checked onChange={() => toggle(q.id)} /><span>{q.text} <span className="tiny muted">· {prettyDate(q.done!)}</span></span></label>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

const NAUSEA_SCORE = { none: 0, mild: 1, moderate: 2, severe: 3 } as const;

function VisitSummary({ preg }: { preg: Pregnancy }) {
  const { dayLogs, model } = useStore();
  const today = localToday();
  const lastVisit = [...preg.appointments].filter((a) => a.date < today).sort((a, b) => b.date.localeCompare(a.date))[0];
  const [from, setFrom] = useState(lastVisit ? addDays(lastVisit.date, 1) : preg.lmp);
  const [to, setTo] = useState(today);
  const logs = useMemo(() => dayLogs.filter((l) => l.date >= from && l.date <= to), [dayLogs, from, to]);
  const s = useMemo(() => summarize(logs), [logs]);
  const flags = pregnancyFlags(dayLogs, preg, today);
  const g = gestation(today, preg);
  const cycleLen = model.avgCycleLength;
  const span = diffDays(to, from) + 1;
  const days = Array.from({ length: Math.min(span, 60) }, (_, i) => addDays(to, -Math.min(span, 60) + 1 + i));
  const byDate = new Map(logs.map((l) => [l.date, l]));

  return (
    <section className="card stack print-area">
      <div className="row between wrap no-print">
        <div className="section-title"><span className="ico" aria-hidden>📋</span>Visit summary</div>
        <button className="btn" onClick={() => window.print()}>Print / save PDF</button>
      </div>
      <div className="grid2 no-print">
        <label><div className="field-label">From</div><input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} /></label>
        <label><div className="field-label">To</div><input type="date" value={to} min={from} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} /></label>
      </div>

      <div className="print-only"><h2>Pregnancy summary · {prettyDate(from)} – {prettyDate(to)}, {to.slice(0, 4)}</h2></div>

      <div className="sum-facts">
        <div><span>Gestational age today</span><b>{gaLabel(g)}</b></div>
        <div><span>Due date</span><b>{prettyDate(preg.dueDate)}, {preg.dueDate.slice(0, 4)}</b><span className="tiny">by {preg.dueDateSource === "doctor" ? "doctor/ultrasound" : preg.dueDateSource === "ovulation" ? "tracked ovulation" : "last period"}</span></div>
        <div><span>Last period (LMP)</span><b>{prettyDate(preg.lmp)}, {preg.lmp.slice(0, 4)}</b><span className="tiny">avg cycle {cycleLen} days</span></div>
        <div><span>Positive test</span><b>{prettyDate(preg.positiveTestDate)}</b></div>
      </div>

      {flags.length > 0 && (
        <div className="sum-block">
          <h3>Warning signs logged recently</h3>
          <ul className="tips">{flags.map((f) => <li key={f.id}><b>{f.title}</b> ({prettyDate(f.date)})</li>)}</ul>
        </div>
      )}

      <div className="sum-block">
        <h3>Bleeding & pain</h3>
        {s.bleeding.length === 0 && s.pain.length === 0 ? <p className="small">None logged.</p> : (
          <ul className="tips">
            {s.bleeding.map((b) => <li key={"b" + b.date}>{prettyDate(b.date)}: {b.level === "spotting" ? "spotting" : `${b.level} bleeding`}</li>)}
            {s.pain.map((b) => <li key={"p" + b.date}>{prettyDate(b.date)}: {b.level} cramping/pain{b.oneSided ? ", one-sided" : ""}</li>)}
          </ul>
        )}
      </div>

      <div className="sum-block">
        <h3>Nausea & vomiting</h3>
        {s.nauseaDays === 0 ? <p className="small">None logged.</p> : (
          <>
            <p className="small">Nausea on {s.nauseaDays} of {s.loggedDays} logged days{s.severeDays ? ` (${s.severeDays} severe)` : ""}. Vomited {s.vomits} time{s.vomits === 1 ? "" : "s"} in total{s.maxVomits ? `, most in a day: ${s.maxVomits}` : ""}.</p>
            <div className="bars" aria-label="Daily nausea">
              {days.map((d) => {
                const l = byDate.get(d);
                const n = l?.preg?.nausea ? NAUSEA_SCORE[l.preg.nausea] : 0;
                return <span key={d} title={`${prettyDate(d)}: ${l?.preg?.nausea ?? "not logged"}${l?.preg?.vomits ? `, vomited ${l.preg.vomits}×` : ""}`} style={{ height: `${8 + n * 12}px`, opacity: l ? 1 : 0.25 }} className={`n${n}`} />;
              })}
            </div>
            <div className="row between tiny muted"><span>{prettyDate(days[0])}</span><span>none · mild · moderate · severe</span><span>{prettyDate(days.at(-1)!)}</span></div>
          </>
        )}
      </div>

      <div className="sum-block">
        <h3>Symptoms</h3>
        {s.symptoms.length === 0 ? <p className="small">None logged.</p> : (
          <div className="chips">{s.symptoms.map(([name, n]) => <span key={name} className="chip static">{name} <span className="muted tiny">{n} day{n === 1 ? "" : "s"}</span></span>)}</div>
        )}
        {s.moods.length > 0 && <p className="small" style={{ marginTop: 8 }}>Mood: {s.moods.map(([m, n]) => `${m.toLowerCase()} (${n})`).join(", ")}</p>}
      </div>

      {(s.vitals.length > 0) && (
        <div className="sum-block">
          <h3>Weight, blood pressure & temperature</h3>
          <table className="sum-table">
            <thead><tr><th>Date</th><th>Weight</th><th>BP</th><th>Temp</th></tr></thead>
            <tbody>
              {s.vitals.map((v) => (
                <tr key={v.date}><td>{prettyDate(v.date)}</td><td>{v.weight ? `${v.weight} lb` : "–"}</td><td>{v.bp ?? "–"}</td><td>{v.temp ? `${v.temp}°F` : "–"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sum-block">
        <h3>Prenatal vitamin & medications</h3>
        <p className="small">Prenatal vitamin logged on {s.prenatal} of {s.loggedDays} logged days.</p>
        {s.meds.length > 0 && <p className="small">Medications: {s.meds.join("; ")}</p>}
      </div>

      {s.notes.length > 0 && (
        <div className="sum-block">
          <h3>Notes</h3>
          <ul className="tips">{s.notes.map((n) => <li key={n.date}>{prettyDate(n.date)}: {n.text}</li>)}</ul>
        </div>
      )}

      <div className="sum-block">
        <h3>My questions</h3>
        {preg.questions.filter((q) => !q.done).length === 0 ? <p className="small">None written down.</p> : (
          <ol className="small">{preg.questions.filter((q) => !q.done).map((q) => <li key={q.id}>{q.text}</li>)}</ol>
        )}
      </div>
      <p className="tiny muted">From Bloom, a personal tracker. Self-reported; {s.loggedDays} days logged in this range.</p>
    </section>
  );
}

function summarize(logs: DayLog[]) {
  const sym = new Map<string, number>();
  const moods = new Map<string, number>();
  const meds = new Set<string>();
  let nauseaDays = 0, severeDays = 0, vomits = 0, maxVomits = 0, prenatal = 0;
  const bleeding: { date: string; level: string }[] = [];
  const pain: { date: string; level: string; oneSided: boolean }[] = [];
  const vitals: { date: string; weight?: number | null; bp?: string; temp?: number | null }[] = [];
  const notes: { date: string; text: string }[] = [];
  for (const l of logs) {
    const p = l.preg ?? {};
    for (const s of l.symptoms ?? []) sym.set(s, (sym.get(s) ?? 0) + 1);
    for (const m of l.mood?.split(/,\s*/) ?? []) if (m) moods.set(m, (moods.get(m) ?? 0) + 1);
    if (p.nausea && p.nausea !== "none") nauseaDays++;
    if (p.nausea === "severe") severeDays++;
    vomits += p.vomits ?? 0;
    maxVomits = Math.max(maxVomits, p.vomits ?? 0);
    if (p.prenatal) prenatal++;
    if (p.meds) meds.add(p.meds);
    if (p.bleeding && p.bleeding !== "none") bleeding.push({ date: l.date, level: p.bleeding });
    if (p.pain && p.pain !== "none") pain.push({ date: l.date, level: p.pain, oneSided: !!p.painOneSided });
    if (p.weight || p.bpSys || p.temp) vitals.push({ date: l.date, weight: p.weight, bp: p.bpSys && p.bpDia ? `${p.bpSys}/${p.bpDia}` : undefined, temp: p.temp });
    if (l.notes) notes.push({ date: l.date, text: l.notes });
  }
  return {
    loggedDays: logs.length,
    nauseaDays, severeDays, vomits, maxVomits, prenatal, bleeding, pain, vitals, notes,
    meds: [...meds],
    symptoms: [...sym.entries()].sort((a, b) => b[1] - a[1]),
    moods: [...moods.entries()].sort((a, b) => b[1] - a[1]),
  };
}
