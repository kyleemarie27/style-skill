import type { VercelRequest } from "@vercel/node";
import type { BetaContentBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { levelForRatio, normalizeRatio } from "../shared/lh.js";
import { cleanScan } from "../shared/scans.js";
import type { ImportBundle } from "../shared/types.js";
import { method, route } from "./_lib/auth.js";
import { askJson, fakeAi } from "./_lib/claude.js";
import { HttpError } from "./_lib/db.js";

const SYSTEM = `You convert exports, reports and screenshots from period and fertility apps (Clue, Premom, Flo, Natural Cycles, Ovia, spreadsheets) into structured daily records.

Rules:
- Use YYYY-MM-DD dates. US apps like Premom write dates as MM/DD. If the year isn't shown, infer it from context.
- flow is one of none, spotting, light, medium, heavy. Use "medium" when a period day is marked without an intensity.
- LH tests go in lhTests. ratio is the Premom-style T/C ratio from 0.0 to about 1.6 (convert percentages: 85% means 0.85). level is low (<0.5), high (0.5–0.99) or peak (≥1.0). If only Positive/Negative is shown, use level peak/low and ratio null.
- intercourse is true only for actual sex, not for sex-drive or libido entries.
- cervical_mucus is one of dry, sticky, creamy, watery, egg_white.
- Only include what's actually in the source. Don't invent days. Put anything you weren't sure about in warnings.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["dayLogs", "lhTests", "warnings"],
  properties: {
    dayLogs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date"],
        properties: {
          date: { type: "string" },
          flow: { type: "string", enum: ["none", "spotting", "light", "medium", "heavy"] },
          intercourse: { type: "boolean" },
          symptoms: { type: "array", items: { type: "string" } },
          mood: { type: "string" },
          cervical_mucus: { type: "string", enum: ["dry", "sticky", "creamy", "watery", "egg_white"] },
          bbt: { type: "number" },
          pregnancy_test: { type: "string", enum: ["negative", "positive", "faint"] },
          notes: { type: "string" },
        },
      },
    },
    lhTests: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "ratio", "level"],
        properties: {
          date: { type: "string" },
          ratio: { type: ["number", "null"] },
          level: { type: "string", enum: ["low", "high", "peak"] },
        },
      },
    },
    warnings: { type: "array", items: { type: "string" } },
  },
};

const MAX_TEXT = 400_000;

const SCAN_SYSTEM = `You read pregnancy ultrasound reports (screenshots, PDFs or pasted text from a patient portal) and copy the results into structured fields. Copy; don't interpret.

Rules:
- Lengths in millimetres (convert cm × 10). Heart rate in bpm. Weight in grams.
- msd is the mean gestational sac diameter. If only three sac dimensions are given (e.g. "10.0 mm x 12.0 mm x 8.0 mm"), put them in sacDims and leave msd empty. If one "GS" size is given, that's msd.
- crl is crown-rump length. fhr is fetal heart rate / cardiac activity rate.
- intrauterine: true if the report says the location is intrauterine. yolkSacSeen / embryoSeen / heartbeatSeen: true if visualized, false if the report says not visualized, omitted if not mentioned.
- reportedDays: the gestational age the report gives for the scan, in total days (5w 5d = 40). reportedDue: an EDD printed on the report.
- followUp: the plan in a few words, e.g. "Recheck in 12 days for an embryo".
- date: the exam date in YYYY-MM-DD if shown, otherwise null.
- Ignore the uterus, ovary and cervix sizes; mention anything unusual about them in notes, briefly and in the report's own words.
- Use null for anything the report doesn't give, and [] for sacDims when there are no three sac dimensions.
- Put anything you weren't sure about in warnings.`;

// Every field is required and nullable: a schema with many optional fields is very slow for the
// API to compile (reads were timing out), while required-or-null compiles quickly.
const n = { type: ["number", "null"] };
const b = { type: ["boolean", "null"] };
const t = { type: ["string", "null"] };
const SCAN_FIELDS = {
  date: t, msd: n, sacDims: { type: "array", items: { type: "number" } },
  yolkSac: n, crl: n, fhr: n, nt: n, bpd: n, hc: n, ac: n, fl: n, efw: n, efwPercentile: n,
  intrauterine: b, yolkSacSeen: b, embryoSeen: b, heartbeatSeen: b,
  babies: n, reportedDays: n, reportedDue: t, followUp: t, notes: t,
};
const SCAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scan", "warnings"],
  properties: {
    scan: { type: "object", additionalProperties: false, required: Object.keys(SCAN_FIELDS), properties: SCAN_FIELDS },
    warnings: { type: "array", items: { type: "string" } },
  },
};

/** Vercel stops functions at 60 s; give up a little earlier with a message the app can show. */
function within<T>(ms: number, p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new HttpError(504, "Reading the report took too long. Paste the report's text instead: it reads instantly.")), ms)),
  ]);
}

const FAKE_SCAN = {
  scan: { sacDims: [10, 12, 8], yolkSacSeen: true, embryoSeen: false, intrauterine: true, reportedDays: 40, followUp: "Recheck in 12 days for an embryo" },
  warnings: ["(demo mode)"],
};

/**
 * POST /api/import-extract {fileName, mediaType, data (base64) | text, source}
 * Fallback for files the built-in parsers don't recognise: PDFs, screenshots, odd CSVs.
 * Returns an ImportBundle for the preview step. Nothing is saved here.
 * With source "scan" (and an optional fallback date), reads an ultrasound report instead → {scan, warnings}.
 */
export default route(async (req: VercelRequest) => {
  method(req, "POST");
  const { fileName, mediaType, data, text, source } = req.body ?? {};
  const content: BetaContentBlockParam[] = [];
  if (typeof text === "string" && text.trim()) {
    content.push({ type: "text", text: `File: ${fileName}\n\n${text.slice(0, MAX_TEXT)}` });
  } else if (typeof data === "string" && mediaType === "application/pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
  } else if (typeof data === "string" && /^image\/(jpeg|png|webp|gif)$/.test(mediaType)) {
    content.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
  } else {
    throw new HttpError(400, "Send text, a PDF, or an image.");
  }
  if (source === "scan") {
    // An ultrasound report: return one scan for the form to show before anything is saved.
    const date = typeof req.body?.date === "string" ? req.body.date : "";
    content.push({ type: "text", text: `This is an ultrasound report.${date ? ` If no exam date is shown, the scan was on ${date}.` : ""} Copy the results.` });
    const out: { scan: Record<string, unknown>; warnings: string[] } = fakeAi()
      ? FAKE_SCAN
      : await within(50_000, askJson<{ scan: Record<string, unknown>; warnings: string[] }>({ system: SCAN_SYSTEM, schema: SCAN_SCHEMA, content, effort: "low", maxTokens: 8000 }));
    const raw = { ...out.scan, date: (out.scan.date as string) || date };
    return { scan: cleanScan(raw), warnings: out.warnings };
  }
  content.push({ type: "text", text: `This came from ${source || "a fertility app"}. Extract every dated record.` });

  const out: ImportBundle = fakeAi()
    ? { dayLogs: [{ date: "2026-08-03", flow: "medium" }], lhTests: [{ date: "2026-08-15", ratio: 1.1, level: "peak" }], warnings: ["(demo mode)"] }
    : await askJson<ImportBundle>({ system: SYSTEM, schema: SCHEMA, content, effort: "low", maxTokens: 64000 });

  // Re-derive levels from ratios so the scale is consistent with Bloom's own bands.
  out.lhTests = out.lhTests.map((t) => {
    const ratio = normalizeRatio(t.ratio);
    return { ...t, ratio, level: ratio !== null ? levelForRatio(ratio) : t.level, source: source || "import" };
  });
  out.dayLogs = out.dayLogs.map((d) => ({ ...d, source: source || "import" }));
  return out;
}, { roles: ["me"] });
