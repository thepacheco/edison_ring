import { MarketingPage, Card } from "@/components/MarketingPage";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="About us"
      title="We built Edison because missed calls cost real money."
      subtitle="For a local service business, a missed call isn't a missed call — it's a $300 job that just called your competitor instead."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800 }}>The problem</h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>
            62% of callers never leave a voicemail. When a shop can&apos;t pick up —
            because they&apos;re on a roof, under a sink, or already on another call —
            that customer just dials the next name on the list. Owners lose thousands
            a month and never even know it happened.
          </p>
        </Card>
        <Card>
          <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800 }}>What we do</h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>
            Edison catches the calls you miss and texts the caller back in seconds —
            with a real conversation, not a robotic auto-reply. It figures out what
            they need, books them on your calendar, and routes the job to the right
            person. You see everything from one dashboard, and a running tracker shows
            exactly how much money Edison put back in your pocket.
          </p>
        </Card>
        <Card>
          <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800 }}>Who it&apos;s for</h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>
            Home-service and local businesses: HVAC, plumbing, electrical, auto shops,
            salons, and more — from a single owner-operator to multi-location fleets.
            No app to install, works with your current number, set up in about five
            minutes.
          </p>
        </Card>
      </div>
    </MarketingPage>
  );
}
