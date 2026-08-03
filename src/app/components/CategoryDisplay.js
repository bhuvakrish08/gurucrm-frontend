import React from 'react';

export default function CategoryDisplay({ cat, theme = 'light' }) {
  if (!cat) return null;

  const iconSvg = cat.icon_svg || '<span class="text-base">●</span>';
  const iconBg = cat.icon_background || 'bg-slate-100';
  const iconColor = cat.icon_color || 'text-slate-600';
  const badgeBg = cat.badge_background || 'bg-slate-100';
  const badgeTextColor = cat.badge_text_color || 'text-slate-600';

  const name = cat.categoryName || cat.category_name || cat.name;

  return (
    <div className="flex items-center gap-3">
      {/* IDENTICAL ICON EVERYWHERE: w-10 h-10, rounded-xl, shadow-sm, svg w-5 h-5 */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5 shadow-sm ${iconBg} ${iconColor}`}
        dangerouslySetInnerHTML={{ __html: iconSvg }}
      ></div>
      <div className="flex items-center">
        {/* EXACT STORED NAME WITH SOFT BACKGROUND */}
        <span className={`inline-flex items-center w-fit whitespace-nowrap px-3 py-1.5 rounded-lg text-[14px] font-bold ${badgeBg} ${badgeTextColor}`}>
          {name}
        </span>
      </div>
    </div>
  );
}
