"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-segment error boundary. Catches runtime errors in a page/segment and
 * shows a branded fallback instead of an unstyled crash. `reset` retries the
 * segment render.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the server/console for monitoring. Wire to Sentry etc. here.
    console.error("Route error:", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div
          className="mono"
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: "var(--indigo)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          E
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: "12px 0 8px" }}>
          Something went wrong on our end.
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 24px", lineHeight: 1.55 }}>
          This one&apos;s on us, not you. Try again — if it keeps happening, reach
          out from the contact page and we&apos;ll dig in.
        </p>
        {error?.digest && (
          <p className="mono" style={{ fontSize: 11.5, color: "var(--faint)", margin: "0 0 20px" }}>
            ref: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{ background: "var(--indigo)", color: "#fff", padding: "12px 22px", borderRadius: 11, fontWeight: 700, fontSize: 14.5, border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
          <Link href="/dashboard" style={{ border: "1px solid var(--line)", background: "var(--card)", padding: "12px 22px", borderRadius: 11, fontWeight: 600, fontSize: 14.5 }}>
            My dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
