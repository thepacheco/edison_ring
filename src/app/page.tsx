import Link from "next/link";
import { MarketingNav, Footer } from "@/components/MarketingChrome";
import { INDUSTRIES } from "@/lib/industries";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <MarketingNav />

      {/* hero */}
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          gap: 48,
          padding: "64px 24px 56px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 440px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              alignSelf: "flex-start",
              background: "var(--indigo-soft)",
              color: "var(--indigo)",
              borderRadius: 30,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            For HVAC, plumbing, electrical &amp; auto shops
          </div>
          <h1 style={{ margin: 0, fontSize: 52, lineHeight: 1.04, letterSpacing: "-.035em", fontWeight: 800 }}>
            Stop losing jobs to voicemail.
          </h1>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: "var(--muted)", maxWidth: 480 }}>
            A missed call is a missed job — worth{" "}
            <b style={{ color: "var(--ink)" }}>$300 on average</b>. When you can&apos;t pick up,
            Edison instantly texts the caller, books them, and puts it on your calendar.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4, flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                background: "var(--indigo)",
                color: "#fff",
                padding: "15px 26px",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                boxShadow: "0 12px 26px -10px rgba(91,70,249,.6)",
              }}
            >
              Start free 14-day trial
            </Link>
            <Link href="/services" style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>
              See how it works →
            </Link>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 6, fontSize: 13, color: "var(--faint)", fontWeight: 500, flexWrap: "wrap" }}>
            <span>✓ Works with your current number</span>
            <span>✓ No app to install</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
        <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center" }}>
          <PhoneDemo />
        </div>
      </section>

      {/* math strip */}
      <section style={{ background: "#15181f", padding: "40px 24px", display: "flex", justifyContent: "center", gap: 56, flexWrap: "wrap" }}>
        {[
          { n: "62%", c: "#fff", t: "of callers never leave a voicemail — they call the next shop" },
          { n: "$300", c: "#fff", t: "average value of a single service job you'd otherwise lose" },
          { n: "<10s", c: "#7c6cff", t: "for Edison to text back before they move on" },
        ].map((s) => (
          <div key={s.n} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
            <span className="mono" style={{ fontWeight: 700, fontSize: 36, color: s.c }}>{s.n}</span>
            <span style={{ fontSize: 13, color: "#9aa3b2", textAlign: "center", maxWidth: 170 }}>{s.t}</span>
          </div>
        ))}
      </section>

      {/* industries */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 24px 8px", textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
          Built for the trades
        </h2>
        <p style={{ margin: "0 auto 24px", fontSize: 15, color: "var(--muted)", maxWidth: 520 }}>
          Every industry loses calls differently. See the pitch tailored to yours.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {INDUSTRIES.map((i) => (
            <Link
              key={i.slug}
              href={`/for/${i.slug}`}
              style={{
                border: "1px solid var(--line)",
                background: "var(--card)",
                borderRadius: 12,
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ink)",
              }}
            >
              {i.name} →
            </Link>
          ))}
        </div>
      </section>

      {/* closing CTA */}
      <section style={{ padding: "56px 24px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", textAlign: "center" }}>
          Your next missed call doesn&apos;t have to be a lost job.
        </h2>
        <Link
          href="/signup"
          style={{
            background: "var(--indigo)",
            color: "#fff",
            padding: "15px 28px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            boxShadow: "0 12px 26px -10px rgba(91,70,249,.6)",
          }}
        >
          Start free 14-day trial
        </Link>
      </section>

      <Footer />
    </main>
  );
}

function PhoneDemo() {
  const bubble: React.CSSProperties = { maxWidth: "80%", padding: "10px 13px", fontSize: 13.5, lineHeight: 1.45 };
  return (
    <div style={{ width: 300, borderRadius: 40, padding: 10, background: "#15181f", boxShadow: "0 40px 80px -30px rgba(20,24,33,.5)" }}>
      <div style={{ borderRadius: 31, overflow: "hidden", background: "#eef0f4", height: 540, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #eceef3", padding: "14px 18px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eceaff", color: "#5b46f9", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>RC</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#15181f" }}>Rivera Comfort HVAC</div>
            <div style={{ fontSize: 11, color: "#0f9d6b", fontWeight: 600 }}>● replies in seconds</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
          <div style={{ alignSelf: "center", fontSize: 11, color: "#8a93a3", background: "#fff", borderRadius: 20, padding: "4px 11px" }}>Missed call · 2:41 PM</div>
          <div style={{ ...bubble, alignSelf: "flex-start", background: "#fff", color: "#15181f", borderRadius: "16px 16px 16px 5px", boxShadow: "0 1px 3px rgba(20,24,33,.06)" }}>
            Hi, this is Edison with Rivera Comfort 👋 Sorry we missed you! What can we help with?
          </div>
          <div style={{ ...bubble, alignSelf: "flex-end", background: "#5b46f9", color: "#fff", borderRadius: "16px 16px 5px 16px" }}>AC stopped cooling upstairs, pretty hot in here</div>
          <div style={{ ...bubble, alignSelf: "flex-start", background: "#fff", color: "#15181f", borderRadius: "16px 16px 16px 5px", boxShadow: "0 1px 3px rgba(20,24,33,.06)" }}>Got it. We can come <b>today between 4–6 PM</b>. Want me to lock that in?</div>
          <div style={{ ...bubble, alignSelf: "flex-end", background: "#5b46f9", color: "#fff", borderRadius: "16px 16px 5px 16px" }}>Yes please!</div>
          <div style={{ ...bubble, maxWidth: "85%", alignSelf: "flex-start", background: "#e6f6ef", border: "1px solid #c4e9d7", borderRadius: 14, color: "#0a7d54", fontWeight: 600 }}>✓ Booked for today, 4–6 PM. Added to your calendar.</div>
        </div>
      </div>
    </div>
  );
}
