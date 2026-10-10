import { afterEach, describe, expect, it } from "vitest";
import { apiKey } from "../api/_lib/claude";

const FAKE = "sk-ant-api03-" + "x".repeat(95);
const original = process.env.ANTHROPIC_API_KEY;
afterEach(() => {
  process.env.ANTHROPIC_API_KEY = original;
});

describe("apiKey", () => {
  it.each([
    [FAKE],
    [`  ${FAKE}\n`],
    [`"${FAKE}"`],
    [`ANTHROPIC_API_KEY=${FAKE}`],
    [`ANTHROPIC_API_KEY="${FAKE}"`],
    [`export ANTHROPIC_API_KEY = '${FAKE}'`],
  ])("cleans %j", (raw) => {
    process.env.ANTHROPIC_API_KEY = raw;
    expect(apiKey()).toBe(FAKE);
  });
});
