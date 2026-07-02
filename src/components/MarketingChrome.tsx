import Link from "next/link";
import { INDUSTRIES } from "@/lib/industries";

const NAV = [
  { href: "/services", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNav() {
  return (
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
        flexWrap: "wrap",
        gap: 10,
        background: "var(--bg)",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div className="mono" style={logo}>
          E
        </div>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-.02em" }}>
          Edison
        </span>
      </Link>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          fontSize: 14,
          color: "var(--muted)",
          fontWeight: 500,
          flexWrap: "wrap",
        }}
      >
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}>
            {n.label}
          </Link>
        ))}
        <Link href="/login">Log in</Link>
        <Link
          href="/signup"
          style={{
            background: "var(--ink)",
            color: "var(--ink-invert)",
            padding: "9px 16px",
            borderRadius: 9,
            fontWeight: 600,
          }}
        >
          Start free trial
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line-soft)",
        background: "var(--card)",
        marginTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "40px 24px",
          display: "flex",
          gap: 40,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ maxWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <div className="mono" style={logo}>
              E
            </div>
            <span style={{ fontWeight: 800, fontSize: 18 }}>Edison</span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--faint)", lineHeight: 1.6, margin: 0 }}>
            Missed-call rescue for local service businesses. We text back the
            callers you miss, book the job, and put it on your calendar.
          </p>
        </div>
        <FooterCol title="Product" links={[
          { href: "/services", label: "How it works" },
          { href: "/pricing", label: "Pricing" },
          { href: "/signup", label: "Start free trial" },
          { href: "/login", label: "Log in" },
        ]} />
        <FooterCol title="Industries" links={INDUSTRIES.map((i) => ({
          href: `/for/${i.slug}`,
          label: i.name,
        }))} />
        <FooterCol title="Company" links={[
          { href: "/about", label: "About us" },
          { href: "/contact", label: "Contact" },
          { href: "/terms", label: "Terms" },
          { href: "/privacy", label: "Privacy" },
          { href: "/sms-policy", label: "SMS Policy" },
        ]} />
      </div>
      <div
        style={{
          borderTop: "1px solid var(--line-soft)",
          padding: "16px 24px",
          textAlign: "center",
          fontSize: 12.5,
          color: "var(--faint)",
        }}
      >
        © {new Date().getFullYear()} Edison. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--faint)",
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        {title}
      </div>
      {links.map((l) => (
        <Link key={l.href + l.label} href={l.href} style={{ fontSize: 13.5, color: "var(--muted)" }}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

const logo: React.CSSProperties = {
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
};
