"use client";

import { useEffect } from "react";

/**
 * Top-level error boundary. Replaces the root layout when an error is thrown in
 * the layout itself, so it must render its own <html>/<body>. Uses inline colors
 * (theme CSS variables may be unavailable here).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#0f1117", color: "#e7e9ef" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 440 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: "#7c6cff",
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
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "12px 0 8px" }}>
              Something went wrong.
            </h1>
            <p style={{ fontSize: 15, color: "#9aa3b2", margin: "0 0 24px", lineHeight: 1.55 }}>
              We hit an unexpected error. Please try again.
            </p>
            {error?.digest && (
              <p style={{ fontSize: 11.5, color: "#6b7280", margin: "0 0 20px" }}>ref: {error.digest}</p>
            )}
            <button
              onClick={reset}
              style={{ background: "#7c6cff", color: "#fff", padding: "12px 22px", borderRadius: 11, fontWeight: 700, fontSize: 14.5, border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
