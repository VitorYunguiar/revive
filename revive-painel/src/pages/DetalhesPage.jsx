/**
 * @file DetalhesPage.jsx
 * @description Pagina de detalhes de um vicio especifico na aplicacao REVIVE.
 *
 * Exibe informacoes detalhadas de um vicio selecionado: dias de abstinencia,
 * valor economizado, economia diaria, formulario de registro diario,
 * formulario de criacao de metas e historico de registros.
 *
 * Utiliza o hook useParams do React Router para obter o ID do vicio via URL.
 * Carrega detalhes do vicio no useEffect quando o ID muda.
 * Aplica animacao de transicao com Framer Motion (screenTransition).
 *
 * @component
 * @see {@link useData} Hook para acessar e manipular dados do vicio selecionado
 * @see {@link useUI} Hook para estado de carregamento (loading)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, TrendingUp, Trash2, Target, BookOpen } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import RecaidaModal from '../components/modals/RecaidaModal';
import SelectHumor from '../components/ui/SelectHumor';
import { InputField } from '../components/ui/Field';
import { glassSurface, fieldBase, screenTransition } from '../utils/constants';

/**
 * Componente da pagina de detalhes de um vicio.
 *
 * Gerencia tres estados locais: modal de recaida, formulario de registro
 * diario (humor, gatilhos, conquistas, observacoes) e formulario de nova meta.
 * Filtra metas associadas ao vicio atual para exibicao.
 *
 * @returns {JSX.Element} Pagina com header de KPIs, formularios e historico
 */
export default function DetalhesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading } = useUI();
  const {
    selectedAddiction, selectedAddictionRecords, goals,
    loadAddictionDetails, deleteAddiction,
    registerRelapse,
    createRecord, createGoal
  } = useData();

  /** @type {Object|null} Vicio selecionado para abrir o modal de recaida */
  const [recaidaVicio, setRecaidaVicio] = useState(null);
  /** @type {Object} Estado controlado do formulario de registro diario */
  const [formRegistro, setFormRegistro] = useState({ humor: '', gatilhos: '', conquistas: '', observacoes: '' });
  /** @type {Object} Estado controlado do formulario de nova meta */
  const [formMeta, setFormMeta] = useState({ descricao_meta: '', dias_objetivo: '', valor_objetivo: '' });

  // Carrega detalhes do vicio quando o parametro de rota (id) muda
  useEffect(() => {
    if (id) loadAddictionDetails(id);
  }, [id]);

  if (!selectedAddiction) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Carregando detalhes...</p>
      </div>
    );
  }

  /**
   * Envia o formulario de registro diario.
   * Limpa o formulario apos sucesso.
   * @param {Event} e - Evento de submit do formulario
   */
  const handleSubmitRegistro = async (e) => {
    e.preventDefault();
    const success = await createRecord(formRegistro);
    if (success) setFormRegistro({ humor: '', gatilhos: '', conquistas: '', observacoes: '' });
  };

  /**
   * Envia o formulario de nova meta vinculada ao vicio atual.
   * Limpa o formulario apos envio.
   * @param {Event} e - Evento de submit do formulario
   */
  const handleSubmitMeta = async (e) => {
    e.preventDefault();
    await createGoal({ ...formMeta, vicio_id: selectedAddiction.id });
    setFormMeta({ descricao_meta: '', dias_objetivo: '', valor_objetivo: '' });
  };

  /**
   * Registra recaida no modo "Refletir" (sem resetar contador).
   * Apos registro, faz scroll suave ate o formulario de registro diario.
   * @param {Object} vicio - Objeto do vicio
   */
  const handleRefletir = async (vicio) => {
    await registerRelapse(vicio);
    setRecaidaVicio(null);
    setTimeout(() => {
      document.getElementById('form-registro')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  /**
   * Registra recaida no modo "Resetar" (zera o contador de abstinencia).
   * @param {Object} vicio - Objeto do vicio
   */
  const handleResetar = async (vicio) => {
    await registerRelapse(vicio, { resetCounter: true });
    setRecaidaVicio(null);
  };

  // Filtra metas vinculadas ao vicio atualmente selecionado - O(n) onde n = total de metas
  const addictionGoals = goals.filter(m => m.vicio_id === selectedAddiction.id);

  return (
    <motion.div {...screenTransition} className="space-y-6">
      <RecaidaModal
        isOpen={recaidaVicio !== null}
        onClose={() => setRecaidaVicio(null)}
        vicio={recaidaVicio}
        onRefletir={handleRefletir}
        onResetar={handleResetar}
        loading={loading}
      />

      {/* Header */}
      <div className={`${glassSurface} rounded-3xl p-6 border border-slate-700/60`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Foco e consistencia</p>
            <h2 className="text-3xl font-bold text-white">{selectedAddiction.nome_vicio}</h2>
            <p className="text-lg text-white/70 mt-1">{selectedAddiction.tempo_formatado}</p>
          </div>
          <button onClick={() => { deleteAddiction(selectedAddiction); navigate('/'); }} className="p-3 text-rose-200 hover:bg-rose-500/15 rounded-lg transition border border-rose-300/30">
            <Trash2 className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-[#7CF6C4]" />
              <h3 className="font-semibold text-white/80">Dias limpo</h3>
            </div>
            <p className="text-4xl font-bold text-white">{selectedAddiction.dias_abstinencia}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-[#35D3FF]" />
              <h3 className="font-semibold text-white/80">Economizado</h3>
            </div>
            <p className="text-4xl font-bold text-white">R$ {Number(selectedAddiction.valor_economizado).toFixed(2)}</p>
          </div>
          <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-amber-300" />
              <h3 className="font-semibold text-white/80">Economia diaria</h3>
            </div>
            <p className="text-4xl font-bold text-white">R$ {Number(selectedAddiction.valor_economizado_por_dia).toFixed(2)}</p>
          </div>
        </div>
        <button onClick={() => setRecaidaVicio(selectedAddiction)} className="w-full mt-6 px-6 py-3 bg-rose-500/15 text-rose-100 rounded-xl hover:bg-rose-500/25 transition font-semibold border border-rose-300/30">
          Registrar Recaida
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta + Metas ativas */}
        <div className="space-y-6">
          <div className={`${glassSurface} rounded-3xl p-6 border border-white/10`}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Target className="w-6 h-6 text-[#7CF6C4]" />Nova meta para "{selectedAddiction.nome_vicio}"</h3>
            <form onSubmit={handleSubmitMeta} className="space-y-4">
              <InputField type="text" value={formMeta.descricao_meta} onChange={(e) => setFormMeta({ ...formMeta, descricao_meta: e.target.value })} required label="Descricao da meta" placeholder="Algo que motive voce" />
              <div className="grid grid-cols-2 gap-3">
                <InputField type="number" min="1" value={formMeta.dias_objetivo} onChange={(e) => setFormMeta({ ...formMeta, dias_objetivo: e.target.value })} label="Dias objetivo" placeholder="Ex: 30" />
                <InputField type="number" step="0.01" min="0" value={formMeta.valor_objetivo} onChange={(e) => setFormMeta({ ...formMeta, valor_objetivo: e.target.value })} label="Valor objetivo (R$)" placeholder="Ex: 150.00" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-2xl font-semibold bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition disabled:opacity-50">Criar meta</button>
            </form>
          </div>

          {addictionGoals.length > 0 && (
            <div className={`${glassSurface} rounded-3xl p-6 border border-white/10`}>
              <h3 className="text-xl font-bold text-white mb-4">Metas Ativas</h3>
              <div className="space-y-3">
                {addictionGoals.map((meta) => (
                  <div key={meta.id} className="p-4 bg-white/5 backdrop-blur rounded-lg border border-white/20">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-white">{meta.descricao_meta}</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${meta.concluida ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'}`}>
                        {meta.concluida ? 'Concluida' : 'Em Progresso'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-white/70">
                      {meta.dias_objetivo && <span>🎯 {meta.dias_objetivo} dias</span>}
                      {meta.valor_objetivo && <span>💰 R$ {Number(meta.valor_objetivo).toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Daily Registry Form */}
        <div id="form-registro" className={`${glassSurface} rounded-3xl p-6 border border-white/10`}>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BookOpen className="w-6 h-6 text-[#7CF6C4]" />Novo Registro Diario</h3>
          <form onSubmit={handleSubmitRegistro} className="space-y-4">
            <SelectHumor
              value={formRegistro.humor}
              onChange={(valor) => setFormRegistro({ ...formRegistro, humor: valor })}
              label="Selecione seu humor..."
            />
            <input type="text" value={formRegistro.gatilhos} onChange={(e) => setFormRegistro({ ...formRegistro, gatilhos: e.target.value })} className={fieldBase} placeholder="Gatilhos (separados por virgula)" />
            <textarea value={formRegistro.conquistas} onChange={(e) => setFormRegistro({ ...formRegistro, conquistas: e.target.value })} className={fieldBase} placeholder="Conquistas do dia..." rows="2" />
            <textarea value={formRegistro.observacoes} onChange={(e) => setFormRegistro({ ...formRegistro, observacoes: e.target.value })} className={fieldBase} placeholder="Observacoes..." rows="2" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-2xl font-semibold bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition disabled:opacity-50">Salvar registro</button>
          </form>
        </div>
      </div>

      {/* Record History */}
      {selectedAddictionRecords.length > 0 && (
        <div className={`${glassSurface} rounded-3xl p-6 border border-white/10`}>
          <h3 className="text-xl font-bold text-white mb-4">Historico de Registros</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {selectedAddictionRecords.map((registro) => (
              <div key={registro.id} className="p-4 bg-white/5 backdrop-blur rounded-lg border-l-4 border-[#7CF6C4]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/70">{new Date(registro.data_registro).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  <span className="px-3 py-1 bg-[#7CF6C4]/20 text-[#7CF6C4] rounded-full text-sm font-medium capitalize border border-[#7CF6C4]/30">{registro.humor}</span>
                </div>
                {registro.gatilhos && <p className="text-sm text-white/70 mb-1"><strong className="text-white">Gatilhos:</strong> {registro.gatilhos}</p>}
                {registro.conquistas && <p className="text-sm text-white/70 mb-1"><strong className="text-white">Conquistas:</strong> {registro.conquistas}</p>}
                {registro.observacoes && <p className="text-sm text-white/70"><strong className="text-white">Observacoes:</strong> {registro.observacoes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
