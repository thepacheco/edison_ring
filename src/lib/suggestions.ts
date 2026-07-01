/**
 * Industry-aware suggestions so owners don't start from a blank box:
 * routing keywords per business type, and auto-text greeting templates per tone.
 * Curated (no AI call = instant + free).
 */

const KEYWORDS: Record<string, string[]> = {
  hvac: ["furnace", "ac", "no heat", "no cooling", "thermostat", "install", "maintenance", "refrigerant"],
  plumbing: ["drain", "leak", "water heater", "clog", "toilet", "faucet", "sewer", "install"],
  electrical: ["panel", "outlet", "breaker", "wiring", "lights", "install", "ev charger"],
  auto: ["brakes", "oil change", "engine", "tires", "battery", "check engine", "transmission"],
  salon: ["haircut", "color", "booking", "reschedule", "walk-in", "style"],
  roofing: ["leak", "shingles", "gutter", "inspection", "storm", "repair"],
  landscaping: ["mowing", "cleanup", "install", "irrigation", "trees", "estimate"],
  home_services: ["repair", "install", "quote", "emergency", "maintenance", "schedule"],
};

export function keywordSuggestions(businessType: string): string[] {
  return KEYWORDS[businessType] ?? KEYWORDS.home_services;
}

export interface GreetingTemplate {
  label: string;
  text: string;
}

/** Greeting templates by tone. {business} is substituted at send time. */
export function greetingTemplates(voice: string): GreetingTemplate[] {
  switch (voice) {
    case "professional":
      return [
        { label: "Professional", text: "Hello, this is {business}. We're sorry we missed your call. How can we help you today?" },
        { label: "Professional + timing", text: "Hello, this is {business}. Apologies for missing your call — reply here and we'll get you scheduled right away." },
      ];
    case "brief":
      return [
        { label: "Brief", text: "{business} here — sorry we missed you. What do you need?" },
        { label: "Brief + book", text: "Missed you! {business}. Want us to get you on the schedule? What's going on?" },
      ];
    default:
      return [
        { label: "Friendly", text: "Hi! This is {business} 👋 So sorry we missed your call — what can we help you with today?" },
        { label: "Friendly + book", text: "Hey, it's {business}! Sorry we couldn't grab your call. Tell us what you need and we'll find you a time 📅" },
      ];
  }
}
