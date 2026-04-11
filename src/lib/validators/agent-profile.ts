import { z } from "zod";

export const extractedSchema = z.object({
  step: z.number().int().min(1).max(7),
  extracted: z.record(z.string(), z.unknown()),
  shouldAdvance: z.boolean(),
  needsConfirmation: z.boolean().default(false),
  missingRequired: z.array(z.string()).default([])
});

export type ExtractedPayload = z.infer<typeof extractedSchema>;
