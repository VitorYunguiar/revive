/**
 * @file RecentTimeline.jsx
 * @description Timeline de atividades recentes do usuario na dashboard.
 *
 * Exibe uma lista cronologica dos ultimos eventos relevantes, incluindo
 * registros de progresso, recaidas e conquistas de metas. Cada tipo de
 * evento possui cor e icone distintos para facilitar a identificacao visual.
 *
 * O componente retorna null quando nao ha atividades, evitando renderizacao
 * de container vazio (pattern de early return).
 *
 * Mapeamento de cores por tipo:
 * - registro: verde (emerald) - progresso positivo
 * - recaida: vermelho (rose) - evento negativo
 * - meta: ciano (cyan) - conquista de meta
 *
 * @component
 * @see {@link DashboardPage} Componente pai que monta a lista de atividades recentes
 */

import React from 'react';
import { glassSurface } from '../../utils/constants';

/**
 * Mapeamento de classes CSS por tipo de evento.
 * Define cor de fundo e texto para cada categoria de atividade.
 * @type {Object<string, string>}
 */
const typeColors = {
  registro: 'bg-emerald-500/20 text-emerald-400',
  recaida: 'bg-rose-500/20 text-rose-400',
  meta: 'bg-cyan-500/20 text-cyan-400'
};

/**
 * Renderiza a timeline de atividades recentes.
 *
 * Cada evento e exibido como uma linha horizontal contendo icone colorido
 * (de acordo com o tipo), texto descritivo e data formatada em pt-BR.
 * Retorna null se nao houver atividades para exibir.
 *
 * @param {Object} props - Props do componente
 * @param {Array<Object>} props.recentActivity - Lista de eventos recentes ordenados por data
 * @param {string} props.recentActivity[].id - Identificador unico do evento
 * @param {string} props.recentActivity[].type - Tipo do evento ("registro" | "recaida" | "meta")
 * @param {string} props.recentActivity[].text - Texto descritivo do evento
 * @param {Date} props.recentActivity[].date - Objeto Date do evento (formatado via toLocaleDateString)
 * @param {React.ComponentType} props.recentActivity[].icon - Componente de icone Lucide para o evento
 * @returns {JSX.Element|null} Timeline de atividades ou null se lista vazia
 */
export default function RecentTimeline({ recentActivity }) {
  // Early return: nao renderiza nada se nao houver atividades
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
