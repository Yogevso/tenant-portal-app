import type { ReactNode } from "react";

import { SurfaceCard } from "./SurfaceCard";

type StatePanelTone = "accent" | "neutral" | "success" | "warning";

interface StatePanelProps {
  title: string;
  description: ReactNode;
  eyebrow?: string;
  tone?: StatePanelTone;
  actions?: ReactNode;
  children?: ReactNode;
  centered?: boolean;
}

export function StatePanel({
  title,
  description,
  eyebrow,
  tone = "neutral",
  actions,
  children,
  centered = false,
}: StatePanelProps) {
  const className = centered ? "state-panel state-panel-centered" : "state-panel";

  return (
    <SurfaceCard className={className}>
      {eyebrow ? <span className={`state-panel-badge ${tone}`}>{eyebrow}</span> : null}
      <div className="stack">
        <h3>{title}</h3>
        <p className="helper-text">{description}</p>
      </div>
      {children}
      {actions ? <div className="split-actions">{actions}</div> : null}
    </SurfaceCard>
  );
}
