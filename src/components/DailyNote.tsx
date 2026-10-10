import { useMemo, useState } from "react";
import type { Today } from "../../shared/cycle";
import { patternFor } from "../../shared/patterns";
import { PHASES, dayNotes, fill, rotate, type Item } from "../content/phases";
import { useStore } from "../lib/store";

type Vars = Record<string, string | number | null | undefined>;
type Group = { label?: string; items: Item[] };

/** The phase note: day-specific notes, your own pattern, then the expandable sections. */
export function DailyNote({ info, vars }: { info: Today; vars: Vars }) {
  const { model, dayLogs } = useStore();
  const c = PHASES[info.phase];
  const seed = info.cycleDay ?? 0;
  const special = dayNotes(info);
  const pattern = useMemo(() => patternFor(info, model, dayLogs), [info, model, dayLogs]);

  const sections: { id: string; title: string; icon: string; groups: Group[]; collapsedPerGroup: number }[] = [
    { id: "expect", title: "What to expect", icon: "🌙", collapsedPerGroup: 2, groups: [
      { label: "Body", items: c.expect.body },
      { label: "Mind & mood", items: c.expect.mind },
    ] },
    { id: "superpowers", title: "Your superpowers", icon: "✨", collapsedPerGroup: 3, groups: [{ items: c.superpowers }] },
    { id: "watchouts", title: "Watch-outs", icon: "⚠️", collapsedPerGroup: 3, groups: [{ items: c.watchouts }] },
    { id: "care", title: "Take care of yourself", icon: "🫖", collapsedPerGroup: 1, groups: [
      { label: "Food", items: c.care.food },
      { label: "Movement", items: c.care.movement },
      { label: "Rest & self-care", items: c.care.rest },
    ] },
    { id: "most", title: "Make the most of it", icon: "🎯", collapsedPerGroup: 1, groups: [
      { label: "Work & creativity", items: c.makeTheMost.work },
      { label: "Friends & fun", items: c.makeTheMost.social },
      { label: "You two", items: c.makeTheMost.relationship },
    ] },
    { id: "ttc", title: "Trying to conceive", icon: "🌱", collapsedPerGroup: 3, groups: [{ items: c.ttc }] },
  ];

  return (
    <div className={`card stack ph-${info.phase}`}>
      <div>
        <span className="phase-pill"><span className="dot" />{c.title}</span>
        <h2 style={{ marginTop: 10 }}>{c.tagline}</h2>
        {c.hormones && <p className="muted small" style={{ marginTop: 6 }}>{c.hormones}</p>}
      </div>

      {special.length > 0 && (
        <div className="today-special">
          {special.map((i) => <Tip key={i.t} item={i} vars={vars} />)}
        </div>
      )}

      {(pattern.tags.length > 0 || pattern.facts.length > 0) && info.phase !== "unknown" && (
        <section className="pattern">
          <div className="section-title"><span className="ico" aria-hidden>📈</span>Your pattern</div>
          {pattern.tags.length > 0 && (
            <>
              <p className="small" style={{ marginTop: 6 }}>Around this point in past cycles you often logged:</p>
              <div className="chips" style={{ marginTop: 6 }}>
                {pattern.tags.map((t) => (
                  <span key={t.label} className="chip static">{t.label} <span className="muted tiny">{t.cycles}/{t.of}</span></span>
                ))}
              </div>
            </>
          )}
          {pattern.facts.length > 0 && <ul className="tips">{pattern.facts.map((f) => <li key={f}>{f}</li>)}</ul>}
        </section>
      )}

      {sections.map((s) => (
        <Section key={s.id} {...s} seed={seed + s.id.length} vars={vars} />
      ))}
    </div>
  );
}

function Section({ title, icon, groups, collapsedPerGroup, seed, vars }: {
  title: string; icon: string; groups: Group[]; collapsedPerGroup: number; seed: number; vars: Vars;
}) {
  const [open, setOpen] = useState(false);
  const rotated = groups.filter((g) => g.items.length).map((g) => ({ ...g, items: rotate(g.items, seed) }));
  if (!rotated.length) return null;
  const total = rotated.reduce((n, g) => n + g.items.length, 0);
  const shown = rotated.reduce((n, g) => n + Math.min(g.items.length, collapsedPerGroup), 0);
  return (
    <section>
      <div className="section-title"><span className="ico" aria-hidden>{icon}</span>{title}</div>
      {rotated.map((g) => {
        const items = open ? g.items : g.items.slice(0, collapsedPerGroup);
        return (
          <div key={g.label ?? "all"} className="tip-group">
            {g.label && rotated.length > 1 && <div className="tip-label">{g.label}</div>}
            <ul className="tips">{items.map((i) => <Tip key={i.t} item={i} vars={vars} li />)}</ul>
          </div>
        );
      })}
      {total > shown && (
        <button className="btn ghost small more" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Show less" : `Show ${total - shown} more`}
        </button>
      )}
    </section>
  );
}

function Tip({ item, vars, li }: { item: Item; vars: Vars; li?: boolean }) {
  const body = (
    <>
      {fill(item.t, vars)}
      {item.why && <span className="why"> {fill(item.why, vars)}</span>}
    </>
  );
  return li ? <li>{body}</li> : <p>{body}</p>;
}
