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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      <div className="rounded-[26px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
        <Flame className="w-6 h-6 text-[var(--accent)]" />
        <div className="mt-5">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] font-black text-white/40">Dias limpos</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-white">{totalDiasLimpos}</p>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
        <DollarSign className="w-6 h-6 text-[var(--accent)]" />
        <div className="mt-5">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] font-black text-white/40">Economia</p>
          <p className="mt-1 text-2xl font-black tracking-[-0.06em] text-white">R$ {totalEconomizado.toFixed(0)}</p>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
        <Star className="w-6 h-6 text-[var(--accent)]" />
        <div className="mt-5">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] font-black text-white/40">Streak</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-white">{maiorStreak}d</p>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
        <Target className="w-6 h-6 text-[var(--accent)]" />
        <div className="mt-5">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] font-black text-white/40">Metas</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.06em] text-white">{metasConcluidas}</p>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
        <Heart className="w-6 h-6 text-[var(--accent)]" />
        <div className="mt-5">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] font-black text-white/40">Humor 7d</p>
          <p className="mt-1 text-2xl font-black tracking-[-0.06em] text-white">{getMoodLabel(moodTrend)}</p>
        </div>
      </div>
    </div>
  );
}
