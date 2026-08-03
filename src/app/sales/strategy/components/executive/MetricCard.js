import React from 'react';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  iconPath, 
  iconColors, 
  trend,
  trendDirection,
  badgeText
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
      {/* Background Icon */}
      <svg className={`w-24 h-24 absolute -right-3 -bottom-3 ${iconColors.bg} opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      
      <div>
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className={`w-10 h-10 rounded-lg ${iconColors.boxBg} ${iconColors.text} flex items-center justify-center font-bold border ${iconColors.border} shadow-sm`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
          </div>
          {badgeText && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${trendDirection === 'up' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : trendDirection === 'down' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              {badgeText}
            </span>
          )}
        </div>

        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block relative z-10">
          {title}
        </span>
        <div className="flex items-baseline gap-2 mt-1 mb-2 relative z-10">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </div>
          {trend && (
            <div className={`text-xs font-bold ${trendDirection === 'up' ? 'text-emerald-600' : trendDirection === 'down' ? 'text-rose-600' : 'text-blue-600'} flex items-center`}>
              {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : ''} {trend}
            </div>
          )}
        </div>
      </div>
      
      <div className={`text-[11px] font-semibold pt-2 border-t border-slate-100 relative z-10 ${iconColors.text}`}>
        {subtitle}
      </div>
    </div>
  );
}
