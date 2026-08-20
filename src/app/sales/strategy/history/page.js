"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "../components/Button";
import Header from "@/app/components/header";
import StrategyNav from "../components/StrategyNav";
import Pagination from "../components/Pagination";
import CheckPermission from "@/app/components/CheckPermission";
import useAuth from "@/app/components/useAuth";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { parseExcelDate, parseExcelNumber } from "@/utils/excelUtils";
import CategoryDisplay from "@/app/components/CategoryDisplay";
import { Select } from "../components/Select";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const AVAILABLE_YEARS = ["2024-2025", "2025-2026", "2026-2027", "2027-2028", "2028-2029"];

const ACTION_TYPE_OPTIONS = [
  { value: "",                            label: "All Action Types" },
  { value: "BASE_GOAL_CREATED",           label: "Base Goal Created" },
  { value: "BASE_GOAL_UPDATED",           label: "Base Goal Updated" },
  { value: "QUARTER_ALLOCATION_CREATED",  label: "Quarter Allocation Created" },
  { value: "QUARTER_ALLOCATION_REPLACED", label: "Quarter Allocation Replaced" },
  { value: "MAP_SUB_SOURCE",              label: "Source Mapped" },
  { value: "UNMAP_SUB_SOURCE",            label: "Source Unmapped" },
];

const MONTHS_META = [
  { monthNumber: 4,  name: "April",     shortName: "Apr" },
  { monthNumber: 5,  name: "May",       shortName: "May" },
  { monthNumber: 6,  name: "June",      shortName: "Jun" },
  { monthNumber: 7,  name: "July",      shortName: "Jul" },
  { monthNumber: 8,  name: "August",    shortName: "Aug" },
  { monthNumber: 9,  name: "September", shortName: "Sep" },
  { monthNumber: 10, name: "October",   shortName: "Oct" },
  { monthNumber: 11, name: "November",  shortName: "Nov" },
  { monthNumber: 12, name: "December",  shortName: "Dec" },
  { monthNumber: 1,  name: "January",   shortName: "Jan" },
  { monthNumber: 2,  name: "February",  shortName: "Feb" },
  { monthNumber: 3,  name: "March",     shortName: "Mar" },
];

// Categories are fetched dynamically

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────



function CustomDatePicker({ value, onChange, placeholder = "mm/dd/yyyy" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectPos, setSelectPos] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  
  const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value) : new Date());

  const handleOpen = () => {
    if (buttonRef.current) {
      setCurrentMonth(value ? new Date(value) : new Date());
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow < 340 && rect.top > spaceBelow ? 'top' : 'bottom';
      setSelectPos({
        top: placement === 'bottom' ? rect.bottom + 8 : undefined,
        bottom: placement === 'top' ? window.innerHeight - rect.top + 8 : undefined,
        left: rect.left,
        width: rect.width > 280 ? rect.width : 280
      });
      setIsOpen(true);
    }
  };

  const handleDateSelect = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const displayValue = value ? new Date(value).toLocaleDateString("en-US", { month: '2-digit', day: '2-digit', year: 'numeric' }) : placeholder;

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    
    const todayStr = new Date().toLocaleDateString("en-CA");
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toLocaleDateString("en-CA");
      const isSelected = value === dateStr;
      const isToday = todayStr === dateStr;
      
      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
            isSelected 
              ? 'bg-[#4F46E5] text-white shadow-sm' 
              : isToday 
                ? 'border border-[#4F46E5] text-[#4F46E5] hover:bg-[#EEF2FF]' 
                : 'text-slate-700 hover:bg-[#EEF2FF] hover:text-[#4F46E5]'
          }`}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        ref={buttonRef}
        onClick={handleOpen}
        className={`w-full h-[38px] px-3.5 flex items-center justify-between border rounded-md text-sm font-semibold transition-all cursor-pointer focus:outline-none bg-white hover:border-[#6366F1] ${
          isOpen ? 'border-[#818CF8] ring-1 ring-[#818CF8]' : 'border-[#818CF8]'
        }`}
      >
        <span className={!value ? "text-slate-500" : "text-slate-700"}>{displayValue}</span>
        <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="fixed z-[9999] bg-white border border-slate-200 rounded-[12px] shadow-xl p-4 text-left flex flex-col w-[280px]"
            style={{ 
              top: selectPos.top, 
              bottom: selectPos.bottom, 
              left: selectPos.left, 
              animation: '0.15s ease-out 0s 1 normal forwards running fadeInSlide'
            }}
          >
            <style>{`
              @keyframes fadeInSlide {
                from { opacity: 0; transform: translateY(-4px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="text-sm font-bold text-slate-800">
                {currentMonth.toLocaleDateString("en-US", { month: 'long', year: 'numeric' })}
              </div>
              <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 justify-items-center">
              {renderCalendar()}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentFY() {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const fyStart = m >= 4 ? y : y - 1;
  return `${fyStart}-${fyStart + 1}`;
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "₹0";
  const n = Number(amount);
  if (isNaN(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  }).formatToParts(d);
  
  let day, month, year, hour, minute, dayPeriod;
  for (const part of parts) {
    if (part.type === "day") day = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "year") year = part.value;
    if (part.type === "hour") hour = part.value;
    if (part.type === "minute") minute = part.value;
    if (part.type === "dayPeriod") dayPeriod = part.value.toUpperCase();
  }
  return `${day} ${month} ${year} ${hour}:${minute} ${dayPeriod}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getActionConfig(actionType) {
  if (actionType?.includes("GOAL")) {
    return { label: actionType === "BASE_GOAL_CREATED" ? "Goal Created" : "Goal Change", color: "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]", icon: "✎" };
  }
  if (actionType?.includes("ALLOCATION")) {
    return { label: "Quarter Reallocation", color: "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]", icon: "↻" };
  }
  if (actionType?.includes("MAP")) {
    return { label: "Source Mapping", color: "bg-[#fdf4ff] text-[#c026d3] border-[#f5d0fe]", icon: "↔" };
  }
  if (actionType?.includes("SYSTEM")) {
    return { label: "System Adjustment", color: "bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]", icon: "⚙" };
  }
  if (actionType?.includes("DELETE") || actionType?.includes("UNMAP")) {
    return { label: actionType === "UNMAP_SUB_SOURCE" ? "Source Unmapped" : "Deleted", color: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]", icon: "✕" };
  }
  return { label: actionType, color: "bg-gray-100 text-gray-600 border-gray-200", icon: "•" };
}

function getUserDisplayName(performedBy) {
  if (!performedBy) return "System";
  if (typeof performedBy === 'object') return performedBy.displayName || "System";
  return String(performedBy);
}

function toTitleCase(str) {
  if (!str) return "";
  return str.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function GoalChangeSummary({ item }) {
  const oldVal = Number(item.oldValue || 0);
  const newVal = Number(item.newValue || 0);
  const diff = newVal - oldVal;
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
      <div className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
        <span className="text-xs text-gray-400 font-medium">Before</span>
        <span className="font-bold text-gray-700">{formatCurrency(oldVal)}</span>
      </div>
      <span className="text-gray-400 font-bold">→</span>
      <div className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
        <span className="text-xs text-gray-400 font-medium">After</span>
        <span className="font-bold text-gray-800">{formatCurrency(newVal)}</span>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${diff > 0 ? "bg-green-50 text-green-700 border-green-200" : diff < 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
        {diff > 0 ? "+" : ""}{formatCurrency(diff)}
      </span>
    </div>
  );
}

function AllocationChangeSummary({ item }) {
  const newAllocs = Array.isArray(item.newValue) ? item.newValue : [];
  if (newAllocs.length === 0) {
    try {
      const parsed = typeof item.newValue === "string" ? JSON.parse(item.newValue) : item.newValue;
      if (Array.isArray(parsed)) {
        return <AllocationChangeSummary item={{ ...item, newValue: parsed }} />;
      }
    } catch (e) {}
    return null;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {newAllocs.map((alloc, i) => (
        <div key={i} className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-md px-3 py-1.5 text-xs">
          <span className="font-semibold text-gray-700">
            {alloc.monthName || `Month ${alloc.monthNumber}`}
          </span>
          <span className="font-bold text-violet-700">{formatCurrency(alloc.amount)}</span>
          <span className="text-gray-400 capitalize">{(alloc.allocationType || "").toLowerCase().replace("_", " ")}</span>
        </div>
      ))}
    </div>
  );
}

function AuditRow({ item, onClick }) {
  const ac = getActionConfig(item.actionType);
  const oldVal = Number(item.oldValue || 0);
  const newVal = Number(item.newValue || 0);
  const diff = newVal - oldVal;

  return (
    <tr className="bg-white hover:bg-[#f8fafc] hover:shadow-[inset_4px_0_0_0_#2563eb] transition-all duration-200 group">
      {/* Action / Badges */}
      <td className="px-5 py-4 align-middle w-48 transition-colors sticky left-0 z-10 shadow-[1px_0_0_#e2e8f0] bg-white group-hover:bg-[#f8fafc]">
        <div className={`inline-flex items-center justify-center min-w-[130px] gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${ac.color}`}>
          {ac.icon} {ac.label}
        </div>
      </td>
      {/* Category */}
      <td className="px-5 py-4 align-middle w-56">
        {item.categoryName ? (
          <CategoryDisplay cat={item} size="sm" />
        ) : (
          <div className="text-[18px] font-semibold text-slate-800 leading-tight">System Action</div>
        )}
        <div className="text-[13px] font-medium text-slate-500 mt-2">{toTitleCase(item.actionType)}</div>
      </td>
      {/* Reason */}
      <td className="px-5 py-4 align-middle min-w-[200px]">
        <div className="text-[15px] font-medium text-slate-600 line-clamp-2 leading-relaxed">{item.reason || "—"}</div>
      </td>
      {/* Changes */}
      <td className="px-5 py-4 align-middle w-64 text-center">
        <div className="flex flex-col items-center justify-center gap-1.5 text-xs">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wider">Old</span>
            <span className="font-bold text-slate-800">{formatCurrency(oldVal)}</span>
          </div>
          <div className="text-slate-300 font-bold leading-none">↓</div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-slate-500 font-medium uppercase text-[10px] tracking-wider">New</span>
            <span className="font-bold text-slate-800">{formatCurrency(newVal)}</span>
          </div>
          <div className="text-slate-300 font-bold leading-none">↓</div>
          <div className="flex flex-col items-center mt-0.5">
            <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider mb-0.5">Net Change</span>
            <span className={`font-black text-[13px] px-2.5 py-0.5 rounded-full border ${diff > 0 ? "text-green-700 bg-green-50 border-green-200" : diff < 0 ? "text-red-700 bg-red-50 border-red-200" : "text-slate-700 bg-slate-100 border-slate-200"}`}>
              {diff > 0 ? "+" : ""}{formatCurrency(diff)}
            </span>
          </div>
        </div>
      </td>
      {/* User */}
      <td className="px-5 py-4 align-middle w-48 text-center">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shadow-sm shrink-0">👤</div>
          <span className="text-[15px] font-semibold text-slate-800 leading-tight text-center">{getUserDisplayName(item.performedBy)}</span>
        </div>
      </td>
      {/* Timestamp */}
      <td className="px-5 py-4 align-middle w-40 text-center">
        <div className="text-[13px] font-medium text-slate-600 leading-tight">
          {formatDateTime(item.createdAt)}
        </div>
      </td>
      {/* Detail Button */}
      <td className="px-5 py-4 align-middle text-right">
        <Button 
          variant="secondary" 
          onClick={() => onClick(item)}
          className="h-[40px] px-4 font-semibold"
        >
          View Details
        </Button>
      </td>
    </tr>
  );
}

function AuditDetailModal({ item, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!item) return null;
  const ac = getActionConfig(item.actionType);
  const oldVal = Number(item.oldValue || 0);
  const newVal = Number(item.newValue || 0);
  const diff = newVal - oldVal;

  // Note: item.metadata is available from the backend but omitted from the UI for business clarity.

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9990] transition-all" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-md shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto pointer-events-auto border border-slate-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center text-lg shadow-sm border ${ac.color}`}>
                {ac.icon}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">Audit Details</h2>
                <div className="text-xs font-bold text-slate-500 tracking-wide mt-0.5">Audit ID: {item.auditId}</div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-md transition-all shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="px-8 py-6 space-y-8 flex-1">
            {/* Audit Summary */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                Audit Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-md p-4 flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Who & When</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] shadow-sm">👤</div>
                    <span className="text-sm font-black text-slate-800">{getUserDisplayName(item.performedBy)}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 mt-1">{formatDateTime(item.createdAt)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-md p-4 flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Action & Reason</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${ac.color}`}>{ac.label}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 mt-1 leading-snug">{item.reason || "No specific reason provided for this adjustment."}</span>
                </div>
              </div>
            </div>

            {/* Recorded Changes */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Recorded Changes
              </h3>
              <div className="bg-white border border-slate-200 rounded-md p-8 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-center">
                  <div className="flex-1 w-full max-w-[200px] flex flex-col items-center text-center">
                    <span className="block text-[12px] font-medium text-slate-500 uppercase mb-2 tracking-wider">Old</span>
                    <span className="text-[30px] sm:text-[32px] font-bold text-slate-800">{formatCurrency(oldVal)}</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-5 h-5 text-slate-300 md:-rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>

                  <div className="flex-1 w-full max-w-[200px] flex flex-col items-center text-center">
                    <span className="block text-[12px] font-medium text-slate-500 uppercase mb-2 tracking-wider">New</span>
                    <span className="text-[30px] sm:text-[32px] font-bold text-slate-800">{formatCurrency(newVal)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center w-full pt-6 border-t border-slate-100">
                  <span className="block text-[12px] font-medium text-slate-500 uppercase mb-3 tracking-wider">Net Change</span>
                  <div className={`text-[16px] font-bold px-4 py-1.5 rounded-full border shadow-sm ${diff > 0 ? "bg-green-50 text-green-700 border-green-200" : diff < 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                  </div>
                </div>
              </div>
            </div>

            {/* Affected Records */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Affected Records
              </h3>
              <div className="bg-slate-50 border border-slate-100 rounded-md p-4 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Financial Year</span>
                  <span className="text-sm font-black text-slate-800">{item.metadata?.financialYear || "N/A"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Quarter</span>
                  <span className="text-sm font-black text-slate-800">{item.metadata?.targetQuarterNumber ? `Q${item.metadata.targetQuarterNumber}` : "N/A"}</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Category</span>
                  {item.categoryName ? <CategoryDisplay cat={item} size="sm" /> : <span className="text-sm font-black text-slate-800">N/A</span>}
                </div>
              </div>
            </div>

            {/* Developer Metadata is intentionally omitted from the frontend UI for business clarity, 
                but remains securely stored in the backend database for internal debugging. */}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function StrategyHistoryPage() {
  useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [actionType, setActionType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/strategy/categories`)
      .then(res => res.json())
      .then(data => { if (data.success) setCategories(data.data || []); })
      .catch(err => console.error("Error loading categories:", err));
  }, [API_BASE]);

  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'timeline'
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Calculate Quick Stats for KPI Cards
  const stats = useMemo(() => {
    let goalUpdates = 0, allocations = 0, mappings = 0, today = 0;
    const todayDate = new Date().toLocaleDateString("en-CA");
    
    filteredItems.forEach(item => {
      const isToday = new Date(item.createdAt).toLocaleDateString("en-CA") === todayDate;
      if (isToday) today++;
      
      if (item.actionType?.includes("GOAL")) goalUpdates++;
      else if (item.actionType?.includes("ALLOCATION")) allocations++;
      else if (item.actionType?.includes("MAP")) mappings++;
    });
    
    return {
      total: pagination.total || filteredItems.length,
      goalUpdates,
      allocations,
      mappings,
      today
    };
  }, [filteredItems, pagination.total]);

  const fetchHistory = useCallback(async (page = 1, currentLimit = pageSize) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const query = new URLSearchParams({
        page,
        limit: currentLimit
      });
      if (actionType) query.append("actionType", actionType);
      if (dateFrom) query.append("dateFrom", dateFrom);
      if (dateTo) query.append("dateTo", dateTo);
      if (category) query.append("categoryId", category);

      const res = await fetch(`${API_BASE}/api/strategy/history?${query.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFilteredItems(data.items || []);
        setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 });
      } else {
        toast.error("Failed to load history");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, actionType, dateFrom, dateTo, category, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterReset = () => {
    setActionType("");
    setDateFrom("");
    setDateTo("");
    setCategory("");
  };

  const handleQuickFilter = (type) => {
    const today = new Date();
    
    if (type === "TODAY") {
      const dt = today.toLocaleDateString("en-CA");
      setDateFrom(dt);
      setDateTo(dt);
    } else if (type === "WEEK") {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      setDateFrom(start.toLocaleDateString("en-CA"));
      setDateTo(today.toLocaleDateString("en-CA"));
    } else if (type === "MONTH") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(start.toLocaleDateString("en-CA"));
      setDateTo(today.toLocaleDateString("en-CA"));
    } else if (type === "GOALS") {
      setActionType("BASE_GOAL_UPDATED");
    } else if (type === "ALLOCATIONS") {
      setActionType("QUARTER_ALLOCATION_REPLACED");
    } else if (type === "MAPPINGS") {
      setActionType("MAP_SUB_SOURCE");
    }
  };

  const getExportData = () => {
    return filteredItems.map(item => {
      const ac = getActionConfig(item.actionType);
      return {
        "Timestamp": parseExcelDate(item.createdAt),
        "User": getUserDisplayName(item.performedBy),
        "Action": ac.label,
        "Strategy Category": item.categoryName || "—",
        "Reason": item.reason || "—",
        "Old Value": parseExcelNumber(item.oldValue, 0),
        "New Value": parseExcelNumber(item.newValue, 0),
        "Status": item.actionType.includes("DELETE") ? "Deleted" : "Active"
      };
    });
  };

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.info("No records to export");
      return;
    }
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `strategy-audit-history-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      toast.info("No records to export");
      return;
    }
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data, {
      cellDates: true,
      dateNF: "dd-mm-yyyy hh:mm",
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit History");
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `strategy-audit-history-${dateStr}.xlsx`);
  };

  return (
    <CheckPermission allowedRoles={["Admin", "Super Admin", "Sales", "Estimation", "Leads Management"]}>
      <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
        <Header />
        <StrategyNav />

        <main className="w-full px-4 sm:px-6 lg:px-8 max-w-[96%] mx-auto py-6 sm:py-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-md bg-[linear-gradient(135deg,#4F46E5_0%,#6366F1_45%,#7C3AED_100%)] text-white flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-tight">Strategy Audit Center</h1>
              </div>
              <p className="text-[16px] text-slate-500 max-w-[760px] leading-relaxed">
                Review every strategy-related activity including goal changes, quarter reallocations, source mapping updates, and system adjustments with complete transparency and accountability.
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button onClick={() => setViewMode("table")} variant={viewMode === "table" ? "secondary" : "ghost"} className="h-[38px] px-4 text-sm font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Table
              </Button>
              <Button onClick={() => setViewMode("timeline")} variant={viewMode === "timeline" ? "secondary" : "ghost"} className="h-[38px] px-4 text-sm font-bold">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                Timeline
              </Button>
            </div>
          </div>

          {/* ── Summary KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Audit Records", value: stats.total, sub: "All recorded activities", color: "text-slate-800", bg: "bg-slate-100", border: "border-t-slate-400" },
              { label: "Goal Changes", value: stats.goalUpdates, sub: "Base & Effective changes", color: "text-[#2563eb]", bg: "bg-blue-50", border: "border-t-[#2563eb]" },
              { label: "Quarter Reallocations", value: stats.allocations, sub: "Reallocation activities", color: "text-[#16a34a]", bg: "bg-green-50", border: "border-t-[#16a34a]" },
              { label: "Source Mapping Changes", value: stats.mappings, sub: "Category mapping updates", color: "text-[#c026d3]", bg: "bg-purple-50", border: "border-t-[#c026d3]" },
              { label: "Today's Changes", value: stats.today, sub: "Changes made today", color: "text-[#ea580c]", bg: "bg-orange-50", border: "border-t-[#ea580c]" }
            ].map((card, idx) => (
              <div key={idx} className={`bg-white rounded-md p-5 border border-[#e2e8f0] border-t-[3px] ${card.border} shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group hover:-translate-y-1.5 flex flex-col justify-between min-h-[140px]`}>
                <div className={`absolute -right-4 -top-4 w-12 h-12 rounded-full opacity-60 ${card.bg} group-hover:scale-[2.5] transition-transform duration-500`}></div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 relative z-10">{card.label}</h3>
                <div className={`text-4xl font-black mb-1 relative z-10 ${card.color}`}>{card.value}</div>
                <p className="text-[13px] font-semibold text-slate-500 relative z-10 whitespace-nowrap overflow-hidden text-ellipsis">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="bg-white px-5 py-4 rounded-md border border-[#e2e8f0] shadow-sm mb-5">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-[430px] shrink-0">
                <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search by user, category, action, reason, or Audit ID..." 
                  className="w-full h-[40px] pl-10 pr-4 bg-white border border-[#818CF8] rounded-md text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-[#818CF8]/20 hover:border-[#6366F1] transition-all"
                />
              </div>
              
              <div className="flex-1 w-full flex items-center justify-end gap-4 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="secondary"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className="whitespace-nowrap shrink-0 px-4 h-[38px] justify-center text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filter {isFilterExpanded ? '▲' : '▼'}
                  </Button>
                  <Button variant="secondary" onClick={handleExportCSV} className="whitespace-nowrap shrink-0 px-4 h-[38px] justify-center text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export CSV
                  </Button>
                  <Button variant="secondary" onClick={handleExportExcel} className="whitespace-nowrap shrink-0 px-4 h-[38px] justify-center text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Export Excel
                  </Button>
                </div>
              </div>
            </div>

            <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isFilterExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Action Type</label>
                      <Select value={actionType} onChange={setActionType} options={ACTION_TYPE_OPTIONS} className="w-full h-[38px]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Strategy Category</label>
                      <Select 
                        value={category} 
                        onChange={setCategory} 
                        options={[
                          { value: "", label: "All Categories" },
                          ...categories.map(c => ({ value: String(c.id), label: c.name }))
                        ]}
                        searchable={true} 
                        className="w-full h-[38px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">From Date</label>
                      <CustomDatePicker value={dateFrom} onChange={setDateFrom} placeholder="mm/dd/yyyy" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">To Date</label>
                      <CustomDatePicker value={dateTo} onChange={setDateTo} placeholder="mm/dd/yyyy" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end items-center gap-4 border-t border-slate-100 pt-3 mt-3">
                    <Button variant="secondary" className="h-[38px] px-5 rounded-md font-semibold text-sm" onClick={handleFilterReset}>
                      Reset Filters
                    </Button>
                    <Button variant="primary" className="h-[38px] px-6 rounded-md font-semibold shadow-sm" disabled={loading} onClick={() => fetchHistory(1)}>
                      {loading ? "Searching..." : "Apply Filters"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick Filter Chips ── */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-2">Quick Filters</span>
            {[
              { label: "Today", value: "TODAY" },
              { label: "This Week", value: "WEEK" },
              { label: "This Month", value: "MONTH" },
              { label: "Goal Changes", value: "GOALS" },
              { label: "Quarter Reallocations", value: "ALLOCATIONS" },
              { label: "Source Mapping", value: "MAPPINGS" }
            ].map(chip => {
              // Simple active check for visual feedback (simulated)
              const isActive = false; // Add real logic if requested, but outline is fine for now
              return (
                <button 
                  key={chip.value} 
                  onClick={() => { handleQuickFilter(chip.value); fetchHistory(1); }}
                  className={`h-9 px-4 rounded-full border text-[13px] font-semibold transition-all duration-200 shadow-sm cursor-pointer ${
                    isActive 
                      ? "bg-[#2563eb] text-white border-[#2563eb]" 
                      : "bg-white text-[#2563eb] border-[#2563eb] hover:bg-[#eff6ff]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* ── History Table or Timeline ── */}
          <div className={`bg-white rounded-md border border-[#e2e8f0] shadow-2xs overflow-hidden ${viewMode === "timeline" ? "p-8" : ""}`}>
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-md animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-24 text-slate-400 flex flex-col items-center">
                <div className="text-6xl mb-4 opacity-50">🗄️</div>
                <h3 className="font-black text-xl text-slate-700 tracking-tight">No Audit Records Found</h3>
                <p className="text-[15px] mt-2 text-slate-500 max-w-md leading-relaxed mb-6">
                  Audit history will automatically appear here after strategy-related changes are made across the ERP.
                </p>
                {(actionType || category || dateFrom || dateTo) && (
                  <Button variant="ghost" className="h-[46px] px-6 rounded-md font-semibold border border-slate-200 hover:bg-slate-50 transition-all" onClick={handleFilterReset}>
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : viewMode === "timeline" ? (
              <div className="max-w-3xl mx-auto py-8">
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {filteredItems.map((item, idx) => {
                    const ac = getActionConfig(item.actionType);
                    return (
                      <div key={item.auditId} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${ac.color.split(' ')[0]} text-${ac.color.split(' ')[1].split('-')[1]}-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110`}>
                          {ac.icon}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-md border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-1 hover:border-slate-300 cursor-pointer" onClick={() => setSelectedItem(item)}>
                          <div className="flex items-center justify-between space-x-2 mb-2">
                            <div className={`text-xs font-black px-2 py-0.5 rounded border ${ac.color}`}>{ac.label}</div>
                            <time className="text-[11px] font-bold text-slate-400">{formatDateTime(item.createdAt)}</time>
                          </div>
                          {item.categoryName ? (
                            <div className="mb-3"><CategoryDisplay cat={item} size="sm" /></div>
                          ) : (
                            <div className="text-sm font-black text-slate-800 mb-3">System Action</div>
                          )}
                          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] shadow-sm">👤</div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700 leading-none">{getUserDisplayName(item.performedBy)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-t-md border-t border-l border-r border-[#E0E7FF] shadow-sm w-full">
                <table className="min-w-[1000px] w-full text-left border-collapse">
                  <thead className="bg-[#EEF2FF] border-b-[2px] border-[#E0E7FF] sticky top-0 z-20">
                    <tr className="h-[52px]">
                      <th className="px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider align-middle sticky left-0 bg-[#EEF2FF] z-30 shadow-[1px_0_0_#e2e8f0]">Action</th>
                      <th className="px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider align-middle">Category</th>
                      <th className="px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider align-middle">Reason</th>
                      <th className="px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">Change</th>
                      <th className="px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">User</th>
                      <th className="px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">Timestamp</th>
                      <th className="px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right align-middle">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] bg-white text-xs">
                    {filteredItems.map((item) => (
                      <AuditRow key={item.auditId} item={item} onClick={setSelectedItem} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Pagination (Enterprise) ── */}
          {!loading && pagination.total > 0 && (
            <div className="mt-5 rounded-md border border-slate-200 shadow-sm overflow-hidden">
              <Pagination
                total={pagination.total}
                page={pagination.page}
                pageSize={pageSize}
                onPageChange={(pg) => fetchHistory(pg, pageSize)}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  fetchHistory(1, sz);
                }}
                itemName="records"
              />
            </div>
          )}

        </main>

        {/* ── Audit Detail Modal ── */}
        {selectedItem && (
          <AuditDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </div>
    </CheckPermission>
  );
}
