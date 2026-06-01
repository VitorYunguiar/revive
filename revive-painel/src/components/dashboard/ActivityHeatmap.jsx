/**
 * @file ActivityHeatmap.jsx
 * @description Heatmap de atividade similar ao grafico de contribuicoes do GitHub.
 *
 * Exibe um grid 7x4 representando os ultimos 28 dias de atividade do usuario.
 * Cada celula representa um dia e sua cor indica a intensidade de registros
 * ou a ocorrencia de recaidas. O cabecalho mostra as iniciais dos dias da semana
 * em portugues (D, S, T, Q, Q, S, S).
 *
 * Escala de cores:
 * - Vermelho (rose): dia com recaida
 * - Verde intenso: 3+ registros
 * - Verde medio: 2 registros
 * - Verde claro: 1 registro
 * - Cinza: nenhum registro
 *
 * @component
 * @see {@link DashboardPage} Componente pai que gera os dados do heatmap
 */

import React from 'react';

/**
 * Renderiza o heatmap de atividade dos ultimos 28 dias.
 *
 * O componente recebe um array de objetos representando cada dia e renderiza
 * um grid visual com cores proporcionais a atividade. Dias com recaida
 * sao destacados em vermelho, sobrescrevendo a cor verde de atividade.
 *
 * @param {Object} props - Props do componente
 * @param {Array<Object>} props.heatmapData - Array com dados dos 28 dias
 * @param {string} props.heatmapData[].date - Data formatada do dia (ex: "15/03/2026")
 * @param {number} props.heatmapData[].count - Quantidade de registros positivos no dia
 * @param {boolean} props.heatmapData[].hasRelapse - Indica se houve recaida neste dia
 * @returns {JSX.Element} Grid visual tipo heatmap com estilizacao glassmorphism
 */
export default function ActivityHeatmap({ heatmapData }) {
  const activeDays = heatmapData.filter(day => day.count > 0 && !day.hasRelapse).length;

  return (
    <div className="surface-sand rounded-[34px] p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Atividade</p>
          <h3 className="mt-2 text-3xl font-black leading-none tracking-[-0.055em] text-app">Ultimos 28 dias</h3>
        </div>
        <span className="rounded-full bg-[#121212] px-3 py-2 text-sm font-black text-[#fbfaf5]">{activeDays}/28</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {/* Cabecalho com iniciais dos dias da semana em portugues */}
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-[9px] text-muted text-center font-black">{d}</div>
        ))}
        {/* Celulas do heatmap - cor determinada por recaida ou contagem de registros */}
        {heatmapData.map((day, i) => (
          <div
            key={i}
            className={`w-full aspect-square rounded-[8px] transition-colors ${
              day.hasRelapse ? 'bg-rose-500/60'
              : day.count >= 3 ? 'bg-[#121212]'
              : day.count >= 2 ? 'bg-[#121212]/70'
              : day.count >= 1 ? 'bg-[#121212]/35'
              : 'bg-[#121212]/10'
            }`}
            title={`${day.date}: ${day.count} registro(s)`}
          />
        ))}
      </div>
    </div>
  );
}
