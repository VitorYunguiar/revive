import React from 'react';

const variantClass = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'border border-transparent text-muted hover:text-app hover:bg-white/5',
  danger: 'border border-rose-300/30 bg-rose-500/12 text-rose-100 hover:bg-rose-500/20'
};

const sizeClass = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base'
};

const Button = React.forwardRef(function Button(
  { as = 'button', variant = 'secondary', size = 'md', className = '', children, ...props },
  ref
) {
  return React.createElement(
    as,
    {
      ref,
      className: `${variantClass[variant] || variantClass.secondary} ${sizeClass[size] || sizeClass.md} rounded-[14px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`,
      ...props
    },
    children
  );
});

export default Button;
