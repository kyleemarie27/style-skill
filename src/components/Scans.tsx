import { useRef, useState } from "react";
import { addDays, localToday, prettyDate } from "../../shared/dates";
import { gaLabel, gestation, lmpForDueDate } from "../../shared/pregnancy";
import { cleanScan, fmtDays, parseScanText, readDating, scanChecks, scanHeadline, type Check } from "../../shared/scans";
import type { Pregnancy, Scan } from "../../shared/types";
import { api, fileToBase64, resizeImage } from "../lib/api";
import { newId, useSavePregnancy } from "../lib/pregnancy";
import { useViewer } from "../lib/viewer";

const STATUS: Record<Check["status"], { icon: string; label: string }> = {
  typical: { icon: "✓", label: "Typical for this stage" },
  info: { icon: "ℹ︎", label: "Good to know" },
  ask: { icon: "?", label: "Worth asking about at your next visit" },
};

/** A follow-up like "Recheck in 12 days" → the date it points to, if it says how many days or weeks. */
export function followUpDate(s: Scan): string | null {
  const m = s.followUp?.match(/(\d+)\s*(day|week)/i);
  return m ? addDays(s.date, Number(m[1]) * (/week/i.test(m[2]) ? 7 : 1)) : null;
}

/**
 * What a scan means: its age compared with the due date (and whether the date should change),
 * then each result with a plain note. Nothing here is a diagnosis; the care team's read wins.
 */
export function ScanResult({ scan, preg, compact = false }: { scan: Scan; preg: Pregnancy; compact?: boolean }) {
  const save = useSavePregnancy();
  const viewer = useViewer();
  const d = readDating(scan, preg);
  const checks = scanChecks(scan, preg);
  const recheck = followUpDate(scan);
  const hasRecheck = !!recheck && preg.appointments.some((a) => a.date === recheck);
  const [busy, setBusy] = useState(false);

  const redate = async () => {
    if (!d.suggestedDue) return;
    setBusy(true);
    try {
      await save({ dueDate: d.suggestedDue, lmp: lmpForDueDate(d.suggestedDue), dueDateSource: "scan", datedBy: scan.id });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack scan-result" style={{ gap: 10 }}>
      <p className="small">{d.text}</p>
      {d.verdict === "redate" && d.suggestedDue && viewer === "me" && (
        <div className="notice small stack" style={{ gap: 8 }}>
          <span>By this scan your due date would be <b>{prettyDate(d.suggestedDue, true)}, {d.suggestedDue.slice(0, 4)}</b>. Your doctor sets the official date: update Bloom once they confirm it.</span>
          <button className="btn primary small" style={{ alignSelf: "flex-start" }} onClick={redate} disabled={busy}>
            Use {prettyDate(d.suggestedDue)} as my due date
          </button>
        </div>
      )}
      {checks.length > 0 && (
        <ul className="scan-checks">
          {(compact ? checks.filter((c) => c.status !== "info" || c.label === "Embryo" || c.label === "Heartbeat") : checks).map((c) => (
            <li key={c.label} className={`scan-check ${c.status}`}>
              <span className="scan-ico" aria-label={STATUS[c.status].label}>{STATUS[c.status].icon}</span>
              <span>
                <b>{c.label}:</b> {c.value}
                <span className="small muted block">{c.note}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {scan.followUp && (
        <div className="row between wrap small" style={{ gap: 8 }}>
          <span><b>Next:</b> {scan.followUp}{recheck ? ` (around ${prettyDate(recheck)})` : ""}</span>
          {recheck && recheck >= localToday() && !hasRecheck && (
            <button className="btn ghost small" onClick={() => save({ appointments: [...preg.appointments, { id: newId(), date: recheck, title: "Follow-up scan", notes: scan.followUp }] })}>
              + Add to appointments
            </button>
          )}
        </div>
      )}
      <p className="tiny muted">Bloom compares your numbers with typical ranges. Your care team reads the whole picture, and their plan always wins.</p>
    </div>
  );
}

/** Doctor tab: every scan, newest first, and a way to add one. */
export function ScansSection({ preg }: { preg: Pregnancy }) {
  const viewer = useViewer();
  const save = useSavePregnancy();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const scans = [...(preg.scans ?? [])].reverse();

  return (
    <section className="card stack">
      <div className="row between">
        <div className="section-title"><span className="ico" aria-hidden>🩻</span>Scans & results</div>
        {viewer === "me" && <button className="btn ghost small" onClick={() => setAdding(!adding)}>{adding ? "Cancel" : "+ Add scan"}</button>}
      </div>
      {preg.dueDateSource === "scan" && preg.datedBy && (
        <p className="small muted">Your due date is set by your {prettyDate((preg.scans ?? []).find((s) => s.id === preg.datedBy)?.date ?? preg.dueDate)} scan.</p>
      )}
      {adding && <ScanEditor preg={preg} onDone={() => setAdding(false)} />}
      {scans.length === 0 && !adding && (
        <p className="small muted">Add your ultrasound results (type them in, or paste or snap the report). Bloom shows how baby measures against your dates and what each number means.</p>
      )}
      {scans.map((s) => (
        <div key={s.id} className="scan-row">
          <button className="scan-head" aria-expanded={open === s.id} onClick={() => setOpen(open === s.id ? null : s.id)}>
            <span><b>{prettyDate(s.date, true)}</b> <span className="tiny muted">· {gaLabel(gestation(s.date, preg))} by your dates</span></span>
            <span className="small muted block">{scanHeadline(s, preg)}</span>
          </button>
          {open === s.id && (
            <>
              <ScanResult scan={s} preg={preg} />
              {viewer === "me" && (
                <button className="btn ghost danger small" style={{ alignSelf: "flex-start" }} onClick={() => {
                  if (!confirm("Delete this scan?")) return;
                  save({ scans: (preg.scans ?? []).filter((x) => x.id !== s.id), ...(preg.datedBy === s.id ? { datedBy: null, dueDateSource: "doctor" as const } : {}) });
                }}>Delete scan</button>
              )}
            </>
          )}
        </div>
      ))}
    </section>
  );
}

type Draft = Record<string, string>;
const toDraft = (s: Partial<Scan>): Draft =>
  Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v === null || v === undefined ? "" : String(v)]));

const FIELDS_EARLY: [keyof Scan, string, string][] = [
  ["msd", "Sac size (mm)", "Average of the 3 numbers"],
  ["yolkSac", "Yolk sac (mm)", "If measured"],
  ["crl", "Baby's length, CRL (mm)", ""],
  ["fhr", "Heart rate (bpm)", ""],
];
const FIELDS_LATER: [keyof Scan, string, string][] = [
  ["nt", "Nuchal translucency (mm)", "11–14 weeks"],
  ["bpd", "BPD (mm)", ""], ["hc", "Head circ. (mm)", ""], ["ac", "Belly circ. (mm)", ""], ["fl", "Femur (mm)", ""],
  ["efw", "Estimated weight (g)", ""], ["efwPercentile", "Weight percentile", ""],
];
const SEEN: [keyof Scan, string][] = [["intrauterine", "In the uterus"], ["yolkSacSeen", "Yolk sac seen"], ["embryoSeen", "Embryo seen"], ["heartbeatSeen", "Heartbeat seen"]];

/** Add a scan: read it from the report, or type the numbers. Shows the result before saving. */
export function ScanEditor({ preg, initial, onDone }: { preg: Pregnancy; initial?: Partial<Scan>; onDone: () => void }) {
  const save = useSavePregnancy();
  const [draft, setDraft] = useState<Draft>(() => toDraft({ date: localToday(), ...initial }));
  const [report, setReport] = useState("");
  const [reading, setReading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const [msg, setMsg] = useState("");
  const [allFields, setAllFields] = useState(false);
  const [showFields, setShowFields] = useState(!!initial);
  const [paste, setPaste] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const later = draft.date && gestation(draft.date, preg).weeks >= 14;
  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const tri = (k: keyof Scan) => (draft[k] === "true" ? true : draft[k] === "false" ? false : null);
  const reportedWeeks = draft.reportedDays ? Math.floor(Number(draft.reportedDays) / 7) : "";
  const reportedRest = draft.reportedDays ? Number(draft.reportedDays) % 7 : "";

  const parsed = cleanScan({ ...Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v === "true" ? true : v === "false" ? false : v])), id: "draft" });

  const fill = (scan: Scan, note: string) => {
    setDraft(toDraft({ ...scan, date: scan.date || draft.date }));
    setShowFields(true);
    setMsg(`${note} Check the date and numbers below, then save.`);
  };

  const read = async (f?: File) => {
    if (!f && !report.trim()) return;
    setMsg("");
    // Pasted text: read it right here when it looks like a standard report. No waiting, no AI.
    if (!f) {
      const local = parseScanText(report, draft.date);
      const scan = local.found >= 3 ? cleanScan(local.raw) : null;
      if (scan) return fill(scan, "Read your report.");
    }
    setReading(true);
    setElapsed(0);
    const started = Date.now();
    const tick = window.setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    const ctrl = new AbortController();
    abort.current = ctrl;
    const limit = window.setTimeout(() => ctrl.abort(), 60_000);
    try {
      let body;
      if (f && f.type === "application/pdf") {
        body = { fileName: f.name, mediaType: f.type, data: await fileToBase64(f), date: draft.date };
      } else if (f) {
        // Phone screenshots are big; a smaller copy uploads in seconds and reads just as well.
        const small = await resizeImage(f, 1600, 0.85);
        body = { fileName: f.name, mediaType: "image/jpeg", data: small.split(",")[1] ?? "", date: draft.date };
      } else {
        body = { fileName: "report.txt", mediaType: "text/plain", text: report, date: draft.date };
      }
      const r = await api.readScan(body, ctrl.signal);
      if (!r.scan) throw new Error("Couldn't find scan results in that. Try typing the numbers below.");
      const warn = r.warnings.filter((w) => !/demo/.test(w));
      fill(r.scan, `Read your report.${warn.length ? ` Note: ${warn.join(" ")}` : ""}`);
    } catch (e) {
      setMsg((e as Error).name === "AbortError"
        ? "That took too long, so it stopped. Try the photo again, or tap “Paste the text instead”: on iPhone, press and hold the text in your screenshot, tap Select All, then Copy."
        : (e as Error).message);
    } finally {
      window.clearInterval(tick);
      window.clearTimeout(limit);
      abort.current = null;
      setReading(false);
      if (file.current) file.current.value = "";
    }
  };

  const submit = async () => {
    if (!parsed) return setMsg("Add the scan date and at least one result.");
    const scan: Scan = { ...parsed, id: newId() };
    await save({ scans: [...(preg.scans ?? []), scan].sort((a, b) => a.date.localeCompare(b.date)) });
    onDone();
  };

  return (
    <div className="stack add-box scan-editor">
      <button className="btn primary block upload-report" onClick={() => file.current?.click()} disabled={reading}>
        📷 Upload a photo of your report
      </button>
      <input ref={file} type="file" accept="image/*,application/pdf" hidden onChange={(e) => read(e.target.files?.[0])} />
      <p className="tiny muted" style={{ marginTop: -4 }}>A screenshot from your patient portal, a photo of the printout, or a PDF. Bloom fills everything in for you to check.</p>
      {reading && (
        <div className="row between small reading-row">
          <span className="row" style={{ gap: 8 }}><span className="spin" /> Reading your report… {elapsed}s</span>
          <button type="button" className="btn ghost small" onClick={() => abort.current?.abort()}>Cancel</button>
        </div>
      )}
      {msg && <p className="small">{msg}</p>}

      {!showFields && (
        <div className="row wrap" style={{ gap: 4 }}>
          <button type="button" className="btn ghost small" onClick={() => setPaste(!paste)}>{paste ? "Hide" : "Paste the text instead"}</button>
          <button type="button" className="btn ghost small" onClick={() => setShowFields(true)}>Type the numbers</button>
        </div>
      )}
      {paste && (
        <div className="stack" style={{ gap: 6 }}>
          <textarea rows={3} placeholder="Paste the report text from your patient portal…" value={report} onChange={(e) => setReport(e.target.value)} />
          <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => read()} disabled={reading || !report.trim()}>Read pasted text</button>
        </div>
      )}

      {showFields && <>
      <label><div className="field-label">Scan date</div><input type="date" value={draft.date} max={localToday()} onChange={(e) => set("date", e.target.value)} /></label>
      <div className="field-label" style={{ marginBottom: 0 }}>What they saw</div>
      <div className="stack" style={{ gap: 6 }}>
        {SEEN.map(([k, label]) => (
          <div key={k} className="row between seen-row">
            <span className="small">{label}</span>
            <span className="chips">
              {([["true", "Yes"], ["false", "Not yet"]] as const).map(([v, l]) => (
                <button key={v} type="button" className="chip cm" aria-pressed={draft[k] === v} onClick={() => set(k, draft[k] === v ? "" : v)}>{l}</button>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className="grid2">
        {[...(later && !allFields ? [] : FIELDS_EARLY), ...(later || allFields ? FIELDS_LATER : [])].map(([k, label, hint]) => (
          <label key={k}>
            <div className="field-label">{label}</div>
            <input type="number" inputMode="decimal" step="0.1" placeholder={hint} value={draft[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
          </label>
        ))}
        <label>
          <div className="field-label">Age on the report</div>
          <div className="row" style={{ gap: 6 }}>
            <input type="number" inputMode="numeric" placeholder="wk" aria-label="Weeks" value={reportedWeeks} onChange={(e) => set("reportedDays", e.target.value === "" ? "" : String(Number(e.target.value) * 7 + Number(reportedRest || 0)))} />
            <input type="number" inputMode="numeric" placeholder="d" aria-label="Days" value={reportedRest} onChange={(e) => set("reportedDays", String(Number(reportedWeeks || 0) * 7 + Number(e.target.value || 0)))} />
          </div>
        </label>
      </div>
      {!allFields && <button type="button" className="btn ghost small" style={{ alignSelf: "flex-start" }} onClick={() => setAllFields(true)}>Show all fields</button>}
      <label><div className="field-label">Next step they gave you</div><input type="text" placeholder="e.g. Recheck in 12 days" value={draft.followUp ?? ""} onChange={(e) => set("followUp", e.target.value)} /></label>
      <label><div className="field-label">Notes</div><input type="text" value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></label>
      </>}

      {showFields && parsed && (
        <div className="scan-preview stack" style={{ gap: 6 }}>
          <div className="tip-label">What this means</div>
          <ScanResultPreview scan={parsed} preg={preg} />
        </div>
      )}
      {showFields && <button className="btn primary" onClick={submit} disabled={!parsed}>Save scan</button>}
    </div>
  );
}

/** The result as it will read once saved (no buttons). */
function ScanResultPreview({ scan, preg }: { scan: Scan; preg: Pregnancy }) {
  const d = readDating(scan, preg);
  const asks = scanChecks(scan, preg).filter((c) => c.status === "ask");
  return (
    <>
      <p className="small">{d.text}</p>
      {asks.map((c) => <p key={c.label} className="small"><b>{c.label}:</b> {c.note}</p>)}
      {d.measuredDays !== null && <p className="tiny muted">Measured {fmtDays(d.measuredDays)}; by your dates {fmtDays(d.expectedDays)}.</p>}
    </>
  );
}

/** Today: the latest scan for ten days after it, so the news is front and center without a tap. */
export function LatestScanCard({ preg, today }: { preg: Pregnancy; today: string }) {
  const s = (preg.scans ?? []).at(-1);
  if (!s || s.date < addDays(today, -10)) return null;
  return (
    <section className="card stack">
      <div className="row between" style={{ alignItems: "baseline" }}>
        <h3 className="card-h">Your {prettyDate(s.date)} scan</h3>
        <a className="small" href="#/doctor">All results ›</a>
      </div>
      <p className="today-line scan-headline">{scanHeadline(s, preg)}</p>
      <ScanResult scan={s} preg={preg} compact />
    </section>
  );
}
