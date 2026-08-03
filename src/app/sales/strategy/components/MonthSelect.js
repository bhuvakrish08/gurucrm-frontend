"use client";
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

export function MonthSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select Target Month",
  className = "w-full h-[44px]",
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
        top: placement === 'bottom' ? rect.bottom + 8 : undefined,
        bottom: placement === 'top' ? window.innerHeight - rect.top + 8 : undefined,
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
        className={`${className} px-3.5 flex items-center justify-between border rounded-md text-sm font-semibold transition-all focus:outline-none bg-white text-slate-800 ${
          disabled ? 'opacity-50 cursor-not-allowed border-slate-200' : 'cursor-pointer hover:border-[#6366F1]'
        } ${isOpen ? 'border-[#818CF8] ring-1 ring-[#818CF8]' : disabled ? '' : 'border-[#818CF8]'}`}
      >
        <span className={!value ? "text-slate-500" : "truncate pr-2"}>{selectedLabel}</span>
        <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#6366f1]' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-white border border-slate-200 rounded-[10px] shadow-xl text-left flex flex-col overflow-hidden"
            style={{ 
              top: selectPos.top, 
              bottom: selectPos.bottom, 
              left: selectPos.left, 
              minWidth: selectPos.width,
              animation: '0.15s ease-out 0s 1 normal forwards running fadeInSlide'
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
            <div className="flex items-start justify-between px-3 py-2.5 border-b border-slate-100 bg-[#F8FAFC]">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-slate-700 leading-tight">Select Target Month</span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5">Choose the month for allocation.</span>
              </div>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
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
                  className="w-full h-[36px] pl-8 pr-3 bg-white border border-slate-200 hover:border-[#818CF8] rounded-md text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-[#818CF8]/20 transition-all"
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 bg-white">
              {[1, 2, 3, 4].map((q, index) => {
                const groupOpts = groupedOptions[q];
                if (!groupOpts || groupOpts.length === 0) return null;
                
                // Determine if we need a divider. We only add a divider if there are rendered groups before this one.
                const hasPreviousGroups = [1, 2, 3, 4].slice(0, index).some(prevQ => groupedOptions[prevQ] && groupedOptions[prevQ].length > 0);

                return (
                  <div key={q} className={`flex flex-col space-y-0.5 ${hasPreviousGroups ? 'mt-2 pt-2 border-t border-slate-100' : ''}`}>
                    <div className="px-[14px] py-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      {quarterLabels[q]}
                    </div>
                    {groupOpts.map((opt) => (
                      <button
                        key={opt.monthNumber}
                        type="button"
                        onClick={() => { onChange(opt.monthNumber); setIsOpen(false); }}
                        className={`w-full flex items-center justify-between px-[14px] h-[40px] rounded-md text-[13px] font-bold transition-colors cursor-pointer ${
                          String(value) === String(opt.monthNumber) 
                            ? 'bg-[#EEF2FF] text-[#4F46E5]' 
                            : 'text-slate-700 hover:bg-[#EEF2FF] hover:text-[#4F46E5] focus:bg-[#EEF2FF] focus:text-[#4F46E5] focus:outline-none'
                        }`}
                      >
                        {opt.monthName} (Q{q})
                        {String(value) === String(opt.monthNumber) && (
                          <svg className="w-4 h-4 text-[#4F46E5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
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
