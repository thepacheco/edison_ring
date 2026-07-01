"use client";

import { useEffect, useState } from "react";

/** Transient pop-up notification. Auto-dismisses; also manually dismissible. */
export function Toast({
  text,
  kind = "ok",
}: {
  text: string;
  kind?: "ok" | "error";
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
    const t = setTimeout(() => setOpen(false), 4500);
    return () => clearTimeout(t);
  }, [text]);

  if (!open || !text) return null;

  const ok = kind === "ok";
  return (
    <div
      role="status"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: ok ? "var(--green)" : "#c0453f",
        color: "#fff",
        padding: "11px 18px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 16px 40px -12px rgba(0,0,0,.4)",
        cursor: "pointer",
        maxWidth: "90vw",
      }}
    >
      <span>{ok ? "✓" : "⚠︎"}</span>
      <span>{text}</span>
    </div>
  );
}
