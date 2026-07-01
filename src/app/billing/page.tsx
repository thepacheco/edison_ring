import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { currentMonth } from "@/lib/usage";
import {
  PLANS,
  planFor,
  OVERAGE_RATE,
  subscriptionCost,
  perLocationPrice,
} from "@/lib/pricing";
import { googleConfigured } from "@/lib/google";
import { startCheckoutAction, billingPortalAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; google?: string; error?: string; welcome?: string }>;
}) {
  const sp = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const [usage, locationCount] = await Promise.all([
    prisma.usageRecord.findUnique({
      where: { businessId_month: { businessId: business!.id, month: currentMonth() } },
    }),
    prisma.location.count({ where: { businessId: business!.id } }),
  ]);

  const plan = planFor(business!.plan);
  const used = usage?.conversationCount ?? 0;
  const limit = business!.conversationLimit;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const cost = subscriptionCost(business!.plan, Math.max(1, locationCount));
  const calendarConnected = Boolean(business!.googleRefreshToken);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNav active="/billing" businessName={business!.name} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 64px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 16px" }}>
          Plan &amp; billing
        </h1>

        {sp.welcome && <Banner ok>Account created — add a card to start your 14-day free trial.</Banner>}
        {sp.checkout === "success" && <Banner ok>✓ Subscription started. Your 14-day trial is running.</Banner>}
        {sp.google === "connected" && <Banner ok>✓ Google Calendar connected — Edison can now book real slots.</Banner>}
        {sp.error === "stripe_unconfigured" && <Banner>Stripe isn&apos;t configured yet (set STRIPE_SECRET_KEY).</Banner>}
        {sp.error === "google_unconfigured" && <Banner>Google isn&apos;t configured yet (set GOOGLE_CLIENT_ID/SECRET).</Banner>}

        {/* status + usage */}
        <Card>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Mini label="Current plan" value={plan.name} sub={`$${plan.monthly}/mo · ${plan.includedConversations} conv.`} />
            <Mini
              label="Status"
              value={prettyStatus(business!.subscriptionStatus)}
              sub={business!.trialEndsAt ? `trial ends ${business!.trialEndsAt.toLocaleDateString()}` : "—"}
            />
            <Mini
              label="Recovered value"
              value="—"
              sub="see dashboard"
              accent
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5, color: pct >= 80 ? "var(--amber)" : "var(--ink)" }}>
                You&apos;re at {pct}% of your {plan.name} plan
              </span>
              <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                {used} / {limit}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: "#eceef3", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? "#d99413" : "var(--indigo)", borderRadius: 5 }} />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
              Extra conversations bill at <b>${OVERAGE_RATE.toFixed(2)} each</b>. Hard cap at 1,000/mo.
            </div>
          </div>
        </Card>

        {/* connect calendar */}
        <div style={{ marginTop: 16 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>Google Calendar</div>
                <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 2 }}>
                  {calendarConnected
                    ? "Connected — Edison proposes real open slots and books them."
                    : "Connect so Edison can check availability and book jobs."}
                </div>
              </div>
              {calendarConnected ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", background: "var(--green-soft)", borderRadius: 20, padding: "6px 13px" }}>
                  ✓ Connected
                </span>
              ) : (
                <a
                  href="/api/google/connect"
                  style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", background: "var(--ink)", borderRadius: 10, padding: "10px 18px" }}
                >
                  {googleConfigured() ? "Connect" : "Connect (needs setup)"}
                </a>
              )}
            </div>
          </Card>
        </div>

        {/* plan picker */}
        <div style={{ marginTop: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
              Choose a plan
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {Object.values(PLANS).map((p) => {
                const current = p.id === business!.plan;
                return (
                  <form key={p.id} action={startCheckoutAction} style={{ flex: "1 1 200px" }}>
                    <input type="hidden" name="plan" value={p.id} />
                    <div
                      style={{
                        border: current ? "2px solid var(--indigo)" : "1px solid var(--line)",
                        background: current ? "#faf9ff" : "#fff",
                        borderRadius: 13,
                        padding: "16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        height: "100%",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</span>
                        {current && (
                          <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--indigo)", background: "var(--indigo-soft)", borderRadius: 20, padding: "2px 8px" }}>
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>
                        ${p.monthly}/mo · {p.includedConversations} conv.
                      </div>
                      <button
                        type="submit"
                        style={{
                          marginTop: "auto",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: 10,
                          padding: "10px",
                          fontSize: 13.5,
                          fontWeight: 700,
                          background: current ? "#eceef3" : "var(--indigo)",
                          color: current ? "var(--muted)" : "#fff",
                        }}
                      >
                        {current ? "Manage" : "Switch & start trial"}
                      </button>
                    </div>
                  </form>
                );
              })}
            </div>
          </Card>
        </div>

        {/* multi-location pricing */}
        <div style={{ marginTop: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
              Multi-location pricing
            </div>
            <Tier name="Single shop" range="1" price="$79" save="—" highlight={locationCount <= 1} />
            <Tier name="Multi" range="2 – 4" price={`$${perLocationPrice(3)}`} save="13%" highlight={locationCount >= 2 && locationCount <= 4} />
            <Tier name="Fleet" range="5 – 9" price={`$${perLocationPrice(6)}`} save="25%" highlight={locationCount >= 5 && locationCount <= 9} />
            <Tier name="Enterprise" range="10+" price="custom" save="—" highlight={locationCount >= 10} last />
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10 }}>
              You have <b>{Math.max(1, locationCount)}</b> location{locationCount === 1 ? "" : "s"} · est. <b className="mono">${cost}/mo</b>.
            </div>
          </Card>
        </div>

        <form action={billingPortalAction} style={{ marginTop: 16, textAlign: "center" }}>
          <button
            type="submit"
            style={{ background: "none", border: "none", color: "var(--indigo)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            Manage payment method &amp; invoices →
          </button>
        </form>
      </div>
    </main>
  );
}

function prettyStatus(s: string): string {
  return (
    { none: "No subscription", trialing: "Trialing", active: "Active", past_due: "Past due", canceled: "Canceled" }[s] ??
    s
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px" }}>
      {children}
    </div>
  );
}

function Mini({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div
      style={{
        flex: "1 1 160px",
        border: `1px solid ${accent ? "#c4e9d7" : "var(--line)"}`,
        background: accent ? "var(--green-soft)" : "#fff",
        borderRadius: 13,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 12, color: accent ? "var(--green)" : "var(--faint)", fontWeight: 600 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 18, marginTop: 3, color: accent ? "var(--green)" : "var(--ink)" }}>{value}</div>
      <div style={{ fontSize: 12, color: accent ? "var(--green)" : "var(--muted)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Tier({
  name,
  range,
  price,
  save,
  highlight,
  last,
}: {
  name: string;
  range: string;
  price: string;
  save: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: 13.5,
        padding: "11px 12px",
        borderRadius: 9,
        background: highlight ? "#faf9ff" : "transparent",
        borderBottom: last ? "none" : "1px solid #f4f5f8",
      }}
    >
      <div style={{ flex: 2, fontWeight: highlight ? 700 : 600, display: "flex", alignItems: "center", gap: 8 }}>
        {name}
        {highlight && (
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: "var(--indigo)", background: "var(--indigo-soft)", borderRadius: 20, padding: "2px 7px" }}>
            YOU
          </span>
        )}
      </div>
      <div className="mono" style={{ flex: 1, color: "var(--muted)" }}>{range}</div>
      <div className="mono" style={{ flex: 1, fontWeight: 700 }}>{price}</div>
      <div style={{ flex: 1, textAlign: "right", color: save === "—" ? "#aeb4c0" : "var(--green)", fontWeight: 700 }}>{save}</div>
    </div>
  );
}

function Banner({ children, ok }: { children: React.ReactNode; ok?: boolean }) {
  return (
    <div
      style={{
        background: ok ? "var(--green-soft)" : "var(--amber-soft)",
        border: `1px solid ${ok ? "#c4e9d7" : "#f3e0bd"}`,
        color: ok ? "var(--green)" : "var(--amber)",
        borderRadius: 10,
        padding: "10px 13px",
        fontSize: 13,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}
