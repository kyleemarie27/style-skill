import { useState } from "react";
import { changesAt, SYMPTOMS, type ChangeNow, type ChangeStatus } from "../content/pregnancy";

const FIRST = 4;
const SPAN = 42 - FIRST;
const pct = (w: number) => `${((Math.max(FIRST, Math.min(42, w)) - FIRST) / SPAN) * 100}%`;

const STATUS: Record<ChangeStatus, string> = {
  starting: "Starting",
  peak: "Peak weeks",
  now: "Common now",
  easing: "Easing off",
  coming: "Coming up",
  fading: "Fading out",
};

/**
 * Body & mind at this week: what's usually happening now, what's on the way and what's winding
 * down, each with a little timeline across the whole pregnancy. Lives in the week guide's "You" tab.
 */
export function BodyMind({ week, logged = [] }: { week: number; logged?: string[] }) {
  const [all, setAll] = useState(false);
  const { now, coming, fading } = changesAt(week);
  const shown = all ? now : now.slice(0, 3);

  return (
    <div className="stack body-mind" style={{ gap: 12 }}>
      <div className="row between" style={{ alignItems: "baseline" }}>
        <div className="tip-label" style={{ marginTop: 0 }}>Body & mind right now</div>
        <span className="tiny muted">Tap any for the why</span>
      </div>
      <Group label="" items={shown} week={week} logged={logged} />
      {now.length > shown.length && (
        <button className="btn ghost small" style={{ alignSelf: "flex-start" }} onClick={() => setAll(true)}>Show all {now.length}</button>
      )}
      <Group label="Coming up" items={coming} week={week} logged={logged} />
      {all && <Group label="Winding down" items={fading} week={week} logged={logged} />}
    </div>
  );
}

function Group({ label, items, week, logged }: { label: string; items: ChangeNow[]; week: number; logged: string[] }) {
  if (!items.length) return null;
  return (
    <div className="stack" style={{ gap: 6 }}>
      {label && <div className="tip-label">{label}</div>}
      {items.map((c) => <ChangeRow key={c.id} c={c} week={week} logged={!!c.symptom && logged.includes(c.symptom)} />)}
    </div>
  );
}

function ChangeRow({ c, week, logged }: { c: ChangeNow; week: number; logged: boolean }) {
  const [open, setOpen] = useState(false);
  const s = c.symptom ? SYMPTOMS[c.symptom] : undefined;
  const when = c.status === "coming" ? `from ~week ${c.from}` : c.status === "fading" ? `usually done by week ${c.to}` : c.peak ? `peaks weeks ${c.peak[0]}–${c.peak[1]}` : `weeks ${c.from}–${c.to}`;
  return (
    <button className={`change st-${c.status}`} aria-expanded={open} onClick={() => setOpen(!open)}>
      <div className="row" style={{ gap: 10, alignItems: "center" }}>
        <span className="change-ico" aria-hidden>{c.icon}</span>
        <div className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
          <div className="row between" style={{ gap: 8, alignItems: "baseline" }}>
            <b>{c.name}{c.kind === "mind" && <span className="mind-tag">mind</span>}</b>
            {c.status !== "peak" && c.status !== "now" && <span className="change-pill">{STATUS[c.status]}</span>}
          </div>
          <span className="tiny muted">{when}{logged ? " · you've logged this" : ""}</span>
        </div>
      </div>
      <div className="change-track" aria-hidden>
        <span className="span" style={{ left: pct(c.from), width: `calc(${pct(c.to)} - ${pct(c.from)})` }} />
        {c.peak && <span className="peak" style={{ left: pct(c.peak[0]), width: `calc(${pct(c.peak[1])} - ${pct(c.peak[0])})` }} />}
        <span className="you" style={{ left: pct(week) }} />
      </div>
      {open && (
        <div className="stack" style={{ gap: 6 }}>
          <p className="small">{c.note}</p>
          {s && (
            <>
              <div className="tip-label">What helps</div>
              <ul className="tips small">{s.helps.slice(0, 3).map((h) => <li key={h}>{h}</li>)}</ul>
              <div className="tip-label">Call your doctor if</div>
              <p className="small">{s.call}</p>
            </>
          )}
        </div>
      )}
    </button>
  );
}
