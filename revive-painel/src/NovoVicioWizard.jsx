import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Check, AlertCircle } from 'lucide-react';

const NovoVicioWizard = ({ isOpen, onClose, onSubmit, loading }) => {
  const [etapa, setEtapa] = useState(0);
  const [formData, setFormData] = useState({
    tipo: '',
    tipoPersonalizado: '',
    objetivo: 'parar',
    objetivoPersonalizado: '',
    prazo: '30',
    dataInicio: new Date().toISOString().split('T')[0],
    valorDia: '',
    lembretesDiarios: true,
    reminderTime: '09:00'
  });

  const [erros, setErros] = useState({});

  // Detectar ESC para fechar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleFechar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const categorias = [
    { id: 'cigarro', label: 'Cigarro', emoji: '🚬' },
    { id: 'alcool', label: 'Álcool', emoji: '🍷' },
    { id: 'jogos', label: 'Jogos', emoji: '🎮' },
    { id: 'redes-sociais', label: 'Redes Sociais', emoji: '📱' },
    { id: 'doces', label: 'Doces', emoji: '🍬' },
    { id: 'cafe', label: 'Café', emoji: '☕' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { id: 'outro', label: 'Outro', emoji: '➕' }
  ];

  const objetivos = [
    { id: 'parar', label: 'Parar Completamente', desc: 'Abstinência total' },
    { id: 'reduzir', label: 'Reduzir', desc: 'Diminuir gradualmente' },
    { id: 'personalizado', label: 'Personalizado', desc: 'Minha própria meta' }
  ];

  const prazos = [
    { id: '7', label: '1 Semana', dias: 7 },
    { id: '30', label: '1 Mês', dias: 30 },
    { id: '90', label: '3 Meses', dias: 90 },
    { id: '365', label: '1 Ano', dias: 365 },
    { id: 'outro', label: 'Outro', dias: null }
  ];

  const etapas = [
    { numero: 1, titulo: 'Tipo de Vício', descricao: 'O que você deseja controlar?' },
    { numero: 2, titulo: 'Objetivo', descricao: 'Qual é sua meta?' },
    { numero: 3, titulo: 'Prazo', descricao: 'Em quanto tempo?' },
    { numero: 4, titulo: 'Economia', descricao: 'Quanto economizará?' },
    { numero: 5, titulo: 'Lembrete', descricao: 'Deseja lembretes?' }
  ];

  const validarEtapa = (numero) => {
    const novasErros = {};

    if (numero === 0) {
      if (!formData.tipo) novasErros.tipo = 'Selecione uma categoria';
      if (formData.tipo === 'outro' && !formData.tipoPersonalizado) {
        novasErros.tipoPersonalizado = 'Digite o nome do vício';
      }
    }

    if (numero === 1) {
      if (!formData.objetivo) novasErros.objetivo = 'Selecione um objetivo';
      if (formData.objetivo === 'personalizado' && !formData.objetivoPersonalizado) {
        novasErros.objetivoPersonalizado = 'Descreva sua meta personalizada';
      }
    }

    if (numero === 2) {
      if (!formData.prazo) novasErros.prazo = 'Selecione um prazo';
    }

    if (numero === 3) {
      if (!formData.valorDia || parseFloat(formData.valorDia) < 0) {
        novasErros.valorDia = 'Digite um valor válido (ou 0)';
      }
    }

    setErros(novasErros);
    return Object.keys(novasErros).length === 0;
  };

  const handleProximo = () => {
    if (validarEtapa(etapa) && etapa < etapas.length - 1) {
      setEtapa(etapa + 1);
    }
  };

  const handleAnterior = () => {
    if (etapa > 0) {
      setEtapa(etapa - 1);
      setErros({});
    }
  };

  const handleSubmit = async () => {
    if (!validarEtapa(etapa)) return;

    const nomeVicio = formData.tipo === 'outro' ? formData.tipoPersonalizado : 
      categorias.find(c => c.id === formData.tipo)?.label;

    const payload = {
      nome_vicio: nomeVicio,
      data_inicio: formData.dataInicio,
      valor_economizado_por_dia: parseFloat(formData.valorDia) || 0,
      meta: formData.objetivo === 'personalizado' ? formData.objetivoPersonalizado : formData.objetivo,
      prazo_dias: parseInt(formData.prazo) || 0,
      lembrete_ativo: formData.lembretesDiarios
    };

    try {
      await onSubmit(payload);
      handleFechar();
    } catch (error) {
      setErros({ submit: error.message });
    }
  };

  const handleFechar = () => {
    setEtapa(0);
    setFormData({
      tipo: '',
      tipoPersonalizado: '',
      objetivo: 'parar',
      objetivoPersonalizado: '',
      prazo: '30',
      dataInicio: new Date().toISOString().split('T')[0],
      valorDia: '',
      lembretesDiarios: true,
      reminderTime: '09:00'
    });
    setErros({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-48 bg-slate-900/60 border-b border-white/10 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Novo Vício</h1>
            <p className="text-white/70">Etapa {etapa + 1} de {etapas.length}</p>
          </div>
          <button
            onClick={handleFechar}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pt-6">
          <div className="flex justify-between items-center mb-8">
            {etapas.map((e, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    idx <= etapa
                      ? 'bg-slate-800 text-white border border-slate-700/60'
                      : 'bg-white/10 text-white/50 border border-white/20'
                  }`}
                >
                  {idx < etapa ? <Check className="w-5 h-5" /> : e.numero}
                </div>
                {idx < etapas.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 mt-2 rounded-full transition ${
                      idx < etapa ? 'bg-[#7CF6C4]' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-8 py-6 min-h-80 relative overflow-hidden">
          <h2 className="text-2xl font-bold text-white mb-2">{etapas[etapa].titulo}</h2>
          <p className="text-white/70 mb-6">{etapas[etapa].descricao}</p>

          {/* Etapa 0: Tipo */}
          {etapa === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setFormData({ ...formData, tipo: cat.id, tipoPersonalizado: '' });
                      setErros({ ...erros, tipo: '' });
                    }}
                    className={`p-4 rounded-xl transition text-center border ${
                      formData.tipo === cat.id
                        ? 'bg-[#7CF6C4]/30 border-[#7CF6C4] shadow-lg shadow-[#7CF6C4]/30'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-2">{cat.emoji}</div>
                    <div className="text-sm font-medium text-white">{cat.label}</div>
                  </button>
                ))}
              </div>
              {formData.tipo === 'outro' && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">Qual é o vício?</label>
                  <input
                    type="text"
                    value={formData.tipoPersonalizado}
                    onChange={(e) => setFormData({ ...formData, tipoPersonalizado: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#7CF6C4] focus:bg-white/10 transition"
                    placeholder="Ex: Pornografia, Comida rápida..."
                  />
                </div>
              )}
              {erros.tipo && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{erros.tipo}</div>}
              {erros.tipoPersonalizado && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{erros.tipoPersonalizado}</div>}
            </div>
          )}

          {/* Etapa 1: Objetivo */}
          {etapa === 1 && (
            <div className="space-y-3">
              {objetivos.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => {
                    setFormData({ ...formData, objetivo: obj.id, objetivoPersonalizado: '' });
                    setErros({ ...erros, objetivo: '' });
                  }}
                className={`w-full p-4 rounded-xl transition border text-left ${
                  formData.objetivo === obj.id
                    ? 'bg-[#7CF6C4]/30 border-[#7CF6C4] shadow-lg shadow-[#7CF6C4]/30'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                  <div className="font-semibold text-white">{obj.label}</div>
                  <div className="text-sm text-white/60">{obj.desc}</div>
                </button>
              ))}
              {formData.objetivo === 'personalizado' && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">Descreva sua meta personalizada</label>
                  <textarea
                    value={formData.objetivoPersonalizado}
                    onChange={(e) => setFormData({ ...formData, objetivoPersonalizado: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#7CF6C4] focus:bg-white/10 transition resize-none"
                    placeholder="Ex: Reduzir para 5 cigarros por dia em 3 meses..."
                    rows="3"
                  />
                </div>
              )}
              {erros.objetivo && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{erros.objetivo}</div>}
              {erros.objetivoPersonalizado && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{erros.objetivoPersonalizado}</div>}
            </div>
          )}

          {/* Etapa 2: Prazo */}
          {etapa === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {prazos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setFormData({ ...formData, prazo: p.id });
                      setErros({ ...erros, prazo: '' });
                    }}
                    className={`p-4 rounded-xl transition border text-center ${
                      formData.prazo === p.id
                        ? 'bg-[#7CF6C4]/30 border-[#7CF6C4] shadow-lg shadow-[#7CF6C4]/30'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold text-white">{p.label}</div>
                  </button>
                ))}
              </div>
              {erros.prazo && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{erros.prazo}</div>}
            </div>
          )}

          {/* Etapa 3: Economia */}
          {etapa === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Quanto você gasta por dia? (R$)</label>
                <div className="flex items-center gap-2">
                <span className="text-2xl text-[#7CF6C4]">R$</span>
                <input
                  type="number"
                  step="0.01"
                    min="0"
                    value={formData.valorDia}
                    onChange={(e) => {
                      setFormData({ ...formData, valorDia: e.target.value });
                      setErros({ ...erros, valorDia: '' });
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white text-2xl placeholder-white/30 focus:outline-none focus:border-[#7CF6C4] focus:bg-white/10 transition"
                    placeholder="0.00"
                  />
                </div>
                {formData.valorDia && (
                  <div className="mt-4 p-4 bg-[#7CF6C4]/10 border border-[#7CF6C4]/30 rounded-lg">
                    <p className="text-white/70 text-sm">Economia estimada:</p>
                    <p className="text-2xl font-bold text-[#7CF6C4]">
                      R$ {(parseFloat(formData.valorDia) * 30).toFixed(2)}/mês
                    </p>
                    <p className="text-white/60 text-xs mt-1">
                      R$ {(parseFloat(formData.valorDia) * 365).toFixed(2)}/ano
                    </p>
                  </div>
                )}
              </div>
              {erros.valorDia && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{erros.valorDia}</div>}
            </div>
          )}

          {/* Etapa 4: Lembretes */}
          {etapa === 4 && (
            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 bg-white/5 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10 transition">
                <input
                  type="checkbox"
                  checked={formData.lembretesDiarios}
                  onChange={(e) => setFormData({ ...formData, lembretesDiarios: e.target.checked })}
                  className="w-5 h-5 rounded accent-[#7CF6C4]"
                />
                <div>
                  <div className="font-semibold text-white">Lembretes Diários</div>
                  <div className="text-sm text-white/60">Receba notificações de motivação</div>
                </div>
              </label>

              {formData.lembretesDiarios && (
                <div>
                  <label className="block text-white/70 text-sm mb-2">Horário do lembrete</label>
                  <input
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#7CF6C4] focus:bg-white/10 transition"
                />
              </div>
              )}

              <div className="p-4 bg-[#7CF6C4]/10 border border-[#7CF6C4]/30 rounded-lg">
                <p className="text-white/70 text-sm">📱 Você receberá mensagens motivacionais para manter a força!</p>
              </div>
            </div>
          )}

          {erros.submit && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mt-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-400 text-sm">{erros.submit}</span>
            </div>
          )}
        </div>

        {/* Footer - Botões */}
        <div className="px-8 py-6 border-t border-white/10 bg-white/5 flex justify-between gap-4">
          <button
            onClick={handleAnterior}
            disabled={etapa === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleFechar}
              className="px-6 py-3 bg-white/5 text-white rounded-lg hover:bg-white/10 transition border border-white/20"
            >
              Cancelar
            </button>

            {etapa < etapas.length - 1 ? (
              <button
                onClick={handleProximo}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800/70 text-white rounded-lg border border-slate-700/60 hover:bg-slate-800 transition font-semibold"
            >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800/70 text-white rounded-lg border border-slate-700/60 hover:bg-slate-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Check className="w-5 h-5" />
                <span>{loading ? 'Salvando...' : 'Concluir'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovoVicioWizard;
