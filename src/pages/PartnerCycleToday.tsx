import { useMemo } from "react";
import { phaseFor, type CycleModel, type Today as TodayInfo } from "../../shared/cycle";
import { addDays, diffDays, localToday, prettyDate } from "../../shared/dates";
import { DEFAULT_WAIT_LIST, namesOf, type DayLog } from "../../shared/types";
import { AskBloomCard } from "../components/AskBloom";
import { CycleBar, WindowStrip } from "../components/CycleCards";
import { DuelCard } from "../components/DuelCard";
import { invitationFor } from "../content/invitations";
import { CYCLE_HELP, fillName, PARTNER_PHASES, type PartnerPhase } from "../content/partnerCycle";
import { focusFor, waitListActive, windowDays, type Focus } from "../lib/cycleToday";
import { useStore } from "../lib/store";

/**
 * Today for the partner while trying to conceive: is today a timing day, when the window is, how
 * their person is doing (from the check-in, with how to help), and a guide to this phase written to
 * them. Read-only; nothing to log.
 */
export function PartnerCycleToday() {
  const { model, lhTests, byDate, settings } = useStore();
  const today = localToday();
  const info = useMemo(() => phaseFor(today, model), [today, model]);
  const name = namesOf(settings).me;
  const n = (t: string) => fillName(t, name);
  const who = name || "your partner";

  if (info.phase === "unknown") {
    return (
      <div className="stack">
        <div className="card hero ph-unknown stack">
          <h1>Nothing to show yet</h1>
          <p className="muted">Once {who} logs a period (or imports their history), this page shows the fertile window and how to help each day.</p>
        </div>
      </div>
    );
  }

  const focus = focusFor(info, model, lhTests, byDate, true);
  const guide = PARTNER_PHASES[info.phase];
  const inv = invitationFor(info, model.afterLoss && info.cycle?.start === model.afterLoss.start ? model.afterLoss.start : null);
  const afterLoss = !!model.afterLoss && info.cycle?.start === model.afterLoss.start;

  return (
    <div className="stack">
      <PartnerHero info={info} focus={focus} who={who} invitation={inv ? `${name || "Today"}${name ? " is" : ":"} ${inv.name}` : null} />
      <DuelCard />
      <WindowCard info={info} model={model} />
      <HowTheyreDoing who={who} n={n} log={byDate.get(today)} yesterday={byDate.get(addDays(today, -1))} />
      {waitListActive(info) && <WaitTogether list={settings.waitList ?? DEFAULT_WAIT_LIST} who={who} />}

      {guide && <PhaseGuide guide={guide} n={n} phase={info.phase} afterLoss={afterLoss} />}

      <TimingBasics who={who} />

      <AskBloomCard suggestions={partnerSuggestions(info)} />
      <p className="tiny muted center">Bloom gives general information, not medical advice.</p>
    </div>
  );
}

/** The partner's version of today's instruction. */
export function partnerFocus(info: TodayInfo, focus: Focus, who: string): { headline: string; sub: string } {
  const testOn = info.testDate ? prettyDate(info.testDate) : null;
  switch (focus.kind) {
    case "lh-peak": return { headline: "Today counts.", sub: `${cap(who)}'s LH strip hit Peak. Today and tomorrow are the best days of the cycle.` };
    case "lh-high": return { headline: "Today counts.", sub: `${cap(who)}'s LH is rising, so ovulation is close. Today and tomorrow both count.` };
    case "mucus": return { headline: "Today counts.", sub: `${cap(who)} logged fertile mucus, which is the body's own sign the window is open.` };
    case "best": return { headline: "Today counts.", sub: "One of the three best days of the cycle." };
    case "open": return { headline: "The window is open.", sub: "Every day or two from now until the day after the LH peak." };
    case "last": return { headline: "Last day of the window.", sub: "One more try today if you'd both like. Then your part is done." };
    case "wait": return { headline: "Your part is done.", sub: testOn ? `The wait. Test day is ${testOn}.` : "The wait." };
    case "late": return { headline: "Test day.", sub: `${cap(who)}'s period is late, so a test now gives a clear answer.` };
    case "period": return { headline: "Not a timing day.", sub: info.fertileStart ? `Period week. The window opens around ${prettyDate(info.fertileStart)}.` : "Period week." };
    case "before": {
      const d = info.fertileStart ? diffDays(info.fertileStart, info.date) : null;
      return { headline: "Not a timing day yet.", sub: d !== null ? `The window opens in ${d} day${d === 1 ? "" : "s"}, around ${prettyDate(info.fertileStart!)}.` : "" };
    }
    default: return { headline: "Not a timing day.", sub: "" };
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function PartnerHero({ info, focus, who, invitation }: { info: TodayInfo; focus: Focus; who: string; invitation: string | null }) {
  const f = partnerFocus(info, focus, who);
  return (
    <div className={`card hero ph-${info.phase}${focus.counts ? " counts" : ""}`}>
      <div className="stack" style={{ gap: 6 }}>
        <div className="muted small">{prettyDate(info.date, true)}</div>
        <span className="phase-pill"><span className="dot" />{PARTNER_PHASES[info.phase]?.label ?? "Cycle"}</span>
        <h1 style={{ marginTop: 4 }}>{f.headline}</h1>
        {f.sub && <p>{f.sub}</p>}
      </div>
      <CycleBar info={info} />
      {invitation && <p className="tiny muted" style={{ marginTop: 8 }}>🎁 {invitation}</p>}
    </div>
  );
}

/** When the next window is, if this cycle's has passed: next period + your usual ovulation day. */
export function nextWindow(info: TodayInfo, model: CycleModel): { start: string; end: string; ovulation: string } | null {
  if (!info.nextPeriod) return null;
  const offset = model.typicalOvulationDay ? model.typicalOvulationDay - 1 : model.avgCycleLength - model.avgLutealLength;
  const ov = addDays(info.nextPeriod, offset);
  return { start: addDays(ov, -5), end: addDays(ov, 1), ovulation: ov };
}

function WindowCard({ info, model }: { info: TodayInfo; model: CycleModel }) {
  const { lhTests, byDate } = useStore();
  const passed = !!info.fertileEnd && info.date > info.fertileEnd;
  const days = windowDays(info, model, lhTests, byDate);
  const loved = days.filter((d) => d.love).length;
  const bestLoved = days.filter((d) => d.love && d.best).length;
  const next = passed ? nextWindow(info, model) : null;
  if (!info.fertileStart || !info.fertileEnd || !info.ovulation) return null;
  return (
    <div className={`card stack ph-${info.phase}`}>
      <div className="section-title"><span className="ico" aria-hidden>🗓️</span>{passed ? "This cycle's window" : "The window"}</div>
      <div className="row between wrap" style={{ alignItems: "baseline" }}>
        <b style={{ fontSize: 18 }}>{range(info.fertileStart, info.fertileEnd)}</b>
        <span className="small muted">Best days {range(addDays(info.ovulation, -2), info.ovulation)}{info.ovulationConfirmed ? "" : " (est.)"}</span>
      </div>
      <WindowStrip days={days} />
      <p className="tiny muted">★ best · ♥ logged{loved > 0 ? ` · ${loved} so far` : ""}{info.ovulationConfirmed ? "" : " · dates firm up at the LH peak"}</p>
      {next && (
        <p className="small"><b>Next window</b> ≈ {range(next.start, next.end)}</p>
      )}
    </div>
  );
}

/** "Nov 12–18", or "Nov 30–Dec 2". */
function range(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7) ? `${prettyDate(a)}–${Number(b.slice(8))}` : `${prettyDate(a)}–${prettyDate(b)}`;
}

const MOODS = new Set(["Happy", "Calm", "Energetic", "Anxious", "Irritable", "Sad", "Sensitive"]);

function HowTheyreDoing({ who, n, log, yesterday }: { who: string; n: (t: string) => string; log?: DayLog; yesterday?: DayLog }) {
  const items = (l?: DayLog) => {
    if (!l) return [] as string[];
    const out = [...(l.mood ? l.mood.split(/,\s*/) : []), ...(l.symptoms ?? [])];
    if (l.flow && ["light", "medium", "heavy"].includes(l.flow)) out.unshift("Period");
    return [...new Set(out)].filter(Boolean);
  };
  const todayItems = items(log);
  const shown = todayItems.length ? todayItems : items(yesterday);
  const when = todayItems.length ? "today" : "yesterday";
  if (!shown.length) return null;
  const tips = shown.filter((t) => CYCLE_HELP[t] || t === "Period").slice(0, 2);
  return (
    <div className="card stack">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <div className="section-title"><span className="ico" aria-hidden>💛</span>{cap(who)} {when}</div>
      </div>
      <div className="chips">{shown.map((t) => <span key={t} className={`chip static${MOODS.has(t) ? "" : " sym"}`}>{t}</span>)}</div>
      {tips.length > 0 && <ul className="tips">{tips.map((t) => <li key={t}>{n(CYCLE_HELP[t === "Period" ? "Cramps" : t])}</li>)}</ul>}
    </div>
  );
}

function WaitTogether({ list }: { list: string[]; who: string }) {
  return (
    <div className="card stack wait-card">
      <div className="section-title"><span className="ico" aria-hidden>🛡️</span>The wait, together</div>
      <div className="chips">{list.map((x) => <span key={x} className="chip static wait-chip">{x}</span>)}</div>
      <p className="tiny muted">Join in: mocktails, no sauna, Tylenol in the cabinet.</p>
    </div>
  );
}

function TimingBasics({ who }: { who: string }) {
  return (
    <details className="card plan">
      <summary>
        <span className="section-title"><span className="ico" aria-hidden>🧭</span>Timing, simply</span>
        <span className="small muted">The whole thing in five lines.</span>
      </summary>
      <div className="guide-rows" style={{ marginTop: 12 }}>
        <div className="guide-row"><span className="guide-ico" aria-hidden>🗓️</span><span>The window is 7 days: 5 before ovulation, the day itself and the day after.</span></div>
        <div className="guide-row"><span className="guide-ico" aria-hidden>♥</span><span>Every 1–2 days through it. Daily isn't better than every other day.</span></div>
        <div className="guide-row"><span className="guide-ico" aria-hidden>🔎</span><span>{cap(who)}'s signs: egg-white mucus → LH Peak → temperature up.</span></div>
        <div className="guide-row"><span className="guide-ico" aria-hidden>🧊</span><span>Your side: no hot tubs or laptop-on-lap, easy on alcohol, no 5+ day gaps.</span></div>
        <div className="guide-row"><span className="guide-ico" aria-hidden>🎲</span><span>About 1 in 5 per cycle, even with perfect timing. Most take a few.</span></div>
      </div>
    </details>
  );
}

function partnerSuggestions(info: TodayInfo): string[] {
  if (info.phase === "fertile" || info.phase === "ovulation") return ["How do we make the window less stressful?", "What do the LH readings mean?", "Does how often we have sex matter?"];
  if (info.phase.startsWith("tww") || info.phase === "late") return ["How can I help during the wait?", "What should I say if the test is negative?", "Are any symptoms a sign yet?"];
  if (info.phase === "menstrual") return ["How can I help with period cramps?", "When does the next window open?", "What can I do to improve sperm health?"];
  return ["When does the window open?", "What can I do to improve sperm health?", "How does the cycle affect mood and energy?"];
}

/** The phase in four lines: expect, help, avoid, and one idea together. The rest is a tap away. */
function PhaseGuide({ guide, n, phase, afterLoss }: { guide: PartnerPhase; n: (t: string) => string; phase: string; afterLoss: boolean }) {
  const rows: [string, string, string][] = [
    ["👀", "Expect", guide.expect[0]],
    ["🤝", "Help", guide.support[0]],
    ["🙅", "Skip", guide.avoid[0]],
    ["💞", "Together", guide.together],
  ];
  const more = [...guide.expect.slice(1), ...guide.support.slice(1), ...guide.avoid.slice(1)];
  return (
    <section className={`card stack ph-${phase}`}>
      <div className="section-title"><span className="ico" aria-hidden>🧭</span>Your part · {guide.label.toLowerCase()}</div>
      {afterLoss && <p className="small muted">🤍 {PARTNER_AFTER_LOSS_SHORT}</p>}
      <div className="guide-rows">
        {rows.map(([ico, label, t]) => (
          <div key={label} className="guide-row">
            <span className="guide-ico" aria-hidden>{ico}</span>
            <span><span className="tiny muted">{label}</span><br />{n(t)}</span>
          </div>
        ))}
      </div>
      {more.length > 0 && (
        <details>
          <summary className="small muted">More for this phase</summary>
          <ul className="tips" style={{ marginTop: 6 }}>{more.map((t) => <li key={t}>{n(t)}</li>)}</ul>
        </details>
      )}
    </section>
  );
}

const PARTNER_AFTER_LOSS_SHORT = "First cycle since the loss. Grief can come back around the window and test day, for you too.";
