"use client";
import React from "react";

export default function SkeletonTable({ rows = 5, columns = 6 }) {
  // Predefined deterministic widths to prevent SSR hydration mismatch between server and client
  const widths = ["65%", "82%", "55%", "74%", "88%", "60%", "78%", "52%", "70%"];

  return (
    <div className="w-full overflow-hidden animate-pulse">
      <div className="bg-gray-100 rounded-lg p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center space-x-4 py-2 border-b border-gray-200">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-gray-300 rounded-md flex-1"
                style={{ width: widths[(rIdx * 3 + cIdx) % widths.length] }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
