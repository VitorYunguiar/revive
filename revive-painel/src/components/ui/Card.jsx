import React from 'react';
import { glassSurface } from '../../utils/constants';

const Card = ({ title, subtitle, actions, children, className = '' }) => (
  <div className={`${glassSurface} rounded-2xl p-6 ${className}`}>
    {(title || subtitle || actions) && (
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          {subtitle && <p className="text-[11px] uppercase tracking-[0.28em] text-white/50 mb-1">{subtitle}</p>}
          {title && <h3 className="text-xl font-semibold text-white">{title}</h3>}
        </div>
        {actions}
      </div>
    )}
    <div>{children}</div>
  </div>
);

export default Card;
