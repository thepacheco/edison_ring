import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  booked: { label: "Booked", color: "var(--green)", bg: "var(--green-soft)" },
  needs_followup: { label: "Follow up", color: "var(--amber)", bg: "var(--amber-soft)" },
  new: { label: "New", color: "var(--indigo)", bg: "var(--indigo-soft)" },
  closed: { label: "Closed", color: "var(--muted)", bg: "var(--line-soft)" },
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "needs_followup", label: "Needs follow-up" },
  { key: "booked", label: "Booked" },
  { key: "closed", label: "Closed" },
];
const CONTACT_TABS = [
  { key: "all", label: "Any" },
  { key: "no", label: "Not contacted" },
  { key: "yes", label: "Contacted" },
];

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; contacted?: string }>;
}) {
  const sp = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const q = (sp.q ?? "").trim();
  const status = STATUS_TABS.find((t) => t.key === sp.status)?.key ?? "all";
  const contacted = CONTACT_TABS.find((t) => t.key === sp.contacted)?.key ?? "all";

  const where: Prisma.ConversationWhereInput = { businessId: business!.id };
  if (status !== "all") where.status = status;
  if (contacted === "yes") where.contactedAt = { not: null };
  if (contacted === "no") where.contactedAt = null;
  if (q) {
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { customerPhone: { contains: q } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, assignedWorker: true },
    }),
    prisma.conversation.count({ where }),
  ]);

  // Build hrefs preserving the other params.
  const link = (o: { status?: string; contacted?: string }) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("status", o.status ?? status);
    params.set("contacted", o.contacted ?? contacted);
    return `/conversations?${params.toString()}`;
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNav active="/conversations" businessName={business!.name} />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 64px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>Conversations</h1>
          <span className="mono" style={{ fontSize: 12.5, color: "var(--faint)" }}>{total} lead{total === 1 ? "" : "s"}</span>
        </div>

        {/* search */}
        <form method="GET" action="/conversations" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="contacted" value={contacted} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, or job…"
            style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)" }}
          />
          <button type="submit" style={{ background: "var(--ink)", color: "var(--ink-invert)", border: "none", borderRadius: 10, padding: "0 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>Search</button>
          {(q || status !== "all" || contacted !== "all") && (
            <Link href="/conversations" style={{ display: "inline-flex", alignItems: "center", padding: "0 14px", fontSize: 13, color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 10 }}>Clear</Link>
          )}
        </form>

        {/* filter chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {STATUS_TABS.map((t) => (
            <Chip key={t.key} href={link({ status: t.key })} on={t.key === status} label={t.label} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {CONTACT_TABS.map((t) => (
            <Chip key={t.key} href={link({ contacted: t.key })} on={t.key === contacted} label={t.label} subtle />
          ))}
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
          {conversations.length === 0 && (
            <div style={{ padding: "28px 20px", color: "var(--faint)", fontSize: 14 }}>
              {q || status !== "all" || contacted !== "all"
                ? "No leads match those filters."
                : "No conversations yet. When a call goes unanswered, Edison texts the caller and the thread shows up here."}
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
                className="row-hover"
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i === conversations.length - 1 ? "none" : "1px solid var(--line-soft)" }}
              >
                <div style={{ width: 38, height: 38, flex: "none", borderRadius: "50%", background: s.bg, color: s.color, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {initials(name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                    {name}
                    {c.contactedAt && <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", background: "var(--green-soft)", borderRadius: 20, padding: "1px 7px" }}>✓ contacted</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.summary || last?.body || "New lead"}
                    {c.assignedWorker && <span style={{ color: "var(--indigo)" }}> · {c.assignedWorker.name}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flex: "none" }}>
                  {c.estimatedValue != null && (
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: s.color }}>${Number(c.estimatedValue).toFixed(0)}</div>
                  )}
                  <div style={{ fontSize: 10.5, color: "var(--faint)" }}>{c.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: "4px 11px", flex: "none" }}>{s.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function Chip({ href, on, label, subtle }: { href: string; on: boolean; label: string; subtle?: boolean }) {
  return (
    <Link
      href={href}
      className={on ? undefined : "nav-link"}
      style={{
        fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 8,
        border: `1px solid ${on ? "transparent" : "var(--line)"}`,
        color: on ? "#fff" : "var(--muted)",
        background: on ? (subtle ? "var(--muted)" : "var(--indigo)") : "transparent",
      }}
    >
      {label}
    </Link>
  );
}

function initials(s: string): string {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const digits = s.replace(/\D/g, "");
  return digits.slice(-2) || s.slice(0, 2).toUpperCase();
}
