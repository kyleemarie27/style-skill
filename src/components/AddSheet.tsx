import { useState } from "react";
import { localToday, prettyDate } from "../../shared/dates";
import { parseLabLines, parseLabText, type LabImport, type LabRow } from "../../shared/labs";
import { api, fileToBase64 } from "../lib/api";
import { useStore } from "../lib/store";
import { LhUploadButton } from "./LhUpload";

type Mode = "menu" | "note" | "labs";

/** One way in for everything that isn't a one-tap check-in. */
export function AddButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn add-btn" onClick={() => setOpen(true)}>＋ Add</button>
      {open && <AddSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function AddSheet({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("menu");
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet stack" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Add">
        <div className="row between">
          <h2>{mode === "note" ? "Add a note" : mode === "labs" ? "Add lab results" : "Add"}</h2>
          <button className="btn ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {mode === "menu" && (
          <div className="add-menu">
            <button className="add-opt" onClick={() => setMode("note")}><span>✍️</span>Note<small>mucus, a strip you read by eye, alcohol, how you feel</small></button>
            <button className="add-opt" onClick={() => setMode("labs")}><span>🧪</span>Lab results<small>PDF, photo, JSON, CSV or pasted text</small></button>
            <div className="add-opt as-div"><span>🌡️</span>LH strip<LhUploadButton date={localToday()} /></div>
          </div>
        )}
        {mode === "note" && <NoteForm onDone={onClose} />}
        {mode === "labs" && <LabForm onDone={onClose} />}
      </div>
    </div>
  );
}

/** A note becomes evidence as-is: the morning prediction reads it in your own words. */
function NoteForm({ onDone }: { onDone: () => void }) {
  const { reload, refreshPrediction } = useStore();
  const [date, setDate] = useState(localToday());
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api.addEvidence([{ date, kind: "note", text: text.trim() }]);
      await reload();
      onDone();
      window.scrollTo({ top: 0, behavior: "smooth" });
      refreshPrediction();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack">
      <input type="date" value={date} max={localToday()} onChange={(e) => setDate(e.target.value)} />
      <textarea rows={4} autoFocus placeholder="e.g. Clear stretchy mucus this afternoon. LH strip a bit darker than yesterday." value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn primary" disabled={!text.trim() || busy} onClick={save}>{busy ? "Saving…" : "Save and update prediction"}</button>
    </div>
  );
}

/** Lab results: read the file, show every row for review, save only what's checked. */
function LabForm({ onDone }: { onDone: () => void }) {
  const { reload, refreshPrediction, settings, setSettings, byDate, saveDay } = useStore();
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState<"" | "reading" | "saving">("");
  const [err, setErr] = useState("");
  const [imp, setImp] = useState<LabImport | null>(null);
  const [keepLoss, setKeepLoss] = useState(true);
  const [keepNeg, setKeepNeg] = useState(true);
  const [keepEvidence, setKeepEvidence] = useState(true);

  const readFile = async (f: File) => {
    setErr("");
    setBusy("reading");
    try {
      if (/\.(json|csv|txt)$/i.test(f.name) || f.type === "application/json" || f.type.startsWith("text/")) {
        setImp(parseLabText(await f.text()));
      } else if (f.type === "application/pdf" || f.type.startsWith("image/")) {
        const data = await fileToBase64(f);
        const { text } = await api.transcribeLabs({ fileName: f.name, mediaType: f.type, data });
        setImp(parseLabLines(text));
      } else {
        setErr("Use a PDF, a photo, JSON, CSV or text.");
      }
    } catch (e) {
      const m = (e as Error).message;
      setErr(/time|long|504|limit/i.test(m) ? "That report took too long to read. Try the PDF instead of a photo, or paste the results as text." : m);
    } finally {
      setBusy("");
    }
  };

  const edit = (i: number, patch: Partial<LabRow>) => setImp((cur) => cur && { ...cur, rows: cur.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const drop = (i: number) => setImp((cur) => cur && { ...cur, rows: cur.rows.filter((_, k) => k !== i) });

  const save = async () => {
    if (!imp) return;
    setBusy("saving");
    setErr("");
    try {
      const rows = imp.rows.filter((r) => r.date && r.test);
      if (rows.length) await api.saveLabs(rows, "lab-import");
      if (keepEvidence && imp.evidence.length) await api.addEvidence(imp.evidence, "lab-import");
      const preg = settings.pregnancy;
      if (keepLoss && imp.lossDate && preg?.ended && preg.ended.date !== imp.lossDate) {
        await setSettings({ ...settings, pregnancy: { ...preg, ended: { ...preg.ended, date: imp.lossDate } } });
      }
      if (keepNeg && imp.negativeTest) {
        const day = byDate.get(imp.negativeTest);
        if (day?.pregnancy_test !== "negative") await saveDay({ ...(day ?? { date: imp.negativeTest }), date: imp.negativeTest, pregnancy_test: "negative" });
      }
      await reload();
      onDone();
      window.scrollTo({ top: 0, behavior: "smooth" });
      refreshPrediction();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  if (!imp) {
    return (
      <div className="stack">
        <label className="btn primary file-btn">
          {busy === "reading" ? <><span className="spin" /> Reading…</> : "Choose a file"}
          <input type="file" accept="application/pdf,image/*,.json,.csv,.txt" hidden disabled={!!busy} onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        </label>
        <p className="tiny muted center">or paste results (one per line: Test | value | unit | range)</p>
        <textarea rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Date: 2025-03-10\nProgesterone | 0.5 | ng/mL\nEstradiol | 88 | pg/mL"} />
        <button className="btn" disabled={!paste.trim()} onClick={() => setImp(parseLabText(paste, localToday()))}>Read pasted text</button>
        {err && <div className="notice err small">{err}</div>}
      </div>
    );
  }

  // The newest draw is what she's checking; earlier values (for trend lines) fold into one line.
  const dates = [...new Set(imp.rows.map((r) => r.date))].sort().reverse();
  const main = dates[0] ?? "";
  const earlier = imp.rows.filter((r) => r.date !== main);
  const setDate = (from: string, to: string) => setImp((cur) => cur && { ...cur, rows: cur.rows.map((r) => (r.date === from ? { ...r, date: to } : r)) });
  return (
    <div className="stack">
      <p className="small muted">Check each value; tap to fix, ✕ to drop. Nothing is saved until you tap Save.</p>
      {imp.warnings.map((w) => <div key={w} className="notice warn small">{w}</div>)}
      <div className="lab-group">
        <label className="row between small">
          <b>Drawn</b>
          <input type="date" value={main} className="lab-date" onChange={(e) => setDate(main, e.target.value)} />
        </label>
        <table className="lab-table">
          <tbody>
            {imp.rows.map((r, i) => r.date !== main ? null : (
              <tr key={i} className={r.flag ? `flag-${r.flag}` : r.status === "pending" ? "pending" : ""}>
                <td className="lab-test">{r.test}</td>
                <td><input value={r.status === "pending" ? "" : r.value} placeholder={r.status === "pending" ? "pending" : ""} onChange={(e) => edit(i, { value: e.target.value, status: e.target.value ? "final" : r.status })} /></td>
                <td className="tiny muted">{r.unit ?? ""}</td>
                <td><button className="btn ghost small" onClick={() => drop(i)} aria-label={`Drop ${r.test}`}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {earlier.length > 0 && (
        <details className="small">
          <summary className="muted">+ {earlier.length} earlier values, for trend lines ({dates.at(-1)!.slice(0, 4)}–{dates[1].slice(0, 4)})</summary>
          <ul className="tips">{earlier.map((r) => <li key={r.date + r.test}>{r.date}: {r.test} {r.value} {r.unit ?? ""}</li>)}</ul>
        </details>
      )}
      {(imp.lossDate || imp.negativeTest || imp.evidence.length > 0) && (
        <div className="stack small">
          {imp.lossDate && settings.pregnancy?.ended && settings.pregnancy.ended.date !== imp.lossDate && (
            <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={keepLoss} onChange={(e) => setKeepLoss(e.target.checked)} />Set the loss date to {prettyDate(imp.lossDate)} (Bloom has {prettyDate(settings.pregnancy.ended.date)})</label>
          )}
          {imp.negativeTest && byDate.get(imp.negativeTest)?.pregnancy_test !== "negative" && (
            <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={keepNeg} onChange={(e) => setKeepNeg(e.target.checked)} />Log the negative pregnancy test on {prettyDate(imp.negativeTest)}</label>
          )}
          {imp.evidence.length > 0 && (
            <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={keepEvidence} onChange={(e) => setKeepEvidence(e.target.checked)} />Save {imp.evidence.length} notes and observations that came with it</label>
          )}
        </div>
      )}
      {err && <div className="notice err small">{err}</div>}
      <div className="row wrap">
        <button className="btn primary" disabled={!!busy} onClick={save}>{busy === "saving" ? "Saving…" : `Save ${imp.rows.length} results and update prediction`}</button>
        <button className="btn ghost" onClick={() => setImp(null)}>Start over</button>
      </div>
    </div>
  );
}
