import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Printer, Calendar, TrendingUp, DollarSign, Repeat } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import Card from '../components/ui/Card';
import { glassSurface, screenTransition, moodColors } from '../utils/constants';

export default function ReportsPage() {
  const { addictions, goals, allRecords, relapses } = useData();
  const [periodo, setPeriodo] = useState(30);

  const dataLimite = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodo);
    return d;
  }, [periodo]);

  const stats = useMemo(() => {
    const regsPerido = allRecords.filter(r => new Date(r.data_registro) >= dataLimite);
    const recaidasPeriodo = relapses.filter(r => new Date(r.data_recaida) >= dataLimite);
    const totalEconomizado = addictions.reduce((acc, v) => acc + (Number(v.valor_economizado) || 0), 0);
    const metasConcluidas = goals.filter(m => m.concluida).length;

    const humorCount = {};
    regsPerido.forEach(r => {
      if (r.humor) humorCount[r.humor] = (humorCount[r.humor] || 0) + 1;
    });

    return {
      totalRegistros: regsPerido.length,
      totalRecaidas: recaidasPeriodo.length,
      totalEconomizado,
      metasConcluidas,
      humorDistribuicao: Object.entries(humorCount).sort((a, b) => b[1] - a[1]),
      viciosAtivos: addictions.length
    };
  }, [dataLimite, allRecords, relapses, addictions, goals]);

  const exportCSV = () => {
    const headers = ['Data', 'Vicio ID', 'Humor', 'Gatilhos', 'Conquistas', 'Observacoes'];
    const rows = allRecords
      .filter(r => new Date(r.data_registro) >= dataLimite)
      .map(r => [r.data_registro, r.vicio_id, r.humor || '', r.gatilhos || '', r.conquistas || '', r.observacoes || '']);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revive-relatorio-${periodo}dias.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div {...screenTransition} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-white">Relatorios</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setPeriodo(d)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                periodo === d
                  ? 'bg-[#1F2A3B] text-white border-slate-600'
                  : 'text-white/60 border-slate-700/60 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${glassSurface} rounded-2xl p-5 text-center`}>
          <Calendar className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalRegistros}</p>
          <p className="text-xs text-white/50">Registros</p>
        </div>
        <div className={`${glassSurface} rounded-2xl p-5 text-center`}>
          <DollarSign className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">R$ {stats.totalEconomizado.toFixed(0)}</p>
          <p className="text-xs text-white/50">Economizado</p>
        </div>
        <div className={`${glassSurface} rounded-2xl p-5 text-center`}>
          <Repeat className="w-6 h-6 text-rose-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.totalRecaidas}</p>
          <p className="text-xs text-white/50">Recaidas</p>
        </div>
        <div className={`${glassSurface} rounded-2xl p-5 text-center`}>
          <TrendingUp className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{stats.metasConcluidas}</p>
          <p className="text-xs text-white/50">Metas Concluidas</p>
        </div>
      </div>

      {/* Mood Distribution */}
      <Card title={`Distribuicao de Humor (${periodo} dias)`}>
        {stats.humorDistribuicao.length > 0 ? (
          <div className="space-y-3">
            {stats.humorDistribuicao.map(([humor, count]) => {
              const total = stats.totalRegistros || 1;
              const pct = (count / total) * 100;
              return (
                <div key={humor} className="flex items-center gap-3">
                  <span className="text-sm text-white/70 capitalize w-20">{humor}</span>
                  <div className="flex-1 bg-slate-700/40 rounded-full h-2">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: moodColors[humor] || '#6b7280' }} />
                  </div>
                  <span className="text-sm text-white/50 w-12 text-right">{Math.round(pct)}%</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-white/40 text-center py-6">Nenhum dado de humor no periodo.</p>
        )}
      </Card>

      {/* Vicios Summary */}
      <Card title="Resumo por Vicio">
        <div className="space-y-3">
          {addictions.map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
              <div>
                <p className="font-semibold text-white">{v.nome_vicio}</p>
                <p className="text-xs text-white/50">{v.dias_abstinencia} dias limpo</p>
              </div>
              <p className="text-lg font-bold text-[#7CF6C4]">R$ {Number(v.valor_economizado).toFixed(0)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Actions */}
      <div className="flex gap-4">
        <button
          onClick={exportCSV}
          className={`${glassSurface} rounded-xl px-6 py-3 flex items-center gap-2 text-white/80 hover:text-white transition font-semibold`}
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
        <button
          onClick={() => window.print()}
          className={`${glassSurface} rounded-xl px-6 py-3 flex items-center gap-2 text-white/80 hover:text-white transition font-semibold`}
        >
          <Printer className="w-5 h-5" />
          Imprimir / PDF
        </button>
      </div>
    </motion.div>
  );
}
