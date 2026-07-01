export interface Industry {
  slug: string;
  name: string; // e.g. "HVAC"
  noun: string; // e.g. "HVAC company"
  headline: string;
  sub: string;
  avgTicket: number;
  examples: string[]; // sample customer needs, used in the demo thread
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "hvac",
    name: "HVAC",
    noun: "HVAC company",
    headline: "Every missed call in a heat wave is a $300 job gone.",
    sub: "When the AC dies, people call the next shop in 30 seconds. Edison texts them back before they do.",
    avgTicket: 320,
    examples: [
      "AC stopped cooling upstairs, it's really hot",
      "Furnace won't kick on and it's freezing",
      "Need a tune-up before summer",
    ],
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    noun: "plumbing business",
    headline: "A leaking water heater won't wait for your voicemail.",
    sub: "Emergencies go to whoever answers first. Edison answers instantly by text and books the visit.",
    avgTicket: 380,
    examples: [
      "Water heater leaking into the garage",
      "Kitchen sink is backed up",
      "Toilet won't stop running",
    ],
  },
  {
    slug: "electrical",
    name: "Electrical",
    noun: "electrical contractor",
    headline: "Sparking outlet? They're not leaving a voicemail.",
    sub: "Urgent electrical calls go to the first pro who responds. Edison responds in seconds.",
    avgTicket: 350,
    examples: [
      "Outlet sparking in the kitchen — is that urgent?",
      "Half my house lost power",
      "Need a panel upgrade quote",
    ],
  },
  {
    slug: "auto",
    name: "Auto shops",
    noun: "auto shop",
    headline: "You answer most calls. Edison catches the ones you can't.",
    sub: "Lunch rushes, after hours, every bay full — Edison books the overflow instead of losing it to the shop down the road.",
    avgTicket: 260,
    examples: [
      "Brakes grinding — can you fit me in this week?",
      "Check engine light came on",
      "Need an oil change and tire rotation",
    ],
  },
  {
    slug: "salon",
    name: "Salons & spas",
    noun: "salon",
    headline: "You're with a client. The phone's ringing. Edison books them.",
    sub: "You can't stop mid-cut to answer. Edison texts the caller back and fills your chair.",
    avgTicket: 120,
    examples: [
      "Color + cut this Saturday if you have it",
      "Do you have anything today for a trim?",
      "Booking a spa day for two",
    ],
  },
];

export function industryBySlug(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
