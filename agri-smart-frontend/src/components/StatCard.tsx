import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ icon, label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className="glass-card p-4 flex flex-col gap-2"
      style={accent ? { borderColor: 'var(--border-focus)' } : {}}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {accent && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--green-400)' }}
          >
            Live
          </span>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  );
}
