"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
// import { User, ToggleLeft, Building2, RotateCcw, Filter, ChevronDown } from "lucide-react";
import { User, ToggleLeft, Building2, RotateCcw, Filter, ChevronDown, Plus, Pencil, X, Save, Tag } from "lucide-react";

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
  showDelete = false,
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

  const getHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchData = useCallback(
    async (parentDesignation = "", name = "", status = "") => {
      try {
        const params = {};
        if (parentDesignation) params.search = parentDesignation;
        if (name) params.search2 = name;
        if (status) params.status = status;

        const res = await axios.get(listApi, { params, headers: getHeaders() });
        const listData = Array.isArray(res.data)
          ? res.data
          : (res.data?.data || res.data?.result || res.data?.rows || []);
        setData(listData);
      } catch (err) {
        console.error("Fetch error:", err);
        setData([]);
      }
    }, [listApi, getHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData(parentDesignation, name, statusFilter);
    }, 300);

    return () => clearTimeout(timeout);
  }, [parentDesignation, name, statusFilter, fetchData]);

  const fetchParentOptions = useCallback(async () => {
    if (!parentListApi) return;
    try {
      const res = await axios.get(parentListApi, { headers: getHeaders() });
      const optionsData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setParentOptions(optionsData);
    } catch (err) {
      console.error("Error fetching parent options:", err);
    }
  }, [parentListApi, getHeaders]);

  useEffect(() => {
    fetchData();
    if (parentListApi) fetchParentOptions();
  }, [fetchData, parentListApi, fetchParentOptions]);

  useEffect(() => {
    if (showForm && parentListApi) fetchParentOptions();
  }, [showForm, parentListApi, fetchParentOptions]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const parentVal = selectedParent || selectedExtraValue || "";
    const payload = {
      name: formName,
      parent_designation: parentVal,
    };
    if (extraColumn?.key) {
      payload[extraColumn.key] = parentVal;
    }

    try {
      setIsSubmitting(true); // ✅ START

      if (editId) {
        const existing = data.find((d) => d.id === editId);
        if (existing && existing.status !== undefined) {
          payload.status = existing.status;
        }
        await axios.put(`${saveApi}/update/${editId}`, payload, { headers: getHeaders() });
        toast.success("Updated successfully");
      } else {
        payload.status = 1;
        await axios.post(`${saveApi}/insert`, payload, { headers: getHeaders() });
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
      }, { headers: getHeaders() });
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, status: currentStatus === 1 ? 0 : 1 } : item
        )
      );
      toast.success("Status updated successfully");
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Error updating status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`${saveApi}/delete/${id}`, { headers: getHeaders() });
      toast.success("Deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Error deleting:", err);
      toast.error("Error deleting data");
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormName(item.name || "");
    const parentVal = item.parent_designation || (extraColumn ? item[extraColumn.key] : "") || "";
    setSelectedParent(parentVal);
    setSelectedExtraValue(parentVal);
    setIsParent(item[radioField] === 1 || Boolean(parentVal));
    setIsDefault(item.default === 1);
    setShowForm(true);
  };

  const handleCheckboxChange = async (id, currentDefault) => {
    const newDefault = currentDefault === 1 ? 0 : 1;
    try {
      await axios.put(`${saveApi}/default/${id}`, { default: newDefault }, { headers: getHeaders() });
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, default: newDefault } : item
        )
      );
      toast.success("Updated successfully");
    } catch (err) {
      console.error("Error updating checkbox:", err);
      toast.error("Error updating setting");
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
        {/* bredcrumb */}
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
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Setup
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              {breadcrumbs.map((b, i) => (
                <span
                  key={i}
                  className="flex items-center text-gray-700 hover:text-indigo-600 "
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
              className="w-full sm:w-auto text-white px-5 py-2 rounded-sm shadow font-bold text-sm  bg-gradient-to-br from-indigo-500 to-violet-600"
            >
              + Add {title}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mx-6 md:hidden mt-3 relative z-40">
  <button
    type="button"
    onClick={() => setShowMobileFilters(!showMobileFilters)}
    className="w-full flex items-center justify-between text-indigo-600 font-semibold bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200 shadow-sm transition-all"
  >
    <span className="flex items-center gap-2">
      <Filter className="w-4 h-4" strokeWidth={2} /> Filters
    </span>
    <ChevronDown
      className={`w-4 h-4 transition-transform ${
        showMobileFilters ? "rotate-180" : ""
      }`}
      strokeWidth={2}
    />
  </button>
</div>

<div
  className={`
    ${
      showMobileFilters
        ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1"
        : "hidden"
    } 
    md:mx-6 md:flex md:flex-wrap md:items-center md:gap-3 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
  `}
>
  {extraColumn && (
    <div className="relative w-full md:w-60">
      <Building2
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none"
        strokeWidth={2}
      />
      <select
        value={parentDesignation}
        onChange={(e) => setParentDesignation(e.target.value)}
        className="w-full bg-white pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg outline-none text-gray-600 text-sm focus:border-indigo-400 transition-colors appearance-none"
        required
      >
        <option value="">Parent</option>
        {parentOptions.map((opt) => (
          <option key={opt.id} value={opt.name}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  )}

  <div className="relative w-full md:w-56">
    <User
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none"
      strokeWidth={2}
    />
    <input
      type="text"
      placeholder={`Enter ${title}`}
      className="w-full pl-9 pr-3 py-2.5 border border-indigo-400 bg-white rounded-sm outline-none text-gray-700 text-sm transition-colors"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  </div>

  <div className="relative w-full md:w-48">
    <ToggleLeft
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none"
      strokeWidth={2}
    />
    <select
      className={`w-full pl-9 pr-3 py-2.5 border border-indigo-400 bg-white rounded-sm outline-none text-sm transition-colors appearance-none  ${
        statusFilter === "" ? "text-gray-400" : "text-gray-700"
      }`}
      
      
       value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}>
     
    
      <option value="">Status</option>
      <option value="1">Active</option>
      <option value="0">Inactive</option>
    </select>
  </div>

  <div className="flex gap-2 col-span-2 md:col-auto">
    <button
      type="button"
      onClick={() => {
        setParentDesignation("");
        setName("");
        setStatusFilter("");
        setShowMobileFilters(false);
        fetchData();
      }}
      className="flex items-center justify-center gap-2   w-full md:w-auto cursor-pointer rounded-sm px-4 py-2.5 bg-indigo-100 text-indigo-600  text-sm text-center font-semibold transition-colors"
    >
      <RotateCcw className="w-4 h-4" strokeWidth={2} />
      Clear Filter
    </button>
    <button
      type="button"
      onClick={() => setShowMobileFilters(false)}
      className="md:hidden border border-indigo-300 w-full cursor-pointer rounded-lg p-2.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm text-center font-semibold transition-colors"
    >
      Apply
    </button>
  </div>
</div>

        {/* ✅ Table — image-2 style: indigo header w/ sort icons, bolder name text, indigo hover highlight */}
        <form className="p-1 mx-5  pt-3.5">
          <div className="overflow-x-auto overflow-y-auto max-h-[full] custom-scroll bg-white shadow-md rounded-sm p-2 border border-gray-200">
                <table className="w-full text-sm text-left text-gray-700 border-collapse whitespace-nowrap">
              <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
                    <tr>
                  <th className="py-3 px-4 w-10 text-center">#</th>
                  {extraColumn && (
                    <th className="py-3 px-4 text-left">
                      {extraColumn.label}{" "}
                      <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                  )}
                  <th className="py-3 px-4 text-left">
                    {title} Name{" "}
                    <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                  </th>
                  {showCheckboxColumn && (
                    <th className="py-3 px-4 text-left">Select</th>
                  )}
                  <th className="py-3 px-4 text-center">
                    Status{" "}
                    <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                  </th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {currentData.map((item, i) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="py-2 px-4 text-gray-400 text-xs font-medium text-center">
                      {(currentPage - 1) * itemsPerPage + i + 1}
                    </td>
                    {extraColumn && (
                      <td className="py-2 px-4 text-left text-gray-600">
                        {item[extraColumn.key] || "-"}
                      </td>
                    )}
                    <td className="py-2 px-4 font-semibold text-slate-800">
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

                    <td className="py-2 px-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={item.status === 1}
                          onChange={() => handleToggle(item.id, item.status)}
                        />
                        <div
                          className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.status === 1 ? "bg-blue-500" : "bg-gray-300"}`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-4 h-3 bg-white rounded-full transition-all duration-300 ${item.status === 1 ? "translate-x-6" : "translate-x-1"}`}
                          ></div>
                        </div>
                      </label>
                    </td>

                    <td className="py-2 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-blue-500 "
                        >
                          <i className="bi bi-pencil-square text-md"></i>
                        </button>
                        {showDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 "
                            title="Delete"
                          >
                            <i className="bi bi-trash3 text-md"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ✅ PAGINATION — image style: "Showing X to Y of Z entries" (left) + indigo "Rows per page" (right) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
              {/* Left side: Showing entries text */}
              <p className="text-sm font-semibold text-slate-800">
                Showing {data.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, data.length)} of {data.length} entries
              </p>

              {/* Right side: Rows per page selector + navigation (nav only if totalPages > 1) */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 font-medium">
                    Rows per page:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm text-indigo-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    {[10, 20, 100, 200].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

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

          </div>
        </form>

        {/* Modal remains same */}
          {showForm && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              {/* Header — Plus icon when adding, Pencil icon when editing */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                    {editId ? (
                      <Pencil className="w-5 h-5 text-white" strokeWidth={2} />
                    ) : (
                      <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                    )}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      {editId ? "Edit" : "Add"} {title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {editId
                        ? `Update the ${title} details`
                        : `Fill in the details to create a new ${title}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormName("");
                    setEditId(null);
                  }}
                  title="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
 
              {/* Body */}
              <form onSubmit={handleSubmit} className="px-6 py-5">
                {showRadio && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Is Parent?
                    </label>
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-1.5 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="isParent"
                          checked={isParent === true}
                          onChange={() => setIsParent(true)}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-sm text-gray-700">
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
 
                {parentListApi && (!showRadio || isParent) && (
                  <div className="mb-4">
                    <label className="block mb-1.5 text-sm font-medium text-gray-600">
                      Select {extraColumn?.label || "Parent"}
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <Building2 className="w-4 h-4 text-blue-500" strokeWidth={2} />
                      </span>
                      <select
                        value={selectedParent}
                        onChange={(e) => setSelectedParent(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">-- Select Parent --</option>
 
                        {parentOptions.map((opt) => (
                          <option key={opt.id} value={opt.name}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
 
                <div className="mb-5">
                  <label className="block mb-1.5 text-sm font-medium text-gray-600">
                    {title} Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <Tag className="w-4 h-4 text-violet-500" strokeWidth={2} />
                    </span>
                    <input
                      type="text"
                      placeholder="Enter name"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>
                </div>
 
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormName("");
                      setEditId(null);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 bg-white"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
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