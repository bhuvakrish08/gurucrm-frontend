"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";


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
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const resetFilter = () => {
    setFilters({
      searchName: "",
      searchEmail: "",
      searchMobile: "",
      status: "",
    });
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
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Settings
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/setup/manage-architecture"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Manage Architecture
              </Link>
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={openAddModal}
              className="block w-full text-center bg-orange-500 text-white px-5 py-2 rounded-sm shadow hover:bg-orange-600 font-bold text-sm"
            >
              + ADD ARCHITECTURE
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

          <input
            type="text"
            name="searchEmail"
            placeholder="Search by email"
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.searchEmail}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="searchMobile"
            placeholder="Search by mobile"
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.searchMobile}
            onChange={handleFilterChange}
          />

          {/* ✅ FIX: option values changed from "1"/"0" to "active"/"inactive"
                     to match the actual varchar values stored in DB */}
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
                    <th className="py-3 px-4">Architect Name</th>
                    <th className="py-3 px-4">Mobile No.</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
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
                    architects.map((a, i) => (
                      <tr
                        key={a.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-5">{i + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {a.name}
                        </td>
                        <td className="py-3 px-4">{a.mobile_no}</td>
                        <td className="py-3 px-4">{a.email}</td>
                        <td className="py-3 px-4">{a.address || "-"}</td>
                        <td className="py-3 px-4">
                          {/* ✅ FIX: compare against "active" string, not Number(...) === 1 */}
                          <button
                            type="button"
                            onClick={() => toggleStatus(a)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              a.status === "1"
                                ? "bg-orange-500"
                                : "bg-gray-300"
                            }`}
                          >
                            <span
                              className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform ${
                                a.status === "1"
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => openEditModal(a)}
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
                {modalMode === "add" ? "Add Architecture" : "Edit Architecture"}
              </h2>
              {/* ✅ FIX: close (X) icon was using pencil icon before, swapped to an actual close icon */}
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
                  Architect Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-sm outline-none text-sm focus:border-orange-400"
                  placeholder="Enter architect name"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mobile No.
                </label>
                <input
                  type="text"
                  name="mobile_no"
                  value={form.mobile_no}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-sm outline-none text-sm focus:border-orange-400"
                  placeholder="Enter mobile number"
                />
                {formErrors.mobile_no && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.mobile_no}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-sm outline-none text-sm focus:border-orange-400"
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-sm outline-none text-sm focus:border-orange-400"
                  placeholder="Enter address"
                />
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