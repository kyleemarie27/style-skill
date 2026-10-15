import { useEffect, useRef, useState, type ReactNode } from "react";
import { localToday } from "../../shared/dates";
import { activePregnancy } from "../../shared/pregnancy";
import { api, askBloom, type ChatMsg } from "../lib/api";
import { buildAskContext } from "../lib/askContext";
import { useStore } from "../lib/store";

const STORE_KEY = "bloom-ask-chat";
const load = (): ChatMsg[] => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const save = (m: ChatMsg[]) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(m.slice(-30)));
  } catch {
    /* private mode etc. */
  }
};

/** The "Ask Bloom" card: a question box plus suggestions; opens the chat sheet. */
export function AskBloomCard({ suggestions }: { suggestions: string[] }) {
  const { aiEnabled, settings } = useStore();
  const pregnant = !!activePregnancy(settings);
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  if (!aiEnabled) return null;

  const start = (q: string) => {
    if (!q.trim()) return;
    setFirst(q.trim());
    setDraft("");
    setOpen(true);
  };

  return (
    <div className="card stack ask-card">
      <div className="row between">
        <div>
          <h2>Ask Bloom</h2>
          <p className="muted small">{pregnant ? "Questions about your pregnancy, symptoms, food and medicine safety, or what's coming next. Answers use what you've logged." : "Questions about your cycle, your data or trying to conceive. Answers use your history."}</p>
        </div>
        {load().length > 0 && (
          <button className="btn ghost small" onClick={() => { setFirst(null); setOpen(true); }}>Last chat</button>
        )}
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); start(draft); }}>
        <input type="text" placeholder="Ask anything…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Your question" />
        <button className="btn primary" disabled={!draft.trim()}>Ask</button>
      </form>
      <div className="chips">
        {suggestions.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => start(s)}>{s}</button>
        ))}
      </div>
      {open && <AskSheet first={first} onClose={() => setOpen(false)} />}
    </div>
  );
}

function AskSheet({ first, onClose }: { first: string | null; onClose: () => void }) {
  const { model, dayLogs, lhTests, settings } = useStore();
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => (first ? [] : load()));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [learned, setLearned] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sentFirst = useRef(false);

  const send = async (q: string, history: ChatMsg[]) => {
    const question = q.trim();
    if (!question || busy) return;
    setError("");
    const next: ChatMsg[] = [...history, { role: "user", content: question }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setBusy(true);
    abortRef.current = new AbortController();
    try {
      const context = buildAskContext(model, dayLogs, lhTests, settings, localToday());
      const answer = await askBloom(next, context, (text) => setMsgs([...next, { role: "assistant", content: text }]), abortRef.current.signal);
      const done: ChatMsg[] = [...next, { role: "assistant", content: answer }];
      setMsgs(done);
      save(done);
      // Quietly pick up anything worth remembering about her for next time.
      api.learn(done.slice(-4)).then((r) => r.added.length && setLearned((l) => [...l, ...r.added])).catch(() => {});
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setMsgs(next.slice(0, -1));
      setDraft(question);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (first && !sentFirst.current) {
      sentFirst.current = true;
      send(first, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    abortRef.current?.abort();
    onClose();
  };

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [msgs]);

  return (
    <div className="backdrop" onClick={close}>
      <div className="sheet ask-sheet fade-in" role="dialog" aria-label="Ask Bloom" onClick={(e) => e.stopPropagation()}>
        <div className="row between ask-head">
          <h2>Ask Bloom</h2>
          <div className="row" style={{ gap: 4 }}>
            {msgs.length > 0 && !busy && (
              <button className="btn ghost small" onClick={() => { setMsgs([]); save([]); setLearned([]); }}>New chat</button>
            )}
            <button className="btn ghost" onClick={close}>Close</button>
          </div>
        </div>
        <div className="ask-msgs">
          {msgs.length === 0 && <p className="muted small">Ask about your cycle, symptoms, LH tests, timing, or anything you're wondering about.</p>}
          {msgs.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.role === "assistant" ? (m.content ? <Markdown text={m.content} /> : <span className="row muted small"><span className="spin" /> Thinking about your data…</span>) : m.content}
            </div>
          ))}
          {learned.length > 0 && !busy && (
            <a className="remembered" href="#/settings">💾 Bloom will remember: {learned.join(" · ")}</a>
          )}
          {error && <div className="notice err small">{error}</div>}
          <div ref={endRef} />
        </div>
        <form className="row ask-input" onSubmit={(e) => { e.preventDefault(); const q = draft; setDraft(""); send(q, msgs); }}>
          <input type="text" placeholder="Ask a follow-up…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Your question" autoFocus={!first} />
          <button className="btn primary" disabled={busy || !draft.trim()}>{busy ? <span className="spin" /> : "Send"}</button>
        </form>
        <p className="tiny muted center">General information, not medical advice.</p>
      </div>
    </div>
  );
}

/** Just enough markdown for chat answers: paragraphs, "- " bullets, **bold**. */
function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) blocks.push(<ul key={blocks.length} className="tips">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
    list = [];
  };
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
    if (m) list.push(m[1]);
    else {
      flush();
      if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line.replace(/^#+\s*/, ""))}</p>);
    }
  }
  flush();
  return <div className="md">{blocks}</div>;
}

function inline(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part,
  );
}
