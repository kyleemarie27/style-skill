import { useState } from "react";
import { phaseFor, type Phase, type Today } from "../../shared/cycle";
import { addDays, diffDays, localToday, prettyDate } from "../../shared/dates";
import type { Prediction } from "../../shared/prediction";
import { DEFAULT_WAIT_LIST, namesOf } from "../../shared/types";
import { invitationFor } from "../content/invitations";
import { fill, PHASES, type Item } from "../content/phases";
import { lhStartDay } from "../lib/cycleToday";
import { fillName, PARTNER_PHASES } from "../content/partnerCycle";
import { signalsFor, waitListActive } from "../lib/cycleToday";
import { useStore } from "../lib/store";
import { TempSpark } from "./TempChart";

/** "Nov 27 – Dec 2", or "Nov 27 – 30" within a month. */
export function range(a: string, b: string): string {
  if (a === b) return prettyDate(a);
  return a.slice(0, 7) === b.slice(0, 7) ? `${prettyDate(a)} – ${Number(b.slice(8))}` : `${prettyDate(a)} – ${prettyDate(b)}`;
}

const CONF: Record<Prediction["confidence"], number> = { low: 1, medium: 2, high: 3 };

/** "Adjusted today", "Stable since Nov 24", "New". */
function statusLabel(p: Prediction, history: { madeAt: string; status: Prediction["status"] }[]): string {
  const today = localToday();
  const day = (iso: string) => iso.slice(0, 10);
  if (p.status === "new") return "New";
  if (p.status === "adjusted") return day(p.madeAt) === today ? "Adjusted today" : `Adjusted ${prettyDate(day(p.madeAt))}`;
  // Stable: since the last time it changed.
  const lastChange = history.find((h) => h.status !== "stable");
  return lastChange ? `Stable since ${prettyDate(day(lastChange.madeAt))}` : "Stable";
}

/** The one card that answers "when?": the window, how sure, stable or adjusted, and today's one action. */
export function PredictionCard({ partner = false }: { partner?: boolean }) {
  const { prediction: p, predictionHistory, predicting, settings } = useStore();
  const [open, setOpen] = useState(false);
  const today = localToday();
  if (!p) {
    return (
      <div className="card pred">
        <span className="muted row"><span className="spin" /> Reading your latest signals…</span>
      </div>
    );
  }
  const who = namesOf(settings).me || "your partner";
  const label = p.ovulation === "confirmed" ? "Ovulated" : p.ovulation === "likely_happened" ? "Ovulation probably happened" : "Ovulation likely";
  const when = p.ovulation !== "not_yet" && p.ovulationDate ? prettyDate(p.ovulationDate) : range(p.likely.start, p.likely.end);
  const inWindow = p.ovulation === "not_yet" && today >= addDays(p.likely.start, -3) && today <= p.likely.end;
  const action = partner
    ? inWindow ? "In the window: every 1–2 days" : p.ovulation !== "not_yet" ? "The wait: nothing to time" : ""
    : p.today;
  const changes = predictionHistory.filter((h) => h.status !== "stable").slice(0, 5);
  const ask = encodeURIComponent(`Why is ${partner ? `${who}'s` : "my"} ovulation prediction ${range(p.likely.start, p.likely.end)}?`);

  return (
    <div className={`card pred${p.status === "adjusted" ? " adjusted" : ""}`}>
      <button className="pred-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="tiny muted">{partner ? `${who}'s ${label.toLowerCase()}` : label}</span>
        <span className={`pred-chip ${p.status}`}>{statusLabel(p, predictionHistory)}{predicting ? " …" : ""}</span>
      </button>
      <div className="pred-range">{when}</div>
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <span className="conf" aria-label={`${p.confidence} confidence`}>
          {[1, 2, 3].map((i) => <i key={i} className={i <= CONF[p.confidence] ? "on" : ""} />)}
        </span>
        <span className="tiny muted">{p.confidence} confidence</span>
        {p.backup && <span className="tiny muted">· or {range(p.backup.start, p.backup.end)}</span>}
      </div>
      {action && <p className="pred-today">{action}</p>}

      {open && (
        <div className="pred-detail">
          {p.change && <p className="small"><b>What changed:</b> {p.change}</p>}
          {p.reason && <p className="small">{p.reason}</p>}
          {p.period && <p className="small muted">Period expected {range(p.period.start, p.period.end)}</p>}
          {p.flag && <p className="small pred-flag">{p.flag}</p>}
          {changes.length > 1 && (
            <ol className="pred-history" aria-label="How the prediction moved">
              {changes.map((h) => (
                <li key={h.madeAt}>
                  <span className="tiny muted">{prettyDate(h.madeAt.slice(0, 10))}</span>
                  <span className="small">{range(h.likely.start, h.likely.end)}</span>
                  <span className="conf small-conf">{[1, 2, 3].map((i) => <i key={i} className={i <= CONF[h.confidence] ? "on" : ""} />)}</span>
                </li>
              ))}
            </ol>
          )}
          <a className="btn ghost small" href={`#/ask/${ask}`}>Ask about this →</a>
        </div>
      )}
    </div>
  );
}

/** Which phase content to show, from the prediction when there is one (it knows more than the averages). */
export function displayPhase(info: Today, p: Prediction | null): Phase {
  if (!p || info.phase === "unknown") return info.phase;
  const today = info.date;
  if (p.phase === "menstrual") return "menstrual";
  if (p.phase === "ovulation") return "ovulation";
  if (p.phase === "luteal") {
    const ov = p.ovulationDate ?? p.likely.end;
    const dpo = diffDays(today, ov);
    return dpo <= 5 ? "tww_early" : dpo <= 9 ? "tww_mid" : "tww_late";
  }
  if (p.phase === "follicular") return today >= addDays(p.likely.start, -3) ? "fertile" : "follicular";
  return info.phase;
}

const PHASE_LABEL: Record<Phase, string> = {
  menstrual: "Menstrual", follicular: "Follicular", fertile: "Fertile window", ovulation: "Ovulation",
  tww_early: "Luteal", tww_mid: "Luteal", tww_late: "Luteal", late: "Period due", unknown: "Getting started",
};

/** The cycle at a glance: period, the predicted window (and backup), today. No symbols. */
function SimpleBar({ info, p }: { info: Today; p: Prediction | null }) {
  const { model } = useStore();
  const c = info.cycle;
  if (!c || !info.cycleDay) return null;
  const start = c.start;
  const end = p?.period?.end ?? info.nextPeriod ?? addDays(start, model.avgCycleLength);
  const len = Math.max(diffDays(end, start), info.cycleDay, 20);
  const pct = (d: string) => `${Math.min(100, Math.max(0, (diffDays(d, start) / len) * 100))}%`;
  const width = (a: string, b: string) => `${Math.max(1.5, Math.min(100, ((diffDays(b, a) + 1) / len) * 100))}%`;
  const win = p ? p.likely : info.fertileStart && info.fertileEnd ? { start: info.fertileStart, end: info.fertileEnd } : null;
  return (
    <div className="cycle-track">
      <div className="cycle-bar">
        {p?.backup && <div className="f backup" style={{ left: pct(p.backup.start), width: width(p.backup.start, p.backup.end) }} />}
        {win && <div className="f" style={{ left: pct(win.start), width: width(win.start, win.end) }} />}
        <div className="p" style={{ left: 0, width: width(start, c.periodEnd) }} />
        {p?.ovulationDate && p.ovulation === "confirmed" && <div className="o" style={{ left: pct(p.ovulationDate) }} />}
        <div className="now" style={{ left: `calc(${pct(info.date)} + ${100 / len / 2}%)` }} />
      </div>
    </div>
  );
}

/** Your cycle: one card, one tap to open everything, one tap to close. */
export function CycleCard({ partner = false }: { partner?: boolean }) {
  const { model, prediction, settings, lhTests, dayLogs, byDate, oura } = useStore();
  const [open, setOpen] = useState(false);
  const today = localToday();
  const info = phaseFor(today, model);
  if (info.phase === "unknown") return null;
  const phase = displayPhase(info, prediction);
  const inv = invitationFor({ ...info, phase }, model.afterLoss && info.cycle?.start === model.afterLoss.start ? model.afterLoss.start : null);
  const waitOn = prediction
    ? prediction.ovulation !== "not_yet" && !!prediction.ovulationDate && today >= prediction.ovulationDate && phase !== "menstrual"
    : waitListActive(info);
  const list = settings.waitList ?? DEFAULT_WAIT_LIST;
  const name = namesOf(settings).me;
  const n = (t: string) => fillName(t, name);
  const win = prediction?.likely;
  const vars: Vars = {
    dpo: prediction?.ovulationDate && today > prediction.ovulationDate ? diffDays(today, prediction.ovulationDate) : null,
    testDate: prediction?.ovulationDate ? prettyDate(addDays(prediction.ovulationDate, 12)) : null,
    fertileDay: win && today >= addDays(win.start, -3) && today <= win.end ? diffDays(today, addDays(win.start, -3)) + 1 : null,
    fertileLength: win ? diffDays(win.end, addDays(win.start, -3)) + 1 : null,
    daysToFertile: win ? Math.max(0, diffDays(addDays(win.start, -3), today)) : null,
    lhStart: lhStartDay(info),
  };

  return (
    <div className={`card cycle-card ph-${phase}`}>
      <button className="cycle-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="row between" style={{ width: "100%", alignItems: "center" }}>
          <span className="phase-pill"><span className="dot" />{PHASE_LABEL[phase]}</span>
          <span className="small muted">Day {info.cycleDay} <span className={`chev${open ? " up" : ""}`} aria-hidden>⌄</span></span>
        </span>
        <SimpleBar info={info} p={prediction} />
        {inv && <span className="cycle-inv">🎁 {partner && name ? `${name} is ` : ""}<b>{inv.name}</b>{partner ? "" : ` · ${inv.ritual}`}</span>}
        {waitOn && list.length > 0 && <span className="tiny muted">🛡️ Wait list on: {list.join(" · ")}</span>}
      </button>

      {open && (
        <div className="cycle-body">
          {partner ? <PartnerPhase phase={phase} n={n} /> : <PhaseContent phase={phase} vars={vars} />}
          {!partner && <Signals info={{ ...info }} lhTests={lhTests} dayLogs={dayLogs} byDate={byDate} ouraConnected={!!oura?.connected} />}
          <Timing partner={partner} who={name || "your partner"} />
        </div>
      )}
    </div>
  );
}

type Vars = Record<string, string | number | null | undefined>;

function Group({ label, items, vars = {} }: { label: string; items: Item[]; vars?: Vars }) {
  // Tips that need a number Bloom doesn't have today are left out rather than shown half-filled.
  const shown = items.map((i) => fill(i.t, vars)).filter((t) => !t.includes("—"));
  if (!shown.length) return null;
  return (
    <div className="cyc-group">
      <div className="tip-label">{label}</div>
      <ul className="tips">{shown.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}

/** Everything for this phase, all at once, no "show more". */
function PhaseContent({ phase, vars }: { phase: Phase; vars: Vars }) {
  const c = PHASES[phase];
  return (
    <>
      <p className="small muted">{c.hormones}</p>
      <Group vars={vars} label="Body" items={c.expect.body} />
      <Group vars={vars} label="Mind & mood" items={c.expect.mind} />
      <Group vars={vars} label="Superpowers" items={c.superpowers} />
      <Group vars={vars} label="Watch-outs" items={c.watchouts} />
      <Group vars={vars} label="Food" items={c.care.food} />
      <Group vars={vars} label="Movement" items={c.care.movement} />
      <Group vars={vars} label="Rest" items={c.care.rest} />
      <Group vars={vars} label="Trying to conceive" items={c.ttc} />
    </>
  );
}

function PartnerPhase({ phase, n }: { phase: Phase; n: (t: string) => string }) {
  const g = PARTNER_PHASES[phase];
  if (!g) return null;
  const items = (xs: string[]) => xs.map((t) => ({ t: n(t) }));
  return (
    <>
      <p className="small">{n(g.summary)}</p>
      <Group label="What to expect" items={items(g.expect)} />
      <Group label="How to support" items={items(g.support)} />
      <Group label="Go easy on" items={items(g.avoid)} />
      <Group label="For the two of you" items={items([g.together])} />
    </>
  );
}

function Signals({ info, lhTests, dayLogs, byDate, ouraConnected }: {
  info: Today; lhTests: Parameters<typeof signalsFor>[2]; dayLogs: Parameters<typeof signalsFor>[3]; byDate: Parameters<typeof signalsFor>[4]; ouraConnected: boolean;
}) {
  const { model } = useStore();
  const signals = signalsFor(info, model, lhTests, dayLogs, byDate, ouraConnected).filter((s) => s.key !== "timing");
  return (
    <div className="cyc-group">
      <div className="tip-label">Your signals</div>
      <div className="signals">
        {signals.map((s) => (
          <div key={s.key} className="signal">
            <div className="tiny muted">{s.label}</div>
            <b>{s.value}</b>
            {s.spark && <TempSpark values={s.spark.values} highFrom={null} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Timing({ partner, who }: { partner: boolean; who: string }) {
  return (
    <div className="cyc-group">
      <div className="tip-label">Timing</div>
      <ul className="tips">
        <li>Sex every 1–2 days through the window, until the temperature rise.</li>
        <li>{partner ? `${who}'s` : "Your"} signs, in order: egg-white mucus, LH rising, temperature up 3 nights.</li>
        <li>Test LH twice a day near the window (noon–6pm, less fluid 2 hours before).</li>
        {partner && <li>Your side: no hot tubs or laptop-on-lap, easy on alcohol, no 5+ day gaps.</li>}
      </ul>
    </div>
  );
}
