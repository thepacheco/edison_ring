import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { markContactedAction, markStatusAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const c = await prisma.conversation.findFirst({
    where: { id, businessId: business!.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      assignedWorker: true,
    },
  });
  if (!c) notFound();

  const booked = c!.status === "booked";
  const name = c!.customerName || c!.customerPhone;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNav active="/conversations" businessName={business!.name} />
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 20px 64px" }}>
        <Link href="/conversations" style={{ fontSize: 13, color: "var(--muted)" }}>
          ‹ All conversations
        </Link>

        {/* summary header */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: "18px 20px",
            margin: "14px 0 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--indigo-soft)",
                color: "var(--indigo)",
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initials(name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
              <div className="mono" style={{ fontSize: 12.5, color: "var(--faint)" }}>
                {c!.customerPhone}
              </div>
            </div>
          </div>
          <div
            style={{
              background: booked ? "var(--green-soft)" : "#fafbfc",
              border: `1px solid ${booked ? "#c4e9d7" : "var(--line)"}`,
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                  color: booked ? "var(--green)" : "var(--muted)",
                }}
              >
                {statusLabel(c!.status)}
                {c!.estimatedValue != null ? ` · $${Number(c!.estimatedValue).toFixed(0)}` : ""}
              </span>
              <span style={{ fontSize: 11, color: "var(--faint)" }}>via Edison AI</span>
            </div>
            <Row label="Needs" value={c!.summary || "Gathering details"} />
            {c!.bookedSlot && (
              <Row label="Scheduled" value={formatSlot(c!.bookedSlot)} />
            )}
            {c!.assignedWorker && (
              <Row label="Assigned" value={c!.assignedWorker.name} />
            )}
          </div>
        </div>

        {/* read-only transcript */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {c!.messages.map((m) => {
            const inbound = m.direction === "inbound";
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: inbound ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                  background: inbound ? "var(--indigo)" : "var(--card)",
                  color: inbound ? "#fff" : "var(--ink)",
                  border: inbound ? "none" : "1px solid var(--line)",
                  borderRadius: inbound ? "16px 16px 5px 16px" : "16px 16px 16px 5px",
                  padding: "10px 13px",
                  fontSize: 14,
                  lineHeight: 1.45,
                  boxShadow: inbound ? "none" : "0 1px 3px rgba(20,24,33,.05)",
                }}
              >
                {m.body}
              </div>
            );
          })}
          {c!.messages.length === 0 && (
            <div style={{ color: "var(--faint)", fontSize: 14 }}>No messages yet.</div>
          )}
        </div>

        {/* owner intervention routes through their own phone — not a dashboard chat */}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <a
            href={`tel:${c!.customerPhone}`}
            style={{
              flex: 1,
              height: 46,
              border: "1px solid var(--line)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              background: "var(--card)",
            }}
          >
            Call {name.split(" ")[0]}
          </a>
          <a
            href={`sms:${c!.customerPhone}`}
            style={{
              flex: 1,
              height: 46,
              background: "var(--ink)",
              color: "#fff",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Text from my phone
          </a>
        </div>
        {/* status controls — no in-app reply; you call/text, then mark the lead */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <form action={markContactedAction} style={{ flex: "1 1 160px" }}>
            <input type="hidden" name="conversationId" value={c!.id} />
            <input type="hidden" name="contacted" value={c!.contactedAt ? "false" : "true"} />
            <button type="submit" style={statusBtn(!!c!.contactedAt)}>
              {c!.contactedAt ? "✓ Contacted — undo" : "Mark contacted"}
            </button>
          </form>
          <form action={markStatusAction} style={{ flex: "1 1 160px" }}>
            <input type="hidden" name="conversationId" value={c!.id} />
            <input type="hidden" name="status" value={c!.status === "closed" ? "new" : "closed"} />
            <button type="submit" style={statusBtn(false)}>
              {c!.status === "closed" ? "Reopen lead" : "Mark closed"}
            </button>
          </form>
        </div>
        <p style={{ fontSize: 12, color: "var(--faint)", textAlign: "center", marginTop: 10 }}>
          This is a read-only view of the SMS thread — Edison&apos;s AI handles the
          texting. To reply yourself, call or text the customer from your own phone,
          then mark the lead contacted so your team knows it&apos;s handled.
        </p>
      </div>
    </main>
  );
}

function statusBtn(active: boolean): React.CSSProperties {
  return {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: `1px solid ${active ? "#c4e9d7" : "var(--line)"}`,
    background: active ? "var(--green-soft)" : "var(--card)",
    color: active ? "var(--green)" : "var(--ink)",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
      <span style={{ color: "var(--muted)", fontWeight: 600 }}>{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function statusLabel(s: string): string {
  return (
    { booked: "Booked", needs_followup: "Needs follow-up", new: "New", closed: "Closed" }[s] ??
    s
  );
}

function formatSlot(d: Date): string {
  return new Date(d).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(s: string): string {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const digits = s.replace(/\D/g, "");
  return digits.slice(-2) || s.slice(0, 2).toUpperCase();
}
