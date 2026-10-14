import { useEffect, useState } from "react";
import { prettyDate } from "../../shared/dates";
import { api, type Fact } from "../lib/api";
import { newId } from "../lib/pregnancy";

/** What Bloom remembers about you from chat. Used in Ask Bloom, the daily note and the deep dive. */
export function MemoryCard() {
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.memory().then((r) => setFacts(r.facts)).catch((e) => setErr((e as Error).message));
  }, []);

  const save = (next: Fact[]) => {
    setFacts(next);
    api.saveMemory(next).then((r) => setFacts(r.facts)).catch((e) => setErr((e as Error).message));
  };
  const add = () => {
    if (!draft.trim() || !facts) return;
    save([...facts, { id: newId(), text: draft.trim(), added: new Date().toISOString().slice(0, 10) }]);
    setDraft("");
  };

  return (
    <div className="card stack">
      <h2>What Bloom remembers</h2>
      <p className="muted small">
        Things you've mentioned in Ask Bloom that help it answer you specifically. They're used in chats, your daily note and the deep dive. Remove anything that's wrong or that you'd rather it forgot.
      </p>
      {err && <div className="notice err small">{err}</div>}
      {facts === null && !err && <p className="muted row small"><span className="spin" /> Loading…</p>}
      {facts?.length === 0 && <p className="small muted">Nothing yet. Chat with Bloom, or add something below (for example "First pregnancy" or "Vegetarian").</p>}
      {facts && facts.length > 0 && (
        <ul className="memory-list">
          {facts.map((f) => (
            <li key={f.id}>
              <span>{f.text} <span className="tiny muted">· {prettyDate(f.added)}</span></span>
              <button className="btn ghost small" aria-label={`Forget "${f.text}"`} onClick={() => save(facts.filter((x) => x.id !== f.id))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      {facts && (
        <form className="row" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <input type="text" placeholder="Add something about you…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Something Bloom should remember" maxLength={240} />
          <button className="btn" disabled={!draft.trim()}>Add</button>
        </form>
      )}
    </div>
  );
}
