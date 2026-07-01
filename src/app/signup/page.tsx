import Link from "next/link";
import { signupAction } from "../actions";
import { PLANS } from "@/lib/pricing";
import { AuthShell, Field, Err, labelStyle, inputStyle, primaryBtn } from "@/components/AuthUI";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Start your free 14-day trial" subtitle="No app to install · cancel anytime">
      <form action={signupAction} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {error && (
          <Err
            msg={
              error === "exists"
                ? "An account with that email already exists."
                : error === "email"
                ? "Enter a valid email address."
                : error === "weak_password"
                ? "Password must be at least 8 characters."
                : "Please fill in all required fields."
            }
          />
        )}
        <Field label="Business name" name="businessName" placeholder="Rivera Comfort HVAC" required />
        <Field label="Work email" name="email" type="email" placeholder="owner@business.com" required />
        <Field label="Password" name="password" type="password" placeholder="••••••••" required />
        <Field label="Business phone" name="phoneNumber" placeholder="(206) 555-0100" />
        <label style={labelStyle}>
          Plan
          <select name="plan" defaultValue="standard" style={inputStyle}>
            {Object.values(PLANS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ${p.monthly}/mo · {p.includedConversations} conversations
              </option>
            ))}
          </select>
        </label>
        <button type="submit" style={primaryBtn}>
          Create account →
        </button>
        <p style={{ fontSize: 11.5, color: "var(--faint)", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
          By creating an account you agree to our{" "}
          <Link href="/terms" style={{ color: "var(--indigo)" }}>Terms</Link> and{" "}
          <Link href="/privacy" style={{ color: "var(--indigo)" }}>Privacy Policy</Link>.
          You confirm you&apos;re authorized to text the customers who call your
          business. Callers can reply STOP to opt out; msg &amp; data rates may apply.
        </p>
      </form>
      <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--indigo)", fontWeight: 600 }}>
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
