/**
 * @file DashboardPage.jsx
 * @description Pagina principal (Dashboard) da aplicacao REVIVE.
 *
 * Exibe visao geral do progresso do usuario: KPIs resumidos (dias limpos,
 * economia, maior streak, metas concluidas, tendencia de humor), heatmap de
 * atividade dos ultimos 28 dias, cards de vicios cadastrados e timeline de
 * atividades recentes.
 *
 * Utiliza os hooks {@link useData} e {@link useUI} para acessar dados globais
 * e estado de carregamento. Diversos calculos sao memorizados com
 * {@link React.useMemo} para evitar recomputacoes desnecessarias.
 *
 * @component
 * @see {@link useData} Hook de acesso ao contexto de dados (vicios, metas, registros)
 * @see {@link useUI} Hook de acesso ao contexto de interface (loading, tema)
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Heart, Plus, Repeat, Target, TrendingUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import RecaidaModal from '../components/modals/RecaidaModal';
import NovoVicioWizard from '../components/modals/NovoVicioWizard';
import EmptyState from '../components/ui/EmptyState';
import HeroKpis from '../components/dashboard/HeroKpis';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import VicioCard from '../components/dashboard/VicioCard';
import RecentTimeline from '../components/dashboard/RecentTimeline';
import { glassSurface } from '../utils/constants';

/**
 * Componente da pagina Dashboard.
 *
 * Gerencia estados locais para o modal de recaida e o wizard de novo vicio.
 * Calcula metricas derivadas (totalDiasLimpos, totalEconomizado, maiorStreak,
 * metasConcluidas, heatmapData, recentActivity, moodTrend) por meio de useMemo.
 *
 * @returns {JSX.Element} Layout completo do dashboard com KPIs, heatmap, cards e timeline
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { loading } = useUI();
  const {
    addictions,
    motivationalMessage,
    relapses,
    allRecords,
    goals,
    createAddiction,
    deleteAddiction,
    registerRelapse,
    loadAddictionDetails
  } = useData();

  /** @type {Object|null} Vicio selecionado para registro de recaida (abre RecaidaModal) */
  const [recaidaVicio, setRecaidaVicio] = useState(null);
  /** @type {boolean} Controla visibilidade do wizard de criacao de novo vicio */
  const [showWizard, setShowWizard] = useState(false);

  // Soma total de dias de abstinencia de todos os vicios - O(n) onde n = numero de vicios
  const totalDiasLimpos = useMemo(
    () => addictions.reduce((acc, v) => acc + (v.dias_abstinencia || 0), 0),
    [addictions]
  );

  // Calcula total economizado somando todos os vicios - O(n) onde n = numero de vicios
  const totalEconomizado = useMemo(
    () => addictions.reduce((acc, v) => acc + (Number(v.valor_economizado) || 0), 0),
    [addictions]
  );

  // Encontra o maior streak (dias consecutivos) entre todos os vicios - O(n)
  const maiorStreak = useMemo(
    () => addictions.reduce((max, v) => Math.max(max, v.dias_abstinencia || 0), 0),
    [addictions]
  );

  // Conta metas concluidas filtrando pelo campo booleano 'concluida' - O(n)
  const metasConcluidas = useMemo(
    () => goals.filter(m => m.concluida).length,
    [goals]
  );

  /**
   * Gera dados do heatmap para os ultimos 28 dias.
   * Para cada dia, conta registros e verifica se houve recaida.
   * Complexidade: O(28 * (r + s)) onde r = registros e s = recaidas.
   * @type {Array<{date: string, count: number, hasRelapse: boolean, day: number}>}
   */
  const heatmapData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 27; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = allRecords.filter(r => r.data_registro === dateStr).length;
      const hasRelapse = relapses.some(r => r.data_recaida?.split('T')[0] === dateStr);
      days.push({ date: dateStr, count, hasRelapse, day: date.getDay() });
    }

    return days;
  }, [allRecords, relapses]);

  /**
   * Monta lista de atividades recentes combinando registros, recaidas e metas concluidas.
   * Ordena por data decrescente e limita a 8 eventos.
   * Complexidade: O(r + s + m + k*log(k)) onde k = total de eventos combinados.
   * @type {Array<{id: string, type: string, date: Date, text: string, icon: React.Component}>}
   */
  const recentActivity = useMemo(() => {
    const events = [];

    allRecords.slice(-5).forEach(r => {
      events.push({
        id: `reg-${r.id}`,
        type: 'registro',
        date: new Date(r.data_registro),
        text: `Registro de humor: ${r.humor}`,
        icon: BookOpen
      });
    });

    relapses.slice(-3).forEach(r => {
      events.push({
        id: `rec-${r.id}`,
        type: 'recaida',
        date: new Date(r.data_recaida),
        text: 'Recaida registrada',
        icon: Repeat
      });
    });

    goals.filter(m => m.concluida).slice(-3).forEach(m => {
      events.push({
        id: `meta-${m.id}`,
        type: 'meta',
        date: new Date(m.data_criacao),
        text: `Meta concluida: ${m.descricao_meta}`,
        icon: Target
      });
    });

    return events.sort((a, b) => b.date - a.date).slice(0, 8);
  }, [allRecords, relapses, goals]);

  /**
   * Calcula a media de humor dos ultimos 7 dias usando escala numerica (1-5).
   * Retorna null se nao houver registros no periodo.
   * Complexidade: O(n) onde n = total de registros.
   * @type {number|null}
   */
  const moodTrend = useMemo(() => {
    const moodScore = { excelente: 5, bom: 4, neutro: 3, ruim: 2, pessimo: 1, 'pÃ©ssimo': 1 };
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const recent = allRecords.filter(r => new Date(r.data_registro) >= last7 && r.humor);

    if (recent.length === 0) return null;

    return recent.reduce((acc, r) => acc + (moodScore[r.humor] || 3), 0) / recent.length;
  }, [allRecords]);

  /**
   * Handler para opcao "Refletir" no modal de recaida.
   * Registra a recaida sem resetar o contador de dias.
   * @param {Object} vicio - Objeto do vicio em que ocorreu a recaida
   */
  const handleRefletir = async (vicio) => {
    await registerRelapse(vicio);
    setRecaidaVicio(null);
  };

  /**
   * Handler para opcao "Resetar" no modal de recaida.
   * Registra a recaida e reseta o contador de abstinencia.
   * @param {Object} vicio - Objeto do vicio em que ocorreu a recaida
   */
  const handleResetar = async (vicio) => {
    await registerRelapse(vicio, { resetCounter: true });
    setRecaidaVicio(null);
  };

  return (
    <div className="space-y-6">
      <RecaidaModal
        isOpen={recaidaVicio !== null}
        onClose={() => setRecaidaVicio(null)}
        vicio={recaidaVicio}
        onRefletir={handleRefletir}
        onResetar={handleResetar}
        loading={loading}
      />

      <NovoVicioWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSubmit={async (payload) => {
          await createAddiction(payload);
          setShowWizard(false);
        }}
        loading={loading}
      />

      <HeroKpis
        totalDiasLimpos={totalDiasLimpos}
        totalEconomizado={totalEconomizado}
        maiorStreak={maiorStreak}
        metasConcluidas={metasConcluidas}
        moodTrend={moodTrend}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${glassSurface} rounded-3xl p-6 border border-slate-700/60 lg:col-span-2`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white border border-slate-700/60">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/60">Mensagem do dia</p>
                <h3 className="text-xl font-semibold text-white mb-1">Respire, avance, celebre</h3>
                <p className="text-lg font-medium text-white/75">{motivationalMessage}</p>
              </div>
            </div>
          </div>
        </div>

        <ActivityHeatmap heatmapData={heatmapData} />
      </div>

      {addictions.length === 0 && !loading ? (
        <EmptyState
          icon={Heart}
          title="Nenhum vicio cadastrado"
          description="Comece sua jornada de recuperacao adicionando o primeiro habito que deseja controlar."
          action={() => setShowWizard(true)}
          actionLabel="Cadastrar primeiro habito"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addictions.map(vicio => (
            <VicioCard
              key={vicio.id}
              vicio={vicio}
              recaidas={relapses}
              metas={goals}
              onViewDetails={() => {
                loadAddictionDetails(vicio.id);
                navigate(`/vicios/${vicio.id}`);
              }}
              onDelete={() => deleteAddiction(vicio)}
              onRegisterRelapse={() => setRecaidaVicio(vicio)}
            />
          ))}

          <button
            onClick={() => setShowWizard(true)}
            className={`${glassSurface} border-dashed border-white/15 rounded-3xl hover:border-[#7CF6C4] hover:bg-[#7CF6C4]/5 transition p-6 flex flex-col items-center justify-center gap-3 min-h-[300px]`}
          >
            <Plus className="w-12 h-12 text-[#7D8BA8]" />
            <span className="text-lg font-semibold text-white/70 hover:text-white">Adicionar novo habito</span>
          </button>
        </div>
      )}

      <RecentTimeline recentActivity={recentActivity} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 sm:hidden">
        <div className={`${glassSurface} rounded-2xl p-2 flex gap-2 backdrop-blur-xl`}>
          <button onClick={() => setShowWizard(true)} className="p-3 rounded-xl bg-[#7CF6C4]/20 text-[#7CF6C4]">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/metas')} className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Target className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/analytics')} className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
