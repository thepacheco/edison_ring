import { AuthShell, Field, Err } from "@/components/AuthUI";
import { adminLoginAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Admin access" subtitle="CEO cockpit — Edison internal">
      <form action={adminLoginAction} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {error && <Err msg="Incorrect password." />}
        <Field label="Admin password" name="password" type="password" placeholder="••••••••" required />
        <button
          type="submit"
          style={{
            background: "var(--ink)",
            color: "#fff",
            border: "none",
            borderRadius: 11,
            padding: "13px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Enter
        </button>
      </form>
      <p style={{ fontSize: 12, color: "var(--faint)", textAlign: "center" }}>
        Set ADMIN_PASSWORD in the environment to enable access.
      </p>
    </AuthShell>
  );
}
