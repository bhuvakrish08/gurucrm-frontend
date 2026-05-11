"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "../components/header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "redaxios";
import useAuth from "../components/useAuth";

export default function CustomerList() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [search, setSearch] = useState("");
  // BUG FIX #1: was "setDesignations" (undefined variable), changed to setIndustries
  const [industries, setIndustries] = useState([]);

  const [viewModal, setViewModal] = useState({ open: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer_name: "",
    // BUG FIX #4: renamed contact_number to mobile to match backend param
    mobile: "",
    email: "",
    industry: "",
  });

  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "ASC" });


  // Store offset for each scrollable column
  const [columnOffsets, setColumnOffsets] = useState({
    company_name: 0,
    customer_name: 0,
    email: 0,
    website: 0,
    industry: 0,
  });

  // Fetch table data
  const fetchCustomers = async () => {
    try {
      const query = new URLSearchParams({
        // Remove server-side pagination to allow client-side slicing
        // page,
        // limit: 10,
        search,
        sortBy: sortConfig.key,
        order: sortConfig.direction,
        ...filters,
      }).toString();

      const res = await axios.get(`${API_BASE}/api/customers/get-customers?${query}`);
      const result = res.data;

      if (result.success) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };


  // Fetching Active Industries
  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/Industries/industries`, {
          params: { status: 1 },
        });
        // BUG FIX #1: was calling setDesignations (undefined), now correctly calls setIndustries
        setIndustries(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch industries:", err);
        setIndustries([]);
      }
    };
    fetchIndustry();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [sortConfig]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, filters]);

  // Reset page when filters, search, or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search, itemsPerPage]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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


  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.delete(`${API_BASE}/api/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DELETE SUCCESS:", res.data);

      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.error("FULL DELETE ERROR:", error);

      if (error.response) {
        console.error("Server Response:", error.response.data);
      }

      toast.error("Failed to delete customer");
    }
  };

  return (
    <>
      <Header />
      <div className="bg-gray-100">
        {/* Header bar */}
        <div className="bg-white w-full rounded-sm shadow-lg p-3 mt-1 mb-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <p className="flex items-center flex-wrap">
              <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="/customer-list" className="mx-3 text-md text-gray-700 hover:text-orange-500 font-semibold">
                Customer List
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="🔍 Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border w-full sm:w-64 border-gray-300 text-gray-700 placeholder-gray-400 p-2 sm:p-1 px-3 rounded-sm focus:ring-1 outline-none focus:ring-orange-200 transition-all text-sm"
              />
              <Link
                href="/customer"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-sm w-full sm:w-auto text-center font-bold text-sm"
              >
                + ADD CUSTOMER
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mx-4 mb-2 md:hidden mt-3 relative z-40">
          <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all">
             <span className="flex items-center gap-2"><i className="bi bi-funnel"></i> Filters</span>
             <i className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}></i>
          </button>
        </div>

        <div className={`
          ${showMobileFilters ? "absolute left-4 right-4 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
          md:mx-4 md:mb-2 md:flex md:flex-wrap md:gap-2 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}>
          <input
            type="text"
            name="customer_name"
            value={filters.customer_name}
            onChange={handleChange}
            placeholder="Enter Name"
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-56 md:mx-2 text-sm outline-none"
          />

          <input
            type="text"
            name="mobile"
            placeholder="Contact No."
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-56 md:mx-2 text-sm outline-none"
            value={filters.mobile || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!/^\d*$/.test(val)) return;
              if (val.length === 1 && !["6", "7", "8", "9"].includes(val)) return;
              if (val.length > 10) return;
              setFilters((p) => ({ ...p, mobile: val }));
            }}
            maxLength={10}
          />

          <input
            type="text"
            name="email"
            value={filters.email}
            onChange={handleChange}
            placeholder="Enter Email"
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-56 md:mx-2 text-sm outline-none"
          />

          <select
            name="industry"
            value={filters.industry}
            onChange={handleChange}
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-56 md:mx-2 text-gray-500 text-sm outline-none"
          >
            <option value="">Industry</option>
            {industries.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2 col-span-2">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  customer_name: "",
                  mobile: "",
                  email: "",
                  industry: "",
                });
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
        <form className="p-2 w-8xl mx-3">
          <div className="bg-white shadow rounded-sm p-6">
            <div className="overflow-x-auto overflow-y-scroll max-h-[380px] custom-scroll" style={{ overflowX: "scroll" }}>
              <table className="w-full text-sm border border-gray-200 text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 text-center">#</th>
                    <th className="px-4 py-2">Company Name</th>
                    <th className="px-4 py-2">Customer Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Mobile No.</th>
                    <th className="px-4 py-2">Customer Type</th>
                    <th className="px-4 py-2">Website</th>
                    <th className="px-4 py-2">Industry</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">{indexOfFirstItem + index + 1}</td>
                        <td className="px-4 py-2">{row.company_name}</td>
                        <td className="px-4 py-2 text-orange-500">{row.customer_name}</td>
                        <td className="px-4 py-2">{row.email}</td>
                        <td className="px-4 py-2">{row.mobile}</td>
                        <td className="px-4 py-2">{row.customer_type}</td>
                        <td className="px-4 py-2">{row.website}</td>
                        <td className="px-4 py-2">{row.industry_name}</td>
                        <td className="py-2 px-4 text-lg">
                          <button
                            type="button"
                            onClick={() => setViewModal({ open: true, data: row })}
                            className="text-gray-400 hover:text-green-600 cursor-pointer"
                          >
                            <i className="bi bi-eye text-xl"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem("customer_edit_id", JSON.stringify(row.id));
                              router.push("/edit-customer");
                            }}
                            className="text-gray-400 hover:text-blue-700 mx-2 cursor-pointer"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, id: row.id, name: row.customer_name })}
                            className="text-gray-400 hover:text-red-600 cursor-pointer"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-gray-500">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg mt-4">
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
      </div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Delete Customer
                </span>
              </div>
              <button
                onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
              >
                ✕
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <p className="font-semibold text-gray-800 text-base mb-1">{deleteModal.name}</p>
              <p className="text-sm text-gray-400">This action cannot be undone. Are you sure?</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setDeleteModal({ open: false, id: null, name: "" })}
                className="flex-1 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(deleteModal.id);
                  setDeleteModal({ open: false, id: null, name: "" });
                }}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {viewModal.open && viewModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between px-6 py-3 from-orange-100 to-white bg-gradient-to-r">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center">
                  <i className="bi bi-person text-orange-500 text-md"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {viewModal.data.customer_name}
                  </p>
                  <p className="text-gray-400 text-md">{viewModal.data.customer_type}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
              >
                ✕
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-building text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Company</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.company_name || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-person-circle text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Customer Name</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.customer_name || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-envelope text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-semibold text-gray-700 break-all">{viewModal.data.email || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-telephone text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Mobile</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.mobile || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-tag text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Customer Type</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.customer_type || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-globe text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Website</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.website || "—"}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-briefcase text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Industry</p>
                  <p className="text-sm font-semibold text-gray-700">{viewModal.data.industry_name || "—"}</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button
                onClick={() => setViewModal({ open: false, data: null })}
                className="px-5 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}