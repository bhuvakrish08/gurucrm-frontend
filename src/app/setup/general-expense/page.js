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
  // ✅ NEW: delete-confirmation popup state (replaces window.confirm)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [showModal, setShowModal] = useState(false);
  // ✅ NEW: slide visibility flag — right-side slide-in/out for the Add/Edit drawer
  const [modalPanelVisible, setModalPanelVisible] = useState(false);

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

  // ✅ NEW: Add/Edit drawer slide-in trigger
  useEffect(() => {
    if (showModal) {
      const t = setTimeout(() => setModalPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showModal]);

  // ✅ NEW: Delete-confirmation popup fade/scale-in trigger
  useEffect(() => {
    if (deleteTarget) {
      const t = setTimeout(() => setDeleteModalVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [deleteTarget]);

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

  const indexOfFirstItem = (currentPage - 1) * rowsPerPage;
  const indexOfLastItem = indexOfFirstItem + rowsPerPage;

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

  // ✅ CHANGED: animated close — slide-out first (300ms), then reset
  // form fields, editingId, and hide the drawer (same end-state as before).
  const handleCancelEdit = () => {
    setModalPanelVisible(false);
    setTimeout(() => {
      resetForm();
      setShowModal(false);
    }, 300);
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
      setModalPanelVisible(false);
      setTimeout(() => {
        resetForm();
        setShowModal(false);
      }, 300);
      fetchList();
    } catch (err) {
      toast.error(err.message || "Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  // ✅ CHANGED: no more window.confirm — this just opens the delete popup
  const handleDelete = (item) => {
    setDeleteTarget(item);
  };

  // ✅ NEW: animated close for the delete popup
  const closeDeleteConfirm = () => {
    setDeleteModalVisible(false);
    setTimeout(() => setDeleteTarget(null), 200);
  };

  // ✅ NEW: actual delete API call, fired from the "Delete Expense Type" button in the popup
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const item = deleteTarget;
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
      closeDeleteConfirm();
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
              href="#"
              className="mx-2 text-md text-gray-700 hover:text-indigo-600"
            >
             Settings
            </Link>
            <i className="bi bi-chevron-right text-[10px]"></i>
            <Link
              href="#"
              className="mx-2 text-md text-gray-700 hover:text-indigo-600"
            >
            Gen. Expense Master
            </Link>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
  className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              + Add New Expense Type
            </button>
          </div>
        </div>

        {/* ✅ Filter row — image-2 style: bordered icon-boxed inputs + indigo "Clear Filter" button */}
        <div className="mx-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-3 py-2 w-full sm:w-56">
            <i className="bi bi-tag text-blue-500 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter Name"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
            />
          </div>

         
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            className="border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
            >
              <option value="">Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
         
            <select
              value={recurringFilter}
              onChange={(e) => setRecurringFilter(e.target.value)}
            className="border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
            >
              <option value="">Recurring</option>
              <option value="1">Recurring</option>
              <option value="0">One-time</option>
            </select>

          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center justify-center gap-2 cursor-pointer rounded-sm px-4 py-2 bg-indigo-100 text-indigo-600 text-sm text-center font-semibold transition-colors"
          >
            <i className="bi bi-arrow-counterclockwise"></i> Clear Filter
          </button>
        </div>

        {/* ✅ List — image-2 style table: indigo header w/ sort icons, rounded pill badges, hover highlight */}
        <div className="mx-4 mb-8 bg-white rounded-sm shadow-sm border border-gray-200 p-4">
          <div className="overflow-x-auto rounded-sm border border-gray-100">
            <table className="w-full text-sm text-left text-gray-700 border-collapse whitespace-nowrap">
              <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4">
                    Name <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                  </th>
                  <th className="py-3 px-4">Recurring</th>
                  <th className="py-3 px-4">
                    Budget Limit{" "}
                    <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                  </th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                      className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${
                        editingId === item.id ? "bg-orange-50" : ""
                      }`}
                    >
                      <td className="py-2 px-4 text-gray-400 text-xs font-medium text-center">
                        {(currentPage - 1) * rowsPerPage + i + 1}
                      </td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-2 px-4">
                        {item.is_recurring ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                            Recurring
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                            One-time
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 font-semibold text-slate-800">
                        {item.budget_limit != null ? fmt(item.budget_limit) : "-"}
                      </td>
                      <td className="py-2 px-4 text-gray-500">{durationLabel(item)}</td>

                      <td className="py-2 px-4">
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

                      <td className="py-2 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                                    className="w-8 h-8 flex items-center justify-center rounded-md  text-blue-600  cursor-pointer transition-colors p-0"
                          >
                                    <i className="bi bi-pencil-square text-sm"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            title="Delete"
                                    className="w-8 h-8 flex items-center justify-center rounded-md text-red-500  cursor-pointer transition-colors p-0"
                          >
                            {deletingId === item.id ? (
                              <i className="bi bi-hourglass-split text-sm"></i>
                            ) : (
                                    <i className="bi bi-trash3 text-sm"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Pagination — image-3 style: "Showing X to Y entries" (left) + indigo "Rows per page" (right) */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-gray-200">
            <p className="text-sm font-semibold text-slate-800">
              Showing {list.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, list.length)} entries
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-indigo-300 rounded-md px-2 py-1.5 text-sm text-indigo-600 font-semibold outline-none focus:ring-2 focus:ring-indigo-100 bg-white cursor-pointer"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
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
      </div>

      {/* ✅ Add/Edit Expense Type — right-side slide-in/out drawer, indigo-violet theme (image-2 style) */}
      {showModal && (
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            modalPanelVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleCancelEdit}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white h-full w-full sm:max-w-[620px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
              modalPanelVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* ── Header (gradient icon box + title + subtitle) ── */}
            <div className="bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                    <i
                      className={`bi ${editingId ? "bi-pencil-square" : "bi-receipt"} text-white text-lg`}
                    ></i>
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      {editingId ? "Edit Expense Type" : "Add New Expense Type"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {editingId
                        ? `Editing entry #${editingId}`
                        : "Create a new expense category"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  title="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                >
                  <i className="bi bi-x-lg text-sm"></i>
                </button>
              </div>
              <div className="h-1 w-full bg-gray-100">
                <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-600"></div>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5">
              {/* Section 1: Basic Info */}
              <div className="mb-5">
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <i className="bi bi-tag-fill"></i> Basic Details
                </p>

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Expense Type Name <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-stretch border rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all ${
                      formErrors.name ? "border-red-400" : "border-gray-200"
                    }`}
                  >
                    <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                      <i className="bi bi-tag text-blue-500"></i>
                    </span>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Salary of Employees"
                      value={form.name}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
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
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    form.is_recurring ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <span
                      className={`flex items-center justify-center w-9 h-9 rounded-md shrink-0 ${
                        form.is_recurring ? "bg-violet-100" : "bg-gray-100"
                      }`}
                    >
                      <i
                        className={`bi bi-arrow-repeat ${
                          form.is_recurring ? "text-violet-600" : "text-gray-400"
                        }`}
                      ></i>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Recurring expense</p>
                      <p className="text-[11px] text-gray-500">Repeats every cycle vs one-time</p>
                    </div>
                  </div>
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                      form.is_recurring ? "bg-indigo-600" : "bg-gray-300"
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
                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <i className="bi bi-wallet2"></i> Budget and Duration
                </p>

                <div className="mb-4">
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Budget Limit <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                      <i className="bi bi-currency-rupee text-emerald-500"></i>
                    </span>
                    <input
                      type="number"
                      name="budget_limit"
                      placeholder="0"
                      value={form.budget_limit}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-1">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Start Date
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <i className="bi bi-calendar3 text-cyan-500"></i>
                      </span>
                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      End Date
                    </label>
                    <div
                      className={`flex items-stretch border rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all ${
                        formErrors.end_date ? "border-red-400" : "border-gray-200"
                      }`}
                    >
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <i className="bi bi-calendar3 text-amber-500"></i>
                      </span>
                      <input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
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

              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white disabled:opacity-60"
                >
                  <i className="bi bi-x-lg text-xs"></i> Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
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
            </form>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation — centered popup, red destructive theme (image-1 style) */}
      {deleteTarget && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 transition-opacity duration-200 ease-in-out ${
            deleteModalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeDeleteConfirm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-full max-w-sm rounded-sm shadow-2xl overflow-hidden transform transition-all duration-200 ease-in-out ${
              deleteModalVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-sm bg-red-50 flex items-center justify-center shrink-0">
                  <i className="bi bi-trash text-red-600 text-sm"></i>
                </span>
                <h2 className="text-sm font-extrabold text-gray-900 tracking-wide uppercase">
                  Delete Expense Type
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                title="Close"
                className="w-7 h-7 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition-all shrink-0"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pt-6 pb-5 text-center">
              <span className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-trash text-red-500 text-3xl"></i>
              </span>
              <h3 className="text-lg font-extrabold text-gray-900 uppercase">
                {deleteTarget.name}
              </h3>
              <span className="block w-10 h-0.5 bg-red-500 mx-auto mt-2 mb-4"></span>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this expense type?
              </p>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deletingId === deleteTarget.id}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-indigo-600 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <i className="bi bi-x-lg text-xs"></i> Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === deleteTarget.id}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500  text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
              >
                {deletingId === deleteTarget.id ? (
                  <>
                    <i className="bi bi-hourglass-split text-xs"></i> Deleting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash text-xs"></i> Delete Expense
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