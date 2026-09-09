"use client";
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

export function Select({ 
  value, 
  onChange, 
  options = [], 
  searchable = false,
  placeholder = "Select...",
  className = "w-full h-[38px]",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectPos, setSelectPos] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  const filteredOptions = searchable 
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleOpen = () => {
    if (disabled) return;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow < 250 && rect.top > spaceBelow ? 'top' : 'bottom';
      setSelectPos({
        top: placement === 'bottom' ? rect.bottom + 6 : undefined,
        bottom: placement === 'top' ? window.innerHeight - rect.top + 6 : undefined,
        left: rect.left,
        width: rect.width
      });
      setIsOpen(true);
      setSearch("");
    }
  };

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || placeholder;

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
            className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 text-left flex flex-col"
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
            
            {searchable && (
              <div className="px-1.5 pb-1.5 pt-0.5 border-b border-slate-100">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    autoFocus
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..." 
                    className="w-full h-[34px] pl-8 pr-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            )}

            <div className={`max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 pr-0.5 ${searchable ? 'mt-1.5' : ''}`}>
              {filteredOptions.length > 0 ? filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 h-[36px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    String(value) === String(opt.value) 
                      ? 'bg-indigo-50 text-indigo-700 font-bold' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900 focus:outline-none'
                  }`}
                >
                  <span>{opt.label}</span>
                  {String(value) === String(opt.value) && (
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )) : (
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
