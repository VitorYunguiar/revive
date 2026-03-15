import React from 'react';
import { glassSurface } from '../../utils/constants';

export default function ActivityHeatmap({ heatmapData }) {
  return (
    <div className={`${glassSurface} rounded-3xl p-5 border border-slate-700/60`}>
      <p className="text-xs uppercase tracking-widest text-white/50 mb-3">Atividade (28 dias)</p>
      <div className="grid grid-cols-7 gap-1.5">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[9px] text-white/30 text-center font-medium">{d}</div>
        ))}
        {heatmapData.map((day, i) => (
          <div
            key={i}
            className={`w-full aspect-square rounded-sm transition-colors ${
              day.hasRelapse ? 'bg-rose-500/60'
              : day.count >= 3 ? 'bg-emerald-400/80'
              : day.count >= 2 ? 'bg-emerald-400/50'
              : day.count >= 1 ? 'bg-emerald-400/25'
              : 'bg-slate-700/30'
            }`}
            title={`${day.date}: ${day.count} registro(s)`}
          />
        ))}
      </div>
    </div>
  );
}
