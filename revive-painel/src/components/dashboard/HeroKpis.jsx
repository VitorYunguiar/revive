import React from 'react';
import { DollarSign, Flame, Heart, Star, Target } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

function getMoodLabel(score) {
  if (!score) return 'Sem dados';
  if (score >= 4.5) return 'Excelente';
  if (score >= 3.5) return 'Bom';
  if (score >= 2.5) return 'Neutro';
  if (score >= 1.5) return 'Ruim';
  return 'Pessimo';
}

export default function HeroKpis({
  totalDiasLimpos,
  totalEconomizado,
  maiorStreak,
  metasConcluidas,
  moodTrend
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className={`${glassSurface} rounded-2xl p-5 col-span-2 lg:col-span-1`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Dias Limpos</p>
            <p className="text-2xl font-bold text-white">{totalDiasLimpos}</p>
          </div>
        </div>
      </div>

      <div className={`${glassSurface} rounded-2xl p-5`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Economizado</p>
            <p className="text-xl font-bold text-white">R$ {totalEconomizado.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className={`${glassSurface} rounded-2xl p-5`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Maior Streak</p>
            <p className="text-2xl font-bold text-white">{maiorStreak}d</p>
          </div>
        </div>
      </div>

      <div className={`${glassSurface} rounded-2xl p-5`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Metas</p>
            <p className="text-2xl font-bold text-white">{metasConcluidas}</p>
          </div>
        </div>
      </div>

      <div className={`${glassSurface} rounded-2xl p-5`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Humor 7d</p>
            <p className="text-lg font-bold text-white">{getMoodLabel(moodTrend)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
