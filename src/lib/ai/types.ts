import { ZodSchema } from "zod";

export type Message = { role: "user" | "assistant"; content: string };

export interface AIProvider {
  generateText(messages: Message[], systemPrompt: string): Promise<string>;
  generateJSON<T>(messages: Message[], systemPrompt: string, schema: ZodSchema<T>): Promise<T>;
}
