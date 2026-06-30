"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const APIBase = `${API_BASE}/api/general-expense-master`;

const EMPTY_FORM = { name: "", status: "1" };

export default function GeneralExpenseTable() {
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchName: "",
    status: "",
  });

  // ---------- Modal state ----------
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const resetFilter = () => {
    setFilters({ searchName: "", status: "" });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- READ — Fetch list from API ----------
  const fetchExpenseTypes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.searchName) params.append("searchName", filters.searchName);
      if (filters.status !== "") params.append("status", filters.status);

      const res = await fetch(`${APIBase}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load general expense types");

      const data = await res.json();
      setExpenseTypes(data.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [filters.searchName, filters.status]);

  useEffect(() => {
    fetchExpenseTypes();
  }, [fetchExpenseTypes]);

  // ---------- UPDATE STATUS ONLY — toggle active/inactive ----------
  const toggleStatus = async (item) => {
    const newStatus = item.status === "1" ? "0" : "1";

    // optimistic UI update
    setExpenseTypes((prev) =>
      prev.map((e) => (e.id === item.id ? { ...e, status: newStatus } : e)),
    );

    try {
      const res = await fetch(`${APIBase}/${item.id}`, {
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
      setExpenseTypes((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, status: item.status } : e)),
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

  const openEditModal = (item) => {
    setModalMode("edit");
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      status: item.status || "1",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
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
        const res = await fetch(`${APIBase}/insert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, status: "1" }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to add general expense type");
        }
      } else {
        const res = await fetch(`${APIBase}/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(
            data.message || "Failed to update general expense type",
          );
        }
      }

      closeModal();
      fetchExpenseTypes();
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
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Settings
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/sales/setup/general-expense"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                General Expense
              </Link>
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={openAddModal}
              className="block w-full text-center bg-orange-500 text-white px-5 py-2 rounded-sm shadow hover:bg-orange-600 font-bold text-sm"
            >
              + ADD GENERAL EXPENSE
            </button>
          </div>
        </div>

        {/* Mobile filter toggle */}
        <div className="mx-6 md:hidden mt-3 relative z-40">
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

        {/* Filters */}
        <div
          className={`
            ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"}
            md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
          `}
        >
          <input
            type="text"
            name="searchName"
            placeholder="Search by name"
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.searchName}
            onChange={handleFilterChange}
          />

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-53 md:mx-2 border border-orange-300 md:border text-gray-500 bg-white rounded-sm outline-none text-sm"
          >
            <option value="">Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>

          <div className="flex gap-2 col-span-2">
            <button
              type="button"
              onClick={() => {
                resetFilter();
                setShowMobileFilters(false);
              }}
              className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold"
            >
              Clear
            </button>
            <button
              type="button"
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
                <thead className="bg-gray-50 text-gray-900 text-xs">
                  <tr>
                    <th className="py-3 px-5 w-10">#</th>
                    <th className="py-3 px-4">Expense Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
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

                  {!loading && !error && expenseTypes.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-8 text-gray-400"
                      >
                        No general expense types found.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    expenseTypes.map((item, i) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-5">{i + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleStatus(item)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              item.status === "1"
                                ? "bg-orange-500"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform ${
                                item.status === "1"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 hover:border-orange-500"
                            title="Edit"
                          >
                            <i className="bi bi-pencil-square text-gray-600"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Add / Edit Modal ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="font-bold text-gray-900">
                {modalMode === "add"
                  ? "Add General Expense"
                  : "Edit General Expense"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Expense Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-sm outline-none text-sm focus:border-orange-400"
                  placeholder="e.g. Office rent"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-sm border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-sm bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
