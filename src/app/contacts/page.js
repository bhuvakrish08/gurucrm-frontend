"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import Header from "../components/header";
import useAuth from "../components/useAuth";

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
    setShowForm(false);
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
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Customer
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/contacts"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Contacts
              </Link>
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto bg-orange-500 text-white px-5 py-2 rounded-sm shadow hover:bg-orange-600 font-bold text-sm"
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
          <select
            name="company_name"
            value={filters.company_name}
            onChange={handleFilterCompanyChange}
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-54 md:mx-2 outline-none text-gray-500 text-sm"
          >
            <option value="">Company</option>
            {companyname.map((item) => (
              <option key={item.company_name} value={item.company_name}>
                {item.company_name}
              </option>
            ))}
          </select>

          <select
            name="customer_name"
            value={filters.customer_name}
            onChange={handleFilterChange}
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:flex-1 md:min-w-0 outline-none text-gray-500 text-sm"
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

          <input
            type="text"
            name="contact_person"
            placeholder="Person"
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-54 md:mx-2 outline-none text-sm"
            value={filters.contact_person}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="contact_number"
            placeholder="Number"
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-54 md:mx-2 outline-none text-sm"
            value={filters.contact_number}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="email"
            placeholder="Email"
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-54 md:mx-2 outline-none text-sm"
            value={filters.email}
            onChange={handleFilterChange}
          />

          <select
            name="contact_designation"
            value={filters.contact_designation}
            onChange={handleFilterChange}
            className="border bg-white border-orange-300 rounded-sm px-3 py-2 w-full md:w-54 md:mx-2 outline-none text-gray-500 text-sm"
          >
            <option value="">Designation</option>
            {designations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

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
              className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold"
            >
              Clear
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
            <thead className="  border-b border-gray-200  text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
              <tr>
                <th className="py-3 px-5 w-10">#</th>
                <th className="py-3 px-4 text-center">Company Name</th>

                <th className="py-3 px-4 ">Customer Name</th>
                <th className="py-3 px-4 text-center">Contact Person</th>
                <th className="py-3 px-4 text-center">Contact Number</th>
                <th className="py-3 px-4 text-center">Email</th>
                <th className="py-3 px-4 text-center">Contact Designation</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition`}>
                    <td className="py-1 px-4 text-gray-600">{index + 1}</td>
                    <td className="py-2 px-4 text-center">
                      {item.company_name}
                    </td>
                    <td className="py-1 px-4 font-medium text-orange-500">
                      {item.customer_name}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {item.contact_person}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {item.contact_number}
                    </td>
                    <td className="py-2 px-4 text-center">{item.email}</td>
                    <td className="py-2 px-4 text-center">
                      {item.designation_name}
                    </td>
                    <td className="py-2 px-4 text-center text-lg">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="text-gray-400 hover:text-blue-700 mx-2"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(item.id)} // ← changed
                        className="text-gray-400 hover:text-red-600"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
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
          </div>
        </div>
      </form>
      {/* Modal remains same */}
      {/* ── ADD TABLE CONTACTS MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/30 z-50 flex justify-center items-center">
          <div className="bg-white rounded-sm shadow-lg w-[450px] relative overflow-hidden">
            {/* ✅ HEADER with gradient - like reference image */}
            <div className="bg-gradient-to-r from-orange-100 to-white px-6 py-5 mb-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-xl text-orange-500 hover:text-orange-600"
              >
                ✕
              </button>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {editId ? "Edit" : "Add"} Table Contacts
              </h3>
            </div>

            {/* ✅ FORM BODY */}
            <div className="px-6 pb-6">
              <form onSubmit={handleSubmit}>
                <label className="block text-sm  text-gray-500 mb-2">
                  Comapany Name *
                </label>
                <select
                  name="company_name"
                  value={formdata.company_name}
                  onChange={handleFormCompanyChange}
                  className="w-full border rounded-sm p-2 mb-3 outline-none border-orange-300 "
                >
                  <option value="">Select Company Name</option>
                  {companyname.map((item) => (
                    <option key={item.company_name} value={item.company_name}>
                      {item.company_name}
                    </option>
                  ))}
                </select>

                <label className="block text-sm  text-gray-500 mb-2">
                  Customer Name *
                </label>
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
                  className="w-full border rounded-sm p-2 mb-3 outline-none border-orange-300 "
                >
                  <option value="">Select Customer Name</option>
                  {customername.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.customer_name}
                    </option>
                  ))}
                </select>

                <label className="block text-sm  text-gray-500 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  className="border p-2  rounded-sm mb-3 outline-none border-orange-300 w-full"
                  name="contact_person"
                  value={formdata.contact_person}
                  onChange={handleChange}
                />

                <label className="block text-sm  text-gray-500 mb-2">
                  Contact Number *
                </label>
                <input
                  type="text"
                  className="border p-2 w-full rounded-sm mb-3 outline-none border-orange-300"
                  name="contact_number"
                  value={formdata.contact_number}
                  onChange={handleChange}
                />

                <label className="block text-sm  text-gray-500 mb-2">
                  Email
                </label>
                <input
                  type="text"
                  className="border p-2 w-full rounded-sm    mb-3 outline-none border-orange-300"
                  name="email"
                  value={formdata.email}
                  onChange={handleChange}
                />

                <label className="block text-sm  text-gray-500 mb-2">
                  Contact Designation *
                </label>
                <select
                  name="contact_designation"
                  value={formdata.contact_designation}
                  onChange={handleChange}
                  className="w-full border rounded-sm p-2 mb-3 outline-none border-orange-300 "
                >
                  <option value="">Select Contact Designation</option>
                  {designations.map((item) => (
                    <option key={item.id || item.name} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                    }}
                    className="px-4 py-2 rounded-sm    border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-500  hover:bg-orange-600 text-white px-4 py-1.5 rounded-sm"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/30 z-50 flex justify-center items-center">
          <div className="bg-white rounded-sm shadow-xl w-[380px] relative overflow-hidden">
            {/* Header */}
            <div className="from-orange-100 to-white bg-gradient-to-r  px-5 py-3 flex items-center justify-between ">
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-xl shadow-lg p-6 w-[500px] relative overflow-hidden"></div>{" "}
                <i className="bi bi-trash3 text-orange-500 text-sm"></i>
                <span className="text-xs font-bold tracking-widest text-gray-700 uppercase">
                  Delete Contact
                </span>
              </div>
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="text-orange-500 text-md "
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 flex flex-col items-center">
              {/* Trash Icon */}
              <div className="bg-orange-100 rounded-full p-4 mb-4">
                <i className="bi bi-trash3 text-orange-500 text-2xl"></i>
              </div>

              {/* Contact Name */}
              <h3 className="text-center text-base font-bold text-gray-800 mb-1 uppercase tracking-wide">
                {contacts.find((c) => c.id === deleteId)?.contact_person ||
                  "This Contact"}
              </h3>

              {/* Subtext */}
              <p className="text-center text-sm text-gray-400 mb-6">
                This action cannot be undone. Are you sure?
              </p>

              {/* Buttons */}
              <div className="flex gap-3 w-full p-x-6">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="flex-1 py-2.5 rounded-md border  border-gray-300 text-gray-600 hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5  rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-all text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
