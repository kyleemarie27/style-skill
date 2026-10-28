import { useEffect, useRef, useState, type ReactNode } from "react";
import { localToday } from "../../shared/dates";
import { activePregnancy } from "../../shared/pregnancy";
import { api, askBloom, type ChatMsg } from "../lib/api";
import { actionLabel, mergeLog, parseAnswer, type ChatAction } from "../lib/chatActions";
import { newId, usePregnancy, useSavePregnancy } from "../lib/pregnancy";
import { buildAskContext } from "../lib/askContext";
import { useStore } from "../lib/store";
import { useViewer } from "../lib/viewer";
import { useTodayPlan } from "../lib/todayPlan";
import { weekDeep } from "../content/pregnancy";

/** A chat message as kept on this device: which suggested saves were tapped. */
type Msg = ChatMsg & { saved?: number[] };

const STORE_KEY = "bloom-ask-chat";
const load = (): Msg[] => {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const save = (m: Msg[]) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(m.slice(-40)));
  } catch {
    /* private mode etc. */
  }
};

/** A small "Ask Bloom" launcher for pages outside the chat tab: asking opens the Ask tab. */
export function AskBloomCard({ suggestions }: { suggestions: string[] }) {
  const { aiEnabled, settings } = useStore();
  const pregnant = !!activePregnancy(settings);
  const [draft, setDraft] = useState("");
  if (!aiEnabled) return null;
  const start = (q: string) => {
    if (q.trim()) window.location.hash = `#/ask/${encodeURIComponent(q.trim())}`;
  };
  return (
    <div className="card stack ask-card">
      <div>
        <h2>Ask Bloom</h2>
        <p className="muted small">{pregnant ? "Questions about your pregnancy, symptoms, food and medicine safety, or what's coming next." : "Questions about your cycle, your data or trying to conceive. Answers use your history."}</p>
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); start(draft); }}>
        <input type="text" placeholder="Ask anything…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Your question" />
        <button className="btn primary" disabled={!draft.trim()}>Ask</button>
      </form>
      <div className="chips">
        {suggestions.map((q) => <button key={q} type="button" className="chip" onClick={() => start(q)}>{q}</button>)}
      </div>
    </div>
  );
}

const CYCLE_SUGGESTIONS = ["Is my cycle normal?", "When am I most fertile this month?", "What does my luteal phase tell me?"];

export function pregnancySuggestions(weeks: number): string[] {
  if (weeks < 9) return ["Is this cramping normal?", "What can't I eat now?", "What happens at my first appointment?", "I feel queasy and exhausted today"];
  if (weeks < 14) return ["When will the nausea ease?", "Should I do NIPT screening?", "When should we tell people?", "I feel queasy and exhausted today"];
  if (weeks < 28) return ["When will I feel kicks?", "What's checked at the anatomy scan?", "How much weight should I gain?", "My back has been aching"];
  return ["How do I do kick counts?", "How do I know it's real labor?", "What should go in my hospital bag?", "I've had some tightening today"];
}

function partnerSuggestions(weeks: number): string[] {
  if (weeks < 14) return ["How can I help with the nausea?", "What's happening with the baby this week?", "Should I go to the first appointment?", "How do I support the exhaustion?"];
  if (weeks < 28) return ["When can I feel the baby kick?", "What happens at the anatomy scan?", "What should we be preparing now?", "How can I help with back pain?"];
  return ["How will I know it's real labor?", "What should I pack for the hospital?", "How do I support during labor?", "What can I do in the first weeks home?"];
}

/**
 * Questions to start with in pregnancy mode: today's AI ideas (about what she's logged and this exact
 * stage) plus one of this week's common questions, so they change every day. Null means use the defaults.
 */
function useAskIdeas(p: ReturnType<typeof usePregnancy>, partner: boolean): string[] | null {
  const { plan } = useTodayPlan(localToday(), p);
  if (!p) return null;
  const faq = weekDeep(p.g.weeks).faq;
  const fromWeek = faq.length ? [faq[p.g.days % faq.length].q] : [];
  if (partner) return fromWeek.length ? [...partnerSuggestions(p.g.weeks).slice(0, 3), ...fromWeek] : null;
  if (!plan?.ask.length) return fromWeek.length ? [...fromWeek, ...pregnancySuggestions(p.g.weeks).slice(0, 3)] : null;
  return [...plan.ask.slice(0, 3), ...fromWeek];
}

/** The Ask tab: a full-page chat. `first` (from #/ask/<question>) is sent straight away in a new chat. */
export function AskPage({ first }: { first: string | null }) {
  const { model, dayLogs, lhTests, settings, aiEnabled } = useStore();
  const pregnant = !!activePregnancy(settings);
  const p = usePregnancy();
  const partner = useViewer() === "partner" && !!p;
  const ideas = useAskIdeas(p, partner);
  const suggestions = p ? (ideas ?? (partner ? partnerSuggestions(p.g.weeks) : pregnancySuggestions(p.g.weeks))) : CYCLE_SUGGESTIONS;
  const [msgs, setMsgs] = useState<Msg[]>(() => (first ? [] : load()));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [learned, setLearned] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sentFirst = useRef(false);

  const update = (m: Msg[]) => {
    setMsgs(m);
    save(m);
  };

  const send = async (q: string, history: Msg[]) => {
    const question = q.trim();
    if (!question || busy) return;
    setError("");
    const next: Msg[] = [...history, { role: "user", content: question }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setBusy(true);
    abortRef.current = new AbortController();
    try {
      const base = buildAskContext(model, dayLogs, lhTests, settings, localToday());
      const context = partner ? { ...base, viewer: "partner", momName: p!.preg.momName, partnerName: p!.preg.partnerName } : base;
      const plain = next.map(({ role, content }) => ({ role, content }));
      const answer = await askBloom(plain, context, (text) => setMsgs([...next, { role: "assistant", content: text }]), abortRef.current.signal);
      const done: Msg[] = [...next, { role: "assistant", content: answer }];
      update(done);
      // Quietly pick up anything worth remembering about her for next time (not from the partner's chats).
      if (!partner) api.learn(done.slice(-4).map(({ role, content }) => ({ role, content })))
        .then((r) => r.added.length && setLearned((l) => [...l, ...r.added])).catch(() => {});
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
      // Drop the question from the URL so a reload doesn't ask it again.
      history.replaceState(null, "", "#/ask");
      send(first, []);
    }
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [msgs.length, busy]);

  if (!aiEnabled) {
    return (
      <div className="stack">
        <h1>Ask Bloom</h1>
        <p className="muted">Ask Bloom needs AI. Add ANTHROPIC_API_KEY in Vercel to turn it on.</p>
      </div>
    );
  }

  const markSaved = (i: number, k: number) => update(msgs.map((m, j) => (j === i ? { ...m, saved: [...(m.saved ?? []), k] } : m)));

  return (
    <div className="ask-page">
      <div className="row between ask-head">
        <h1>Ask Bloom</h1>
        {msgs.length > 0 && !busy && (
          <button className="btn ghost small" onClick={() => { update([]); setLearned([]); }}>New chat</button>
        )}
      </div>

      <div className="ask-msgs">
        {msgs.length === 0 && (
          <div className="stack ask-empty">
            <p className="muted">{partner
              ? "Ask anything about what's going on, or how to help. Bloom knows what's been logged lately."
              : pregnant
              ? "Ask about symptoms, food and medicine safety, or what's coming next. Tell Bloom how you're feeling and it can log it for you, or save questions for your doctor."
              : "Ask about your cycle, symptoms, LH tests or timing. Answers use your history."}</p>
            <div className="chips">
              {suggestions.map((q) => <button key={q} type="button" className="chip" onClick={() => send(q, msgs)}>{q}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => {
          if (m.role === "user") {
            return (
              <div key={i} className="msg-user">
                <div className="bubble user">{m.content}</div>
                {pregnant && <SaveQuestion text={m.content} />}
              </div>
            );
          }
          const { text, actions } = parseAnswer(m.content);
          const streaming = busy && i === msgs.length - 1;
          return (
            <div key={i} className="msg-assistant">
              <div className="bubble assistant">
                {text ? <Markdown text={text} /> : <span className="row muted small"><span className="spin" /> Thinking about your data…</span>}
              </div>
              {!streaming && actions.length > 0 && (
                <div className="chat-actions">
                  {actions.map((a, k) => (
                    <ActionButton key={k} action={a} saved={!!m.saved?.includes(k)} onSaved={() => markSaved(i, k)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {learned.length > 0 && !busy && (
          <a className="remembered" href="#/settings">💾 Bloom will remember: {learned.join(" · ")}</a>
        )}
        {error && <div className="notice err small">{error}</div>}
        <div ref={endRef} />
      </div>

      <form className="row ask-input" onSubmit={(e) => { e.preventDefault(); const q = draft; setDraft(""); send(q, msgs); }}>
        <input type="text" placeholder={msgs.length ? "Ask a follow-up…" : "Ask, or tell Bloom how you feel…"} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Your message" />
        <button className="btn primary" disabled={busy || !draft.trim()}>{busy ? <span className="spin" /> : "Send"}</button>
      </form>
      <p className="tiny muted center">General information, not medical advice.</p>
    </div>
  );
}

const ICON: Record<ChatAction["type"], string> = { log: "📝", question: "🩺", appointment: "📅" };

/** One suggested save. Nothing happens until she taps it. */
function ActionButton({ action, saved, onSaved }: { action: ChatAction; saved: boolean; onSaved: () => void }) {
  const { byDate, saveDay, settings, role } = useStore();
  const savePreg = useSavePregnancy();
  const preg = activePregnancy(settings);
  const [err, setErr] = useState("");
  // Logging is the main account's; the partner can still save doctor questions and appointments.
  if (action.type === "log" && role === "partner") return null;
  const apply = async () => {
    setErr("");
    try {
      if (action.type === "log") await saveDay(mergeLog(byDate.get(action.date), action, !!preg));
      else if (!preg) return;
      else if (action.type === "question") await savePreg({ questions: [...preg.questions, { id: newId(), text: action.text, created: localToday(), done: null }] });
      else await savePreg({ appointments: [...preg.appointments, { id: newId(), date: action.date, title: action.title, notes: null }] });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  if (action.type !== "log" && !preg) return null;
  const where = action.type === "log" ? `#/day/${action.date}` : "#/doctor";
  return (
    <div className="chat-action">
      {saved ? (
        <a className="btn ghost small done" href={where}>✓ {actionLabel(action).replace(/^Add to doctor questions/, "Added to doctor questions").replace(/^Add appointment/, "Added appointment").replace(/^Log for/, "Logged for")} ›</a>
      ) : (
        <button className="btn small" onClick={apply}><span aria-hidden>{ICON[action.type]}</span> {actionLabel(action)}</button>
      )}
      {err && <span className="tiny muted">Couldn't save: {err}</span>}
    </div>
  );
}

/** Under her own message: save it as a question for the doctor. */
function SaveQuestion({ text }: { text: string }) {
  const { settings } = useStore();
  const savePreg = useSavePregnancy();
  const preg = activePregnancy(settings)!;
  const has = preg.questions.some((q) => q.text === text);
  return (
    <button className="link-btn" disabled={has} onClick={() => savePreg({ questions: [...preg.questions, { id: newId(), text, created: localToday(), done: null }] })}>
      {has ? "✓ On your doctor list" : "🩺 Ask my doctor this"}
    </button>
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
