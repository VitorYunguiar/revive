import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

const Alert = ({ type = 'info', children, onClose }) => {
  const colors = {
    success: 'border-emerald-300/60 bg-emerald-500/10 text-emerald-100',
    error: 'border-rose-300/60 bg-rose-500/10 text-rose-100',
    info: 'border-cyan-300/60 bg-cyan-500/10 text-cyan-100',
    warning: 'border-amber-300/60 bg-amber-500/10 text-amber-100'
  };

  return (
    <div className={`${glassSurface} p-4 rounded-2xl border-l-4 ${colors[type]} flex items-start justify-between mb-4 animate-fade-in`}>
      <div className="flex items-start gap-2">
        {type === 'success' && <CheckCircle className="w-5 h-5 mt-0.5" />}
        {type === 'error' && <AlertCircle className="w-5 h-5 mt-0.5" />}
        <div>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
