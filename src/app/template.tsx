"use client";

import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="rise" style={{ animationDuration: "0.45s" }}>
      {children}
    </div>
  );
}
