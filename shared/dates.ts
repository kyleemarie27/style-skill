/** Date helpers that work purely on YYYY-MM-DD strings in UTC to avoid DST drift. */

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today's date in the viewer's local timezone. */
export function localToday(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISO(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toISODate(d);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86_400_000);
}

export function isISODate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function prettyDate(s: string, withWeekday = false): string {
  const d = parseISO(s);
  const base = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return withWeekday ? `${WEEKDAYS[d.getUTCDay()]}, ${base}` : base;
}

export function prettyMonthYear(s: string): string {
  const d = parseISO(s);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Normalize many date spellings found in exports to YYYY-MM-DD.
 * Handles ISO timestamps, YYYY/MM/DD, MM/DD/YYYY (US, as Premom uses), and Excel serials.
 */
export function normalizeDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : toISODate(raw);
  if (typeof raw === "number") {
    // Excel serial date (days since 1899-12-30)
    if (raw > 20000 && raw < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(raw) * 86_400_000);
      return toISODate(d);
    }
    // Unix seconds / ms
    if (raw > 1e11) return toISODate(new Date(raw));
    if (raw > 1e8) return toISODate(new Date(raw * 1000));
    return null;
  }
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return fmt(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let year = +m[3];
    if (year < 100) year += 2000;
    let month = +m[1];
    let day = +m[2];
    if (month > 12 && day <= 12) [month, day] = [day, month]; // clearly DD/MM
    return fmt(year, month, day);
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  return null;
}

function fmt(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
