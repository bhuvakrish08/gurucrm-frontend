"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const ExpenseMasterAPI = `${API_BASE}/api/general-expense-master`;

const EMPTY_FORM = {
  name: "",
  status: "1",
  is_recurring: false,
  budget_limit: "",
  start_date: "",
  end_date: "",
};

const PAGE_WINDOW = 5;

export default function GeneralExpenseMasterPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showModal, setShowModal] = useState(false);

  const fmt = (n) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("searchName", search);
      if (statusFilter) params.set("status", statusFilter);
      if (recurringFilter) params.set("is_recurring", recurringFilter);
      const res = await fetch(`${ExpenseMasterAPI}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load expense types");
      const data = await res.json();
      setList(data.data || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, recurringFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setRecurringFilter("");
  };

  const totalPages = Math.max(1, Math.ceil(list.length / rowsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return list.slice(start, start + rowsPerPage);
  }, [list, currentPage, rowsPerPage]);

  const pageNumbers = useMemo(() => {
    let start = Math.max(1, currentPage - Math.floor(PAGE_WINDOW / 2));
    let end = Math.min(totalPages, start + PAGE_WINDOW - 1);
    start = Math.max(1, end - PAGE_WINDOW + 1);
    const arr = [];
    for (let p = start; p <= end; p++) arr.push(p);
    return arr;
  }, [currentPage, totalPages]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFormErrors((prev) => (prev[name] ? { ...prev, [name]: null } : prev));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormErrors({});
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormErrors({});
    setForm({
      name: item.name || "",
      status: String(item.status ?? "1"),
      is_recurring: Boolean(item.is_recurring),
      budget_limit: item.budget_limit ?? "",
      start_date: item.start_date ? item.start_date.slice(0, 10) : "",
      end_date: item.end_date ? item.end_date.slice(0, 10) : "",
    });
    setShowModal(true);
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowModal(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name enter karo";
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      errs.end_date = "End date, start date thi pachi hovi joiye";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      const url = isEdit ? `${ExpenseMasterAPI}/${editingId}` : `${ExpenseMasterAPI}/insert`;
      const payload = {
        name: form.name.trim(),
        status: form.status,
        is_recurring: form.is_recurring,
        budget_limit: form.budget_limit ? Number(form.budget_limit) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save expense type");
      }
      toast.success(isEdit ? "Expense type updated" : "Expense type added");
      resetForm();
      setShowModal(false);
      fetchList();
    } catch (err) {
      toast.error(err.message || "Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete "${item.name}"?`);
    if (!confirmed) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(`${ExpenseMasterAPI}/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete");
      toast.success("Expense type deleted");
      if (editingId === item.id) {
        resetForm();
        setShowModal(false);
      }
      fetchList();
    } catch (err) {
      toast.error(err.message || "Something went wrong while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = String(item.status) === "1" ? "0" : "1";
    try {
      const res = await fetch(`${ExpenseMasterAPI}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update status");
      toast.success();
      fetchList();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const durationLabel = (item) => {
    if (!item.start_date || !item.end_date) return "No duration set";
    return `${item.start_date.slice(0, 10)} → ${item.end_date.slice(0, 10)}`;
  };

  return (
    <>
      <Header />
      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb + Add button */}
        <div className="bg-white w-full shadow-sm p-3 mt-1 mb-5 flex items-center justify-between flex-wrap gap-2">
          <p className="flex items-center flex-wrap text-gray-700">
            <Link href="/dashboard" className="mx-2 text-xl text-gray-400 hover:text-indigo-600">
              <i className="bi bi-house"></i>
            </Link>
            <i className="bi bi-chevron-right text-[10px]"></i>
            <Link
              href="/sales/projects/net-profit"
              className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
            >
              Net Profit
            </Link>
            <i className="bi bi-chevron-right text-[10px]"></i>
            <span className="mx-2 text-md text-gray-700 font-semibold">General Expense Master</span>
          </p>

          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:border-orange-400 bg-white w-52"
              />
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm whitespace-nowrap"
            >
              + Add New Expense Type
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="mx-4 mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter Name"
            className="px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:border-orange-400 bg-white w-48"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:border-orange-400 bg-white w-40"
          >
            <option value="">Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
          <select
            value={recurringFilter}
            onChange={(e) => setRecurringFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:border-orange-400 bg-white w-40"
          >
            <option value="">Recurring</option>
            <option value="1">Recurring</option>
            <option value="0">One-time</option>
          </select>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Clear
          </button>
        </div>

        {/* List */}
        <div className="mx-4 mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="py-3 px-3 w-10">#</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Recurring</th>
                  <th className="py-3 px-3">Budget Limit</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-red-500">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && paginatedList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      <i className="bi bi-receipt-cutoff text-2xl mb-1 block"></i>
                      No expense types found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  paginatedList.map((item, i) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        editingId === item.id ? "bg-orange-50" : ""
                      }`}
                    >
                      <td className="py-3 px-3">{(currentPage - 1) * rowsPerPage + i + 1}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900">{item.name}</td>
                      <td className="py-3 px-3">
                        {item.is_recurring ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Recurring
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">One-time</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-900">
                        {item.budget_limit != null ? fmt(item.budget_limit) : "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-500">{durationLabel(item)}</td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={String(item.status) === "1"}
                          onClick={() => handleToggleStatus(item)}
                          title={
                            String(item.status) === "1"
                              ? "Active — click to deactivate"
                              : "Inactive — click to activate"
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            String(item.status) === "1" ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                            style={{
                              transform:
                                String(item.status) === "1" ? "translateX(18px)" : "translateX(2px)",
                            }}
                          />
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                            className="w-8 h-8 flex items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 border border-blue-200"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            title="Delete"
                            className="w-8 h-8 flex items-center justify-center rounded-full text-red-600 hover:bg-red-50 border border-red-200 disabled:opacity-50"
                          >
                            {deletingId === item.id ? (
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

          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 disabled:opacity-40"
                >
                  <i className="bi bi-chevron-left text-xs"></i>
                </button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-semibold ${
                      p === currentPage
                        ? "bg-black text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 disabled:opacity-40"
                >
                  <i className="bi bi-chevron-right text-xs"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Modal — redesigned, orange theme */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelEdit();
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                  <i className={editingId ? "bi bi-pencil-square" : "bi bi-receipt"}></i>
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">
                    {editingId ? "Edit Expense Type" : "Add New Expense Type"}
                  </p>
                  <p className="text-orange-50 text-xs mt-0.5">
                    {editingId ? `Editing entry #${editingId}` : "Create a new expense category"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                title="Close"
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/90 hover:bg-white/20 transition-colors"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 flex-1">
              {/* Section 1: Basic Info */}
              <div className="mb-5">
                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <i className="bi bi-tag-fill"></i> Basic Details
                </p>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Expense Type Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Salary of Employees"
                    value={form.name}
                    onChange={handleFormChange}
                    className={`p-3 w-full border-2 text-gray-800 bg-gray-50 rounded-xl outline-none text-sm transition-colors focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100 ${
                      formErrors.name ? "border-red-400" : "border-gray-200"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                      <i className="bi bi-exclamation-circle"></i> {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Recurring toggle card */}
                <button
                  type="button"
                  onClick={() =>
                    handleFormChange({
                      target: { name: "is_recurring", type: "checkbox", checked: !form.is_recurring },
                    })
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
                    form.is_recurring ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <i
                      className={`bi bi-arrow-repeat text-lg ${
                        form.is_recurring ? "text-orange-500" : "text-gray-400"
                      }`}
                    ></i>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Recurring expense</p>
                      <p className="text-[11px] text-gray-500">Repeats every cycle vs one-time</p>
                    </div>
                  </div>
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                      form.is_recurring ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className="inline-block rounded-full bg-white shadow transition-transform"
                      style={{
                        width: 18,
                        height: 18,
                        transform: form.is_recurring ? "translateX(22px)" : "translateX(3px)",
                      }}
                    />
                  </span>
                </button>
              </div>

              {/* Section 2: Budget & Duration */}
              <div className="mb-2">
                <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <i className="bi bi-wallet2"></i> Budget and duration
                </p>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Budget Limit <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="budget_limit"
                      placeholder="0"
                      value={form.budget_limit}
                      onChange={handleFormChange}
                      className="p-3 pl-8 w-full border-2 border-gray-200 text-gray-800 bg-gray-50 rounded-xl outline-none text-sm transition-colors focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleFormChange}
                      className="p-3 w-full border-2 border-gray-200 text-gray-800 bg-gray-50 rounded-xl outline-none text-sm transition-colors focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleFormChange}
                      className={`p-3 w-full border-2 text-gray-800 bg-gray-50 rounded-xl outline-none text-sm transition-colors focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-100 ${
                        formErrors.end_date ? "border-red-400" : "border-gray-200"
                      }`}
                    />
                    {formErrors.end_date && (
                      <p className="text-[11px] text-red-500 mt-1.5">{formErrors.end_date}</p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1">
                  <i className="bi bi-info-circle mt-0.5"></i>
                  Duration set karva thi budget_limit fakt e range ni expenses sathe check thashe.
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3 shrink-0 bg-gray-50">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex-1 border-2 border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={saving}
                className="flex-[2] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl shadow-sm font-semibold text-sm disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <i className="bi bi-hourglass-split"></i>
                    {editingId ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <i className={editingId ? "bi bi-check-lg" : "bi bi-plus-lg"}></i>
                    {editingId ? "Update Expense Type" : "Add Expense Type"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}