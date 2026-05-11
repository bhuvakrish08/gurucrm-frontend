"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";


export default function CommonMasterPage({
  title,
  listApi,
  saveApi,
  parentListApi = "",
  breadcrumbs,
  showCheckboxColumn = false,
  extraColumn = null,
  showRadio = false,
  radioField = "is_parent",
}) {
  const [data, setData] = useState([]);
  const [formName, setFormName] = useState("");
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [parentOptions, setParentOptions] = useState([]);
  const [selectedParent, setSelectedParent] = useState("");
  const [selectedExtraValue, setSelectedExtraValue] = useState("");
  const [scrollOffsets, setScrollOffsets] = useState({});
  const [parentDesignation, setParentDesignation] = useState("");
  const [name, setName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchTimeout = useRef(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Standardized Micara IMS Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  const fetchData = useCallback(
    async (parentDesignation = "", name = "", status = "") => {
      try {
        const params = {};
        if (parentDesignation) params.search = parentDesignation;
        if (name) params.search2 = name;
        if (status) params.status = status;

        const res = await axios.get(listApi, { params });
        setData(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    }, [listApi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData(parentDesignation, name, statusFilter);
    }, 300);

    return () => clearTimeout(timeout);
  }, [parentDesignation, name, statusFilter]);

  const fetchParentOptions = useCallback(async () => {
    if (!parentListApi) return;
    try {
      const res = await axios.get(parentListApi);
      setParentOptions(res.data);
    } catch (err) {
      console.error("Error fetching parent options:", err);
    }
  }, [parentListApi]);

  useEffect(() => {
    fetchData();
    if (showRadio && parentListApi) fetchParentOptions();
  }, [fetchData, showRadio, parentListApi, fetchParentOptions]);

  useEffect(() => {
    if (showForm && showRadio && parentListApi) fetchParentOptions();
  }, [showForm, showRadio, parentListApi, fetchParentOptions]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      parent_designation: selectedParent || "",
      name: formName,
    };

    try {
      setIsSubmitting(true); // ✅ START

      if (editId) {
        await axios.put(`${saveApi}/update/${editId}`, payload);
        toast.success("Updated successfully");
      } else {
        await axios.post(`${saveApi}/insert`, payload);
        toast.success("Inserted successfully");
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Error saving data");
    } finally {
      setIsSubmitting(false); // ✅ STOP
    }
  };

  const resetForm = () => {
    setFormName("");
    setSelectedParent("");
    setEditId(null);
    setIsParent(false);
    setIsDefault(false);
    setSelectedExtraValue("");
    setShowForm(false);
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await axios.put(`${saveApi}/status/${id}`, {
        status: currentStatus === 1 ? 0 : 1,
      });
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, status: currentStatus === 1 ? 0 : 1 } : item
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormName(item.name);
    setSelectedParent(item.parent_designation || "");
    setIsParent(item[radioField] === 1);
    setIsDefault(item.default === 1);
    if (extraColumn && item[extraColumn.key]) {
      setSelectedExtraValue(item[extraColumn.key]);
    }
    setShowForm(true);
  };

  const handleCheckboxChange = async (id, currentDefault) => {
    const newDefault = currentDefault === 1 ? 0 : 1;
    try {
      await axios.put(`${saveApi}/default/${id}`, { default: newDefault });
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, default: newDefault } : item
        )
      );
    } catch (err) {
      console.error("Error updating checkbox:", err);
    }
  };

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

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

  // Reset page when filters or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [parentDesignation, name, statusFilter, itemsPerPage]);


  return (
    <>
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
                Setup
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              {breadcrumbs.map((b, i) => (
                <span
                  key={i}
                  className="flex items-center text-gray-700 hover:text-orange-500 font-semibold"
                >
                  <span className="mx-2">{b}</span>
                  {i < breadcrumbs.length - 1 && (
                    <i className="bi bi-chevron-right text-[10px]"></i>
                  )}
                </span>
              ))}
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto bg-orange-500 text-white px-5 py-2 rounded-sm shadow hover:bg-orange-600 font-bold text-sm"
            >
              + Add {title}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mx-6 md:hidden mt-3 relative z-40">
          <button type="button" onClick={() => setShowMobileFilters(!showMobileFilters)} className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all">
             <span className="flex items-center gap-2"><i className="bi bi-funnel"></i> Filters</span>
             <i className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}></i>
          </button>
        </div>

        <div className={`
          ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
          md:mx-6 md:flex md:flex-wrap md:items-center md:gap-y-2 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}>
          {extraColumn && (
            <select
              value={parentDesignation}
              onChange={(e) => setParentDesignation(e.target.value)}
              className="w-full md:w-60 md:mx-2 bg-white p-2 border border-orange-300 rounded-sm outline-none text-gray-400 text-sm"
              required
            >
              <option value="">Parent</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder={`Enter ${title}`}
            className="p-2 w-full md:w-50 mb-0 md:mb-3 border text-gray-400 bg-white border-orange-300 rounded-sm outline-none text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="w-full md:w-48 md:mx-3 md:mb-3 p-2 border text-gray-400 bg-white rounded-sm border-orange-300 outline-none text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>

          <div className="flex gap-2 col-span-2 md:mb-3">
            <button
              type="button"
              onClick={() => {
                setParentDesignation("");
                setName("");
                setStatusFilter("");
                setShowMobileFilters(false);
                fetchData();
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
        <form className="p-1 mx-5">
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll bg-white shadow-md rounded-sm p-1 border border-gray-200">
            <table className="w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-900 uppercase text-xs">
                <tr>
                  <th className="py-3 px-5 w-10">#</th>
                  {extraColumn && (
                    <th className="py-3 px-4 text-center">
                      {extraColumn.label}
                    </th>
                  )}
                  <th className="py-3 px-4">{title} Name</th>
                  {showCheckboxColumn && (
                    <th className="py-3 px-4 text-center">Select</th>
                  )}
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {currentData.map((item, i) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition`}>
                    <td className="py-1 px-4 text-gray-600">
                      {(currentPage - 1) * itemsPerPage + i + 1}
                    </td>
                    {extraColumn && (
                      <td className="py-2 px-4 text-center">
                        {item[extraColumn.key] || "-"}
                      </td>
                    )}
                    <td className="py-1 px-4 font-medium text-gray-800">
                      {item.name}
                    </td>

                    {showCheckboxColumn && (
                      <td className="py-2 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={item.default === 1}
                          onChange={() =>
                            handleCheckboxChange(item.id, item.default)
                          }
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}

                    <td className="py-1 px-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={item.status === 1}
                          onChange={() => handleToggle(item.id, item.status)}
                        />
                        <div
                          className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.status === 1 ? "bg-orange-500" : "bg-gray-300"}`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-4 h-3 bg-white rounded-full transition-all duration-300 ${item.status === 1 ? "translate-x-6" : "translate-x-1"}`}
                          ></div>
                        </div>
                      </label>
                    </td>

                    <td className="py-1 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="text-gray-700 hover:text-blue-700"
                      >
                        <i className="bi bi-pencil-square text-lg"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
              {/* Left side: Rows per page selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">
                  Rows per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer font-medium"
                >
                  {[10, 20, 100, 200].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>


              {/* Right side: Navigation buttons (only if totalPages > 1) */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                            ? "bg-[#212121] text-white shadow-md shadow-black/10"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
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
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="bi bi-chevron-right text-sm"></i>
                  </button>
                </div>
              )}
            </div>

          </div>
        </form>

        {/* Modal remains same */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-900/30 z-50 flex justify-center items-center">
            <div className="bg-white rounded-sm shadow-lg p-6 w-[400px] relative">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormName("");
                  setEditId(null);
                }}
                className="absolute top-2 right-4 text-xl text-orange-500 hover:text-orange-600"
              >
                ✕
              </button>

              <h3 className="text-lg mb-3">
                {editId ? "Edit" : "Add"} {title}
              </h3>
              <form onSubmit={handleSubmit}>
                {showRadio && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Is Parent?
                    </label>
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="isParent"
                          checked={isParent === true}
                          onChange={() => setIsParent(true)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="isParent"
                          checked={isParent === false}
                          onChange={() => setIsParent(false)}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                )}

                {showRadio && isParent && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Parent
                    </label>
                    <select
                      value={selectedParent}
                      onChange={(e) => setSelectedParent(e.target.value)}
                      className="border p-2 w-full rounded-sm"
                    >
                      <option value="">-- Select Parent --</option>

                      {parentOptions.map((opt) => (
                        <option key={opt.id} value={opt.name}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {title} Name
                </label>
                <input
                  type="text"
                  placeholder="Enter name"
                  className="border p-2 w-full rounded-sm mb-3 outline-none  border-orange-300"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormName("");
                      setEditId(null);
                    }}
                    className="px-4 py-2 bg-gray-200 rounded-sm text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-24 flex items-center justify-center bg-orange-500 text-white px-4 py-1.5 rounded-sm
    ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-orange-600"}
  `}
                  >
                    {isSubmitting ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="white"
                          strokeWidth="4"
                          opacity="0.25"
                        />
                        <path
                          fill="white"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    ) : editId ? (
                      "Update"
                    ) : (
                      "Save"
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
