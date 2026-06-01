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
import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
    <span className="text-sm font-semibold text-app">{label}</span>
    {children}
    {hint && <span className="text-xs text-muted">{hint}</span>}
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

export const SelectField = ({
  label,
  hint,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const selectedOption = options.find(option => String(option.value) === String(value));

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && <span className="mb-2 block text-sm font-black text-app">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`${fieldBase} group flex items-center justify-between gap-3 text-left`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? 'font-black text-app' : 'font-bold text-muted'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className={`grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-black/5 text-muted transition group-hover:text-app ${isOpen ? 'rotate-180 text-[var(--accent-strong)]' : ''}`}>
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      {hint && <span className="mt-2 block text-xs text-muted">{hint}</span>}

      {isOpen && (
        <div className="interactive-field-menu absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-64 overflow-y-auto rounded-[22px] p-2">
          <div role="listbox" className="grid gap-1">
            {options.map((option) => {
              const active = String(option.value) === String(value);
              return (
                <button
                  key={option.value || '__empty'}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-[16px] px-3 py-2 text-left text-sm font-black transition ${
                    active
                      ? 'bg-[var(--accent)] text-[#121212]'
                      : 'text-app hover:bg-black/5'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
