import React from "react";

export function Button({ 
  variant = "secondary", 
  children, 
  className = "", 
  disabled = false,
  loading = false,
  onClick, 
  type = "button" 
}) {
  const hasHeight = /\bh-(?:\[.*?\]|\d+|full|fit)\b/.test(className);
  const hasPaddingX = /\bpx-(?:\[.*?\]|\d+)\b/.test(className);
  const hasPaddingAll = /\bp-(?:\[.*?\]|\d+)\b/.test(className);
  const hasTextSize = /\btext-(?:xs|sm|base|lg|xl|2xl|\[.*?\])\b/.test(className);
  const hasWidth = /\bw-(?:\[.*?\]|\d+|full|fit)\b/.test(className);

  const defaultHeight = hasHeight ? "" : "h-[38px]";
  const defaultPadding = (hasPaddingX || hasPaddingAll) ? "" : "px-4";
  const defaultTextSize = hasTextSize ? "" : "text-sm";
  const defaultWidth = hasWidth ? "" : "w-fit";

  const baseClasses = `group inline-flex items-center justify-center gap-2 ${defaultHeight} ${defaultPadding} ${defaultTextSize} ${defaultWidth} rounded-lg font-semibold transition-colors duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.99]`;

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border border-indigo-600 shadow-xs focus-visible:ring-indigo-500/30",
    secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 active:bg-slate-100 shadow-2xs focus-visible:ring-slate-400/30",
    ghost: "bg-transparent border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-none hover:shadow-none focus-visible:ring-slate-300",
    danger: "bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 active:bg-rose-100 shadow-2xs focus-visible:ring-rose-400/30"
  };

  const variantClasses = variants[variant] || variants.secondary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
