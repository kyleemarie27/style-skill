import type { BumpPhoto, DayLog, ImportBundle, JournalEntry, LhLevel, LhTest, Settings } from "../../shared/types";

export class AuthError extends Error {}

/** Which login this is: the main account ("me") or the partner's. */
export type Role = "me" | "partner";

export interface AuthStatus {
  authed: boolean;
  role: Role | null;
  ai: boolean;
  /** Still logged in with the setup password from Vercel; time to pick a personal one. */
  setup: boolean;
  /** A partner login exists. */
  partner: boolean;
}

/** A signed-in device, for Settings. */
export interface SignedIn {
  id: string;
  role: Role;
  label: string | null;
  created_at: string;
  last_seen: string;
  current: boolean;
}

async function call<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(`/api/${path}`, {
    credentials: "same-origin",
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401 && path !== "auth") throw new AuthError("Please log in.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export interface LhReading {
  readable: boolean;
  ratio: number;
  level: LhLevel;
  confidence: "low" | "medium" | "high";
  note: string;
}

export interface ImportBatch {
  id: number;
  source: string;
  created_at: string;
  counts: { newDays?: number; mergedDays?: number; lhTests?: number };
}

export const api = {
  status: () => call<AuthStatus>("auth"),
  login: (password: string) => call<{ ok: true; role: Role; setup: boolean }>("auth", { method: "POST", json: { password } }),
  logout: () => call("auth", { method: "DELETE" }),
  changePassword: (current: string, next: string) => call("auth", { method: "PUT", json: { action: "password", current, next } }),
  setPartnerPassword: (password: string) => call("auth", { method: "PUT", json: { action: "partner", password } }),
  claimPartner: (password: string) => call("auth", { method: "PUT", json: { action: "claim-partner", password } }),
  removePartner: () => call("auth?partner=1", { method: "DELETE" }),
  sessions: () => call<{ sessions: SignedIn[] }>("auth?sessions=1"),
  endSession: (id: string) => call(`auth?session=${encodeURIComponent(id)}`, { method: "DELETE" }),
  logoutOthers: () => call("auth?others=1", { method: "DELETE" }),
  data: () => call<{ dayLogs: DayLog[]; lhTests: LhTest[] }>("logs"),
  saveDay: (log: DayLog) => call<{ log: DayLog }>("logs", { method: "PUT", json: { log } }),
  settings: () => call<{ settings: Settings }>("settings"),
  saveSettings: (settings: Settings) => call<{ settings: Settings }>("settings", { method: "PUT", json: { settings } }),
  analyzeStrip: (image: string) => call<LhReading>("lh-analyze", { method: "POST", json: { image, mediaType: "image/jpeg" } }),
  saveLh: (test: LhTest, photo?: string) => call<{ test: LhTest }>("lh", { method: "POST", json: { test, photo } }),
  deleteLh: (id: number) => call("lh?id=" + id, { method: "DELETE" }),
  dailyNote: (date: string, phase: string, context: unknown, refresh = false) =>
    call<{ line: string; plan?: DayPlan | null }>("daily-note", { method: "POST", json: { date, phase, context, refresh } }),
  deepDive: (date: string, key: string, context: unknown, refresh = false) =>
    call<DeepDive>("deep-dive", { method: "POST", json: { date, key, context, refresh } }),
  memory: () => call<{ facts: Fact[] }>("ask"),
  saveMemory: (facts: Fact[]) => call<{ facts: Fact[] }>("ask", { method: "PUT", json: { facts } }),
  learn: (messages: ChatMsg[]) => call<{ added: string[]; facts: Fact[] }>("ask", { method: "POST", json: { learn: true, messages } }),
  imports: () => call<{ batches: ImportBatch[] }>("import"),
  commitImport: (source: string, bundle: ImportBundle) =>
    call<{ batchId: number; counts: ImportBatch["counts"] }>("import", {
      method: "POST",
      json: { source, dayLogs: bundle.dayLogs, lhTests: bundle.lhTests },
    }),
  undoImport: (id: number) => call("import?id=" + id, { method: "DELETE" }),
  memories: (preg: string) => call<{ entries: JournalEntry[]; photos: BumpPhoto[] }>(`memories?preg=${preg}`),
  saveAnswer: (entry: JournalEntry) => call<{ entry: JournalEntry | null }>("memories", { method: "PUT", json: { entry } }),
  saveBump: (preg: string, week: number, date: string, photo: string) =>
    call<{ photo: BumpPhoto }>("memories", { method: "POST", json: { preg, week, date, photo } }),
  deleteBump: (preg: string, week: number) => call(`memories?preg=${preg}&week=${week}`, { method: "DELETE" }),
  extract: (body: { fileName: string; mediaType: string; data?: string; text?: string; source: string }) =>
    call<ImportBundle>("import-extract", { method: "POST", json: body }),
};

/** Where a bump photo is served from. The date makes a replaced photo a new URL, so caching stays safe. */
export const bumpUrl = (preg: string, p: BumpPhoto) => `/api/memories?preg=${preg}&week=${p.week}&v=${p.date}`;

/** Today's plan in pregnancy mode, written by AI with the daily line. */
export interface DayPlan {
  todos: { t: string; why: string }[];
  partner: { t: string; why: string } | null;
  ask: string[];
}

export interface DeepDive {
  title: string;
  minutes: number;
  opener?: string;
  sections: { heading: string; body: string }[];
  takeaways: string[];
  signoff?: string;
  tomorrow?: string;
}

/** Something Bloom remembers about you from chat. */
export interface Fact {
  id: string;
  text: string;
  added: string;
}

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/** Ask Bloom: streams the answer, calling onText with the full text so far. */
export async function askBloom(messages: ChatMsg[], context: unknown, onText: (text: string) => void, signal?: AbortSignal) {
  const res = await fetch("/api/ask", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
    signal,
  });
  if (res.status === 401) throw new AuthError("Please log in.");
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(text);
  }
  return text;
}

/** Resize a photo in the browser to a JPEG data URL (keeps uploads small and fast). */
export async function resizeImage(file: File, maxSide = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
