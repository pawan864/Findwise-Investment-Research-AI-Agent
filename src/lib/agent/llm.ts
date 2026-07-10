import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export function getChatModel(opts?: { temperature?: number }): BaseChatModel {
  // Default to Google Gemini
  const provider = (process.env.LLM_PROVIDER ?? "google").toLowerCase();
  const temperature = opts?.temperature ?? 0.2;

  switch (provider) {
    case "google":
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error(
          "GOOGLE_API_KEY is missing. Please add it in your environment variables."
        );
      }

      return new ChatGoogleGenerativeAI({
        model: process.env.GOOGLE_MODEL ?? "gemini-3.1-flash-lite",
        temperature,
        apiKey: process.env.GOOGLE_API_KEY,
      }) as unknown as BaseChatModel;

    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is missing. Please add it in your environment variables."
        );
      }

      return new ChatOpenAI({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature,
        apiKey: process.env.OPENAI_API_KEY,
      }) as unknown as BaseChatModel;

    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          "ANTHROPIC_API_KEY is missing. Please add it in your environment variables."
        );
      }

      return new ChatAnthropic({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
        temperature,
        apiKey: process.env.ANTHROPIC_API_KEY,
      }) as unknown as BaseChatModel;

    default:
      throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  }
}