/**
 * @file KpiCard.jsx
 * @description Componente de card de KPI (Key Performance Indicator) para exibir metricas.
 *
 * Exibe um icone, titulo, valor principal e opcionalmente um indicador de tendencia.
 * A cor da borda e definida pela prop 'border' usando o mapa {@link kpiBorderMap}.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icone renderizado a esquerda (componente Lucide)
 * @param {string} props.title - Rotulo descritivo do KPI (ex: "Total Economizado")
 * @param {string|number} props.value - Valor principal exibido em destaque
 * @param {string} [props.border] - Chave de cor para borda (ex: 'emerald', 'cyan', 'yellow', 'red')
 * @param {number} [props.trend] - Valor percentual de tendencia (exibido via TrendIndicator)
 * @returns {JSX.Element} Card de KPI com glassSurface e borda colorida
 *
 * @example
 * <KpiCard icon={<Heart />} title="Vicios Ativos" value={3} border="emerald" />
 */
import React from 'react';
import { glassSurface, kpiBorderMap } from '../../utils/constants';
import TrendIndicator from './TrendIndicator';

/**
 * Componente de card de KPI (Key Performance Indicator).
 *
 * Exibe uma metrica com icone, titulo descritivo, valor em destaque e
 * opcionalmente um indicador de tendencia via TrendIndicator.
 * A cor da borda lateral e mapeada pela prop `border` usando o mapa kpiBorderMap.
 *
 * @param {Object} props - Props do componente
 * @param {React.ReactNode} props.icon - Icone renderizado a esquerda (componente Lucide)
 * @param {string} props.title - Rotulo descritivo do KPI (ex: "Total Economizado")
 * @param {string|number} props.value - Valor principal exibido em destaque
 * @param {string} [props.border] - Chave de cor para borda ('emerald'|'cyan'|'yellow'|'red')
 * @param {number} [props.trend] - Valor percentual de tendencia (positivo = aumento, negativo = queda)
 * @returns {JSX.Element} Card de KPI com glassSurface e borda colorida
 */
const KpiCard = ({ icon, title, value, border, trend }) => (
  <div className={`${glassSurface} rounded-2xl p-5 border-[1.5px] ${kpiBorderMap[border] || 'border-slate-700/60'}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        {icon}
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
      {trend !== undefined && <TrendIndicator trend={trend} />}
    </div>
  </div>
);

export default KpiCard;
