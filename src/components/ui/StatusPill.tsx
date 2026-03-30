import type { ReactNode } from "react";

export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger";

interface StatusPillProps {
  children: ReactNode;
  tone?: StatusTone;
}

export function StatusPill({ children, tone = "neutral" }: StatusPillProps) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
