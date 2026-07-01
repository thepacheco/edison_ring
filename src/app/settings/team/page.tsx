import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { SettingsTabs } from "@/components/SettingsTabs";
import { Toast } from "@/components/Toast";
import { addUserAction, updateUserAction, removeUserAction } from "../../actions";

export const dynamic = "force-dynamic";

const MSG: Record<string, { text: string; kind: "ok" | "error" }> = {
  added: { text: "Team member added.", kind: "ok" },
  updated: { text: "Team member updated.", kind: "ok" },
  removed: { text: "Team member removed.", kind: "ok" },
  email_taken: { text: "That email is already in use.", kind: "error" },
  missing: { text: "Fill in name, email, and an 8+ char password.", kind: "error" },
  forbidden: { text: "Only owners can manage the team.", kind: "error" },
  self: { text: "You can't remove yourself.", kind: "error" },
  last_owner: { text: "You can't remove the last owner.", kind: "error" },
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const users = await prisma.user.findMany({
    where: { businessId: me!.businessId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  const isOwner = me!.role === "owner";
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
        <SettingsTabs active="/settings/team" />

        <Card>
          <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800 }}>Team members</h2>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--faint)" }}>
            People who can log in to this Edison account.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {users.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {u.name}
                    {u.id === me!.id && <span style={{ color: "var(--faint)", fontWeight: 500 }}> (you)</span>}
                    {u.isTest && (
                      <span className="mono" style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: "var(--amber)", background: "var(--amber-soft)", borderRadius: 20, padding: "2px 7px" }}>
                        TEST
                      </span>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--faint)" }}>{u.email}</div>
                </div>
                {isOwner && u.id !== me!.id ? (
                  <form action={updateUserAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="name" value={u.name} />
                    <select name="role" defaultValue={u.role} style={select}>
                      <option value="staff">Staff</option>
                      <option value="owner">Owner</option>
                    </select>
                    <button type="submit" style={ghostBtn}>Save</button>
                  </form>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--indigo)", background: "var(--indigo-soft)", borderRadius: 20, padding: "4px 11px", textTransform: "capitalize" }}>
                    {u.role}
                  </span>
                )}
                {isOwner && u.id !== me!.id && (
                  <form action={removeUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" style={{ ...ghostBtn, color: "#c0453f", borderColor: "#f0cccc" }}>Remove</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </Card>

        {isOwner ? (
          <div style={{ marginTop: 16 }}>
            <Card>
              <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>Add a team member</h2>
              <form action={addUserAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Input name="name" label="Name" placeholder="Theo Alvarez" />
                  <Input name="email" type="email" label="Email" placeholder="theo@business.com" />
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <Input name="password" type="password" label="Temp password (8+)" placeholder="••••••••" />
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, flex: "1 1 140px" }}>
                    Role
                    <select name="role" defaultValue="staff" style={{ ...select, height: 42 }}>
                      <option value="staff">Staff</option>
                      <option value="owner">Owner</option>
                    </select>
                  </label>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
                  <input type="checkbox" name="isTest" /> Mark as a test / dummy user (for trying things out)
                </label>
                <button type="submit" style={{ alignSelf: "flex-start", background: "var(--ink)", color: "var(--ink-invert)", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
                  Add member
                </button>
              </form>
            </Card>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--faint)", marginTop: 14 }}>
            Only owners can add or remove team members.
          </p>
        )}
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
function Input({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, flex: "1 1 160px" }}>
      {label}
      <input name={name} type={type} placeholder={placeholder} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", fontSize: 14, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)" }} />
    </label>
  );
}
const select: React.CSSProperties = { border: "1px solid var(--line)", borderRadius: 9, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", background: "var(--card)", color: "var(--ink)" };
const ghostBtn: React.CSSProperties = { border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)", borderRadius: 9, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
