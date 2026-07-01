import Link from "next/link";
import { MarketingPage, Card } from "@/components/MarketingPage";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "1", t: "A call goes unanswered", d: "Your line forwards missed calls to your Edison number. No new hardware, no app — it works with the number you already have." },
  { n: "2", t: "Edison texts them back in seconds", d: "The caller gets a friendly text — not a robot. Edison asks what they need and understands the answer." },
  { n: "3", t: "It books the job", d: "Edison checks your calendar, offers real open times, and locks in the appointment. Urgent or unclear cases get flagged for a callback." },
  { n: "4", t: "You get the money and the credit", d: "The lead lands in your dashboard, routed to the right worker, and your 'paid for itself' tracker ticks up." },
];

const FEATURES = [
  ["Real conversations", "Powered by AI, tuned to sound like your shop — never robotic."],
  ["Calendar booking", "Built-in calendar books jobs into your real open slots — no account to connect (Google sync optional)."],
  ["Worker routing", "Round-robin, keyword, or straight to the owner — plus call-out backup."],
  ["Multi-location", "One dashboard across every location, with a per-location breakdown."],
  ["Paid-for-itself tracker", "See recovered revenue vs. your subscription, live."],
  ["Weekly value report", "A screenshot-friendly summary of what Edison captured."],
];

export default function ServicesPage() {
  return (
    <MarketingPage
      eyebrow="How it works"
      title="From missed call to booked job — automatically."
      subtitle="Edison sits quietly behind your existing phone number and turns the calls you can't answer into revenue."
      wide
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
        {STEPS.map((s) => (
          <Card key={s.n}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                className="mono"
                style={{
                  width: 38,
                  height: 38,
                  flex: "none",
                  borderRadius: 10,
                  background: "var(--indigo-soft)",
                  color: "var(--indigo)",
                  fontWeight: 700,
                  fontSize: 17,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {s.n}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{s.t}</div>
                <div style={{ fontSize: 14.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.55 }}>{s.d}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 20px" }}>
        Everything included
      </h2>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {FEATURES.map(([t, d]) => (
          <div key={t} style={{ flex: "1 1 280px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t}</div>
            <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <Link href="/signup" style={{ background: "var(--indigo)", color: "#fff", padding: "15px 28px", borderRadius: 12, fontSize: 16, fontWeight: 700 }}>
          Start free 14-day trial
        </Link>
      </div>
    </MarketingPage>
  );
}
