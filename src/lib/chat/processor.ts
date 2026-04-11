import { getProvider } from "@/lib/ai/provider-registry";
import { Message } from "@/lib/ai/types";
import { extractedSchema } from "@/lib/validators/agent-profile";
import { STEP_PROMPTS } from "./prompts";
import { getStep } from "./steps";

export async function processStep(currentStep: number, transcript: Message[]) {
  const step = getStep(currentStep);
  const provider = getProvider();

  try {
    const extracted = await provider.generateJSON(transcript, STEP_PROMPTS[step.name], extractedSchema);
    const reply = await provider.generateText(transcript, STEP_PROMPTS[step.name]);

    return {
      reply,
      extractedFields: extracted.extracted,
      shouldAdvance: extracted.shouldAdvance
    };
  } catch {
    return {
      reply: step.fallbackPrompt,
      extractedFields: {},
      shouldAdvance: false
    };
  }
}
