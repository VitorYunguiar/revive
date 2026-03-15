/**
 * @file HeroKpis.jsx
 * @description Componente que renderiza os KPIs (Key Performance Indicators)
 * principais do dashboard em cards visuais com icones e cores tematicas.
 *
 * Recebe metricas pre-calculadas do DashboardPage e as exibe em um grid responsivo
 * de 5 colunas (2 em mobile). Cada KPI possui icone, label e valor formatado.
 * Utiliza classes Tailwind CSS com estilizacao glassmorphism via constante compartilhada.
 *
 * KPIs exibidos:
 * - Dias Limpos (total de abstinencia)
 * - Economizado (valor em reais)
 * - Maior Streak (sequencia consecutiva)
 * - Metas (quantidade concluidas)
 * - Humor 7d (media de humor dos ultimos 7 dias)
 *
 * @component
 * @see {@link DashboardPage} Componente pai que calcula e passa os KPIs
 * @see {@link glassSurface} Constante de estilizacao glassmorphism
 */

import React from 'react';
import { DollarSign, Flame, Heart, Star, Target } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

/**
 * Converte uma pontuacao numerica de humor em um label descritivo em portugues.
 *
 * Escala de classificacao:
 * - >= 4.5: "Excelente"
 * - >= 3.5: "Bom"
 * - >= 2.5: "Neutro"
 * - >= 1.5: "Ruim"
 * - < 1.5:  "Pessimo"
 * - null/undefined: "Sem dados"
 *
 * @param {number|null} score - Pontuacao media de humor (escala 1-5)
 * @returns {string} Label descritivo do nivel de humor
 */
function getMoodLabel(score) {
  if (!score) return 'Sem dados';
  if (score >= 4.5) return 'Excelente';
  if (score >= 3.5) return 'Bom';
  if (score >= 2.5) return 'Neutro';
  if (score >= 1.5) return 'Ruim';
  return 'Pessimo';
}

/**
 * Renderiza grid de KPIs do dashboard.
 *
 * Cada card KPI possui um icone colorido (Lucide), um label em caixa alta
 * e o valor correspondente. O layout e responsivo: 2 colunas em telas
 * pequenas e 5 colunas em telas grandes (lg breakpoint).
 *
 * @param {Object} props - Props do componente
 * @param {number} props.totalDiasLimpos - Soma total de dias de abstinencia de todos os vicios
 * @param {number} props.totalEconomizado - Valor total economizado em reais (R$)
 * @param {number} props.maiorStreak - Maior streak consecutivo em dias entre todos os vicios
 * @param {number} props.metasConcluidas - Quantidade de metas marcadas como concluidas
 * @param {number|null} props.moodTrend - Media de humor dos ultimos 7 dias (escala 1-5), null se sem dados
 * @returns {JSX.Element} Grid de cards KPI com estilizacao glassmorphism
 */
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
