import React from 'react';
import { TrendingUp } from 'lucide-react';

const TrendIndicator = ({ trend }) => {
  const isPositive = trend >= 0;
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
      isPositive
        ? 'bg-emerald-500/20 text-emerald-300'
        : 'bg-red-500/20 text-red-300'
    }`}>
      <TrendingUp className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`} />
      {isPositive ? '+' : ''}{trend.toFixed(1)}%
    </div>
  );
};

export default TrendIndicator;
