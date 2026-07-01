"use client";

import { useEffect, useState } from "react";

/** Light/dark toggle. Persists to a cookie (SSR no-flash) + localStorage. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as "light" | "dark") || "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    document.cookie = `theme=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        border: "1px solid var(--line)",
        background: "var(--card)",
        color: "var(--muted)",
        cursor: "pointer",
        fontSize: 15,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {theme === "dark" ? "☀︎" : "☾"}
    </button>
  );
}
