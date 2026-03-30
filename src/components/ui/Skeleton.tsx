import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({
  width,
  height = "1em",
  borderRadius = "8px",
  className = "",
  style,
}: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <article className="surface-card stat-card skeleton-stat-card">
      <Skeleton width="55%" height="0.92rem" />
      <Skeleton width="40%" height="2.2rem" borderRadius="10px" />
      <Skeleton width="75%" height="0.92rem" />
    </article>
  );
}

export function SurfaceCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <section className="surface-card">
      <div className="stack">
        <Skeleton width="28%" height="0.8rem" />
        <Skeleton width="50%" height="1.15rem" borderRadius="10px" />
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} width={`${65 + ((i * 17) % 30)}%`} height="0.92rem" />
        ))}
      </div>
    </section>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-shell skeleton-table">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i}>
                <Skeleton width="70%" height="0.82rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }, (_, colIdx) => (
                <td key={colIdx}>
                  <Skeleton width={`${55 + ((colIdx * 13) % 35)}%`} height="1rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <div className="hero-grid">
        <SurfaceCardSkeleton lines={4} />
        <SurfaceCardSkeleton lines={3} />
      </div>
      <div className="stat-grid">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="tile-grid">
        <SurfaceCardSkeleton lines={2} />
        <SurfaceCardSkeleton lines={2} />
      </div>
    </>
  );
}

export function UsersTableSkeleton() {
  return <TableSkeleton rows={6} cols={5} />;
}

export function AuditTableSkeleton() {
  return <TableSkeleton rows={8} cols={6} />;
}
