import type { VercelRequest } from "@vercel/node";
import { levelForRatio, LH_BANDS } from "../shared/lh.js";
import { method, route } from "./_lib/auth.js";
import { askJson, fakeAi } from "./_lib/claude.js";
import { HttpError } from "./_lib/db.js";

interface Reading {
  readable: boolean;
  ratio: number;
  confidence: "low" | "medium" | "high";
  note: string;
}

const SYSTEM = `You read photos of LH ovulation test strips (like Premom, Easy@Home, Pregmate, Clearblue strips) and estimate the LH level on the Premom scale.

The Premom scale is the ratio of test-line (T) intensity to control-line (C) intensity:
- 0.0 means no visible test line.
- Low is below ${LH_BANDS.high}. A faint test line, clearly lighter than control.
- High is ${LH_BANDS.high}–${(LH_BANDS.peak - 0.01).toFixed(2)}. The test line is clearly visible but still lighter than control.
- Peak is ${LH_BANDS.peak.toFixed(1)} or higher. The test line is as dark as or darker than control. Darker than control can reach 1.2–1.6.

How to read:
- Find the control line (usually nearer the handle or labeled C) and the test line (T). Judge colour saturation and darkness, not width.
- Allow for lighting, shadows and white balance. Compare the two lines against each other, not against an absolute colour.
- If there are several strips, read the one that's most in focus or nearest the centre, and say which one in the note.
- If no strip is visible, there's no control line (an invalid test), or the photo is too blurry to judge, set readable=false and ratio=0, and explain in the note.
- Keep the note to one friendly sentence, e.g. "Test line is a little lighter than control. Rising, so keep testing."`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["readable", "ratio", "confidence", "note"],
  properties: {
    readable: { type: "boolean" },
    ratio: { type: "number", description: "T/C intensity ratio, 0.0 to about 1.6" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    note: { type: "string" },
  },
};

/** POST /api/lh-analyze {image: base64, mediaType} → suggested Premom-scale reading (not saved). */
export default route(async (req: VercelRequest) => {
  method(req, "POST");
  const image = String(req.body?.image ?? "").replace(/^data:image\/\w+;base64,/, "");
  const mediaType = req.body?.mediaType ?? "image/jpeg";
  if (!image) throw new HttpError(400, "No photo received.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(mediaType)) throw new HttpError(400, "Use a JPEG, PNG or WebP photo.");

  let r: Reading;
  if (fakeAi()) {
    r = { readable: true, ratio: 0.72, confidence: "medium", note: "Test line is clearly visible but lighter than control. LH is rising." };
  } else {
    r = await askJson<Reading>({
      system: SYSTEM,
      effort: "medium",
      schema: SCHEMA,
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
        { type: "text", text: "Read this LH strip on the Premom scale." },
      ],
    });
  }
  const ratio = Math.max(0, Math.min(2, Math.round(r.ratio * 100) / 100));
  return { ...r, ratio, level: levelForRatio(ratio) };
}, { roles: ["me"] });
