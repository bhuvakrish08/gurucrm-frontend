import React from 'react';

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  iconPath, 
  iconColors, 
  trend,
  trendDirection,
  badgeText,
  cardBg = "bg-white"
}) {
  return (
    <div className={`${cardBg} rounded-2xl p-5 border border-[#E5EAF5] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.06)] transition-all duration-300 h-full`}>
      {/* Background Icon */}
      <svg className={`w-32 h-32 absolute -right-6 -bottom-6 ${iconColors.bg} opacity-10 pointer-events-none group-hover:scale-105 transition-transform duration-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      
      <div>
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className={`w-10 h-10 rounded-xl ${iconColors.boxBg} bg-gradient-to-br from-white/80 to-white/10 backdrop-blur-sm ${iconColors.text} flex items-center justify-center font-bold border ${iconColors.border} shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]`}>
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
          <div className="text-[clamp(1.25rem,2.5vw,1.875rem)] font-extrabold text-slate-900 tracking-tight break-words">
            {value}
          </div>
          {trend && (
            <div className={`text-xs font-bold ${trendDirection === 'up' ? 'text-emerald-600' : trendDirection === 'down' ? 'text-rose-600' : 'text-blue-600'} flex items-center`}>
              {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : ''} {trend}
            </div>
          )}
        </div>
      </div>
      
      <div className={`text-[11px] font-semibold pt-3 border-t border-[#E5EAF5] relative z-10 ${iconColors.text}`}>
        {subtitle}
      </div>
    </div>
  );
}
