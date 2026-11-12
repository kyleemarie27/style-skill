import { useMemo } from "react";
import { phaseFor, type CycleModel, type Today as TodayInfo } from "../../shared/cycle";
import { addDays, diffDays, localToday, prettyDate } from "../../shared/dates";
import { DEFAULT_WAIT_LIST, namesOf, type DayLog } from "../../shared/types";
import { AskBloomCard } from "../components/AskBloom";
import { WindowStrip } from "../components/CycleCards";
import { invitationFor } from "../content/invitations";
import { CYCLE_HELP, fillName, PARTNER_AFTER_LOSS, PARTNER_PHASES } from "../content/partnerCycle";
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
      <PartnerHero info={info} focus={focus} who={who} />
      <WindowCard info={info} model={model} />
      <HowTheyreDoing who={who} n={n} log={byDate.get(today)} yesterday={byDate.get(addDays(today, -1))} />
      {waitListActive(info) && <WaitTogether list={settings.waitList ?? DEFAULT_WAIT_LIST} who={who} />}

      {guide && (
        <section className={`card stack ph-${info.phase}`}>
          <div>
            <span className="phase-pill"><span className="dot" />{guide.label}</span>
            <p style={{ marginTop: 10 }}>{n(guide.summary)}</p>
          </div>
          {inv && (
            <div className="invite-ritual">
              <span className="tip-label">Today {name ? `${name} is` : "is a day for"} {inv.name}</span>
              <p>{inv.line}</p>
            </div>
          )}
          {afterLoss && <p className="small notice">{PARTNER_AFTER_LOSS}</p>}
          <div>
            <div className="tip-label">What to expect</div>
            <ul className="tips">{guide.expect.map((t) => <li key={t}>{n(t)}</li>)}</ul>
          </div>
          <div>
            <div className="tip-label">How to support</div>
            <ul className="tips">{guide.support.map((t) => <li key={t}>{n(t)}</li>)}</ul>
          </div>
          <div>
            <div className="tip-label">Go easy on</div>
            <ul className="tips">{guide.avoid.map((t) => <li key={t}>{n(t)}</li>)}</ul>
          </div>
          <div className="invite-ritual">
            <span className="tip-label">For the two of you</span>
            <p>{n(guide.together)}</p>
          </div>
        </section>
      )}

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

function PartnerHero({ info, focus, who }: { info: TodayInfo; focus: Focus; who: string }) {
  const f = partnerFocus(info, focus, who);
  return (
    <div className={`card hero ph-${info.phase}${focus.counts ? " counts" : ""}`}>
      <div className="stack" style={{ gap: 6 }}>
        <div className="muted small">{prettyDate(info.date, true)}</div>
        <span className="phase-pill"><span className="dot" />{PARTNER_PHASES[info.phase]?.label ?? "Cycle"}</span>
        <h1 style={{ marginTop: 4 }}>{f.headline}</h1>
        {f.sub && <p>{f.sub}</p>}
      </div>
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
      <p className="tiny muted">
        ★ best days · ♥ logged · dot = LH strip (yellow High, orange Peak).
        {loved > 0 ? ` ${loved} ♥ so far${bestLoved ? `, ${bestLoved} on the best days` : ""}.` : ""}
        {info.ovulationConfirmed ? "" : " Dates firm up when the LH strip peaks."}
      </p>
      {next && (
        <p className="small"><b>Next window:</b> about {range(next.start, next.end)}, if this cycle isn't the one.</p>
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
  return (
    <div className="card stack">
      <div className="section-title"><span className="ico" aria-hidden>💛</span>How {who} is doing</div>
      {shown.length === 0 ? (
        <p className="small muted">Nothing logged today yet. Asking in person works too.</p>
      ) : (
        <>
          <div className="chips">{shown.map((t) => <span key={t} className={`chip static${MOODS.has(t) ? "" : " sym"}`}>{t}</span>)}</div>
          <ul className="tips">
            {shown.filter((t) => CYCLE_HELP[t]).slice(0, 4).map((t) => <li key={t}><b>{t}:</b> {n(CYCLE_HELP[t])}</li>)}
            {shown.includes("Period") && <li><b>Period:</b> {n(CYCLE_HELP.Cramps)}</li>}
          </ul>
          <p className="tiny muted">From {who}'s check-in {when}.</p>
        </>
      )}
    </div>
  );
}

function WaitTogether({ list, who }: { list: string[]; who: string }) {
  return (
    <div className="card stack wait-card">
      <div className="section-title"><span className="ico" aria-hidden>🛡️</span>Protect the wait, together</div>
      <p className="small">From ovulation until the period, {who} is skipping:</p>
      <ul className="wait-list">{list.map((x) => <li key={x}>{x}</li>)}</ul>
      <p className="small muted">Easy wins: match the no-alcohol nights with a mocktail, skip the sauna together, and keep Tylenol in the cabinet.</p>
    </div>
  );
}

function TimingBasics({ who }: { who: string }) {
  return (
    <details className="card plan">
      <summary>
        <span className="section-title"><span className="ico" aria-hidden>🧭</span>Timing, simply</span>
        <span className="small muted">How the window works, and your side of it.</span>
      </summary>
      <div className="stack" style={{ marginTop: 12, gap: 10 }}>
        <p className="small">
          <b>The window is 6–7 days</b>: the 5 days before ovulation, ovulation day and the day after. Sperm live up to 5 days, so the days
          <i> before</i> ovulation matter most. The best three are the two days before and the day itself.
        </p>
        <p className="small">
          <b>The rule:</b> sex every 1–2 days through the window, until the day after the LH peak. Every other day works about as well as daily, so no need to push.
        </p>
        <p className="small">
          <b>How {who} spots it:</b> wetter, egg-white mucus, then the LH strip going High and Peak (ovulation follows a Peak within about 12–36 hours), then a temperature rise on the Oura that confirms it happened.
        </p>
        <p className="small">
          <b>Your side:</b> no hot tubs, saunas or laptop-on-lap (heat lowers sperm quality), ease off alcohol, sleep, and don't go more than about 5 days without ejaculating before the window. Sperm take about 3 months to make, so habits now pay off over the next few cycles.
        </p>
        <p className="small muted">About 1 in 5 couples conceive in any given cycle, even with perfect timing. Most take a few cycles. That's normal, not a sign anything's wrong.</p>
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
