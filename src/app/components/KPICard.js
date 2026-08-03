import React from 'react';

/**
 * Global Enterprise KPI Card Component
 * Standardized across Strategy & Source Mapping modules.
 */
export function KPICard({ 
  label, 
  amount, 
  subtitle, 
  icon, 
  theme = 'blue' // 'neutralBlue', 'blue', 'green', 'red', 'yellow', 'purple'
}) {
  const themes = {
    blue: {
      borderTop: 'border-t-[#2563EB]',
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#2563EB]'
    },
    neutralBlue: {
      borderTop: 'border-t-[#6366f1]',
      iconBg: 'bg-[#e0e7ff]',
      iconColor: 'text-[#6366f1]'
    },
    green: {
      borderTop: 'border-t-[#10b981]',
      iconBg: 'bg-[#d1fae5]',
      iconColor: 'text-[#059669]'
    },
    red: {
      borderTop: 'border-t-[#ef4444]',
      iconBg: 'bg-[#fee2e2]',
      iconColor: 'text-[#dc2626]'
    },
    yellow: {
      borderTop: 'border-t-[#f59e0b]',
      iconBg: 'bg-[#fffbeb]',
      iconColor: 'text-[#d97706]'
    },
    purple: {
      borderTop: 'border-t-[#9333ea]',
      iconBg: 'bg-[#f3e8ff]',
      iconColor: 'text-[#9333ea]'
    }
  };

  const selectedTheme = themes[theme] || themes.neutralBlue;

  return (
    <div className={`bg-white rounded-2xl p-5 border border-[#e2e8f0] border-t-4 ${selectedTheme.borderTop} shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-3 xl:gap-4 transition-all hover:shadow-lg hover:border-[#cbd5e1] hover:-translate-y-0.5`}>
      <div className={`w-14 h-14 rounded-2xl ${selectedTheme.iconBg} flex items-center justify-center ${selectedTheme.iconColor} flex-shrink-0 shadow-2xs`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] 2xl:text-[14px] font-semibold text-slate-500 uppercase tracking-wider mb-1 line-clamp-2 leading-snug">{label}</p>
        <h3 className="text-[20px] 2xl:text-[22px] font-bold text-slate-800 tracking-tight leading-none truncate">{amount}</h3>
        <p className="text-[12px] 2xl:text-[13px] text-slate-400 font-normal mt-1.5 line-clamp-2 leading-snug">{subtitle}</p>
      </div>
    </div>
  );
}
