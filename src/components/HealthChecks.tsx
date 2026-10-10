import { useMemo, useState } from "react";
import { healthChecks, summarizeHealth, type HealthCheck, type Status } from "../../shared/health";
import { localToday } from "../../shared/dates";
import { useStore } from "../lib/store";

const LABEL: Record<Status, string> = { ok: "On track", watch: "Worth watching", doctor: "Ask your doctor", info: "FYI" };
const ICON: Record<Status, string> = { ok: "✓", watch: "!", doctor: "+", info: "i" };

export function useHealth() {
  const { model, dayLogs, lhTests, settings } = useStore();
  return useMemo(() => healthChecks(model, dayLogs, lhTests, settings, localToday()), [model, dayLogs, lhTests, settings]);
}

/** Full "Am I on track?" list for the Insights page. */
export function HealthChecks() {
  const checks = useHealth();
  const s = summarizeHealth(checks);
  const order: Status[] = ["doctor", "watch", "ok", "info"];
  const sorted = [...checks].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <div className="card stack">
      <div>
        <h2>Am I on track?</h2>
        <p className="muted small" style={{ marginTop: 4 }}>
          {s.ok} on track{s.watch ? ` · ${s.watch} worth watching` : ""}{s.doctor ? ` · ${s.doctor} to ask your doctor about` : ""}.
          Compared with published normal ranges, as general information rather than a diagnosis.
        </p>
      </div>
      {sorted.map((c) => <CheckRow key={c.id} c={c} />)}
    </div>
  );
}

function CheckRow({ c }: { c: HealthCheck }) {
  const [open, setOpen] = useState(c.status === "watch" || c.status === "doctor");
  return (
    <div className={`check st-${c.status}`}>
      <button className="check-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="check-icon" aria-hidden>{ICON[c.status]}</span>
        <span className="check-title">
          <b>{c.title}</b>
          <span className="small muted">{c.value} · normal {c.range}</span>
        </span>
        <span className="check-badge">{LABEL[c.status]}</span>
      </button>
      {open && (
        <div className="check-body small">
          <p>{c.summary}</p>
          {c.why && <p className="muted" style={{ marginTop: 6 }}>{c.why}</p>}
          {c.source && <p className="tiny muted" style={{ marginTop: 6 }}>Source: {c.source}</p>}
          {c.id === "ttc-time" && c.status === "info" && c.value === "not enough data yet" && (
            <a className="btn ghost" href="#/settings">Add your start date →</a>
          )}
        </div>
      )}
    </div>
  );
}

/** One-line summary for the Today page. */
export function HealthSummaryLink() {
  const checks = useHealth();
  const s = summarizeHealth(checks);
  const flagged = checks.filter((c) => c.status === "watch" || c.status === "doctor");
  if (!checks.some((c) => c.status !== "info")) return null;
  return (
    <a className="card row between health-link" href="#/insights">
      <span>
        <b>Am I on track?</b>{" "}
        <span className="small muted">
          {s.ok} on track{flagged.length ? ` · worth watching: ${flagged.map((c) => c.title.toLowerCase()).join(", ")}` : " · nothing to flag"}
        </span>
      </span>
      <span aria-hidden>→</span>
    </a>
  );
}
