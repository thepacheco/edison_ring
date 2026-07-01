"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that shows a spinner + disables itself while the form's server
 * action is running. Drop-in replacement for a plain <button type="submit"> —
 * gives every form real "working…" feedback instead of a dead click. Must be
 * rendered inside a <form>.
 */
export function SubmitButton({
  children,
  pendingText,
  style,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      style={{ ...style, opacity: pending ? 0.75 : 1 }}
    >
      {pending ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className="spinner" />
          {pendingText ?? "Working…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
