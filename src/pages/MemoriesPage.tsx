import { useState } from "react";
import { localToday, prettyDate } from "../../shared/dates";
import { gaLabel, gestation } from "../../shared/pregnancy";
import { bumpUrl } from "../lib/api";
import { useMemories } from "../lib/memories";
import { usePregnancy } from "../lib/pregnancy";
import type { BumpPhoto, JournalEntry, Pregnancy } from "../../shared/types";
import { useViewer } from "../lib/viewer";

/** #/memories: the bump photo flip-book and every answer to the daily question. */
export function MemoriesPage() {
  const p = usePregnancy();
  if (!p) {
    return (
      <div className="card stack">
        <h2>Memories</h2>
        <p className="muted">Your bump photos and answers to the daily question show up here during a pregnancy.</p>
        <a className="btn primary" href="#/today">Back to today</a>
      </div>
    );
  }
  return <Memories preg={p.preg} />;
}

function Memories({ preg }: { preg: Pregnancy }) {
  const { entries, photos, error, deleteBump } = useMemories(preg);
  const [open, setOpen] = useState<BumpPhoto | null>(null);
  const role = useViewer();
  const today = localToday();
  const names = { me: preg.momName?.trim() || "You", partner: preg.partnerName?.trim() || "Your partner" };
  // One card per day, with both of your answers.
  const days = new Map<string, JournalEntry[]>();
  for (const e of entries ?? []) days.set(e.date, [...(days.get(e.date) ?? []), e]);
  const order = (e: JournalEntry) => ((e.author ?? "me") === role ? 0 : 1);

  return (
    <div className="stack preg">
      <h1>Memories</h1>

      <section className="card stack">
        <div className="row between" style={{ alignItems: "baseline" }}>
          <h3 className="card-h">Your bump, week by week</h3>
          <span className="tiny muted">{photos.length} {photos.length === 1 ? "photo" : "photos"}</span>
        </div>
        {photos.length === 0 ? (
          <p className="small muted">Add a bump photo from Today each week. They'll line up here into a flip-book.</p>
        ) : (
          <div className="bump-grid">
            {photos.map((ph) => (
              <button key={ph.week} className="bump-tile" onClick={() => setOpen(ph)} aria-label={`Week ${ph.week} bump photo`}>
                <img src={bumpUrl(preg.positiveTestDate, ph)} alt="" loading="lazy" />
                <span>Week {ph.week}</span>
              </button>
            ))}
          </div>
        )}
        {open && (
          <div className="bump-big stack">
            <img src={bumpUrl(preg.positiveTestDate, open)} alt={`Week ${open.week} bump`} />
            <div className="row between">
              <span className="small"><b>Week {open.week}</b> · {prettyDate(open.date)}</span>
              <span className="row" style={{ gap: 4 }}>
                <button className="btn ghost danger small" onClick={async () => {
                  if (!confirm(`Delete the week ${open.week} bump photo?`)) return;
                  await deleteBump(open.week);
                  setOpen(null);
                }}>Delete</button>
                <button className="btn ghost small" onClick={() => setOpen(null)}>Close</button>
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <h3 className="card-h">Your answers</h3>
        <p className="small muted">You each answer your own question every day. You see each other's once you've written yours.</p>
        {error && <p className="small muted">Couldn't load your answers: {error}</p>}
        {entries === null && !error && <p className="muted row small"><span className="spin" /></p>}
        {entries?.length === 0 && <p className="small muted">Answer today's question on the Today page and it's saved here.</p>}
        {[...days].map(([date, list]) => (
          <article key={date} className="card stack memory-entry">
            <div className="tiny muted">{prettyDate(date, true)} · {gaLabel(gestation(date, preg))}</div>
            {[...list].sort((a, b) => order(a) - order(b)).map((e) => {
              const author = e.author ?? "me";
              const who = author === role ? "You" : names[author];
              return e.locked ? (
                <p key={author} className="their-locked small">🔒 {who} answered {date === today ? "today. Answer yours on Today to see it." : "this day. You didn't, so that one stays a secret."}</p>
              ) : (
                <div key={author} className="stack" style={{ gap: 4 }}>
                  <div className="tip-label">{who}</div>
                  <p className="question small">{e.prompt}</p>
                  <p className="answer-text">{e.answer}</p>
                </div>
              );
            })}
          </article>
        ))}
      </section>
    </div>
  );
}
