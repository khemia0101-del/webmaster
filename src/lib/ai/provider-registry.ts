import { AIProvider } from "./types";
import { ClaudeProvider } from "./providers/claude";
import { OpenAIProviderStub } from "./providers/openai";

export function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "claude";
  if (provider === "claude") return new ClaudeProvider();
  if (provider === "openai") return new OpenAIProviderStub();
  throw new Error(`Unsupported provider: ${provider}`);
}
