import { useRef, useState } from "react";
import { prettyDate } from "../../shared/dates";
import type { Gestation } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { todaysPrompt } from "../content/pregnancy";
import { bumpUrl } from "../lib/api";
import { useMemories } from "../lib/memories";

/**
 * The day's last card: one question to answer (or, on some days, a little moment to make), plus
 * this week's bump photo. Answers and photos are kept on the Memories page.
 */
export function TodaysQuestion({ g, preg, today }: { g: Gestation; preg: Pregnancy; today: string }) {
  const { entries, photos, error, saveAnswer, saveBump } = useMemories(preg);
  const prompt = todaysPrompt(g.totalDays, preg.partnerName);
  const mine = entries?.find((e) => e.date === today);
  const before = entries?.find((e) => e.date !== today && e.prompt === prompt.t);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const editing = draft !== null || (!mine && entries !== null);
  const text = draft ?? mine?.answer ?? "";

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await saveAnswer({ date: today, prompt: prompt.t, answer: text });
      setDraft(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card stack question-card" aria-label="Today's question">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <h3 className="card-h">{prompt.moment ? "A moment for today ✨" : "Today's question"}</h3>
        <a className="small" href="#/memories">Memories ›</a>
      </div>
      <p className="question">{prompt.t}</p>
      {prompt.hint && <p className="small muted">{prompt.hint}</p>}

      {entries === null ? (
        error ? <p className="small muted">Couldn't load your answers: {error}</p> : <p className="muted row small"><span className="spin" /></p>
      ) : editing ? (
        <form className="stack" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); save(); }}>
          <textarea value={text} rows={3} placeholder="Write as much or as little as you like…" onChange={(e) => setDraft(e.target.value)} aria-label="Your answer" />
          <div className="row" style={{ gap: 8 }}>
            <button className="btn primary small" disabled={busy || !text.trim()}>{busy ? <span className="spin" /> : "Save"}</button>
            {mine && <button type="button" className="btn ghost small" onClick={() => setDraft(null)}>Cancel</button>}
          </div>
          {err && <p className="small" style={{ color: "var(--period)" }}>Couldn't save: {err}</p>}
        </form>
      ) : (
        <button className="answer" onClick={() => setDraft(mine!.answer)} aria-label="Edit your answer">
          <span>{mine!.answer}</span>
          <span className="why-hint">Edit</span>
        </button>
      )}
      {before && editing && !mine && (
        <p className="small muted last-time">Last time ({prettyDate(before.date)}): “{before.answer.length > 140 ? before.answer.slice(0, 140) + "…" : before.answer}”</p>
      )}

      <BumpRow g={g} preg={preg} today={today} has={photos.find((p) => p.week === g.weeks)} onPick={(f) => saveBump(g.weeks, today, f)} />
    </section>
  );
}

function BumpRow({ g, preg, today, has, onPick }: {
  g: Gestation; preg: Pregnancy; today: string; has?: { week: number; date: string }; onPick: (f: File) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const bumpDay = g.days === 0;
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      await onPick(f);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className={`bump-row${bumpDay && !has ? " bump-day" : ""}`}>
      {has ? (
        <a href="#/memories"><img className="bump-thumb" src={bumpUrl(preg.positiveTestDate, has)} alt={`Week ${g.weeks} bump`} /></a>
      ) : (
        <span className="bump-thumb empty" aria-hidden>📸</span>
      )}
      <span className="stack" style={{ gap: 0, flex: 1, minWidth: 0 }}>
        <b className="small">{has ? `Week ${g.weeks} bump photo` : bumpDay ? "It's bump day!" : `Week ${g.weeks} bump photo`}</b>
        <span className="tiny muted">
          {has ? `Taken ${prettyDate(has.date)}${has.date === today ? " · today" : ""}` : "Same spot, same pose each week makes a lovely flip-book."}
        </span>
        {err && <span className="tiny" style={{ color: "var(--period)" }}>Couldn't save: {err}</span>}
      </span>
      <button className="btn small" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? <span className="spin" /> : has ? "Replace" : "Add"}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
