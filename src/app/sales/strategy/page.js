"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/components/header";
import StrategyNav from "./components/StrategyNav";
import CheckPermission from "@/app/components/CheckPermission";
import useAuth from "@/app/components/useAuth";
import { getCategoryStyles, getCategoryIconHTML } from "@/utils/CategoryThemeHelper";
import CategoryDisplay from "@/app/components/CategoryDisplay";
import { toast } from "react-toastify";
import { Select } from "./components/Select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import DashboardCard from './components/executive/DashboardCard';
import MetricCard from './components/executive/MetricCard';
import ChartCard from './components/executive/ChartCard';
import RankingCard from './components/executive/RankingCard';
import MonthCarryAllocationModal from "./components/MonthCarryAllocationModal";
import { Button } from "./components/Button";
import CategoryDetailDrawer from "./components/CategoryDetailDrawer";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Metadata
// ─────────────────────────────────────────────────────────────────────────────

const AVAILABLE_YEARS = [
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028",
  "2028-2029",
  "2029-2030",
];

const MONTHS_META = [
  { monthNumber: 4, name: "April", shortName: "Apr", quarterNumber: 1 },
  { monthNumber: 5, name: "May", shortName: "May", quarterNumber: 1 },
  { monthNumber: 6, name: "June", shortName: "Jun", quarterNumber: 1 },
  { monthNumber: 7, name: "July", shortName: "Jul", quarterNumber: 2 },
  { monthNumber: 8, name: "August", shortName: "Aug", quarterNumber: 2 },
  { monthNumber: 9, name: "September", shortName: "Sep", quarterNumber: 2 },
  { monthNumber: 10, name: "October", shortName: "Oct", quarterNumber: 3 },
  { monthNumber: 11, name: "November", shortName: "Nov", quarterNumber: 3 },
  { monthNumber: 12, name: "December", shortName: "Dec", quarterNumber: 3 },
  { monthNumber: 1, name: "January", shortName: "Jan", quarterNumber: 4 },
  { monthNumber: 2, name: "February", shortName: "Feb", quarterNumber: 4 },
  { monthNumber: 3, name: "March", shortName: "Mar", quarterNumber: 4 },
];

const QUARTERS_META = [
  { quarterNumber: 1, label: "Q1 (Apr–Jun)" },
  { quarterNumber: 2, label: "Q2 (Jul–Sep)" },
  { quarterNumber: 3, label: "Q3 (Oct–Dec)" },
  { quarterNumber: 4, label: "Q4 (Jan–Mar)" },
];

// Category styles are parsed dynamically from the database color field

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getCurrentFY() {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const fyStart = m >= 4 ? y : y - 1;
  return `${fyStart}-${fyStart + 1}`;
}

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "₹0";
  const n = Number(amount);
  if (n === 0) return "₹0";
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatCurrencyFull(amount) {
  if (!amount) return "₹0";
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStyleForCategory(category) {
  return getCategoryStyles(category?.color);
}

function getStatusBadge(status) {
  switch (status) {
    case "AHEAD":
      return {
        label: "Ahead",
        cls: "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-bold",
      };
    case "BEHIND":
      return {
        label: "Behind",
        cls: "bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] font-bold",
      };
    case "ON_TRACK":
      return {
        label: "On Track",
        cls: "bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] font-bold",
      };
    case "BALANCED":
      return {
        label: "Balanced",
        cls: "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] font-bold",
      };
    default:
      return {
        label: status || "Balanced",
        cls: "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] font-bold",
      };
  }
}

/**
 * Deterministic Forecast Status Thresholds (Display-only):
 * Projected Achievement >= 100% -> Exceeded (emerald)
 * Projected Achievement >= 90%  -> On Track (emerald)
 * Projected Achievement >= 75%  -> At Risk (amber)
 * Projected Achievement < 75%   -> Behind (rose)
 *
 * NOTE: These thresholds apply ONLY to the forecast display and do NOT mutate
 * backend performanceStatus or existing calculations.
 */
function getForecastStatus(projectedPct) {
  const pct = Number(projectedPct) || 0;
  if (pct >= 100) {
    return {
      label: "Exceeded",
      badgeCls: "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-bold",
      dotCls: "bg-emerald-500",
      textCls: "text-emerald-700",
      progressBg: "bg-emerald-500",
    };
  }
  if (pct >= 90) {
    return {
      label: "On Track",
      badgeCls: "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] font-bold",
      dotCls: "bg-emerald-500",
      textCls: "text-emerald-700",
      progressBg: "bg-emerald-500",
    };
  }
  if (pct >= 75) {
    return {
      label: "At Risk",
      badgeCls: "bg-[#fffbeb] text-[#d97706] border border-[#fde68a] font-bold",
      dotCls: "bg-amber-500",
      textCls: "text-amber-700",
      progressBg: "bg-amber-500",
    };
  }
  return {
    label: "Behind",
    badgeCls: "bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] font-bold",
    dotCls: "bg-rose-500",
    textCls: "text-rose-700",
    progressBg: "bg-rose-500",
  };
}

/**
 * Source Performance Status Visual Mapping:
 * AHEAD    -> emerald (bg-emerald-50 text-emerald-700 border-emerald-200)
 * ON_TRACK -> indigo  (bg-indigo-50 text-indigo-700 border-indigo-200)
 * BEHIND   -> rose    (bg-rose-50 text-rose-700 border-rose-200)
 * BALANCED -> slate   (bg-slate-100 text-slate-700 border-slate-200)
 */
function getSourcePerformanceStatusBadge(status) {
  switch (status) {
    case "AHEAD":
      return {
        label: "Ahead",
        badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
        dotCls: "bg-emerald-500",
      };
    case "ON_TRACK":
      return {
        label: "On Track",
        badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold",
        dotCls: "bg-indigo-500",
      };
    case "BEHIND":
      return {
        label: "Behind",
        badgeCls: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
        dotCls: "bg-rose-500",
      };
    case "BALANCED":
    default:
      return {
        label: status || "Balanced",
        badgeCls: "bg-slate-100 text-slate-700 border-slate-200 font-bold",
        dotCls: "bg-slate-400",
      };
  }
}

/**
 * Source Health Bar Color Rules:
 * 0–74.99%  -> rose
 * 75–89.99% -> amber
 * 90–99.99% -> indigo
 * 100%+     -> emerald
 */
function getSourceHealthBarColor(pct) {
  const p = Number(pct) || 0;
  if (p >= 100) return "bg-emerald-500";
  if (p >= 90) return "bg-indigo-600";
  if (p >= 75) return "bg-amber-500";
  return "bg-rose-500";
}

/**
 * Deterministic Source Momentum Status (DISPLAY-ONLY):
 * >= +10% -> Strong (emerald)
 * >= +3%  -> Improving (emerald)
 * > -3%   -> Stable (slate / indigo)
 * > -10%  -> Weakening (amber)
 * <= -10% -> Critical (rose)
 */
function getMomentumStatus(momentumPct) {
  const p = Number(momentumPct) || 0;
  if (p >= 10) {
    return {
      label: "Strong",
      icon: "↑",
      badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
      textCls: "text-emerald-700",
    };
  }
  if (p >= 3) {
    return {
      label: "Improving",
      icon: "↗",
      badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
      textCls: "text-emerald-700",
    };
  }
  if (p > -3) {
    return {
      label: "Stable",
      icon: "→",
      badgeCls: "bg-slate-100 text-slate-700 border-slate-200 font-bold",
      textCls: "text-slate-700",
    };
  }
  if (p > -10) {
    return {
      label: "Weakening",
      icon: "↘",
      badgeCls: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
      textCls: "text-amber-700",
    };
  }
  return {
    label: "Critical",
    icon: "↓",
    badgeCls: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
    textCls: "text-rose-700",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Drill-Down Drawer Component
// ─────────────────────────────────────────────────────────────────────────────

function CategoryDrawer({ category, financialYear, mode, period, apiBase, onClose, onRefresh }) {
  const [contribs, setContribs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const drawerRef = useRef(null);

  const fetchContribs = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ financialYear, mode, page: p, limit: 15 });
        if (mode === "MONTH" && period) params.set("month", period);
        if (mode === "QUARTER" && period) params.set("quarter", period);
        const res = await fetch(
          `${apiBase}/api/strategy/category/${category.categoryId}/contributions?${params}`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }
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

  useEffect(() => {
    fetchContribs(1);
  }, [fetchContribs]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const statusBadge = getStatusBadge(category.performanceStatus);
  const style = getCategoryStyles(category.color);

  // Calculate percentage
  let achievedPct = 0;
  if (category.effectiveGoal > 0) {
    achievedPct = Math.min((category.achievement / category.effectiveGoal) * 100, 100);
  } else if (category.effectiveGoal === 0 && category.achievement > 0) {
    achievedPct = 100;
  }

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <div className="bg-white px-8 py-6 flex items-start justify-between border-b border-slate-100">
          <div>
            <CategoryDisplay cat={category} size="lg" />
            <p className="text-sm mt-2 text-slate-500 font-medium">
              Contributing quotations & source breakdown
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors p-2 rounded-full flex items-center justify-center mt-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* KPI SUMMARY */}
        <div className="px-8 pt-6 pb-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Effective Goal</p>
              <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(category.effectiveGoal)}</p>
              {category.baseGoal !== category.effectiveGoal && (
                <p className="text-xs font-medium text-slate-400 mt-1.5">
                  Base: {formatCurrency(category.baseGoal)}
                </p>
              )}
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Achievement</p>
              <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(category.achievement)}</p>
              <p className="text-xs font-medium text-slate-400 mt-1.5">
                {category.contributionCount} contribution{category.contributionCount !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</p>
              <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-md ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
              <p className={`text-sm mt-2 font-bold ${category.variance >= 0 ? "text-[#059669]" : "text-[#e11d48]"}`}>
                {category.variance >= 0 ? "+" : ""}{formatCurrency(category.variance)}
              </p>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="mt-5 bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${achievedPct}%`,
                backgroundColor: category.badge_text_color || category.icon_color || style.dotHex
              }}
            />
          </div>
        </div>

        {/* ROLLING CARRY NOTIFICATION */}
        {(category.closingShortfall > 0 || category.closingExcess > 0) && (
          <div className="px-8 mt-4">
            <div
              className={`rounded-xl px-5 py-4 border flex items-center justify-between shadow-sm ${
                category.closingShortfall > 0
                  ? "bg-rose-50 border-rose-100/50"
                  : "bg-emerald-50 border-emerald-100/50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                  category.closingShortfall > 0 ? "bg-rose-200 text-rose-700" : "bg-emerald-200 text-emerald-700"
                }`}>
                  {category.closingShortfall > 0 ? "!" : "✓"}
                </div>
                <div>
                  <p className={`text-sm font-extrabold ${category.closingShortfall > 0 ? "text-rose-900" : "text-emerald-900"}`}>
                    {category.closingShortfall > 0 ? "Closing Shortfall" : "Closing Excess Credit"}
                  </p>
                  <p className={`text-xl font-black mt-0.5 ${category.closingShortfall > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {formatCurrencyFull(category.closingShortfall > 0 ? category.closingShortfall : category.closingExcess)}
                  </p>
                  <p className={`text-xs font-semibold mt-1 ${category.closingShortfall > 0 ? "text-rose-600/80" : "text-emerald-600/80"}`}>
                    {category.closingShortfall > 0 ? "Will increase next month's effective goal" : "Will be carried forward to next month"}
                  </p>
                </div>
              </div>
              
              {mode === "MONTH" && (
                <div className="flex-shrink-0 ml-4">
                  <Button
                    variant="primary"
                    onClick={() => setIsMonthModalOpen(true)}
                    className="whitespace-nowrap shadow-sm"
                  >
                    Allocate Carry
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render Modal */}
        {mode === "MONTH" && isMonthModalOpen && (
          <MonthCarryAllocationModal
            isOpen={isMonthModalOpen}
            onClose={() => setIsMonthModalOpen(false)}
            onSave={(result) => {
              setIsMonthModalOpen(false);
              toast.success("Carry allocation saved successfully.");
              if (onRefresh) onRefresh();
            }}
            sourceMonth={Number(period)}
            sourceMonthName={MONTHS_META.find((m) => m.monthNumber === Number(period))?.name || ""}
            financialYear={financialYear}
            categoryId={category.categoryId}
            categoryName={category.categoryName}
          />
        )}

        {/* SOURCE BREAKDOWN */}
        {contribs && contribs.sourceBreakdown && contribs.sourceBreakdown.length > 0 && (
          <div className="px-8 mt-8">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Source Breakdown</h4>
            <div className="flex flex-wrap gap-3">
              {contribs.sourceBreakdown.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl px-4 py-2.5 bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-transform"
                >
                  <span className="text-sm font-bold text-slate-700">{s.sourceName}</span>
                  <span
                    className="text-sm font-black"
                    style={{ color: category.badge_text_color || category.icon_color || style.dotHex }}
                  >
                    {formatCurrency(s.amount)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    {s.count} {s.count === 1 ? 'deal' : 'deals'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTRIBUTING QUOTATIONS */}
        <div className="flex-1 px-8 mt-10 pb-10">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
            Contributing Quotations
            {contribs && (
              <span className="ml-2 font-medium text-slate-400">
                ({contribs.contributionCount} total)
              </span>
            )}
          </h4>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[88px] bg-slate-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : contribs && contribs.items && contribs.items.length > 0 ? (
            <>
              <div className="space-y-3">
                {contribs.items.map((item) => (
                  <div
                    key={item.contributionId}
                    className="group flex items-center justify-between bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-default"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-base font-extrabold text-slate-900">
                          {item.quotationNo}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                            item.quotationStatus === "Won"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : "bg-blue-50 text-blue-700 border border-blue-200/50"
                          }`}
                        >
                          {item.quotationStatus}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-600 truncate">
                        {item.customerName || item.companyName || "Unknown Customer"}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-400">
                        <span>{formatDate(item.wonDate)}</span>
                        {item.sourceName && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{item.sourceName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <div
                          className="text-lg font-black"
                          style={{ color: category.badge_text_color || category.icon_color || style.dotHex }}
                        >
                          {formatCurrency(item.contributionAmount)}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                          {item.financialYear} Q{item.quarterNumber}
                        </div>
                      </div>
                      <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {contribs.pagination && contribs.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-500">
                    Page {contribs.pagination.page} of {contribs.pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={contribs.pagination.page <= 1}
                      onClick={() => fetchContribs(contribs.pagination.page - 1)}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={contribs.pagination.page >= contribs.pagination.totalPages}
                      onClick={() => fetchContribs(contribs.pagination.page + 1)}
                      className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-extrabold text-slate-700">No contributions found</p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Quotations mapped to this category will appear here.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert Strip Component
// ─────────────────────────────────────────────────────────────────────────────

function AlertStrip({ alerts }) {
  const [dismissed, setDismissed] = useState(new Set());
  if (!alerts || alerts.length === 0) return null;

  const visible = alerts.filter((a) => !dismissed.has(a.type));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {visible.map((alert) => (
        <div
          key={alert.type}
          className={`flex items-center justify-between gap-4 rounded-md px-5 py-4 border shadow-2xs ${
            alert.severity === "WARNING"
              ? "bg-[#fffbeb] border-[#fde68a] text-[#92400e]"
              : "bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]"
          }`}
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div
              className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 font-bold ${
                alert.severity === "WARNING"
                  ? "bg-[#fef3c7] text-[#d97706]"
                  : "bg-[#dbeafe] text-[#2563eb]"
              }`}
            >
              {alert.severity === "WARNING" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="text-sm">
              <span className="font-bold">{alert.title}.</span>{" "}
              <span className="font-medium text-[#334155]">{alert.message}</span>
              {alert.action && (
                <a
                  href={alert.action.href}
                  className={`ml-2.5 font-bold underline underline-offset-4 ${
                    alert.severity === "WARNING"
                      ? "text-[#b45309] hover:text-[#78350f]"
                      : "text-[#1d4ed8] hover:text-[#1e3a8a]"
                  }`}
                >
                  {alert.action.label} →
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, alert.type]))}
            className="text-2xl font-bold leading-none opacity-60 hover:opacity-100 transition-opacity p-1"
            aria-label="Dismiss alert"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function StrategyOverviewPage() {
  useAuth();
  const pathname = usePathname();
  const isStrategyOverviewTab = pathname === "/sales/strategy" || pathname === "/sales/strategy/";
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // Selectors State
  const [financialYear, setFinancialYear] = useState(getCurrentFY);
  const [mode, setMode] = useState("MONTH");
  const [period, setPeriod] = useState(4);

  // Data State
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  // Drawer State
  const [drawerCategory, setDrawerCategory] = useState(null);

  // AI Assistant State (UI + local question only for Phase 6)
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiSubmitted, setAiSubmitted] = useState(false);

  // Mode change handler
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "MONTH") setPeriod(4);
    else if (newMode === "QUARTER") {
      const m = getCurrentMonth();
      setPeriod(m >= 4 && m <= 6 ? 1 : m >= 7 && m <= 9 ? 2 : m >= 10 && m <= 12 ? 3 : 4);
    } else {
      setPeriod(null);
    }
  };

  const fetchOverview = useCallback(
    async (fy = financialYear, m = mode, p = period) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ mode: m });
        if (p !== null && p !== undefined) params.set("period", p);
        const res = await fetch(`${API_BASE}/api/strategy/overview/${fy}?${params}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setOverview(data.data);
        } else {
          toast.error(data.message || "Failed to load Strategy Overview");
        }
      } catch (err) {
        console.error("Error loading overview:", err);
        toast.error("Network error while loading Overview");
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, financialYear, mode, period]
  );

  useEffect(() => {
    fetchOverview(financialYear, mode, period);
  }, [financialYear, mode, period]);

  // Derived KPI and status values
  const kpis = overview?.kpis || {};
  const status = overview?.statusSummary || {};
  const alerts = overview?.alerts || [];
  const categories = overview?.categories || [];

  // ─────────────────────────────────────────────────────────────────────────────
  // EXECUTIVE ANALYTICS LOGIC (Memoized)
  // ─────────────────────────────────────────────────────────────────────────────
  const analytics = React.useMemo(() => {
    if (!overview) return null;
    
    const vibrantPalette = [
      '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#0EA5E9', '#14B8A6'
    ];

    // 1. Chart: Goal vs Achievement (Bar)
    const goalVsAchieveData = categories.map((c, i) => {
      let color = getStyleForCategory(c).dotHex;
      if (!color || color === '#94a3b8') color = vibrantPalette[i % vibrantPalette.length];
      return {
        name: c.categoryCode || c.categoryName.substring(0, 3).toUpperCase(),
        fullName: c.categoryName,
        Goal: c.effectiveGoal,
        Achievement: c.achievement,
        fill: color
      };
    });

    // 2. Chart: Category Contribution (Doughnut)
    const pieData = categories.map((c, i) => {
      let color = getStyleForCategory(c).dotHex;
      if (!color || color === '#94a3b8') color = vibrantPalette[i % vibrantPalette.length];
      return {
        name: c.categoryName,
        value: c.achievement,
        fill: color
      };
    }).filter(c => c.value > 0);

    // 3. Chart: Monthly Trend (Line)
    const trendMap = {};
    categories.forEach(c => {
      (c.monthsSequence || []).forEach(m => {
        const monthKey = m.monthNumber;
        if (!trendMap[monthKey]) {
          trendMap[monthKey] = {
            name: MONTHS_META.find(x => x.monthNumber === monthKey)?.shortName || String(monthKey),
            monthNumber: monthKey,
            Goal: 0,
            Achievement: 0
          };
        }
        trendMap[monthKey].Goal += m.effectiveGoal || 0;
        trendMap[monthKey].Achievement += m.achievement || 0;
      });
    });
    const fyOrder = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    const trendData = Object.values(trendMap).sort((a, b) => fyOrder.indexOf(a.monthNumber) - fyOrder.indexOf(b.monthNumber));

    // 4. Rankings
    const sortedByAchieve = [...categories].sort((a, b) => (b.achievementPercentage || 0) - (a.achievementPercentage || 0));
    const topPerformer = sortedByAchieve.length > 0 ? sortedByAchieve[0] : null;
    const lowestPerformer = sortedByAchieve.length > 0 ? sortedByAchieve[sortedByAchieve.length - 1] : null;
    
    const sortedByCarry = [...categories].sort((a, b) => (b.closingExcess || 0) - (a.closingExcess || 0));
    const largestCarry = sortedByCarry[0]?.closingExcess > 0 ? sortedByCarry[0] : null;

    const sortedByShortfall = [...categories].sort((a, b) => (b.closingShortfall || 0) - (a.closingShortfall || 0));
    const largestShortfall = sortedByShortfall[0]?.closingShortfall > 0 ? sortedByShortfall[0] : null;
    
    const highestAchiever = [...categories].sort((a, b) => b.achievement - a.achievement)[0];

    // 5. Smart Insights
    const smartInsights = [];
    if (status.closingExcessTotal > 0) {
      smartInsights.push({ type: 'success', text: `Available carry forward: ${formatCurrency(status.closingExcessTotal)}` });
    }
    categories.forEach(c => {
      if (c.performanceStatus === 'AHEAD') smartInsights.push({ type: 'success', text: `${c.categoryName} exceeded target by ${formatCurrency(c.variance)}` });
      if (c.performanceStatus === 'BEHIND' && c.closingShortfall > 0) smartInsights.push({ type: 'danger', text: `${c.categoryName} requires attention (Shortfall: ${formatCurrency(c.closingShortfall)})` });
      if (c.effectiveGoal > 0 && c.achievement === 0) smartInsights.push({ type: 'warning', text: `${c.categoryName} has no activity this period` });
    });

    // 6. Sentence Summary
    const varianceAbs = Math.abs(kpis.variance || 0);
    const varianceText = kpis.variance >= 0 ? `exceeded the effective goal by ${formatCurrency(varianceAbs)}` : `fell short of the effective goal by ${formatCurrency(varianceAbs)}`;
    const sentence = `This period ${varianceText}. ${status.categoriesAhead || 0} categories are ahead, ${status.categoriesBalanced || 0} are balanced, with ${formatCurrency(status.closingExcessTotal || 0)} available for carry forward.`;

    // 7. Carry Flow
    const carryIn = categories.reduce((sum, c) => sum + (c.incomingExcessCredit || 0) - (c.incomingShortfall || 0), 0);
    const carryOut = (status.closingExcessTotal || 0) - (status.closingShortfallTotal || 0);

    return {
      goalVsAchieveData,
      pieData,
      trendData,
      topPerformer,
      lowestPerformer,
      largestCarry,
      largestShortfall,
      highestAchiever,
      smartInsights: smartInsights.slice(0, 5),
      sentence,
      carryIn,
      carryOut
    };
  }, [overview, kpis, status, categories]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FY FORECAST INTELLIGENCE (Phase 2 Quota-Safe Read-Only Derived Intelligence)
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Deterministic Forecast Calculations:
   * Financial Year: April 1 -> March 31
   * Completed months: April through currently selected month (1 to 12)
   * Remaining months: Selected month + 1 through March (0 if March / FY complete)
   *
   * Formulations:
   * - Goal To Date: sum of effectiveGoal for completed months
   * - Achievement To Date: sum of achievement for completed months
   * - FY Effective Goal: sum of effectiveGoal for April through March (never base goal)
   * - FY Achievement To Date: sum of achievement for completed months
   * - Remaining Goal: max(0, FY Effective Goal - Achievement To Date)
   * - Current Monthly Run Rate: Achievement To Date / completed months
   * - Required Monthly Run Rate: Remaining Goal / remaining months (or 0 if FY complete)
   * - Projected FY Achievement: Achievement To Date + (Current Monthly Run Rate * remaining months)
   * - Projected FY Achievement %: Projected FY Achievement / FY Effective Goal * 100
   * - Projected Shortfall: max(0, FY Effective Goal - Projected FY Achievement)
   * - Projected Excess: max(0, Projected FY Achievement - FY Effective Goal)
   *
   * Forecast Status Thresholds (Display-only):
   * - Projected Achievement >= 100% -> Exceeded
   * - Projected Achievement >= 90%  -> On Track
   * - Projected Achievement >= 75%  -> At Risk
   * - Projected Achievement < 75%   -> Behind
   */
  const forecastData = React.useMemo(() => {
    if (!overview || !categories || categories.length === 0) return null;

    // 1. Determine completed months count based on Indian FY order (April=1 .. March=12)
    const completedMonths = (() => {
      if (mode === "YEAR") return 12;
      if (mode === "QUARTER") {
        const q = Number(period) || 1;
        return Math.min(12, Math.max(1, q * 3));
      }
      const m = Number(period) || 4;
      return m >= 4 ? m - 3 : m + 9;
    })();

    const remainingMonths = Math.max(0, 12 - completedMonths);
    const isFYComplete = remainingMonths === 0;

    // Check if rich multi-month sequence is available across categories
    const hasMultiMonthSequence = categories.some(c => (c.monthsSequence || []).length > 1);

    // 2. Category-level forecast calculations
    const categoryForecasts = categories.map((cat) => {
      const monthsSeq = cat.monthsSequence || [];
      let catGoalToDate = 0;
      let catAchievementToDate = 0;
      let catFYEffectiveGoal = 0;

      if (hasMultiMonthSequence && monthsSeq.length > 1) {
        // Multi-month sequence present (e.g. YEAR or QUARTER view)
        const completedMonthsData = monthsSeq.filter((m) => {
          const fyOrd = m.monthNumber >= 4 ? m.monthNumber - 3 : m.monthNumber + 9;
          return fyOrd <= completedMonths;
        });

        catGoalToDate = completedMonthsData.reduce((s, m) => s + (Number(m.effectiveGoal) || 0), 0);
        catAchievementToDate = completedMonthsData.reduce((s, m) => s + (Number(m.achievement) || 0), 0);

        if (monthsSeq.length === 12) {
          catFYEffectiveGoal = monthsSeq.reduce((s, m) => s + (Number(m.effectiveGoal) || 0), 0);
        } else {
          const avgGoal = monthsSeq.length > 0
            ? monthsSeq.reduce((s, m) => s + (Number(m.effectiveGoal) || 0), 0) / monthsSeq.length
            : (Number(cat.effectiveGoal) || 0);
          catFYEffectiveGoal = avgGoal * 12;
        }
      } else {
        // Single period / month data available in active view
        const monthlyGoal = Number(cat.effectiveGoal) || 0;
        const monthlyAch = Number(cat.achievement) || 0;
        catGoalToDate = monthlyGoal * completedMonths;
        catAchievementToDate = monthlyAch * completedMonths;
        catFYEffectiveGoal = monthlyGoal * 12;
      }

      catGoalToDate = Math.round(catGoalToDate * 100) / 100;
      catAchievementToDate = Math.round(catAchievementToDate * 100) / 100;
      catFYEffectiveGoal = Math.round(catFYEffectiveGoal * 100) / 100;

      const catRemainingGoal = Math.max(0, catFYEffectiveGoal - catAchievementToDate);
      const catCurrentRunRate = completedMonths > 0 ? catAchievementToDate / completedMonths : 0;
      const catRequiredRunRate = remainingMonths > 0 ? catRemainingGoal / remainingMonths : 0;
      const catProjectedFYAchievement = catAchievementToDate + (catCurrentRunRate * remainingMonths);

      let catProjectedPct = 0;
      if (catFYEffectiveGoal > 0) {
        catProjectedPct = (catProjectedFYAchievement / catFYEffectiveGoal) * 100;
      } else if (catFYEffectiveGoal === 0 && catProjectedFYAchievement > 0) {
        catProjectedPct = 100;
      }

      const catProjectedShortfall = Math.max(0, catFYEffectiveGoal - catProjectedFYAchievement);
      const catProjectedExcess = Math.max(0, catProjectedFYAchievement - catFYEffectiveGoal);

      return {
        ...cat,
        goalToDate: catGoalToDate,
        achievementToDate: catAchievementToDate,
        fyEffectiveGoal: catFYEffectiveGoal,
        remainingGoal: catRemainingGoal,
        currentRunRate: catCurrentRunRate,
        requiredRunRate: catRequiredRunRate,
        projectedFYAchievement: catProjectedFYAchievement,
        projectedAchievementPct: catProjectedPct,
        projectedShortfall: catProjectedShortfall,
        projectedExcess: catProjectedExcess,
        status: getForecastStatus(catProjectedPct),
      };
    });

    // 3. Aggregate FY Totals
    const goalToDate = categoryForecasts.reduce((s, c) => s + c.goalToDate, 0);
    const achievementToDate = categoryForecasts.reduce((s, c) => s + c.achievementToDate, 0);
    const fyEffectiveGoal = categoryForecasts.reduce((s, c) => s + c.fyEffectiveGoal, 0);
    const remainingGoal = Math.max(0, fyEffectiveGoal - achievementToDate);
    const currentRunRate = completedMonths > 0 ? achievementToDate / completedMonths : 0;
    const requiredRunRate = remainingMonths > 0 ? remainingGoal / remainingMonths : 0;
    const projectedFYAchievement = achievementToDate + (currentRunRate * remainingMonths);

    let projectedAchievementPct = 0;
    if (fyEffectiveGoal > 0) {
      projectedAchievementPct = (projectedFYAchievement / fyEffectiveGoal) * 100;
    } else if (fyEffectiveGoal === 0 && projectedFYAchievement > 0) {
      projectedAchievementPct = 100;
    }

    const projectedShortfall = Math.max(0, fyEffectiveGoal - projectedFYAchievement);
    const projectedExcess = Math.max(0, projectedFYAchievement - fyEffectiveGoal);

    // 4. Deterministic Forecast Status for Total
    const forecastStatus = getForecastStatus(projectedAchievementPct);

    // 5. Top 3 Highest-Risk Categories for "Forecast Risk" list
    const highestRiskCategories = [...categoryForecasts]
      .sort((a, b) => {
        if (a.projectedAchievementPct !== b.projectedAchievementPct) {
          return a.projectedAchievementPct - b.projectedAchievementPct;
        }
        return b.projectedShortfall - a.projectedShortfall;
      })
      .slice(0, 3);

    return {
      completedMonths,
      remainingMonths,
      isFYComplete,
      goalToDate,
      achievementToDate,
      fyEffectiveGoal,
      remainingGoal,
      currentRunRate,
      requiredRunRate,
      projectedFYAchievement,
      projectedAchievementPct,
      projectedShortfall,
      projectedExcess,
      status: forecastStatus,
      categoryForecasts,
      highestRiskCategories,
    };
  }, [overview, categories, mode, period]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SOURCE PERFORMANCE MANAGEMENT INSIGHTS (Phase 3 Read-Only)
  // ─────────────────────────────────────────────────────────────────────────────
  const sourceInsights = React.useMemo(() => {
    if (!categories || categories.length === 0) return null;

    // 1. Best Performing Source: Highest achievementPercentage
    const sortedByAchieve = [...categories].sort(
      (a, b) => (Number(b.achievementPercentage) || 0) - (Number(a.achievementPercentage) || 0)
    );
    const bestPerforming = sortedByAchieve[0] || null;

    // 2. Highest Risk Source: Lowest achievementPercentage among sources with effectiveGoal > 0
    const sourcesWithGoal = categories.filter((c) => (Number(c.effectiveGoal) || 0) > 0);
    const sortedByRisk = [...sourcesWithGoal].sort(
      (a, b) => (Number(a.achievementPercentage) || 0) - (Number(b.achievementPercentage) || 0)
    );
    const highestRisk = sortedByRisk[0] || null;

    // 3. Largest Revenue Gap: Source with the lowest variance (most negative variance)
    const sortedByVariance = [...categories].sort(
      (a, b) => (Number(a.variance) || 0) - (Number(b.variance) || 0)
    );
    const largestGap = sortedByVariance[0] || null;

    return {
      bestPerforming,
      highestRisk,
      largestGap,
    };
  }, [categories]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SOURCE MOMENTUM INTELLIGENCE (Phase 4 Quota-Safe Read-Only Derived Metrics)
  // ─────────────────────────────────────────────────────────────────────────────
  const momentumData = React.useMemo(() => {
    if (!overview || !categories || categories.length === 0) return null;

    // 1. Determine completed months count based on Indian FY order (April=1 .. March=12)
    const completedMonthsCount = (() => {
      if (mode === "YEAR") return 12;
      if (mode === "QUARTER") {
        const q = Number(period) || 1;
        return Math.min(12, Math.max(1, q * 3));
      }
      const m = Number(period) || 4;
      return m >= 4 ? m - 3 : m + 9;
    })();

    const fyOrder = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

    // 2. Compute momentum metrics for each category/source
    const sourcesMomentum = categories.map((cat) => {
      const monthsSeq = cat.monthsSequence || [];

      // Sort sequence by Indian FY order
      const sortedSeq = [...monthsSeq].sort(
        (a, b) => fyOrder.indexOf(a.monthNumber) - fyOrder.indexOf(b.monthNumber)
      );

      // Only use completed/available months with actual strategy data
      let completedMonths = sortedSeq.filter((m) => {
        const ord = m.monthNumber >= 4 ? m.monthNumber - 3 : m.monthNumber + 9;
        return ord <= completedMonthsCount;
      });

      if (completedMonths.length === 0) {
        completedMonths = [cat];
      }

      // Latest completed month
      const latestMonth = completedMonths[completedMonths.length - 1] || cat;
      const latestAchievement = Number(latestMonth.achievement) || 0;
      const latestEffectiveGoal = Number(latestMonth.effectiveGoal) || 0;
      const latestAchievementPct =
        latestEffectiveGoal > 0
          ? (latestAchievement / latestEffectiveGoal) * 100
          : latestAchievement > 0
          ? 100
          : 0;

      // 1. Average Monthly Achievement
      const avgMonthlyAchievement =
        completedMonths.length > 0
          ? completedMonths.reduce((s, m) => s + (Number(m.achievement) || 0), 0) /
            completedMonths.length
          : 0;

      // 2 & 3. Best Month & Weakest Month
      let bestMonthName = latestMonth.monthShortName || latestMonth.monthName || "Current";
      let weakestMonthName = latestMonth.monthShortName || latestMonth.monthName || "Current";

      if (completedMonths.length > 1) {
        const sortedByAch = [...completedMonths].sort(
          (a, b) => (Number(b.achievement) || 0) - (Number(a.achievement) || 0)
        );
        const bestM = sortedByAch[0];
        const weakM = sortedByAch[sortedByAch.length - 1];
        bestMonthName = bestM.monthShortName || bestM.monthName || String(bestM.monthNumber);
        weakestMonthName = weakM.monthShortName || weakM.monthName || String(weakM.monthNumber);
      }

      // 4. Momentum Calculation
      let momentumPct = 0;
      let earlierAverage = 0;
      if (completedMonths.length > 1) {
        const earlierMonths = completedMonths.slice(0, completedMonths.length - 1);
        earlierAverage =
          earlierMonths.reduce((s, m) => s + (Number(m.achievement) || 0), 0) /
          earlierMonths.length;

        if (earlierAverage > 0) {
          momentumPct = ((latestAchievement - earlierAverage) / earlierAverage) * 100;
        } else if (latestAchievement > 0) {
          momentumPct = 100;
        }
      }

      const momentumStatus =
        completedMonths.length <= 1
          ? {
              label: "Stable",
              icon: "→",
              badgeCls: "bg-slate-100 text-slate-700 border-slate-200 font-bold",
              textCls: "text-slate-700",
            }
          : getMomentumStatus(momentumPct);

      // 5. Carry Exposure (Latest completed month's effectiveCarryForward)
      const carryExposure = Number(latestMonth?.effectiveCarryForward) || 0;

      // 6. FY Projected Achievement % (Reusing same formula as FY Forecast)
      const achievementToDate = completedMonths.reduce(
        (s, m) => s + (Number(m.achievement) || 0),
        0
      );
      const remainingMonths = Math.max(0, 12 - completedMonths.length);
      const currentRunRate =
        completedMonths.length > 0 ? achievementToDate / completedMonths.length : 0;
      const projectedFYAchievement =
        achievementToDate + currentRunRate * remainingMonths;

      let fyEffectiveGoal = 0;
      if (monthsSeq.length === 12) {
        fyEffectiveGoal = monthsSeq.reduce((s, m) => s + (Number(m.effectiveGoal) || 0), 0);
      } else {
        const avgGoal =
          monthsSeq.length > 0
            ? monthsSeq.reduce((s, m) => s + (Number(m.effectiveGoal) || 0), 0) /
              monthsSeq.length
            : Number(cat.effectiveGoal) || 0;
        fyEffectiveGoal = avgGoal * 12;
      }

      let projectedFYPct = 0;
      if (fyEffectiveGoal > 0) {
        projectedFYPct = (projectedFYAchievement / fyEffectiveGoal) * 100;
      } else if (fyEffectiveGoal === 0 && projectedFYAchievement > 0) {
        projectedFYPct = 100;
      }

      // Sparkline monthly achievements
      const maxAch = Math.max(
        ...completedMonths.map((m) => Number(m.achievement) || 0),
        1
      );
      const sparklineData = completedMonths.map((m, idx) => ({
        monthName: m.monthShortName || m.monthName || String(m.monthNumber),
        achievement: Number(m.achievement) || 0,
        pctOfMax: Math.max(15, Math.min(100, ((Number(m.achievement) || 0) / maxAch) * 100)),
        isLatest: idx === completedMonths.length - 1,
      }));

      return {
        ...cat,
        completedMonthsCount: completedMonths.length,
        avgMonthlyAchievement,
        bestMonthName,
        weakestMonthName,
        latestAchievement,
        latestAchievementPct,
        momentumPct,
        momentumStatus,
        carryExposure,
        projectedFYPct,
        sparklineData,
      };
    });

    // 3. Management Summary (3 tiny summary signals at top)
    // Signal 1: Strongest Momentum (highest positive momentumPct)
    const sortedByMomentumDesc = [...sourcesMomentum].sort(
      (a, b) => b.momentumPct - a.momentumPct
    );
    const strongestMomentum = sortedByMomentumDesc[0] || null;

    // Signal 2: Weakest Momentum (lowest momentumPct)
    const sortedByMomentumAsc = [...sourcesMomentum].sort(
      (a, b) => a.momentumPct - b.momentumPct
    );
    const weakestMomentum = sortedByMomentumAsc[0] || null;

    // Signal 3: Highest Carry Exposure (largest latest effectiveCarryForward)
    const sortedByCarry = [...sourcesMomentum].sort(
      (a, b) => b.carryExposure - a.carryExposure
    );
    const highestCarryExposure =
      sortedByCarry[0]?.carryExposure > 0 ? sortedByCarry[0] : (sortedByCarry[0] || null);

    return {
      sourcesMomentum,
      strongestMomentum,
      weakestMomentum,
      highestCarryExposure,
    };
  }, [overview, categories, mode, period]);

  // ─────────────────────────────────────────────────────────────────────────────
  // EXECUTIVE DECISION CENTER (Phase 5 Quota-Safe Read-Only)
  // ─────────────────────────────────────────────────────────────────────────────
  const decisionData = React.useMemo(() => {
    if (!overview || !categories || categories.length === 0 || !momentumData) return null;

    const sourcesMomentum = momentumData.sourcesMomentum || [];

    // Map each source into decision items
    const decisionItems = sourcesMomentum.map((src) => {
      const achPct = Number(src.achievementPercentage) || 0;
      const effGoal = Number(src.effectiveGoal) || 0;
      const carryExp = Number(src.carryExposure) || 0;
      const momPct = Number(src.momentumPct) || 0;
      const momLabel = src.momentumStatus?.label || "Stable";

      let status = "Performing Well";
      let statusBadgeCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
      let baseReason = "Target achieved or exceeded.";
      let baseAction = "Maintain current execution and protect momentum.";

      if (achPct < 75) {
        status = "Needs Attention";
        statusBadgeCls = "bg-rose-50 text-rose-700 border-rose-200";
        baseReason = "Achievement is below 75% of target.";
        baseAction = "Review pipeline and increase conversion focus.";
      } else if (achPct < 90) {
        status = "Watch";
        statusBadgeCls = "bg-amber-50 text-amber-700 border-amber-200";
        baseReason = "Achievement is between 75% and 90% of target.";
        baseAction = "Monitor weekly performance and improve near-term closure.";
      } else if (achPct < 100) {
        status = "Performing Well";
        statusBadgeCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
        baseReason = "Achievement is on track at 90%–100% of target.";
        baseAction = "Maintain pace and close the remaining target gap.";
      }

      // Carry Signal (strictly latestMonth.effectiveCarryForward)
      let carryNote = "";
      let carryAction = "";
      if (carryExp > 0 && achPct < 90) {
        carryNote = " Carry exposure is increasing pressure on upcoming targets.";
        carryAction = "Prioritize carry resolution before adding further target pressure.";
      }

      // Momentum Signal
      let momentumNote = "";
      if (momPct <= -10) {
        momentumNote = ` Critical momentum drop (${momPct.toFixed(1)}%).`;
        if (status === "Performing Well") {
          status = "Watch";
          statusBadgeCls = "bg-amber-50 text-amber-700 border-amber-200";
        }
      } else if (momPct > -10 && momPct <= -3) {
        momentumNote = ` Weakening monthly momentum (${momPct.toFixed(1)}%).`;
        if (status === "Performing Well" && achPct < 100) {
          status = "Watch";
          statusBadgeCls = "bg-amber-50 text-amber-700 border-amber-200";
        }
      } else if (momPct >= 10) {
        momentumNote = ` Strong momentum (+${momPct.toFixed(1)}%).`;
      }

      const fullReason = `${baseReason}${carryNote}${momentumNote}`;
      const fullAction = carryAction || baseAction;

      return {
        ...src,
        decisionStatus: status,
        decisionBadgeCls: statusBadgeCls,
        reason: fullReason.trim(),
        recommendedAction: fullAction,
        isWatchCandidate:
          (achPct >= 75 && achPct < 90) ||
          momLabel === "Weakening" ||
          momLabel === "Critical" ||
          carryExp > 0,
      };
    });

    // Sort Priority Actions: Needs Attention first, then Watch, then Performing Well
    const priorityWeight = { "Needs Attention": 1, "Watch": 2, "Performing Well": 3 };
    const sortedActions = [...decisionItems]
      .sort((a, b) => {
        const wA = priorityWeight[a.decisionStatus] || 4;
        const wB = priorityWeight[b.decisionStatus] || 4;
        if (wA !== wB) return wA - wB;
        return (Number(a.achievementPercentage) || 0) - (Number(b.achievementPercentage) || 0);
      })
      .slice(0, 5);

    // Summary Card 1: NEEDS ATTENTION
    // Highest-risk source: effectiveGoal > 0, lowest achievementPercentage. If tied, higher carryExposure wins.
    const sourcesWithGoal = decisionItems.filter((c) => (Number(c.effectiveGoal) || 0) > 0);
    const sortedForAttention = [...sourcesWithGoal].sort((a, b) => {
      const diff = (Number(a.achievementPercentage) || 0) - (Number(b.achievementPercentage) || 0);
      if (Math.abs(diff) > 0.01) return diff;
      return (Number(b.carryExposure) || 0) - (Number(a.carryExposure) || 0);
    });
    const needsAttentionSource = sortedForAttention[0] || null;

    // Summary Card 2: WATCH
    // Source where: achievementPercentage >= 75 && < 90 OR momentum Weakening/Critical OR carryExposure > 0
    const watchCandidates = decisionItems.filter((c) => c.isWatchCandidate && c !== needsAttentionSource);
    const watchSource = watchCandidates[0] || decisionItems.find((c) => c.isWatchCandidate) || null;

    // Summary Card 3: PERFORMING WELL
    // Highest achievementPercentage among sources where effectiveGoal > 0
    const sortedForPerforming = [...sourcesWithGoal].sort(
      (a, b) => (Number(b.achievementPercentage) || 0) - (Number(a.achievementPercentage) || 0)
    );
    const performingWellSource = sortedForPerforming[0] || null;

    // Overall Management Statement
    const sourcesToEval = sourcesWithGoal.length > 0 ? sourcesWithGoal : decisionItems;
    const allExceeding = sourcesToEval.length > 0 && sourcesToEval.every((c) => (Number(c.achievementPercentage) || 0) >= 100);
    const allOnTrack = sourcesToEval.length > 0 && sourcesToEval.every((c) => (Number(c.achievementPercentage) || 0) >= 90);
    const sourcesBelow75 = sourcesToEval.filter((c) => (Number(c.achievementPercentage) || 0) < 75);

    let overallStatement = "";
    let overallToneCls = "bg-slate-100 text-slate-700 border-slate-200";

    if (allExceeding) {
      overallStatement = "All primary sources are currently exceeding effective targets.";
      overallToneCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (allOnTrack) {
      overallStatement = "Sales performance is broadly on track across all sources.";
      overallToneCls = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (sourcesBelow75.length === 1) {
      overallStatement = "Overall performance is stable, but one source requires attention.";
      overallToneCls = "bg-amber-50 text-amber-700 border-amber-200";
    } else {
      overallStatement = "Sales performance requires attention across multiple sources.";
      overallToneCls = "bg-rose-50 text-rose-700 border-rose-200";
    }

    return {
      decisionItems,
      sortedActions,
      needsAttentionSource,
      watchSource,
      performingWellSource,
      overallStatement,
      overallToneCls,
    };
  }, [overview, categories, momentumData]);

  const periodLabel =
    mode === "MONTH"
      ? MONTHS_META.find((m) => m.monthNumber === Number(period))?.name || ""
      : mode === "QUARTER"
      ? QUARTERS_META.find((q) => q.quarterNumber === Number(period))?.label || ""
      : "Full Year";

  // ─────────────────────────────────────────────────────────────────────────────
  // AI MANAGEMENT ASSISTANT CONTEXT (Phase 6 Read-Only Verified Local Context)
  // ─────────────────────────────────────────────────────────────────────────────
  const aiManagementContext = React.useMemo(() => {
    if (!overview || !categories || categories.length === 0) return null;

    return {
      financialYear,
      selectedPeriod: periodLabel,
      overall: {
        effectiveGoal: Number(kpis.effectiveGoal) || 0,
        achievement: Number(kpis.achievement) || 0,
        achievementPercentage: Number(kpis.achievementPercentage) || 0,
        variance: Number(kpis.variance) || 0,
      },
      forecast: forecastData ? {
        achievementToDate: forecastData.achievementToDate,
        currentMonthlyRunRate: forecastData.currentRunRate,
        requiredMonthlyRunRate: forecastData.requiredRunRate,
        remainingGoal: forecastData.remainingGoal,
        projectedFYAchievement: forecastData.projectedFYAchievement,
        projectedFYAchievementPercentage: forecastData.projectedAchievementPct,
        projectedShortfall: forecastData.projectedShortfall,
        projectedExcess: forecastData.projectedExcess,
      } : null,
      sources: (momentumData?.sourcesMomentum || []).map((src) => ({
        categoryName: src.categoryName,
        categoryCode: src.categoryCode,
        effectiveGoal: Number(src.effectiveGoal) || 0,
        achievement: Number(src.achievement) || 0,
        achievementPercentage: Number(src.achievementPercentage) || 0,
        variance: Number(src.variance) || 0,
        performanceStatus: src.performanceStatus,
        latestMonthAchievement: Number(src.latestAchievement) || 0,
        momentumPercentage: Number(src.momentumPct) || 0,
        momentumStatus: src.momentumStatus?.label || "Stable",
        effectiveCarryForward: Number(src.carryExposure) || 0,
      })),
      executive: decisionData ? {
        needsAttention: decisionData.needsAttentionSource?.categoryName || null,
        watch: decisionData.watchSource?.categoryName || null,
        performingWell: decisionData.performingWellSource?.categoryName || null,
        priorityActions: decisionData.sortedActions.map((a) => ({
          source: a.categoryName,
          status: a.decisionStatus,
          reason: a.reason,
          action: a.recommendedAction,
        })),
      } : null,
    };
  }, [financialYear, periodLabel, kpis, forecastData, momentumData, decisionData, overview, categories]);

  // Controls Slot rendered inside the Strategy Overview Tab immediately below Navigation Tabs
  const navRightControls = (
    <div className="flex flex-wrap items-end gap-3 sm:gap-3.5">
      {/* Financial Year Dropdown */}
      <div className="w-full sm:w-[140px] shrink-0">
        <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
          Financial Year
        </label>
        <Select
          value={financialYear}
          onChange={setFinancialYear}
          options={AVAILABLE_YEARS.map(y => ({ value: y, label: y }))}
          className="w-full h-[40px] shadow-2xs"
        />
      </div>

      {/* View Mode Toggle Pill Container */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          View Mode
        </label>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
          {["MONTH", "QUARTER", "YEAR"].map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                mode === m
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              {m === "MONTH" ? "Monthly" : m === "QUARTER" ? "Quarterly" : "Annual"}
            </button>
          ))}
        </div>
      </div>

      {/* Month/Quarter Period Dropdown */}
      {mode === "MONTH" && (
        <div className="w-full sm:w-[140px] shrink-0">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Month
          </label>
          <Select
            value={period}
            onChange={(val) => setPeriod(Number(val))}
            options={MONTHS_META.map(m => ({ value: String(m.monthNumber), label: m.name }))}
            className="w-full h-[38px] shadow-2xs"
          />
        </div>
      )}
      {mode === "QUARTER" && (
        <div className="w-full sm:w-[140px] shrink-0">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Quarter
          </label>
          <Select
            value={period}
            onChange={(val) => setPeriod(Number(val))}
            options={QUARTERS_META.map(q => ({ value: String(q.quarterNumber), label: q.label }))}
            className="w-full h-[38px] shadow-2xs"
          />
        </div>
      )}

      {/* Refresh Button */}
      <div className="self-end w-full sm:w-auto mt-2 sm:mt-0">
        <button
          onClick={() => fetchOverview(financialYear, mode, period)}
          disabled={loading}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 h-[38px] rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <svg
            className={`w-4 h-4 shrink-0 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );

  return (
    <CheckPermission
      allowedRoles={[
        "Admin",
        "Super Admin",
        "Sales",
        "Estimation",
        "Leads Management",
        "Proforma invoices",
      ]}
    >
      <div className="min-h-screen bg-[#f8fafc]">
        <Header />
        <StrategyNav />

        {isStrategyOverviewTab && (
          <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4 sm:pt-6">

            {/* ══════════════════════════════════════════════════════════════
                SECTION 1: HEADER / COMMAND BAR
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Sales Strategy Command Center
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {financialYear} &bull; {periodLabel} &bull; Progressive Disclosure (Overview &rarr; Category &rarr; Quotation)
                  </p>
                </div>
              </div>

              {/* Controls Slot */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full sm:w-[140px] shrink-0">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Financial Year</label>
                  <Select value={financialYear} onChange={setFinancialYear} options={AVAILABLE_YEARS.map(y => ({ value: y, label: y }))} className="w-full h-[38px] shadow-2xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">View Mode</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1">
                    {["MONTH", "QUARTER", "YEAR"].map((m) => (
                      <button key={m} onClick={() => handleModeChange(m)}
                        className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all ${mode === m ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"}`}>
                        {m === "MONTH" ? "Monthly" : m === "QUARTER" ? "Quarterly" : "Annual"}
                      </button>
                    ))}
                  </div>
                </div>
                {mode === "MONTH" && (
                  <div className="w-full sm:w-[130px] shrink-0">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Month</label>
                    <Select value={period} onChange={(val) => setPeriod(Number(val))} options={MONTHS_META.map(m => ({ value: String(m.monthNumber), label: m.name }))} className="w-full h-[38px] shadow-2xs" />
                  </div>
                )}
                {mode === "QUARTER" && (
                  <div className="w-full sm:w-[140px] shrink-0">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quarter</label>
                    <Select value={period} onChange={(val) => setPeriod(Number(val))} options={QUARTERS_META.map(q => ({ value: String(q.quarterNumber), label: q.label }))} className="w-full h-[38px] shadow-2xs" />
                  </div>
                )}
                <div className="self-end">
                  <button onClick={() => fetchOverview(financialYear, mode, period)} disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 h-[38px] rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer">
                    <svg className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 2: SMART ATTENTION BAR (Single Intelligent Alert Strip)
            ══════════════════════════════════════════════════════════════ */}
            {!loading && (
              <div className="mb-5">
                {status.categoriesBehind > 0 || status.closingShortfallTotal > 0 || status.unmappedClosedQuotationCount > 0 ? (
                  <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        !
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider">Attention Required</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-rose-700 mt-0.5">
                          {status.categoriesBehind > 0 && (
                            <span>&bull; {status.categoriesBehind} category{status.categoriesBehind > 1 ? "ies" : ""} behind target</span>
                          )}
                          {status.closingShortfallTotal > 0 && (
                            <span>&bull; {formatCurrency(status.closingShortfallTotal)} total shortfall requires attention</span>
                          )}
                          {status.unmappedClosedQuotationCount > 0 && (
                            <a href="/sales/strategy/source-mapping" className="underline hover:text-rose-900 transition-colors">
                              &bull; {status.unmappedClosedQuotationCount} unmapped quotation{status.unmappedClosedQuotationCount > 1 ? "s" : ""} require source review
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    {status.unmappedClosedQuotationCount > 0 && (
                      <a href="/sales/strategy/source-mapping" className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-2xs whitespace-nowrap">
                        Review Unmapped
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Strategy Performance On Track</h4>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                        All categories for {periodLabel} are meeting or exceeding effective target goals.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECTION 3: EXECUTIVE PERFORMANCE SUMMARY
            ══════════════════════════════════════════════════════════════ */}
            {!loading && analytics && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs mb-5 relative overflow-hidden"
                style={{ backgroundImage: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 50%, #EEF4FF 100%)" }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100 shadow-2xs mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block mb-1">
                        Executive Performance Summary &bull; {periodLabel.toUpperCase()}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {formatCurrency(kpis.achievement)} achieved against {formatCurrency(kpis.effectiveGoal)} effective goal
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed mt-1">
                        {analytics.sentence}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Achievement Rate</span>
                      <span className={`text-xl font-black tabular-nums ${
                        kpis.achievementPercentage >= 100 ? "text-emerald-700" :
                        kpis.achievementPercentage >= 90  ? "text-indigo-700"  :
                        kpis.achievementPercentage >= 75  ? "text-amber-700"   : "text-rose-700"
                      }`}>
                        {Number(kpis.achievementPercentage || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Goal</span>
                      <span className="text-xl font-black text-slate-800 tabular-nums">
                        {formatCurrency(Math.max(0, (kpis.effectiveGoal || 0) - (kpis.achievement || 0)))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECTION 4: CORE KPI STRIP (5 Semantic KPI Cards)
            ══════════════════════════════════════════════════════════════ */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                {/* 1. Base Goal */}
                <MetricCard
                  title="Base Goal" value={formatCurrency(kpis.baseGoal)} subtitle="Original target"
                  cardBg="bg-white" iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  iconColors={{ bg: "text-slate-100", boxBg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" }}
                />

                {/* 2. Effective Goal */}
                <MetricCard
                  title="Effective Goal" value={formatCurrency(kpis.effectiveGoal)} subtitle="Adjusted for carry"
                  cardBg="bg-white" iconPath="M13 10V3L4 14h7v7l9-11h-7z"
                  iconColors={{ bg: "text-indigo-50", boxBg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" }}
                  trend={formatCurrency(Math.abs(kpis.effectiveGoal - kpis.baseGoal))}
                  trendDirection={kpis.effectiveGoal > kpis.baseGoal ? "up" : "down"}
                />

                {/* 3. Achievement */}
                <MetricCard
                  title="Achievement" value={formatCurrency(kpis.achievement)} subtitle="Total revenue booked"
                  cardBg="bg-white" iconPath="M5 13l4 4L19 7"
                  iconColors={{ bg: "text-emerald-50", boxBg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" }}
                  badgeText={`${Number(kpis.achievementPercentage || 0).toFixed(1)}%`}
                  trendDirection={kpis.achievementPercentage >= 100 ? "up" : "blue"}
                />

                {/* 4. Variance */}
                <MetricCard
                  title="Variance" value={formatCurrency(Math.abs(kpis.variance || 0))}
                  subtitle={kpis.variance >= 0 ? "Exceeding target" : "Short of target"}
                  cardBg="bg-white" iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  iconColors={{ bg: kpis.variance >= 0 ? "text-emerald-50" : "text-rose-50", boxBg: kpis.variance >= 0 ? "bg-emerald-50" : "bg-rose-50", text: kpis.variance >= 0 ? "text-emerald-700" : "text-rose-700", border: kpis.variance >= 0 ? "border-emerald-200" : "border-rose-200" }}
                  trendDirection={kpis.variance >= 0 ? "up" : "down"}
                  badgeText={kpis.variance >= 0 ? "Surplus" : "Shortfall"}
                />

                {/* 5. Semantic Carry Position */}
                <MetricCard
                  title="Carry Position"
                  value={
                    status.closingShortfallTotal > 0
                      ? `${formatCurrency(status.closingShortfallTotal)} Shortfall`
                      : status.closingExcessTotal > 0
                      ? `${formatCurrency(status.closingExcessTotal)} Excess Credit`
                      : "Balanced"
                  }
                  subtitle={
                    status.closingShortfallTotal > 0
                      ? "Net carry shortfall"
                      : status.closingExcessTotal > 0
                      ? "Net excess carried forward"
                      : "Zero net carry balance"
                  }
                  cardBg="bg-white" iconPath="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  iconColors={{
                    bg: status.closingShortfallTotal > 0 ? "text-rose-50" : status.closingExcessTotal > 0 ? "text-emerald-50" : "text-slate-50",
                    boxBg: status.closingShortfallTotal > 0 ? "bg-rose-50" : status.closingExcessTotal > 0 ? "bg-emerald-50" : "bg-slate-50",
                    text: status.closingShortfallTotal > 0 ? "text-rose-700" : status.closingExcessTotal > 0 ? "text-emerald-700" : "text-slate-600",
                    border: status.closingShortfallTotal > 0 ? "border-rose-200" : status.closingExcessTotal > 0 ? "border-emerald-200" : "border-slate-200"
                  }}
                  badgeText={status.closingShortfallTotal > 0 ? "Shortfall" : status.closingExcessTotal > 0 ? "Credit" : "Balanced"}
                  trendDirection={status.closingExcessTotal > 0 ? "up" : status.closingShortfallTotal > 0 ? "down" : "blue"}
                />
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECTION 5: STRATEGY CATEGORY PERFORMANCE TABLE (Main Content)
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Strategy Category Performance</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Primary single source of truth &bull; Click any category row to inspect details & quotations</p>
                </div>
                <span className="text-xs font-bold text-slate-400 hidden sm:block">{periodLabel}</span>
              </div>

              {loading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-2xl">
                    📭
                  </div>
                  <p className="text-sm font-bold text-slate-700">No category performance data</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200">
                        <th className="py-3 px-5 text-xs font-bold text-slate-600 uppercase tracking-wider">Category</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Goal</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Achievement</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right min-w-[140px]">Achievement %</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Variance</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Status</th>
                        <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((cat) => {
                        const sb = getStatusBadge(cat.performanceStatus);
                        const progressWidth = Math.min(100, Math.max(0, cat.achievementPercentage || 0));
                        const healthBarColor = (() => {
                          const p = Number(cat.achievementPercentage) || 0;
                          if (p >= 100) return "bg-emerald-500";
                          if (p >= 90)  return "bg-indigo-600";
                          if (p >= 75)  return "bg-amber-500";
                          return "bg-rose-500";
                        })();
                        return (
                          <tr key={cat.categoryId} onClick={() => setDrawerCategory(cat)}
                            className="hover:bg-indigo-50/40 transition-colors cursor-pointer group">
                            <td className="py-3.5 px-5">
                              <CategoryDisplay cat={cat} size="sm" />
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums text-sm">
                              {formatCurrency(cat.effectiveGoal)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums text-sm">
                              {formatCurrency(cat.achievement)}
                            </td>
                            <td className="py-3.5 px-4 text-right tabular-nums">
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="font-black text-slate-900 text-sm">
                                  {Number(cat.achievementPercentage || 0).toFixed(1)}%
                                </span>
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-500 ${healthBarColor}`} style={{ width: `${progressWidth}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className={`py-3.5 px-4 text-right font-bold tabular-nums text-sm ${cat.variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {cat.variance >= 0 ? "+" : ""}{formatCurrency(cat.variance)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${sb.cls}`}>
                                {sb.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                                Details
                                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Totals Footer */}
                    <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-black text-sm text-slate-900">
                      <tr>
                        <td className="px-5 py-3.5 text-slate-900">Total</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{formatCurrency(kpis.effectiveGoal)}</td>
                        <td className="px-4 py-3.5 text-right text-indigo-600 tabular-nums">{formatCurrency(kpis.achievement)}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums">{Number(kpis.achievementPercentage || 0).toFixed(1)}%</td>
                        <td className={`px-4 py-3.5 text-right tabular-nums ${kpis.variance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {kpis.variance >= 0 ? "+" : ""}{formatCurrency(kpis.variance)}
                        </td>
                        <td className="px-4 py-3.5" />
                        <td className="px-4 py-3.5" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 7: PERFORMANCE TREND CHART
            ══════════════════════════════════════════════════════════════ */}
            {!loading && analytics && (
              <div className="mb-5">
                <ChartCard title="Performance Trend" subtitle={`Goal vs Achievement trajectory for ${periodLabel}`} height={280}>
                  {analytics.trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.trendData} margin={{ top: 16, right: 20, left: 10, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569", fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }} tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : val} />
                        <RechartsTooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0" }} formatter={(value) => formatCurrency(value)} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: 700, color: "#1E293B" }} />
                        <Line type="monotone" dataKey="Goal" stroke="#94A3B8" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="Achievement" stroke="#4F46E5" strokeWidth={3} dot={{ strokeWidth: 2, r: 4, fill: "#FFFFFF" }} activeDot={{ r: 7, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium text-xs">
                      No multi-period trend trajectory data for this selection
                    </div>
                  )}
                </ChartCard>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SECTION 8: PERFORMANCE DRIVERS & SECTION 9: ACTION CENTER
            ══════════════════════════════════════════════════════════════ */}
            {!loading && categories.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

                {/* ── SECTION 8: PERFORMANCE DRIVERS ── */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Performance Drivers</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Category insights influencing current results</p>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                      Data Derived
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Top Performer */}
                    {analytics.topPerformer && (
                      <div
                        onClick={() => setDrawerCategory(analytics.topPerformer)}
                        className="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-100 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Top Performer</span>
                          <span className="text-sm font-black text-slate-900 mt-0.5 block">{analytics.topPerformer.categoryName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-700 tabular-nums block">
                            {Number(analytics.topPerformer.achievementPercentage || 0).toFixed(0)}% Target
                          </span>
                          <span className="text-xs font-bold text-slate-600 tabular-nums">
                            {formatCurrency(analytics.topPerformer.achievement)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Biggest Shortfall */}
                    {analytics.lowestPerformer && analytics.lowestPerformer.categoryId !== analytics.topPerformer?.categoryId && (
                      <div
                        onClick={() => setDrawerCategory(analytics.lowestPerformer)}
                        className="bg-rose-50/40 rounded-xl p-3.5 border border-rose-100 hover:border-rose-200 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">Biggest Shortfall</span>
                          <span className="text-sm font-black text-slate-900 mt-0.5 block">{analytics.lowestPerformer.categoryName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-rose-700 tabular-nums block">
                            {formatCurrency(Math.abs(analytics.lowestPerformer.variance || 0))} Gap
                          </span>
                          <span className="text-xs font-bold text-slate-600 tabular-nums">
                            {Number(analytics.lowestPerformer.achievementPercentage || 0).toFixed(0)}% Achieved
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Strongest Revenue Contributor */}
                    {analytics.highestAchiever && (
                      <div
                        onClick={() => setDrawerCategory(analytics.highestAchiever)}
                        className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">Strongest Revenue Contributor</span>
                          <span className="text-sm font-black text-slate-900 mt-0.5 block">{analytics.highestAchiever.categoryName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-blue-700 tabular-nums block">
                            {formatCurrency(analytics.highestAchiever.achievement)}
                          </span>
                          <span className="text-xs font-bold text-slate-600 tabular-nums">
                            Revenue Booked
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── SECTION 9: ACTION CENTER ── */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Action Center</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Prioritized category review triggers</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                      Action Required
                    </span>
                  </div>

                  <div className="space-y-3">
                    {categories.filter(c => c.variance < 0 || c.performanceStatus === "BEHIND").length > 0 ? (
                      categories.filter(c => c.variance < 0 || c.performanceStatus === "BEHIND").slice(0, 3).map((cat) => (
                        <div
                          key={cat.categoryId}
                          onClick={() => setDrawerCategory(cat)}
                          className="bg-rose-50/50 rounded-xl p-3.5 border border-rose-100 hover:border-rose-200 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-rose-600 font-bold text-sm">⚠</span>
                            <div className="min-w-0">
                              <span className="text-xs font-extrabold text-slate-900 truncate block">{cat.categoryName}</span>
                              <span className="text-[11px] font-medium text-rose-700 block">
                                {formatCurrency(Math.abs(cat.variance || 0))} behind effective goal target
                              </span>
                            </div>
                          </div>
                          <span className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors flex-shrink-0">
                            Review Category
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                        <span className="text-emerald-600 font-bold text-lg block mb-1">✓</span>
                        <p className="text-xs font-bold text-slate-700">No urgent category actions required</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">All strategy categories are meeting target run-rates.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </main>
        )}

        {/* ── LEVEL 2: Category Detail Drawer ── */}
        {isStrategyOverviewTab && drawerCategory && (
          <CategoryDetailDrawer
            category={drawerCategory}
            financialYear={financialYear}
            mode={mode}
            period={period}
            apiBase={API_BASE}
            onClose={() => setDrawerCategory(null)}
            onRefresh={() => fetchOverview(financialYear, mode, period)}
          />
        )}
      </div>
    </CheckPermission>
  );
}
