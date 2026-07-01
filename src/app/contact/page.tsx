import { MarketingPage, Card } from "@/components/MarketingPage";
import { contactAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <MarketingPage
      eyebrow="Contact"
      title="Talk to a human."
      subtitle="Questions about setup, pricing, or whether Edison fits your shop? We'll get back to you fast."
    >
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: "1 1 260px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Reach us</div>
          <ContactRow label="Email" value="hello@edison.io" href="mailto:hello@edison.io" />
          <ContactRow label="Sales" value="sales@edison.io" href="mailto:sales@edison.io" />
          <ContactRow label="Support" value="help@edison.io" href="mailto:help@edison.io" />
          <ContactRow label="Phone" value="(877) 526-4170" href="tel:+18775264170" />
          <p style={{ fontSize: 13, color: "var(--faint)", marginTop: 12, lineHeight: 1.5 }}>
            Mon–Fri, 8am–6pm PT. We usually reply within a few hours.
          </p>
        </Card>

        <Card style={{ flex: "1 1 320px" }}>
          {sent === "ok" && (
            <div style={{ background: "var(--green-soft)", border: "1px solid #c4e9d7", color: "var(--green)", borderRadius: 10, padding: "10px 13px", fontSize: 13, marginBottom: 14 }}>
              ✓ Thanks — we got your message and will be in touch.
            </div>
          )}
          {sent === "error" && (
            <div style={{ background: "#fdecec", border: "1px solid #f3c4c4", color: "#b23b3b", borderRadius: 10, padding: "10px 13px", fontSize: 13, marginBottom: 14 }}>
              Please fill in every field.
            </div>
          )}
          <form action={contactAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input name="name" label="Your name" placeholder="Jordan Rivera" />
            <Input name="email" type="email" label="Email" placeholder="you@business.com" />
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
              Message
              <textarea
                name="message"
                rows={4}
                placeholder="Tell us about your business…"
                style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)", resize: "vertical" }}
              />
            </label>
            <button type="submit" style={{ background: "var(--indigo)", color: "#fff", border: "none", borderRadius: 11, padding: "12px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Send message
            </button>
          </form>
        </Card>
      </div>
    </MarketingPage>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line-soft)", fontSize: 14 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <a href={href} style={{ fontWeight: 600, color: "var(--indigo)" }}>{value}</a>
    </div>
  );
}

function Input({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
      {label}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)" }}
      />
    </label>
  );
}
