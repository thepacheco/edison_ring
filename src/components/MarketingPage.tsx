import { MarketingNav, Footer } from "./MarketingChrome";

/** Wrapper for simple marketing content pages: nav + centered header + footer. */
export function MarketingPage({
  eyebrow,
  title,
  subtitle,
  children,
  wide,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <main style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" }}>
      <MarketingNav />
      <div style={{ maxWidth: wide ? 1000 : 760, margin: "0 auto", padding: "56px 24px 8px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          {eyebrow && (
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "var(--indigo)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                marginBottom: 10,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.1 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: "14px auto 0", fontSize: 17, color: "var(--muted)", maxWidth: 560, lineHeight: 1.55 }}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
      <Footer />
    </main>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: "22px 24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
