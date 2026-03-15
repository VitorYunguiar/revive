/**
 * @file DonutChart.jsx
 * @description Componente de grafico donut (rosca) renderizado com SVG puro.
 *
 * Recebe um array de dados com labels, valores e cores, e desenha um grafico
 * de arco circular usando caminhos SVG (path com arcos). O grafico e acompanhado
 * de uma legenda lateral com percentuais.
 *
 * O calculo dos arcos usa trigonometria (seno/cosseno) para converter angulos
 * em coordenadas cartesianas no sistema SVG (viewBox 100x100).
 *
 * @component
 * @param {Object} props
 * @param {Array<{label: string, value: number, cor: string}>} props.data - Dados para o grafico
 * @returns {JSX.Element} Grafico donut SVG com legenda ou mensagem de estado vazio
 *
 * @example
 * <DonutChart data={[{ label: 'bom', value: 10, cor: '#10b981' }]} />
 */
import React from 'react';

/**
 * Renderiza um grafico de rosca (donut) usando arcos SVG.
 *
 * Algoritmo:
 * 1. Calcula total somando todos os valores - O(n)
 * 2. Para cada segmento, calcula angulos de inicio/fim baseados no acumulado
 * 3. Converte angulos em coordenadas (x,y) usando cos/sin
 * 4. Gera path SVG com comando 'A' (arco) para cada segmento
 *
 * @param {Object} props
 * @param {Array<{label: string, value: number, cor: string}>} props.data - Segmentos do grafico
 */
const DonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <p className="text-gray-400 flex items-center justify-center h-full">Sem dados de humor para exibir.</p>;

  let accumulated = 0;
  const segments = data.map(item => {
    const percentage = (item.value / total) * 100;
    const startAngle = (accumulated / total) * 360;
    accumulated += item.value;
    const endAngle = (accumulated / total) * 360;

    const largeArcFlag = percentage > 50 ? 1 : 0;

    const startX = 50 + 40 * Math.cos(Math.PI * (startAngle - 90) / 180);
    const startY = 50 + 40 * Math.sin(Math.PI * (startAngle - 90) / 180);
    const endX = 50 + 40 * Math.cos(Math.PI * (endAngle - 90) / 180);
    const endY = 50 + 40 * Math.sin(Math.PI * (endAngle - 90) / 180);

    const pathData = `M ${startX},${startY} A 40,40 0 ${largeArcFlag},1 ${endX},${endY}`;

    return <path key={item.label} d={pathData} fill="none" stroke={item.cor} strokeWidth="12" />;
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4">
      <svg viewBox="0 0 100 100" className="w-36 h-36 md:w-40 md:h-40 transform -rotate-90">
        {segments}
      </svg>
      <div className="space-y-2">
        {data.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }}></div>
            <span className="text-sm text-gray-300 capitalize">{item.label} ({Math.round(item.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
