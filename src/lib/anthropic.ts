import Anthropic from "@anthropic-ai/sdk";

// Single shared Anthropic client. Reads ANTHROPIC_API_KEY from the environment.
export const anthropic = new Anthropic();

// Edison standardizes on Claude Opus 4.8 — the most capable model — for the
// SMS triage conversation. The conversation engine uses adaptive thinking off
// (these are short, latency-sensitive replies) and a forced tool call for
// structured output.
export const EDISON_MODEL = "claude-opus-4-8";
