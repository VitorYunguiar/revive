import React from 'react';
import { fieldBase } from '../../utils/constants';

export const Field = ({ label, hint, children }) => (
  <label className="block space-y-2">
    <span className="text-sm font-semibold text-white/75">{label}</span>
    {children}
    {hint && <span className="text-xs text-white/50">{hint}</span>}
  </label>
);

export const InputField = ({ label, hint, className = '', ...props }) => (
  <Field label={label} hint={hint}>
    <input className={`${fieldBase} ${className}`} {...props} />
  </Field>
);

export const TextAreaField = ({ label, hint, className = '', ...props }) => (
  <Field label={label} hint={hint}>
    <textarea className={`${fieldBase} ${className}`} {...props} />
  </Field>
);
