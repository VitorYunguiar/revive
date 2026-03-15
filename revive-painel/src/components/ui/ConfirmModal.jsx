import React from 'react';
import { X } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${glassSurface} rounded-3xl max-w-md w-full p-6 border border-white/10`}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-white/70 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 transition border border-white/10">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-rose-500/80 text-white hover:bg-rose-600 transition border border-rose-300/40">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
