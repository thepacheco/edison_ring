import Anthropic from "@anthropic-ai/sdk";

// Single shared Anthropic client. Reads ANTHROPIC_API_KEY from the environment.
export const anthropic = new Anthropic();

// SMS triage is short and low-complexity, so Edison defaults to the cheapest
// current tier (Claude Haiku). Override with CLAUDE_MODEL_ID without a code
// change if a larger model is ever needed.
export const EDISON_MODEL = process.env.CLAUDE_MODEL_ID || "claude-haiku-4-5";
