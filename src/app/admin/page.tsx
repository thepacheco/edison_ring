import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAdminMetrics, planLabel } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const m = await getAdminMetrics();
  const money = (n: number) => "$" + n.toLocaleString("en-US");

  return (
    <main style={{ minHeight: "100vh", background: "#0f1117", color: "#e7e9ef" }}>
      <header
        style={{
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "1px solid #20242f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="mono"
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "var(--indigo)",
              color: "#fff",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            E
          </div>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Edison · CEO cockpit</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/admin/model" style={{ fontSize: 13, color: "#9aa3b2" }}>
            Scenario model →
          </Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: "#9aa3b2" }}>
            ← owner view
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 64px" }}>
        {m.demo && (
          <div
            className="mono"
            style={{
              fontSize: 11.5,
              color: "#d9b25a",
              background: "#241f12",
              border: "1px solid #3a3220",
              borderRadius: 8,
              padding: "6px 12px",
              marginBottom: 18,
              display: "inline-block",
            }}
          >
            sample data — live numbers appear once businesses + Stripe events exist
          </div>
        )}

        {/* headline metrics */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
          <Big label="MRR" value={money(m.mrr)} accent="#7c6cff" />
          <Big label="Active subscribers" value={String(m.activeSubscribers)} />
          <Big label="Conversations this month" value={m.conversationsThisMonth.toLocaleString()} />
          <Big label="Est. COGS" value={money(m.estCogs)} accent="#e0a13c" />
          <Big label="Gross margin" value={money(m.margin)} accent="#3fb984" />
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {/* by plan + conversion */}
          <Panel title="Subscribers by plan" grow>
            {m.byPlan.length === 0 && <Empty>No active subscribers yet.</Empty>}
            {m.byPlan.map((p) => (
              <Row key={p.plan} left={planLabel(p.plan)} right={String(p.count)} />
            ))}
            <div style={{ height: 1, background: "#20242f", margin: "10px 0" }} />
            <Row left="Trial → paid conversion" right={`${Math.round(m.conversionRate * 100)}%`} />
            <Row left="Churn this month" right={String(m.churnThisMonth)} danger={m.churnThisMonth > 0} />
          </Panel>

          {/* trials */}
          <Panel title="Trials in progress" grow>
            {m.trials.length === 0 && <Empty>No active trials.</Empty>}
            {m.trials.map((t) => (
              <Row key={t.name} left={t.name} right={`${t.daysLeft}d left`} warn={t.daysLeft <= 3} />
            ))}
          </Panel>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
          {/* near limit */}
          <Panel title="Near / over conversation limit" grow>
            {m.nearLimit.length === 0 && <Empty>Nobody close to their limit.</Empty>}
            {m.nearLimit.map((n) => (
              <Row
                key={n.name}
                left={n.name}
                right={`${n.used} / ${n.limit}`}
                warn={n.used >= n.limit * 0.9}
                danger={n.used >= n.limit}
              />
            ))}
          </Panel>

          {/* failed payments */}
          <Panel title="Failed payments" grow>
            {m.failedPayments.length === 0 && <Empty>No failed payments. 🎉</Empty>}
            {m.failedPayments.map((f) => (
              <Row key={f.email} left={f.name} right={f.email} danger />
            ))}
          </Panel>
        </div>
      </div>
    </main>
  );
}

function Big({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        flex: "1 1 180px",
        background: "#161922",
        border: "1px solid #20242f",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: 12, color: "#8a93a3", fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: accent || "#e7e9ef" }}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children, grow }: { title: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <div
      style={{
        flex: grow ? "1 1 320px" : "none",
        background: "#161922",
        border: "1px solid #20242f",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8a93a3", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({
  left,
  right,
  warn,
  danger,
}: {
  left: string;
  right: string;
  warn?: boolean;
  danger?: boolean;
}) {
  const color = danger ? "#e06a6a" : warn ? "#e0a13c" : "#e7e9ef";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13.5 }}>
      <span style={{ color: "#c7cbd4" }}>{left}</span>
      <span className="mono" style={{ fontWeight: 700, color }}>
        {right}
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: "#6b7280", padding: "6px 0" }}>{children}</div>;
}
