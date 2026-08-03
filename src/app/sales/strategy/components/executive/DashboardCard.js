import React from 'react';

export default function DashboardCard({ title, subtitle, children, className = "", rightAction }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E5EAF5] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden ${className}`}>
      {(title || subtitle || rightAction) && (
        <div className="px-6 py-5 border-b border-[#E5EAF5] flex items-center justify-between gap-4 bg-transparent">
          <div>
            {title && <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs font-semibold text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
