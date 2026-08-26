"use client";
import React from "react";

export default function SkeletonTable({ rows = 5, columns = 6 }) {
  return (
    <div className="w-full overflow-hidden animate-pulse">
      <div className="bg-gray-100 rounded-lg p-4 space-y-3">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center space-x-4 py-2 border-b border-gray-200">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-gray-300 rounded-md flex-1"
                style={{ width: `${Math.floor(Math.random() * 40) + 50}%` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
