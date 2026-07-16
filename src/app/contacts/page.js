"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import { ChevronUpIcon, ChevronDownIcon, UserPlus, Pencil, X, Save, Building2, User, UserRound, Phone, Mail, Briefcase } from "lucide-react";
import Header from "../components/header";
import useAuth from "../components/useAuth";
import { Trash2 } from "lucide-react";
export default function Page() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [formdata, setFormData] = useState({
    customer_id: "",
    company_name: "",
    customer_name: "",
    contact_person: "",
    contact_number: "",
    email: "",
    contact_designation: "",
  });

  const [filters, setFilters] = useState({
    company_name: "",
    customer_name: "",
    contact_person: "",
    contact_number: "",
    email: "",
    contact_designation: "",
  });

  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  // ✅ NEW: controls slide-in / slide-out animation for the Add/Edit Contact drawer
  const [formVisible, setFormVisible] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companyname, setCompanyname] = useState([]);
  const [customername, setCustomername] = useState([]);
  const [scrollOffsets, setScrollOffsets] = useState({});
  // Add this new state (separate from form's customername)
  const [filterCustomernames, setFilterCustomernames] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const API_base = `${API_BASE}/api/contacts`;

  // Standardized Micara IMS Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  /* ---------------- FETCH CONTACTS ---------------- */
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_base}/read`, {
        params: {
          search1: filters.company_name,
          search2: filters.customer_name,
          search3: filters.contact_person,
          search4: filters.contact_number,
          search5: filters.email,
          search6: filters.contact_designation,
        },
      });
      setContacts(res.data.data || []);
    } catch {
      toast.error("Failed to load contacts");
    }
  }, [filters]);

  useEffect(() => {
    const delay = setTimeout(fetchData, 300);
    return () => clearTimeout(delay);
  }, [fetchData]);

  // Reset page when filters or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // ===================================================
  // ✅ NEW: SLIDE IN / SLIDE OUT ANIMATION CONTROLLER
  // ===================================================
  // When the drawer opens, flip "visible" on next tick so the transform
  // transition animates from translate-x-full -> translate-x-0.
  useEffect(() => {
    let t;
    if (showForm) {
      t = setTimeout(() => setFormVisible(true), 10);
    } else {
      setFormVisible(false);
    }
    return () => clearTimeout(t);
  }, [showForm]);

  // Closing helper: flip visible -> false first (plays slide-out),
  // then unmount the drawer after the transition duration (300ms).
  const closeForm = () => {
    setFormVisible(false);
    setTimeout(() => setShowForm(false), 300);
  };

  /* ---------------- FETCH DROPDOWNS ---------------- */
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/contact/read`, { params: { status: 1 } })
      .then((res) => setDesignations(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/customers/company-names`)
      .then((res) => setCompanyname(res.data.data || res.data))
      .catch(() => setCompanyname([]));
  }, []);
  // Add this useEffect to load all customers initially for the filter dropdown
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/customers/customer-name`, {
        params: { company_name: "" },
      })
      .then((res) =>
        // ✅ Filter out null/empty customer names
        setFilterCustomernames(
          (res.data.data || []).filter((item) => item.customer_name?.trim()),
        ),
      )
      .catch(() => setFilterCustomernames([]));
  }, []);
  const fetchFilterCustomersByCompany = async (companyId) => {
    if (!companyId) {
      try {
        const res = await axios.get(`${API_BASE}/api/customers/customer-name`, {
          params: { company_name: "" },
        });
        // ✅ Filter out null/empty customer names
        setFilterCustomernames(
          (res.data.data || []).filter((item) => item.customer_name?.trim()),
        );
      } catch {
        setFilterCustomernames([]);
      }
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/api/customers/customer-name`, {
        params: { company_name: companyId },
      });
      // ✅ Filter out null/empty customer names
      setFilterCustomernames(
        (res.data.data || []).filter((item) => item.customer_name?.trim()),
      );
    } catch {
      setFilterCustomernames([]);
    }
  };

  const fetchCustomersByCompany = async (companyId) => {
    if (!companyId) {
      setCustomername([]);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/api/customers/customer-name`, {
        params: { company_name: companyId },
      });
      setCustomername(res.data.data || []);
    } catch {
      setCustomername([]);
    }
  };

  /* ---------------- HANDLERS ---------------- */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const handleFilterCompanyChange = async (e) => {
    const companyId = e.target.value;
    setFilters((p) => ({ ...p, company_name: companyId, customer_name: "" }));
    await fetchFilterCustomersByCompany(companyId); // ← uses filter-specific fetch
  };

  const handleFormCompanyChange = async (e) => {
    const companyId = e.target.value;
    setFormData((p) => ({
      ...p,
      company_name: companyId, // INT
      customer_id: "", // reset ID
      customer_name: "", // reset name
    }));

    await fetchCustomersByCompany(companyId);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      company_name: "",
      customer_name: "",
      contact_person: "",
      contact_number: "",
      email: "",
      contact_designation: "",
    });
    setEditId(null);
    closeForm(); // ✅ animated slide-out instead of instant close
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editId
        ? await axios.put(`${API_base}/update/${editId}`, formdata)
        : await axios.post(`${API_base}/insert`, formdata);
      toast.success("Saved successfully");
      fetchData();
      resetForm();
    } catch {
      toast.error("Error saving data");
    }
  };

  const handleEdit = async (item) => {
    setEditId(item.id);

    // load customers based on company string
    await fetchCustomersByCompany(item.company_name);

    // set form data
    setFormData({
      customer_id: item.customer_id,
      company_name: item.company_name, // string
      customer_name: item.customer_name,
      contact_person: item.contact_person,
      contact_number: item.contact_number,
      email: item.email,
      contact_designation: item.contact_designation,
    });

    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_base}/delete/${deleteId}`);
      toast.success("Contact deleted successfully");
      fetchData();
    } catch {
      toast.error("Failed to delete contact");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = contacts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(contacts.length / itemsPerPage);

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

  return (
    <>
      <Header />
      <div className="bg-gray-100">
        {/* breadcrumb */}
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
                href="#"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Customer
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/contacts"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Contacts
              </Link>
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto  text-white px-5 py-2 rounded-sm shadow bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-sm"
            >
              + ADD CONTACT
            </button>
          </div>
        </div>

        {/* Filters */}
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

        <div
          className={`
          ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
          md:mx-6 md:mb-3 md:items-center md:gap-2 md:flex-wrap md:flex md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}
        >
          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-54 md:mx-2 text-sm">
                      <Building2 size={16} className="text-blue-500" />
            <select
              name="company_name"
              value={filters.company_name}
              onChange={handleFilterCompanyChange}
              className="py-2 w-full outline-none text-gray-500 text-sm bg-transparent"
            >
              <option value="">Company</option>
              {companyname.map((item) => (
                <option key={item.company_name} value={item.company_name}>
                  {item.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-2 border bg-white border-indigo-400 rounded-sm w-full md:flex-1 md:min-w-0 text-sm">
            <select
              name="customer_name"
              value={filters.customer_name}
              onChange={handleFilterChange}
              className="py-2 w-full outline-none text-gray-500 text-sm bg-transparent"
            >
              <option value="">Customer</option>
              {filterCustomernames.map((item) =>
                item.customer_name?.trim() ? ( // ✅ extra safety guard
                  <option key={item.id} value={item.customer_name}>
                    {item.customer_name}
                  </option>
                ) : null,
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-54 md:mx-2 text-sm">
<User size={16} className="text-blue-500" />            <input
              type="text"
              name="contact_person"
              placeholder="Person"
              className="py-2 w-full outline-none text-sm bg-transparent"
              value={filters.contact_person}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-54 md:mx-2 text-sm">
            <i className="bi bi-telephone text-green-500"></i>
            <input
              type="text"
              name="contact_number"
              placeholder="Number"
              className="py-2 w-full outline-none text-sm bg-transparent"
              value={filters.contact_number}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-54 md:mx-2 text-sm">
            <i className="bi bi-envelope text-red-500"></i>
            <input
              type="text"
              name="email"
              placeholder="Email"
              className="py-2 w-full outline-none text-sm bg-transparent"
              value={filters.email}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-54 md:mx-2 text-sm">
            <i className="bi bi-briefcase text-blue-500"></i>
            <select
              name="contact_designation"
              value={filters.contact_designation}
              onChange={handleFilterChange}
              className="py-2 w-full outline-none text-gray-500 text-sm bg-transparent"
            >
              <option value="">Designation</option>
              {designations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 col-span-2">
            <button
              onClick={() => {
                setFilters({
                  company_name: "",
                  customer_name: "",
                  contact_person: "",
                  contact_number: "",
                  email: "",
                  contact_designation: "",
                });
                setShowMobileFilters(false);
              }}
              className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-5 py-2 bg-indigo-100 text-indigo-600  text-sm text-center font-semibold transition-colors"
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
      </div>
      {/* Table */}
     <form className="p-1 mx-4">
        {/* <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
                        <table className=" w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 custom-scroll"> */}

        <div className="overflow-x-auto overflow-y-scroll max-h-[500px] custom-scroll bg-white shadow-md rounded-sm p-1 border border-gray-200">
          <table className="w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
            <thead className="border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider bg-indigo-50">
              <tr>
                <th className="py-3 px-5 w-10">#</th>
                <th className="py-3 px-4 text-center">
                  Company Name <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                </th>

                <th className="py-3 px-4">
                  Customer Name <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                </th>
                <th className="py-3 px-4 text-center">Contact Person</th>
                <th className="py-3 px-4 text-center">
                  Contact Number <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                </th>
                <th className="py-3 px-4 text-center">Email</th>
                <th className="py-3 px-4 text-center">Contact Designation</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="py-3 px-2 text-gray-600">{index + 1}</td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-800">
                      {item.company_name}
                    </td>
                    <td className="py-3 px-2 font-medium text-blue-500">
                      {item.customer_name}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {item.contact_person}
                    </td>
                    <td className="py-3 px-2 text-center font-semibold text-slate-800">
                      {item.contact_number}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-500">{item.email}</td>
                    <td className="py-3 px-2 text-center text-gray-500">
                      {item.designation_name}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition-all"
                        >
                          <i className="bi bi-pencil-square text-sm"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item.id)} // ← changed
                          className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 cursor-pointer transition-all"
                        >
                          <i className="bi bi-trash3 text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-gray-500 py-3">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
            {/* Left side: Showing X to Y of Z entries */}
            <div className="text-sm text-slate-600 font-semibold">
              Showing {currentData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
              {(currentPage - 1) * itemsPerPage + currentData.length} entries
            </div>

            {/* Center: Navigation buttons (only if totalPages > 1) */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <i className="bi bi-chevron-right text-sm"></i>
                </button>
              </div>
            )}

            {/* Right side: Rows per page selector */}
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
                className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm text-indigo-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
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
      {/* ── ADD / EDIT CONTACT DRAWER — slides in/out from the right.
           ✅ Theme: indigo-to-violet gradient header + colored field icons,
           matching the Add Lead popup reference. UI ONLY — logic unchanged. ── */}
      {showForm && (
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            formVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => closeForm()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-gray-100 h-full w-full max-w-[95vw] md:max-w-[55vw] lg:max-w-[35vw] xl:max-w-[420px] shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out ${
              formVisible ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* ✅ Header — indigo-to-violet gradient icon box, matches Add Lead popup */}
            <div className="bg-white w-full shadow-lg p-4 mt-1 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                  {editId ? (
                    <Pencil size={18} className="text-white" />
                  ) : (
                    <UserPlus size={20} className="text-white" />
                  )}
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {editId ? "Edit Contact" : "Add Contact"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {editId
                      ? "Update the contact information below"
                      : "Fill in the details to create a new contact"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => closeForm()}
                className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* ✅ FORM BODY — same fields/handlers, restyled with icon boxes */}
            <div className="px-4 sm:px-5 pb-6">
              <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
                <form onSubmit={handleSubmit}>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all mb-3">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <Building2 size={16} className="text-blue-500" />
                      </span>
                      <select
                        name="company_name"
                        value={formdata.company_name}
                        onChange={handleFormCompanyChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Company Name</option>
                        {companyname.map((item) => (
                          <option key={item.company_name} value={item.company_name}>
                            {item.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all mb-3">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <User size={16} className="text-violet-500" />
                      </span>
                      <select
                        name="customer_id"
                        value={formdata.customer_id}
                        onChange={(e) => {
                          const selectedId = Number(e.target.value); // ✅ force INT
                          const selectedCustomer = customername.find(
                            (c) => c.id === selectedId,
                          );

                          setFormData((p) => ({
                            ...p,
                            customer_id: selectedId, // ✅ PRIMARY KEY
                            customer_name: selectedCustomer?.customer_name || "",
                          }));
                        }}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Customer Name</option>
                        {customername.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.customer_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all mb-3">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <UserRound size={16} className="text-amber-500" />
                      </span>
                      <input
                        type="text"
                        name="contact_person"
                        value={formdata.contact_person}
                        onChange={handleChange}
                        placeholder="Enter contact person name"
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all mb-3">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                        <Phone size={16} className="text-green-500" />
                      </span>
                      <input
                        type="text"
                        name="contact_number"
                        value={formdata.contact_number}
                        onChange={handleChange}
                        placeholder="Enter contact number"
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all mb-3">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Mail size={16} className="text-cyan-500" />
                      </span>
                      <input
                        type="text"
                        name="email"
                        value={formdata.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Contact Designation <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all mb-3">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <Briefcase size={16} className="text-violet-500" />
                      </span>
                      <select
                        name="contact_designation"
                        value={formdata.contact_designation}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Contact Designation</option>
                        {designations.map((item) => (
                          <option key={item.id || item.name} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        closeForm();
                      }}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 bg-white"
                    >
                      <X size={15} /> Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                    >
                      <Save size={15} /> Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
     {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-[scaleIn_0.25s_ease-out]">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2} />
          </div>
          <span className="text-base font-bold text-gray-900 uppercase tracking-wide">
            Delete Contact
          </span>
        </div>

        <button
          type="button"
          onClick={handleDeleteCancel}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-8 text-center">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <Trash2 className="w-10 h-10 text-red-600" strokeWidth={1.8} />
        </div>

        {/* Name */}
        <p className="font-extrabold text-gray-900 text-xl mb-2 uppercase tracking-wide">
          {contacts.find((c) => c.id === deleteId)?.contact_person ||
            "This Contact"}
        </p>

        {/* Divider */}
        <div className="w-10 h-[3px] bg-red-500 rounded-full mx-auto mb-4"></div>

        {/* Message */}
        <p className="text-sm text-gray-500 leading-relaxed">
          This action cannot be undone.
          <br />
          Are you sure you want to delete this contact?
        </p>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3 px-6 pb-6">
        <button
          type="button"
          onClick={handleDeleteCancel}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={2.2} />
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDeleteConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <Trash2 className="w-4 h-4" strokeWidth={2.2} />
          Delete Contact
        </button>
      </div>
    </div>

    <style jsx>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95) translateY(8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
  </div>
)}
    </>
  );
}