import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  booked: { label: "Booked", color: "#0a7d54", bg: "#e6f6ef" },
  needs_followup: { label: "Follow up", color: "#a86400", bg: "#fdf3e2" },
  new: { label: "New", color: "#5b46f9", bg: "#eceaff" },
  closed: { label: "Closed", color: "#5b6475", bg: "#f0f1f5" },
};

export default async function ConversationsPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const conversations = await prisma.conversation.findMany({
    where: { businessId: business!.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNav active="/conversations" businessName={business!.name} />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 64px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 16px" }}>
          Conversations
        </h1>
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {conversations.length === 0 && (
            <div style={{ padding: "28px 20px", color: "var(--faint)", fontSize: 14 }}>
              No conversations yet. When a call goes unanswered, Edison texts the
              caller and the thread shows up here.
            </div>
          )}
          {conversations.map((c, i) => {
            const s = STATUS_STYLE[c.status] ?? STATUS_STYLE.new;
            const name = c.customerName || c.customerPhone;
            const last = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/conversations/${c.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "15px 20px",
                  borderBottom: i === conversations.length - 1 ? "none" : "1px solid #f4f5f8",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    flex: "none",
                    borderRadius: "50%",
                    background: s.bg,
                    color: s.color,
                    fontSize: 13,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {initials(name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{name}</div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--faint)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.summary || last?.body || "New lead"}
                  </div>
                </div>
                {c.estimatedValue != null && (
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: s.color }}>
                    ${Number(c.estimatedValue).toFixed(0)}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: s.color,
                    background: s.bg,
                    borderRadius: 20,
                    padding: "4px 11px",
                  }}
                >
                  {s.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function initials(s: string): string {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const digits = s.replace(/\D/g, "");
  return digits.slice(-2) || s.slice(0, 2).toUpperCase();
}
