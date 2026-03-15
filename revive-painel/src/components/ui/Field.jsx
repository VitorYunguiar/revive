/**
 * @file Field.jsx
 * @description Componentes de campo de formulario reutilizaveis.
 *
 * Exporta tres componentes:
 * - {@link Field}: wrapper generico com label e hint (dica)
 * - {@link InputField}: campo de input com estilo padrao (fieldBase)
 * - {@link TextAreaField}: campo de textarea com estilo padrao (fieldBase)
 *
 * Todos utilizam a classe utilitaria {@link fieldBase} de constants.js
 * para estilizacao consistente (fundo transparente, borda, foco verde).
 *
 * @module Field
 */
import React from 'react';
import { fieldBase } from '../../utils/constants';

/**
 * Componente wrapper de campo de formulario.
 * Renderiza label, conteudo filho e dica opcional.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Texto da label do campo
 * @param {string} [props.hint] - Texto de dica exibido abaixo do campo
 * @param {React.ReactNode} props.children - Elemento de input/textarea/select interno
 * @returns {JSX.Element} Label com campo e dica opcional
 */
export const Field = ({ label, hint, children }) => (
  <label className="block space-y-2">
    <span className="text-sm font-semibold text-white/75">{label}</span>
    {children}
    {hint && <span className="text-xs text-white/50">{hint}</span>}
  </label>
);

/**
 * Componente de campo input com estilizacao padrao.
 * Utiliza spread operator (...props) para repassar atributos HTML nativos.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Texto da label
 * @param {string} [props.hint] - Texto de dica
 * @param {string} [props.className=''] - Classes CSS adicionais
 * @param {...*} props - Demais props repassadas ao <input> (type, value, onChange, etc.)
 * @returns {JSX.Element} Campo input estilizado dentro de Field
 */
export const InputField = ({ label, hint, className = '', ...props }) => (
  <Field label={label} hint={hint}>
    <input className={`${fieldBase} ${className}`} {...props} />
  </Field>
);

/**
 * Componente de campo textarea com estilizacao padrao.
 * Utiliza spread operator (...props) para repassar atributos HTML nativos.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - Texto da label
 * @param {string} [props.hint] - Texto de dica
 * @param {string} [props.className=''] - Classes CSS adicionais
 * @param {...*} props - Demais props repassadas ao <textarea> (rows, value, onChange, etc.)
 * @returns {JSX.Element} Campo textarea estilizado dentro de Field
 */
export const TextAreaField = ({ label, hint, className = '', ...props }) => (
  <Field label={label} hint={hint}>
    <textarea className={`${fieldBase} ${className}`} {...props} />
  </Field>
);
