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
      className={`stat-card${accent ? ' accent' : ''}`}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 flex-shrink-0"
        style={accent
          ? { background: 'linear-gradient(135deg, #d1fae5, #dcfce7)', color: '#16a34a' }
          : { background: 'linear-gradient(135deg, #f1f5f9, #f8fafc)', color: '#64748b' }
        }
      >
        {typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon}
      </div>

      {/* Value */}
      <p
        className="text-[1.6rem] font-black leading-none mb-1 tracking-tight"
        style={{ color: accent ? '#15803d' : '#0f172a' }}
      >
        {value}
      </p>

      {/* Label */}
      <p
        className="text-xs font-semibold mb-0.5"
        style={{ color: accent ? '#16a34a' : '#64748b' }}
      >
        {label}
      </p>

      {/* Sub */}
      {sub && (
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>{sub}</p>
      )}
    </div>
  );
}
