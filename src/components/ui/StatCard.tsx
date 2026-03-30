interface StatCardProps {
  label: string;
  value: string;
  note: string;
}

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <article className="surface-card stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
