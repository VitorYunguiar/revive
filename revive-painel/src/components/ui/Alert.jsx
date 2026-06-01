import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

const Alert = ({ type = 'info', children, onClose }) => {
  const colors = {
    success: 'border-emerald-400/60 bg-emerald-500/10 text-app',
    error: 'border-rose-400/60 bg-rose-500/10 text-app',
    info: 'border-cyan-400/60 bg-cyan-500/10 text-app',
    warning: 'border-amber-400/60 bg-amber-500/10 text-app'
  };

  return (
    <div className={`${glassSurface} p-4 rounded-[24px] border-l-4 ${colors[type]} flex items-start justify-between mb-5 animate-fade-in`}>
      <div className="flex items-start gap-2">
        {type === 'success' && <CheckCircle className="w-5 h-5 mt-0.5" />}
        {type === 'error' && <AlertCircle className="w-5 h-5 mt-0.5" />}
        <div>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-muted hover:text-app">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
