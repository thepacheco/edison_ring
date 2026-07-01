"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated money counter that ticks up to `target` on mount — the satisfying
 * "$ captured this month" centerpiece from the design.
 */
export function MoneyCounter({
  target,
  durationMs = 1600,
  className,
  style,
}: {
  target: number;
  durationMs?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return (
    <span className={className} style={style}>
      {"$" + value.toLocaleString("en-US")}
    </span>
  );
}
