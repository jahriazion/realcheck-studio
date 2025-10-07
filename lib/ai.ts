import OpenAI from "openai";

// Initialize OpenAI with better error handling
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY is not set. AI features will not work.");
}

// Helper function to check if OpenAI is properly configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
