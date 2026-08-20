"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { parseExcelDate, parseExcelNumber } from "@/utils/excelUtils";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const NetProfitAPI = `${API_BASE}/api/net-profit`;
const ExpenseMasterAPI = `${API_BASE}/api/general-expense-master`;

function getDefaultRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { from: iso(first), to: iso(last) };
}

const EMPTY_EXPENSE_FORM = {
  expense_master_id: "",
  amount: "",
  expense_date: "",
  notes: "",
};

const DONUT_COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4"];
const BADGE_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-green-100", text: "text-green-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
];

const TREND_COLORS = {
  amount: "#3b82f6",
  architecture_net: "#8b5cf6",
  expense_net: "#ef4444",
  expense: "#f97316",
};

// NEW: animates a numeric value counting up from its previous value whenever it changes
function CountUp({ value, formatter, duration = 700 }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef(null);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const start = performance.now();

    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{formatter(display)}</>;
}

export default function NetProfitPage() {
  const [tab, setTab] = useState("entry"); // "entry" | "analytics"
  const [range, setRange] = useState(getDefaultRange());
  const [isLifetime, setIsLifetime] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [netRevenue, setNetRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [expenseOptions, setExpenseOptions] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    ...EMPTY_EXPENSE_FORM,
    expense_date: getDefaultRange().to,
  });
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const amountInputRef = useRef(null);
  const [formErrors, setFormErrors] = useState({});
  const [newlyAddedId, setNewlyAddedId] = useState(null);

  const [expenseSearch, setExpenseSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("monthly"); // weekly | monthly | quarterly | yearly

  const fmt = (n) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const fmtShort = (n) => {
    n = Number(n || 0);
    if (n >= 100000) return "₹" + (n / 100000).toFixed(1).replace(/\.0$/, "") + "L";
    if (n >= 1000) return "₹" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return "₹" + n;
  };
  const fmtPdf = (n) =>
    "Rs. " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const fmtDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    const day = String(dt.getDate()).padStart(2, "0");
    const mon = String(dt.getMonth() + 1).padStart(2, "0");
    return `${day}-${mon}-${dt.getFullYear()}`;
  };
  const badgeFor = (masterId) => BADGE_COLORS[Number(masterId || 0) % BADGE_COLORS.length];

  // NEW: shows the duration a budget-tracking row is actually being measured against
  const budgetDurationLabel = (b) => {
    if (b.is_recurring) return "This month (auto-renews)";
    if (!b.start_date || !b.end_date) return "Lifetime (no duration set)";
    return `${fmtDate(b.start_date)} → ${fmtDate(b.end_date)}`;
  };

  const fetchExpenseOptions = useCallback(async () => {
    try {
      const res = await fetch(`${ExpenseMasterAPI}/options`);
      if (!res.ok) throw new Error("Failed to load expense types");
      const data = await res.json();
      setExpenseOptions(data.data || []);
    } catch (err) {
      toast.error(err.message || "Could not load expense types");
    }
  }, []);

  const fetchNetProfit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (!isLifetime) {
        params.set("from", range.from);
        params.set("to", range.to);
      }
      const qs = params.toString();
      const res = await fetch(`${NetProfitAPI}${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to load net profit data");
      const data = await res.json();
      setNetRevenue(data.netRevenue || 0);
      setTotalExpense(data.totalExpense || 0);
      setNetProfit(data.netProfit || 0);
      setProjects(data.projects || []);
      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, isLifetime]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams({ period: chartPeriod });
      if (!isLifetime) {
        params.set("from", range.from);
        params.set("to", range.to);
      }
      const res = await fetch(`${NetProfitAPI}/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      toast.error(err.message || "Could not load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [range.from, range.to, chartPeriod, isLifetime]);

  useEffect(() => {
    fetchExpenseOptions();
  }, [fetchExpenseOptions]);

  useEffect(() => {
    fetchNetProfit();
  }, [fetchNetProfit]);

  useEffect(() => {
    if (tab === "analytics") fetchAnalytics();
  }, [tab, fetchAnalytics]);

  useEffect(() => {
    setCurrentPage(1);
  }, [expenseSearch, expenses.length]);

  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setIsLifetime(false);
    setRange((prev) => ({ ...prev, [name]: value }));
  };

  const applyThisMonth = () => {
    setIsLifetime(false);
    setRange(getDefaultRange());
  };

  const applyLifetime = () => setIsLifetime(true);

  const handleExpenseFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  };

  const filteredExpenses = expenses.filter((exp) => {
    const q = expenseSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (exp.expense_name || "").toLowerCase().includes(q) ||
      (exp.notes || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const pagedExpenses = filteredExpenses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const resetExpenseForm = () => {
    setExpenseForm({
      ...EMPTY_EXPENSE_FORM,
      expense_date: isLifetime ? getDefaultRange().to : range.to,
    });
    setEditingId(null);
    setFormErrors({});
  };

  const handleEditExpense = (exp) => {
    setEditingId(exp.id);
    setFormErrors({});
    setExpenseForm({
      expense_master_id: String(exp.expense_master_id ?? ""),
      amount: exp.amount,
      expense_date: exp.expense_date,
      notes: exp.notes || "",
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => resetExpenseForm();

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!expenseForm.expense_master_id) errs.expense_master_id = "Select an expense type";
    if (!expenseForm.amount) errs.amount = "Enter an amount";
    if (!expenseForm.expense_date) errs.expense_date = "Pick a date";
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      const url = isEdit ? `${NetProfitAPI}/expense/${editingId}` : `${NetProfitAPI}/expense`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || (isEdit ? "Failed to update expense" : "Failed to log expense"));
      }
      toast.success(isEdit ? "Expense updated" : "Expense added");

      if (isEdit) {
        resetExpenseForm();
      } else {
        setExpenseForm((prev) => ({ ...prev, amount: "", notes: "" }));
        setEditingId(null);
        if (typeof window !== "undefined") {
          requestAnimationFrame(() => amountInputRef.current?.focus());
        }
        const newId = data.data?.id ?? data.id;
        if (newId != null) {
          setNewlyAddedId(newId);
          setTimeout(() => setNewlyAddedId(null), 2500);
        }
      }
      fetchNetProfit();
      if (tab === "analytics") fetchAnalytics();
    } catch (err) {
      toast.error(err.message || "Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (exp) => {
    const confirmed = window.confirm(
      `Delete "${exp.expense_name}" of ${fmt(exp.amount)} dated ${exp.expense_date}?`
    );
    if (!confirmed) return;
    setDeletingId(exp.id);
    try {
      const res = await fetch(`${NetProfitAPI}/expense/${exp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete expense");
      toast.success("Expense deleted");
      if (editingId === exp.id) resetExpenseForm();
      fetchNetProfit();
      if (tab === "analytics") fetchAnalytics();
    } catch (err) {
      toast.error(err.message || "Something went wrong while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  const getPeriodLabel = () => (isLifetime ? "Lifetime (All Time)" : `${range.from} to ${range.to}`);
  const getFileSuffix = () => (isLifetime ? "lifetime" : `${range.from}_to_${range.to}`);

  const handleExportExcel = () => {
    if (!expenses.length) {
      toast.error("No expenses to export for this period");
      return;
    }
    const periodLabel = getPeriodLabel();
    const revNum = parseExcelNumber(netRevenue, 0);
    const expNum = parseExcelNumber(totalExpense, 0);
    const profitNum = parseExcelNumber(netProfit, 0);

    const expStartRow = 9;
    const expEndRow = expStartRow + expenses.length - 1;

    const wsData = [
      ["Net Profit Report"],
      [`Period: ${periodLabel}`],
      [],
      ["Total Revenue", revNum],
      ["Total Expenses", expNum],
      ["Net Profit", profitNum],
      [],
      ["#", "Expense Name", "Type", "Date", "Amount", "Notes"],
      ...expenses.map((exp, i) => [
        i + 1,
        exp.notes || exp.expense_name,
        exp.expense_name,
        parseExcelDate(exp.expense_date),
        parseExcelNumber(exp.amount, 0),
        exp.notes || "",
      ]),
      [],
      ["", "", "", "Total", expNum, ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData, {
      cellDates: true,
      dateNF: "dd-mm-yyyy",
    });

    // Apply number format to summary cards
    ["B4", "B5", "B6"].forEach((ref) => {
      if (ws[ref]) ws[ref].z = "#,##0.00";
    });

    // Apply number format to Expense Amount column
    for (let r = expStartRow; r <= expEndRow; r++) {
      if (ws[`E${r}`]) ws[`E${r}`].z = "#,##0.00";
    }

    // Add Excel SUM formula for Total Expenses
    const totalCellRef = `E${expEndRow + 2}`;
    if (ws[totalCellRef]) {
      ws[totalCellRef].z = "#,##0.00";
      ws[totalCellRef].f = `SUM(E${expStartRow}:E${expEndRow})`;
    }

    ws["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expenses_${getFileSuffix()}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!expenses.length) {
      toast.error("No expenses to export for this period");
      return;
    }
    const periodLabel = getPeriodLabel();
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Net Profit Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Period: ${periodLabel}`, 14, 25);
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(`Total Revenue: ${fmtPdf(netRevenue)}`, 14, 35);
    doc.text(`Total Expenses: ${fmtPdf(totalExpense)}`, 14, 41);
    doc.text(`Net Profit: ${fmtPdf(netProfit)}`, 14, 47);
    autoTable(doc, {
      startY: 54,
      head: [["#", "Expense Name", "Type", "Date", "Amount"]],
      body: expenses.map((exp, i) => [
        i + 1,
        exp.notes || exp.expense_name,
        exp.expense_name,
        exp.expense_date,
        fmtPdf(exp.amount),
      ]),
      foot: [["", "", "", "Total", fmtPdf(totalExpense)]],
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22] },
      footStyles: { fillColor: [243, 244, 246], textColor: 20, fontStyle: "bold" },
      styles: { fontSize: 9 },
    });
    doc.save(`expenses_${getFileSuffix()}.pdf`);
  };

  const PeriodSwitcher = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="date"
        name="from"
        value={range.from}
        onChange={handleRangeChange}
        disabled={isLifetime}
        className="p-2 border border-gray-300 text-gray-700 bg-white rounded-lg outline-none text-sm disabled:opacity-50 disabled:bg-gray-50"
      />
      <span className="text-gray-400 text-sm">to</span>
      <input
        type="date"
        name="to"
        value={range.to}
        onChange={handleRangeChange}
        disabled={isLifetime}
        className="p-2 border border-gray-300 text-gray-700 bg-white rounded-lg outline-none text-sm disabled:opacity-50 disabled:bg-gray-50"
      />
      <button
        type="button"
        onClick={applyThisMonth}
        className={`btn-press rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
          !isLifetime ? "bg-orange-500 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        This month
      </button>
      <button
        type="button"
        onClick={applyLifetime}
        className={`btn-press rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap flex items-center gap-1 transition-colors duration-200 ${
          isLifetime ? "bg-orange-500 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <i className="bi bi-infinity"></i> All Time
      </button>
    </div>
  );

  const SummaryCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      <div
        className="stat-card anim-fade-in-up card-hover bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-4"
        style={{ animationDelay: "0ms" }}
      >
        <span className="anim-bar-grow absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 to-green-600" style={{ animationDelay: "150ms" }}></span>
        <span className="sheen"></span>
        <div
          className="stat-icon anim-icon-pop w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg shrink-0"
          style={{ animationDelay: "120ms" }}
        >
          <i className="bi bi-graph-up-arrow"></i>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Balance Amount</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUp value={netRevenue} formatter={fmt} />
          </p>
          {analytics && (
            <p
              className={`anim-badge-in text-xs font-semibold mt-1 flex items-center gap-1 ${
                analytics.revenueChangePct >= 0 ? "text-green-600" : "text-red-600"
              }`}
              style={{ animationDelay: "320ms" }}
            >
              <i className={`bi bi-arrow-${analytics.revenueChangePct >= 0 ? "up" : "down"}`}></i>
              {Math.abs(analytics.revenueChangePct)}% from last month
            </p>
          )}
        </div>
      </div>
      <div
        className="stat-card anim-fade-in-up card-hover bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-4"
        style={{ animationDelay: "80ms" }}
      >
        <span className="anim-bar-grow absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ animationDelay: "230ms" }}></span>
        <span className="sheen"></span>
        <div
          className="stat-icon anim-icon-pop w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0"
          style={{ animationDelay: "200ms" }}
        >
          <i className="bi bi-wallet2"></i>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Total Gen.Expenses</p>
          <p className="text-2xl font-bold text-gray-900">
            <CountUp value={totalExpense} formatter={fmt} />
          </p>
          {analytics && (
            <p
              className={`anim-badge-in text-xs font-semibold mt-1 flex items-center gap-1 ${
                analytics.expenseChangePct > 0 ? "text-blue-600" : "text-green-600"
              }`}
              style={{ animationDelay: "400ms" }}
            >
              <i className={`bi bi-arrow-${analytics.expenseChangePct >= 0 ? "up" : "down"}`}></i>
              {Math.abs(analytics.expenseChangePct)}% from last month
            </p>
          )}
        </div>
      </div>
      <div
        className="stat-card anim-fade-in-up card-hover bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-4"
        style={{ animationDelay: "160ms" }}
      >
        <span
          className={`anim-bar-grow absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${
            netProfit >= 0 ? "from-orange-400 to-orange-600" : "from-red-400 to-red-600"
          }`}
          style={{ animationDelay: "310ms" }}
        ></span>
        <span className="sheen"></span>
        <div
          className={`stat-icon anim-icon-pop w-12 h-12 rounded-full flex items-center justify-center text-lg shrink-0 ${
            netProfit >= 0 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
          }`}
          style={{ animationDelay: "280ms" }}
        >
          <i className={`bi ${netProfit >= 0 ? "bi-piggy-bank" : "bi-exclamation-triangle"}`}></i>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Available Balance</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-gray-900" : "text-red-600"}`}>
            <CountUp value={netProfit} formatter={fmt} />
          </p>
          {analytics && (
            <p
              className={`anim-badge-in text-xs font-semibold mt-1 flex items-center gap-1 ${
                netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
              style={{ animationDelay: "480ms" }}
            >
              <i className={`bi bi-arrow-${netProfit >= 0 ? "up" : "down"}`}></i>
              {analytics.profitMargin}% margin
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      {/* NEW: animation keyframes + reusable animation utility classes (UI only, no functional impact) */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes rowIn {
          from {
            opacity: 0;
            transform: translateX(-6px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shake {
          10%,
          90% {
            transform: translateX(-1px);
          }
          20%,
          80% {
            transform: translateX(2px);
          }
          30%,
          50%,
          70% {
            transform: translateX(-3px);
          }
          40%,
          60% {
            transform: translateX(3px);
          }
        }
        @keyframes pulseGlow {
          0% {
            background-color: rgba(34, 197, 94, 0.18);
          }
          50% {
            background-color: rgba(34, 197, 94, 0.06);
          }
          100% {
            background-color: transparent;
          }
        }
        @keyframes shimmer {
          from {
            background-position: -400px 0;
          }
          to {
            background-position: 400px 0;
          }
        }
        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .anim-spin-slow {
          display: inline-block;
          animation: spinSlow 0.8s linear infinite;
        }
        @keyframes barGrow {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes iconPop {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-15deg);
          }
          60% {
            opacity: 1;
            transform: scale(1.15) rotate(4deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes badgeSlideIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .anim-bar-grow {
          transform-origin: left;
          animation: barGrow 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-icon-pop {
          animation: iconPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .anim-badge-in {
          animation: badgeSlideIn 0.4s ease both;
        }
        .stat-card {
          position: relative;
          overflow: hidden;
        }
        .stat-card .sheen {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.55) 50%, transparent 80%);
          transform: translateX(-120%);
          transition: transform 0.75s ease;
        }
        .stat-card:hover .sheen {
          transform: translateX(120%);
        }
        .stat-icon {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.08) rotate(-4deg);
        }
        .anim-fade-in-up {
          animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .anim-fade-in {
          animation: fadeIn 0.4s ease both;
        }
        .anim-row-in {
          animation: rowIn 0.3s ease both;
        }
        .anim-shake {
          animation: shake 0.4s ease;
        }
        .anim-pulse-glow {
          animation: pulseGlow 2s ease-out;
        }
        .anim-shimmer {
          background: linear-gradient(90deg, #f3f4f6 0%, #eceef1 40px, #f3f4f6 80px);
          background-size: 600px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 0, 0, 0.08);
        }
        .btn-press {
          transition: transform 0.12s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .btn-press:active {
          transform: scale(0.96);
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-fade-in-up,
          .anim-fade-in,
          .anim-row-in,
          .anim-shake,
          .anim-pulse-glow,
          .anim-spin-slow,
          .anim-shimmer,
          .anim-bar-grow,
          .anim-icon-pop,
          .anim-badge-in,
          .stat-card .sheen,
          .stat-icon,
          .card-hover,
          .btn-press {
            animation: none !important;
            transition: none !important;
          }
        }

  /* Lightbulb subtle pulse/glow */
  @keyframes iconPulseGlow {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 0 rgba(251, 191, 36, 0));
    }
    50% {
      transform: scale(1.12);
      filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.6));
    }
  }
  .anim-icon-pulse {
    display: inline-block;
    animation: iconPulseGlow 2.2s ease-in-out infinite;
  }

  /* Check icon pop-in */
  @keyframes checkPopIn {
    0% {
      opacity: 0;
      transform: scale(0.3) rotate(-15deg);
    }
    60% {
      opacity: 1;
      transform: scale(1.2) rotate(5deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
  .anim-check-pop {
    display: inline-block;
    opacity: 0;
    animation: checkPopIn 0.4s ease-out forwards;
  }

  /* Card hover lift */
  .anim-card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

 /* Continuous fade-in / fade-out loop for insight cards */
    @keyframes fadeInOut {
    0%   { background-color: rgb(219 234 254); }  /* gray-50 */
    50%  { background-color: rgb(249 250 251); }  /* blue-100 */
    100% { background-color: rgb(219 234 254); }  /* gray-50 */
  }
  .anim-fade-in-out {
    animation: fadeInOut 3s ease-in-out infinite;
  }
  /* Card hover lift (kept from before) */
  .anim-card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

      `}</style>
      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb + date range */}
        <div className="anim-fade-in-up bg-white w-full shadow-sm p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
            <p className="flex items-center flex-wrap">
              <Link href="/dashboard" className="mx-2 text-xl text-gray-400 hover:text-indigo-600">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="#" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">
                General Expense
              </Link>
            </p>
          </div>
          <PeriodSwitcher />
        </div>

        {isLifetime && (
          <div className="mx-4 -mt-3 mb-4">
            <p className="text-xs text-orange-600 font-semibold flex items-center gap-1">
              <i className="bi bi-info-circle"></i> Showing lifetime data — all projects &amp; expenses (no date filter)
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="mx-4 mb-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setTab("entry")}
              className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-[1px] transition-all duration-200 ${
                tab === "entry" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <i className="bi bi-journal-text"></i> Entry
            </button>
            <button
              onClick={() => setTab("analytics")}
              className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-[1px] transition-all duration-200 ${
                tab === "analytics" ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <i className="bi bi-bar-chart"></i> Analytics
            </button>
          </div>
          {tab === "analytics" && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="btn-press flex items-center gap-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg px-4 py-2 transition-colors duration-200"
            >
              <i className="bi bi-download"></i> Export
            </button>
          )}
        </div>

        {tab === "entry" && (
          <>
            <div className="mx-4">
              <SummaryCards />
            </div>

            {/* Add / Edit expense form */}
            <div className="mx-4 mb-5">
              <div
                className={`anim-fade-in-up bg-orange-50 rounded-2xl border p-5 transition-colors duration-300 ${
                  editingId ? "border-orange-400 ring-1 ring-orange-200" : "border-orange-100"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-bold text-gray-900">
                    {editingId ? "Edit Expense" : "Add New Expense"}
                  </p>
                  {editingId && (
                    <span className="text-[11px] font-semibold text-orange-600 bg-white px-2 py-0.5 rounded-full">
                      Editing entry #{editingId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-4">Quickly add your general expenses</p>

                <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-start">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Expense Type</label>
                    <select
                      name="expense_master_id"
                      value={expenseForm.expense_master_id}
                      onChange={handleExpenseFormChange}
                      className={`p-2.5 w-full border text-gray-700 bg-white rounded-lg outline-none text-sm transition-all duration-150 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 ${
                        formErrors.expense_master_id ? "border-red-400 anim-shake" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select type</option>
                      {expenseOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.expense_master_id && (
                      <p className="text-[11px] text-red-500 mt-1">{formErrors.expense_master_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input
                        ref={amountInputRef}
                        type="number"
                        name="amount"
                        placeholder="Enter amount"
                        value={expenseForm.amount}
                        onChange={handleExpenseFormChange}
                        className={`p-2.5 pl-6 w-full border text-gray-700 bg-white rounded-lg outline-none text-sm transition-all duration-150 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 ${
                          formErrors.amount ? "border-red-400 anim-shake" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {formErrors.amount && <p className="text-[11px] text-red-500 mt-1">{formErrors.amount}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                    <input
                      type="date"
                      name="expense_date"
                      value={expenseForm.expense_date}
                      onChange={handleExpenseFormChange}
                      className={`p-2.5 w-full border text-gray-700 bg-white rounded-lg outline-none text-sm transition-all duration-150 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 ${
                        formErrors.expense_date ? "border-red-400 anim-shake" : "border-gray-300"
                      }`}
                    />
                    {formErrors.expense_date && (
                      <p className="text-[11px] text-red-500 mt-1">{formErrors.expense_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      name="notes"
                      placeholder="Add a note..."
                      value={expenseForm.notes}
                      onChange={handleExpenseFormChange}
                      className="p-2.5 w-full border border-gray-300 text-gray-700 bg-white rounded-lg outline-none text-sm transition-all duration-150 focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                    />
                  </div>

                  <div className="flex gap-2 sm:pt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`btn-press px-5 py-2.5 rounded-lg shadow-sm font-semibold text-sm text-white disabled:opacity-60 whitespace-nowrap w-full transition-colors ${
                        editingId ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      {saving ? (
                        <span className="flex items-center justify-center gap-2">
                          <i className="bi bi-arrow-repeat anim-spin-slow"></i>
                          {editingId ? "Updating..." : "Adding..."}
                        </span>
                      ) : editingId ? (
                        "Update"
                      ) : (
                        "+ Add Expense"
                      )}
                    </button>
                  </div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="btn-press border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 whitespace-nowrap sm:col-span-1 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Expenses + Projects */}
            <div className="mx-4 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Expenses table */}
              <div className="anim-fade-in-up lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-4" style={{ animationDelay: "60ms" }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">All Expenses</p>
                    <p className="text-xs text-gray-400">View and manage all your expenses</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="btn-press flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md px-2.5 py-1.5 transition-colors duration-150"
                    >
                      <i className="bi bi-file-earmark-excel"></i> Excel
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="btn-press flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md px-2.5 py-1.5 transition-colors duration-150"
                    >
                      <i className="bi bi-file-earmark-pdf"></i> PDF
                    </button>
                    <div className="relative">
                      <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                      <input
                        type="text"
                        value={expenseSearch}
                        onChange={(e) => setExpenseSearch(e.target.value)}
                        placeholder="Search expense..."
                        className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 bg-white w-40 transition-all duration-150 focus:w-52"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700 border-collapse whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="py-3 px-3 w-10">#</th>
                        <th className="py-3 px-3">Expense Name</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Notes</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading &&
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={`sk-${i}`} className="border-b border-gray-100">
                            <td className="py-3 px-3">
                              <div className="anim-shimmer h-3 w-4 rounded"></div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="anim-shimmer h-3 w-28 rounded"></div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="anim-shimmer h-5 w-16 rounded-full"></div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="anim-shimmer h-3 w-16 rounded"></div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="anim-shimmer h-3 w-20 rounded"></div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="anim-shimmer h-3 w-24 rounded"></div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="anim-shimmer h-8 w-16 rounded-full ml-auto"></div>
                            </td>
                          </tr>
                        ))}
                      {!loading && error && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-red-500">
                            {error}
                          </td>
                        </tr>
                      )}
                      {!loading && !error && pagedExpenses.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-gray-400">
                            <i className="bi bi-receipt-cutoff text-2xl mb-1 block"></i>
                            {expenseSearch
                              ? "No expenses match your search."
                              : isLifetime
                              ? "No expenses logged yet. Add your first expense above."
                              : "No expenses logged for this range."}
                          </td>
                        </tr>
                      )}
                      {!loading &&
                        !error &&
                        pagedExpenses.map((exp, i) => {
                          const badge = badgeFor(exp.expense_master_id);
                          return (
                            <tr
                              key={exp.id}
                              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                              className={`anim-row-in border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                                editingId === exp.id
                                  ? "bg-orange-50"
                                  : newlyAddedId === exp.id
                                  ? "anim-pulse-glow"
                                  : ""
                              }`}
                            >
                              <td className="py-3 px-3">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                              <td className="py-3 px-3 font-semibold text-gray-900">
                                {exp.notes || exp.expense_name}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                                  {exp.expense_name}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-gray-900">{fmt(exp.amount)}</td>
                              <td className="py-3 px-3 text-gray-500">{fmtDate(exp.expense_date)}</td>
                              <td className="py-3 px-3 text-gray-400 max-w-[160px] truncate">{exp.notes || "-"}</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditExpense(exp)}
                                    title="Edit"
                                    className="btn-press w-8 h-8 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 hover:scale-110 border border-blue-200 transition-all duration-150"
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteExpense(exp)}
                                    disabled={deletingId === exp.id}
                                    title="Delete"
                                    className="btn-press w-8 h-8 flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 hover:scale-110 border border-red-200 disabled:opacity-50 transition-all duration-150"
                                  >
                                    {deletingId === exp.id ? (
                                      <i className="bi bi-hourglass-split anim-spin-slow"></i>
                                    ) : (
                                      <i className="bi bi-trash"></i>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {!loading && !error && filteredExpenses.length > 0 && (
                  <div className="flex items-center justify-between mt-4 px-1 flex-wrap gap-2">
                    <p className="text-xs text-gray-400">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                      {Math.min(currentPage * PAGE_SIZE, filteredExpenses.length)} of {filteredExpenses.length} expenses
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="btn-press w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors duration-150"
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                      <span
                        key={currentPage}
                        className="anim-fade-in w-8 h-8 flex items-center justify-center rounded-md bg-orange-500 text-white text-sm font-semibold"
                      >
                        {currentPage}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="btn-press w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors duration-150"
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Projects table */}
              <div className="anim-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-4" style={{ animationDelay: "120ms" }}>
                <p className="text-sm font-bold text-gray-900 mb-1">Projects Net Revenue</p>
                <p className="text-xs text-gray-400 mb-3">Revenue from all projects</p>
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-sm text-left text-gray-700 border-collapse whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                      <tr>
                        <th className="py-2.5 px-2 w-8">#</th>
                        <th className="py-2.5 px-2">Company</th>
                        <th className="py-2.5 px-2">Customer</th>
                        <th className="py-2.5 px-2">Net Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-400">
                            Loading...
                          </td>
                        </tr>
                      )}
                      {!loading && !error && projects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-gray-400">
                            <i className="bi bi-building text-2xl mb-1 block"></i>
                            No projects with net revenue.
                          </td>
                        </tr>
                      )}
                      {!loading &&
                        !error &&
                        projects.map((p, i) => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                            <td className="py-2.5 px-2">{i + 1}</td>
                            <td className="py-2.5 px-2 font-semibold text-gray-900">{p.company_name}</td>
                            <td className="py-2.5 px-2">{p.customer_name}</td>
                            <td className="py-2.5 px-2 text-green-600 font-semibold">{fmt(p.net_revenue_amount)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <Link
                    href="/sales/projects"
                    className="group text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors duration-150"
                  >
                    View All Projects{" "}
                    <i className="bi bi-arrow-right transition-transform duration-150 group-hover:translate-x-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "analytics" && (
          <div className="mx-4 mb-8">
            <SummaryCards />

            {analyticsLoading && !analytics && (
              <div className="anim-fade-in text-center py-16 text-gray-400">
                <i className="bi bi-arrow-repeat anim-spin-slow text-xl block mb-2"></i>
                Loading analytics...
              </div>
            )}

            {analytics && (
              <>
               

                {/* Quick Insights */}
           {analytics.quickInsights?.length > 0 && (
  <div className="anim-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-5">
    <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
      <i className="bi bi-lightbulb text-amber-400 anim-icon-pulse"></i> Quick Insights
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {analytics.quickInsights.map((insight, i) => (
        <div
          key={i}
          className="anim-fade-in-out anim-card-hover flex items-start gap-2 bg-gray-50 rounded-lg p-3 transition-all duration-200 hover:bg-blue-100"
          style={{ animationDelay: `${i * 300}ms` }}
        >
          <i
            className="bi bi-check-circle text-orange-400 mt-0.5"
          ></i>
          <p className="text-xs text-gray-600">{insight}</p>
        </div>
      ))}
    </div>
  </div>
)}

                {/* Trend chart */}
                <div className="anim-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-bold text-gray-900">Project Value vs All Expense Overview</p>
                    <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                      {[
                        { key: "weekly", label: "Weekly" },
                        { key: "monthly", label: "Monthly" },
                        { key: "quarterly", label: "Quarterly" },
                        { key: "yearly", label: "Yearly" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setChartPeriod(opt.key)}
                          className={`btn-press px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                            chartPeriod === opt.key
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.monthly}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={fmtShort} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        formatter={(value) => {
                          const labels = {
                            amount: "Revenue (Quot Amount)",
                            expense_net: "Expenses",
                            architecture_net: "Architecture Amount",
                            expense: "General Expense",
                          };
                          return labels[value] || value;
                        }}
                      />
                      <Bar dataKey="amount" name="Project  Value (Quot Amount)" fill={TREND_COLORS.amount} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense_net" name="Operation Cost" fill={TREND_COLORS.expense_net} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="architecture_net" name="Architecture Amount" fill={TREND_COLORS.architecture_net} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="General Expense" fill={TREND_COLORS.expense} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {/* Donut: expense breakdown */}
                  <div className="anim-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <p className="text-sm font-bold text-gray-900 mb-3">Expense Breakdown by Type</p>
                    {analytics.expenseBreakdown.length === 0 ? (
                      <p className="text-center text-gray-400 py-10 text-sm">No expenses in range.</p>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-1/2">
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={analytics.expenseBreakdown}
                                dataKey="amount"
                                nameKey="name"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={2}
                              >
                                {analytics.expenseBreakdown.map((_, i) => (
                                  <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v) => fmt(v)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-2">
                          {analytics.expenseBreakdown.map((e, i) => {
                            const total = analytics.expenseBreakdown.reduce((s, x) => s + x.amount, 0);
                            const pct = total > 0 ? Math.round((e.amount / total) * 100) : 0;
                            return (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full inline-block"
                                    style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                                  ></span>
                                  {e.name}
                                </span>
                                <span className="font-semibold text-gray-900">{pct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Top expense categories */}
                  <div className="anim-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-4" style={{ animationDelay: "80ms" }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-900">Top Expense Categories</p>
                      <Link href="#" className="text-xs font-semibold text-orange-600">
                        View All Categories
                      </Link>
                    </div>
                    {analytics.topExpenseCategories.length === 0 ? (
                      <p className="text-gray-400 text-sm">No data.</p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.topExpenseCategories.map((c, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-700 font-medium">{c.name}</span>
                              <span className="text-gray-500">
                                {fmt(c.amount)} · {c.pct}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-green-500 transition-all duration-700 ease-out"
                                style={{ width: `${c.pct}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {/* Project Profitability */}
                  <div className="anim-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-900">Project Profitability</p>
                      <Link href="/sales/projects" className="text-xs font-semibold text-orange-600">
                        View All Projects
                      </Link>
                    </div>
                    {analytics.projectProfitability?.length === 0 ? (
                      <p className="text-gray-400 text-sm">No data.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-gray-700 whitespace-nowrap">
                          <thead className="text-gray-400 uppercase">
                            <tr>
                              <th className="py-2 pr-2">Project</th>
                              <th className="py-2 pr-2">Revenue</th>
                              <th className="py-2 pr-2">Expense</th>
                              <th className="py-2 pr-2">Profit</th>
                              <th className="py-2 pr-2">Margin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.projectProfitability?.map((p, i) => (
                              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                                <td className="py-2 pr-2 font-semibold text-gray-900">{p.name}</td>
                                <td className="py-2 pr-2">{fmt(p.revenue)}</td>
                                <td className="py-2 pr-2">{fmt(p.expense)}</td>
                                <td className="py-2 pr-2 text-green-600 font-semibold">{fmt(p.profit)}</td>
                                <td className="py-2 pr-2">
                                  <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-semibold">
                                    {p.margin}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Budget Tracking */}
                  <div className="anim-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-200 p-4" style={{ animationDelay: "80ms" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Budget Tracking</p>
                        <p className="text-[11px] text-gray-400">
                          Independent of the date filter above — each type is measured against its own duration
                        </p>
                      </div>
                      <Link href="/setup/general-expense" className="text-xs font-semibold text-orange-600 whitespace-nowrap">
                        View Full Budget
                      </Link>
                    </div>
                    {analytics.budgetTracking.filter((b) => b.budget != null).length === 0 ? (
                      <p className="text-gray-400 text-sm">No budget limits set yet for any expense type.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-gray-700 whitespace-nowrap">
                          <thead className="text-gray-400 uppercase">
                            <tr>
                              <th className="py-2 pr-2">Category</th>
                              <th className="py-2 pr-2">Duration</th>
                              <th className="py-2 pr-2">Budget</th>
                              <th className="py-2 pr-2">Spent</th>
                              <th className="py-2 pr-2">Remaining</th>
                              <th className="py-2 pr-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.budgetTracking
                              .filter((b) => b.budget != null)
                              .map((b, i) => (
                                <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                                  <td className="py-2 pr-2 font-semibold text-gray-900">
                                    {b.name}
                                    {b.is_recurring && (
                                      <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        Recurring
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 pr-2 text-gray-500">{budgetDurationLabel(b)}</td>
                                  <td className="py-2 pr-2">{fmt(b.budget)}</td>
                                  <td className="py-2 pr-2">{fmt(b.spent)}</td>
                                  <td className={`py-2 pr-2 ${b.remaining < 0 ? "text-red-600" : "text-gray-700"}`}>
                                    {fmt(b.remaining)}
                                  </td>
                                  <td className="py-2 pr-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-semibold ${
                                        b.status === "Over Budget"
                                          ? "text-red-700 bg-red-50"
                                          : "text-green-700 bg-green-50"
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Daily expense trend + KPIs + AI Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="anim-fade-in-up lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                    <p className="text-sm font-bold text-gray-900 mb-3">Expense Trend (Daily)</p>
                    {analytics.dailyTrend?.length ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={analytics.dailyTrend}>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(d) => fmtDate(d).slice(0, 5)}
                          />
                          <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => fmt(v)} labelFormatter={(d) => fmtDate(d)} />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#16a34a"
                            fill="#bbf7d0"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400 text-sm py-10 text-center">No expense data.</p>
                    )}
                  </div>

                  <div className="anim-fade-in-up lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4" style={{ animationDelay: "80ms" }}>
                    <p className="text-sm font-bold text-gray-900 mb-3">Important KPIs</p>
                    <div className="space-y-3">
                      {analytics.importantKPIs?.highestExpenseDay && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <i className="bi bi-calendar-event text-red-400"></i> Highest Expense Day
                          </span>
                          <span className="font-semibold text-gray-900">
                            {fmtDate(analytics.importantKPIs.highestExpenseDay.date)} ·{" "}
                            {fmt(analytics.importantKPIs.highestExpenseDay.amount)}
                          </span>
                        </div>
                      )}
                      {analytics.importantKPIs?.highestRevenueDay && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <i className="bi bi-calendar-check text-blue-400"></i> Highest Revenue Day
                          </span>
                          <span className="font-semibold text-gray-900">
                            {fmtDate(analytics.importantKPIs.highestRevenueDay.date)} ·{" "}
                            {fmt(analytics.importantKPIs.highestRevenueDay.amount)}
                          </span>
                        </div>
                      )}
                      {analytics.importantKPIs?.largestExpense && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <i className="bi bi-cash-stack text-orange-400"></i> Largest Expense
                          </span>
                          <span className="font-semibold text-gray-900">
                            {analytics.importantKPIs.largestExpense.name} ·{" "}
                            {fmt(analytics.importantKPIs.largestExpense.amount)}
                          </span>
                        </div>
                      )}
                      {analytics.importantKPIs?.largestProject && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <i className="bi bi-building text-purple-400"></i> Largest Project
                          </span>
                          <span className="font-semibold text-gray-900">
                            {analytics.importantKPIs.largestProject.name} ·{" "}
                            {fmt(analytics.importantKPIs.largestProject.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="anim-fade-in-up lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4" style={{ animationDelay: "160ms" }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        AI Recommendations
                        <i className="bi bi-stars text-orange-400 text-xs"></i>
                      </p>
                    </div>
                    {analytics.aiRecommendations?.length ? (
                      <ul className="space-y-2">
                        {analytics.aiRecommendations.map((r, i) => (
                          <li
                            key={i}
                            className="anim-fade-in-up flex items-start gap-2 text-xs text-gray-600"
                            style={{ animationDelay: `${200 + i * 60}ms` }}
                          >
                            <i className="bi bi-stars text-orange-400 mt-0.5"></i>
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400 text-sm">No recommendations right now.</p>
                    )}
                    <Link
                      href="#"
                      className="group text-xs font-semibold text-orange-600 mt-3 inline-flex items-center gap-1 transition-colors duration-150 hover:text-orange-700"
                    >
                      View Detailed Analysis
                      <i className="bi bi-arrow-right transition-transform duration-150 group-hover:translate-x-1"></i>
                    </Link>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 mt-4 text-center">
                  All amounts are in INR. Data is updated live from the database.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}