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
import EmptyState from '../components/ui/EmptyState';
import HeroKpis from '../components/dashboard/HeroKpis';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import VicioCard from '../components/dashboard/VicioCard';
import RecentTimeline from '../components/dashboard/RecentTimeline';
import SelectHumor from '../components/ui/SelectHumor';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { fieldBase, glassSurface, moodOptions } from '../utils/constants';

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
  const { loading, openNewAddictionWizard } = useUI();
  const {
    addictions,
    motivationalMessage,
    relapses,
    allRecords,
    goals,
    deleteAddiction,
    createRecordForAddiction,
    registerRelapse,
    loadAddictionDetails
  } = useData();

  /** @type {Object|null} Vicio selecionado para registro de recaida (abre RecaidaModal) */
  const [recaidaVicio, setRecaidaVicio] = useState(null);
  /** @type {{ humor: string, vicio_id: string }} Estado do registro rapido de humor */
  const [moodCheckIn, setMoodCheckIn] = useState({ humor: '', vicio_id: '' });

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
    const moodScore = { excelente: 5, bom: 4, neutro: 3, ruim: 2, pessimo: 1, 'péssimo': 1, [`p${'\u00c3\u00a9'}ssimo`]: 1 };
    const last7 = new Date();
    last7.setDate(last7.getDate() - 7);
    const recent = allRecords.filter(r => new Date(r.data_registro) >= last7 && r.humor);

    if (recent.length === 0) return null;

    return recent.reduce((acc, r) => acc + (moodScore[r.humor] || 3), 0) / recent.length;
  }, [allRecords]);

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedMoodAddictionId = moodCheckIn.vicio_id || (addictions[0]?.id ? String(addictions[0].id) : '');
  const todayMoodRecord = useMemo(
    () => allRecords.find(r => r.data_registro === todayStr && r.humor),
    [allRecords, todayStr]
  );
  const todayMoodOption = moodOptions.find(option => option.value === todayMoodRecord?.humor);

  const handleMoodCheckIn = async (event) => {
    event.preventDefault();
    const success = await createRecordForAddiction({ humor: moodCheckIn.humor }, selectedMoodAddictionId);
    if (success) setMoodCheckIn(prev => ({ ...prev, humor: '' }));
  };

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

      <PageHeader
        eyebrow="Visão geral"
        title="Sua jornada, em tempo real"
        description="Acompanhe progresso, humor, metas e atividade recente em uma visão única."
        actions={(
          <Button type="button" variant="primary" onClick={openNewAddictionWizard}>
            <Plus className="w-4 h-4" />
            Novo hábito
          </Button>
        )}
      />

      <HeroKpis
        totalDiasLimpos={totalDiasLimpos}
        totalEconomizado={totalEconomizado}
        maiorStreak={maiorStreak}
        metasConcluidas={metasConcluidas}
        moodTrend={moodTrend}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`${glassSurface} rounded-3xl p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 icon-tile text-teal-300">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="eyebrow">Mensagem do dia</p>
                  <h3 className="text-xl font-semibold text-app mb-1">Respire, avance, celebre</h3>
                  <p className="text-lg font-medium text-muted">{motivationalMessage}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${glassSurface} rounded-3xl p-6`}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="eyebrow">Registro de humor</p>
                  <h3 className="text-xl font-semibold text-app mb-1">Como você está se sentindo hoje?</h3>
                  <p className="text-sm text-muted">Esse registro entra na atividade dos últimos 28 dias.</p>
                </div>
                {todayMoodRecord && (
                  <span className="self-start px-3 py-1 rounded-full bg-teal-400/12 text-teal-300 border border-teal-300/25 text-xs font-semibold">
                    Hoje: {todayMoodOption?.label || todayMoodRecord.humor}
                  </span>
                )}
              </div>

              <form onSubmit={handleMoodCheckIn} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-app">Humor</span>
                    <SelectHumor
                      value={moodCheckIn.humor}
                      onChange={(valor) => setMoodCheckIn(prev => ({ ...prev, humor: valor }))}
                      label="Selecione como você está..."
                    />
                  </div>

                  {addictions.length > 1 ? (
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-app">Hábito</span>
                      <select
                        value={selectedMoodAddictionId}
                        onChange={(event) => setMoodCheckIn(prev => ({ ...prev, vicio_id: event.target.value }))}
                        className={fieldBase}
                      >
                        {addictions.map(vicio => (
                          <option key={vicio.id} value={String(vicio.id)}>{vicio.nome_vicio}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div className="rounded-2xl surface-muted p-4">
                      <span className="text-sm font-semibold text-app">Hábito</span>
                      <p className="text-sm text-muted mt-1">
                        {addictions[0]?.nome_vicio || 'Cadastre um hábito para salvar registros de humor.'}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !moodCheckIn.humor || !selectedMoodAddictionId}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Salvar humor de hoje
                </Button>
              </form>
            </div>
          </div>
        </div>

        <ActivityHeatmap heatmapData={heatmapData} />
      </div>

      {addictions.length === 0 && !loading ? (
        <EmptyState
          icon={Heart}
          title="Nenhum hábito cadastrado"
          description="Comece sua jornada adicionando o primeiro hábito que deseja controlar."
          action={openNewAddictionWizard}
          actionLabel="Cadastrar primeiro hábito"
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
            onClick={openNewAddictionWizard}
            className={`${glassSurface} border-dashed border-teal-300/20 rounded-3xl hover:border-teal-300/60 hover:bg-teal-400/5 transition p-6 flex flex-col items-center justify-center gap-3 min-h-[300px]`}
          >
            <Plus className="w-12 h-12 text-teal-300" />
            <span className="text-lg font-semibold text-muted hover:text-app">Adicionar novo hábito</span>
          </button>
        </div>
      )}

      <RecentTimeline recentActivity={recentActivity} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 sm:hidden">
        <div className={`${glassSurface} rounded-2xl p-2 flex gap-2 backdrop-blur-xl`}>
          <button onClick={openNewAddictionWizard} className="p-3 rounded-xl bg-teal-400/20 text-teal-300" title="Novo hábito">
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
