"use client";

import { useState } from "react";
import { labelStyle, inputStyle } from "./AuthUI";

/**
 * Password input with a show/hide toggle, required + minLength=8 (with a visible
 * hint), for signup and reset. Purely presentational — the server action still
 * re-validates.
 */
export function PasswordField({
  name,
  label,
  placeholder = "••••••••",
  hint,
}: {
  name: string;
  label: string;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label style={labelStyle}>
      <span>
        {label}
        <span style={{ color: "var(--indigo)" }}> *</span>
      </span>
      <div style={{ position: "relative" }}>
        <input
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          required
          minLength={8}
          style={{ ...inputStyle, width: "100%", paddingRight: 58 }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "var(--indigo)",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            padding: 4,
          }}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint && <span style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 500 }}>{hint}</span>}
    </label>
  );
}
