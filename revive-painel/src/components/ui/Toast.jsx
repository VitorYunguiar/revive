import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

const iconMap = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error: <AlertCircle className="w-5 h-5 text-rose-400" />,
  info: <Info className="w-5 h-5 text-cyan-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />
};

const bgMap = {
  success: 'bg-emerald-500/10 border-emerald-500/30',
  error: 'bg-rose-500/10 border-rose-500/30',
  info: 'bg-cyan-500/10 border-cyan-500/30',
  warning: 'bg-amber-500/10 border-amber-500/30'
};

const ToastContainer = () => {
  const { toasts, removeToast } = useUI();

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-3 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl ${bgMap[toast.type] || bgMap.info}`}
          >
            {iconMap[toast.type] || iconMap.info}
            <p className="text-sm text-white/90 flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-white/40 hover:text-white/80 transition">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
