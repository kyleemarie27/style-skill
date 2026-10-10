import { useMemo, useRef, useState } from "react";
import { buildModel, findPeriodStarts } from "../../shared/cycle";
import { prettyDate, prettyMonthYear } from "../../shared/dates";
import type { ImportBundle } from "../../shared/types";
import { api, fileToBase64 } from "../lib/api";
import { PasswordNeeded, parseClueJson, readClueFile } from "../lib/importers/clue";
import { mergeWithReport, summarize } from "../lib/importers/merge";
import { parseTableFile } from "../lib/importers/table";
import { useStore } from "../lib/store";

type Source = "clue" | "premom" | "other";
type Step = "choose" | "how" | "upload" | "preview" | "done";

const APPS: Record<Source, { name: string; emoji: string; blurb: string; accept: string }> = {
  clue: { name: "Clue", emoji: "🔴", blurb: "Periods, symptoms, sex, moods", accept: ".zip,.json,.cluedata,.csv" },
  premom: { name: "Premom", emoji: "🧪", blurb: "LH tests, BBT, periods, intercourse", accept: ".csv,.xls,.xlsx,.pdf,image/*" },
  other: { name: "Something else", emoji: "📄", blurb: "Another app, a spreadsheet, a PDF or screenshots", accept: ".csv,.xls,.xlsx,.json,.pdf,image/*,.txt" },
};

const HOW: Record<Source, { steps: React.ReactNode[]; tip: string }> = {
  clue: {
    steps: [
      <>Open the <b>Clue</b> app on your phone.</>,
      <>Tap your <b>profile</b> (top-left), then <b>Settings</b>.</>,
      <>Tap <b>Data export</b> (sometimes called <i>Download my data</i>) and request your data.</>,
      <>Clue sends a <b>.zip file</b> (to your email or the app). It's password-protected, so <b>copy the password</b> Clue shows you.</>,
      <>Save the zip somewhere you can reach from this device (Files, Downloads, or just leave it in your email).</>,
    ],
    tip: "Menu names move around between Clue versions. If you can't find it, search Clue's help for “export data”.",
  },
  premom: {
    steps: [
      <>Open the <b>Premom</b> app.</>,
      <>Go to <b>Me</b> (profile tab), then <b>Settings</b>.</>,
      <>Look for <b>Export data</b> (or <i>Data export</i> / <i>Export report</i>) and send it to your email.</>,
      <>Open the email and save the <b>spreadsheet (.csv / .xlsx)</b>. A <b>PDF report</b> works too.</>,
      <>No export option in your version? Take <b>screenshots</b> of your LH history and chart. Bloom can read those.</>,
    ],
    tip: "Bloom keeps Premom's LH numbers exactly as they were (0.00–1.xx, Low / High / Peak).",
  },
  other: {
    steps: [
      <>Export or download your data from the app (look in its settings for <i>Export</i>).</>,
      <>Spreadsheets, CSV, JSON, PDF reports and screenshots all work.</>,
      <>Bloom reads what it can directly; for anything unusual, AI pulls out the dates for you to review.</>,
    ],
    tip: "You'll always see a preview before anything is saved.",
  },
};

interface Parsed {
  file: string;
  bundle: ImportBundle;
  via: "parser" | "ai";
}

export function ImportPage() {
  const { reload, aiEnabled, model } = useStore();
  const [hadDataBefore] = useState(() => model.cycles.length > 0);
  const [step, setStep] = useState<Step>("choose");
  const [chosen, setChosen] = useState<Source[]>([]);
  const [idx, setIdx] = useState(0);
  const [parsed, setParsed] = useState<Record<string, Parsed[]>>({});
  const [result, setResult] = useState<{ batchId: number; newDays: number; lhTests: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const source = chosen[idx];
  const totalSteps = 2 + chosen.length * 2 + 1;
  const stepNo =
    step === "choose" ? 1 : step === "how" ? 2 + idx * 2 : step === "upload" ? 3 + idx * 2 : step === "preview" ? totalSteps - 1 : totalSteps;

  const allBundles = useMemo(() => Object.values(parsed).flat().map((p) => p.bundle), [parsed]);
  const merged = useMemo(() => mergeWithReport(allBundles), [allBundles]);

  const next = () => {
    setErr("");
    if (step === "choose") setStep("how");
    else if (step === "how") setStep("upload");
    else if (step === "upload") {
      if (idx < chosen.length - 1) {
        setIdx(idx + 1);
        setStep("how");
      } else setStep("preview");
    }
  };
  const back = () => {
    setErr("");
    if (step === "how" && idx === 0) setStep("choose");
    else if (step === "how") {
      setIdx(idx - 1);
      setStep("upload");
    } else if (step === "upload") setStep("how");
    else if (step === "preview") setStep("upload");
  };

  const commit = async () => {
    setBusy(true);
    setErr("");
    try {
      const label = chosen.map((s) => APPS[s].name).join(" + ");
      const r = await api.commitImport(label, merged.bundle);
      await reload();
      setResult({ batchId: r.batchId, newDays: r.counts.newDays ?? 0, lhTests: r.counts.lhTests ?? 0 });
      setStep("done");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="steps" aria-label={`Step ${stepNo} of ${totalSteps}`}>
        {Array.from({ length: totalSteps }, (_, i) => <i key={i} className={i < stepNo ? "on" : ""} />)}
      </div>

      {step === "choose" && (
        <div className="stack fade-in">
          <h1>Import your history</h1>
          <p className="muted">Bring your past cycles over so Bloom's predictions start out smart. Pick every app you've used. We'll go one at a time.</p>
          {(Object.keys(APPS) as Source[]).map((s) => (
            <button
              key={s}
              className="choice"
              aria-pressed={chosen.includes(s)}
              onClick={() => setChosen(chosen.includes(s) ? chosen.filter((x) => x !== s) : [...chosen, s])}
            >
              <span className="emoji" aria-hidden>{APPS[s].emoji}</span>
              <span className="stack" style={{ gap: 2 }}>
                <b>{APPS[s].name}</b>
                <span className="muted small">{APPS[s].blurb}</span>
              </span>
              <span className="spacer" />
              <span aria-hidden>{chosen.includes(s) ? "✓" : ""}</span>
            </button>
          ))}
          <button className="btn primary block" disabled={!chosen.length} onClick={next}>Next</button>
          <a className="btn ghost" href="#/today">Skip for now</a>
        </div>
      )}

      {step === "how" && source && (
        <div className="stack fade-in" key={`how-${source}`}>
          <div className="muted small">{APPS[source].emoji} {APPS[source].name}{chosen.length > 1 ? ` · app ${idx + 1} of ${chosen.length}` : ""}</div>
          <h1>Get your file from {APPS[source].name}</h1>
          <div className="card">
            <ol className="how">{HOW[source].steps.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol>
          </div>
          <p className="muted small">{HOW[source].tip}</p>
          <div className="row">
            <button className="btn" onClick={back}>Back</button>
            <button className="btn primary spacer" onClick={next}>I've got my file →</button>
          </div>
        </div>
      )}

      {step === "upload" && source && (
        <UploadStep
          key={`up-${source}`}
          source={source}
          aiEnabled={aiEnabled}
          files={parsed[source] ?? []}
          onParsed={(p) => setParsed((cur) => ({ ...cur, [source]: [...(cur[source] ?? []).filter((x) => x.file !== p.file), p] }))}
          onRemove={(file) => setParsed((cur) => ({ ...cur, [source]: (cur[source] ?? []).filter((x) => x.file !== file) }))}
          onBack={back}
          onNext={next}
          isLast={idx === chosen.length - 1}
        />
      )}

      {step === "preview" && (
        <Preview bundle={merged.bundle} conflicts={merged.conflicts} busy={busy} err={err} onBack={back} onImport={commit} />
      )}

      {step === "done" && result && <Done result={result} hadDataBefore={hadDataBefore} />}
    </div>
  );
}

function UploadStep(props: {
  source: Source;
  aiEnabled: boolean;
  files: Parsed[];
  onParsed: (p: Parsed) => void;
  onRemove: (file: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const { source, aiEnabled, files, onParsed } = props;
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [working, setWorking] = useState<string>("");
  const [err, setErr] = useState("");
  const [pwFile, setPwFile] = useState<File | null>(null);
  const [pw, setPw] = useState("");
  const [pwWrong, setPwWrong] = useState(false);
  const [unreadable, setUnreadable] = useState<File | null>(null);

  const isEmpty = (b: ImportBundle) => b.dayLogs.length === 0 && b.lhTests.length === 0;

  const viaAi = async (file: File) => {
    setUnreadable(null);
    setWorking(`AI is reading ${file.name}… this can take a minute for big files.`);
    try {
      const name = file.name.toLowerCase();
      let body: Parameters<typeof api.extract>[0];
      if (/\.(xlsx?|xls)$/.test(name)) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const text = wb.SheetNames.map((n) => `## ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}`).join("\n\n");
        body = { fileName: file.name, mediaType: "text/csv", text, source };
      } else if (/\.(csv|txt|json|cluedata)$/.test(name)) {
        body = { fileName: file.name, mediaType: "text/plain", text: await file.text(), source };
      } else {
        if (file.size > 3_000_000) throw new Error("That file is over 3 MB. Try a smaller export or a few screenshots.");
        const mediaType = file.type || (name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
        body = { fileName: file.name, mediaType, data: await fileToBase64(file), source };
      }
      const bundle = await api.extract(body);
      if (isEmpty(bundle)) throw new Error("No dated entries found in that file.");
      onParsed({ file: file.name, bundle, via: "ai" });
    } catch (e) {
      setErr(`${file.name}: ${(e as Error).message}`);
    } finally {
      setWorking("");
    }
  };

  const handle = async (file: File, password?: string) => {
    setErr("");
    setUnreadable(null);
    setWorking(`Reading ${file.name}…`);
    const name = file.name.toLowerCase();
    try {
      let bundle: ImportBundle | null = null;
      if (name.endsWith(".zip") || name.endsWith(".cluedata") || (name.endsWith(".json") && source !== "premom")) {
        bundle = await readClueFile(file, password);
        setPwFile(null);
        setPw("");
      } else if (name.endsWith(".json")) {
        bundle = parseClueJson(JSON.parse(await file.text()));
      } else if (/\.(csv|xlsx?|tsv)$/.test(name)) {
        bundle = await parseTableFile(file, source === "other" ? "import" : source);
      }
      if (bundle && !isEmpty(bundle)) {
        onParsed({ file: file.name, bundle, via: "parser" });
      } else if (aiEnabled) {
        // PDFs, images and anything our parsers didn't understand.
        setWorking("");
        if (bundle === null) return await viaAi(file);
        setUnreadable(file);
      } else {
        setErr(`Couldn't find any entries in ${file.name}.${bundle === null ? " This file type needs AI reading, which isn't turned on." : ""}`);
      }
    } catch (e) {
      if (e instanceof PasswordNeeded) {
        setPwFile(file);
        setPwWrong(e.wrong);
      } else if (aiEnabled) {
        setUnreadable(file);
      } else {
        setErr(`${file.name}: ${(e as Error).message}`);
      }
    } finally {
      setWorking((w) => (w.startsWith("AI") ? w : ""));
    }
  };

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    for (const f of Array.from(list)) await handle(f);
  };

  return (
    <div className="stack fade-in">
      <div className="muted small">{APPS[source].emoji} {APPS[source].name}</div>
      <h1>Add your {APPS[source].name} file</h1>
      <div
        className={`drop ${over ? "over" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <div style={{ fontSize: 32 }} aria-hidden>📥</div>
        <b>Tap to choose a file</b>
        <div className="muted small">or drag it here · {APPS[source].accept.replace(/,/g, " ").replace("image/*", "photos")}</div>
      </div>
      <input ref={input} type="file" hidden multiple accept={APPS[source].accept} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />

      {working && <div className="notice row"><span className="spin" />{working}</div>}

      {pwFile && (
        <form
          className="card stack"
          onSubmit={(e) => {
            e.preventDefault();
            handle(pwFile, pw);
          }}
        >
          <b>This zip is password-protected</b>
          <p className="small muted">Enter the password Clue gave you when you exported.</p>
          <input type="text" autoCapitalize="off" autoCorrect="off" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoFocus />
          {pwWrong && <div className="notice err small">That password didn't work. Check for typos and try again.</div>}
          <button className="btn primary" disabled={!pw}>Unlock</button>
        </form>
      )}

      {unreadable && (
        <div className="notice warn stack">
          <span>Bloom doesn't recognise the layout of <b>{unreadable.name}</b>. Want AI to read it instead? You'll review everything before it's saved.</span>
          <div className="row">
            <button className="btn primary" onClick={() => viaAi(unreadable)}>Let AI read it</button>
            <button className="btn ghost" onClick={() => setUnreadable(null)}>Skip</button>
          </div>
        </div>
      )}

      {err && <div className="notice err">{err}</div>}

      {files.map((p) => (
        <div key={p.file} className="card flat row between">
          <div>
            <b>✓ {p.file}</b>
            <div className="small muted">
              {p.bundle.dayLogs.length} days · {p.bundle.lhTests.length} LH tests{p.via === "ai" ? " · read by AI" : ""}
            </div>
            {p.bundle.warnings.slice(0, 2).map((w) => <div key={w} className="tiny muted">{w}</div>)}
          </div>
          <button className="btn ghost danger" onClick={() => props.onRemove(p.file)}>Remove</button>
        </div>
      ))}

      <div className="row">
        <button className="btn" onClick={props.onBack}>Back</button>
        <button className="btn primary spacer" disabled={!files.length || !!working} onClick={props.onNext}>
          {props.isLast ? "Preview import →" : "Next app →"}
        </button>
      </div>
      {!files.length && <button className="btn ghost" onClick={props.onNext}>Skip {APPS[source].name}</button>}
    </div>
  );
}

function Preview({
  bundle, conflicts, busy, err, onBack, onImport,
}: {
  bundle: ImportBundle;
  conflicts: { date: string; field: string; kept: string; dropped: string }[];
  busy: boolean;
  err: string;
  onBack: () => void;
  onImport: () => void;
}) {
  const { settings } = useStore();
  const s = summarize(bundle, findPeriodStarts(bundle.dayLogs).length);
  const model = useMemo(() => buildModel(bundle.dayLogs, bundle.lhTests, settings), [bundle, settings]);
  const recent = model.cycles.slice(-6).reverse();
  const empty = !bundle.dayLogs.length && !bundle.lhTests.length;

  return (
    <div className="stack fade-in">
      <h1>Here's what we found</h1>
      {empty ? (
        <div className="notice">No data to import yet. Go back and add a file.</div>
      ) : (
        <>
          {s.from && s.to && <p className="muted">{prettyMonthYear(s.from)} – {prettyMonthYear(s.to)}</p>}
          <div className="grid2">
            <div className="stat"><b>{s.periods}</b><span>periods</span></div>
            <div className="stat"><b>{s.lhTests}</b><span>LH tests ({s.peaks} peaks)</span></div>
            <div className="stat"><b>{s.intercourseDays}</b><span>♥ days</span></div>
            <div className="stat"><b>{s.bbtDays}</b><span>temperatures</span></div>
          </div>
          {recent.length > 0 && (
            <div className="card stack">
              <h3>Most recent cycles</h3>
              {recent.map((c) => (
                <div key={c.start} className="row between small">
                  <span>{prettyDate(c.start)}</span>
                  <span className="muted">
                    {c.length ? `${c.length} days` : "ongoing"}
                    {c.lhPeak ? ` · LH peak CD${Math.round((Date.parse(c.lhPeak) - Date.parse(c.start)) / 86400000) + 1}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          {conflicts.length > 0 && (
            <div className="notice warn small">
              Clue and Premom disagreed on {conflicts.length} day{conflicts.length > 1 ? "s" : ""}. We kept Clue's flow and Premom's LH readings
              (e.g. {prettyDate(conflicts[0].date)}: kept “{conflicts[0].kept}”, not “{conflicts[0].dropped}”).
            </div>
          )}
          {bundle.warnings.length > 0 && (
            <details className="small muted">
              <summary>{bundle.warnings.length} note{bundle.warnings.length > 1 ? "s" : ""} from the import</summary>
              <ul>{bundle.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </details>
          )}
          <p className="small muted">Nothing you've already logged in Bloom will be overwritten. You can undo this import any time in Settings.</p>
        </>
      )}
      {err && <div className="notice err">{err}</div>}
      <div className="row">
        <button className="btn" onClick={onBack} disabled={busy}>Back</button>
        <button className="btn primary spacer" onClick={onImport} disabled={busy || empty}>
          {busy ? <span className="spin" /> : `Import ${bundle.dayLogs.length + bundle.lhTests.length} entries`}
        </button>
      </div>
    </div>
  );
}

function Done({ result, hadDataBefore }: { result: { batchId: number; newDays: number; lhTests: number }; hadDataBefore: boolean }) {
  const { model, reload } = useStore();
  const [undone, setUndone] = useState(false);
  const ov = model.typicalOvulationDay;
  return (
    <div className="stack fade-in">
      <div className="center" style={{ fontSize: 48 }} aria-hidden>🌸</div>
      <h1 className="center">{undone ? "Import undone" : "You're all set!"}</h1>
      {!undone && (
        <>
          <p className="center muted">
            Added {result.newDays} days and {result.lhTests} LH tests{hadDataBefore ? " alongside what you'd already logged" : ""}. Here's what your history says:
          </p>
          <div className="grid2">
            <div className="stat"><b>{model.avgCycleLength} days</b><span>your average cycle ({model.cycleLengthSamples} recent cycles)</span></div>
            <div className="stat"><b>{model.avgPeriodLength} days</b><span>typical period</span></div>
            <div className="stat"><b>{ov ? `Day ${ov}` : "—"}</b><span>{ov ? "you usually ovulate (from LH peaks)" : "not enough LH peaks yet"}</span></div>
            <div className="stat"><b>{ov ? `Day ${Math.max(6, ov - 5)}` : `Day ${Math.max(6, model.avgCycleLength - model.avgLutealLength - 5)}`}</b><span>start LH testing around</span></div>
          </div>
          <a className="btn primary block" href="#/today">See today's note →</a>
          <button
            className="btn ghost danger"
            onClick={async () => {
              await api.undoImport(result.batchId);
              await reload();
              setUndone(true);
            }}
          >
            Undo this import
          </button>
        </>
      )}
      {undone && <a className="btn primary block" href="#/import" onClick={() => window.location.reload()}>Start over</a>}
    </div>
  );
}
