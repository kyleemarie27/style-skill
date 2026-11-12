import { useEffect, useState } from "react";
import { prettyDate } from "../../shared/dates";
import { api, type ImportBatch } from "../lib/api";
import { activePregnancy } from "../../shared/pregnancy";
import { MemoryCard } from "../components/MemoryCard";
import { OuraSettings } from "../components/OuraSettings";
import { DEFAULT_WAIT_LIST, namesOf } from "../../shared/types";
import { PregnancySettings } from "../components/PregnancySettings";
import { SecuritySettings } from "../components/SecuritySettings";
import { useStore } from "../lib/store";

export function SettingsPage() {
  const { settings, setSettings, reload, setAuthed, aiEnabled, role } = useStore();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [batches, setBatches] = useState<ImportBatch[]>([]);

  useEffect(() => setForm(settings), [settings]);
  useEffect(() => {
    if (role === "me") api.imports().then((r) => setBatches(r.batches)).catch(() => {});
  }, [role]);

  const save = async () => {
    await setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="stack">
      <h1>Settings</h1>

      {role === "partner" ? <SecuritySettings /> : <>
      <PregnancySettings />

      {aiEnabled && <MemoryCard />}

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
        <label className="row" style={{ gap: 10 }}>
          <input type="checkbox" checked={form.quietWait !== false} onChange={(e) => setForm({ ...form, quietWait: e.target.checked })} style={{ width: 20, height: 20 }} />
          <span>Keep the two-week wait quiet <span className="muted small">(no days-past-ovulation countdown, just your test date)</span></span>
        </label>
        <label>
          <div className="field-label">Protect the wait: things to skip from ovulation until your period</div>
          <textarea
            rows={5}
            value={(form.waitList ?? DEFAULT_WAIT_LIST).join("\n")}
            onChange={(e) => setForm({ ...form, waitList: e.target.value.split("\n") })}
          />
          <div className="tiny muted">One per line. Shows on Today from ovulation day, and Ask knows it too.</div>
        </label>
        <div className="stack partner-settings">
          <div className="field-label" style={{ marginBottom: 0 }}>You and your partner</div>
          <p className="small muted">Your partner logs in with their own password (Security, below) and gets their own Today: when the window is, how you're doing and how to help, and what each phase means for you.</p>
          <div className="grid2">
            <label><div className="field-label">Your first name</div><input type="text" maxLength={40} value={form.names?.me ?? namesOf(form).me} onChange={(e) => setForm({ ...form, names: { me: e.target.value, partner: form.names?.partner ?? namesOf(form).partner } })} /></label>
            <label><div className="field-label">Partner's first name</div><input type="text" maxLength={40} value={form.names?.partner ?? namesOf(form).partner} onChange={(e) => setForm({ ...form, names: { me: form.names?.me ?? namesOf(form).me, partner: e.target.value } })} /></label>
          </div>
          <a className="btn ghost" href="#/partner" style={{ alignSelf: "flex-start" }}>See {namesOf(settings).partner ? `${namesOf(settings).partner}'s` : "your partner's"} page →</a>
        </div>
        <button className="btn primary" onClick={save}>{saved ? "Saved ✓" : "Save"}</button>
      </div>}

      {!activePregnancy(settings) && <OuraSettings />}

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

      <SecuritySettings />
      </>}

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
