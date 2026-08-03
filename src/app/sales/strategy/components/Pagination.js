import React from 'react';
import { Select } from './Select';
import { Button } from './Button';

export default function Pagination({ 
  total, 
  page, 
  pageSize, 
  onPageChange, 
  onPageSizeChange, 
  itemName = "records" 
}) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startItem = total === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-xs font-bold text-slate-500">
          Showing {startItem}–{endItem} of {total} {itemName}
        </p>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <span className="text-xs font-bold text-slate-500">Rows per page</span>
          <div className="w-[80px]">
            <Select
              value={pageSize}
              onChange={(val) => {
                onPageSizeChange(Number(val));
                onPageChange(1); // Reset to page 1 on page size change
              }}
              options={[10, 20, 50, 100].map(size => ({ value: String(size), label: String(size) }))}
              className="w-full h-8"
            />
          </div>
        </div>
      </div>
      
      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5">
          <Button 
            variant="secondary"
            disabled={page <= 1} 
            onClick={() => onPageChange(page - 1)}
            className="flex h-8 px-3 text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - page) <= 1)
              .reduce((acc, pg, idx, arr) => {
                if (idx > 0 && arr[idx] - arr[idx - 1] > 1) {
                  acc.push(<span key={`ellipsis-${pg}`} className="px-1 text-slate-400 font-bold">...</span>);
                }
                acc.push(
                  <Button
                    variant={pg === page ? "primary" : "secondary"}
                    key={pg} 
                    onClick={() => onPageChange(pg)}
                    className="w-8 h-8 px-0 text-xs shadow-2xs"
                  >
                    {pg}
                  </Button>
                );
                return acc;
              }, [])
            }
          </div>
          
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-8 px-3 text-xs"
          >
            Next
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </Button>
        </div>
      ) : (
        <div className="flex items-center">
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
            Page 1 of 1
          </span>
        </div>
      )}
    </div>
  );
}
