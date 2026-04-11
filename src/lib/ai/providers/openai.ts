import { ZodSchema } from "zod";
import { AIProvider, Message } from "../types";

export class OpenAIProviderStub implements AIProvider {
  async generateText(_: Message[], __: string): Promise<string> {
    throw new Error("OpenAI provider is not configured for this MVP.");
  }

  async generateJSON<T>(_: Message[], __: string, ___: ZodSchema<T>): Promise<T> {
    throw new Error("OpenAI provider is not configured for this MVP.");
  }
}
