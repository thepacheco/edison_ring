import Link from "next/link";
import { MarketingPage } from "@/components/MarketingPage";
import { PLANS, OVERAGE_RATE, perLocationPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const FAQ = [
  ["Is there really a free trial?", "Yes — 14 days free. A card is required to start, but you won't be charged until day 15, and you can cancel anytime."],
  ["What counts as a conversation?", "One rescued caller = one conversation, no matter how many texts it takes. You only use one when Edison actually engages a missed caller."],
  ["What happens if I go over my plan?", `Extra conversations bill at $${OVERAGE_RATE.toFixed(2)} each. We hard-cap at 1,000/mo and flag your account so you're never surprised by a huge bill.`],
  ["Do I need new hardware or an app?", "No. Edison works with your current phone number — you just set up call forwarding once during setup."],
];

export default function PricingPage() {
  const plans = Object.values(PLANS);
  return (
    <MarketingPage
      eyebrow="Pricing"
      title="Simple pricing that pays for itself."
      subtitle="One booked job usually covers a whole month. Every plan includes the full product — pick based on how many calls you miss."
      wide
    >
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {plans.map((p) => {
          const featured = p.id === "standard";
          return (
            <div
              key={p.id}
              style={{
                flex: "1 1 260px",
                maxWidth: 320,
                background: "var(--card)",
                border: featured ? "2px solid var(--indigo)" : "1px solid var(--line)",
                borderRadius: 18,
                padding: "26px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: featured ? "0 18px 44px -28px rgba(91,70,249,.4)" : "none",
              }}
            >
              {featured && (
                <div className="mono" style={{ alignSelf: "flex-start", fontSize: 10.5, fontWeight: 700, color: "var(--indigo)", background: "var(--indigo-soft)", borderRadius: 20, padding: "3px 10px" }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: 20 }}>{p.name}</div>
              <div>
                <span className="mono" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-.02em" }}>${p.monthly}</span>
                <span style={{ color: "var(--faint)", fontSize: 15 }}>/mo</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>
                {p.includedConversations} conversations/mo included
              </div>
              <ul style={{ margin: "4px 0", paddingLeft: 18, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.8 }}>
                <li>AI text-back &amp; booking</li>
                <li>Calendar + worker routing</li>
                <li>Paid-for-itself tracker</li>
                <li>Weekly value report</li>
                {p.id === "founding" && <li><b style={{ color: "var(--ink)" }}>Locked for life</b> (first 90 days)</li>}
              </ul>
              <Link
                href="/signup"
                style={{
                  marginTop: "auto",
                  textAlign: "center",
                  background: featured ? "var(--indigo)" : "var(--ink)",
                  color: "#fff",
                  padding: "12px",
                  borderRadius: 11,
                  fontWeight: 700,
                  fontSize: 14.5,
                }}
              >
                Start free trial
              </Link>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: "var(--muted)" }}>
        Multiple locations? Volume pricing: <b className="mono">${perLocationPrice(1)}</b> (1) ·{" "}
        <b className="mono">${perLocationPrice(3)}</b>/ea (2–4) ·{" "}
        <b className="mono">${perLocationPrice(6)}</b>/ea (5–9) · custom for 10+.
      </div>

      <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "44px 0 20px" }}>
        Questions
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640, margin: "0 auto" }}>
        {FAQ.map(([q, a]) => (
          <div key={q} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{q}</div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 5, lineHeight: 1.55 }}>{a}</div>
          </div>
        ))}
      </div>
    </MarketingPage>
  );
}
