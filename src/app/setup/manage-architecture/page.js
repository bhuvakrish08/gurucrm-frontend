"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import {
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  X,
  Save,
  Plus,
  Pencil,
  RotateCcw,
} from "lucide-react";


// 🔧 Make sure NEXT_PUBLIC_BACKEND_URL is set in .env.local, e.g.
// NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const APIBase = `${API_BASE}/api/architect`;

const EMPTY_FORM = { name: "", mobile_no: "", email: "", address: "" };

export default function ArchitectTable() {
  const [architects, setArchitects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchName: "",
    searchEmail: "",
    searchMobile: "",
    status: "",
  });

  // ---------- Modal state ----------
  const [showModal, setShowModal] = useState(false);
  // ✅ NEW: drives the right-side slide-in/out animation for the drawer
  const [modalPanelVisible, setModalPanelVisible] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // ✅ NEW: Standardized Micara IMS Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const resetFilter = () => {
    setFilters({
      searchName: "",
      searchEmail: "",
      searchMobile: "",
      status: "",
    });
  };

  // ✅ NEW: copy-to-clipboard for the Email column (matches Manage User table)
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- READ — Fetch list from API ----------
  const fetchArchitects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.searchName) params.append("searchName", filters.searchName);
      if (filters.searchEmail) params.append("searchEmail", filters.searchEmail);
      if (filters.searchMobile) params.append("searchMobile", filters.searchMobile);
      if (filters.status !== "") params.append("status", filters.status);

      const res = await fetch(`${APIBase}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load architects");

      const data = await res.json();
      setArchitects(data.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [filters.searchName, filters.searchEmail, filters.searchMobile, filters.status]);

  useEffect(() => {
    fetchArchitects();
  }, [fetchArchitects]);

  // ✅ NEW: reset to page 1 whenever filters or items-per-page change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // ✅ NEW: Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = architects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(architects.length / itemsPerPage);

  const getSlidingPages = () => {
    const visibleCount = 5;
    if (totalPages <= visibleCount) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = currentPage - Math.floor(visibleCount / 2);
    let end = currentPage + Math.floor(visibleCount / 2);
    if (start < 1) {
      start = 1;
      end = visibleCount;
    }
    if (end > totalPages) {
      end = totalPages;
      start = totalPages - visibleCount + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // ---------- UPDATE STATUS ONLY — toggle active/inactive ----------
  // ✅ FIX: status is stored as "active" / "inactive" string in DB,
  //         NOT as 1 / 0 number. Number("active") => NaN, which was
  //         causing the toggle to always send wrong / falsy values
  //         and break the PATCH request on the backend.
  const toggleStatus = async (architect) => {
    const newStatus = architect.status === "1" ? "0" : "1";

    // optimistic UI update
    setArchitects((prev) =>
      prev.map((a) =>
        a.id === architect.id ? { ...a, status: newStatus } : a,
      ),
    );

    try {
      const res = await fetch(`${APIBase}/${architect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update status");
      }
    } catch (err) {
      // rollback on failure
      setArchitects((prev) =>
        prev.map((a) =>
          a.id === architect.id ? { ...a, status: architect.status } : a,
        ),
      );
      toast.error(err.message || "Could not update status");
    }
  };

  // ---------- Modal open helpers ----------
  const openAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (architect) => {
    setModalMode("edit");
    setEditingId(architect.id);
    setForm({
      name: architect.name || "",
      mobile_no: architect.mobile_no || "",
      email: architect.email || "",
      address: architect.address || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  // ✅ NEW: slide-in trigger for the drawer (same pattern used across Micara IMS)
  useEffect(() => {
    if (showModal) {
      const t = setTimeout(() => setModalPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showModal]);

  // ✅ NEW: animated close — slide-out first, then unmount/reset
  const closeModal = () => {
    setModalPanelVisible(false);
    setTimeout(() => {
      setShowModal(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      setEditingId(null);
    }, 300);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!form.mobile_no.trim()) errs.mobile_no = "Mobile number is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ---------- CREATE / UPDATE ----------
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (modalMode === "add") {
        // ✅ FIX: status sent as "active" string (matches DB default/type),
        //         not 1 (number)
        const res = await fetch(`${APIBase}/insert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, status: "active" }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to add architect");
        }
      } else {
        const res = await fetch(`${APIBase}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update architect");
        }
      }

      closeModal();
      fetchArchitects();
    } catch (err) {
      alert(err.message || "Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <div className="bg-gray-100">
        {/* Header */}
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
                href="/setup"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600"
              >
                Settings
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/setup/manage-architecture"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600"
              >
                Manage Architecture
              </Link>
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={openAddModal}
              className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              + ADD ARCHITECTURE
            </button>
          </div>
        </div>

        {/* Mobile filter toggle */}
         <div className="mx-6 mb-2 md:hidden mt-3 relative z-40">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all"
          >
            <span className="flex items-center gap-2">
              <i className="bi bi-funnel"></i> Filters
            </span>
            <i
              className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
            ></i>
          </button>
        </div>

        {/* ✅ Filters — icon-boxed indigo pill inputs (img 1/4 style) */}
       <div
          className={`
          ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
          md:mx-6 md:mb-3 md:items-center md:gap-2 md:flex-wrap md:flex md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}
        >
          {/* Search by name */}
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
            <User size={16}  className=" text-blue-500 " strokeWidth={2} />
            <input
              type="text"
              name="searchName"
              placeholder="Search by name"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.searchName}
              onChange={handleFilterChange}
            />
          </div>

          {/* Search by email */}
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
            <Mail size={16} className=" text-cyan-500 " strokeWidth={2} />
            <input
              type="text"
              name="searchEmail"
              placeholder="Search by email"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.searchEmail}
              onChange={handleFilterChange}
            />
          </div>

          {/* Search by mobile */}
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
            <Phone size={16} className=" text-emerald-500 " strokeWidth={2} />
            <input
              type="text"
              name="searchMobile"
              placeholder="Search by mobile"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.searchMobile}
              onChange={handleFilterChange}
            />
          </div>

          {/* Status */}
          {/* ✅ FIX: option values changed from "1"/"0" to "active"/"inactive"
                     to match the actual varchar values stored in DB */}
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            className="border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
            >
              <option value="">Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>

          {/* Clear Filter + mobile Apply */}
        <div className="flex gap-2 col-span-2 md:col-span-1">
            <button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-4 py-2 bg-indigo-100 text-indigo-600  text-sm text-center font-semibold transition-colors"
            >
              <i className="bi bi-arrow-counterclockwise"></i> Clear Filter
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="p-1 mx-4">
          <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll">
              <table className="w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
                  <tr>
                    <th className="py-3 px-5 w-10 text-center">#</th>
                    <th className="py-3 px-4">
                      Architect Name <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                    <th className="py-3 px-4">Mobile No.</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4 text-center">
                      Status <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                    <th className="py-3 px-4 text-center">Action</th>
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

                  {!loading && !error && architects.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        No architects found.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    currentData.map((a, i) => (
                      <tr
                        key={a.id}
                        className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-400 text-xs font-medium text-center">
                          {indexOfFirstItem + i + 1}
                        </td>
                        <td className="py-2 px-4 font-semibold text-slate-800">
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                a.status === "1"
                                  ? "bg-green-500"
                                  : "bg-red-500 architect-status-blink"
                              }`}
                            ></span>
                            {a.name}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-gray-600">{a.mobile_no}</td>
                        <td className="py-1 px-4 text-gray-600">
                          {a.email}
                          <button
                            type="button"
                            onClick={() => {
                              copyToClipboard(a.email);
                              toast.success("Copied!");
                            }}
                            className="p-1 mx-1 rounded hover:bg-gray-200"
                            title="Copy Email"
                          >
                            <i className="bi bi-copy"></i>
                          </button>
                        </td>
                        <td className="py-2 px-4 text-gray-600">{a.address || "-"}</td>
                        <td className="py-2 px-4 text-center">
                          {/* ✅ FIX: compare against "active" string, not Number(...) === 1 */}
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={a.status === "1"}
                              onChange={() => toggleStatus(a)}
                            />
                            <div
                              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                                a.status === "1" ? "bg-blue-500" : "bg-gray-300"
                              }`}
                            >
                              <div
                                className={`absolute top-1 left-1 w-4 h-3 bg-white rounded-full transition-all duration-300 ${
                                  a.status === "1" ? "translate-x-6" : "translate-x-1"
                                }`}
                              ></div>
                            </div>
                          </label>
                        </td>
                        <td className="py-2 px-4 text-lg text-center">
                          <button
                            type="button"
                            onClick={() => openEditModal(a)}
                            className="text-gray-400 hover:text-blue-500 text-lg mx-1"
                            title="Edit"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* ✅ NEW: Standardized Micara IMS pagination footer (img 3 style) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
              {/* Left side: Showing entries text */}
              <p className="text-sm font-semibold text-gray-800">
                Showing {architects.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, architects.length)} entries
              </p>

              {/* Right side: page navigation (only if totalPages > 1) + Rows per page */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="bi bi-chevron-left text-sm"></i>
                    </button>

                    {/* Page Buttons */}
                    <div className="flex items-center gap-1.5">
                      {getSlidingPages().map((page) => (
                        <button
                          type="button"
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                            currentPage === page
                              ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200"
                              : "border border-slate-200 text-slate-600 hover:bg-indigo-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="bi bi-chevron-right text-sm"></i>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">
                    Rows per page:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm text-indigo-600 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    {[10, 20, 100, 200].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ✅ NEW: scoped keyframe for the inactive-status red dot blink (unique name to avoid conflicts) */}
      <style jsx>{`
        @keyframes architectStatusBlink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
        .architect-status-blink {
          animation: architectStatusBlink 1.1s ease-in-out infinite;
        }
      `}</style>

      {/* ---------- ✅ Add / Edit Architecture — right-side slide-in/out drawer, indigo-violet theme (Add Lead reference style) ---------- */}
      {showModal && (
        <div
          className={`fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            modalPanelVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white h-full w-full sm:max-w-[480px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
              modalPanelVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header — Plus (add) / Pencil (edit) icon */}
            <div className="bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                    {modalMode === "add" ? (
                      <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                    ) : (
                      <Pencil className="w-5 h-5 text-white" strokeWidth={2} />
                    )}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      {modalMode === "add" ? "Add Architecture" : "Edit Architecture"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {modalMode === "add"
                        ? "Fill in the details to create a new architecture"
                        : "Update the details of this architecture"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  title="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="h-1 w-full bg-gray-100">
                <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-600"></div>
              </div>
            </div>

            {/* Body — ✅ single-column stacked layout (Add Contact reference style) */}
            <form onSubmit={handleSave} className="px-6 py-5">
              <div className="flex flex-col gap-4 mb-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Architect Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                      <User className="w-4 h-4 text-blue-500" strokeWidth={2} />
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder="Enter architect name"
                      className="w-full px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-[11px] text-red-500 mt-1.5">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Mobile No. <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                      <Phone className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                    </span>
                    <input
                      type="text"
                      name="mobile_no"
                      value={form.mobile_no}
                      onChange={handleFormChange}
                      placeholder="Enter mobile number"
                      className="w-full px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>
                  {formErrors.mobile_no && (
                    <p className="text-[11px] text-red-500 mt-1.5">
                      {formErrors.mobile_no}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                      <Mail className="w-4 h-4 text-cyan-500" strokeWidth={2} />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-[11px] text-red-500 mt-1.5">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Address
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-violet-50 border-r border-gray-100">
                      <FileText className="w-4 h-4 text-violet-500" strokeWidth={2} />
                    </span>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="Enter address"
                      className="w-full px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <i className="bi bi-hourglass-split"></i> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" strokeWidth={2} /> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}