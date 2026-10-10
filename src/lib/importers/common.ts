import type { DayLog, Flow, LhTest, Mucus, PregnancyTest } from "../../../shared/types";

/** Accumulates day logs keyed by date, merging repeated facts for the same day. */
export class DayCollector {
  days = new Map<string, DayLog>();
  lh: LhTest[] = [];
  warnings: string[] = [];
  constructor(public source: string) {}

  day(date: string): DayLog {
    let d = this.days.get(date);
    if (!d) {
      d = { date, source: this.source };
      this.days.set(date, d);
    }
    return d;
  }

  flow(date: string, flow: Flow) {
    const d = this.day(date);
    d.flow = strongerFlow(d.flow ?? null, flow);
  }

  symptom(date: string, s: string) {
    const d = this.day(date);
    const label = humanize(s);
    if (!label) return;
    d.symptoms = [...new Set([...(d.symptoms ?? []), label])];
  }

  mood(date: string, m: string) {
    const d = this.day(date);
    const label = humanize(m);
    if (!label) return;
    d.mood = d.mood ? (d.mood.includes(label) ? d.mood : `${d.mood}, ${label}`) : label;
  }

  result() {
    const dayLogs = [...this.days.values()]
      .filter((d) => Object.keys(d).some((k) => k !== "date" && k !== "source"))
      .sort((a, b) => a.date.localeCompare(b.date));
    const lhTests = this.lh.sort((a, b) => a.date.localeCompare(b.date));
    return { dayLogs, lhTests, warnings: this.warnings };
  }
}

const FLOW_RANK: Record<Flow, number> = { none: 0, spotting: 1, light: 2, medium: 3, heavy: 4 };
function strongerFlow(a: Flow | null, b: Flow): Flow {
  if (!a) return b;
  return FLOW_RANK[b] > FLOW_RANK[a] ? b : a;
}

export function humanize(s: string): string {
  return String(s)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export function flowFromText(raw: unknown): Flow | null {
  const s = String(raw ?? "").toLowerCase().trim();
  if (!s || s === "0" || s === "false") return null;
  if (s.includes("spot")) return "spotting";
  if (s.includes("heavy") || s.includes("high") || s === "3" || s.includes("super")) return "heavy";
  if (s.includes("medium") || s.includes("moderate") || s.includes("normal") || s === "2") return "medium";
  if (s.includes("light") || s.includes("low") || s === "1") return "light";
  if (s === "true" || s === "yes" || s === "y" || s === "x" || s.includes("period") || s.includes("bleed")) return "medium";
  if (s.includes("none") || s === "no") return null;
  return null;
}

export function mucusFromText(raw: unknown): Mucus | null {
  const s = String(raw ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("egg") || s.includes("stretch") || s.includes("slippery") || s.includes("ewcm")) return "egg_white";
  if (s.includes("water") || s.includes("wet")) return "watery";
  if (s.includes("cream") || s.includes("lotion") || s.includes("milky")) return "creamy";
  if (s.includes("sticky") || s.includes("tacky") || s.includes("gummy")) return "sticky";
  if (s.includes("dry") || s.includes("none")) return "dry";
  return null;
}

export function pregnancyFromText(raw: unknown): PregnancyTest | null {
  const s = String(raw ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("faint")) return "faint";
  if (s.includes("pos") || s === "+" || s.includes("bfp")) return "positive";
  if (s.includes("neg") || s === "-" || s.includes("bfn")) return "negative";
  return null;
}

export function isTruthyMark(raw: unknown): boolean {
  if (raw === true) return true;
  if (typeof raw === "number") return raw > 0;
  const s = String(raw ?? "").toLowerCase().trim();
  if (!s || ["0", "false", "no", "n", "none", "-", "null"].includes(s)) return false;
  return true;
}

export function parseTemp(raw: unknown): number | null {
  const n = Number(String(raw ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n === 0) return null;
  if ((n >= 35 && n <= 38.5) || (n >= 95 && n <= 101.5)) return Math.round(n * 100) / 100;
  return null;
}
