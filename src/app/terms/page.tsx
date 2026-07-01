import { MarketingPage, Card } from "@/components/MarketingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms of Service · Edison",
};

export default function TermsPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The agreement between Edison and the businesses that use it. Plain-language summary below — not a substitute for your own legal review."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <p style={{ margin: 0, fontSize: 13, color: "var(--faint)" }}>
            Last updated: {new Date().getFullYear()}. This is a template. Replace
            with terms reviewed by your attorney before selling to customers.
          </p>
        </Card>

        <Section title="1. The service">
          Edison is a missed-call rescue tool. When a business forwards its
          unanswered calls to an Edison number, Edison sends an automated text to
          the caller, holds an AI-assisted conversation, and helps book the job.
          Edison is a software service, not a telecommunications carrier; SMS and
          voice are delivered through third-party providers (e.g. Twilio).
        </Section>

        <Section title="2. Accounts &amp; eligibility">
          You must provide accurate business information and are responsible for
          activity under your account and for keeping your credentials secure. You
          must be authorized to enable call forwarding on the business line you
          connect.
        </Section>

        <Section title="3. Messaging consent &amp; compliance">
          You are responsible for ensuring you have a lawful basis to text the
          people who call you, and for complying with the TCPA, CTIA guidelines,
          and carrier A2P 10DLC requirements. Edison honors opt-outs automatically:
          a caller who replies STOP is unsubscribed and receives no further
          automated texts; HELP returns help information; START re-subscribes.
          Message and data rates may apply to recipients.
        </Section>

        <Section title="4. Billing">
          Paid plans are billed monthly through Stripe. Plans include a set number
          of conversations per month; usage beyond the included amount may incur
          overage charges as shown on the pricing page. A conversation hard cap
          protects you from runaway usage. You can cancel anytime from the billing
          portal; access continues through the end of the paid period.
        </Section>

        <Section title="5. Acceptable use">
          Don&apos;t use Edison for unlawful, deceptive, or abusive messaging, to
          contact people who haven&apos;t contacted you, or in any way that
          violates carrier or provider rules. We may suspend accounts that put our
          messaging deliverability or other customers at risk.
        </Section>

        <Section title="6. AI-generated content">
          Edison uses AI to draft replies and suggest bookings. It can make
          mistakes. You are responsible for reviewing bookings and for the
          commitments made to your customers. Edison is provided &quot;as is&quot;
          without warranties, to the extent permitted by law.
        </Section>

        <Section title="7. Liability &amp; changes">
          To the maximum extent permitted by law, Edison&apos;s liability is
          limited to the fees you paid in the prior three months. We may update
          these terms; material changes will be posted here with a new date.
        </Section>

        <Section title="8. Contact">
          Questions about these terms? Reach us through the{" "}
          <a href="/contact" style={{ color: "var(--indigo)" }}>contact page</a>.
        </Section>
      </div>
    </MarketingPage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 14.5, color: "var(--muted)", lineHeight: 1.65 }}>
        {children}
      </p>
    </Card>
  );
}
