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
    <div className={`stat-card flex flex-col justify-between p-5 rounded-2xl transition-all ${accent ? 'accent' : ''}`}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shrink-0 border"
        style={accent
          ? { background: 'linear-gradient(135deg, #d1fae5, #dcfce7)', color: '#15803d', borderColor: '#bbf7d0' }
          : { background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', color: '#475569', borderColor: '#e2e8f0' }
        }
      >
        {typeof icon === 'string' ? <span className="text-xl">{icon}</span> : icon}
      </div>

      <div className="space-y-0.5">
        <p
          className="text-2xl font-black leading-tight tracking-tight"
          style={{ color: accent ? '#15803d' : '#0f172a' }}
        >
          {value}
        </p>
        <p
          className="text-xs font-bold"
          style={{ color: accent ? '#16a34a' : '#475569' }}
        >
          {label}
        </p>
        {sub && (
          <p className="text-[11px] font-medium text-gray-400">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
