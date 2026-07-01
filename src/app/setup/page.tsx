import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { SetupWizard } from "@/components/SetupWizard";
import { CARRIERS } from "@/lib/carriers";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNav active="/setup" businessName={business!.name} />
      <div style={{ padding: "32px 20px 64px" }}>
        <div style={{ maxWidth: 460, margin: "0 auto 18px", textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 6px" }}>
            Connect your phone
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--faint)" }}>
            Three steps. Most owners finish in under five minutes.
          </p>
        </div>
        <SetupWizard
          carriers={CARRIERS}
          edisonNumber={business!.twilioNumber}
          initialCarrierId={business!.carrier}
          initialConfirmed={business!.setupCompleted}
        />
      </div>
    </main>
  );
}
