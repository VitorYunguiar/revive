import React, { useState } from 'react';
import { Heart, RefreshCw, BookOpen, X } from 'lucide-react';

const optionClass = (active, tone) => {
  const activeTone = tone === 'emerald'
    ? 'bg-emerald-400/12 border-emerald-300/45'
    : 'bg-sky-400/12 border-sky-300/45';
  return `w-full p-5 rounded-[26px] border transition text-left ${
    active ? activeTone : 'surface-muted hover:bg-black/5'
  }`;
};

const RecaidaModal = ({
  isOpen,
  onClose,
  vicio,
  onRefletir,
  onResetar,
  loading
}) => {
  const [selecionado, setSelecionado] = useState(null);

  if (!isOpen || !vicio) return null;

  const handleRefletir = async () => {
    setSelecionado(null);
    await onRefletir(vicio);
  };

  const handleResetar = async () => {
    setSelecionado(null);
    await onResetar(vicio);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-strong rounded-[34px] shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 icon-tile bg-rose-400/12 text-rose-300 border-rose-300/25">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="eyebrow">Registro sensível</p>
              <h2 className="text-3xl font-black tracking-[-0.055em] text-app">Recaída registrada</h2>
              <p className="text-muted text-sm">{vicio.nome_vicio}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted hover:text-app hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="surface-muted rounded-[24px] p-4 mb-5">
          <p className="text-muted leading-relaxed">
            Uma recaída não apaga seu progresso. Escolha como deseja registrar este momento para manter a jornada clara.
          </p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelecionado(selecionado === 'refletir' ? null : 'refletir')}
            className={optionClass(selecionado === 'refletir', 'emerald')}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 icon-tile bg-emerald-400/12 text-emerald-300 border-emerald-300/25 flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-app mb-1">Refletir e aprender</h3>
                <p className="text-muted text-sm">
                  Preserva o contador e abre espaço para entender gatilhos, contexto e próximos passos.
                </p>
              </div>
            </div>

            {selecionado === 'refletir' && (
              <div className="mt-4 pt-4 border-t hairline">
                <p className="text-muted text-sm mb-3">Contador de dias mantido.</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRefletir();
                  }}
                  disabled={loading}
                  className="btn-primary w-full px-4 py-2.5 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Prosseguir com reflexão'}
                </button>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelecionado(selecionado === 'resetar' ? null : 'resetar')}
            className={optionClass(selecionado === 'resetar', 'sky')}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 icon-tile bg-sky-400/12 text-sky-300 border-sky-300/25 flex-shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-app mb-1">Resetar e começar novo ciclo</h3>
                <p className="text-muted text-sm">
                  Zera o contador de abstinência e inicia uma nova contagem a partir de agora.
                </p>
              </div>
            </div>

            {selecionado === 'resetar' && (
              <div className="mt-4 pt-4 border-t hairline">
                <p className="text-muted text-sm mb-3">O contador será resetado para zero.</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleResetar();
                  }}
                  disabled={loading}
                  className="btn-secondary w-full px-4 py-2.5 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Resetar contador'}
                </button>
              </div>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="btn-secondary w-full px-4 py-2.5 mt-6 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default RecaidaModal;
