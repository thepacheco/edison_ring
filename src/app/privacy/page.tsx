import { MarketingPage, Card } from "@/components/MarketingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy · Edison",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="What Edison collects, why, and the choices you have. Plain-language summary — not a substitute for your own legal review."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card>
          <p style={{ margin: 0, fontSize: 13, color: "var(--faint)" }}>
            Last updated: {new Date().getFullYear()}. This is a template. Replace
            with a policy reviewed by your attorney before selling to customers.
          </p>
        </Card>

        <Section title="What we collect">
          <b>Business accounts:</b> business name, owner email, phone number,
          hours, routing preferences, and billing details (payment cards are held
          by Stripe, not by us). <b>Conversations:</b> the phone numbers of people
          who call/text your Edison number, the message contents, and derived
          fields like intent and booking status. <b>Usage:</b> conversation counts
          and AI token usage for billing and reporting.
        </Section>

        <Section title="How we use it">
          To operate the service: send and receive texts, generate replies, book
          jobs on your calendar, bill your subscription, produce your analytics and
          reports, and keep the platform secure. We do not sell personal
          information.
        </Section>

        <Section title="Service providers">
          We share data with the processors needed to run Edison: Twilio (SMS/voice
          delivery), Anthropic (AI reply generation), Stripe (payments), Resend
          (transactional email), and our hosting/database providers. Each processes
          data only to provide their part of the service.
        </Section>

        <Section title="Text-message data">
          Numbers and messages are processed to deliver the conversation and honor
          opt-outs. Recipients can reply STOP at any time to stop automated texts.
          Messaging consent and opt-out data is <b>not</b> shared with third
          parties for their own marketing.
        </Section>

        <Section title="Retention">
          We keep conversation and account data for as long as your account is
          active and as needed for billing, legal, and reporting purposes. You can
          request deletion of your account and associated data through the contact
          page; some records may be retained where required by law.
        </Section>

        <Section title="Your choices &amp; rights">
          You can update your business and account details in Settings, cancel
          billing from the billing portal, and request access to or deletion of
          your data. Depending on where you live (e.g. GDPR/CCPA), you may have
          additional rights; contact us to exercise them.
        </Section>

        <Section title="Security">
          Passwords are stored hashed, sessions are signed, and admin and
          owner-only actions are access-controlled. No system is perfectly secure,
          but we work to protect your data and to limit access to what&apos;s
          needed to run the service.
        </Section>

        <Section title="Contact">
          Privacy questions or requests? Reach us through the{" "}
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
