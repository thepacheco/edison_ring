import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/conversations", label: "Conversations" },
  { href: "/reports", label: "Reports" },
  { href: "/setup", label: "Setup" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export function AppNav({
  active,
  businessName,
}: {
  active: string;
  businessName: string;
}) {
  const initials = businessName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <header
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        background: "var(--card)",
        borderBottom: "1px solid var(--line-soft)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            className="mono"
            style={{
              width: 27,
              height: 27,
              borderRadius: 7,
              background: "var(--indigo)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            E
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-.02em" }}>
            Edison
          </span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {LINKS.map((l) => {
            const on = l.href === active;
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 13.5,
                  fontWeight: on ? 600 : 500,
                  color: on ? "var(--ink)" : "var(--muted)",
                  background: on ? "#f2f1fe" : "transparent",
                  padding: "7px 13px",
                  borderRadius: 8,
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ThemeToggle />
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </form>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--ink)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={businessName}
        >
          {initials || "ED"}
        </div>
      </div>
    </header>
  );
}
