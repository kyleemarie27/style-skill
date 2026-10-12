import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, localToday, prettyDate } from "../../shared/dates";
import { gaLabel, gaLong, type Gestation, type PregFlag } from "../../shared/pregnancy";
import type { Pregnancy } from "../../shared/types";
import { FIRST_WEEK, LAST_WEEK, TRIMESTERS, weekContent, type WeekContent } from "../content/pregnancy";
import { AskBloomCard } from "../components/AskBloom";
import { BabySize } from "../components/BabySize";
import { PregnancyEditor } from "../components/PregnancyEditor";
import { DeepDive } from "../components/DeepDive";
import { WeekGuide } from "../components/WeekGuide";
import { api } from "../lib/api";
import { newId, recentSymptoms, usePregnancy, useSavePregnancy } from "../lib/pregnancy";
import { useStore } from "../lib/store";

export function PregnancyToday() {
  const p = usePregnancy()!;
  const { byDate, aiEnabled, dayLogs } = useStore();
  const { preg, g, week, flags, today } = p;
  const yesterday = addDays(today, -1);
  const [checkDay, setCheckDay] = useState<"yesterday" | "today">(byDate.has(yesterday) ? "today" : "yesterday");
  const dayLine = week.days[Math.max(0, Math.min(6, g.days))];

  return (
    <div className="stack preg">
      <PregHero preg={preg} g={g} />

      {flags.length > 0 && <Alerts flags={flags} preg={preg} />}

      <BabySize g={g} />

      <section className="card stack today-card">
        <div className="section-title"><span className="ico" aria-hidden>☀️</span>Today · {gaLabel(g)}</div>
        <p className="today-line">{dayLine}</p>
        {aiEnabled && <PregLine g={g} preg={preg} week={week} />}
      </section>

      <div className="card stack">
        <div className="row between wrap">
          <h2>How are you feeling?</h2>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={checkDay === "yesterday"} onClick={() => setCheckDay("yesterday")}>Yesterday</button>
            <button role="tab" aria-selected={checkDay === "today"} onClick={() => setCheckDay("today")}>Today</button>
          </div>
        </div>
        <p className="muted small">The things your doctor will ask about. Tap what fits; it saves as you go.</p>
        <PregnancyEditor key={checkDay} date={checkDay === "yesterday" ? yesterday : today} preg={preg} compact />
        <div className="row wrap">
          <a className="btn ghost" href={`#/day/${checkDay === "yesterday" ? yesterday : today}`}>Weight, blood pressure & more →</a>
        </div>
      </div>

      <WeekGuide
        week={week}
        preg={preg}
        seed={g.totalDays}
        recentSymptoms={recentSymptoms(dayLogs, today)}
        deepDive={aiEnabled ? <DeepDive g={g} preg={preg} week={week} /> : undefined}
      />

      <WeekRail current={g.weeks} />

      <AskBloomCard suggestions={suggestions(g)} />

      <p className="tiny muted center">Bloom gives general information, not medical advice. Your doctor or midwife knows your situation best.</p>
    </div>
  );
}

function PregHero({ preg, g }: { preg: Pregnancy; g: Gestation }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const tri = TRIMESTERS[g.trimester];
  return (
    <div className={`card hero preg-hero tri-${g.trimester}`}>
      <div className="row between" style={{ alignItems: "center", gap: 14 }}>
        <div className="stack" style={{ gap: 6, minWidth: 0 }}>
          <div className="muted small">{prettyDate(localToday(), true)}</div>
          <span className="phase-pill"><span className="dot" />{tri.name}</span>
          <h1 style={{ marginTop: 2 }}>{gaLong(g)} pregnant</h1>
        </div>
        <svg className="ring" viewBox="0 0 110 110" width="104" height="104" role="img" aria-label={`${Math.round(g.pct * 100)}% of the way to your due date`}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
          <circle cx="55" cy="55" r={r} fill="none" stroke="var(--phase)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${c * g.pct} ${c}`} transform="rotate(-90 55 55)" />
          <text x="55" y="53" textAnchor="middle" className="ring-big">{g.weeks}</text>
          <text x="55" y="70" textAnchor="middle" className="ring-small">weeks</text>
        </svg>
      </div>
      <div className="facts">
        <div className="fact">Due date<b>{prettyDate(preg.dueDate)}</b></div>
        <div className="fact">To go<b>{g.daysToGo} days</b></div>
        <div className="fact">Day<b>{g.totalDays} of 280</b></div>
      </div>
    </div>
  );
}

const LEVEL_LABEL = { urgent: "Call now", call: "Call your doctor today", mention: "Keep an eye on it" };

function Alerts({ flags, preg }: { flags: PregFlag[]; preg: Pregnancy }) {
  const save = useSavePregnancy();
  const asked = (f: PregFlag) => preg.questions.some((q) => q.text.startsWith(f.title));
  const ask = (f: PregFlag) =>
    save({ questions: [...preg.questions, { id: newId(), text: `${f.title} (logged ${prettyDate(f.date)})`, created: localToday(), done: null }] });
  return (
    <div className="stack" style={{ gap: 8 }} role="alert">
      {flags.map((f) => (
        <div key={f.id} className={`alert ${f.level}`}>
          <div className="alert-level">{LEVEL_LABEL[f.level]} · logged {prettyDate(f.date)}</div>
          <b>{f.title}</b>
          <p className="small">{f.detail}</p>
          {f.level !== "urgent" && (
            <button className="btn ghost small alert-ask" onClick={() => ask(f)} disabled={asked(f)}>
              {asked(f) ? "On your questions list ✓" : "+ Add to my questions for the doctor"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** The AI's personal line for today, cached once per gestational day. */
function PregLine({ g, preg, week }: { g: Gestation; preg: Pregnancy; week: WeekContent }) {
  const { byDate } = useStore();
  const [line, setLine] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const date = localToday();
  const key = `preg-${gaLabel(g).replace(" ", "")}`;
  const ctx = useRef<unknown>(null);
  ctx.current = useMemo(() => {
    const days = [1, 2, 3].map((n) => addDays(date, -n + 1)).map((d) => ({ date: d, log: byDate.get(d) ?? null }));
    return {
      pregnant: true,
      today: date,
      gestationalAge: gaLong(g),
      trimester: g.trimester,
      dueDate: preg.dueDate,
      thisWeek: week.headline,
      babyThisWeek: week.baby.map((b) => b.t),
      recentLogs: days.map(({ date: d, log }) => ({ date: d, symptoms: log?.symptoms, mood: log?.mood, pregnancy: log?.preg })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, key]);

  useEffect(() => {
    let live = true;
    api.dailyNote(date, key, ctx.current)
      .then((r) => live && setLine(r.line))
      .catch((e) => live && setErr((e as Error).message));
    return () => {
      live = false;
    };
  }, [date, key]);

  return (
    <div className="for-you">
      <div className="tip-label">💌 For you today</div>
      {err ? <p className="small muted">Couldn't write today's note: {err}</p>
        : <p>{line ?? <span className="muted row"><span className="spin" /> Writing your note…</span>}</p>}
    </div>
  );
}

function WeekRail({ current }: { current: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Scroll only the rail sideways; scrollIntoView would also scroll the page.
    const rail = ref.current;
    const el = rail?.querySelector<HTMLElement>("[aria-current]");
    if (rail && el) rail.scrollLeft = el.offsetLeft - rail.offsetLeft - (rail.clientWidth - el.clientWidth) / 2;
  }, []);
  const weeks = Array.from({ length: LAST_WEEK - FIRST_WEEK - 1 }, (_, i) => FIRST_WEEK + i);
  return (
    <section className="card stack">
      <div className="row between">
        <div className="section-title"><span className="ico" aria-hidden>🧭</span>Your weeks</div>
        <a className="small" href="#/weeks">See all →</a>
      </div>
      <div className="week-rail" ref={ref}>
        {weeks.map((w) => (
          <a key={w} href={`#/week/${w}`} className={`wk tri-${w < 14 ? 1 : w < 28 ? 2 : 3}${w < current ? " past" : ""}`} aria-current={w === current ? "true" : undefined}>
            <b>{w}</b>
            <span className="tiny">{weekContent(w).size.fruit.name.replace(/^an? /, "").replace(/^(a |head of |bunch of )/, "")}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function suggestions(g: Gestation): string[] {
  if (g.weeks < 9) return ["Is this cramping normal?", "What can't I eat now?", "What happens at my first appointment?"];
  if (g.weeks < 14) return ["When will the nausea ease?", "Should I do NIPT screening?", "When should we tell people?"];
  if (g.weeks < 28) return ["When will I feel kicks?", "What's checked at the anatomy scan?", "How much weight should I gain?"];
  return ["How do I do kick counts?", "How do I know it's real labor?", "What should go in my hospital bag?"];
}

