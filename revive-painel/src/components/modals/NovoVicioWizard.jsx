import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Check, AlertCircle, Bell, Wallet, Target, CalendarDays } from 'lucide-react';

const initialForm = () => ({
  tipo: '',
  tipoPersonalizado: '',
  objetivo: 'parar',
  objetivoPersonalizado: '',
  prazo: '30',
  prazoPersonalizado: '',
  dataInicio: new Date().toISOString().split('T')[0],
  valorDia: '',
  lembretesDiarios: true,
  reminderTime: '09:00'
});

const categories = [
  { id: 'cigarro', label: 'Cigarro', emoji: '🚬' },
  { id: 'alcool', label: 'Álcool', emoji: '🍷' },
  { id: 'jogos', label: 'Jogos', emoji: '🎮' },
  { id: 'redes-sociais', label: 'Redes sociais', emoji: '📱' },
  { id: 'doces', label: 'Doces', emoji: '🍬' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'outro', label: 'Outro', emoji: '+' }
];

const goals = [
  { id: 'parar', label: 'Parar completamente', desc: 'Abstinência total' },
  { id: 'reduzir', label: 'Reduzir', desc: 'Diminuir gradualmente' },
  { id: 'personalizado', label: 'Personalizado', desc: 'Definir minha própria meta' }
];

const deadlines = [
  { id: '7', label: '1 semana' },
  { id: '30', label: '1 mês' },
  { id: '90', label: '3 meses' },
  { id: '365', label: '1 ano' },
  { id: 'outro', label: 'Outro' }
];

const steps = [
  { number: 1, title: 'Tipo de hábito', description: 'O que você deseja controlar?' },
  { number: 2, title: 'Objetivo', description: 'Qual é a sua meta principal?' },
  { number: 3, title: 'Prazo', description: 'Qual horizonte combina com sua jornada?' },
  { number: 4, title: 'Economia', description: 'Quanto esse hábito custa por dia?' },
  { number: 5, title: 'Lembrete', description: 'Configure um apoio diário simples.' }
];

const optionClass = (active) => `p-4 rounded-2xl transition text-left border ${
  active
    ? 'bg-teal-400/18 border-teal-300/60 shadow-lg shadow-teal-400/10'
    : 'surface-muted hover:bg-black/5'
}`;

const ErrorMessage = ({ children }) => (
  <div className="flex items-center gap-2 text-rose-300 text-sm">
    <AlertCircle className="w-4 h-4" />
    {children}
  </div>
);

const NovoVicioWizard = ({ isOpen, onClose, onSubmit, loading }) => {
  const [etapa, setEtapa] = useState(0);
  const [formData, setFormData] = useState(initialForm);
  const [erros, setErros] = useState({});

  const handleFechar = useCallback(() => {
    setEtapa(0);
    setFormData(initialForm());
    setErros({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleFechar();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleFechar]);

  const validarEtapa = (numero) => {
    const nextErrors = {};

    if (numero === 0) {
      if (!formData.tipo) nextErrors.tipo = 'Selecione uma categoria.';
      if (formData.tipo === 'outro' && !formData.tipoPersonalizado.trim()) {
        nextErrors.tipoPersonalizado = 'Digite o nome do hábito.';
      }
    }

    if (numero === 1) {
      if (!formData.objetivo) nextErrors.objetivo = 'Selecione um objetivo.';
      if (formData.objetivo === 'personalizado' && !formData.objetivoPersonalizado.trim()) {
        nextErrors.objetivoPersonalizado = 'Descreva sua meta personalizada.';
      }
    }

    if (numero === 2) {
      if (!formData.prazo) nextErrors.prazo = 'Selecione um prazo.';
      if (formData.prazo === 'outro' && (!formData.prazoPersonalizado || parseInt(formData.prazoPersonalizado, 10) <= 0)) {
        nextErrors.prazoPersonalizado = 'Digite um prazo válido em dias.';
      }
    }

    if (numero === 3 && (formData.valorDia === '' || parseFloat(formData.valorDia) < 0)) {
      nextErrors.valorDia = 'Digite um valor válido, mesmo que seja 0.';
    }

    setErros(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProximo = () => {
    if (validarEtapa(etapa) && etapa < steps.length - 1) setEtapa(etapa + 1);
  };

  const handleAnterior = () => {
    if (etapa > 0) {
      setEtapa(etapa - 1);
      setErros({});
    }
  };

  const handleSubmit = async () => {
    if (!validarEtapa(etapa)) return;

    const nomeVicio = formData.tipo === 'outro'
      ? formData.tipoPersonalizado
      : categories.find(category => category.id === formData.tipo)?.label;

    const payload = {
      nome_vicio: nomeVicio,
      data_inicio: formData.dataInicio,
      valor_economizado_por_dia: parseFloat(formData.valorDia) || 0,
      meta: formData.objetivo === 'personalizado' ? formData.objetivoPersonalizado : formData.objetivo,
      prazo_dias: parseInt(formData.prazo === 'outro' ? formData.prazoPersonalizado : formData.prazo, 10) || 0,
      lembrete_ativo: formData.lembretesDiarios
    };

    try {
      await onSubmit(payload);
      handleFechar();
    } catch (error) {
      setErros({ submit: error.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl surface-strong rounded-[34px] overflow-hidden max-h-[92vh] flex flex-col">
        <div className="relative px-6 sm:px-8 py-6 border-b hairline">
          <p className="eyebrow mb-2">Novo cadastro</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-[-0.06em] text-app">Novo hábito</h1>
          <p className="text-muted mt-1">Etapa {etapa + 1} de {steps.length}</p>
          <button
            type="button"
            onClick={handleFechar}
            className="absolute top-5 right-5 p-2 hover:bg-black/5 rounded-xl transition text-muted hover:text-app"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 sm:px-8 pt-6">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition ${
                  index <= etapa ? 'bg-teal-400 text-slate-950 border border-teal-200' : 'surface-muted text-muted'
                }`}>
                  {index < etapa ? <Check className="w-5 h-5" /> : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 rounded-full ${index < etapa ? 'bg-teal-400' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6 min-h-80 overflow-y-auto">
          <h2 className="text-3xl font-black tracking-[-0.055em] text-app mb-2">{steps[etapa].title}</h2>
          <p className="text-muted mb-6">{steps[etapa].description}</p>

          {etapa === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, tipo: category.id, tipoPersonalizado: '' });
                      setErros({ ...erros, tipo: '', tipoPersonalizado: '' });
                    }}
                    className={`${optionClass(formData.tipo === category.id)} text-center`}
                  >
                    <div className="text-3xl mb-2">{category.emoji}</div>
                    <div className="text-sm font-semibold text-app">{category.label}</div>
                  </button>
                ))}
              </div>
              {formData.tipo === 'outro' && (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-app">Qual é o hábito?</span>
                  <input
                    type="text"
                    value={formData.tipoPersonalizado}
                    onChange={(event) => setFormData({ ...formData, tipoPersonalizado: event.target.value })}
                    className="field-control"
                    placeholder="Ex: pornografia, comida rápida..."
                  />
                </label>
              )}
              {erros.tipo && <ErrorMessage>{erros.tipo}</ErrorMessage>}
              {erros.tipoPersonalizado && <ErrorMessage>{erros.tipoPersonalizado}</ErrorMessage>}
            </div>
          )}

          {etapa === 1 && (
            <div className="space-y-3">
              {goals.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, objetivo: goal.id, objetivoPersonalizado: '' });
                    setErros({ ...erros, objetivo: '', objetivoPersonalizado: '' });
                  }}
                  className={`w-full ${optionClass(formData.objetivo === goal.id)}`}
                >
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-teal-300 mt-0.5" />
                    <div>
                      <div className="font-semibold text-app">{goal.label}</div>
                      <div className="text-sm text-muted">{goal.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
              {formData.objetivo === 'personalizado' && (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-app">Descreva sua meta personalizada</span>
                  <textarea
                    value={formData.objetivoPersonalizado}
                    onChange={(event) => setFormData({ ...formData, objetivoPersonalizado: event.target.value })}
                    className="field-control resize-none"
                    placeholder="Ex: reduzir para 5 cigarros por dia em 3 meses..."
                    rows="3"
                  />
                </label>
              )}
              {erros.objetivo && <ErrorMessage>{erros.objetivo}</ErrorMessage>}
              {erros.objetivoPersonalizado && <ErrorMessage>{erros.objetivoPersonalizado}</ErrorMessage>}
            </div>
          )}

          {etapa === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {deadlines.map(deadline => (
                  <button
                    key={deadline.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, prazo: deadline.id });
                      setErros({ ...erros, prazo: '', prazoPersonalizado: '' });
                    }}
                    className={`${optionClass(formData.prazo === deadline.id)} text-center`}
                  >
                    <CalendarDays className="w-5 h-5 text-sky-300 mx-auto mb-2" />
                    <div className="font-semibold text-app">{deadline.label}</div>
                  </button>
                ))}
              </div>
              {formData.prazo === 'outro' && (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-app">Prazo em dias</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.prazoPersonalizado}
                    onChange={(event) => setFormData({ ...formData, prazoPersonalizado: event.target.value })}
                    className="field-control"
                    placeholder="Ex: 45"
                  />
                </label>
              )}
              {erros.prazo && <ErrorMessage>{erros.prazo}</ErrorMessage>}
              {erros.prazoPersonalizado && <ErrorMessage>{erros.prazoPersonalizado}</ErrorMessage>}
            </div>
          )}

          {etapa === 3 && (
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-app">Quanto você gasta por dia? (R$)</span>
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-teal-300" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorDia}
                    onChange={(event) => {
                      setFormData({ ...formData, valorDia: event.target.value });
                      setErros({ ...erros, valorDia: '' });
                    }}
                    className="field-control text-xl"
                    placeholder="0.00"
                  />
                </div>
              </label>
              {formData.valorDia && (
                <div className="surface-muted rounded-2xl p-4 border-teal-300/25">
                  <p className="text-muted text-sm">Economia estimada</p>
                  <p className="text-2xl font-bold text-teal-300">
                    R$ {(parseFloat(formData.valorDia) * 30).toFixed(2)}/mês
                  </p>
                  <p className="text-muted text-xs mt-1">
                    R$ {(parseFloat(formData.valorDia) * 365).toFixed(2)}/ano
                  </p>
                </div>
              )}
              {erros.valorDia && <ErrorMessage>{erros.valorDia}</ErrorMessage>}
            </div>
          )}

          {etapa === 4 && (
            <div className="space-y-4">
              <label className="flex items-center gap-4 p-4 surface-muted rounded-2xl cursor-pointer hover:bg-black/5 transition">
                <input
                  type="checkbox"
                  checked={formData.lembretesDiarios}
                  onChange={(event) => setFormData({ ...formData, lembretesDiarios: event.target.checked })}
                  className="w-5 h-5 rounded accent-teal-400"
                />
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-teal-300 mt-0.5" />
                  <div>
                    <div className="font-semibold text-app">Lembretes diários</div>
                    <div className="text-sm text-muted">Receba mensagens de motivação para manter o foco.</div>
                  </div>
                </div>
              </label>

              {formData.lembretesDiarios && (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-app">Horário do lembrete</span>
                  <input
                    type="time"
                    value={formData.reminderTime}
                    onChange={(event) => setFormData({ ...formData, reminderTime: event.target.value })}
                    className="field-control"
                  />
                </label>
              )}
            </div>
          )}

          {erros.submit && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl mt-4">
              <AlertCircle className="w-5 h-5 text-rose-300 flex-shrink-0 mt-0.5" />
              <span className="text-rose-200 text-sm">{erros.submit}</span>
            </div>
          )}
        </div>

        <div className="px-6 sm:px-8 py-5 border-t hairline surface-muted flex justify-between gap-4">
          <button
            type="button"
            onClick={handleAnterior}
            disabled={etapa === 0}
            className="btn-secondary px-4 sm:px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex gap-3">
            <button type="button" onClick={handleFechar} className="btn-secondary px-4 sm:px-5 py-3">
              Cancelar
            </button>

            {etapa < steps.length - 1 ? (
              <button type="button" onClick={handleProximo} className="btn-primary px-4 sm:px-5 py-3">
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary px-4 sm:px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
