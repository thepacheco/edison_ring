import Link from "next/link";
import { getAnalytics, type WeekPoint } from "@/lib/analytics";
import { AppNav } from "@/components/AppNav";

export const dynamic = "force-dynamic";

const HOURS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ReportsPage() {
  const a = await getAnalytics();
  const momDelta = a.recoveredThisMonth - a.recoveredLastMonth;
  const maxWeek = Math.max(1, ...a.weeks.map((w) => w.leads));
  const maxHour = Math.max(1, ...a.hourHistogram);
  const maxWd = Math.max(1, ...a.weekdayHistogram);
  const maxTopic = Math.max(1, ...a.topics.map((t) => t.count));

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNav active="/reports" businessName="Reports" />
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px 64px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 4px" }}>
          Reports &amp; insights
        </h1>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--faint)" }}>
          What Edison is doing for you, and where the money comes from.
        </p>
        {a.demo && (
          <div className="mono" style={{ fontSize: 11.5, color: "var(--amber)", background: "var(--amber-soft)", border: "1px solid #f3e0bd", borderRadius: 8, padding: "6px 12px", marginBottom: 16, display: "inline-block" }}>
            sample data — live once conversations exist
          </div>
        )}

        {/* KPI row */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          <Kpi label="Recovered this month" value={`$${a.recoveredThisMonth.toLocaleString()}`} sub={`${momDelta >= 0 ? "▲" : "▼"} $${Math.abs(momDelta).toLocaleString()} vs last month`} good={momDelta >= 0} accent />
          <Kpi label="Return on cost" value={`${a.roiMultiple}×`} sub={`on $${a.subscriptionCost}/mo`} />
          <Kpi label="Booking rate" value={`${Math.round(a.conversionRate * 100)}%`} sub={`${a.booked} of ${a.leads} leads`} />
          <Kpi label="Avg reply time" value={a.avgReplySeconds ? `${a.avgReplySeconds}s` : "—"} sub="before they move on" />
        </div>

        {/* ROI trend */}
        <Card title="Recovered revenue — last 8 weeks">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180, padding: "8px 0" }}>
            {a.weeks.map((w) => (
              <WeekBar key={w.label} w={w} max={maxWeek} maxRecovered={Math.max(1, ...a.weeks.map((x) => x.recovered))} />
            ))}
          </div>
          <Legend items={[["var(--indigo)", "Leads"], ["var(--green-bright)", "Booked"]]} />
        </Card>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
          {/* when calls come in */}
          <Card title="When leads come in (by hour)" grow>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
              {a.hourHistogram.map((v, h) => (
                <div key={h} title={`${h}:00 — ${v}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                  <div style={{ height: `${(v / maxHour) * 100}%`, background: h >= 8 && h <= 18 ? "var(--indigo)" : "var(--indigo-soft)", borderRadius: 3, minHeight: v ? 3 : 0 }} />
                </div>
              ))}
            </div>
            <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--faint)", marginTop: 6 }}>
              {HOURS.map((h) => <span key={h}>{h}</span>)}
            </div>
          </Card>

          {/* by weekday */}
          <Card title="Busiest days" grow>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {a.weekdayHistogram.map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                  <span style={{ width: 34, color: "var(--muted)" }}>{WEEKDAYS[i]}</span>
                  <div style={{ flex: 1, height: 12, background: "var(--card-2)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(v / maxWd) * 100}%`, height: "100%", background: "var(--indigo)", borderRadius: 6 }} />
                  </div>
                  <span className="mono" style={{ width: 20, textAlign: "right", color: "var(--muted)" }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
          {/* what customers ask for */}
          <Card title="What customers ask for" grow>
            {a.topics.length === 0 && <Empty>Not enough data yet.</Empty>}
            {a.topics.map((t) => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, marginBottom: 9 }}>
                <span style={{ width: 130, color: "var(--ink)" }}>{t.label}</span>
                <div style={{ flex: 1, height: 12, background: "var(--card-2)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${(t.count / maxTopic) * 100}%`, height: "100%", background: "var(--green-bright)", borderRadius: 6 }} />
                </div>
                <span className="mono" style={{ width: 22, textAlign: "right", color: "var(--muted)" }}>{t.count}</span>
              </div>
            ))}
          </Card>

          {/* worker leaderboard */}
          <Card title="Team performance" grow>
            {a.workers.length === 0 && <Empty>No workers assigned yet.</Empty>}
            {a.workers.map((w, i) => (
              <div key={w.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i === a.workers.length - 1 ? "none" : "1px solid var(--line-soft)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--indigo-soft)", color: "var(--indigo)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {w.name.split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{w.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--faint)" }}>{w.booked} jobs booked</div>
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>${w.recovered.toLocaleString()}</span>
              </div>
            ))}
            <Link href="/settings" style={{ fontSize: 12.5, color: "var(--indigo)", fontWeight: 600, display: "inline-block", marginTop: 10 }}>
              Manage workers &amp; routing →
            </Link>
          </Card>
        </div>

        {/* activity feed */}
        <div style={{ marginTop: 16 }}>
          <Card title="Recent activity">
            {a.activity.map((it) => (
              <Link key={it.id} href={`/conversations/${it.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: it.status === "booked" ? "var(--green-bright)" : it.status === "needs_followup" ? "var(--amber)" : "var(--indigo)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.text}</div>
                </div>
                {it.value != null && <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green)" }}>${it.value}</span>}
                <span className="mono" style={{ fontSize: 11.5, color: "var(--faint)", width: 56, textAlign: "right" }}>{it.when}</span>
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </main>
  );
}

function Kpi({ label, value, sub, good, accent }: { label: string; value: string; sub: string; good?: boolean; accent?: boolean }) {
  return (
    <div style={{ flex: "1 1 180px", background: accent ? "var(--green-soft)" : "var(--card)", border: `1px solid ${accent ? "#c4e9d7" : "var(--line)"}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, color: accent ? "var(--green)" : "var(--faint)", fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 3, color: accent ? "var(--green)" : "var(--ink)" }}>{value}</div>
      <div style={{ fontSize: 11.5, marginTop: 2, color: good === false ? "#c0453f" : accent ? "var(--green)" : "var(--muted)" }}>{sub}</div>
    </div>
  );
}

function Card({ title, children, grow }: { title: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <div style={{ flex: grow ? "1 1 340px" : undefined, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function WeekBar({ w, max, maxRecovered }: { w: WeekPoint; max: number; maxRecovered: number }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
      <span className="mono" style={{ fontSize: 10, color: "var(--green)", fontWeight: 700 }}>{w.recovered ? `$${(w.recovered / 1000).toFixed(1)}k` : ""}</span>
      <div style={{ position: "relative", width: "100%", maxWidth: 34, height: 130, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3 }}>
        <div style={{ width: "45%", height: `${(w.leads / max) * 100}%`, background: "var(--indigo)", borderRadius: "4px 4px 0 0", minHeight: w.leads ? 3 : 0 }} />
        <div style={{ width: "45%", height: `${(w.booked / max) * 100}%`, background: "var(--green-bright)", borderRadius: "4px 4px 0 0", minHeight: w.booked ? 3 : 0 }} />
      </div>
      <span className="mono" style={{ fontSize: 10, color: "var(--faint)" }}>{w.label}</span>
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
      {items.map(([c, l]) => (
        <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
          {l}
        </div>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: "var(--faint)", padding: "6px 0" }}>{children}</div>;
}
