import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { SettingsTabs } from "@/components/SettingsTabs";
import { Toast } from "@/components/Toast";
import { updateProfileAction, changePasswordAction } from "../../actions";

export const dynamic = "force-dynamic";

const MSG: Record<string, { text: string; kind: "ok" | "error" }> = {
  "1": { text: "Profile updated.", kind: "ok" },
  pw: { text: "Password changed.", kind: "ok" },
  email_taken: { text: "That email is already in use.", kind: "error" },
  wrong_password: { text: "Current password is incorrect.", kind: "error" },
  weak_password: { text: "New password must be at least 8 characters.", kind: "error" },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const key = sp.saved || sp.error;
  const toast = key ? MSG[key] : null;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {toast && <Toast text={toast.text} kind={toast.kind} />}
      <AppNav active="/settings" businessName={me!.business.name} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 64px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 14px" }}>
          Settings
        </h1>
        <SettingsTabs active="/settings/account" />

        <Card>
          <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>Your profile</h2>
          <form action={updateProfileAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input name="name" label="Name" defaultValue={me!.name} />
            <Input name="email" type="email" label="Email" defaultValue={me!.email} />
            <button type="submit" style={saveBtn}>Save profile</button>
          </form>
        </Card>

        <div style={{ marginTop: 16 }}>
          <Card>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>Change password</h2>
            <form action={changePasswordAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input name="current" type="password" label="Current password" placeholder="••••••••" />
              <Input name="next" type="password" label="New password (8+)" placeholder="••••••••" />
              <button type="submit" style={saveBtn}>Update password</button>
            </form>
          </Card>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 14 }}>
          Signed in as <b>{me!.name}</b> · role: {me!.role}
        </p>
      </div>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px" }}>
      {children}
    </div>
  );
}
function Input({ name, label, type = "text", placeholder, defaultValue }: { name: string; label: string; type?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, maxWidth: 360 }}>
      {label}
      <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "11px 13px", fontSize: 14, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)" }} />
    </label>
  );
}
const saveBtn: React.CSSProperties = { alignSelf: "flex-start", background: "var(--ink)", color: "var(--ink-invert)", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" };
