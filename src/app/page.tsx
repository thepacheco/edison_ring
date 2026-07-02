import Link from "next/link";
import { MarketingNav, Footer } from "@/components/MarketingChrome";
import { INDUSTRIES } from "@/lib/industries";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main
      style={{
        background:
          "radial-gradient(circle at 10% 20%, rgba(91, 70, 249, 0.04) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(15, 157, 107, 0.03) 0%, transparent 50%), var(--bg)",
        color: "var(--ink)",
        overflow: "hidden",
      }}
    >
      <MarketingNav />

      {/* hero */}
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          gap: 48,
          padding: "80px 24px 72px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 440px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              alignSelf: "flex-start",
              background: "var(--indigo-soft)",
              color: "var(--indigo)",
              borderRadius: 30,
              padding: "7px 15px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: ".02em",
            }}
          >
            FOR HVAC, PLUMBING, ELECTRICAL &amp; AUTO SHOPS
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 58,
              lineHeight: 1.05,
              letterSpacing: "-.040em",
              fontWeight: 800,
            }}
          >
            Stop losing jobs to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--indigo) 0%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              voicemail.
            </span>
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 19.5,
              lineHeight: 1.58,
              color: "var(--muted)",
              maxWidth: 490,
            }}
          >
            A missed call is a missed job — worth{" "}
            <b style={{ color: "var(--ink)" }}>$300 on average</b>. When you can&apos;t pick up,
            Edison instantly auto-texts the caller, books them, and saves the job.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
            <Link
              href="/signup"
              className="lift"
              style={{
                background: "var(--indigo)",
                color: "#fff",
                padding: "16px 30px",
                borderRadius: 12,
                fontSize: 16.5,
                fontWeight: 700,
                boxShadow: "0 12px 26px -10px rgba(91,70,249,.6)",
                display: "inline-block",
              }}
            >
              Start free 14-day trial
            </Link>
            <Link
              href="/services"
              className="lift"
              style={{
                fontSize: 14.5,
                color: "var(--muted)",
                fontWeight: 700,
                background: "var(--card)",
                border: "1px solid var(--line)",
                padding: "15px 26px",
                borderRadius: 12,
              }}
            >
              See how it works →
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 6,
              fontSize: 13,
              color: "var(--faint)",
              fontWeight: 500,
              flexWrap: "wrap",
            }}
          >
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
      <section
        style={{
          background: "#12141a",
          padding: "48px 24px",
          display: "flex",
          justifyContent: "center",
          gap: 64,
          flexWrap: "wrap",
        }}
      >
        {[
          { n: "62%", c: "#fff", t: "of callers never leave a voicemail — they call the next competitor" },
          { n: "$300", c: "#fff", t: "average ticket of a single service job you'd otherwise lose" },
          { n: "<10s", c: "#7c6cff", t: "for Edison to text back before they search elsewhere" },
        ].map((s) => (
          <div key={s.n} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <span className="mono" style={{ fontWeight: 800, fontSize: 40, color: s.c }}>
              {s.n}
            </span>
            <span style={{ fontSize: 13.5, color: "#9aa3b2", textAlign: "center", maxWidth: 190 }}>
              {s.t}
            </span>
          </div>
        ))}
      </section>

      {/* industries */}
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "72px 24px 16px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-.02em",
          }}
        >
          Built for local service industries
        </h2>
        <p
          style={{
            margin: "0 auto 32px",
            fontSize: 15.5,
            color: "var(--muted)",
            maxWidth: 530,
          }}
        >
          Every industry loses calls differently. See the playbook tailored to yours.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {INDUSTRIES.map((i) => (
            <Link
              key={i.slug}
              href={`/for/${i.slug}`}
              className="lift"
              style={{
                border: "1px solid var(--line)",
                background: "var(--card)",
                borderRadius: 12,
                padding: "14px 22px",
                fontSize: 14.5,
                fontWeight: 700,
                color: "var(--ink)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              }}
            >
              {i.name} →
            </Link>
          ))}
        </div>
      </section>

      {/* closing CTA */}
      <section
        style={{
          padding: "72px 24px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          background: "linear-gradient(to bottom, transparent, var(--indigo-soft) 200%)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-.02em",
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          Your next missed call doesn&apos;t have to be a lost job.
        </h2>
        <Link
          href="/signup"
          className="lift"
          style={{
            background: "var(--indigo)",
            color: "#fff",
            padding: "16px 32px",
            borderRadius: 12,
            fontSize: 16.5,
            fontWeight: 700,
            boxShadow: "0 12px 26px -10px rgba(91,70,249,.6)",
            display: "inline-block",
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
  const bubble: React.CSSProperties = { maxWidth: "82%", padding: "11px 14px", fontSize: 13.5, lineHeight: 1.45 };
  return (
    <div
      className="lift"
      style={{
        width: 300,
        borderRadius: 40,
        padding: 10,
        background: "#15181f",
        boxShadow: "0 40px 80px -30px rgba(91,70,249,.4)",
      }}
    >
      <div style={{ borderRadius: 31, overflow: "hidden", background: "#f1f3f7", height: 540, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #e2e8f0",
            padding: "14px 18px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(99,102,241,0.3)",
            }}
          >
            RC
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Rivera Comfort HVAC</div>
            <div style={{ fontSize: 11, color: "#0f9d6b", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <span
                className="pulse-dot"
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              replies in seconds
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              alignSelf: "center",
              fontSize: 11,
              color: "#64748b",
              background: "#fff",
              borderRadius: 20,
              padding: "4px 11px",
              border: "1px solid #e2e8f0",
            }}
          >
            Missed call · 2:41 PM
          </div>

          <div
            className="rise rise-1"
            style={{
              ...bubble,
              alignSelf: "flex-start",
              background: "#fff",
              color: "#1e293b",
              borderRadius: "16px 16px 16px 5px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              border: "1px solid #e2e8f0",
            }}
          >
            Hi, this is Edison with Rivera Comfort 👋 Sorry we missed you! What can we help with?
          </div>

          <div
            className="rise rise-2"
            style={{
              ...bubble,
              alignSelf: "flex-end",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              borderRadius: "16px 16px 5px 16px",
              boxShadow: "0 4px 12px rgba(99,102,241,0.18)",
            }}
          >
            AC stopped cooling upstairs, pretty hot in here
          </div>

          <div
            className="rise rise-3"
            style={{
              ...bubble,
              alignSelf: "flex-start",
              background: "#fff",
              color: "#1e293b",
              borderRadius: "16px 16px 16px 5px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              border: "1px solid #e2e8f0",
            }}
          >
            Got it. We can come <b>today between 4–6 PM</b>. Want me to lock that in?
          </div>

          <div
            className="rise rise-4"
            style={{
              ...bubble,
              alignSelf: "flex-end",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff",
              borderRadius: "16px 16px 5px 16px",
              boxShadow: "0 4px 12px rgba(99,102,241,0.18)",
            }}
          >
            Yes please!
          </div>

          <div
            className="rise rise-5"
            style={{
              ...bubble,
              maxWidth: "85%",
              alignSelf: "flex-start",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 14,
              color: "#065f46",
              fontWeight: 600,
              boxShadow: "0 4px 10px rgba(16,185,129,0.08)",
            }}
          >
            ✓ Booked for today, 4–6 PM. Added to your calendar.
          </div>
        </div>
      </div>
    </div>
  );
}
