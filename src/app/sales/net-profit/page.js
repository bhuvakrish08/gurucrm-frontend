"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const NetProfitAPI = `${API_BASE}/api/net-profit`;
const ExpenseMasterAPI = `${API_BASE}/api/general-expense-master`;

function getDefaultRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(first), to: iso(last) };
}

const EMPTY_EXPENSE_FORM = {
  expense_master_id: "",
  amount: "",
  expense_date: "",
};

export default function NetProfitPage() {
  const [range, setRange] = useState(getDefaultRange());
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

  const fmt = (n) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

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

  // ---------- Fetch net profit for selected range ----------
  const fetchNetProfit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      const res = await fetch(`${NetProfitAPI}?${params.toString()}`);
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
  }, [range.from, range.to]);

  useEffect(() => {
    fetchExpenseOptions();
  }, [fetchExpenseOptions]);

  useEffect(() => {
    fetchNetProfit();
  }, [fetchNetProfit]);

  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setRange((prev) => ({ ...prev, [name]: value }));
  };

  const applyThisMonth = () => {
    setRange(getDefaultRange());
  };

  const handleExpenseFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- Log a new general expense entry ----------
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
      const res = await fetch(`${NetProfitAPI}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to log expense");
      }

      setExpenseForm({ ...EMPTY_EXPENSE_FORM, expense_date: range.to });
      fetchNetProfit();
    } catch (err) {
      toast.error(err.message || "Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="bg-gray-100">
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              name="from"
              value={range.from}
              onChange={handleRangeChange}
              className="p-2 border border-orange-300 text-gray-700 bg-white rounded-sm outline-none text-sm"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              name="to"
              value={range.to}
              onChange={handleRangeChange}
              className="p-2 border border-orange-300 text-gray-700 bg-white rounded-sm outline-none text-sm"
            />
            <button
              type="button"
              onClick={applyThisMonth}
              className="border border-gray-300 rounded-sm px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold whitespace-nowrap"
            >
              This month
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mx-4 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Net Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {fmt(netRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">General Expense</p>
            <p className="text-2xl font-bold text-gray-900">
              {fmt(totalExpense)}
            </p>
          </div>
          <div className="bg-orange-50 rounded-2xl shadow-md border border-orange-200 p-4">
            <p className="text-xs text-orange-600 mb-1">Net Profit</p>
            <p className="text-2xl font-bold text-orange-600">
              {fmt(netProfit)}
            </p>
          </div>
        </div>

        {/* Add expense form */}
        <div className="mx-4 mb-5">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
            <p className="text-sm font-bold text-gray-900 mb-3">
              Log a general expense
            </p>
            <form
              onSubmit={handleAddExpense}
              className="flex flex-col sm:flex-row gap-3"
            >
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
              <button
                type="submit"
                disabled={saving}
                className="bg-orange-500 text-white px-5 py-2 rounded-sm shadow hover:bg-orange-600 font-bold text-sm disabled:opacity-60"
              >
                {saving ? "Adding..." : "+ Add"}
              </button>
            </form>
          </div>
        </div>

        {/* Expenses table */}
        <div className="p-1 mx-4 mb-5">
          <p className="text-sm font-bold text-gray-900 mb-2 px-1">
            Expenses in range
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
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-8 text-gray-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-red-500">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && expenses.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-8 text-gray-400"
                      >
                        No expenses logged for this range.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    expenses.map((exp, i) => (
                      <tr
                        key={exp.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-5">{i + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {exp.expense_name}
                        </td>
                        <td className="py-3 px-4">{exp.expense_date}</td>
                        <td className="py-3 px-4">{fmt(exp.amount)}</td>
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
            Projects in range
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
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-400"
                      >
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
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-400"
                      >
                        No projects with net revenue in this range.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    projects.map((p, i) => (
                      <tr
                        key={p.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-5">{i + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {p.company_name}
                        </td>
                        <td className="py-3 px-4">{p.customer_name}</td>
                        <td className="py-3 px-4">{p.quotation_no}</td>
                        <td className="py-3 px-4">{p.quotation_date}</td>
                        <td className="py-3 px-4">
                          {fmt(p.net_revenue_amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
