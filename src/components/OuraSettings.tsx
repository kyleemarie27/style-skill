import { useState } from "react";
import { api } from "../lib/api";
import { useRoute, useStore } from "../lib/store";

/** Connect Oura: setup steps until the keys are in Vercel, then one Connect button. */
export function OuraSettings() {
  const { oura, wearable, syncOura, reload } = useStore();
  const [route] = useRoute();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const justConnected = route[1] === "oura-connected";
  const failed = route[1] === "oura-failed" ? decodeURIComponent(route[2] ?? "") : "";
  const last = wearable.filter((w) => w.tempDev !== null).at(-1);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card stack" id="oura">
      <h2>Oura</h2>
      <p className="muted small">
        Bloom reads your nightly temperature, resting heart rate and HRV from Oura once a day. A temperature rise that holds for
        3 nights confirms you ovulated. Nothing is sent to Oura, and your tokens stay in your own database.
      </p>
      {justConnected && oura?.connected && <div className="notice">Oura is connected. Bloom pulled your last 90 nights.</div>}
      {failed && <div className="notice warn">Oura didn't connect: {failed}</div>}

      {!oura?.configured ? (
        <div className="stack small">
          <b>One-time setup (about 5 minutes)</b>
          <ol className="tips plan-list">
            <li>Go to <b>cloud.ouraring.com/oauth/applications</b>, sign in with your Oura account and choose <b>New application</b>.</li>
            <li>
              Fill in any name (e.g. "Bloom"), and set the <b>Redirect URI</b> to exactly:
              <code className="copy">{oura?.redirectUri ?? "https://<your Bloom address>/api/oura/callback"}</code>
              Tick the <b>daily</b> and <b>personal</b> scopes.
            </li>
            <li>Copy the <b>Client ID</b> and <b>Client Secret</b> it gives you.</li>
            <li>In Vercel → your Bloom project → Settings → Environment Variables, add <code>OURA_CLIENT_ID</code> and <code>OURA_CLIENT_SECRET</code>. Add <code>CRON_SECRET</code> too (any long random string) so the daily sync runs on its own.</li>
            <li>Redeploy, come back here and tap Connect.</li>
          </ol>
        </div>
      ) : oura.connected ? (
        <div className="stack">
          <p className="small">
            Connected.{" "}
            {oura.lastSync ? `Last synced ${new Date(oura.lastSync).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.` : "Not synced yet."}
            {last && ` Last night: ${last.tempDev! >= 0 ? "+" : "−"}${Math.abs(last.tempDev!).toFixed(2)}°C${last.rhr ? `, resting HR ${last.rhr}` : ""}${last.hrv ? `, HRV ${Math.round(last.hrv)}` : ""}.`}
          </p>
          {oura.lastError && <div className="notice warn small">Last sync didn't work: {oura.lastError}</div>}
          <p className="tiny muted">Oura only has last night once your ring has synced to the Oura app, so open it in the morning before Bloom.</p>
          <div className="row wrap">
            <button className="btn" disabled={busy} onClick={() => run(() => syncOura(true))}>{busy ? "Syncing…" : "Sync now"}</button>
            <button className="btn ghost danger" disabled={busy} onClick={() => run(async () => { await api.ouraDisconnect(); await reload(); })}>Disconnect</button>
          </div>
        </div>
      ) : (
        <a className="btn primary" href="/api/oura/connect">Connect Oura</a>
      )}
      {err && <div className="notice warn small">{err}</div>}
    </div>
  );
}
