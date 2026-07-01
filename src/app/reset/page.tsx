import Link from "next/link";
import { resetPasswordAction } from "../actions";
import { AuthShell, Err } from "@/components/AuthUI";
import { SubmitButton } from "@/components/SubmitButton";
import { PasswordField } from "@/components/PasswordField";

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
        {error === "mismatch" && <Err msg="The two passwords don't match." />}
        <input type="hidden" name="token" value={token} />
        <PasswordField name="password" label="New password" hint="At least 8 characters." />
        <PasswordField name="confirm" label="Confirm new password" hint="Type it again to be sure." />
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
