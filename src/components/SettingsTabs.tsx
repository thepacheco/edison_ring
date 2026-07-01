import Link from "next/link";

const TABS = [
  { href: "/settings", label: "General" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/account", label: "Account" },
];

export function SettingsTabs({ active }: { active: string }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
      {TABS.map((t) => {
        const on = t.href === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              fontSize: 13.5,
              fontWeight: on ? 700 : 500,
              color: on ? "var(--ink)" : "var(--muted)",
              background: on ? "var(--card)" : "transparent",
              border: `1px solid ${on ? "var(--line)" : "transparent"}`,
              padding: "8px 15px",
              borderRadius: 10,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
