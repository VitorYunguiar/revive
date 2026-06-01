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
  <div className={`${glassSurface} rounded-[34px] p-10 sm:p-12 text-center`}>
    <div className="w-16 h-16 icon-tile text-teal-300 mx-auto mb-4">
      {React.createElement(Icon, { className: 'w-8 h-8' })}
    </div>
    <h3 className="text-2xl font-black tracking-[-0.05em] text-app mb-2">{title}</h3>
    <p className="text-muted mb-6 max-w-md mx-auto">{description}</p>
    {action && (
      <button
        onClick={action}
        className="btn-primary px-6 py-3"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
