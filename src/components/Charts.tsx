/**
 * Lightweight charts built from SVG + flex — no chart library, no client JS.
 * Safe to render inside server components. Colors come from theme CSS vars.
 */

export interface Pt {
  label: string;
  value: number;
}

/** Area + line trend chart. Stretches to fill width; stroke stays crisp. */
export function AreaTrend({
  points,
  height = 130,
  stroke = "var(--indigo)",
  gradId = "areaGrad",
  format = (n: number) => String(n),
}: {
  points: Pt[];
  height?: number;
  stroke?: string;
  gradId?: string;
  format?: (n: number) => string;
}) {
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.value));
  const W = 100;
  const H = 40;
  const coords = points.map((p, i) => {
    const x = n === 1 ? W / 2 : (i / (n - 1)) * W;
    const y = H - (p.value / max) * (H - 3) - 1.5;
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);

  return (
    <div>
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradId})`} />
          <path d={line} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {peak && (
          <div
            className="mono"
            style={{ position: "absolute", top: 4, right: 6, fontSize: 11, fontWeight: 700, color: stroke }}
          >
            peak {format(peak.value)}
          </div>
        )}
      </div>
      <Labels points={points} />
    </div>
  );
}

/** Grouped bars — two series per bucket (e.g. leads vs booked). */
export function GroupedBars({
  points,
  height = 130,
  aColor = "var(--indigo-soft)",
  bColor = "var(--indigo)",
}: {
  points: { label: string; a: number; b: number }[];
  height?: number;
  aColor?: string;
  bColor?: string;
}) {
  const max = Math.max(1, ...points.flatMap((p) => [p.a, p.b]));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height }}>
        {points.map((p, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3, height: "100%" }}>
            <Bar h={(p.a / max) * 100} color={aColor} title={`${p.label}: ${p.a} leads`} />
            <Bar h={(p.b / max) * 100} color={bColor} title={`${p.label}: ${p.b} booked`} />
          </div>
        ))}
      </div>
      <Labels points={points.map((p) => ({ label: p.label, value: p.a }))} />
    </div>
  );
}

function Bar({ h, color, title }: { h: number; color: string; title: string }) {
  return (
    <div
      title={title}
      style={{
        width: "42%",
        maxWidth: 18,
        height: `${Math.max(2, h)}%`,
        background: color,
        borderRadius: "4px 4px 0 0",
        transition: "height .3s cubic-bezier(.2,.7,.2,1)",
      }}
    />
  );
}

/** Horizontal conversion funnel. */
export function Funnel({
  stages,
}: {
  stages: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(1, stages[0]?.value ?? 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const conv = i === 0 ? 100 : Math.round((s.value / (stages[0].value || 1)) * 100);
        return (
          <div key={s.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
              <span style={{ color: "var(--muted)", fontWeight: 600 }}>{s.label}</span>
              <span className="mono" style={{ fontWeight: 700 }}>
                {s.value}
                {i > 0 && <span style={{ color: "var(--faint)", fontWeight: 500 }}> · {conv}%</span>}
              </span>
            </div>
            <div style={{ height: 12, borderRadius: 7, background: "var(--line-soft)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: s.color,
                  borderRadius: 7,
                  transition: "width .4s cubic-bezier(.2,.7,.2,1)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Labels({ points }: { points: Pt[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
      {points.map((p, i) => (
        <span
          key={i}
          className="mono"
          style={{ fontSize: 10, color: "var(--faint)", flex: 1, textAlign: "center" }}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}
