import React from 'react';
import { Inbox } from 'lucide-react';
import { glassSurface } from '../../utils/constants';

const EmptyState = ({ icon: Icon = Inbox, title, description, action, actionLabel }) => (
  <div className={`${glassSurface} rounded-2xl p-12 text-center`}>
    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700/60">
      <Icon className="w-8 h-8 text-white/40" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-white/60 mb-6 max-w-md mx-auto">{description}</p>
    {action && (
      <button
        onClick={action}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/70 text-white border border-slate-700/60 hover:bg-slate-800 transition font-semibold"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
