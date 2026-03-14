import "server-only";

import OpenAI from "openai";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-codex";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
