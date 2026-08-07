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

// ─────────────────────────────────────────────────────────────────────────────
// Drill-Down Drawer Component
// ─────────────────────────────────────────────────────────────────────────────

function CategoryDrawer({ category, financialYear, mode, period, apiBase, onClose }) {
  const [contribs, setContribs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
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
              className={`rounded-xl px-5 py-4 border flex items-start gap-3.5 shadow-sm ${
                category.closingShortfall > 0
                  ? "bg-rose-50 border-rose-100/50"
                  : "bg-emerald-50 border-emerald-100/50"
              }`}
            >
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
          </div>
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
                    <Button
                      variant="secondary"
                      disabled={contribs.pagination.page <= 1}
                      onClick={() => fetchContribs(contribs.pagination.page - 1)}
                      className="px-4 h-[38px] text-sm"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={contribs.pagination.page >= contribs.pagination.totalPages}
                      onClick={() => fetchContribs(contribs.pagination.page + 1)}
                      className="px-4 h-[38px] text-sm"
                    >
                      Next
                    </Button>
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
  const [period, setPeriod] = useState(() => getCurrentMonth());

  // Data State
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  // Drawer State
  const [drawerCategory, setDrawerCategory] = useState(null);

  // Mode change handler
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "MONTH") setPeriod(getCurrentMonth());
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

  const periodLabel =
    mode === "MONTH"
      ? MONTHS_META.find((m) => m.monthNumber === Number(period))?.name || ""
      : mode === "QUARTER"
      ? QUARTERS_META.find((q) => q.quarterNumber === Number(period))?.label || ""
      : "Full Year";

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
        <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
          View Mode
        </label>
        <div className="flex bg-[#f1f5f9] p-1 rounded-md border border-[#e2e8f0] shadow-inner gap-1">
          {["MONTH", "QUARTER", "YEAR"].map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3.5 py-1 text-xs font-bold rounded-md transition-all ${
                mode === m
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "text-[#64748b] hover:text-[#0f172a] hover:bg-white/60"
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
          <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
            Month
          </label>
          <Select
            value={period}
            onChange={(val) => setPeriod(Number(val))}
            options={MONTHS_META.map(m => ({ value: String(m.monthNumber), label: m.name }))}
            className="w-full h-[40px] shadow-2xs"
          />
        </div>
      )}
      {mode === "QUARTER" && (
        <div className="w-full sm:w-[140px] shrink-0">
          <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
            Quarter
          </label>
          <Select
            value={period}
            onChange={(val) => setPeriod(Number(val))}
            options={QUARTERS_META.map(q => ({ value: String(q.quarterNumber), label: q.label }))}
            className="w-full h-[40px] shadow-2xs"
          />
        </div>
      )}

      {/* Refresh Button */}
      <div className="self-end w-full sm:w-auto mt-2 sm:mt-0">
        <button
          onClick={() => fetchOverview(financialYear, mode, period)}
          disabled={loading}
          className="w-full sm:w-auto bg-[linear-gradient(135deg,#5B6BFF_0%,#6B5CFF_45%,#7C3AED_100%)] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(91,107,255,0.39)] hover:shadow-[0_6px_20px_rgba(91,107,255,0.23)] hover:-translate-y-[1px] hover:brightness-110 transition-all active:scale-95 active:brightness-95 disabled:opacity-50 whitespace-nowrap shrink-0"
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
            {/* ── Header Controls (Financial Year, View Mode, Month, Refresh) immediately below Navigation Tabs ── */}
            <div className="bg-white rounded-md p-4 sm:p-5 border border-[#e2e8f0] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md bg-[#eff6ff] text-[#2563eb] flex items-center justify-center font-bold border border-[#bfdbfe] shadow-2xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0f172a] tracking-tight">
                    Strategy Overview Controls
                  </h2>
                  <p className="text-xs text-[#64748b] font-medium mt-0.5">
                    Select financial year, view mode, and period for target tracking
                  </p>
                </div>
              </div>
              {navRightControls}
            </div>

            {/* ── Alert Strip ── */}
            <AlertStrip alerts={alerts} />

            {/* ── Period Banner & Quick Status Pills ── */}
            <div className="bg-gradient-to-r from-white to-[#F8FAFF] rounded-2xl p-4 sm:p-6 border border-[#E5EAF5] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-white text-indigo-600 flex items-center justify-center mr-4 flex-shrink-0 border border-indigo-100 shadow-sm">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#64748b] block mb-0.5">
                    Period
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0f172a] tracking-tight">
                    {financialYear} — {periodLabel}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {status.categoriesAhead > 0 && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-700 font-bold px-5 py-2.5 rounded-xl border border-emerald-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-2 text-[13px] hover:-translate-y-0.5 transition-transform duration-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span>{status.categoriesAhead} Ahead</span>
                  </div>
                )}
                {status.categoriesBehind > 0 && (
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-700 font-bold px-5 py-2.5 rounded-xl border border-rose-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-2 text-[13px] hover:-translate-y-0.5 transition-transform duration-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    <span>{status.categoriesBehind} Behind</span>
                  </div>
                )}
                {status.categoriesOnTrack > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700 font-bold px-5 py-2.5 rounded-xl border border-blue-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-2 text-[13px] hover:-translate-y-0.5 transition-transform duration-200">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <span>{status.categoriesOnTrack} On Track</span>
                  </div>
                )}
                {status.categoriesBalanced > 0 && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-700 font-bold px-5 py-2.5 rounded-xl border border-slate-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-2 text-[13px] hover:-translate-y-0.5 transition-transform duration-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>{status.categoriesBalanced} Balanced</span>
                  </div>
                )}
                {status.unmappedClosedQuotationCount > 0 && (
                  <a
                    href="/sales/strategy/source-mapping"
                    className="bg-gradient-to-br from-amber-50 to-amber-100/50 hover:to-amber-100 text-amber-700 font-bold px-5 py-2.5 rounded-xl border border-amber-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-2 text-[13px] transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{status.unmappedClosedQuotationCount} Unmapped</span>
                  </a>
                )}
              </div>
            </div>

                        {/* ── EXECUTIVE SUMMARY & QUARTER HEALTH ── */}
            {!loading && analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 rounded-2xl p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] border border-[#E5EAF5] text-slate-800 flex flex-col justify-center relative overflow-hidden group hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06)] transition-all duration-300" style={{ backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #F7F9FF 45%, #EEF4FF 100%)' }}>
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none"></div>
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 p-8 opacity-10 text-indigo-900 pointer-events-none transform group-hover:scale-105 transition-transform duration-700">
                    <svg className="w-56 h-56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black tracking-tight mb-2 flex items-center gap-2 text-slate-800">
                      <span className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      Executive Summary
                    </h3>
                    <p className="text-slate-600 font-medium text-lg leading-relaxed mt-4">
                      {analytics.sentence}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-[#E5EAF5] flex flex-col items-center justify-center text-center">
                  <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-5">Goal Completion</h3>
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                      <circle 
                        cx="64" cy="64" r="56" 
                        fill="none" 
                        stroke={kpis.achievementPercentage >= 100 ? "#10b981" : "#3b82f6"} 
                        strokeWidth="12" 
                        strokeDasharray={2 * Math.PI * 56} 
                        strokeDashoffset={2 * Math.PI * 56 * (1 - Math.min(100, kpis.achievementPercentage || 0) / 100)} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-800">{Number(kpis.achievementPercentage || 0).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── KPI Cards Row (Executive Enhanced) ── */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-36 bg-white rounded-md border border-[#e2e8f0] p-5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <MetricCard 
                  title="Base Goal" 
                  value={formatCurrency(kpis.baseGoal)} 
                  subtitle="Original target"
                  cardBg="bg-[linear-gradient(to_bottom_right,#FFFFFF,#F8FBFF)]"
                  iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  iconColors={{ bg: 'text-slate-100', boxBg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }}
                />
                <MetricCard 
                  title="Effective Goal" 
                  value={formatCurrency(kpis.effectiveGoal)} 
                  subtitle="Adjusted for carry"
                  cardBg="bg-[linear-gradient(to_bottom_right,#FFFFFF,#F7F5FF)]"
                  iconPath="M13 10V3L4 14h7v7l9-11h-7z"
                  iconColors={{ bg: 'text-indigo-50', boxBg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' }}
                  trend={formatCurrency(Math.abs(kpis.effectiveGoal - kpis.baseGoal))}
                  trendDirection={kpis.effectiveGoal > kpis.baseGoal ? 'up' : 'down'}
                />
                <MetricCard 
                  title="Achievement" 
                  value={formatCurrency(kpis.achievement)} 
                  subtitle="Total revenue booked"
                  cardBg="bg-[linear-gradient(to_bottom_right,#FFFFFF,#F6FFF9)]"
                  iconPath="M5 13l4 4L19 7"
                  iconColors={{ bg: 'text-emerald-50', boxBg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' }}
                  badgeText={`${Number(kpis.achievementPercentage || 0).toFixed(1)}%`}
                  trendDirection={kpis.achievementPercentage >= 100 ? 'up' : 'blue'}
                />
                <MetricCard 
                  title="Variance" 
                  value={formatCurrency(Math.abs(kpis.variance || 0))} 
                  subtitle={kpis.variance >= 0 ? "Exceeding target" : "Short of target"}
                  cardBg="bg-[linear-gradient(to_bottom_right,#FFFFFF,#F7FAFF)]"
                  iconPath="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  iconColors={{ bg: kpis.variance >= 0 ? 'text-blue-50' : 'text-blue-100', boxBg: kpis.variance >= 0 ? 'bg-blue-100' : 'bg-rose-100', text: kpis.variance >= 0 ? 'text-blue-700' : 'text-rose-700', border: kpis.variance >= 0 ? 'border-blue-200' : 'border-rose-200' }}
                  trendDirection={kpis.variance >= 0 ? 'up' : 'down'}
                  badgeText={kpis.variance >= 0 ? 'Surplus' : 'Shortfall'}
                />
                <MetricCard 
                  title="Closing Carry" 
                  value={formatCurrency(status.closingShortfallTotal > 0 ? status.closingShortfallTotal : status.closingExcessTotal)} 
                  subtitle={status.closingShortfallTotal > 0 ? "Net shortfall" : status.closingExcessTotal > 0 ? "Net excess credit" : "Perfectly balanced"}
                  cardBg="bg-[linear-gradient(to_bottom_right,#FFFFFF,#FCF8FF)]"
                  iconPath="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  iconColors={{ bg: 'text-purple-50', boxBg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }}
                  badgeText={status.closingShortfallTotal > 0 ? 'Debt' : status.closingExcessTotal > 0 ? 'Credit' : 'Balanced'}
                  trendDirection={status.closingExcessTotal > 0 ? 'up' : status.closingShortfallTotal > 0 ? 'down' : 'blue'}
                />
              </div>
            )}

            {/* ── CHARTS ROW ── */}
            {!loading && analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Goal vs Achievement Bar Chart */}
                <ChartCard title="Goal vs Achievement" subtitle="Comparison by category" height={320}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.goalVsAchieveData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={0}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : val} />
                      <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatCurrency(value)} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }} />
                      <Bar dataKey="Goal" fill="#CBD5E1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      <Bar dataKey="Achievement" radius={[6, 6, 0, 0]} maxBarSize={45}>
                        {analytics.goalVsAchieveData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Monthly Trend Line Chart */}
                <ChartCard title="Monthly Trend" subtitle="Achievement trajectory" height={320}>
                  {analytics.trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : val} />
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatCurrency(value)} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }} />
                        <Line type="monotone" dataKey="Goal" stroke="#94A3B8" strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Achievement" stroke="#4F46E5" strokeWidth={4} dot={{ strokeWidth: 2, r: 5, fill: '#FFFFFF' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 font-medium">No trend data available</div>
                  )}
                </ChartCard>
              </div>
            )}

            {/* ── INSIGHTS, PIE & RANKING ROW ── */}
            {!loading && analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Category Contribution Doughnut */}
                <DashboardCard title="Revenue Contribution" subtitle="Breakdown by category">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.pieData} cx="45%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={3} dataKey="value" stroke="none" cornerRadius={4}>
                          {analytics.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0px 4px 6px ${entry.fill}40)` }} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => formatCurrency(value)} />
                        <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </DashboardCard>

                {/* Smart Insights */}
                <DashboardCard title="Smart Insights" subtitle="Automated observations">
                  <div className="space-y-4 pt-2">
                    {analytics.smartInsights.length > 0 ? analytics.smartInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          insight.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                          insight.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {insight.type === 'success' ? '✓' : insight.type === 'danger' ? '!' : 'i'}
                        </div>
                        <p className="text-sm font-semibold text-slate-700 leading-snug">{insight.text}</p>
                      </div>
                    )) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50/50 to-white rounded-xl border border-dashed border-slate-200">
                      <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[13px] font-medium text-slate-500">No specific insights for this period</p>
                    </div>
                    )}
                  </div>
                </DashboardCard>

                {/* Performance Ranking */}
                <DashboardCard title="Category Rankings" subtitle="Best and worst performers">
                  <div className="flex flex-col">
                    {analytics.topPerformer && (
                      <RankingCard rank={1} title="Top Performer" categoryName={analytics.topPerformer.categoryName} value={formatCurrency(analytics.topPerformer.achievement)} subValue={`${Number(analytics.topPerformer.achievementPercentage || 0).toFixed(0)}% Achieved`} iconColorHex={getStyleForCategory(analytics.topPerformer).dotHex} badgeText="MVP" badgeType="success" />
                    )}
                    {analytics.lowestPerformer && analytics.lowestPerformer.categoryId !== analytics.topPerformer?.categoryId && (
                      <RankingCard rank={5} title="Needs Attention" categoryName={analytics.lowestPerformer.categoryName} value={formatCurrency(analytics.lowestPerformer.achievement)} subValue={`${Number(analytics.lowestPerformer.achievementPercentage || 0).toFixed(0)}% Achieved`} iconColorHex={getStyleForCategory(analytics.lowestPerformer).dotHex} badgeType="danger" />
                    )}
                    {analytics.highestAchiever && (
                      <RankingCard rank="★" title="Highest Revenue" categoryName={analytics.highestAchiever.categoryName} value={formatCurrency(analytics.highestAchiever.achievement)} iconColorHex={getStyleForCategory(analytics.highestAchiever).dotHex} />
                    )}
                    {analytics.largestCarry && (
                      <RankingCard rank="+" title="Largest Carry Fwd" categoryName={analytics.largestCarry.categoryName} value={formatCurrency(analytics.largestCarry.closingExcess)} iconColorHex={getStyleForCategory(analytics.largestCarry).dotHex} badgeText="Credit" />
                    )}
                  </div>
                </DashboardCard>
              </div>
            )}

            {/* ── Category Performance Grid (Original clickable cards) ── */}
            <div className="mb-4 flex items-center justify-between mt-8">
              <h3 className="text-lg font-bold text-[#0f172a] tracking-tight">Category Breakdown</h3>
              <span className="text-xs font-medium text-[#64748b]">
                Click any card to view contributing quotations
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-md border border-[#e2e8f0] p-5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                {categories.map((cat) => {
                  const statusBadge = getStatusBadge(cat.performanceStatus);
                  const achievedPct = Math.min(100, Math.max(0, Number(cat.achievementPercentage || 0)));
                  return (
                    <div
                      key={cat.categoryId}
                      onClick={() => setDrawerCategory(cat)}
                      className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">{cat.categoryCode}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.label}</span>
                        </div>
                        <div className="mb-3"><CategoryDisplay cat={cat} size="sm" /></div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${achievedPct}%`, backgroundColor: getStyleForCategory(cat).dotHex }} />
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-t border-slate-100 pt-3.5">
                          <div>
                            <span className="text-slate-500 block font-medium">Effective</span>
                            <span className="font-bold text-slate-800 text-[13px]">{formatCurrency(cat.effectiveGoal)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block font-medium">Achieved</span>
                            <span className={`font-bold text-[13px] ${getStyleForCategory(cat).text}`}>{formatCurrency(cat.achievement)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        {cat.closingShortfall > 0 ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1 truncate">⚠ Shortfall: {formatCurrency(cat.closingShortfall)}</span>
                        ) : cat.closingExcess > 0 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1 truncate">✓ Excess: {formatCurrency(cat.closingExcess)}</span>
                        ) : (
                          <span className="text-slate-400 font-semibold">No carry</span>
                        )}
                        <span className="text-slate-300 group-hover:text-blue-500 font-bold transition-colors">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* ── Executive Footer ── */}
            {!loading && (
              <div className="mt-12 mb-4 p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-6">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Total Achievement</h4>
                  <div className="text-3xl font-black text-blue-600">{formatCurrency(kpis.achievement)}</div>
                </div>
                <div className="flex gap-8 flex-wrap">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Effective Goal</div>
                    <div className="text-lg font-bold text-slate-800">{formatCurrency(kpis.effectiveGoal)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Variance</div>
                    <div className={`text-lg font-bold ${kpis.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {kpis.variance >= 0 ? '+' : ''}{formatCurrency(kpis.variance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Net Carry</div>
                    <div className="text-lg font-bold text-slate-800">
                      {status.closingShortfallTotal > 0 ? `-${formatCurrency(status.closingShortfallTotal)}` : `+${formatCurrency(status.closingExcessTotal)}`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Category Summary Table ── */}
            {!loading && categories.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5EAF5] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="px-6 py-5 border-b border-[#E5EAF5] flex items-center justify-between bg-transparent">
                  <div>
                    <h3 className="text-base font-bold text-[#0f172a] tracking-tight">
                      Category Breakdown & Rolling Balance
                    </h3>
                    <p className="text-xs text-[#64748b] font-medium mt-0.5">
                      Detailed view of target adjustments, achievement variance, and closing carries
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gradient-to-r from-slate-50/50 to-white border-b border-[#E5EAF5]">
                      <tr>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-left">Category</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right">Base Goal</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right">Effective Goal</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right">Achievement</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right">Variance</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right">Achieved %</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right">Closing Carry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80 text-sm font-medium text-slate-700">
                      {categories.map((cat) => {
                        return (
                          <tr
                            key={cat.categoryId}
                            onClick={() => setDrawerCategory(cat)}
                            className="hover:bg-slate-50/70 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                <CategoryDisplay cat={cat} size="sm" />
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-[#0f172a]">
                              {formatCurrency(cat.baseGoal)}
                            </td>
                            <td className="px-5 py-4 text-right font-bold text-[#0f172a]">
                              {formatCurrency(cat.effectiveGoal)}
                            </td>
                            <td className="px-5 py-4 text-right font-bold" style={{ color: getStyleForCategory(cat).dotHex }}>
                              {formatCurrency(cat.achievement)}
                            </td>
                            <td
                              className={`px-5 py-4 text-right font-bold ${
                                cat.variance >= 0 ? "text-[#059669]" : "text-[#e11d48]"
                              }`}
                            >
                              {cat.variance >= 0 ? "+" : ""}
                              {formatCurrency(cat.variance)}
                            </td>
                            <td className="px-5 py-4 text-right font-bold text-[#0f172a]">
                              {Number(cat.achievementPercentage || 0).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 text-right font-bold">
                              {cat.closingShortfall > 0 ? (
                                <span className="text-[#e11d48]">-{formatCurrency(cat.closingShortfall)}</span>
                              ) : cat.closingExcess > 0 ? (
                                <span className="text-[#059669]">+{formatCurrency(cat.closingExcess)}</span>
                              ) : (
                                <span className="text-[#94a3b8] font-medium">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#f8fafc] border-t-2 border-[#e2e8f0] font-bold text-sm text-[#0f172a]">
                      <tr>
                        <td className="px-6 py-4 text-[#0f172a]">Total</td>
                        <td className="px-5 py-4 text-right text-[#0f172a]">
                          {formatCurrency(kpis.baseGoal)}
                        </td>
                        <td className="px-5 py-4 text-right text-[#0f172a]">
                          {formatCurrency(kpis.effectiveGoal)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[#2563eb]">
                          {formatCurrency(kpis.achievement)}
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-bold ${
                            kpis.variance >= 0 ? "text-[#059669]" : "text-[#e11d48]"
                          }`}
                        >
                          {kpis.variance >= 0 ? "+" : ""}
                          {formatCurrency(kpis.variance)}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[#2563eb]">
                          {Number(kpis.achievementPercentage || 0).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {status.closingShortfallTotal > 0 ? (
                            <span className="text-[#e11d48]">
                              -{formatCurrency(status.closingShortfallTotal)}
                            </span>
                          ) : status.closingExcessTotal > 0 ? (
                            <span className="text-[#059669]">
                              +{formatCurrency(status.closingExcessTotal)}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] font-medium">—</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ── Drill-Down Drawer ── */}
        {isStrategyOverviewTab && drawerCategory && (
          <CategoryDrawer
            category={drawerCategory}
            financialYear={financialYear}
            mode={mode}
            period={period}
            apiBase={API_BASE}
            onClose={() => setDrawerCategory(null)}
          />
        )}
      </div>
    </CheckPermission>
  );
}
