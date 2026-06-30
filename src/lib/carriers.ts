// Conditional-call-forwarding codes per carrier (forward on no-answer/busy).
// Owner-supplied content — verify exact codes per carrier before launch.
// {EDISON} is replaced with the Edison-provisioned number (digits only).

export interface Carrier {
  id: string;
  name: string;
  // Activation code; {EDISON} placeholder is substituted at display time.
  forwardCode: string;
  deactivateCode: string;
  notes?: string;
}

export const CARRIERS: Carrier[] = [
  {
    id: "att",
    name: "AT&T",
    forwardCode: "*004*{EDISON}#",
    deactivateCode: "##004#",
    notes: "Forwards on no-answer, busy, and unreachable.",
  },
  {
    id: "verizon",
    name: "Verizon",
    forwardCode: "*71{EDISON}",
    deactivateCode: "*73",
    notes: "*71 forwards when busy or unanswered.",
  },
  {
    id: "tmobile",
    name: "T-Mobile",
    forwardCode: "**004*{EDISON}#",
    deactivateCode: "##004#",
    notes: "Forwards on no-answer, busy, and unreachable.",
  },
  {
    id: "ringcentral",
    name: "RingCentral",
    forwardCode: "Set in RingCentral app: Call Handling → Forward to {EDISON}",
    deactivateCode: "Remove the forwarding rule in the app.",
    notes: "RingCentral forwarding is configured in-app, not via a dial code.",
  },
  {
    id: "grasshopper",
    name: "Grasshopper",
    forwardCode: "Set in Grasshopper: Settings → Call Forwarding → {EDISON}",
    deactivateCode: "Remove the forwarding number in Settings.",
    notes: "Configured in the Grasshopper dashboard.",
  },
  {
    id: "googlevoice",
    name: "Google Voice",
    forwardCode: "Voice Settings → Calls → Forward to linked number {EDISON}",
    deactivateCode: "Unlink the number in Voice Settings.",
    notes: "Google Voice forwarding is configured in Voice settings.",
  },
  {
    id: "other",
    name: "Other / not sure",
    forwardCode: "Talk to a human — we'll find your exact code.",
    deactivateCode: "",
    notes: "We'll help you set up conditional forwarding for your carrier.",
  },
];

export function carrierById(id: string): Carrier | undefined {
  return CARRIERS.find((c) => c.id === id);
}

/** Substitute the Edison number into a carrier's forwarding code for display. */
export function renderForwardCode(carrier: Carrier, edisonNumber: string): string {
  const digits = edisonNumber.replace(/[^\d]/g, "");
  return carrier.forwardCode.replace(/\{EDISON\}/g, digits);
}
