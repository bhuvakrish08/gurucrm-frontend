import React from 'react';

export default function DashboardCard({ title, subtitle, children, className = "", rightAction }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${className}`}>
      {(title || subtitle || rightAction) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 rounded-t-xl">
          <div>
            {title && <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      <div className="flex-1 p-5">
        {children}
      </div>
    </div>
  );
}
