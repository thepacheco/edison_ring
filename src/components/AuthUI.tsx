import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: "1px solid var(--line)",
          borderRadius: 18,
          boxShadow: "0 30px 70px -30px rgba(20,24,33,.28)",
          padding: "32px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div className="mono" style={logoStyle}>
            E
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-.02em" }}>
            Edison
          </span>
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--faint)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </main>
  );
}

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label style={labelStyle}>
      {label}
      {required ? <span style={{ color: "var(--indigo)" }}> *</span> : null}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        style={inputStyle}
      />
    </label>
  );
}

export function Err({ msg }: { msg: string }) {
  return (
    <div
      style={{
        background: "#fdecec",
        border: "1px solid #f3c4c4",
        color: "#b23b3b",
        borderRadius: 10,
        padding: "10px 13px",
        fontSize: 13,
      }}
    >
      {msg}
    </div>
  );
}

export const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink)",
};
export const inputStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 10,
  padding: "11px 13px",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "inherit",
};
export const primaryBtn: React.CSSProperties = {
  background: "var(--indigo)",
  color: "#fff",
  border: "none",
  borderRadius: 11,
  padding: "13px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 4,
};
const logoStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 7,
  background: "var(--indigo)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
