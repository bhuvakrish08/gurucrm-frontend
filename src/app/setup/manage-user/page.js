"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import useAuth from "@/app/components/useAuth";
import { hasRoleAccess } from "@/utils/roleAccess";

export default function Page() {
  const [users, setUsers] = useState([]);
  const [scrollOffsets, setScrollOffsets] = useState({});
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    mobile: "",
    date_of_birth: "",
    role: "",
    designation: "",
    date_of_joining: "",
    status: "",
  });
  const [viewProduct, setViewProduct] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const router = useRouter();

  useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const APIBase = `${API_BASE}/api/manage-user`;

  //  PAGINATION ADDED HERE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${APIBase}/read`, {
        params: {
          search1: filters.name,
          search2: filters.email,
          search3: filters.mobile,
          search4: filters.date_of_birth,
          search5: filters.role,
          search6: filters.designation,
          search7: filters.date_of_joining,
          search8: filters.status,
        },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load Users");
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchData();
    }, 300); // 300ms debounce

    return () => clearTimeout(delay);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  //  PAGINATION CALCULATIONS

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // to fetch active roles name
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/role-master/role-name`, {
          params: { status: 1 },
        });
        setRoles(res.data.data);
      } catch (err) {
        console.error("Failed to fetch designations:", err);
      }
    };

    fetchRoles();
  }, []);

  // to fetch active contact designation
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/contact/read`, {
          params: { status: 1 },
        });
        setDesignations(res.data || res.data.data);
      } catch (err) {
        console.error("Failed to fetch designations:", err);
      }
    };

    fetchDesignations();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    try {
      await axios.put(`${APIBase}/status/${id}`, {
        status: currentStatus === 1 ? 0 : 1,
      });
      setUsers((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? { ...item, status: currentStatus === 1 ? 0 : 1 }
            : item,
        ),
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const resetFilter = () => {
    setFilters({
      name: "",
      email: "",
      mobile: "",
      date_of_birth: "",
      role: "",
      designation: "",
      date_of_joining: "",
      status: "",
    });
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
                href="/setup/manage-user"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Manage User
              </Link>
            </p>
          </div>

          <div className="w-full sm:w-auto">
            {hasRoleAccess(["Super Admin"]) && (
              <Link
                href="/setup/manage-user/add-user"
                className="block text-center bg-blue-800 text-white px-5 py-2 rounded-sm shadow hover:bg-blue-900 font-bold text-sm"
              >
                + ADD USER
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
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

        <div
          className={`
                    ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
                    md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
                `}
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.name}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="email"
            placeholder="Email"
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.email}
            onChange={handleFilterChange}
          />

          <input
            type="text"
            name="mobile"
            placeholder="Mobile No."
            className="p-2 w-full md:w-52 border border-orange-300 md:border text-gray-700 bg-white rounded-sm outline-none text-sm"
            value={filters.mobile}
            onChange={handleFilterChange}
          />

          <div className="flex flex-col border border-orange-300 md:border bg-white rounded-sm px-2 w-full md:w-auto">
            <span className="text-[10px] text-gray-400 uppercase font-bold pt-1">
              DOB
            </span>
            <input
              type="date"
              name="date_of_birth"
              value={filters.date_of_birth}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none text-sm"
            />
          </div>

          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-53 md:mx-2 border border-orange-300 md:border text-gray-500 bg-white rounded-sm outline-none text-sm"
          >
            <option value="">Role</option>
            {roles.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            name="designation"
            value={filters.designation}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-53 md:mx-2 border border-orange-300 md:border text-gray-500 bg-white rounded-sm outline-none text-sm"
          >
            <option value="">Designation</option>
            {designations.map((item) => (
              <option key={item.id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="flex flex-col border border-orange-300 md:border bg-white rounded-sm px-2 w-full md:w-auto">
            <span className="text-[10px] text-gray-400 uppercase font-bold pt-1">
              DOJ
            </span>
            <input
              type="date"
              name="date_of_joining"
              value={filters.date_of_joining}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none text-sm"
            />
          </div>

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
        <form className="p-1 mx-4">
          <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll">
              <table className=" w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-900  text-xs">
                  <tr>
                    <th className="py-3 px-5 w-10">#</th>
                    <th className="py-3 px-4">Name</th>

                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Mobile No.</th>
                    <th className="py-3 px-4">Date of Birth</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Date of Joining</th>
                    {hasRoleAccess(["Super Admin"]) && (
                      <th className="py-3 px-4">Status</th>
                    )}
                    {hasRoleAccess(["Super Admin"]) && (
                      <th className="py-3 px-4">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 transition`}
                      >
                        <td className="py-1 px-4 text-gray-600">{index + 1}</td>
                        <td className="py-2 px-4">{item.name}</td>
                        <td className="py-1 px-4 text-gray-800">
                          {item.email}
                          <button
                            type="button"
                            onClick={() => {
                              copyToClipboard(item.email);
                              toast.success("Copied!");
                            }}
                            className="p-1 mx-1 rounded hover:bg-gray-200"
                            title="Copy Email"
                          >
                            <i className="bi bi-copy"></i>
                          </button>
                        </td>
                        <td className="py-2 px-4">{item.mobile}</td>
                        <td className="py-2 px-4">
                          {formatDate(item.date_of_birth)}
                        </td>
                        <td className="py-2 px-4">{item.role}</td>
                        <td className="py-2 px-4">{item.designation}</td>
                        <td className="py-2 px-4">
                          {formatDate(item.date_of_joining)}
                        </td>
                        {/* Role Validation */}
                        {hasRoleAccess(["Super Admin"]) && (
                          <td className="py-2 px-4">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={item.status === 1}
                                onChange={() =>
                                  handleToggle(item.id, item.status)
                                }
                              />
                              <div
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.status === 1 ? "bg-blue-800" : "bg-gray-300"}`}
                              >
                                <div
                                  className={`absolute top-1 left-1 w-4 h-3 bg-white rounded-full transition-all duration-300 ${item.status === 1 ? "translate-x-6" : "translate-x-1"}`}
                                ></div>
                              </div>
                            </label>
                          </td>
                        )}
                        {/* Role Validation */}
                        {hasRoleAccess(["Super Admin"]) && (
                          <td className="py-2 px-4 text-lg">
                            <button
                              type="button"
                              onClick={() => {
                                localStorage.setItem("edit_user_id", item.id);
                                router.push("/setup/manage-user/view-user");
                              }}
                              className="text-gray-400 text-xl hover:text-green-700 mx-1"
                              title="View User"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                localStorage.setItem("edit_user_id", item.id);
                                router.push("/setup/manage-user/update-user");
                              }}
                              className="text-gray-400 hover:text-blue-500 text-lg mx-1"
                              title="Edit User"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
                        className="text-center text-gray-500 py-3"
                      >
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-gray-200 bg-white rounded-b-lg gap-3">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium rounded-md border bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page Info Centered */}
                <span className="text-sm text-gray-600">
                  Page <span className="font-semibold">{currentPage}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span>
                </span>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-md border bg-blue-800 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
