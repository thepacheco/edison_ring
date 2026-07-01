"use client";

/**
 * Click-to-apply suggestion chips. KeywordChips appends a keyword to a target
 * text input; TemplateChips fills a target textarea. Both target by element id
 * so they work alongside server-action forms with no extra state wiring.
 */

export function KeywordChips({ targetId, suggestions }: { targetId: string; suggestions: string[] }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
      <span style={{ fontSize: 11.5, color: "var(--faint)", alignSelf: "center" }}>Suggested:</span>
      {suggestions.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            const el = document.getElementById(targetId) as HTMLInputElement | null;
            if (!el) return;
            const cur = el.value.split(",").map((s) => s.trim()).filter(Boolean);
            if (!cur.includes(k)) cur.push(k);
            el.value = cur.join(", ");
          }}
          style={chip}
        >
          + {k}
        </button>
      ))}
    </div>
  );
}

export function TemplateChips({ targetId, templates }: { targetId: string; templates: { label: string; text: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
      <span style={{ fontSize: 11.5, color: "var(--faint)", alignSelf: "center" }}>Templates:</span>
      {templates.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={() => {
            const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
            if (el) el.value = t.text;
          }}
          style={chip}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

const chip: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  border: "1px solid var(--line)",
  background: "var(--card)",
  color: "var(--indigo)",
  borderRadius: 7,
  padding: "4px 9px",
  cursor: "pointer",
};
