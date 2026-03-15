import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Target } from 'lucide-react';

const surface = 'bg-slate-900/80 border border-slate-700/60';
const field = 'w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-700/50 text-white placeholder-white/50 focus:border-[#5CC8FF] focus:ring-2 focus:ring-[#5CC8FF]/30 outline-none transition';
const pill = 'px-2 py-1 rounded-full text-xs font-semibold border border-white/15 bg-white/5 text-white/70';

const MetasCard = ({ metas, vicios, onAddMeta, onCompleteMeta, onDeleteMeta, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [formMeta, setFormMeta] = useState({
    vicio_id: '',
    descricao_meta: '',
    dias_objetivo: '',
    valor_objetivo: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formMeta.vicio_id || !formMeta.descricao_meta) return;

    await onAddMeta(formMeta);
    setFormMeta({ vicio_id: '', descricao_meta: '', dias_objetivo: '', valor_objetivo: '' });
    setShowForm(false);
  };

  const metasCompletadas = metas.filter(m => m.concluida).length;
  const metasAtivas = metas.filter(m => !m.concluida);

  // Encontrar o vício correspondente para cada meta
  const getVicioNome = (vicioId) => {
    const vicio = vicios.find(v => v.id === vicioId);
    return vicio ? vicio.nome_vicio : 'Vício não encontrado';
  };

  // Calcular progresso baseado em dias ou valor
  const calcularProgresso = (meta) => {
    if (meta.dias_objetivo) {
      const vicio = vicios.find(v => v.id === meta.vicio_id);
      if (vicio) {
        const progresso = Math.min((vicio.dias_abstinencia / parseInt(meta.dias_objetivo)) * 100, 100);
        return Math.round(progresso);
      }
    }
    if (meta.valor_objetivo) {
      const vicio = vicios.find(v => v.id === meta.vicio_id);
      if (vicio) {
        const progresso = Math.min((Number(vicio.valor_economizado) / parseFloat(meta.valor_objetivo)) * 100, 100);
        return Math.round(progresso);
      }
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${surface} rounded-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#7D8BA8] text-sm font-medium">Metas Ativas</p>
              <p className="text-4xl font-bold text-[#7CF6C4] mt-2">{metasAtivas.length}</p>
            </div>
            <Target className="w-8 h-8 text-[#7CF6C4] opacity-50" />
          </div>
        </div>
        <div className={`${surface} rounded-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#7D8BA8] text-sm font-medium">Metas Concluídas</p>
              <p className="text-4xl font-bold text-[#35D3FF] mt-2">{metasCompletadas}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-[#35D3FF] opacity-50" />
          </div>
        </div>
      </div>

      {/* Metas Ativas */}
      {metasAtivas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Metas em Progresso</h3>
          {metasAtivas.map((meta) => {
            const progresso = calcularProgresso(meta);
            const isCompleted = progresso >= 100;

            return (
              <div key={meta.id} className={`${surface} rounded-xl p-4 space-y-3`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{meta.descricao_meta}</p>
                      <span className="text-xs px-2 py-1 rounded bg-[#7CF6C4]/20 text-[#7CF6C4]">
                        {getVicioNome(meta.vicio_id)}
                      </span>
                    </div>
                    {meta.dias_objetivo && (
                      <p className="text-sm text-[#7D8BA8]">
                        Objetivo: {meta.dias_objetivo} dias de abstinência
                      </p>
                    )}
                    {meta.valor_objetivo && (
                      <p className="text-sm text-[#7D8BA8]">
                        Objetivo: R$ {parseFloat(meta.valor_objetivo).toFixed(2)} economizados
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteMeta(meta.id)}
                    className="p-2 text-[#7D8BA8] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition border border-transparent hover:border-red-500/30"
                    title="Excluir meta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-full bg-[#2A3352]/50 rounded-full h-2 mr-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-[#35D3FF]' : 'bg-[#7CF6C4]'
                        }`}
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#7CF6C4] min-w-[45px] text-right">
                      {progresso}%
                    </span>
                  </div>

                  {/* Botão de Completar */}
                  {isCompleted && !meta.concluida && (
                    <button
                      onClick={() => onCompleteMeta(meta.id)}
                      disabled={loading}
                      className="w-full py-2 bg-[#35D3FF]/20 text-[#35D3FF] rounded-lg hover:bg-[#35D3FF]/30 transition font-medium border border-[#35D3FF]/30 disabled:opacity-50"
                    >
                      ✓ Marcar como Concluída
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Metas Concluídas */}
      {metasCompletadas > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-[#7D8BA8] hover:text-[#7CF6C4] transition">
            ✓ Metas Concluídas ({metasCompletadas})
          </summary>
          <div className="space-y-2 mt-3">
            {metas.filter(m => m.concluida).map((meta) => (
              <div
                key={meta.id}
                className={`${surface} rounded-lg p-3 flex items-center justify-between opacity-75`}
              >
                <div>
                  <p className="text-white line-through">{meta.descricao_meta}</p>
                  <p className="text-xs text-[#7D8BA8]">{getVicioNome(meta.vicio_id)}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-[#35D3FF]" />
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Formulário para Nova Meta */}
      <div>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 border-2 border-dashed border-white/15 rounded-xl hover:border-[#7CF6C4] hover:bg-[#7CF6C4]/5 transition text-white/70 hover:text-white font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Meta
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 bg-[#201B2C] backdrop-blur-xl rounded-xl p-4 border border-[#2A3352]/50">
            <select
              value={formMeta.vicio_id}
              onChange={(e) => setFormMeta({ ...formMeta, vicio_id: e.target.value })}
              className={field}
            >
              <option value="">Selecione um vício</option>
              {vicios.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome_vicio}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={formMeta.descricao_meta}
              onChange={(e) => setFormMeta({ ...formMeta, descricao_meta: e.target.value })}
              placeholder="Descrição da meta..."
              className={field}
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={formMeta.dias_objetivo}
                onChange={(e) => setFormMeta({ ...formMeta, dias_objetivo: e.target.value })}
                placeholder="Dias objetivo"
                className={field}
              />
              <input
                type="number"
                step="0.01"
                value={formMeta.valor_objetivo}
                onChange={(e) => setFormMeta({ ...formMeta, valor_objetivo: e.target.value })}
                placeholder="Valor objetivo (R$)"
                className={field}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !formMeta.vicio_id || !formMeta.descricao_meta}
                className="flex-1 py-2 rounded-xl font-semibold bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar Meta
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormMeta({ vicio_id: '', descricao_meta: '', dias_objetivo: '', valor_objetivo: '' });
                }}
                className="flex-1 py-2 rounded-xl bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MetasCard;
