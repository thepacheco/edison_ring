import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <main style={{ background: "#fff", color: "var(--ink)" }}>
      {/* nav */}
      <header
        style={{
          height: 66,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid var(--line-soft)",
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            className="mono"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "var(--indigo)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            E
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-.02em" }}>
            Edison
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontSize: 14,
            color: "var(--muted)",
            fontWeight: 500,
          }}
        >
          <Link href="/login">Log in</Link>
          <Link
            href="/signup"
            style={{
              background: "var(--ink)",
              color: "#fff",
              padding: "9px 16px",
              borderRadius: 9,
              fontWeight: 600,
            }}
          >
            Start free trial
          </Link>
        </div>
      </header>

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
        <div
          style={{
            flex: "1 1 440px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              alignSelf: "flex-start",
              background: "#f2f1fe",
              color: "#4032c9",
              borderRadius: 30,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            For HVAC, plumbing, electrical &amp; auto shops
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 52,
              lineHeight: 1.04,
              letterSpacing: "-.035em",
              fontWeight: 800,
            }}
          >
            Stop losing jobs to voicemail.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 19,
              lineHeight: 1.55,
              color: "var(--muted)",
              maxWidth: 480,
            }}
          >
            A missed call is a missed job — worth{" "}
            <b style={{ color: "var(--ink)" }}>$300 on average</b>. When you
            can&apos;t pick up, Edison instantly texts the caller, books them,
            and puts it on your calendar.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 4,
              flexWrap: "wrap",
            }}
          >
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
            <span style={{ fontSize: 13.5, color: "var(--faint)" }}>
              No app to install · 5-min setup
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 10,
              fontSize: 13,
              color: "var(--faint)",
              fontWeight: 500,
              flexWrap: "wrap",
            }}
          >
            <span>✓ Works with your current number</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>

        {/* phone demo */}
        <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center" }}>
          <PhoneDemo />
        </div>
      </section>

      {/* math strip */}
      <section
        style={{
          background: "var(--ink)",
          padding: "40px 24px",
          display: "flex",
          justifyContent: "center",
          gap: 56,
          flexWrap: "wrap",
        }}
      >
        {[
          { n: "62%", c: "#fff", t: "of callers never leave a voicemail — they call the next shop" },
          { n: "$300", c: "#fff", t: "average value of a single service job you'd otherwise lose" },
          { n: "<10s", c: "#7c6cff", t: "for Edison to text back before they move on" },
        ].map((s) => (
          <div
            key={s.n}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              alignItems: "center",
            }}
          >
            <span
              className="mono"
              style={{ fontWeight: 700, fontSize: 36, color: s.c }}
            >
              {s.n}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "#9aa3b2",
                textAlign: "center",
                maxWidth: 170,
              }}
            >
              {s.t}
            </span>
          </div>
        ))}
      </section>

      {/* closing CTA */}
      <section
        style={{
          padding: "56px 24px 72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-.02em",
            textAlign: "center",
          }}
        >
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
    </main>
  );
}

function PhoneDemo() {
  const bubbleBase: React.CSSProperties = {
    maxWidth: "80%",
    padding: "10px 13px",
    fontSize: 13.5,
    lineHeight: 1.45,
  };
  return (
    <div
      style={{
        width: 300,
        borderRadius: 40,
        padding: 10,
        background: "var(--ink)",
        boxShadow: "0 40px 80px -30px rgba(20,24,33,.5)",
      }}
    >
      <div
        style={{
          borderRadius: 31,
          overflow: "hidden",
          background: "#eef0f4",
          height: 540,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid var(--line-soft)",
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
              background: "var(--indigo-soft)",
              color: "var(--indigo)",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            RC
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Rivera Comfort HVAC</div>
            <div style={{ fontSize: 11, color: "var(--green-bright)", fontWeight: 600 }}>
              ● replies in seconds
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
              color: "var(--faint)",
              background: "#fff",
              borderRadius: 20,
              padding: "4px 11px",
            }}
          >
            Missed call · 2:41 PM
          </div>
          <div
            style={{
              ...bubbleBase,
              alignSelf: "flex-start",
              background: "#fff",
              borderRadius: "16px 16px 16px 5px",
              boxShadow: "0 1px 3px rgba(20,24,33,.06)",
            }}
          >
            Hi, this is Edison with Rivera Comfort 👋 Sorry we missed you! What
            can we help with?
          </div>
          <div
            style={{
              ...bubbleBase,
              alignSelf: "flex-end",
              background: "var(--indigo)",
              color: "#fff",
              borderRadius: "16px 16px 5px 16px",
            }}
          >
            AC stopped cooling upstairs, pretty hot in here
          </div>
          <div
            style={{
              ...bubbleBase,
              alignSelf: "flex-start",
              background: "#fff",
              borderRadius: "16px 16px 16px 5px",
              boxShadow: "0 1px 3px rgba(20,24,33,.06)",
            }}
          >
            Got it. We can come <b>today between 4–6 PM</b>. Want me to lock that
            in?
          </div>
          <div
            style={{
              ...bubbleBase,
              alignSelf: "flex-end",
              background: "var(--indigo)",
              color: "#fff",
              borderRadius: "16px 16px 5px 16px",
            }}
          >
            Yes please!
          </div>
          <div
            style={{
              ...bubbleBase,
              maxWidth: "85%",
              alignSelf: "flex-start",
              background: "var(--green-soft)",
              border: "1px solid #c4e9d7",
              borderRadius: 14,
              color: "var(--green)",
              fontWeight: 600,
            }}
          >
            ✓ Booked for today, 4–6 PM. Added to your calendar.
          </div>
        </div>
      </div>
    </div>
  );
}
