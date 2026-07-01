import Link from "next/link";
import { resetPasswordAction } from "../actions";
import { AuthShell, Field, Err } from "@/components/AuthUI";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token || error === "invalid") {
    return (
      <AuthShell title="Link expired" subtitle="This reset link is invalid or has expired.">
        <Link
          href="/forgot"
          style={{ background: "var(--indigo)", color: "#fff", borderRadius: 11, padding: "13px", fontSize: 15, fontWeight: 700, textAlign: "center" }}
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password (at least 8 characters).">
      <form action={resetPasswordAction} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {error === "weak" && <Err msg="Password must be at least 8 characters." />}
        <input type="hidden" name="token" value={token} />
        <Field label="New password" name="password" type="password" placeholder="••••••••" required />
        <SubmitButton
          style={{ background: "var(--indigo)", color: "#fff", border: "none", borderRadius: 11, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
          pendingText="Updating…"
        >
          Update password
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
