import { useMemo } from "react";
import { healthChecks, summarizeHealth, type Status } from "../../shared/health";
import { localToday } from "../../shared/dates";
import { useStore } from "../lib/store";

const LABEL: Record<Status, string> = { ok: "On track", watch: "Worth watching", doctor: "Ask your doctor", info: "FYI" };

export function useHealth() {
  const { model, dayLogs, lhTests, settings } = useStore();
  return useMemo(() => healthChecks(model, dayLogs, lhTests, settings, localToday()), [model, dayLogs, lhTests, settings]);
}

/** "Am I on track?" as dots: one tile per check, tap to ask about it. */
export function HealthChecks() {
  const checks = useHealth();
  const order: Status[] = ["doctor", "watch", "ok", "info"];
  const sorted = [...checks].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <div className="card stack">
      <h2>On track?</h2>
      <div className="dots-grid">
        {sorted.map((c) => (
          <a key={c.id} className={`dot-tile st-${c.status}`} href={`#/ask/${encodeURIComponent(`Explain my ${c.title.toLowerCase()}: ${c.value}`)}`} title={LABEL[c.status]}>
            <i aria-label={LABEL[c.status]} />
            <span className="small"><b>{c.title}</b></span>
            <span className="tiny muted">{c.value}</span>
          </a>
        ))}
      </div>
      <div className="legend tiny">
        <span><i className="st-ok" />On track</span><span><i className="st-watch" />Watch</span><span><i className="st-doctor" />Ask your doctor</span><span><i className="st-info" />Not enough data</span>
      </div>
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
