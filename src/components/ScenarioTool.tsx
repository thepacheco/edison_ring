"use client";

import { useState } from "react";

/**
 * Private CEO financial-scenario model. Pure client-side math — no data leaves
 * the browser. Sliders drive a live P&L so the founder can pressure-test
 * pricing, growth, churn and COGS assumptions before committing.
 */

interface Assumptions {
  customers: number; // paying businesses
  planPrice: number; // avg monthly subscription $
  convosPerCustomer: number; // conversations/mo per customer
  twilioPerConvo: number; // $ COGS per conversation (SMS)
  anthropicPerConvo: number; // $ COGS per conversation (Claude tokens)
  fixedMonthly: number; // infra + tools + everything not per-customer
  churnPct: number; // monthly logo churn %
  taxPct: number; // tax on profit %
  cac: number; // $ to acquire one customer
  newPerMonth: number; // new customers added per month
}

const DEFAULTS: Assumptions = {
  customers: 40,
  planPrice: 79,
  convosPerCustomer: 120,
  twilioPerConvo: 0.032,
  anthropicPerConvo: 0.006,
  fixedMonthly: 600,
  churnPct: 4,
  taxPct: 21,
  cac: 180,
  newPerMonth: 8,
};

export function ScenarioTool() {
  const [a, setA] = useState<Assumptions>(DEFAULTS);
  const set = (k: keyof Assumptions) => (v: number) => setA((p) => ({ ...p, [k]: v }));

  // --- monthly P&L ---
  const mrr = a.customers * a.planPrice;
  const perConvoCogs = a.twilioPerConvo + a.anthropicPerConvo;
  const variableCogs = a.customers * a.convosPerCustomer * perConvoCogs;
  const grossProfit = mrr - variableCogs;
  const grossMarginPct = mrr > 0 ? (grossProfit / mrr) * 100 : 0;
  const acquisitionSpend = a.newPerMonth * a.cac;
  const operatingProfit = grossProfit - a.fixedMonthly - acquisitionSpend;
  const tax = operatingProfit > 0 ? operatingProfit * (a.taxPct / 100) : 0;
  const netProfit = operatingProfit - tax;

  // --- unit economics ---
  const revPerCustomer = a.planPrice;
  const cogsPerCustomer = a.convosPerCustomer * perConvoCogs;
  const contributionPerCustomer = revPerCustomer - cogsPerCustomer;
  const avgLifetimeMonths = a.churnPct > 0 ? 100 / a.churnPct : Infinity;
  const ltv = contributionPerCustomer * avgLifetimeMonths;
  const ltvCac = a.cac > 0 ? ltv / a.cac : Infinity;
  const paybackMonths = contributionPerCustomer > 0 ? a.cac / contributionPerCustomer : Infinity;

  // --- break-even: customers needed for net >= 0 (at current new/CAC cadence) ---
  const fixedPlusCac = a.fixedMonthly + acquisitionSpend;
  const breakEvenCustomers =
    contributionPerCustomer > 0 ? Math.ceil(fixedPlusCac / contributionPerCustomer) : Infinity;

  // --- 12-month projection with churn + new adds ---
  const projection: { month: number; customers: number; mrr: number; net: number }[] = [];
  let cust = a.customers;
  for (let mo = 1; mo <= 12; mo++) {
    cust = Math.max(0, cust - cust * (a.churnPct / 100) + a.newPerMonth);
    const m = cust * a.planPrice;
    const vc = cust * a.convosPerCustomer * perConvoCogs;
    const op = m - vc - a.fixedMonthly - a.newPerMonth * a.cac;
    const nt = op - (op > 0 ? op * (a.taxPct / 100) : 0);
    projection.push({ month: mo, customers: Math.round(cust), mrr: m, net: nt });
  }
  const arr = mrr * 12;
  const year1Net = projection.reduce((s, p) => s + p.net, 0);
  const maxNet = Math.max(...projection.map((p) => Math.abs(p.net)), 1);

  const money = (n: number) =>
    (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* sliders */}
      <div style={{ flex: "1 1 340px", background: "#161922", border: "1px solid #20242f", borderRadius: 16, padding: "18px 20px" }}>
        <SectionTitle>Assumptions</SectionTitle>
        <Slider label="Paying customers" value={a.customers} set={set("customers")} min={1} max={1000} step={1} fmt={(v) => String(v)} />
        <Slider label="Avg plan price / mo" value={a.planPrice} set={set("planPrice")} min={29} max={199} step={1} fmt={money} />
        <Slider label="Conversations / customer / mo" value={a.convosPerCustomer} set={set("convosPerCustomer")} min={10} max={600} step={5} fmt={(v) => String(v)} />
        <Slider label="Twilio COGS / conversation" value={a.twilioPerConvo} set={set("twilioPerConvo")} min={0} max={0.2} step={0.001} fmt={(v) => `$${v.toFixed(3)}`} />
        <Slider label="Claude COGS / conversation" value={a.anthropicPerConvo} set={set("anthropicPerConvo")} min={0} max={0.1} step={0.001} fmt={(v) => `$${v.toFixed(3)}`} />
        <Slider label="Fixed costs / mo" value={a.fixedMonthly} set={set("fixedMonthly")} min={0} max={20000} step={50} fmt={money} />
        <Slider label="New customers / mo" value={a.newPerMonth} set={set("newPerMonth")} min={0} max={100} step={1} fmt={(v) => String(v)} />
        <Slider label="CAC (cost to acquire 1)" value={a.cac} set={set("cac")} min={0} max={1000} step={5} fmt={money} />
        <Slider label="Monthly churn" value={a.churnPct} set={set("churnPct")} min={0} max={20} step={0.5} fmt={(v) => `${v}%`} />
        <Slider label="Tax on profit" value={a.taxPct} set={set("taxPct")} min={0} max={45} step={1} fmt={(v) => `${v}%`} />
        <button
          onClick={() => setA(DEFAULTS)}
          style={{ marginTop: 12, background: "none", border: "1px solid #2c313d", color: "#9aa3b2", borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          Reset to defaults
        </button>
      </div>

      {/* results */}
      <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KPI label="MRR" value={money(mrr)} accent="#7c6cff" />
          <KPI label="ARR" value={money(arr)} accent="#7c6cff" />
          <KPI label="Net profit / mo" value={money(netProfit)} accent={netProfit >= 0 ? "#3fb984" : "#e06a6a"} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <KPI label="Gross margin" value={`${grossMarginPct.toFixed(0)}%`} accent="#3fb984" />
          <KPI label="LTV" value={ltv === Infinity ? "∞" : money(ltv)} />
          <KPI label="LTV : CAC" value={ltvCac === Infinity ? "∞" : `${ltvCac.toFixed(1)}×`} accent={ltvCac >= 3 ? "#3fb984" : "#e0a13c"} />
        </div>

        <Card title="P&L this month">
          <Line label="Subscription revenue (MRR)" value={money(mrr)} />
          <Line label="− Variable COGS (Twilio + Claude)" value={money(-variableCogs)} sub />
          <Line label="= Gross profit" value={money(grossProfit)} strong />
          <Line label={`− Fixed costs`} value={money(-a.fixedMonthly)} sub />
          <Line label={`− Acquisition (${a.newPerMonth} × ${money(a.cac)})`} value={money(-acquisitionSpend)} sub />
          <Line label="= Operating profit" value={money(operatingProfit)} strong />
          <Line label={`− Tax (${a.taxPct}%)`} value={money(-tax)} sub />
          <Line label="= Net profit" value={money(netProfit)} strong accent={netProfit >= 0 ? "#3fb984" : "#e06a6a"} />
        </Card>

        <Card title="Unit economics">
          <Line label="Contribution / customer / mo" value={money(contributionPerCustomer)} />
          <Line label="Avg customer lifetime" value={avgLifetimeMonths === Infinity ? "∞" : `${avgLifetimeMonths.toFixed(0)} mo`} sub />
          <Line label="CAC payback" value={paybackMonths === Infinity ? "never" : `${paybackMonths.toFixed(1)} mo`} sub />
          <Line label="Break-even customer count" value={breakEvenCustomers === Infinity ? "never" : String(breakEvenCustomers)} strong accent={a.customers >= breakEvenCustomers ? "#3fb984" : "#e0a13c"} />
        </Card>

        <Card title="12-month projection (with churn + adds)">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90, marginBottom: 8 }}>
            {projection.map((p) => (
              <div key={p.month} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }} title={`Mo ${p.month}: ${p.customers} cust · net ${money(p.net)}`}>
                <div
                  style={{
                    height: `${(Math.abs(p.net) / maxNet) * 100}%`,
                    minHeight: 2,
                    background: p.net >= 0 ? "#3fb984" : "#e06a6a",
                    borderRadius: 3,
                  }}
                />
              </div>
            ))}
          </div>
          <Line label="Customers at month 12" value={String(projection[11].customers)} />
          <Line label="MRR at month 12" value={money(projection[11].mrr)} sub />
          <Line label="Cumulative net (year 1)" value={money(year1Net)} strong accent={year1Net >= 0 ? "#3fb984" : "#e06a6a"} />
        </Card>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  set,
  min,
  max,
  step,
  fmt,
}: {
  label: string;
  value: number;
  set: (v: number) => void;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12.5, color: "#c7cbd4" }}>{label}</span>
        <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "#e7e9ef" }}>{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#7c6cff" }}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8a93a3", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>
      {children}
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ flex: "1 1 110px", background: "#161922", border: "1px solid #20242f", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, color: "#8a93a3", fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 3, color: accent || "#e7e9ef" }}>{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#161922", border: "1px solid #20242f", borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8a93a3", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Line({
  label,
  value,
  sub,
  strong,
  accent,
}: {
  label: string;
  value: string;
  sub?: boolean;
  strong?: boolean;
  accent?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: strong ? "8px 0" : "5px 0", borderTop: strong ? "1px solid #20242f" : "none" }}>
      <span style={{ fontSize: 13, color: sub ? "#8a93a3" : "#c7cbd4", fontWeight: strong ? 700 : 400 }}>{label}</span>
      <span className="mono" style={{ fontSize: 13.5, fontWeight: strong ? 800 : 600, color: accent || (sub ? "#8a93a3" : "#e7e9ef") }}>{value}</span>
    </div>
  );
}
