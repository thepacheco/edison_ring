import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingNav, Footer } from "@/components/MarketingChrome";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ industry: i.slug }));
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const ind = industryBySlug(industry);
  if (!ind) notFound();

  return (
    <main style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" }}>
      <MarketingNav />

      <section style={{ maxWidth: 1120, margin: "0 auto", display: "flex", gap: 48, padding: "56px 24px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 440px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ alignSelf: "flex-start", background: "var(--indigo-soft)", color: "var(--indigo)", borderRadius: 30, padding: "7px 14px", fontSize: 13, fontWeight: 600 }}>
            Edison for {ind!.name}
          </div>
          <h1 style={{ margin: 0, fontSize: 46, lineHeight: 1.06, letterSpacing: "-.03em", fontWeight: 800 }}>
            {ind!.headline}
          </h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "var(--muted)", maxWidth: 480 }}>
            {ind!.sub}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Link href="/signup" style={{ background: "var(--indigo)", color: "#fff", padding: "15px 26px", borderRadius: 12, fontSize: 16, fontWeight: 700 }}>
              Start free 14-day trial
            </Link>
            <span style={{ fontSize: 13.5, color: "var(--faint)" }}>
              Avg {ind!.name.toLowerCase()} ticket ≈ <b className="mono" style={{ color: "var(--ink)" }}>${ind!.avgTicket}</b>
            </span>
          </div>
        </div>

        {/* sample thread for this industry */}
        <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 300, borderRadius: 20, background: "var(--card)", border: "1px solid var(--line)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: "var(--faint)", textAlign: "center" }}>Missed call · texted back in seconds</div>
            <Bubble side="in">{ind!.examples[0]}</Bubble>
            <Bubble side="out">Sorry we missed you! We can take a look — is this your home or business, and what&apos;s the address?</Bubble>
            <Bubble side="in">Home — can someone come today?</Bubble>
            <Bubble side="out">We&apos;ve got <b>today 4–6 PM</b> open. Want me to lock it in?</Bubble>
            <div style={{ background: "var(--green-soft)", border: "1px solid #c4e9d7", color: "var(--green)", borderRadius: 12, padding: "9px 12px", fontSize: 13, fontWeight: 600 }}>
              ✓ Booked · added to your calendar
            </div>
          </div>
        </div>
      </section>

      {/* other industries */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "8px 24px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--faint)", marginBottom: 12 }}>Not your trade?</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {INDUSTRIES.filter((i) => i.slug !== ind!.slug).map((i) => (
            <Link key={i.slug} href={`/for/${i.slug}`} style={{ border: "1px solid var(--line)", background: "var(--card)", borderRadius: 10, padding: "9px 15px", fontSize: 13.5, fontWeight: 600 }}>
              {i.name} →
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Bubble({ side, children }: { side: "in" | "out"; children: React.ReactNode }) {
  const out = side === "out";
  return (
    <div
      style={{
        alignSelf: out ? "flex-start" : "flex-end",
        maxWidth: "85%",
        background: out ? "var(--card-2)" : "var(--indigo)",
        color: out ? "var(--ink)" : "#fff",
        border: out ? "1px solid var(--line)" : "none",
        borderRadius: out ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
        padding: "9px 12px",
        fontSize: 13.5,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}
