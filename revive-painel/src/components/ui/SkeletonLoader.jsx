import React from 'react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-700/40 rounded-xl ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-slate-900/80 border border-slate-700/60 rounded-3xl p-6 space-y-4">
    <div className="flex justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
      <Skeleton className="h-20 rounded-2xl" />
    </div>
    <Skeleton className="h-10 rounded-xl" />
  </div>
);

export const SkeletonKpi = () => (
  <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-5">
    <div className="flex items-center gap-4">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-16 rounded-xl" />
    ))}
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6">
    <Skeleton className="h-5 w-48 mb-4" />
    <Skeleton className="h-40 rounded-xl" />
  </div>
);

export default Skeleton;
