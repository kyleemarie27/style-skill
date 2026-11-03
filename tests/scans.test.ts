import { describe, expect, it } from "vitest";
import { bodyTimeline, cleanScan, daysFromCrl, offsetPhrase, personalGestation, readDating, scanChecks, timelineForAi } from "../shared/scans";
import { gestation } from "../shared/pregnancy";
import type { Pregnancy, Scan } from "../shared/types";

// Period-based dates: LMP Sep 14, due Jun 21.
const preg = (extra: Partial<Pregnancy> = {}): Pregnancy => ({
  positiveTestDate: "2026-10-10", lmp: "2026-09-14", dueDate: "2027-06-21", dueDateSource: "lmp",
  questions: [], appointments: [], ...extra,
});

describe("reading an early scan", () => {
  // The real report: sac 10 × 12 × 8 mm (5w5d), yolk sac seen, no embryo yet, intrauterine.
  const early = cleanScan({ date: "2026-10-30", sacDims: [10, 12, 8], yolkSacSeen: true, embryoSeen: false, intrauterine: true, reportedDays: 40, followUp: "Recheck in 12 days" })!;

  it("turns three sac dimensions into a mean", () => {
    expect(early.msd).toBe(10);
  });

  it("says it measures behind but doesn't change the due date from the sac alone", () => {
    const d = readDating(early, preg());
    expect(d.expectedDays).toBe(46);
    expect(d.diff).toBe(-6);
    expect(d.verdict).toBe("wait");
    expect(d.suggestedDue).toBeNull();
    expect(d.text).toMatch(/ovulated later/);
  });

  it("calls a not-yet-seen embryo at a 10 mm sac expected, not a problem", () => {
    const checks = scanChecks(early, preg());
    expect(checks.find((c) => c.label === "Embryo")?.status).toBe("info");
    expect(checks.find((c) => c.label === "Location")?.status).toBe("typical");
    expect(checks.some((c) => c.status === "ask")).toBe(false);
  });
});

describe("dating by baby's length (ACOG)", () => {
  const crlFor = (days: number) => {
    // Invert Robinson: CRL for a given age.
    let crl = 1;
    while (daysFromCrl(crl) < days) crl += 0.1;
    return Math.round(crl * 10) / 10;
  };

  it("keeps the due date within 5 days before 9 weeks", () => {
    // 7w0d by dates on Nov 2; measures 4 days behind.
    const s = cleanScan({ date: "2026-11-02", crl: crlFor(45), fhr: 120, heartbeatSeen: true })!;
    const d = readDating(s, preg());
    expect(d.verdict).toBe("keep");
  });

  it("suggests a new due date when more than 5 days off before 9 weeks", () => {
    const s = cleanScan({ date: "2026-11-11", crl: crlFor(50), fhr: 130 })!; // 8w3d by dates, measures 7w1d
    const d = readDating(s, preg());
    expect(d.verdict).toBe("redate");
    expect(d.suggestedDue! > "2027-06-21").toBe(true);
  });

  it("never redates from a later scan once an early one dated the pregnancy", () => {
    const first: Scan = cleanScan({ id: "a", date: "2026-11-11", crl: crlFor(50) })!;
    const later = cleanScan({ id: "b", date: "2027-02-01", efw: 300, efwPercentile: 5 })!;
    const p = preg({ dueDate: "2027-06-28", dueDateSource: "scan", datedBy: "a", scans: [first, later] });
    expect(readDating(later, p).verdict).toBe("growth");
    expect(scanChecks(later, p).find((c) => c.label === "Estimated weight")?.status).toBe("ask");
  });
});

describe("heart rate ranges", () => {
  it("flags a slow early heart rate as worth asking, never as a diagnosis", () => {
    const s = cleanScan({ date: "2026-11-11", crl: 9, fhr: 85 })!;
    const c = scanChecks(s, preg()).find((x) => x.label === "Heartbeat")!;
    expect(c.status).toBe("ask");
    expect(c.note).not.toMatch(/miscarriage|loss|fail/i);
  });
});

describe("cleaning", () => {
  it("rejects scans without a date or any results", () => {
    expect(cleanScan({ crl: 5 })).toBeNull();
    expect(cleanScan({ date: "2026-11-01" })).toBeNull();
    expect(cleanScan({ date: "2026-11-01", crl: "6.2", fhr: 999 })).toMatchObject({ crl: 6.2 });
    expect(cleanScan({ date: "2026-11-01", crl: "6.2", fhr: 999 })?.fhr).toBeUndefined();
  });
});

describe("reading pasted report text without AI", () => {
  it("reads the real early-scan report", async () => {
    const { parseScanText } = await import("../shared/scans");
    const report = `ASSESSMENT
Gestational sac: visualized and amniotic fluid volume appears within
normal limits. Location: intrauterine. Size 10.0 mm x 12.0 mm x 8.0 mm
Yolk sac: visualized
Embryo: not visualized
GS 10.0 mm 5w 5d 7% Rempen
MATERNAL STRUCTURES
Uterus Size 67 mm x 40 mm x 39 mm
IMPRESSION
Intrauterine pregnancy with yolk sac/other echoes visualized. Patient is
scheduled to return in 12 days (or sooner if clinically indicated ) to
recheck for the presence of an embryo.`;
    const { raw, found } = parseScanText(report, "2026-10-30");
    const s = cleanScan(raw)!;
    expect(found).toBeGreaterThanOrEqual(5);
    expect(s).toMatchObject({ msd: 10, intrauterine: true, yolkSacSeen: true, embryoSeen: false, reportedDays: 40, followUp: "Recheck in 12 days" });
    expect(s.yolkSac).toBeUndefined();
  });

  it("reads a later dating scan", async () => {
    const { parseScanText } = await import("../shared/scans");
    const { raw } = parseScanText("CRL 1.8 cm 8w 4d. Cardiac activity: present. FHR 165 bpm. EDD 06/25/2027", "2026-11-11");
    expect(cleanScan(raw)).toMatchObject({ crl: 18, heartbeatSeen: true, fhr: 165, reportedDays: 60, reportedDue: "2027-06-25" });
  });
});

describe("text copied from a screenshot on one line", () => {
  it("still finds the sac, not the uterus", async () => {
    const { parseScanText } = await import("../shared/scans");
    const flat = "ASSESSMENT Gestational sac: visualized and amniotic fluid volume appears within normal limits. Location: intrauterine. Size 10.0 mm x 12.0 mm x 8.0 mm Yolk sac: visualized Embryo: not visualized GS 10.0 mm 5w 5d 7% Rempen MATERNAL STRUCTURES Uterus Size 67 mm x 40 mm x 39 mm Appearance: anteverted IMPRESSION Intrauterine pregnancy with yolk sac/other echoes visualized. Patient is scheduled to return in 12 days (or sooner if clinically indicated) to recheck for the presence of an embryo.";
    const { raw, found } = parseScanText(flat, "2026-10-30");
    expect(found).toBeGreaterThanOrEqual(5);
    expect(cleanScan(raw)).toMatchObject({ msd: 10, yolkSacSeen: true, embryoSeen: false, intrauterine: true, reportedDays: 40, followUp: "Recheck in 12 days" });
  });
});

describe("the body timeline", () => {
  const sac = cleanScan({ id: "a", date: "2026-10-30", sacDims: [10, 12, 8], yolkSacSeen: true, embryoSeen: false })!;

  it("is empty without a scan that gives an age", () => {
    expect(bodyTimeline(preg())).toBeNull();
    expect(bodyTimeline(preg({ scans: [{ id: "x", date: "2026-10-30", yolkSacSeen: true }] }))).toBeNull();
  });

  it("follows the sac when that's all there is, without touching the due date", () => {
    const p = preg({ scans: [sac] });
    const b = bodyTimeline(p)!;
    expect(b.offset).toBe(-6);
    expect(b.dueDate).toBe("2027-06-27");
    expect(p.dueDate).toBe("2027-06-21");
    // Nov 3: 7w1d by period dates, 6w2d by the body.
    expect(gestation("2026-11-03", p).totalDays).toBe(50);
    expect(personalGestation("2026-11-03", p).totalDays).toBe(44);
  });

  it("updates when a newer scan is added, and baby's length beats the sac", () => {
    const crl = cleanScan({ id: "b", date: "2026-11-11", crl: 4 })!; // about 6w0d by Robinson
    const b = bodyTimeline(preg({ scans: [sac, crl] }))!;
    expect(b.scan.id).toBe("b");
    expect(b.method).toBe("crl");
    expect(b.offset).toBe(daysFromCrl(4) - 58);
    // A later sac-only scan doesn't override a length measurement.
    const sac2 = cleanScan({ id: "c", date: "2026-11-20", msd: 30 })!;
    expect(bodyTimeline(preg({ scans: [sac, crl, sac2] }))!.scan.id).toBe("b");
  });

  it("ignores scans from 14 weeks on (those are about growth)", () => {
    const late = cleanScan({ id: "d", date: "2027-01-10", reportedDays: 120 })!;
    expect(bodyTimeline(preg({ scans: [late] }))).toBeNull();
  });

  it("tells the AI both ages when they differ", () => {
    const t = timelineForAi("2026-11-03", preg({ scans: [sac] }))!;
    expect(t.gestationalAgeByDates).toBe("7w 1d");
    expect(t.gestationalAgeByBody).toBe("6w 2d");
    expect(offsetPhrase(-6)).toBe("6 days behind your dates");
  });
});
