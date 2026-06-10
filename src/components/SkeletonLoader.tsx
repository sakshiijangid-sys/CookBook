import React from 'react';

export default function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Search Bar & Category Selectors Skeleton */}
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Shimmer Search Input */}
          <div className="flex-1 h-10 bg-slate-100 rounded-full"></div>
          {/* Shimmer Categories */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 md:pb-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-20 h-8 bg-slate-100 rounded-lg shrink-0"></div>
            ))}
          </div>
        </div>
        {/* Shimmer Tags Sub-list */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
          <div className="w-20 h-3 bg-slate-100 rounded"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-14 h-5 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>

      {/* Info bar skeleton */}
      <div className="flex items-center justify-between pb-1">
        <div className="w-32 h-4 bg-slate-200 rounded"></div>
        <div className="w-28 h-8 bg-slate-200 rounded-lg"></div>
      </div>

      {/* Recipe Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div 
            key={i} 
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
          >
            {/* Image Placeholder */}
            <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
              {/* Shimmer diagonal reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
            </div>

            {/* Content lines */}
            <div className="flex flex-1 flex-col p-5 space-y-4">
              <div className="space-y-2">
                {/* Title */}
                <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                {/* Description */}
                <div className="h-3 bg-slate-100 rounded-md w-full"></div>
                <div className="h-3 bg-slate-100 rounded-md w-5/6"></div>
              </div>

              {/* Meta Info row (Prep, Cook, Serves) */}
              <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-3">
                <div className="flex flex-col items-center space-y-1">
                  <div className="h-2 bg-slate-100 rounded w-8"></div>
                  <div className="h-3 bg-slate-200 rounded w-10"></div>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="h-2 bg-slate-100 rounded w-8"></div>
                  <div className="h-3 bg-slate-200 rounded w-10"></div>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="h-2 bg-slate-100 rounded w-8"></div>
                  <div className="h-3 bg-slate-200 rounded w-10"></div>
                </div>
              </div>

              {/* Tag pills */}
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 bg-slate-100 rounded w-12"></div>
                <div className="h-5 bg-slate-100 rounded w-16"></div>
                <div className="h-5 bg-slate-100 rounded w-14"></div>
              </div>

              {/* Action Button */}
              <div className="h-8 bg-slate-100 rounded-lg w-full mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
