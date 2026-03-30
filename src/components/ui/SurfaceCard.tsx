import type { ReactNode } from "react";

interface SurfaceCardProps {
  children: ReactNode;
  className?: string;
}

export function SurfaceCard({ children, className = "" }: SurfaceCardProps) {
  const classes = className ? `surface-card ${className}` : "surface-card";

  return <section className={classes}>{children}</section>;
}
