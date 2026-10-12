import { useEffect, useState } from "react";
import { prettyDate } from "../../shared/dates";
import { api, type ImportBatch } from "../lib/api";
import { activePregnancy } from "../../shared/pregnancy";
import { PregnancySettings } from "../components/PregnancySettings";
import { useStore } from "../lib/store";

export function SettingsPage() {
  const { settings, setSettings, reload, setAuthed, aiEnabled } = useStore();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [batches, setBatches] = useState<ImportBatch[]>([]);

  useEffect(() => setForm(settings), [settings]);
  useEffect(() => {
    api.imports().then((r) => setBatches(r.batches)).catch(() => {});
  }, []);

  const save = async () => {
    await setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="stack">
      <h1>Settings</h1>

      <PregnancySettings />

      <div className="card stack">
        <h2>Your cycle defaults</h2>
        <p className="muted small">Bloom learns these from your data. These are only used until it has enough history.</p>
        <div className="grid2">
          <label>
            <div className="field-label">Cycle length</div>
            <input type="number" min={20} max={45} value={form.cycleLength} onChange={(e) => setForm({ ...form, cycleLength: Number(e.target.value) })} />
          </label>
          <label>
            <div className="field-label">Period length</div>
            <input type="number" min={2} max={10} value={form.periodLength} onChange={(e) => setForm({ ...form, periodLength: Number(e.target.value) })} />
          </label>
          <label>
            <div className="field-label">Luteal phase</div>
            <input type="number" min={9} max={17} value={form.lutealLength} onChange={(e) => setForm({ ...form, lutealLength: Number(e.target.value) })} />
          </label>
        </div>
        <button className="btn primary" onClick={save}>{saved ? "Saved ✓" : "Save"}</button>
      </div>

      {!activePregnancy(settings) && <div className="card stack">
        <h2>Trying to conceive</h2>
        <p className="muted small">Used for the "Am I on track?" timeline. Doctors suggest a check-up after 12 months of trying under 35, or 6 months at 35+.</p>
        <label>
          <div className="field-label">Started trying on</div>
          <input type="date" value={form.ttcSince ?? ""} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, ttcSince: e.target.value || null })} />
        </label>
        <label className="row" style={{ gap: 10 }}>
          <input type="checkbox" checked={!!form.over35} onChange={(e) => setForm({ ...form, over35: e.target.checked })} style={{ width: 20, height: 20 }} />
          <span>I'm 35 or older</span>
        </label>
        <button className="btn primary" onClick={save}>{saved ? "Saved ✓" : "Save"}</button>
      </div>}

      <div className="card stack">
        <h2>Your data</h2>
        <div className="row wrap">
          <a className="btn primary" href="#/import">Import more history</a>
          <a className="btn" href="/api/export">Download CSV</a>
          {activePregnancy(settings) && <a className="btn" href="#/insights">Cycle history</a>}
        </div>
        {batches.length > 0 && (
          <>
            <div className="field-label" style={{ marginTop: 6 }}>Past imports</div>
            {batches.map((b) => (
              <div key={b.id} className="row between small">
                <span>
                  <b style={{ textTransform: "capitalize" }}>{b.source}</b> · {prettyDate(b.created_at.slice(0, 10))} ·{" "}
                  <span className="muted">{b.counts.newDays ?? 0} days, {b.counts.lhTests ?? 0} LH tests</span>
                </span>
                <button
                  className="btn ghost danger"
                  onClick={async () => {
                    if (!confirm("Undo this import? Days and LH tests it added will be removed. Anything you logged yourself stays.")) return;
                    await api.undoImport(b.id);
                    setBatches(batches.filter((x) => x.id !== b.id));
                    await reload();
                  }}
                >
                  Undo
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="card stack">
        <h2>Install Bloom</h2>
        <p className="small"><b>iPhone:</b> open Bloom in Safari → Share → <i>Add to Home Screen</i>.</p>
        <p className="small"><b>Android:</b> Chrome menu ⋮ → <i>Install app</i>.</p>
        <p className="small"><b>Mac / PC:</b> in Chrome or Edge, click the install icon in the address bar (or menu → <i>Install Bloom</i>). It opens in its own window with a dock icon.</p>
      </div>

      <div className="card stack">
        <h2>About</h2>
        <p className="small muted">
          AI features (strip reading, your daily line, smart import) are {aiEnabled ? "on" : "off. Add ANTHROPIC_API_KEY in Vercel to turn them on"}.
          No ads, no tracking, no notifications. Your data lives in your own database.
        </p>
        <p className="tiny muted">Version {__BUILD__} · built {__BUILT_AT__} UTC</p>
        <button
          className="btn"
          onClick={async () => {
            await api.logout();
            setAuthed(false);
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
