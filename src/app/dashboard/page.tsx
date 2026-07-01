import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData, type RecentLead } from "@/lib/dashboard";
import { getCurrentBusiness } from "@/lib/auth";
import { MoneyCounter } from "@/components/MoneyCounter";
import { AppNav } from "@/components/AppNav";
import { Toast } from "@/components/Toast";
import { AreaTrend, GroupedBars, Funnel } from "@/components/Charts";
import { runTestLeadAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> =
  {
    booked: { label: "Booked", color: "#0a7d54", bg: "#e6f6ef" },
    needs_followup: { label: "Follow up", color: "#a86400", bg: "#fdf3e2" },
    new: { label: "New", color: "#5b46f9", bg: "#eceaff" },
    closed: { label: "Closed", color: "#5b6475", bg: "#f0f1f5" },
  };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>;
}) {
  const { test } = await searchParams;
  if (!(await getCurrentBusiness())) redirect("/login");
  const d = await getDashboardData();
  const usagePct = Math.min(
    100,
    Math.round((d.conversationsUsed / d.conversationLimit) * 100),
  );

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {test === "error" && (
        <Toast text="Test lead failed — check your ANTHROPIC_API_KEY." kind="error" />
      )}
      <AppNav active="/dashboard" businessName={d.businessName} />

      <div
        style={{
          padding: "34px 28px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          alignItems: "center",
        }}
      >
        {d.demo && (
          <div
            className="mono"
            style={{
              fontSize: 11.5,
              color: "var(--amber)",
              background: "var(--amber-soft)",
              border: "1px solid #f3e0bd",
              borderRadius: 8,
              padding: "6px 12px",
              textAlign: "center",
            }}
          >
            sample data — connect DATABASE_URL and run a missed-call test to see
            live numbers
          </div>
        )}

        {/* getting-started checklist (new businesses) */}
        {!d.demo && !d.onboarding.complete && (
          <section
            className="rise"
            style={{ width: "100%", maxWidth: 760, background: "var(--card)", border: "1px solid var(--indigo)", borderRadius: 16, padding: "18px 22px" }}
          >
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>👋 Let&apos;s get you set up</div>
            <div style={{ fontSize: 13, color: "var(--faint)", marginBottom: 14 }}>A couple quick steps and Edison starts rescuing calls.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <ChecklistItem done={d.onboarding.setupDone} label="Forward your phone to Edison" href="/setup" cta="Set up" />
              <ChecklistItem done={d.onboarding.hoursSet} label="Set your business hours" href="/settings?tab=business" cta="Add hours" />
              <ChecklistItem done={d.onboarding.hasWorkers} label="Add your crew (optional)" href="/settings?tab=crew" cta="Add crew" />
              <ChecklistItem done={false} label="Try it — run a test lead" href="#test-lead" cta="See below" muted />
            </div>
          </section>
        )}

        {/* centerpiece — paid for itself tracker */}
        <section
          className="rise"
          style={{
            width: "100%",
            maxWidth: 760,
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 20,
            boxShadow: "0 18px 44px -28px rgba(91,70,249,.35)",
            padding: "38px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: d.paidForItself ? "var(--green-soft)" : "#f0f1f5",
              color: d.paidForItself ? "var(--green)" : "var(--muted)",
              borderRadius: 30,
              padding: "7px 15px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {d.paidForItself
              ? "✓ Paid for itself this month"
              : "On its way to paying for itself"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 14, color: "var(--faint)", fontWeight: 600 }}>
              Edison recovered for you this month
            </span>
            <MoneyCounter
              target={d.recoveredThisMonth}
              className="mono"
              style={{
                fontWeight: 700,
                fontSize: 74,
                letterSpacing: "-.03em",
                lineHeight: 1,
                color: "var(--green)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            <span>
              <b className="mono" style={{ color: "var(--ink)" }}>
                {d.jobsBooked}
              </b>{" "}
              jobs booked
            </span>
            <span style={{ color: "#d4d7de" }}>×</span>
            <span>
              <b className="mono" style={{ color: "var(--ink)" }}>
                ${d.avgTicket}
              </b>{" "}
              avg ticket
            </span>
            <span style={{ color: "#d4d7de" }}>·</span>
            <span>
              Edison costs{" "}
              <b className="mono" style={{ color: "var(--ink)" }}>
                ${d.subscriptionCost}
              </b>
            </span>
          </div>
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              marginTop: 6,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                height: 8,
                borderRadius: 6,
                background: "#eef0f4",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg,#5b46f9,#0f9d6b)",
                  borderRadius: 6,
                }}
              />
            </div>
            <div
              className="mono"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "var(--faint)",
              }}
            >
              <span>$0</span>
              <span>{d.returnMultiple}× your subscription</span>
            </div>
          </div>
        </section>

        {/* stat strip */}
        <section
          className="rise rise-1"
          style={{
            width: "100%",
            maxWidth: 760,
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <StatCard label="Conversations">
            <span className="mono" style={{ fontWeight: 700, fontSize: 22 }}>
              {d.conversationsUsed}
              <span style={{ color: "#aeb4c0", fontSize: 15 }}>
                {" "}
                / {d.conversationLimit}
              </span>
            </span>
            <div
              style={{
                height: 5,
                borderRadius: 4,
                background: "#eceef3",
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: `${usagePct}%`,
                  height: "100%",
                  background: usagePct >= 90 ? "#d99413" : "var(--indigo)",
                  borderRadius: 4,
                }}
              />
            </div>
          </StatCard>
          <StatCard label="Booked jobs">
            <span className="mono" style={{ fontWeight: 700, fontSize: 22 }}>
              {d.jobsBooked}
            </span>
          </StatCard>
          <StatCard label="Needs follow-up">
            <span
              className="mono"
              style={{ fontWeight: 700, fontSize: 22, color: "var(--amber)" }}
            >
              {d.needsFollowup}
            </span>
          </StatCard>
          <StatCard label="Return on cost">
            <span
              className="mono"
              style={{ fontWeight: 700, fontSize: 22, color: "var(--green)" }}
            >
              {d.returnMultiple}×
            </span>
          </StatCard>
          <StatCard label="Avg ticket">
            <span className="mono" style={{ fontWeight: 700, fontSize: 22 }}>
              ${d.avgTicket}
            </span>
          </StatCard>
        </section>

        {/* charts */}
        <section
          className="rise rise-2"
          style={{ width: "100%", maxWidth: 760, display: "flex", gap: 14, flexWrap: "wrap" }}
        >
          <ChartCard title="Money recovered" subtitle="last 8 weeks" grow>
            <AreaTrend
              points={d.trend.map((t) => ({ label: t.label, value: t.recovered }))}
              stroke="var(--green-bright)"
              gradId="recGrad"
              format={(n) => "$" + n.toLocaleString()}
            />
          </ChartCard>
          <ChartCard title="Leads vs booked" subtitle="weekly" grow>
            <GroupedBars
              points={d.trend.map((t) => ({ label: t.label, a: t.leads, b: t.booked }))}
            />
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: "var(--faint)" }}>
              <Legend color="var(--indigo-soft)" label="Leads" />
              <Legend color="var(--indigo)" label="Booked" />
            </div>
          </ChartCard>
        </section>

        {/* funnel */}
        <section
          className="rise rise-3"
          style={{
            width: "100%",
            maxWidth: 760,
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: "18px 20px",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>This month at a glance</div>
          <div style={{ fontSize: 12.5, color: "var(--faint)", marginBottom: 16 }}>
            How many missed-call leads turn into booked jobs.
          </div>
          <Funnel
            stages={[
              { label: "Leads (missed calls texted back)", value: d.funnel.leads, color: "var(--indigo)" },
              { label: "Engaged (customer replied)", value: d.funnel.engaged, color: "#7c6cff" },
              { label: "Booked", value: d.funnel.booked, color: "var(--green)" },
            ]}
          />
        </section>

        {/* upcoming appointments */}
        <section
          className="rise rise-3"
          style={{
            width: "100%",
            maxWidth: 760,
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--line-soft)" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Upcoming appointments</span>
            <Link href="/calendar" style={{ fontSize: 13, color: "var(--indigo)", fontWeight: 600 }}>
              Open calendar →
            </Link>
          </div>
          {d.upcoming.length === 0 && (
            <div style={{ padding: "22px 20px", fontSize: 14, color: "var(--faint)" }}>
              No upcoming appointments yet. When Edison books a job, it shows up here and on the calendar.
            </div>
          )}
          {d.upcoming.map((u, i) => (
            <Link
              key={u.id}
              href={`/conversations/${u.id}`}
              className="row-hover"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", borderBottom: i === d.upcoming.length - 1 ? "none" : "1px solid var(--line-soft)" }}
            >
              <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--indigo)", background: "var(--indigo-soft)", borderRadius: 8, padding: "6px 10px", whiteSpace: "nowrap" }}>
                {u.whenLabel}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.summary}</div>
              </div>
            </Link>
          ))}
        </section>

        {/* recent leads */}
        <section
          id="test-lead"
          className="rise rise-4"
          style={{
            width: "100%",
            maxWidth: 760,
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid var(--line-soft)",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15 }}>Recent leads</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <form action={runTestLeadAction}>
                <button
                  type="submit"
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--card)",
                    color: "var(--ink)",
                    borderRadius: 9,
                    padding: "6px 12px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ⚡ Run a test lead
                </button>
              </form>
              <Link
                href="/conversations"
                style={{ fontSize: 13, color: "var(--indigo)", fontWeight: 600 }}
              >
                View all →
              </Link>
            </div>
          </div>
          {d.recentLeads.length === 0 && (
            <div
              style={{ padding: "28px 20px", color: "var(--faint)", fontSize: 14 }}
            >
              No leads yet. When a call goes unanswered, Edison texts the caller
              and the conversation shows up here.
            </div>
          )}
          {d.recentLeads.map((lead, i) => (
            <LeadRow key={lead.id} lead={lead} last={i === d.recentLeads.length - 1} />
          ))}
        </section>
      </div>
    </main>
  );
}

function ChecklistItem({ done, label, href, cta, muted }: { done: boolean; label: string; href: string; cta: string; muted?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 22, height: 22, flex: "none", borderRadius: "50%", background: done ? "var(--green-soft)" : "var(--line-soft)", color: done ? "var(--green)" : "var(--faint)", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {done ? "✓" : ""}
      </span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: done ? "var(--faint)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>{label}</span>
      {!done && (
        <Link href={href} style={{ fontSize: 12.5, fontWeight: 700, color: muted ? "var(--muted)" : "#fff", background: muted ? "transparent" : "var(--indigo)", border: muted ? "1px solid var(--line)" : "none", borderRadius: 8, padding: "6px 12px" }}>
          {cta}
        </Link>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  grow,
  children,
}: {
  title: string;
  subtitle?: string;
  grow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="lift"
      style={{
        flex: grow ? "1 1 320px" : "none",
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</span>
        {subtitle && <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="lift"
      style={{
        flex: "1 1 140px",
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--faint)",
          fontWeight: 600,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function LeadRow({ lead, last }: { lead: RecentLead; last: boolean }) {
  const s = STATUS_STYLE[lead.status] ?? STATUS_STYLE.new;
  return (
    <Link
      href={`/conversations/${lead.id}`}
      className="row-hover"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "15px 20px",
        borderBottom: last ? "none" : "1px solid var(--line-soft)",
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
        {lead.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
          {lead.name}
          {lead.contacted && (
            <span
              className="mono"
              title="You marked this lead contacted"
              style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", background: "var(--green-soft)", borderRadius: 20, padding: "1px 7px" }}
            >
              ✓ contacted
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--faint)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {lead.summary}
        </div>
      </div>
      {lead.value != null && (
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: s.color }}>
          ${lead.value}
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
}
