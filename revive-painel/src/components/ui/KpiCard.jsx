import React from 'react';
import { glassSurface, kpiBorderMap } from '../../utils/constants';
import TrendIndicator from './TrendIndicator';

const KpiCard = ({ icon, title, value, border, trend }) => (
  <div className={`${glassSurface} rounded-2xl p-5 border-[1.5px] ${kpiBorderMap[border] || 'border-slate-700/60'}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        {icon}
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
      {trend !== undefined && <TrendIndicator trend={trend} />}
    </div>
  </div>
);

export default KpiCard;
