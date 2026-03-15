/**
 * @file EmptyState.jsx
 * @description Componente de estado vazio reutilizavel.
 *
 * Exibido quando uma lista ou secao nao possui dados para mostrar.
 * Apresenta um icone, titulo, descricao e opcionalmente um botao de acao
 * para guiar o usuario a adicionar o primeiro item.
 *
 * Padrao de UI: "Empty State" - pratica comum em design de interfaces
 * para orientar o usuario quando nao ha conteudo disponivel.
 *
 * @component
 * @param {Object} props
 * @param {React.Component} [props.icon=Inbox] - Componente de icone Lucide (padrao: Inbox)
 * @param {string} props.title - Titulo da mensagem de estado vazio
 * @param {string} props.description - Descricao explicativa para o usuario
 * @param {Function} [props.action] - Callback executado ao clicar no botao de acao
 * @param {string} [props.actionLabel] - Texto do botao de acao
 * @returns {JSX.Element} Card centralizado com icone, texto e botao opcional
 *
 * @example
 * <EmptyState
 *   icon={Heart}
 *   title="Nenhum vicio cadastrado"
 *   description="Comece sua jornada adicionando um habito."
 *   action={() => setShowWizard(true)}
 *   actionLabel="Cadastrar primeiro habito"
 * />
 */
import React from 'react';
import { Inbox } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

/**
 * Componente de estado vazio reutilizavel.
 *
 * Exibido quando uma lista ou secao nao possui dados para mostrar.
 * Apresenta um icone centralizado, titulo, descricao e opcionalmente
 * um botao de acao para guiar o usuario a adicionar o primeiro item.
 *
 * @param {Object} props - Props do componente
 * @param {React.Component} [props.icon=Inbox] - Componente de icone Lucide (padrao: Inbox)
 * @param {string} props.title - Titulo da mensagem de estado vazio
 * @param {string} props.description - Descricao explicativa para o usuario
 * @param {Function} [props.action] - Callback executado ao clicar no botao de acao
 * @param {string} [props.actionLabel] - Texto do botao de acao (obrigatorio se action estiver definido)
 * @returns {JSX.Element} Card centralizado com icone, texto e botao opcional
 */
const EmptyState = ({ icon: Icon = Inbox, title, description, action, actionLabel }) => (
  <div className={`${glassSurface} rounded-2xl p-12 text-center`}>
    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700/60">
      <Icon className="w-8 h-8 text-white/40" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-white/60 mb-6 max-w-md mx-auto">{description}</p>
    {action && (
      <button
        onClick={action}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition font-semibold"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
