import { MarketingPage, Card } from "@/components/MarketingPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SMS Program & Opt-In Policy · Edison",
};

/**
 * Public SMS program description — written to satisfy carrier compliance
 * reviews (Toll-Free Verification / A2P): what the program is, how consent is
 * collected, frequency, opt-out, help, and fee disclosures.
 */
export default function SmsPolicyPage() {
  return (
    <MarketingPage
      eyebrow="Compliance"
      title="SMS Program & Opt-In Policy"
      subtitle="How Edison's text messages work, how consent is collected, and how to stop them at any time."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Section title="Program description">
          Edison provides missed-call text-back for local service businesses
          (HVAC, plumbing, electrical, auto repair, and similar). When a consumer
          calls a participating business and the call is not answered, the
          business's phone line forwards the call to its dedicated Edison number,
          and Edison sends the caller a text message on the business's behalf so
          the conversation can continue and an appointment can be scheduled.
        </Section>

        <Section title="How consent (opt-in) is collected">
          Messaging is <b>consumer-initiated</b>: a text conversation only ever
          begins after the consumer personally places a phone call to the
          business, or texts the business's number first. Edison never sends
          marketing or cold-outreach messages, never messages purchased lists,
          and never contacts anyone who has not first called or texted the
          business. By calling the business, the consumer requests contact from
          that business; Edison's reply is the business's response to that
          request. Each participating business also agrees at signup that it will
          only use Edison to respond to its own inbound callers.
        </Section>

        <Section title="Message frequency">
          Message frequency varies by conversation — typically 1 to 6 messages
          per missed call, only in direct response to the consumer's inquiry
          (confirming the service need and scheduling an appointment). Message
          and data rates may apply.
        </Section>

        <Section title="Opt-out">
          Reply <b>STOP</b> to any message to immediately unsubscribe. A single
          confirmation of the opt-out is sent, and no further automated messages
          will be delivered to that number for that business. Reply{" "}
          <b>START</b> to re-subscribe.
        </Section>

        <Section title="Help">
          Reply <b>HELP</b> to any message for assistance, or reach us via the{" "}
          <a href="/contact" style={{ color: "var(--indigo)" }}>contact page</a>.
        </Section>

        <Section title="Privacy">
          Phone numbers and message content are used only to deliver the
          conversation and honor opt-outs. They are never sold or shared with
          third parties for marketing. See our{" "}
          <a href="/privacy" style={{ color: "var(--indigo)" }}>Privacy Policy</a>{" "}
          and <a href="/terms" style={{ color: "var(--indigo)" }}>Terms of Service</a>.
        </Section>

        <Section title="Sample messages">
          <span className="mono" style={{ display: "block", fontSize: 13, background: "var(--line-soft)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
            &quot;Hi, this is Edison with Rivera Comfort HVAC 👋 Sorry we missed
            your call! What can we help with? Reply STOP to opt out.&quot;
          </span>
          <span className="mono" style={{ display: "block", fontSize: 13, background: "var(--line-soft)", borderRadius: 8, padding: "10px 12px" }}>
            &quot;We can come out tomorrow at 8 AM, 10 AM, or 1 PM — which works
            best for you?&quot;
          </span>
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
