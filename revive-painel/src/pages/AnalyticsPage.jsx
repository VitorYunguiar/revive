import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, DollarSign, CheckCircle, Repeat, Clock, Flame, AlertCircle, BookOpen, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import DonutChart from '../components/ui/DonutChart';
import { moodColors, screenTransition } from '../utils/constants';
import { MS_PER_DAY } from '../utils/formatters';

export default function AnalyticsPage() {
  const { addictions, goals, allRecords, relapses } = useData();

  const totalEconomizado = useMemo(() =>
    addictions.reduce((acc, v) => acc + (Number(v.valor_economizado) || 0), 0),
    [addictions]
  );

  const viciosAtivos = useMemo(() => addictions.length, [addictions]);

  const metasConcluidas = useMemo(() =>
    goals.filter(meta => meta.concluida).length,
    [goals]
  );

  const diasUltimoRegistro = useMemo(() => {
    if (allRecords.length === 0) return '-';
    const ultimaData = new Date(allRecords[allRecords.length - 1].data_registro);
    const hoje = new Date();
    const diff = Math.floor((hoje - ultimaData) / MS_PER_DAY);
    return diff === 0 ? 'Hoje' : `${diff}d atras`;
  }, [allRecords]);

  const taxaRecaida = useMemo(() => {
    if (relapses.length === 0) return '0%';
    if (addictions.length === 0) return '0%';
    const diasMedia = addictions.reduce((acc, v) => {
      const inicio = new Date(v.data_inicio);
      const dias = Math.ceil((new Date() - inicio) / MS_PER_DAY) || 1;
      return acc + dias;
    }, 0) / addictions.length;
    const taxa = (relapses.length / diasMedia) * 100;
    return `${taxa.toFixed(1)}%`;
  }, [relapses, addictions]);

  const tendenciaRecaidas = useMemo(() => {
    const agora = new Date();
    const _30dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const _60dias = new Date(agora.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recaidas30 = relapses.filter(r => new Date(r.data_recaida) >= _30dias).length;
    const recaidas60 = relapses.filter(r => new Date(r.data_recaida) >= _60dias && new Date(r.data_recaida) < _30dias).length;

    if (recaidas60 === 0) return 0;
    return ((recaidas30 - recaidas60) / recaidas60) * 100;
  }, [relapses]);

  const conquistasRecentes = useMemo(() => {
    return allRecords
      .filter(r => r.conquistas && r.conquistas.trim() !== '')
      .sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro))
      .slice(0, 5)
      .map((r, index) => ({
        id: r.id || index,
        data: new Date(r.data_registro),
        descricao: r.conquistas
      }));
  }, [allRecords]);

  const dadosHumor = useMemo(() => {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    const contagem = allRecords
      .filter(r => new Date(r.data_registro) >= dataLimite)
      .reduce((acc, reg) => {
        if (reg.humor) acc[reg.humor] = (acc[reg.humor] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(contagem).map(([label, value]) => ({
      label, value, cor: moodColors[label] || '#6b7280'
    }));
  }, [allRecords]);

  const tempoMedioRecaidas = useMemo(() => {
    if (relapses.length < 2) return 'N/A';

    const porVicio = relapses.reduce((acc, r) => {
      if (!acc[r.vicio_id]) acc[r.vicio_id] = [];
      acc[r.vicio_id].push(new Date(r.data_recaida));
      return acc;
    }, {});

    const mediasGerais = [];
    for (const vicioId in porVicio) {
      const datas = porVicio[vicioId].sort((a, b) => a - b);
      if (datas.length < 2) continue;
      for (let i = 1; i < datas.length; i++) {
        const diffDias = (datas[i] - datas[i - 1]) / MS_PER_DAY;
        mediasGerais.push(diffDias);
      }
    }

    if (mediasGerais.length === 0) return 'N/A';
    const mediaFinal = mediasGerais.reduce((a, b) => a + b, 0) / mediasGerais.length;
    return `${mediaFinal.toFixed(1)} dias`;
  }, [relapses]);

  const topGatilhosRecaidas = useMemo(() => {
    if (!relapses.length || !allRecords.length) return [];

    const contagemGatilhos = {};
    relapses.forEach(recaida => {
      const dataRecaida = new Date(recaida.data_recaida);
      const dataLimite = new Date(dataRecaida);
      dataLimite.setDate(dataRecaida.getDate() - 2);

      allRecords
        .filter(r => r.vicio_id === recaida.vicio_id && new Date(r.data_registro) >= dataLimite && new Date(r.data_registro) < dataRecaida)
        .forEach(r => {
          if (!r.gatilhos) return;
          r.gatilhos.split(',').map(g => g.trim().toLowerCase()).filter(Boolean).forEach(g => {
            contagemGatilhos[g] = (contagemGatilhos[g] || 0) + 1;
          });
        });
    });
    return Object.entries(contagemGatilhos).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [allRecords, relapses]);

  return (
    <motion.div {...screenTransition} className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Painel de Analises Gerais</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon={<Heart className="text-emerald-400 w-8 h-8" />} title="Vicios Ativos" value={viciosAtivos} border="emerald" />
        <KpiCard icon={<DollarSign className="text-cyan-400 w-8 h-8" />} title="Total Economizado" value={`R$ ${totalEconomizado.toFixed(2)}`} border="cyan" />
        <KpiCard icon={<CheckCircle className="text-yellow-400 w-8 h-8" />} title="Metas Concluidas" value={metasConcluidas} border="yellow" />
        <KpiCard icon={<Repeat className="text-red-400 w-8 h-8" />} title="Taxa de Recaida" value={taxaRecaida} trend={tendenciaRecaidas} border="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Distribuicao de Humor (Ultimos 30 dias)"><DonutChart data={dadosHumor} /></Card>
        <div className="space-y-6">
          <Card title="Ultimo Registro">
            <div className="flex items-center justify-center h-full">
              <p className="text-4xl font-bold text-[#7CF6C4] flex items-center gap-3">
                <Clock className="w-8 h-8" />
                {diasUltimoRegistro}
              </p>
            </div>
          </Card>
          <Card title="Tempo Medio Entre Recaidas">
            <div className="flex items-center justify-center h-full">
              <p className="text-3xl font-bold text-purple-300 flex items-center gap-3">
                <Flame className="w-6 h-6" />
                {tempoMedioRecaidas}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top 5 Gatilhos Correlacionados com Recaidas">
          {topGatilhosRecaidas.length > 0 ? (
            <ul className="space-y-2">
              {topGatilhosRecaidas.map(([gatilho, freq], index) => (
                <li key={index} className="flex items-center justify-between text-gray-300 bg-[#1A1D2E] p-3 rounded-lg border border-gray-700">
                  <span className="capitalize flex items-center gap-2"><Flame className="w-4 h-4 text-red-400" />{gatilho}</span>
                  <span className="text-sm text-gray-400">{freq} ocorrencias</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-gray-400 flex items-center justify-center h-full">Nenhuma correlacao de gatilho encontrada.</p>}
        </Card>

        <Card title="Conquistas Recentes">
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
            {conquistasRecentes.length > 0 ? conquistasRecentes.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-[#1A1D2E] rounded-lg">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-300">{item.descricao}</p>
                  <p className="text-xs text-gray-500">{item.data.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )) : <p className="text-gray-400 flex items-center justify-center h-full">Nenhuma conquista registrada recentemente.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title="Insights e Recomendacoes">
          <div className="space-y-3">
            {diasUltimoRegistro !== '-' && !diasUltimoRegistro.includes('Hoje') && (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-semibold">Aumente seu Engajamento</p>
                  <p className="text-sm text-yellow-200/80">Voce nao registra ha {diasUltimoRegistro}. Reflexoes diarias fortalecem a recuperacao!</p>
                </div>
              </div>
            )}
            {tendenciaRecaidas > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold">Aumento de Risco Detectado</p>
                  <p className="text-sm text-red-200/80">Recaidas aumentaram {tendenciaRecaidas.toFixed(0)}% nos ultimos 30 dias. Identifique gatilhos e procure apoio.</p>
                </div>
              </div>
            )}
            {tendenciaRecaidas < 0 && relapses.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-300 font-semibold">Voce Esta Melhorando!</p>
                  <p className="text-sm text-emerald-200/80">Recaidas diminuiram {Math.abs(tendenciaRecaidas).toFixed(0)}% nos ultimos 30 dias. Continue assim!</p>
                </div>
              </div>
            )}
            {topGatilhosRecaidas.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300 font-semibold">Foco em Gatilhos</p>
                  <p className="text-sm text-blue-200/80">O gatilho "{topGatilhosRecaidas[0][0]}" aparece antes de recaidas. Desenvolva estrategias para lidar com isso.</p>
                </div>
              </div>
            )}
            {addictions.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-purple-500/20 border border-purple-400/30 rounded-lg">
                <Heart className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-purple-300 font-semibold">Sua Jornada</p>
                  <p className="text-sm text-purple-200/80">Voce ja investiu <strong>R$ {totalEconomizado.toFixed(2)}</strong> em sua saude. Cada dia e uma vitoria!</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
