import type { ReactNode } from "react";

type InlineAlertTone = "info" | "success" | "warning" | "danger";

interface InlineAlertProps {
  children: ReactNode;
  title?: string;
  tone?: InlineAlertTone;
  actions?: ReactNode;
}

export function InlineAlert({
  children,
  title,
  tone = "info",
  actions,
}: InlineAlertProps) {
  const role = tone === "danger" ? "alert" : "status";
  const live = tone === "danger" ? "assertive" : "polite";

  return (
    <section className={`inline-alert inline-alert-${tone}`} role={role} aria-live={live}>
      <div className="stack stack-tight">
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
      {actions ? <div className="split-actions">{actions}</div> : null}
    </section>
  );
}
