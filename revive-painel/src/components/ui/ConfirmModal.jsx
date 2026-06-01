import React from 'react';
import { X } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${glassSurface} rounded-[30px] max-w-md w-full p-6`}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-2xl font-black tracking-[-0.05em] text-app">{title}</h3>
          <button onClick={onClose} className="p-2 text-muted hover:text-app hover:bg-black/5 rounded-xl transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-muted mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary px-4 py-2">
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn-danger px-4 py-2">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
