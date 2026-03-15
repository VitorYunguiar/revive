import React, { useMemo } from 'react';
import { BarChart3, Calendar, DollarSign, Flame, Repeat, Trash2 } from 'lucide-react';
import {
  glassSurface,
} from '../../utils/constants';

export default function VicioCard({
  vicio,
  recaidas,
  metas,
  onViewDetails,
  onDelete,
  onRegisterRelapse
}) {
  const { recaidasVicio30dias, meta, progresso } = useMemo(() => {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    const totalRecaidas = recaidas.filter(
      r => r.vicio_id === vicio.id && new Date(r.data_recaida) >= dataLimite
    ).length;
    const activeGoal = metas.find(m => m.vicio_id === vicio.id && !m.concluida);
    const progress = activeGoal?.dias_objetivo
      ? Math.min((vicio.dias_abstinencia / parseInt(activeGoal.dias_objetivo, 10)) * 100, 100)
      : null;

    return {
      recaidasVicio30dias: totalRecaidas,
      meta: activeGoal,
      progresso: progress
    };
  }, [vicio, recaidas, metas]);

  return (
    <div
      className={`${glassSurface} rounded-3xl p-6 border border-white/10 flex flex-col relative overflow-hidden group`}
    >
      {vicio.dias_abstinencia >= 7 && (
        <div className="absolute top-3 right-3">
          <div className="text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      )}

      <div className="flex-grow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Em progresso</p>
            <h3 className="text-xl font-semibold text-white">{vicio.nome_vicio}</h3>
            <p className="text-sm text-white/60 mt-1">{vicio.tempo_formatado}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onViewDetails}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition border border-white/10"
              title="Ver detalhes"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-rose-300/90 hover:bg-rose-500/15 rounded-lg transition border border-rose-300/30"
              title="Excluir"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {progresso !== null && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-white/50 mb-1">
              <span>Meta: {meta.descricao_meta}</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <div className="w-full bg-slate-700/40 rounded-full h-1.5">
              <div
                style={{ width: `${progresso}%` }}
                className={`h-full rounded-full ${progresso >= 100 ? 'bg-[#35D3FF]' : 'bg-[#7CF6C4]'}`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex flex-col items-center text-center gap-2">
              <Calendar className="w-4 h-4 text-[#7CF6C4]" />
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">Dias</p>
              <p className="text-lg font-semibold text-white tabular-nums">{vicio.dias_abstinencia}</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex flex-col items-center text-center gap-2">
              <DollarSign className="w-4 h-4 text-[#35D3FF]" />
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">R$</p>
              <p className="text-lg font-semibold text-white tabular-nums">{Number(vicio.valor_economizado).toFixed(0)}</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex flex-col items-center text-center gap-2">
              <Repeat className="w-4 h-4 text-amber-300" />
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">30d</p>
              <p className="text-lg font-semibold text-white tabular-nums">{recaidasVicio30dias}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onRegisterRelapse}
        className="w-full mt-4 px-4 py-2 bg-slate-800/70 text-white rounded-xl transition font-semibold border border-slate-700/60 hover:bg-slate-700/80"
      >
        Registrar Recaida
      </button>
    </div>
  );
}
