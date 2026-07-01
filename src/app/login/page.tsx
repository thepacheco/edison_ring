import Link from "next/link";
import { loginAction } from "../actions";
import { AuthShell, Field, Err } from "@/components/AuthUI";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Edison dashboard">
      <form
        action={loginAction}
        style={{ display: "flex", flexDirection: "column", gap: 13 }}
      >
        {error && <Err msg="Incorrect email or password." />}
        <Field label="Work email" name="email" type="email" placeholder="owner@business.com" required />
        <Field label="Password" name="password" type="password" placeholder="••••••••" required />
        <button
          type="submit"
          style={{
            background: "var(--indigo)",
            color: "#fff",
            border: "none",
            borderRadius: 11,
            padding: "13px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          Log in →
        </button>
      </form>
      <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
        New to Edison?{" "}
        <Link href="/signup" style={{ color: "var(--indigo)", fontWeight: 600 }}>
          Start a free trial
        </Link>
      </p>
    </AuthShell>
  );
}
