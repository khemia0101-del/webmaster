import Anthropic from "@anthropic-ai/sdk";
import { ZodSchema } from "zod";
import { AIProvider, Message } from "../types";

export class ClaudeProvider implements AIProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async generateText(messages: Message[], systemPrompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content }))
    });
    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.type === "text" ? textBlock.text : "";
  }

  async generateJSON<T>(messages: Message[], systemPrompt: string, schema: ZodSchema<T>): Promise<T> {
    const raw = await this.generateText(messages, `${systemPrompt}\nReturn valid JSON only.`);
    return schema.parse(JSON.parse(raw));
  }
}
