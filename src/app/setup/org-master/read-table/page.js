"use client";
import Header from "@/app/components/header";
import Link from "next/link";
import axios from "redaxios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  Plus,
  X,
  Save,
  Building2,
  Briefcase,
  Mail,
  MapPin,
  Globe,
  Hash,
  FileText,
  Phone,
  User,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";
import useAuth from "@/app/components/useAuth";

export default function Page() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  useAuth();

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState({
    column: null,
    direction: null,
  });
  const [scrollOffsets, setScrollOffsets] = useState({});

  // ✅ NEW: Add Organization — right-side slide-in/out drawer state
  const EMPTY_ADD_ORG_FORM = {
    organization_name: "",
    industry: "",
    email: "",
    address_1: "",
    address_2: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    gst_number: "",
    contact_1: "",
    contact_2: "",
    benificiary_name: "",
    bank_name: "",
    account_no: "",
    account_type: "",
    ifsc_code: "",
    micr_code: "",
  };
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [addOrgPanelVisible, setAddOrgPanelVisible] = useState(false);
  const [addOrgActiveTab, setAddOrgActiveTab] = useState("organization"); // "organization" | "bank"
  const [addOrgForm, setAddOrgForm] = useState(EMPTY_ADD_ORG_FORM);
  const [addOrgSaving, setAddOrgSaving] = useState(false);

  // Fetch table data (fetching all for client-side pagination)
  const fetchData = async (sort = sortConfig) => {
    try {
      const res = await axios.get(`${API_BASE}/api/organizations/read`, {
        params: {
          limit: 1000, // Fetch all for client-side pagination
          sortColumn: sort.column,
          sortDirection: sort.direction,
        },
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // ✅ NEW: open the Add Organization drawer
  const openAddOrg = () => {
    setAddOrgForm(EMPTY_ADD_ORG_FORM);
    setAddOrgActiveTab("organization");
    setShowAddOrg(true);
  };

  // ✅ NEW: Add Organization drawer slide-in trigger
  useEffect(() => {
    if (showAddOrg) {
      const t = setTimeout(() => setAddOrgPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showAddOrg]);

  // ✅ NEW: animated close for the Add Organization drawer — slide-out first, then reset
  const closeAddOrg = () => {
    setAddOrgPanelVisible(false);
    setTimeout(() => {
      setShowAddOrg(false);
      setAddOrgForm(EMPTY_ADD_ORG_FORM);
      setAddOrgActiveTab("organization");
    }, 300);
  };

  const handleAddOrgChange = (e) => {
    setAddOrgForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ---------- CREATE — same request shape/logic as the original Add Organization page ----------
  const handleAddOrgSubmit = async (e) => {
    e.preventDefault();

    try {
      setAddOrgSaving(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/api/organizations/add`,
        addOrgForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Organization added successfully!");
      console.log("Response", res.data);
      closeAddOrg();
      fetchData();
    } catch (error) {
      console.error("Error inserting data:", error);
      toast.error("Failed to add organization!");
    } finally {
      setAddOrgSaving(false);
    }
  };

  // column scroll
  const handleColumnScroll = async (columnKey, direction) => {
    const currentOffset = scrollOffsets[columnKey] || 0;

    try {
      const res = await axios.get(
        `${API_BASE}/api/organizations/get-column-scroll`,
        {
          params: {
            column: columnKey,
            direction,
            offset: currentOffset,
            limit: 5,
          },
        },
      );

      if (res.data.success && res.data.data) {
        setScrollOffsets((prev) => ({
          ...prev,
          [columnKey]: res.data.newOffset,
        }));

        // update only that column’s values
        setData((prevData) => {
          const updated = [...prevData];
          res.data.data.forEach((row, index) => {
            if (updated[index]) updated[index][columnKey] = row[columnKey];
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Error fetching column scroll:", err);
    }
  };

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
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

  // 🔹 Column Scroll Arrows Component
  const ColumnScroll = ({ columnKey }) => (
    <span className="ml-1 inline-flex flex-col">
      <ChevronUpIcon
        size={16}
        className="cursor-pointer text-blue-400 hover:text-blue-600"
        title="Scroll Up"
        onClick={() => handleColumnScroll(columnKey, "up")}
      />
      <ChevronDownIcon
        size={16}
        className="cursor-pointer text-blue-400 hover:text-blue-600 -mt-1"
        title="Scroll Down"
        onClick={() => handleColumnScroll(columnKey, "down")}
      />
    </span>
  );

  return (
    <>
      <Header />
      <div className="bg-gray-100">
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
                Set up
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="#"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600"
              >
                ORG-Master
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="#"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600"
              >
                {" "}
                Organization-Profile
              </Link>
            </p>
          </div>

          <div className="w-full sm:w-auto">
            {/* ✅ CHANGED: now opens the Add Organization drawer instead of navigating to a separate page */}
            <button
              type="button"
              onClick={openAddOrg}
              className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              + ADD ORGANIZATION
            </button>
          </div>
        </div>

        {/* Table Section */}
        <form className="p-2 w-full">
          <div className="bg-white shadow rounded-sm p-1 md:p-2">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm text-left">
                <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
                  <tr>
                    <th className="px-3 py-3 text-center">#</th>
                    <th className="px-4 py-3">
                      Organization Name{" "}
                    </th>
                    <th className="px-4 py-3">
                      Email 
                    </th>
                    <th className="px-4 py-3">
                      Address Line 1 
                    </th>
                    <th className="px-4 py-3">
                      Country 
                    </th>
                    <th className="px-4 py-3">
                      State 
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((item, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="text-center p-3 text-gray-400 text-xs font-medium">
                          {indexOfFirstItem + i + 1}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {item.organization_name}
                        </td>
                        <td className="p-3 text-gray-600">{item.email}</td>
                        <td className="p-3 text-gray-600">{item.address_1}</td>
                        <td className="p-3 text-gray-600">{item.country}</td>
                        <td className="p-3 text-gray-600">{item.state}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center text-gray-400 py-10"
                      >
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ✅ STANDARDIZED MICARA IMS PAGINATION — restyled to match img1 (Showing X to Y of Z entries | page nav | Rows per page) */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg mt-4">
              {/* Left: Showing entries text */}
              <p className="text-sm font-semibold text-gray-800 text-center md:text-left order-2 md:order-1">
                Showing {data.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, data.length)} of {data.length}{" "}
                entries
              </p>

              {/* Center: page navigation (only if totalPages > 1) */}
              <div className="flex justify-center order-1 md:order-2">
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
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
                          className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="bi bi-chevron-right text-sm"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Rows per page selector */}
              <div className="flex items-center justify-center md:justify-end gap-3 order-3">
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
            </div>
          </div>
        </form>
      </div>

      {/* ---------- ✅ Add Organization — right-side slide-in/out drawer, indigo-violet theme, tabbed (Add Customer reference style) ---------- */}
      {showAddOrg && (
        <div
          className={`fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            addOrgPanelVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeAddOrg}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white h-full w-full sm:max-w-[720px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
              addOrgPanelVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header — Plus icon */}
            <div className="bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                    <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                      Add Organization
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Fill in the details to create a new organization
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeAddOrg}
                  title="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 px-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setAddOrgActiveTab("organization")}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                    addOrgActiveTab === "organization"
                      ? "text-indigo-600 border-indigo-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Organization Setup
                </button>
                <button
                  type="button"
                  onClick={() => setAddOrgActiveTab("bank")}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                    addOrgActiveTab === "bank"
                      ? "text-indigo-600 border-indigo-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Bank Details
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleAddOrgSubmit} className="px-6 py-5">
              {/* ---------- Organization Setup tab ---------- */}
              {addOrgActiveTab === "organization" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Organization Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <Building2
                          className="w-4 h-4 text-blue-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="organization_name"
                        value={addOrgForm.organization_name}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                        <Briefcase
                          className="w-4 h-4 text-emerald-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="industry"
                        value={addOrgForm.industry}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Mail
                          className="w-4 h-4 text-cyan-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="email"
                        value={addOrgForm.email}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Address Line 1 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <MapPin
                          className="w-4 h-4 text-violet-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="address_1"
                        value={addOrgForm.address_1}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Address Line 2 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-rose-50 border-r border-gray-100">
                        <MapPin
                          className="w-4 h-4 text-rose-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="address_2"
                        value={addOrgForm.address_2}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Country Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-indigo-50 border-r border-gray-100">
                        <Globe
                          className="w-4 h-4 text-indigo-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="country"
                        value={addOrgForm.country}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      State <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                        <MapPin
                          className="w-4 h-4 text-green-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="state"
                        value={addOrgForm.state}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <MapPin
                          className="w-4 h-4 text-amber-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="city"
                        value={addOrgForm.city}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Pin Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-gray-50 border-r border-gray-100">
                        <Hash
                          className="w-4 h-4 text-gray-400"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="pincode"
                        value={addOrgForm.pincode}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      GST Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-fuchsia-50 border-r border-gray-100">
                        <FileText
                          className="w-4 h-4 text-fuchsia-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="gst_number"
                        value={addOrgForm.gst_number}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Contact Number 1 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <Phone
                          className="w-4 h-4 text-blue-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="contact_1"
                        value={addOrgForm.contact_1}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Contact Number 2 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <Phone
                          className="w-4 h-4 text-violet-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="contact_2"
                        value={addOrgForm.contact_2}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------- Bank Details tab ---------- */}
              {addOrgActiveTab === "bank" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Benificiary Name
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <User
                          className="w-4 h-4 text-blue-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="benificiary_name"
                        value={addOrgForm.benificiary_name}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Bank Name
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-indigo-50 border-r border-gray-100">
                        <Landmark
                          className="w-4 h-4 text-indigo-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="bank_name"
                        value={addOrgForm.bank_name}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Account No.
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <CreditCard
                          className="w-4 h-4 text-violet-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="account_no"
                        value={addOrgForm.account_no}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Account Type
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <Wallet
                          className="w-4 h-4 text-amber-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        list="accountTypes"
                        id="accountType"
                        name="account_type"
                        value={addOrgForm.account_type}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                      <datalist id="accountTypes">
                        <option value="Saving Account" />
                        <option value="Current Account" />
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      IFSC Code
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-fuchsia-50 border-r border-gray-100">
                        <Hash
                          className="w-4 h-4 text-fuchsia-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="ifsc_code"
                        value={addOrgForm.ifsc_code}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      MICR Code
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Hash
                          className="w-4 h-4 text-cyan-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="micr_code"
                        value={addOrgForm.micr_code}
                        onChange={handleAddOrgChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer buttons — Previous/Next preserved from the original page's tab logic */}
              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeAddOrg}
                  disabled={addOrgSaving}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} /> Cancel
                </button>

                {addOrgActiveTab === "organization" ? (
                  <button
                    type="button"
                    disabled
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-100 cursor-not-allowed"
                  >
                    Previous
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddOrgActiveTab("organization")}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all bg-white"
                  >
                    Previous
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAddOrgActiveTab("bank")}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all bg-white"
                >
                  Next
                </button>

                <button
                  type="submit"
                  disabled={addOrgSaving}
                  className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {addOrgSaving ? (
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
