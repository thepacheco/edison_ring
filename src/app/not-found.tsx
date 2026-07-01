import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div
          className="mono"
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: "var(--indigo)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          E
        </div>
        <div className="mono" style={{ fontSize: 56, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1 }}>
          404
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "12px 0 8px" }}>
          This page took a wrong turn.
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 24px", lineHeight: 1.55 }}>
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ background: "var(--indigo)", color: "#fff", padding: "12px 22px", borderRadius: 11, fontWeight: 700, fontSize: 14.5 }}>
            Go home
          </Link>
          <Link href="/dashboard" style={{ border: "1px solid var(--line)", background: "var(--card)", padding: "12px 22px", borderRadius: 11, fontWeight: 600, fontSize: 14.5 }}>
            My dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
