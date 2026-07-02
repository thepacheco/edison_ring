import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getAdminMetrics, planLabel } from "@/lib/admin";
import { AreaTrend, GroupedBars } from "@/components/Charts";

const DARK_LABEL = "#8a93a3";

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

        {/* growth charts */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
          <ChartPanel title="Monthly recurring revenue" subtitle="last 6 months">
            <AreaTrend
              points={m.growth.map((g) => ({ label: g.label, value: g.mrr }))}
              stroke="#7c6cff"
              gradId="mrrGrad"
              labelColor={DARK_LABEL}
              format={(n) => "$" + n.toLocaleString()}
            />
          </ChartPanel>
          <ChartPanel title="Subscriber growth" subtitle="total vs. new / mo">
            <GroupedBars
              points={m.growth.map((g) => ({ label: g.label, a: g.subscribers, b: g.newSignups }))}
              aColor="#2c2f57"
              bColor="#3fb984"
              labelColor={DARK_LABEL}
            />
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: DARK_LABEL }}>
              <LegendDot color="#2c2f57" label="Total subscribers" />
              <LegendDot color="#3fb984" label="New this month" />
            </div>
          </ChartPanel>
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

        {/* all customers — spot problems before they happen */}
        <div style={{ marginTop: 14, background: "#161922", border: "1px solid #20242f", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #20242f", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#8a93a3", textTransform: "uppercase", letterSpacing: ".05em" }}>
              All customers · subscription &amp; usage
            </span>
            <span className="mono" style={{ fontSize: 11.5, color: "#6b7280" }}>{m.customers.length} total · riskiest first</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", textAlign: "left" }}>
                  <th style={th}>Business</th>
                  <th style={th}>Plan</th>
                  <th style={th}>Status</th>
                  <th style={{ ...th, minWidth: 170 }}>Usage this month</th>
                  <th style={{ ...th, textAlign: "right" }}>Locations</th>
                  <th style={{ ...th, textAlign: "right" }}>$/mo</th>
                </tr>
              </thead>
              <tbody>
                {m.customers.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "16px 18px", color: "#6b7280" }}>No customers yet.</td></tr>
                )}
                {m.customers.map((c) => {
                  const pct = Math.min(100, Math.round((c.used / Math.max(1, c.limit)) * 100));
                  const barColor = c.flagged || pct >= 100 ? "#e06a6a" : pct >= 80 ? "#e0a13c" : "#3fb984";
                  return (
                    <tr key={c.email} style={{ borderTop: "1px solid #1e222c" }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: "#e7e9ef" }}>{c.name}{c.flagged && <span title="Hard cap hit — flagged for review" style={{ marginLeft: 7, fontSize: 10, fontWeight: 800, color: "#e06a6a" }}>⚑ REVIEW</span>}</div>
                        <div className="mono" style={{ fontSize: 11, color: "#6b7280" }}>{c.email}</div>
                      </td>
                      <td style={{ ...td, color: "#c7cbd4" }}>{planLabel(c.plan)}</td>
                      <td style={td}><StatusPill status={c.status} /></td>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, borderRadius: 4, background: "#20242f", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4 }} />
                          </div>
                          <span className="mono" style={{ fontSize: 11.5, color: pct >= 80 ? barColor : "#8a93a3", whiteSpace: "nowrap" }}>{c.used}/{c.limit}</span>
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: "right" }} className="mono">{c.locations}</td>
                      <td style={{ ...td, textAlign: "right", color: "#c7cbd4" }} className="mono">${c.monthly}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

const th: React.CSSProperties = { padding: "9px 18px", fontWeight: 700 };
const td: React.CSSProperties = { padding: "11px 18px", verticalAlign: "middle" };

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "#3fb984", bg: "#12261d" },
    trialing: { label: "Trial", color: "#7c6cff", bg: "#26234a" },
    past_due: { label: "Past due", color: "#e06a6a", bg: "#2d1a1a" },
    canceled: { label: "Canceled", color: "#6b7280", bg: "#1e222c" },
    none: { label: "No sub", color: "#e0a13c", bg: "#2a2213" },
  };
  const s = map[status] ?? map.none;
  return (
    <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: "3px 9px", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
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

function ChartPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 320px", background: "#161922", border: "1px solid #20242f", borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#c7cbd4" }}>{title}</span>
        {subtitle && <span style={{ fontSize: 11, color: "#6b7280" }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      {label}
    </span>
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
