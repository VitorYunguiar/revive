import React from 'react';
import { glassSurface } from '../../utils/constants';

const typeColors = {
  registro: 'bg-emerald-500/20 text-emerald-400',
  recaida: 'bg-rose-500/20 text-rose-400',
  meta: 'bg-cyan-500/20 text-cyan-400'
};

export default function RecentTimeline({ recentActivity }) {
  if (recentActivity.length === 0) return null;

  return (
    <div className={`${glassSurface} rounded-3xl p-6 border border-slate-700/60`}>
      <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>
      <div className="space-y-3">
        {recentActivity.map((event) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[event.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{event.text}</p>
              </div>
              <p className="text-xs text-white/40 flex-shrink-0">{event.date.toLocaleDateString('pt-BR')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
