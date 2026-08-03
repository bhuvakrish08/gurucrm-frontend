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

  const defaultHeight = hasHeight ? "" : "h-[42px]";
  const defaultPadding = (hasPaddingX || hasPaddingAll) ? "" : "px-[18px]";
  const defaultTextSize = hasTextSize ? "" : "text-[14px]";
  const defaultWidth = hasWidth ? "" : "w-fit";

  const baseClasses = `group flex items-center justify-center gap-2 ${defaultHeight} ${defaultPadding} ${defaultTextSize} ${defaultWidth} rounded-md font-semibold transition-all duration-200 shadow-sm whitespace-nowrap focus:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-500/30 disabled:opacity-50 disabled:pointer-events-none cursor-pointer hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]`;

  const variants = {
    primary: "bg-[linear-gradient(135deg,#4F46E5_0%,#6366F1_45%,#7C3AED_100%)] text-white border border-transparent hover:brightness-110 active:brightness-95 shadow-[0_4px_14px_0_rgba(91,107,255,0.39)]",
    secondary: "bg-white border border-[#818CF8] text-[#4F46E5] hover:bg-[#EEF2FF] hover:border-[#6366F1] hover:text-[#4338CA] active:bg-[#E0E7FF] active:border-[#4F46E5]",
    ghost: "bg-transparent border border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800 shadow-none hover:shadow-none",
    danger: "bg-white border border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500 active:bg-red-100"
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
        <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
