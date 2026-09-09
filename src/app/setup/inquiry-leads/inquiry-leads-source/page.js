"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";
import {
  User,
  ToggleLeft,
  RotateCcw,
  Filter,
  ChevronDown,
  Plus,
  Pencil,
  X,
  Save,
  Tag,
  Target,
} from "lucide-react";

export default function Page() {
  useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const getHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // ─── State ───────────────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formAllowCategorySelection, setFormAllowCategorySelection] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (search = "", status = "") => {
      try {
        const params = {};
        if (search) params.search2 = search;
        if (status) params.status = status;
        const res = await axios.get(`${API_BASE}/api/inquiry-lead-source/read`, {
          params,
          headers: getHeaders(),
        });
        setData(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    },
    [API_BASE, getHeaders]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(name, statusFilter), 300);
    return () => clearTimeout(t);
  }, [name, statusFilter, fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [name, statusFilter, itemsPerPage]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormName("");
    setFormAllowCategorySelection(false);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormAllowCategorySelection(item.allow_category_selection === 1);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formName,
      allow_category_selection: formAllowCategorySelection ? 1 : 0,
    };
    try {
      setIsSubmitting(true);
      if (editId) {
        await axios.put(
          `${API_BASE}/api/inquiry-lead-source/update/${editId}`,
          payload,
          { headers: getHeaders() }
        );
        toast.success("Updated successfully");
      } else {
        await axios.post(
          `${API_BASE}/api/inquiry-lead-source/insert`,
          payload,
          { headers: getHeaders() }
        );
        toast.success("Inserted successfully");
      }
      resetForm();
      fetchData(name, statusFilter);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Error saving data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(
        `${API_BASE}/api/inquiry-lead-source/status/${id}`,
        { status: currentStatus === 1 ? 0 : 1 },
        { headers: getHeaders() }
      );
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: currentStatus === 1 ? 0 : 1 } : item
        )
      );
      toast.success("Status updated successfully");
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  // ─── Pagination ──────────────────────────────────────────────────────────
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const getSlidingPages = () => {
    const visible = 5;
    if (totalPages <= visible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = currentPage - Math.floor(visible / 2);
    let end = currentPage + Math.floor(visible / 2);
    if (start < 1) { start = 1; end = visible; }
    if (end > totalPages) { end = totalPages; start = totalPages - visible + 1; }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <div className="bg-gray-100 min-h-screen">

        {/* Breadcrumb + Add button */}
        <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
            <p className="flex items-center flex-wrap">
              <Link href="/dashboard" className="mx-2 text-xl text-gray-400 hover:text-indigo-600">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="/setup" className="mx-2 text-md text-gray-700 hover:text-indigo-600">Setup</Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <span className="mx-2">Inquiry / Lead</span>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <span className="mx-2 font-semibold text-indigo-600">Inquiry / Lead Source</span>
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto text-white px-5 py-2 rounded-sm shadow font-bold text-sm bg-gradient-to-br from-indigo-500 to-violet-600"
            >
              + Add Inquiry / Lead Source
            </button>
          </div>
        </div>

        {/* Mobile filter toggle */}
        <div className="mx-6 md:hidden mt-3 relative z-40">
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between text-indigo-600 font-semibold bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" strokeWidth={2} /> Filters
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Filters */}
        <div className={`${showMobileFilters ? "absolute left-6 right-6 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} md:mx-6 md:flex md:flex-wrap md:items-center md:gap-3 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto`}>
          <div className="relative w-full md:w-56">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none" strokeWidth={2} />
            <input
              type="text"
              placeholder="Enter Inquiry / Lead Source"
              className="w-full pl-9 pr-3 py-2.5 border border-indigo-400 bg-white rounded-sm outline-none text-gray-700 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="relative w-full md:w-48">
            <ToggleLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" strokeWidth={2} />
            <select
              className={`w-full pl-9 pr-3 py-2.5 border border-indigo-400 bg-white rounded-sm outline-none text-sm appearance-none ${statusFilter === "" ? "text-gray-400" : "text-gray-700"}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2 col-span-2 md:col-auto">
            <button
              type="button"
              onClick={() => { setName(""); setStatusFilter(""); setShowMobileFilters(false); fetchData(); }}
              className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-4 py-2.5 bg-indigo-100 text-indigo-600 text-sm font-semibold"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2} /> Clear Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <form className="p-1 mx-5 pt-3.5">
          <div className="overflow-x-auto overflow-y-auto max-h-full custom-scroll bg-white shadow-md rounded-sm p-2 border border-gray-200">
            <table className="w-full text-sm text-left text-gray-700 border-collapse whitespace-nowrap">
              <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  <th className="py-3 px-4 text-left">Source Name</th>
                  <th className="py-3 px-4 text-center">Sales Category Mode</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2 px-4 text-gray-400 text-xs font-medium text-center">
                      {(currentPage - 1) * itemsPerPage + i + 1}
                    </td>
                    <td className="py-2 px-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-2 px-4 text-center">
                      {item.allow_category_selection === 1 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          <Target size={11} /> Allow Category Selection
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Auto Assign
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={item.status === 1}
                          onChange={() => handleToggleStatus(item.id, item.status)}
                        />
                        <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.status === 1 ? "bg-blue-500" : "bg-gray-300"}`}>
                          <div className={`absolute top-1 left-1 w-4 h-3 bg-white rounded-full transition-all duration-300 ${item.status === 1 ? "translate-x-6" : "translate-x-1"}`}></div>
                        </div>
                      </label>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="text-blue-500"
                        title="Edit"
                      >
                        <i className="bi bi-pencil-square text-md"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {currentData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No records found</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
              <p className="text-sm font-semibold text-slate-800">
                Showing {data.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, data.length)} of {data.length} entries
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 font-medium">Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm text-indigo-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    {[10, 20, 100, 200].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                      <i className="bi bi-chevron-left text-sm"></i>
                    </button>
                    {getSlidingPages().map((page) => (
                      <button type="button" key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page ? "bg-[#212121] text-white shadow-md" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {page}
                      </button>
                    ))}
                    <button type="button" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                      <i className="bi bi-chevron-right text-sm"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Add / Edit modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                    {editId ? <Pencil className="w-5 h-5 text-white" strokeWidth={2} /> : <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      {editId ? "Edit" : "Add"} Inquiry / Lead Source
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {editId ? "Update the source details" : "Fill in details to create a new source"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {/* Name */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-600">
                    Source Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <Tag className="w-4 h-4 text-violet-500" strokeWidth={2} />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter source name"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Sales Category Mode */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600">
                    Sales Category Mode
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${!formAllowCategorySelection ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name="salesCategoryMode"
                        checked={!formAllowCategorySelection}
                        onChange={() => setFormAllowCategorySelection(false)}
                        className="mt-0.5 accent-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Auto Assign</p>
                        <p className="text-xs text-gray-500 mt-0.5">Strategy category is automatically determined from the source mapping. No selection required from the salesperson.</p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formAllowCategorySelection ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name="salesCategoryMode"
                        checked={formAllowCategorySelection}
                        onChange={() => setFormAllowCategorySelection(true)}
                        className="mt-0.5 accent-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                          <Target size={13} className="text-indigo-500" /> Allow Category Selection
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">The salesperson will be required to select the Sales Strategy Category when this source is used. Only mapped categories will be shown.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 bg-white"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                        <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <>
                        <Save className="w-4 h-4" strokeWidth={2} />
                        {editId ? "Update" : "Save"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
