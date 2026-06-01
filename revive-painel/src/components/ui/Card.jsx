/**
 * @file Card.jsx
 * @description Componente de card reutilizavel com estilo glass morphism.
 *
 * Utilizado como container visual em diversas paginas da aplicacao.
 * Suporta titulo, subtitulo, acoes no cabecalho e conteudo livre via children.
 * O estilo glass morphism e aplicado pela classe utilitaria {@link glassSurface}.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.title] - Titulo exibido no cabecalho do card
 * @param {string} [props.subtitle] - Subtitulo exibido acima do titulo (texto em caixa alta)
 * @param {React.ReactNode} [props.actions] - Elementos de acao renderizados a direita do titulo
 * @param {React.ReactNode} props.children - Conteudo interno do card
 * @param {string} [props.className=''] - Classes CSS adicionais para customizacao
 * @returns {JSX.Element} Card estilizado com glassSurface e cabecalho condicional
 *
 * @example
 * <Card title="Meu Card" subtitle="Subtitulo">
 *   <p>Conteudo aqui</p>
 * </Card>
 */
import React from 'react';
import { glassSurface } from '../../utils/constants';

const variantClass = {
  surface: glassSurface,
  sand: 'surface-sand',
  dark: 'surface-dark',
  accent: 'surface-accent',
  muted: 'surface-muted'
};

/**
 * Componente de card reutilizavel com estilo glass morphism.
 *
 * Renderiza um container visual com cabecalho condicional (titulo, subtitulo, acoes)
 * e conteudo livre via children. O cabecalho so aparece se pelo menos uma das props
 * title, subtitle ou actions estiver definida.
 *
 * @param {Object} props - Props do componente
 * @param {string} [props.title] - Titulo exibido no cabecalho do card
 * @param {string} [props.subtitle] - Subtitulo em caixa alta exibido acima do titulo
 * @param {React.ReactNode} [props.actions] - Elementos de acao renderizados a direita do titulo
 * @param {React.ReactNode} props.children - Conteudo interno do card
 * @param {string} [props.className=''] - Classes CSS adicionais para customizacao
 * @returns {JSX.Element} Card estilizado com glassSurface e cabecalho condicional
 */
const Card = ({ title, subtitle, actions, children, className = '', variant = 'surface' }) => (
  <div className={`${variantClass[variant] || glassSurface} rounded-[30px] p-5 sm:p-6 ${className}`}>
    {(title || subtitle || actions) && (
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          {subtitle && <p className="eyebrow mb-1">{subtitle}</p>}
          {title && <h3 className="text-xl font-black tracking-[-0.04em] text-app">{title}</h3>}
        </div>
        {actions}
      </div>
    )}
    <div>{children}</div>
  </div>
);

export default Card;
