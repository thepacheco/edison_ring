import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { SettingsTabs } from "@/components/SettingsTabs";
import { SubmitButton } from "@/components/SubmitButton";
import {
  updateSettingsAction,
  toggleWorkerAction,
  addWorkerAction,
  updateWorkerAction,
  removeWorkerAction,
} from "../actions";

export const dynamic = "force-dynamic";

interface Tone {
  greeting?: string;
  voice?: string;
}

const SUBTABS = [
  { key: "business", label: "Business" },
  { key: "messaging", label: "Messaging" },
  { key: "crew", label: "Team & routing" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; tab?: string }>;
}) {
  const { saved, tab } = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const active = SUBTABS.find((t) => t.key === tab)?.key ?? "business";
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
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 4px" }}>Settings</h1>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--faint)" }}>{business!.name}</p>
        <SettingsTabs active="/settings" />

        {/* sub-tabs */}
        <div style={{ display: "inline-flex", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 11, padding: 3, marginBottom: 16, flexWrap: "wrap" }}>
          {SUBTABS.map((t) => (
            <a
              key={t.key}
              href={`/settings?tab=${t.key}`}
              style={{
                fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 8,
                background: t.key === active ? "var(--indigo)" : "transparent",
                color: t.key === active ? "#fff" : "var(--muted)",
              }}
            >
              {t.label}
            </a>
          ))}
        </div>

        {saved && (
          <div style={{ background: "var(--green-soft)", border: "1px solid #c4e9d7", color: "var(--green)", borderRadius: 10, padding: "10px 13px", fontSize: 13, marginBottom: 16 }}>
            ✓ Saved.
          </div>
        )}

        {/* ---- BUSINESS ---- */}
        {active === "business" && (
          <Card>
            <Section title="Business hours" hint="When you're open. Edison still rescues after-hours calls.">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DAYS.map((d) => {
                  const v = hours[d.key];
                  return (
                    <div key={d.key} style={{ display: "flex", justifyContent: "space-between", border: "1px solid var(--line)", borderRadius: 10, padding: "11px 14px", fontSize: 13.5 }}>
                      <span style={{ fontWeight: 600 }}>{d.label}</span>
                      <span className="mono" style={{ color: "var(--muted)" }}>{v?.open ? `${v.open} – ${v.close}` : "Closed"}</span>
                    </div>
                  );
                })}
              </div>
            </Section>
            <form action={updateSettingsAction}>
              <input type="hidden" name="tab" value="business" />
              <Section title="Average ticket" hint="Feeds the 'paid for itself' tracker and the calendar's recovered totals.">
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: 11, padding: "10px 14px", maxWidth: 200 }}>
                  <span className="mono" style={{ fontSize: 18, color: "var(--faint)", marginRight: 4 }}>$</span>
                  <input name="avgTicketPrice" defaultValue={Number(business!.avgTicketPrice).toFixed(0)} className="mono" style={{ border: "none", outline: "none", fontSize: 18, fontWeight: 700, width: "100%", background: "transparent", color: "var(--ink)" }} />
                </div>
              </Section>
              <SaveRow />
            </form>
          </Card>
        )}

        {/* ---- MESSAGING ---- */}
        {active === "messaging" && (
          <Card>
            <form action={updateSettingsAction}>
              <input type="hidden" name="tab" value="messaging" />
              <Section title="Auto-text wording" hint="The first message Edison sends. Keep it sounding like you. Use {business} for your name.">
                <textarea
                  name="greeting"
                  defaultValue={tone.greeting || ""}
                  placeholder="Hi, this is {business} 👋 Sorry we missed your call! What can we help with?"
                  rows={3}
                  style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 11, padding: "12px 14px", fontSize: 13.5, fontFamily: "inherit", lineHeight: 1.5, resize: "vertical", background: "var(--card)", color: "var(--ink)" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {["friendly", "professional", "brief"].map((v) => (
                    <label key={v} style={{ fontSize: 12, borderRadius: 7, padding: "6px 11px", border: "1px solid var(--line)", cursor: "pointer", textTransform: "capitalize" }}>
                      <input type="radio" name="voice" value={v} defaultChecked={(tone.voice || "friendly") === v} style={{ marginRight: 6 }} />
                      {v}
                    </label>
                  ))}
                </div>
              </Section>
              <SaveRow />
            </form>
          </Card>
        )}

        {/* ---- TEAM & ROUTING ---- */}
        {active === "crew" && (
          <>
            <Card>
              <form action={updateSettingsAction}>
                <input type="hidden" name="tab" value="crew" />
                <Section title="Worker routing" hint="Who gets booked jobs assigned to them.">
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {ROUTES.map((r) => (
                      <label key={r.value} style={{ display: "flex", alignItems: "center", gap: 11, border: business!.routingMode === r.value ? "2px solid var(--indigo)" : "1px solid var(--line)", background: business!.routingMode === r.value ? "var(--indigo-soft)" : "var(--card)", borderRadius: 11, padding: "12px 14px", cursor: "pointer" }}>
                        <input type="radio" name="routingMode" value={r.value} defaultChecked={business!.routingMode === r.value} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.label}</div>
                          <div style={{ fontSize: 12, color: "var(--faint)" }}>{r.hint}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </Section>
                <SaveRow />
              </form>
            </Card>

            <div style={{ marginTop: 16 }}>
              <Card>
                <Section title="Call-out / backup" hint="Mark a worker out today and their jobs route to backup.">
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {workers.length === 0 && <div style={{ fontSize: 13, color: "var(--faint)" }}>No workers yet. All jobs route to the owner.</div>}
                    {workers.map((w) => (
                      <form key={w.id} action={toggleWorkerAction} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--line)", borderRadius: 11, padding: "11px 14px" }}>
                        <input type="hidden" name="workerId" value={w.id} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{w.name}</div>
                          <div style={{ fontSize: 12, color: "var(--faint)" }}>{w.isAvailable ? "Available" : "Out — routing to backup"}</div>
                        </div>
                        <button type="submit" style={{ border: "none", cursor: "pointer", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, background: w.isAvailable ? "var(--green-soft)" : "var(--amber-soft)", color: w.isAvailable ? "var(--green)" : "var(--amber)" }}>
                          {w.isAvailable ? "Mark out" : "Mark available"}
                        </button>
                      </form>
                    ))}
                  </div>
                </Section>
              </Card>
            </div>

            <div id="workers" style={{ marginTop: 16 }}>
              <Card>
                <Section title="Workers" hint="Field techs jobs route to. Set keywords (for keyword routing) and a backup for call-outs.">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {workers.length === 0 && <div style={{ fontSize: 13, color: "var(--faint)" }}>No workers yet — all jobs route to the owner. Add your crew below.</div>}
                    {workers.map((w) => (
                      <form key={w.id} action={updateWorkerAction} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
                        <input type="hidden" name="workerId" value={w.id} />
                        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                          <WInput name="name" placeholder="Name" defaultValue={w.name} />
                          <WInput name="phoneNumber" placeholder="Phone" defaultValue={w.phoneNumber} />
                        </div>
                        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
                          <WInput name="keywords" placeholder="keywords: drain, furnace" defaultValue={w.keywords.join(", ")} />
                          <select name="backupWorkerId" defaultValue={w.backupWorkerId ?? ""} style={wSelect}>
                            <option value="">No backup</option>
                            {workers.filter((o) => o.id !== w.id).map((o) => (<option key={o.id} value={o.id}>Backup: {o.name}</option>))}
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 11.5, color: w.isAvailable ? "var(--green)" : "var(--amber)", fontWeight: 600 }}>{w.isAvailable ? "● Available" : "● Out (routing to backup)"}</span>
                          <button type="submit" style={{ ...wBtn, marginLeft: "auto" }}>Save</button>
                          <button type="submit" formAction={removeWorkerAction} style={{ ...wBtn, color: "#c0453f", borderColor: "#f0cccc" }}>Remove</button>
                        </div>
                      </form>
                    ))}
                  </div>
                  <form action={addWorkerAction} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9, borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Add a worker</div>
                    <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                      <WInput name="name" placeholder="Name" />
                      <WInput name="phoneNumber" placeholder="Phone" />
                      <WInput name="keywords" placeholder="keywords: drain, furnace" />
                    </div>
                    <button type="submit" style={{ ...wBtn, alignSelf: "flex-start", background: "var(--ink)", color: "var(--ink-invert)", border: "none" }}>Add worker</button>
                  </form>
                </Section>
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SaveRow() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 14 }}>
      <SubmitButton pendingText="Saving…" style={{ background: "var(--ink)", color: "var(--ink-invert)", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
        Save changes
      </SubmitButton>
    </div>
  );
}

const wSelect: React.CSSProperties = { border: "1px solid var(--line)", borderRadius: 9, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)", flex: "1 1 160px" };
const wBtn: React.CSSProperties = { border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)", borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };

function WInput({ name, placeholder, defaultValue }: { name: string; placeholder: string; defaultValue?: string }) {
  return (
    <input name={name} placeholder={placeholder} defaultValue={defaultValue} style={{ flex: "1 1 150px", minWidth: 0, border: "1px solid var(--line)", borderRadius: 9, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)" }} />
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
  return <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "8px 24px 20px" }}>{children}</div>;
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "20px 0", borderBottom: "1px solid var(--line-soft)", display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div style={{ width: 180, flex: "none" }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 3, lineHeight: 1.5 }}>{hint}</div>
      </div>
      <div style={{ flex: "1 1 280px", minWidth: 0 }}>{children}</div>
    </div>
  );
}
