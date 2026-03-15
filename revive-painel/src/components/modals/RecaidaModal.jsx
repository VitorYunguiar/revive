import React, { useState } from 'react';
import { Heart, RefreshCw, BookOpen } from 'lucide-react';

const surface = 'bg-slate-900/80 border border-slate-700/60';

/**
 * RecaidaModal: Modal especial para tratamento de recaídas
 * Oferece duas opções psicologicamente supportivas:
 * 1. Refletir & Aprender: cria um registro para entender a recaída
 * 2. Resetar & Começar: reseta o contador e começa novo ciclo
 */
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${surface} rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-white/10 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-500/30 rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Recaída Registrada</h2>
            <p className="text-white/60 text-sm">{vicio.nome_vicio}</p>
          </div>
        </div>

        {/* Mensagem de apoio */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <p className="text-white/80 leading-relaxed">
            Uma recaída é parte da jornada de recuperação. O importante é aprender com ela e seguir em frente.
            <strong> Escolha como deseja proceder:</strong>
          </p>
        </div>

        {/* Opções */}
        <div className="space-y-4">
          {/* Opção 1: Refletir */}
          <button
            onClick={() => setSelecionado(selecionado === 'refletir' ? null : 'refletir')}
            className={`w-full p-6 rounded-xl border-2 transition ${
              selecionado === 'refletir'
                ? 'bg-emerald-500/20 border-emerald-400/50'
                : 'bg-white/5 border-white/10 hover:border-emerald-400/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <BookOpen className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  🌱 Refletir & Aprender
                </h3>
                <p className="text-white/60 text-sm">
                  Crie um registro para entender o que aconteceu.
                  Seus dias de abstinência serão preservados para que você veja o progresso conquistado.
                </p>
              </div>
            </div>

            {selecionado === 'refletir' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/70 text-sm mb-3">
                  ✓ Contador de dias <strong>mantido</strong>
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefletir();
                  }}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-emerald-500/40 text-emerald-300 rounded-lg hover:bg-emerald-500/50 transition font-medium border border-emerald-400/30 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Prosseguir com Reflexão'}
                </button>
              </div>
            )}
          </button>

          {/* Opção 2: Resetar */}
          <button
            onClick={() => setSelecionado(selecionado === 'resetar' ? null : 'resetar')}
            className={`w-full p-6 rounded-xl border-2 transition ${
              selecionado === 'resetar'
                ? 'bg-blue-500/20 border-blue-400/50'
                : 'bg-white/5 border-white/10 hover:border-blue-400/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <RefreshCw className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-left flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  🔄 Resetar & Começar do Zero
                </h3>
                <p className="text-white/60 text-sm">
                  Se você preferir começar um novo ciclo, o contador será zerado e você iniciará uma nova contagem
                  de dias de abstinência a partir de agora.
                </p>
              </div>
            </div>

            {selecionado === 'resetar' && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/70 text-sm mb-3">
                  ⚠️ Contador de dias será <strong>resetado para zero</strong>
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetar();
                  }}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-500/40 text-blue-300 rounded-lg hover:bg-blue-500/50 transition font-medium border border-blue-400/30 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Resetar Contador'}
                </button>
              </div>
            )}
          </button>
        </div>

        {/* Botão de Fechar */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition border border-white/20 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecaidaModal;
