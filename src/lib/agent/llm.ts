import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Provider is chosen via LLM_PROVIDER ("anthropic" | "openai" | "google"),
 * defaulting to Anthropic. Kept as a factory (not a singleton) so temperature
 * can differ per node — e.g. the decision node runs cooler than a freeform
 * notes node.
 */
export function getChatModel(opts?: { temperature?: number }): BaseChatModel {
  const provider = (process.env.LLM_PROVIDER ?? "anthropic").toLowerCase();
  const temperature = opts?.temperature ?? 0.2;

  if (provider === "openai") {
    return new ChatOpenAI({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature,
      apiKey: process.env.OPENAI_API_KEY,
    }) as unknown as BaseChatModel;
  }

  if (provider === "google") {
    return new ChatGoogleGenerativeAI({
      model: process.env.GOOGLE_MODEL ?? "gemini-2.0-flash",
      temperature,
      apiKey: process.env.GOOGLE_API_KEY,
    }) as unknown as BaseChatModel;
  }

  return new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
    temperature,
    apiKey: process.env.ANTHROPIC_API_KEY,
  }) as unknown as BaseChatModel;
}
