import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { updateSettingsAction, toggleWorkerAction } from "../actions";

export const dynamic = "force-dynamic";

interface Tone {
  greeting?: string;
  voice?: string;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const workers = await prisma.worker.findMany({
    where: { businessId: business!.id },
    orderBy: { routingOrder: "asc" },
  });
  const tone = (business!.aiToneSettings as Tone | null) ?? {};
  const hours = (business!.businessHours as Record<string, { open?: string; close?: string } | null> | null) ?? {};

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNav active="/settings" businessName={business!.name} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 64px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 4px" }}>
          Settings
        </h1>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--faint)" }}>
          {business!.name}
        </p>
        {saved && (
          <div
            style={{
              background: "var(--green-soft)",
              border: "1px solid #c4e9d7",
              color: "var(--green)",
              borderRadius: 10,
              padding: "10px 13px",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            ✓ Settings saved.
          </div>
        )}

        <form action={updateSettingsAction}>
          <Card>
            <Section
              title="Business hours"
              hint="When you're open. Edison still rescues after-hours calls."
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DAYS.map((d) => {
                  const v = hours[d.key];
                  return (
                    <div
                      key={d.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        padding: "11px 14px",
                        fontSize: 13.5,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{d.label}</span>
                      <span className="mono" style={{ color: "var(--muted)" }}>
                        {v?.open ? `${v.open} – ${v.close}` : "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section
              title="Worker routing"
              hint="Who gets booked jobs assigned to them."
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {ROUTES.map((r) => (
                  <label
                    key={r.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      border:
                        business!.routingMode === r.value
                          ? "2px solid var(--indigo)"
                          : "1px solid var(--line)",
                      background: business!.routingMode === r.value ? "#faf9ff" : "#fff",
                      borderRadius: 11,
                      padding: "12px 14px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="routingMode"
                      value={r.value}
                      defaultChecked={business!.routingMode === r.value}
                    />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: "var(--faint)" }}>{r.hint}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Section>

            <Section
              title="Average ticket"
              hint="Feeds the 'paid for itself' tracker."
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--line)",
                  borderRadius: 11,
                  padding: "10px 14px",
                  maxWidth: 200,
                }}
              >
                <span className="mono" style={{ fontSize: 18, color: "var(--faint)", marginRight: 4 }}>$</span>
                <input
                  name="avgTicketPrice"
                  defaultValue={Number(business!.avgTicketPrice).toFixed(0)}
                  className="mono"
                  style={{ border: "none", outline: "none", fontSize: 18, fontWeight: 700, width: "100%" }}
                />
              </div>
            </Section>

            <Section
              title="Auto-text wording"
              hint="The first message Edison sends. Keep it sounding like you. Use {business} for your name."
            >
              <textarea
                name="greeting"
                defaultValue={tone.greeting || ""}
                placeholder="Hi, this is Edison with {business} 👋 Sorry we missed your call! What can we help with?"
                rows={3}
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: 11,
                  padding: "12px 14px",
                  fontSize: 13.5,
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {["friendly", "professional", "brief"].map((v) => (
                  <label
                    key={v}
                    style={{
                      fontSize: 12,
                      borderRadius: 7,
                      padding: "6px 11px",
                      border: "1px solid var(--line)",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    <input
                      type="radio"
                      name="voice"
                      value={v}
                      defaultChecked={(tone.voice || "friendly") === v}
                      style={{ marginRight: 6 }}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </Section>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 6 }}>
              <button
                type="submit"
                style={{
                  background: "var(--ink)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 22px",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save changes
              </button>
            </div>
          </Card>
        </form>

        {/* call-out / backup mode (per worker) */}
        <div style={{ marginTop: 18 }}>
          <Card>
            <Section
              title="Call-out / backup mode"
              hint="Mark a worker out today and their jobs route to backup."
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {workers.length === 0 && (
                  <div style={{ fontSize: 13, color: "var(--faint)" }}>
                    No workers yet. All jobs route to the owner.
                  </div>
                )}
                {workers.map((w) => (
                  <form
                    key={w.id}
                    action={toggleWorkerAction}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1px solid var(--line)",
                      borderRadius: 11,
                      padding: "11px 14px",
                    }}
                  >
                    <input type="hidden" name="workerId" value={w.id} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{w.name}</div>
                      <div style={{ fontSize: 12, color: "var(--faint)" }}>
                        {w.isAvailable ? "Available" : "Out — routing to backup"}
                      </div>
                    </div>
                    <button
                      type="submit"
                      style={{
                        border: "none",
                        cursor: "pointer",
                        borderRadius: 20,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        background: w.isAvailable ? "var(--green-soft)" : "var(--amber-soft)",
                        color: w.isAvailable ? "var(--green)" : "var(--amber)",
                      }}
                    >
                      {w.isAvailable ? "Mark out" : "Mark available"}
                    </button>
                  </form>
                ))}
              </div>
            </Section>
          </Card>
        </div>
      </div>
    </main>
  );
}

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const ROUTES = [
  { value: "round_robin", label: "Round robin", hint: "Spread jobs evenly across the crew" },
  { value: "keyword", label: "By keyword", hint: "Match the customer's words to a worker's specialty" },
  { value: "always_to_owner", label: "Always to me", hint: "Every job comes to the owner" },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: "8px 24px 20px",
      }}
    >
      {children}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "20px 0",
        borderBottom: "1px solid #f4f5f8",
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ width: 180, flex: "none" }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 3, lineHeight: 1.5 }}>
          {hint}
        </div>
      </div>
      <div style={{ flex: "1 1 280px", minWidth: 0 }}>{children}</div>
    </div>
  );
}
