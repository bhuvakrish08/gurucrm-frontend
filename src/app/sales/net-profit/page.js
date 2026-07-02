"use client";
import React, { useState, useEffect, useCallback } from "react";
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
} from "recharts";

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
};

const DONUT_COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4"];

// Colors for the 4-way trend chart: Amount / Architecture Net / Expense Net / General Expense
const TREND_COLORS = {
  amount: "#3b82f6",
  architecture_net: "#8b5cf6",
  expense_net: "#ef4444",
  expense: "#f97316",
};

export default function NetProfitPage() {
  const [tab, setTab] = useState("entry"); // "entry" | "analytics"
  const [range, setRange] = useState(getDefaultRange());
  // NEW: lifetime toggle - when true, ignore range and show ALL projects/expenses
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

  // ---------- edit / delete state ----------
  const [editingId, setEditingId] = useState(null); // id of expense being edited, null = add mode
  const [deletingId, setDeletingId] = useState(null); // id currently being deleted (for spinner)

  // ---------- analytics state ----------
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("monthly"); // "weekly" | "monthly" | "yearly"

  const fmt = (n) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const fmtShort = (n) => {
    n = Number(n || 0);
    if (n >= 100000) return "₹" + (n / 100000).toFixed(1).replace(/\.0$/, "") + "L";
    if (n >= 1000) return "₹" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return "₹" + n;
  };

  // ---------- Fetch active expense types for the dropdown ----------
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

  // ---------- Fetch net profit for selected range (or lifetime) ----------
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

  // ---------- Fetch analytics for selected range (or lifetime) + chart period ----------
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

  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setIsLifetime(false); // manual date change should exit lifetime mode
    setRange((prev) => ({ ...prev, [name]: value }));
  };

  const applyThisMonth = () => {
    setIsLifetime(false);
    setRange(getDefaultRange());
  };

  const applyLifetime = () => {
    setIsLifetime(true);
  };

  const handleExpenseFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      ...EMPTY_EXPENSE_FORM,
      expense_date: isLifetime ? getDefaultRange().to : range.to,
    });
    setEditingId(null);
  };

  // ---------- Start editing an existing expense row ----------
  const handleEditExpense = (exp) => {
    setEditingId(exp.id);
    setExpenseForm({
      expense_master_id: String(exp.expense_master_id ?? exp.expenseMasterId ?? ""),
      amount: exp.amount,
      expense_date: exp.expense_date,
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    resetExpenseForm();
  };

  // ---------- Add or Update a general expense entry ----------
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (
      !expenseForm.expense_master_id ||
      !expenseForm.amount ||
      !expenseForm.expense_date
    ) {
      toast.error("Select a type, amount, and date");
      return;
    }

    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      const url = isEdit
        ? `${NetProfitAPI}/expense/${editingId}`
        : `${NetProfitAPI}/expense`;
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
      resetExpenseForm();
      fetchNetProfit();
      if (tab === "analytics") fetchAnalytics();
    } catch (err) {
      toast.error(err.message || "Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Delete an expense entry ----------
  const handleDeleteExpense = async (exp) => {
    const confirmed = window.confirm(
      `Delete "${exp.expense_name}" of ${fmt(exp.amount)} dated ${exp.expense_date}?`
    );
    if (!confirmed) return;

    setDeletingId(exp.id);
    try {
      const res = await fetch(`${NetProfitAPI}/expense/${exp.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete expense");
      }

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

  return (
    <>
      <Header />
      <div className="bg-gray-100 min-h-screen">
        {/* Breadcrumb + date range */}
        <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
            <p className="flex items-center flex-wrap">
              <Link
                href="/dashboard"
                className="mx-2 text-xl text-gray-400 hover:text-indigo-600"
              >
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/sales/projects"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Projects
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/sales/projects/net-profit"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Net Profit
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <input
              type="date"
              name="from"
              value={range.from}
              onChange={handleRangeChange}
              disabled={isLifetime}
              className="p-2 border border-orange-300 text-gray-700 bg-white rounded-sm outline-none text-sm disabled:opacity-50 disabled:bg-gray-50"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              name="to"
              value={range.to}
              onChange={handleRangeChange}
              disabled={isLifetime}
              className="p-2 border border-orange-300 text-gray-700 bg-white rounded-sm outline-none text-sm disabled:opacity-50 disabled:bg-gray-50"
            />
            <button
              type="button"
              onClick={applyThisMonth}
              className={`border rounded-sm px-3 py-2 text-sm font-semibold whitespace-nowrap ${
                !isLifetime
                  ? "bg-gray-200 border-gray-400 text-gray-900"
                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This month
            </button>
            <button
              type="button"
              onClick={applyLifetime}
              className={`border rounded-sm px-3 py-2 text-sm font-semibold whitespace-nowrap flex items-center gap-1 ${
                isLifetime
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <i className="bi bi-infinity"></i> All Time
            </button>
          </div>
        </div>

        {isLifetime && (
          <div className="mx-4 -mt-3 mb-4">
            <p className="text-xs text-orange-600 font-semibold flex items-center gap-1">
              <i className="bi bi-info-circle"></i> Showing lifetime data — all projects &amp; expenses (no date filter)
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="mx-4 mb-5 flex gap-1 border-b border-gray-300">
          <button
            onClick={() => setTab("entry")}
            className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-[1px] ${
              tab === "entry"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <i className="bi bi-journal-text"></i> Entry
          </button>
          <button
            onClick={() => setTab("analytics")}
            className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-[1px] ${
              tab === "analytics"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <i className="bi bi-bar-chart"></i> Analytics
          </button>
        </div>

        {tab === "entry" && (
          <>
            {/* Summary cards */}
            <div className="mx-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">
                  {isLifetime ? "Net Revenue (Lifetime)" : "Net Revenue"}
                </p>
                <p className="text-2xl font-bold text-gray-900">{fmt(netRevenue)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">
                  {isLifetime ? "General Expense (Lifetime)" : "General Expense"}
                </p>
                <p className="text-2xl font-bold text-gray-900">{fmt(totalExpense)}</p>
              </div>
              <div className="bg-orange-50 rounded-2xl shadow-md border border-orange-200 p-4">
                <p className="text-xs text-orange-600 mb-1">
                  {isLifetime ? "Net Profit (Lifetime)" : "Net Profit"}
                </p>
                <p className="text-2xl font-bold text-orange-600">{fmt(netProfit)}</p>
              </div>
            </div>

            {/* Add / Edit expense form */}
            <div className="mx-4 mb-5">
              <div
                className={`bg-white rounded-2xl shadow-md border p-4 ${
                  editingId ? "border-orange-400 ring-1 ring-orange-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">
                    {editingId ? "Edit expense" : "Log a general expense"}
                  </p>
                  {editingId && (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      Editing entry #{editingId}
                    </span>
                  )}
                </div>
                <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-3">
                  <select
                    name="expense_master_id"
                    value={expenseForm.expense_master_id}
                    onChange={handleExpenseFormChange}
                    className="p-2 flex-1 border border-gray-300 text-gray-700 bg-white rounded-sm outline-none text-sm"
                  >
                    <option value="">Select expense type</option>
                    {expenseOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={expenseForm.amount}
                    onChange={handleExpenseFormChange}
                    className="p-2 sm:w-40 border border-gray-300 text-gray-700 bg-white rounded-sm outline-none text-sm"
                  />
                  <input
                    type="date"
                    name="expense_date"
                    value={expenseForm.expense_date}
                    onChange={handleExpenseFormChange}
                    className="p-2 sm:w-44 border border-gray-300 text-gray-700 bg-white rounded-sm outline-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`px-5 py-2 rounded-sm shadow font-bold text-sm text-white disabled:opacity-60 whitespace-nowrap ${
                        editingId
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      {saving
                        ? editingId
                          ? "Updating..."
                          : "Adding..."
                        : editingId
                        ? "Update"
                        : "+ Add"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-sm text-sm font-semibold hover:bg-gray-100 whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Expenses table */}
            <div className="p-1 mx-4 mb-5">
              <p className="text-sm font-bold text-gray-900 mb-2 px-1">
                {isLifetime ? "All expenses (lifetime)" : "Expenses in range"}
              </p>
              <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
                <div className="overflow-x-auto overflow-y-auto max-h-[300px] custom-scroll">
                  <table className="w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-900 text-xs">
                      <tr>
                        <th className="py-3 px-5 w-10">#</th>
                        <th className="py-3 px-4">Expense Name</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400">
                            Loading...
                          </td>
                        </tr>
                      )}
                      {!loading && error && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-red-500">
                            {error}
                          </td>
                        </tr>
                      )}
                      {!loading && !error && expenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400">
                            {isLifetime ? "No expenses logged yet." : "No expenses logged for this range."}
                          </td>
                        </tr>
                      )}
                      {!loading &&
                        !error &&
                        expenses.map((exp, i) => (
                          <tr
                            key={exp.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              editingId === exp.id ? "bg-orange-50" : ""
                            }`}
                          >
                            <td className="py-3 px-5">{i + 1}</td>
                            <td className="py-3 px-4 font-semibold text-gray-900">
                              {exp.expense_name}
                            </td>
                            <td className="py-3 px-4">{exp.expense_date}</td>
                            <td className="py-3 px-4">{fmt(exp.amount)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditExpense(exp)}
                                  title="Edit"
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 border border-blue-200"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExpense(exp)}
                                  disabled={deletingId === exp.id}
                                  title="Delete"
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-50"
                                >
                                  {deletingId === exp.id ? (
                                    <i className="bi bi-hourglass-split"></i>
                                  ) : (
                                    <i className="bi bi-trash"></i>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Projects table */}
            <div className="p-1 mx-4 mb-8">
              <p className="text-sm font-bold text-gray-900 mb-2 px-1">
                {isLifetime ? "All projects (lifetime)" : "Projects in range"}
              </p>
              <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
                <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scroll">
                  <table className="w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-900 text-xs">
                      <tr>
                        <th className="py-3 px-5 w-10">#</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Quotation No</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Net Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-400">
                            Loading...
                          </td>
                        </tr>
                      )}
                      {!loading && error && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-red-500">
                            {error}
                          </td>
                        </tr>
                      )}
                      {!loading && !error && projects.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-400">
                            {isLifetime
                              ? "No projects with net revenue found."
                              : "No projects with net revenue in this range."}
                          </td>
                        </tr>
                      )}
                      {!loading &&
                        !error &&
                        projects.map((p, i) => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-5">{i + 1}</td>
                            <td className="py-3 px-4 font-semibold text-gray-900">
                              {p.company_name}
                            </td>
                            <td className="py-3 px-4">{p.customer_name}</td>
                            <td className="py-3 px-4">{p.quotation_no}</td>
                            <td className="py-3 px-4">{p.quotation_date}</td>
                            <td className="py-3 px-4">{fmt(p.net_revenue_amount)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "analytics" && (
          <div className="mx-4 mb-8">
            {analyticsLoading && !analytics && (
              <div className="text-center py-16 text-gray-400">Loading analytics...</div>
            )}

            {analytics && (
              <>
                {/* Top mini stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Profit margin</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.profitMargin}%</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {isLifetime ? "Revenue trend" : "Revenue vs last period"}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        analytics.revenueChangePct >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {analytics.revenueChangePct >= 0 ? "+" : ""}
                      {analytics.revenueChangePct}%
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {isLifetime ? "Expense trend" : "Expense vs last period"}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        analytics.expenseChangePct > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {analytics.expenseChangePct >= 0 ? "+" : ""}
                      {analytics.expenseChangePct}%
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Avg daily expense</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {fmt(analytics.avgDailyExpense)}
                    </p>
                  </div>
                </div>

                {/* Amount vs Architecture Net vs Expense Net vs General Expense — trend chart */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 mb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-bold text-gray-900">
                      Quat Amount vs Expense vs Architecture Amount vs Gen Expense
                    </p>
                    {/* Weekly / Monthly / Yearly toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                      {[
                        { key: "weekly", label: "Weekly" },
                        { key: "monthly", label: "Monthly" },
                        { key: "yearly", label: "Yearly" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setChartPeriod(opt.key)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
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
                            amount: "Quat Amount",
                            expense_net: "Expense",
                            architecture_net: "Architecture Amount",
                            expense: "Gen Expense",
                          };
                          return labels[value] || value;
                        }}
                      />
                      <Bar dataKey="amount" name="Quat Amount" fill={TREND_COLORS.amount} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense_net" name="Expense" fill={TREND_COLORS.expense_net} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="architecture_net" name="Architecture Amount" fill={TREND_COLORS.architecture_net} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Gen Expense" fill={TREND_COLORS.expense} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  {/* Donut: expense breakdown */}
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                    <p className="text-sm font-bold text-gray-900 mb-3">Expense breakdown by type</p>
                    {analytics.expenseBreakdown.length === 0 ? (
                      <p className="text-center text-gray-400 py-10 text-sm">No expenses in range.</p>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={220}>
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
                        <div className="flex flex-wrap gap-3 justify-center mt-2">
                          {analytics.expenseBreakdown.map((e, i) => {
                            const total = analytics.expenseBreakdown.reduce((s, x) => s + x.amount, 0);
                            const pct = total > 0 ? Math.round((e.amount / total) * 100) : 0;
                            return (
                              <span key={i} className="text-xs text-gray-600 flex items-center gap-1">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                                ></span>
                                {e.name} {pct}%
                              </span>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Top categories + top projects */}
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                    <p className="text-sm font-bold text-gray-900 mb-3">Top expense categories</p>
                    {analytics.topExpenseCategories.length === 0 ? (
                      <p className="text-gray-400 text-sm mb-4">No data.</p>
                    ) : (
                      <ul className="mb-4 space-y-1">
                        {analytics.topExpenseCategories.map((c, i) => (
                          <li key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {i + 1}. {c.name}
                            </span>
                            <span className="font-semibold text-gray-900">{fmt(c.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="text-sm font-bold text-gray-900 mb-3">Top projects by revenue</p>
                    {analytics.topProjects.length === 0 ? (
                      <p className="text-gray-400 text-sm">No data.</p>
                    ) : (
                      <ul className="space-y-1">
                        {analytics.topProjects.map((p, i) => (
                          <li key={i} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {i + 1}. {p.name}
                            </span>
                            <span className="font-semibold text-gray-900">{fmt(p.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Budget tracking */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
                  <p className="text-sm font-bold text-gray-900 mb-4">Budget tracking</p>
                  <div className="space-y-4">
                    {analytics.budgetTracking
                      .filter((b) => b.budget != null)
                      .map((b, i) => {
                        const pct = b.budget > 0 ? Math.min(100, (b.spent / b.budget) * 100) : 0;
                        const over = b.spent >= b.budget;
                        return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{b.name}</span>
                              <span className="text-gray-900 font-medium">
                                {fmt(b.spent)} / {fmt(b.budget)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${over ? "bg-orange-500" : "bg-green-600"}`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            {over && (
                              <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                <i className="bi bi-exclamation-triangle"></i> Budget limit reached
                              </p>
                            )}
                          </div>
                        );
                      })}
                    {analytics.budgetTracking.filter((b) => b.budget != null).length === 0 && (
                      <p className="text-gray-400 text-sm">
                        No budget limits set yet for any expense type.
                      </p>
                    )}

                  </div>
                </div>
              </> 
            )}
          </div>
        )}  
      </div>
    </>
  );
}