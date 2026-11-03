import { describe, expect, it } from "vitest";
import { cleanScan } from "../shared/scans";
import { fromAi, SCAN_SCHEMA, SCHEMA as IMPORT_SCHEMA } from "../api/import-extract";
import { PREGNANT_SCHEMA } from "../api/daily-note";
import { SCHEMA as DIVE_SCHEMA } from "../api/deep-dive";

/**
 * Structured outputs rejects schemas with more than 16 union-typed (nullable / anyOf) fields, and
 * optional fields make compilation slow. Check every schema Bloom sends before it reaches the API.
 */
function audit(schema: any) {
  let unions = 0;
  let optional = 0;
  const walk = (s: any) => {
    if (!s || typeof s !== "object") return;
    if (Array.isArray(s.type) || s.anyOf) unions++;
    if (s.type === "object" || s.properties) {
      expect(s.additionalProperties).toBe(false);
      const keys = Object.keys(s.properties ?? {});
      optional += keys.filter((k) => !(s.required ?? []).includes(k)).length;
      keys.forEach((k) => walk(s.properties[k]));
    }
    if (s.items) walk(s.items);
  };
  walk(schema);
  return { unions, optional };
}

describe("AI output schemas stay within the API's limits", () => {
  it("scan schema has no unions and no optional fields", () => {
    expect(audit(SCAN_SCHEMA)).toEqual({ unions: 0, optional: 0 });
  });
  it("every schema is under the 16-union limit", () => {
    for (const s of [SCAN_SCHEMA, IMPORT_SCHEMA, PREGNANT_SCHEMA, DIVE_SCHEMA]) expect(audit(s).unions).toBeLessThanOrEqual(16);
  });
});

describe("reading the AI's scan answer", () => {
  it("turns 0 / '' / 'unknown' into nothing and yes/no into true/false", () => {
    const raw = fromAi({
      date: "", msd: 0, sacDims: [10, 12, 8], yolkSac: 0, crl: 0, fhr: 0, intrauterine: "yes", yolkSacSeen: "yes",
      embryoSeen: "no", heartbeatSeen: "unknown", reportedDays: 40, reportedDue: "", followUp: "Recheck in 12 days", notes: "",
    });
    const scan = cleanScan({ ...raw, date: "2026-10-30" })!;
    expect(scan).toMatchObject({ msd: 10, intrauterine: true, yolkSacSeen: true, embryoSeen: false, reportedDays: 40, followUp: "Recheck in 12 days" });
    expect(scan.heartbeatSeen).toBeUndefined();
    expect(scan.crl).toBeUndefined();
  });
});
