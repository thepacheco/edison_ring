import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ScenarioTool } from "@/components/ScenarioTool";

export const dynamic = "force-dynamic";

/**
 * Private founder-only financial model. Gated behind the admin session (same as
 * the CEO cockpit). All computation happens client-side in <ScenarioTool />.
 */
export default async function ModelPage() {
  if (!(await isAdmin())) redirect("/admin/login");

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
          <span style={{ fontWeight: 800, fontSize: 15 }}>Edison · Scenario model</span>
        </div>
        <Link href="/admin" style={{ fontSize: 13, color: "#9aa3b2" }}>
          ← CEO cockpit
        </Link>
      </header>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 64px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>Financial scenario model</h1>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "#8a93a3", maxWidth: 620 }}>
          Drag the sliders to pressure-test pricing, growth, churn and COGS. Everything runs in your
          browser — nothing is saved. Numbers are estimates, not accounting.
        </p>
        <ScenarioTool />
      </div>
    </main>
  );
}
