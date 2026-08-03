import React from 'react';

export default function RankingCard({ rank, title, categoryName, value, subValue, iconColorHex, badgeText, badgeType = "default" }) {
  const isTop = rank === 1;
  const isDanger = badgeType === "danger";
  const isSuccess = badgeType === "success";

  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 ${
        isTop ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
      }`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            {title}
          </span>
          {badgeText && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest ${
              isDanger ? 'bg-rose-100 text-rose-700' : isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {badgeText}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: iconColorHex || '#94a3b8' }} />
            <span className="font-bold text-sm text-slate-800 truncate">{categoryName || 'None'}</span>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="font-extrabold text-sm text-slate-900">{value}</div>
            {subValue && <div className="text-[10px] font-bold text-slate-400">{subValue}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
