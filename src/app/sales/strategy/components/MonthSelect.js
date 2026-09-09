"use client";
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

export function MonthSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select Target Month",
  className = "w-full h-[40px]",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectPos, setSelectPos] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  // grouping logic
  const groupedOptions = {};
  options.forEach(opt => {
    const q = opt.quarterNumber;
    if (!groupedOptions[q]) groupedOptions[q] = [];
    if (opt.monthName.toLowerCase().includes(search.toLowerCase())) {
      groupedOptions[q].push(opt);
    }
  });

  const quarterLabels = {
    1: "Q1 • Apr – Jun",
    2: "Q2 • Jul – Sep",
    3: "Q3 • Oct – Dec",
    4: "Q4 • Jan – Mar"
  };

  const handleOpen = () => {
    if (disabled) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow < 400 && rect.top > spaceBelow ? 'top' : 'bottom';
      setSelectPos({
        top: placement === 'bottom' ? rect.bottom + 6 : undefined,
        bottom: placement === 'top' ? window.innerHeight - rect.top + 6 : undefined,
        left: rect.left,
        width: rect.width > 260 ? rect.width : 260
      });
      setIsOpen(true);
      setSearch("");
    }
  };

  const selectedOpt = options.find(o => String(o.monthNumber) === String(value));
  const selectedLabel = selectedOpt ? `${selectedOpt.monthName} (Q${selectedOpt.quarterNumber})` : placeholder;

  return (
    <div className="relative w-full">
      <button
        type="button"
        ref={buttonRef}
        onClick={handleOpen}
        disabled={disabled}
        className={`${className} px-3.5 flex items-center justify-between border rounded-lg text-sm font-semibold transition-all focus:outline-none bg-white text-slate-800 shadow-2xs ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
            : 'cursor-pointer hover:border-slate-400'
        } ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-300'}`}
      >
        <span className={!value ? "text-slate-400 font-normal" : "truncate pr-2 font-semibold text-slate-800"}>{selectedLabel}</span>
        <svg className={`w-4 h-4 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-lg text-left flex flex-col overflow-hidden"
            style={{ 
              top: selectPos.top, 
              bottom: selectPos.bottom, 
              left: selectPos.left, 
              minWidth: selectPos.width,
              animation: '0.12s ease-out 0s 1 normal forwards running fadeInSlide'
            }}
          >
            <style>{`
              @keyframes fadeInSlide {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .custom-scrollbar::-webkit-scrollbar { width: 4px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            `}</style>
            
            {/* Header */}
            <div className="flex items-start justify-between px-3.5 py-2.5 border-b border-slate-100 bg-[#F8FAFC]">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-slate-800 leading-tight">Select Target Month</span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5">Choose destination month for allocation</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded hover:bg-slate-200/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-slate-100 bg-white">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                  autoFocus
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search month..." 
                  className="w-full h-[34px] pl-8 pr-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1.5 bg-white">
              {[1, 2, 3, 4].map((q, index) => {
                const groupOpts = groupedOptions[q];
                if (!groupOpts || groupOpts.length === 0) return null;
                
                const hasPreviousGroups = [1, 2, 3, 4].slice(0, index).some(prevQ => groupedOptions[prevQ] && groupedOptions[prevQ].length > 0);

                return (
                  <div key={q} className={`flex flex-col space-y-0.5 ${hasPreviousGroups ? 'mt-2 pt-1.5 border-t border-slate-100' : ''}`}>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {quarterLabels[q]}
                    </div>
                    {groupOpts.map((opt) => (
                      <button
                        key={opt.monthNumber}
                        type="button"
                        onClick={() => { onChange(opt.monthNumber); setIsOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 h-[36px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          String(value) === String(opt.monthNumber) 
                            ? 'bg-indigo-50 text-indigo-700 font-bold' 
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900 focus:outline-none'
                        }`}
                      >
                        <span>{opt.monthName} (Q{q})</span>
                        {String(value) === String(opt.monthNumber) && (
                          <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
              {Object.keys(groupedOptions).every(q => !groupedOptions[q] || groupedOptions[q].length === 0) && (
                <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">No results found</div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
