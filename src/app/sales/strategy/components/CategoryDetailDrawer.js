"use client";

/**
 * CategoryDetailDrawer — Reusable Level 2 Detail Panel
 *
 * Answers: "Why is it happening?" and "Which quotations caused it?"
 *
 * Works from:
 *  - Monthly Overview  (mode="MONTH",   period=monthNumber)
 *  - Quarterly Overview (mode="QUARTER", period=quarterNumber)
 *  - Annual Overview    (mode="YEAR",    period=null)
 *
 * NOTE: Zero business logic lives here — all data is received via props or
 * fetched from the existing /api/strategy/category/:id/contributions endpoint.
 * No calculations, no API changes. Pure UI restructuring.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { getCategoryStyles } from "@/utils/CategoryThemeHelper";
import CategoryDisplay from "@/app/components/CategoryDisplay";
import MonthCarryAllocationModal from "./MonthCarryAllocationModal";
import { Button } from "./Button";

// ─── MONTHS META (for modal label lookup) ────────────────────────────────────
const MONTHS_META = [
  { monthNumber: 4,  name: "April"    },
  { monthNumber: 5,  name: "May"      },
  { monthNumber: 6,  name: "June"     },
  { monthNumber: 7,  name: "July"     },
  { monthNumber: 8,  name: "August"   },
  { monthNumber: 9,  name: "September"},
  { monthNumber: 10, name: "October"  },
  { monthNumber: 11, name: "November" },
  { monthNumber: 12, name: "December" },
  { monthNumber: 1,  name: "January"  },
  { monthNumber: 2,  name: "February" },
  { monthNumber: 3,  name: "March"    },
];

function getNextFYMonthName(monthNumber) {
  const fyOrder = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  const idx = fyOrder.indexOf(Number(monthNumber));
  if (idx >= 0 && idx < fyOrder.length - 1) {
    const nextNum = fyOrder[idx + 1];
    return MONTHS_META.find((m) => m.monthNumber === nextNum)?.name || "Next Month";
  }
  return "Next Month";
}

// ─── HELPERS (display-only — no business logic) ──────────────────────────────

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "₹0";
  const n = Number(amount);
  if (n === 0) return "₹0";
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatCurrencyFull(amount) {
  if (!amount) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatusBadge(status) {
  switch (status) {
    case "AHEAD":
      return { label: "Ahead",    cls: "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-bold" };
    case "BEHIND":
      return { label: "Behind",   cls: "bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] font-bold" };
    case "ON_TRACK":
      return { label: "On Track", cls: "bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] font-bold" };
    case "BALANCED":
    default:
      return { label: status || "Balanced", cls: "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] font-bold" };
  }
}

// ─── LEVEL 3 — Inline Quotation Detail ───────────────────────────────────────

function QuotationDetail({ item, accentColor, onClose }) {
  return (
    <div className="mt-2 mb-1 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 animate-in slide-in-from-top-1 duration-200">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">Quotation Detail</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-white/60"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
        <div>
          <span className="text-slate-500 font-semibold block mb-0.5">Quotation No.</span>
          <span className="font-black text-slate-900">{item.quotationNo}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block mb-0.5">Status</span>
          <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${
            item.quotationStatus === "Won"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {item.quotationStatus}
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block mb-0.5">Customer</span>
          <span className="font-bold text-slate-800">{item.customerName || item.companyName || "Unknown"}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block mb-0.5">Amount</span>
          <span className="font-black text-base" style={{ color: accentColor }}>
            {formatCurrency(item.contributionAmount)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block mb-0.5">Won Date</span>
          <span className="font-semibold text-slate-700">{formatDate(item.wonDate)}</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block mb-0.5">Source</span>
          <span className="font-semibold text-slate-700">{item.sourceName || "—"}</span>
        </div>
        <div className="col-span-2">
          <span className="text-slate-500 font-semibold block mb-0.5">Strategy Period</span>
          <span className="font-semibold text-slate-700">{item.financialYear} Q{item.quarterNumber}</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DRAWER COMPONENT ───────────────────────────────────────────────────

export default function CategoryDetailDrawer({
  category,
  financialYear,
  mode,
  period,
  apiBase,
  onClose,
  onRefresh,
}) {
  const [contribs, setContribs]               = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [page, setPage]                       = useState(1);
  const [selectedCarryMonth, setSelectedCarryMonth] = useState(null);
  // Level 3: track which quotation is expanded
  const [expandedQuotationId, setExpandedQuotationId] = useState(null);
  const drawerRef = useRef(null);

  // ── Fetch contributions (unchanged from original CategoryDrawer) ───────────
  const fetchContribs = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ financialYear, mode, page: p, limit: 15 });
        if (mode === "MONTH"   && period) params.set("month",   period);
        if (mode === "QUARTER" && period) params.set("quarter", period);
        const res = await fetch(
          `${apiBase}/api/strategy/category/${category.categoryId}/contributions?${params}`,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        const data = await res.json();
        if (data.success !== false) {
          setContribs(data);
          setPage(p);
        } else {
          toast.error(data.message || "Failed to load contributions");
        }
      } catch (err) {
        console.error("Error loading contributions:", err);
        toast.error("Network error");
      } finally {
        setLoading(false);
      }
    },
    [category.categoryId, financialYear, mode, period, apiBase]
  );

  useEffect(() => { fetchContribs(1); }, [fetchContribs]);

  // Escape key to close
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Derived display values ────────────────────────────────────────────────
  const statusBadge = getStatusBadge(category.performanceStatus);
  const style       = getCategoryStyles(category.color);
  const accentColor = category.badge_text_color || category.icon_color || style.dotHex;

  let achievedPct = 0;
  if (category.effectiveGoal > 0) {
    achievedPct = Math.min((category.achievement / category.effectiveGoal) * 100, 100);
  } else if (category.effectiveGoal === 0 && category.achievement > 0) {
    achievedPct = 100;
  }

  const hasCarry  = category.closingShortfall > 0 || category.closingExcess > 0;
  const isShortfall = category.closingShortfall > 0;
  const carryAmt  = isShortfall ? category.closingShortfall : category.closingExcess;

  // Toggle Level 3 quotation detail
  const toggleQuotation = (id) => {
    setExpandedQuotationId(prev => prev === id ? null : id);
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Drawer Panel ── */}
      <aside
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto flex flex-col"
        style={{ animation: "slideInFromRight 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both" }}
        role="dialog"
        aria-modal="true"
        aria-label={`${category.categoryName} details`}
      >

        {/* ══════════════════════════════════════════════════════════════
            HEADER
        ══════════════════════════════════════════════════════════════ */}
        <div className="bg-white px-6 py-5 flex items-start justify-between border-b border-slate-100 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <CategoryDisplay cat={category} size="lg" />
            <div className="flex items-center gap-2 mt-2.5">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {financialYear}
                {mode === "MONTH"   && period ? ` · Month ${period}` : ""}
                {mode === "QUARTER" && period ? ` · Q${period}`      : ""}
                {mode === "YEAR"              ? " · Full Year"        : ""}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors p-2 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — SUMMARY (Goal / Achievement / Variance)
        ══════════════════════════════════════════════════════════════ */}
        <div className="px-6 pt-5 pb-4">
          {/* 3-chip stat row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Effective Goal */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Effective Goal</p>
              <p className="text-lg font-extrabold text-slate-900 tabular-nums leading-tight">
                {formatCurrency(category.effectiveGoal)}
              </p>
              {category.baseGoal !== category.effectiveGoal && (
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  Base: {formatCurrency(category.baseGoal)}
                </p>
              )}
            </div>

            {/* Achievement */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Achievement</p>
              <p className="text-lg font-extrabold text-slate-900 tabular-nums leading-tight">
                {formatCurrency(category.achievement)}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                {category.contributionCount || 0} contribution{category.contributionCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Variance */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Variance</p>
              <p className={`text-lg font-extrabold tabular-nums leading-tight ${
                category.variance >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}>
                {category.variance >= 0 ? "+" : ""}{formatCurrency(category.variance)}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                vs effective goal
              </p>
            </div>
          </div>

          {/* ── PERFORMANCE: Achievement % + Progress Bar ── */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Goal Progress</span>
              <span className="text-sm font-black tabular-nums" style={{ color: accentColor }}>
                {achievedPct.toFixed(1)}%
              </span>
            </div>
            <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${achievedPct}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — CARRY (Shortfall / Excess banner)
        ══════════════════════════════════════════════════════════════ */}
        {hasCarry && (() => {
          const catAllocated = Number(category.allocatedOut || category.allocatedShortfallOut || category.allocatedExcessOut || 0);
          const catRemainingAuto = Number(
            category.effectiveCarryForward !== undefined
              ? category.effectiveCarryForward
              : (isShortfall ? category.effectiveOutgoingShortfall : category.effectiveOutgoingExcess) !== undefined
              ? (isShortfall ? category.effectiveOutgoingShortfall : category.effectiveOutgoingExcess)
              : Math.max(0, carryAmt - catAllocated)
          );
          const closingMonthForLookup = mode === "QUARTER"
            ? (Number(period) === 1 ? 6 : Number(period) === 2 ? 9 : Number(period) === 3 ? 12 : 3)
            : (Number(period) || 4);
          const topNextMonthName = getNextFYMonthName(closingMonthForLookup);

          return (
            <div className="px-6 pb-4">
              <div className={`rounded-xl px-5 py-4 border flex items-center justify-between ${
                isShortfall
                  ? "bg-rose-50 border-rose-100/60"
                  : "bg-emerald-50 border-emerald-100/60"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    isShortfall ? "bg-rose-200 text-rose-700" : "bg-emerald-200 text-emerald-700"
                  }`}>
                    {isShortfall ? "!" : "✓"}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-extrabold ${isShortfall ? "text-rose-900" : "text-emerald-900"}`}>
                        {isShortfall ? "Closing Shortfall" : "Closing Excess"}
                      </p>
                      <span className="text-[10px] font-bold text-slate-600 bg-white/90 border border-slate-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                        {category.categoryName} • {mode === "MONTH" ? (MONTHS_META.find(m => m.monthNumber === Number(period))?.name || `Month ${period}`) : mode === "QUARTER" ? `Q${period}` : "Full Year"}
                      </span>
                    </div>
                    <p className={`text-xl font-black mt-0.5 tabular-nums ${isShortfall ? "text-rose-700" : "text-emerald-700"}`}>
                      {formatCurrencyFull(carryAmt)}
                    </p>

                    {catAllocated > 0 ? (
                      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-300/80 space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600">Allocated:</span>
                          <span className="font-extrabold text-slate-900 tabular-nums">{formatCurrencyFull(catAllocated)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600">Remaining Auto Carry:</span>
                          <span className="font-extrabold text-indigo-700 tabular-nums">
                            {formatCurrencyFull(catRemainingAuto)} → {topNextMonthName}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-[11px] font-semibold mt-1 ${isShortfall ? "text-rose-600/80" : "text-emerald-600/80"}`}>
                        {isShortfall
                          ? "Will increase next month's effective goal"
                          : "Available carry-forward"}
                      </p>
                    )}
                  </div>
                </div>

                {mode === "MONTH" && (
                  <div className="flex-shrink-0 ml-4">
                    <Button
                      variant="primary"
                      onClick={() => setSelectedCarryMonth({
                        monthNumber: Number(period),
                        monthName: MONTHS_META.find((m) => m.monthNumber === Number(period))?.name || "",
                      })}
                      className="whitespace-nowrap shadow-sm"
                    >
                      Allocate Carry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Allocate Carry Modal (Dynamic for Month or clicked Quarter Month) */}
        {selectedCarryMonth && (
          <MonthCarryAllocationModal
            isOpen={!!selectedCarryMonth}
            onClose={() => setSelectedCarryMonth(null)}
            onSave={() => {
              setSelectedCarryMonth(null);
              toast.success("Carry allocation saved successfully.");
              if (onRefresh) onRefresh();
            }}
            sourceMonth={selectedCarryMonth.monthNumber}
            sourceMonthName={selectedCarryMonth.monthName}
            financialYear={financialYear}
            categoryId={category.categoryId}
            categoryName={category.categoryName}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2.5 — QUARTERLY MONTHS PROGRESSION (Quarter Mode Only)
        ══════════════════════════════════════════════════════════════ */}
        {mode === "QUARTER" && category.monthsSequence?.length > 0 && (
          <div className="px-6 pb-4">
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Quarterly Monthly Progression & Carry Flow
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {category.monthsSequence.map((m) => {
                  const mVariance = Number(m.variance || (m.achievement - m.effectiveGoal) || 0);
                  const isAhead = mVariance >= 0;
                  const hasAdj = m.quarterShortfallAddition > 0 || m.quarterExcessReduction > 0 || m.incomingShortfall > 0 || m.incomingExcessCredit > 0;
                  const hasMonthCarry = m.closingShortfall > 0 || m.closingExcess > 0;
                  const isClosingShortfall = m.closingShortfall > 0;
                  const closingAmount = isClosingShortfall ? m.closingShortfall : m.closingExcess;
                  const mAllocated = Number(m.allocatedOut || m.allocatedShortfallOut || m.allocatedExcessOut || 0);
                  const mRemainingAuto = Number(
                    m.effectiveCarryForward !== undefined
                      ? m.effectiveCarryForward
                      : (isClosingShortfall ? m.effectiveOutgoingShortfall : m.effectiveOutgoingExcess) !== undefined
                      ? (isClosingShortfall ? m.effectiveOutgoingShortfall : m.effectiveOutgoingExcess)
                      : Math.max(0, closingAmount - mAllocated)
                  );
                  const mNextMonthName = getNextFYMonthName(m.monthNumber);

                  // Label the closing month specifically for Q1/Q2/Q3/Q4
                  const quarterClosingMonthNum = Number(period) === 1 ? 6 : Number(period) === 2 ? 9 : Number(period) === 3 ? 12 : 3;
                  const isQuarterClosingMonth = m.monthNumber === quarterClosingMonthNum;
                  const monthDisplayName = isQuarterClosingMonth
                    ? `${m.monthName} (Q${period} Closing)`
                    : m.monthName;

                  return (
                    <div
                      key={m.monthNumber}
                      className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-900">{m.monthName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAhead ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {isAhead ? "Ahead" : "Behind"}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Base Goal:</span>
                            <span className="font-semibold text-slate-800">{formatCurrency(m.baseGoal)}</span>
                          </div>

                          {hasAdj && (
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>Carry / Adj:</span>
                              <span className="font-medium text-slate-700">
                                {m.quarterShortfallAddition > 0 && `+${formatCurrency(m.quarterShortfallAddition)} `}
                                {m.incomingShortfall > 0 && `+${formatCurrency(m.incomingShortfall)} `}
                                {m.quarterExcessReduction > 0 && `-${formatCurrency(m.quarterExcessReduction)} `}
                                {m.incomingExcessCredit > 0 && `-${formatCurrency(m.incomingExcessCredit)} `}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-100">
                            <span>Eff. Goal:</span>
                            <span className="font-bold text-indigo-900">{formatCurrency(m.effectiveGoal)}</span>
                          </div>

                          <div className="flex justify-between text-slate-700 font-medium">
                            <span>Won Rev:</span>
                            <span className="font-bold text-emerald-700">{formatCurrency(m.achievement)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Closing:</span>
                          {isClosingShortfall ? (
                            <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-[11px]">
                              Shortfall {formatCurrency(closingAmount)}
                            </span>
                          ) : m.closingExcess > 0 ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                              Excess {formatCurrency(closingAmount)}
                            </span>
                          ) : (
                            <span className="font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                              Balanced ₹0
                            </span>
                          )}
                        </div>

                        {mAllocated > 0 && (
                          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1 text-[11px]">
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="font-medium">Allocated:</span>
                              <span className="font-bold text-slate-800 tabular-nums">{formatCurrency(mAllocated)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="font-medium">Remaining Auto Carry:</span>
                              <span className="font-bold text-indigo-700 tabular-nums">
                                {formatCurrency(mRemainingAuto)} → {mNextMonthName}
                              </span>
                            </div>
                          </div>
                        )}

                        {hasMonthCarry && (
                          <button
                            type="button"
                            onClick={() => setSelectedCarryMonth({
                              monthNumber: m.monthNumber,
                              monthName: monthDisplayName,
                            })}
                            className="w-full mt-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 px-3 text-xs font-semibold shadow-xs transition-colors text-center"
                          >
                            Allocate Carry
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — SOURCE BREAKDOWN
        ══════════════════════════════════════════════════════════════ */}
        {contribs?.sourceBreakdown?.length > 0 && (
          <div className="px-6 pb-4">
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                Source Breakdown
              </h4>
              <div className="flex flex-wrap gap-2">
                {contribs.sourceBreakdown.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2 bg-white border border-slate-200 shadow-sm hover:-translate-y-0.5 transition-transform"
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                    <span className="text-sm font-bold text-slate-700">{s.sourceName}</span>
                    <span className="text-sm font-black tabular-nums" style={{ color: accentColor }}>
                      {formatCurrency(s.amount)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                      {s.count} {s.count === 1 ? "deal" : "deals"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — CONTRIBUTING QUOTATIONS (Level 2+3)
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 px-6 pb-8">
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Contributing Quotations
              </h4>
              {contribs && (
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  {contribs.contributionCount} total
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[72px] bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : contribs?.items?.length > 0 ? (
              <>
                <div className="space-y-2">
                  {contribs.items.map((item) => {
                    const isExpanded = expandedQuotationId === item.contributionId;
                    return (
                      <div key={item.contributionId}>
                        {/* ── Quotation Row (Level 2) ── */}
                        <div
                          onClick={() => toggleQuotation(item.contributionId)}
                          className={`group flex items-center justify-between rounded-xl p-4 border transition-all duration-200 cursor-pointer select-none ${
                            isExpanded
                              ? "border-indigo-200 bg-indigo-50/30 shadow-sm"
                              : "bg-white border-slate-200/70 hover:shadow-sm hover:border-slate-300"
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2.5 mb-1">
                              <span className="text-sm font-extrabold text-slate-900">
                                {item.quotationNo}
                              </span>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                item.quotationStatus === "Won"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : "bg-blue-50 text-blue-700 border border-blue-200/60"
                              }`}>
                                {item.quotationStatus}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-600 truncate">
                              {item.customerName || item.companyName || "Unknown Customer"}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-slate-400">
                              <span>{formatDate(item.wonDate)}</span>
                              {item.sourceName && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                                  <span>{item.sourceName}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-base font-black tabular-nums" style={{ color: accentColor }}>
                                {formatCurrency(item.contributionAmount)}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                {item.financialYear} Q{item.quarterNumber}
                              </div>
                            </div>
                            {/* Expand chevron */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                              isExpanded
                                ? "bg-indigo-100 text-indigo-600"
                                : "text-slate-300 group-hover:text-slate-400 group-hover:bg-slate-50"
                            }`}>
                              <svg
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* ── Level 3: Inline Quotation Detail ── */}
                        {isExpanded && (
                          <QuotationDetail
                            item={item}
                            accentColor={accentColor}
                            onClose={() => setExpandedQuotationId(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {contribs.pagination?.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">
                      Page {contribs.pagination.page} of {contribs.pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        disabled={contribs.pagination.page <= 1}
                        onClick={() => {
                          setExpandedQuotationId(null);
                          fetchContribs(contribs.pagination.page - 1);
                        }}
                        className="px-4 h-[36px] text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={contribs.pagination.page >= contribs.pagination.totalPages}
                        onClick={() => {
                          setExpandedQuotationId(null);
                          fetchContribs(contribs.pagination.page + 1);
                        }}
                        className="px-4 h-[36px] text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-14 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="text-3xl mb-3">📭</div>
                <p className="text-sm font-bold text-slate-700">No contributions found</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Quotations mapped to this category will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* CSS animation (inline — no external dependency) */}
      <style jsx global>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0.6; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
      `}</style>
    </>
  );
}
