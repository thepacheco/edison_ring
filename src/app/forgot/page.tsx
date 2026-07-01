import Link from "next/link";
import { requestResetAction } from "../actions";
import { AuthShell, Field } from "@/components/AuthUI";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure link to set a new one.">
      {sent ? (
        <div
          style={{
            background: "var(--green-soft)",
            border: "1px solid #c4e9d7",
            color: "var(--green)",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13.5,
          }}
        >
          ✓ If an account exists for that email, a reset link is on its way. Check
          your inbox (and spam).
        </div>
      ) : (
        <form action={requestResetAction} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <Field label="Work email" name="email" type="email" placeholder="owner@business.com" required />
          <SubmitButton
            style={{ background: "var(--indigo)", color: "#fff", border: "none", borderRadius: 11, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            pendingText="Sending…"
          >
            Send reset link
          </SubmitButton>
        </form>
      )}
      <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
        <Link href="/login" style={{ color: "var(--indigo)", fontWeight: 600 }}>
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
