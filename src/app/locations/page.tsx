import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/auth";
import { getLocationsData } from "@/lib/locations";
import { AppNav } from "@/components/AppNav";
import { LocationMap } from "@/components/LocationMap";
import { Toast } from "@/components/Toast";
import { addLocationAction, provisionLocationNumberAction, removeLocationAction } from "../actions";

export const dynamic = "force-dynamic";

const MSG: Record<string, { text: string; kind: "ok" | "error" }> = {
  added: { text: "Location added and number provisioned.", kind: "ok" },
  added_pending: { text: "Location added — provision a number when Twilio is connected.", kind: "ok" },
  provisioned: { text: "Number provisioned.", kind: "ok" },
  removed: { text: "Location removed.", kind: "ok" },
  missing: { text: "Enter a location name.", kind: "error" },
  twilio_unconfigured: { text: "Twilio isn't configured yet.", kind: "error" },
  provision_failed: { text: "Couldn't provision a number — try a different area code.", kind: "error" },
};

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const data = await getLocationsData();
  const key = sp.saved || sp.error;
  const toast = key ? MSG[key] : null;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {toast && <Toast text={toast.text} kind={toast.kind} />}
      <AppNav active="/locations" businessName={business!.name} />
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px 64px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 4px" }}>Locations</h1>
        <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--faint)" }}>
          Each location gets its own number. See the whole fleet at a glance.
        </p>
        {data.demo && (
          <div className="mono" style={{ fontSize: 11.5, color: "var(--amber)", background: "var(--amber-soft)", border: "1px solid #f3e0bd", borderRadius: 8, padding: "6px 12px", marginBottom: 16, display: "inline-block" }}>
            sample data — add your locations below
          </div>
        )}

        {/* combined + map */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
          <Combined label="Locations" value={String(data.locations.length || DEMO_COUNT(data))} />
          <Combined label="Leads this month" value={String(data.combined.leads)} />
          <Combined label="Booked" value={String(data.combined.booked)} />
          <Combined label="Recovered" value={`$${data.combined.recovered.toLocaleString()}`} accent />
        </div>

        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: 14, marginBottom: 16 }}>
          <LocationMap
            token={token}
            points={data.locations.map((l) => ({ id: l.id, name: l.name, latitude: l.latitude, longitude: l.longitude, leads: l.leads, booked: l.booked, recovered: l.recovered }))}
          />
        </div>

        {/* per-location breakdown */}
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line-soft)", fontWeight: 700, fontSize: 15 }}>
            Per-location breakdown
          </div>
          {data.locations.length === 0 && (
            <div style={{ padding: "24px 18px", fontSize: 14, color: "var(--faint)" }}>
              No locations yet. Add your first below — the primary business number counts as location #1.
            </div>
          )}
          {data.locations.map((l, i) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i === data.locations.length - 1 ? "none" : "1px solid var(--line-soft)", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                  {l.name}
                  {l.isPrimary && <span className="mono" style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "var(--indigo)", background: "var(--indigo-soft)", borderRadius: 20, padding: "2px 7px" }}>PRIMARY</span>}
                  {!l.provisioned && <span className="mono" style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "var(--amber)", background: "var(--amber-soft)", borderRadius: 20, padding: "2px 7px" }}>NO NUMBER</span>}
                </div>
                <div className="mono" style={{ fontSize: 12, color: "var(--faint)" }}>
                  {l.provisioned ? l.twilioNumber : "not provisioned"}{l.address ? ` · ${l.address}` : ""}
                </div>
              </div>
              <Stat label="Leads" value={l.leads} />
              <Stat label="Booked" value={l.booked} />
              <Stat label="Recovered" value={`$${l.recovered.toLocaleString()}`} green />
              {!data.demo && (
                <div style={{ display: "flex", gap: 6 }}>
                  {!l.provisioned && (
                    <form action={provisionLocationNumberAction}>
                      <input type="hidden" name="locationId" value={l.id} />
                      <button type="submit" style={miniBtn}>Provision #</button>
                    </form>
                  )}
                  {!l.isPrimary && (
                    <form action={removeLocationAction}>
                      <input type="hidden" name="locationId" value={l.id} />
                      <button type="submit" style={{ ...miniBtn, color: "#c0453f", borderColor: "#f0cccc" }}>Remove</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* add location */}
        <div style={{ marginTop: 16, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Add a location</div>
          <form action={addLocationAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Inp name="name" placeholder="Location name (e.g. Eastside)" />
              <Inp name="areaCode" placeholder="Area code (e.g. 425)" />
            </div>
            <Inp name="address" placeholder="Address (optional)" wide />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Inp name="latitude" placeholder="Latitude (optional, for map)" />
              <Inp name="longitude" placeholder="Longitude (optional, for map)" />
            </div>
            <button type="submit" style={{ alignSelf: "flex-start", background: "var(--ink)", color: "var(--ink-invert)", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
              Add location &amp; provision number
            </button>
            <div style={{ fontSize: 12, color: "var(--faint)" }}>
              A dedicated Twilio number is provisioned automatically (or flagged to provision later if Twilio isn&apos;t connected).
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function DEMO_COUNT(d: { locations: unknown[] }) {
  return d.locations.length;
}

function Combined({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ flex: "1 1 150px", background: accent ? "var(--green-soft)" : "var(--card)", border: `1px solid ${accent ? "#c4e9d7" : "var(--line)"}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: accent ? "var(--green)" : "var(--faint)", fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 3, color: accent ? "var(--green)" : "var(--ink)" }}>{value}</div>
    </div>
  );
}

function Stat({ label, value, green }: { label: string; value: string | number; green?: boolean }) {
  return (
    <div style={{ textAlign: "right", minWidth: 64 }}>
      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: green ? "var(--green)" : "var(--ink)" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "var(--faint)" }}>{label}</div>
    </div>
  );
}

function Inp({ name, placeholder, wide }: { name: string; placeholder: string; wide?: boolean }) {
  return (
    <input name={name} placeholder={placeholder} style={{ flex: wide ? "1 1 100%" : "1 1 180px", minWidth: 0, border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)" }} />
  );
}

const miniBtn: React.CSSProperties = { border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)", borderRadius: 8, padding: "7px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer" };
