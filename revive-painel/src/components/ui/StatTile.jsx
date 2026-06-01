import React from 'react';

export default function StatTile({ icon, label, value, tone = 'emerald', className = '' }) {
  const tones = {
    emerald: 'bg-emerald-400/12 text-emerald-300 border-emerald-300/20',
    cyan: 'bg-sky-400/12 text-sky-300 border-sky-300/20',
    amber: 'bg-amber-400/12 text-amber-300 border-amber-300/20',
    rose: 'bg-rose-400/12 text-rose-300 border-rose-300/20',
    violet: 'bg-violet-400/12 text-violet-300 border-violet-300/20'
  };

  return (
    <div className={`surface-muted rounded-[24px] p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 icon-tile ${tones[tone] || tones.emerald}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">{label}</p>
          <p className="text-2xl font-black tracking-[-0.05em] text-app tabular-nums truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}
