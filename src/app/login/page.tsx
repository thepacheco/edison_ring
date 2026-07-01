import Link from "next/link";
import { loginAction } from "../actions";
import { AuthShell, Field, Err } from "@/components/AuthUI";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Edison dashboard">
      <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {reset && (
          <div style={{ background: "var(--green-soft)", border: "1px solid #c4e9d7", color: "var(--green)", borderRadius: 10, padding: "10px 13px", fontSize: 13 }}>
            ✓ Password updated — log in with your new password.
          </div>
        )}
        {error && <Err msg="Incorrect email or password." />}
        <Field label="Work email" name="email" type="email" placeholder="owner@business.com" required />
        <Field label="Password" name="password" type="password" placeholder="••••••••" required />
        <SubmitButton
          style={{ background: "var(--indigo)", color: "#fff", border: "none", borderRadius: 11, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
          pendingText="Logging in…"
        >
          Log in →
        </SubmitButton>
      </form>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <Link href="/forgot" style={{ color: "var(--muted)" }}>Forgot password?</Link>
        <Link href="/signup" style={{ color: "var(--indigo)", fontWeight: 600 }}>Start a free trial</Link>
      </div>
    </AuthShell>
  );
}
