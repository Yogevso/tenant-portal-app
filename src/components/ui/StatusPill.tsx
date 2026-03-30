import type { ReactNode } from "react";

type StatusTone = "neutral" | "accent" | "success" | "warning";

interface StatusPillProps {
  children: ReactNode;
  tone?: StatusTone;
}

export function StatusPill({ children, tone = "neutral" }: StatusPillProps) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
