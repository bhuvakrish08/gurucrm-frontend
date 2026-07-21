"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building2,
  Briefcase,
  Globe,
  MapPin,
  Hash,
  Lock,
  FileText,
  Plus,
  X,
  Save,
  Pencil,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";
import { hasRoleAccess } from "@/utils/roleAccess";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // ✅ NEW: Add User — right-side slide-in/out drawer state
  const EMPTY_ADD_USER_FORM = {
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    mobile: "",
    date_of_birth: "",
    date_of_joining: "",
    role: "",
    organization: "",
    designation: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    password: "",
    confirm_password: "",
    address: "",
  };
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserPanelVisible, setAddUserPanelVisible] = useState(false);
  const [addUserForm, setAddUserForm] = useState(EMPTY_ADD_USER_FORM);
  const [organizations, setOrganizations] = useState([]);
  const [addUserEmailExists, setAddUserEmailExists] = useState(false);
  const [addUserSaving, setAddUserSaving] = useState(false);
  const emailCheckTimeoutRef = useRef(null);

  // ✅ NEW: Edit User — right-side slide-in/out drawer state
  const EMPTY_EDIT_USER_FORM = {
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    mobile: "",
    date_of_birth: "",
    date_of_joining: "",
    role: "",
    organization: "",
    designation: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    password: "",
    confirm_password: "",
    address: "",
  };
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUserPanelVisible, setEditUserPanelVisible] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editUserForm, setEditUserForm] = useState(EMPTY_EDIT_USER_FORM);
  const [editUserSaving, setEditUserSaving] = useState(false);
  const [editUserShowPassword, setEditUserShowPassword] = useState(false);
  const [editUserShowConfirmPassword, setEditUserShowConfirmPassword] =
    useState(false);

  // ✅ NEW: View User — right-side slide-in/out drawer state
  const EMPTY_VIEW_USER_DATA = {
    name: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    mobile: "",
    date_of_birth: "",
    date_of_joining: "",
    role: "",
    designation: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    address: "",
    status: null,
  };
  const [showViewUser, setShowViewUser] = useState(false);
  const [viewUserPanelVisible, setViewUserPanelVisible] = useState(false);
  const [viewUserId, setViewUserId] = useState(null);
  const [viewUserData, setViewUserData] = useState(EMPTY_VIEW_USER_DATA);

  useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const APIBase = `${API_BASE}/api/manage-user`;

  // Standardized Micara IMS Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Reset page when filters or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

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

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

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

  // ✅ NEW: fetch active organizations for the Add User drawer
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/organizations/organization-name`,
          {
            params: { status: 1 },
          },
        );
        setOrganizations(res.data.data);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
      }
    };

    fetchOrganizations();
  }, []);

  // ✅ NEW: Add User drawer slide-in trigger
  useEffect(() => {
    if (showAddUser) {
      const t = setTimeout(() => setAddUserPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showAddUser]);

  // ✅ NEW: animated close for the Add User drawer — slide-out first, then reset
  const closeAddUser = () => {
    setAddUserPanelVisible(false);
    setTimeout(() => {
      setShowAddUser(false);
      setAddUserForm(EMPTY_ADD_USER_FORM);
      setAddUserEmailExists(false);
    }, 300);
  };

  // ✅ NEW: debounced email-exists check for the Add User drawer
  const checkAddUserEmailExists = async (email) => {
    if (!email) return;
    try {
      const res = await axios.get(`${API_BASE}/api/manage-user/read-email`, {
        params: { email },
      });
      setAddUserEmailExists(!!res.data.exists);
    } catch (err) {
      console.error("Email check failed:", err);
      setAddUserEmailExists(false);
    }
  };

  const handleAddUserChange = (e) => {
    const { name, value } = e.target;
    setAddUserForm((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      clearTimeout(emailCheckTimeoutRef.current);
      emailCheckTimeoutRef.current = setTimeout(
        () => checkAddUserEmailExists(value),
        600,
      );
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    if (addUserEmailExists) {
      toast.error("Email already exists. Please use a different one.");
      return;
    }

    if (addUserForm.password !== addUserForm.confirm_password) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      setAddUserSaving(true);
      const payload = {
        first_name: addUserForm.first_name,
        middle_name: addUserForm.middle_name,
        last_name: addUserForm.last_name,
        email: addUserForm.email,
        mobile: addUserForm.mobile,
        date_of_birth: addUserForm.date_of_birth,
        date_of_joining: addUserForm.date_of_joining,
        role: addUserForm.role,
        organization: addUserForm.organization,
        designation: addUserForm.designation,
        country: addUserForm.country,
        state: addUserForm.state,
        city: addUserForm.city,
        pincode: addUserForm.pincode,
        password: addUserForm.password,
        address: addUserForm.address,
      };

      const res = await axios.post(
        `${API_BASE}/api/manage-user/insert`,
        payload,
      );

      if (res.status === 201 || res.status === 200) {
        toast.success("User added successfully!");
        closeAddUser();
        fetchData();
      } else {
        toast.error("Something went wrong. Try again!");
      }
    } catch (err) {
      toast.error("Failed to add user. Something went wrong!");
    } finally {
      setAddUserSaving(false);
    }
  };

  // ✅ NEW: date -> yyyy-mm-dd for the Edit User date inputs (separate from the
  // table's DD-MM-YYYY formatDate, since inputs need the yyyy-mm-dd format)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 10);
  };

  // ✅ NEW: open the Edit User drawer for a given row
  const openEditUser = (id) => {
    setEditUserId(id);
    setShowEditUser(true);
  };

  // ✅ NEW: fetch the selected user's data once the drawer is opened
  useEffect(() => {
    if (!editUserId) return;

    axios
      .get(`${API_BASE}/api/manage-user/read/${editUserId}`)
      .then((res) => {
        const d = res.data.data;
        const fullName = d?.name ? d.name.trim().split(" ") : [];
        let first = fullName[0] || "";
        let middle = fullName.length === 3 ? fullName[1] : "";
        let last = fullName.length === 3 ? fullName[2] : fullName[1] || "";

        setEditUserForm({
          first_name: first,
          middle_name: middle,
          last_name: last,
          email: d.email || "",
          mobile: d.mobile || "",
          date_of_birth: formatDateForInput(d.date_of_birth),
          date_of_joining: formatDateForInput(d.date_of_joining),
          role: d.role || "",
          organization: d.organization || "",
          designation: d.designation || "",
          country: d.country || "",
          state: d.state || "",
          city: d.city || "",
          pincode: d.pincode || "",
          password: d.password || "",
          confirm_password: d.password || "",
          address: d.address || "",
        });
      })
      .catch(() => toast.error("Failed to load user data"));
  }, [editUserId]);

  // ✅ NEW: Edit User drawer slide-in trigger
  useEffect(() => {
    if (showEditUser) {
      const t = setTimeout(() => setEditUserPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showEditUser]);

  // ✅ NEW: animated close for the Edit User drawer — slide-out first, then reset
  const closeEditUser = () => {
    setEditUserPanelVisible(false);
    setTimeout(() => {
      setShowEditUser(false);
      setEditUserId(null);
      setEditUserForm(EMPTY_EDIT_USER_FORM);
      setEditUserShowPassword(false);
      setEditUserShowConfirmPassword(false);
    }, 300);
  };

  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setEditUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();

    const fullName =
      `${editUserForm.first_name} ${editUserForm.middle_name} ${editUserForm.last_name}`
        .replace(/\s+/g, " ")
        .trim();

    if (editUserForm.password !== editUserForm.confirm_password) {
      toast.error("Passwords do not match!");
      return;
    }

    const sendData = { ...editUserForm, name: fullName };

    try {
      setEditUserSaving(true);
      const res = await axios.put(
        `${API_BASE}/api/manage-user/update/${editUserId}`,
        sendData,
      );

      if (res.status === 200) {
        toast.success("User updated successfully!");
        closeEditUser();
        fetchData();
      } else {
        toast.error("Update failed!");
      }
    } catch (err) {
      console.log("Something went wrong!", err);
      toast.error("Update failed!");
    } finally {
      setEditUserSaving(false);
    }
  };

  // ✅ NEW: open the View User drawer for a given row
  const openViewUser = (id) => {
    setViewUserId(id);
    setShowViewUser(true);
  };

  // ✅ NEW: fetch the selected user's data once the View drawer is opened
  useEffect(() => {
    if (!viewUserId) return;

    axios
      .get(`${API_BASE}/api/manage-user/read/${viewUserId}`)
      .then((res) => {
        const d = res.data.data;
        const fullName = d?.name ? d.name.trim().split(" ") : [];
        let first = fullName[0] || "";
        let middle = "";
        let last = "";
        if (fullName.length === 3) {
          middle = fullName[1];
          last = fullName[2];
        } else if (fullName.length === 2) {
          last = fullName[1];
        }

        setViewUserData({
          name: d.name || "",
          first_name: first,
          middle_name: middle,
          last_name: last,
          email: d.email || "",
          mobile: d.mobile || "",
          date_of_birth: formatDate(d.date_of_birth),
          date_of_joining: formatDate(d.date_of_joining),
          role: d.role || "",
          designation: d.designation || "",
          country: d.country || "",
          state: d.state || "",
          city: d.city || "",
          pincode: d.pincode || "",
          address: d.address || "",
          status: d.status,
        });
      })
      .catch(() => toast.error("Failed to load user data"));
  }, [viewUserId]);

  // ✅ NEW: View User drawer slide-in trigger
  useEffect(() => {
    if (showViewUser) {
      const t = setTimeout(() => setViewUserPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showViewUser]);

  // ✅ NEW: animated close for the View User drawer — slide-out first, then reset
  const closeViewUser = () => {
    setViewUserPanelVisible(false);
    setTimeout(() => {
      setShowViewUser(false);
      setViewUserId(null);
      setViewUserData(EMPTY_VIEW_USER_DATA);
    }, 300);
  };

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

  const isSuperAdmin = mounted ? hasRoleAccess(["Super Admin"]) : false;

  // ✅ NEW: colorful pill badges for Designation (matches the "Source" tag style in the reference)
  const designationColors = [
    { bg: "bg-pink-50", text: "text-pink-600" },
    { bg: "bg-violet-50", text: "text-violet-600" },
    { bg: "bg-cyan-50", text: "text-cyan-600" },
    { bg: "bg-fuchsia-50", text: "text-fuchsia-600" },
    { bg: "bg-blue-50", text: "text-blue-600" },
    { bg: "bg-emerald-50", text: "text-emerald-600" },
    { bg: "bg-amber-50", text: "text-amber-600" },
    { bg: "bg-rose-50", text: "text-rose-600" },
  ];

  const getDesignationColor = (name) => {
    if (!name) return designationColors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return designationColors[Math.abs(hash) % designationColors.length];
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
                href="/setup"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600"
              >
                Settings
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/setup/manage-user"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600"
              >
                Manage User
              </Link>
            </p>
          </div>

          <div className="w-full sm:w-auto">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setShowAddUser(true)}
                className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all cursor-pointer"
              >
                + ADD USER
              </button>
            )}
          </div>
        </div>

        {/* ✅ Filters — restyled to match reference (indigo bordered pill inputs w/ colored inline icons, image-2 style) */}
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
          {/* Name */}
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
            <User size={16} className=" text-violet-500" strokeWidth={2} />
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
            <Mail className="w-4 h-4 text-cyan-500 shrink-0" strokeWidth={2} />
            <input
              type="text"
              name="email"
              placeholder="Email"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.email}
              onChange={handleFilterChange}
            />
          </div>

          {/* Mobile No. */}
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
            <Phone
              className="w-4 h-4 text-emerald-500 shrink-0"
              strokeWidth={2}
            />
            <input
              type="text"
              name="mobile"
              placeholder="Mobile No"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.mobile}
              onChange={handleFilterChange}
            />
          </div>

          {/* DOB */}
          <div className="flex p-1 items-center px-2 border bg-white border-indigo-400 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              DOB
            </span>
            <input
              type="date"
              name="date_of_birth"
              value={filters.date_of_birth}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          {/* Role */}
          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="border p-1 bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Role</option>
            {roles.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          {/* Designation */}
          <select
            name="designation"
            value={filters.designation}
            onChange={handleFilterChange}
            className="border p-1 bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Designation</option>
            {designations.map((item) => (
              <option key={item.id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          {/* DOJ */}
          <div className="flex p-1 items-center px-2 border bg-white border-indigo-400 rounded-sm w-full md:w-53  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              DOJ
            </span>
            <input
              type="date"
              name="date_of_joining"
              value={filters.date_of_joining}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          {/* Status */}
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="border p-1 bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
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

        {/* ✅ Table — restyled to match reference (indigo header w/ sort icons, status dot, bolder name, indigo hover) */}
        <form className="p-1 mx-4">
          <div className="bg-white shadow-md rounded-sm p-1 border border-gray-200">
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll">
              <table className="w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
                  <tr>
                    <th className="py-3 px-5 w-10 text-center">#</th>
                    <th className="py-3 px-4">
                      Name{" "}
                      <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Mobile No.</th>
                    <th className="py-3 px-4">
                      Date of Birth{" "}
                      <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">
                      Date of Joining{" "}
                      <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                    {isSuperAdmin && (
                      <th className="py-3 px-4 text-center">
                        Status{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                    )}
                    {isSuperAdmin && (
                      <th className="py-3 px-4 text-center">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-400 text-xs font-medium text-center">
                          {index + 1}
                        </td>
                        <td className="py-2 px-4 font-semibold text-slate-800">
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                item.status === 1
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            ></span>
                            {item.name}
                          </span>
                        </td>
                        <td className="py-1 px-4 text-gray-600">
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
                        <td className="py-2 px-4 text-gray-600">
                          {item.mobile}
                        </td>
                        <td className="py-2 px-4 text-gray-600">
                          {formatDate(item.date_of_birth)}
                        </td>
                        <td className="py-2 px-4 text-gray-600">{item.role}</td>
                        <td className="py-2 px-4">
                          {item.designation ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                                getDesignationColor(item.designation).bg
                              } ${getDesignationColor(item.designation).text}`}
                            >
                              {item.designation}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-gray-600">
                          {formatDate(item.date_of_joining)}
                        </td>
                        {/* Role Validation */}
                        {isSuperAdmin && (
                          <td className="py-2 px-4 text-center">
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
                        {isSuperAdmin && (
                          <td className="py-2 px-4 text-lg text-center">
                            <button
                              type="button"
                              onClick={() => openViewUser(item.id)}
                              className="text-gray-400 text-xl hover:text-green-700 mx-1"
                              title="View User"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditUser(item.id)}
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
            {/* ✅ PAGINATION — restyled to match reference (image-3: "Showing X to Y entries" left, "Rows per page" right w/ indigo accent) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
              {/* Left side: Showing entries text */}
              <p className="text-sm font-semibold text-gray-800">
                Showing {users.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, users.length)} entries
              </p>

              {/* Right side: page navigation (only if totalPages > 1) + Rows per page */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
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
        </form>

        {/* ✅ Add User — right-side slide-in/out drawer, indigo-violet theme, icon-boxed fields (image-1 style) */}
        {showAddUser && (
          <div
            className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
              addUserPanelVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeAddUser}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`bg-white h-full w-full sm:max-w-[680px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
                addUserPanelVisible ? "translate-x-0" : "translate-x-full"
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
                        Add User
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Fill in the details to create a new user
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeAddUser}
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

              {/* Body */}
              <form onSubmit={handleAddUserSubmit} className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      First Name <span className="text-red-500">*</span>
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
                        name="first_name"
                        value={addUserForm.first_name}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Middle Name
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-gray-50 border-r border-gray-100">
                        <User
                          className="w-4 h-4 text-gray-400"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="middle_name"
                        value={addUserForm.middle_name}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <User
                          className="w-4 h-4 text-violet-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="last_name"
                        value={addUserForm.last_name}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`flex items-stretch border rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all ${
                        addUserEmailExists
                          ? "border-red-400"
                          : "border-gray-200"
                      }`}
                    >
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Mail
                          className="w-4 h-4 text-cyan-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={addUserForm.email}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                    <p
                      className={`text-[11px] text-red-500 mt-1.5 transition-all duration-300 ease-in-out ${
                        addUserEmailExists
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 -translate-y-1 pointer-events-none h-0"
                      }`}
                    >
                      Email already exists
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                        <Phone
                          className="w-4 h-4 text-emerald-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="mobile"
                        value={addUserForm.mobile}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <Calendar
                          className="w-4 h-4 text-amber-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={addUserForm.date_of_birth}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Date of Joining <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-indigo-50 border-r border-gray-100">
                        <Calendar
                          className="w-4 h-4 text-indigo-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="date"
                        name="date_of_joining"
                        value={addUserForm.date_of_joining}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-fuchsia-50 border-r border-gray-100">
                        <Shield
                          className="w-4 h-4 text-fuchsia-500"
                          strokeWidth={2}
                        />
                      </span>
                      <select
                        name="role"
                        value={addUserForm.role}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Role</option>
                        {roles.map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Organization
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <Building2
                          className="w-4 h-4 text-blue-500"
                          strokeWidth={2}
                        />
                      </span>
                      <select
                        name="organization"
                        value={addUserForm.organization}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Organization</option>
                        {organizations.map((item) => (
                          <option
                            key={item.id || item.organization_name}
                            value={item.organization_name}
                          >
                            {item.organization_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <Briefcase
                          className="w-4 h-4 text-violet-500"
                          strokeWidth={2}
                        />
                      </span>
                      <select
                        name="designation"
                        value={addUserForm.designation}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Contact Designation</option>
                        {designations.map((item) => (
                          <option key={item.id || item.name} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Country
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Globe
                          className="w-4 h-4 text-cyan-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="country"
                        value={addUserForm.country}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      State
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
                        value={addUserForm.state}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      City
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
                        value={addUserForm.city}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Pin Code
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
                        value={addUserForm.pincode}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-red-50 border-r border-gray-100">
                        <Lock
                          className="w-4 h-4 text-red-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="password"
                        name="password"
                        value={addUserForm.password}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-rose-50 border-r border-gray-100">
                        <Lock
                          className="w-4 h-4 text-rose-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="password"
                        name="confirm_password"
                        value={addUserForm.confirm_password}
                        onChange={handleAddUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Address
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                      <FileText
                        className="w-4 h-4 text-blue-500"
                        strokeWidth={2}
                      />
                    </span>
                    <textarea
                      name="address"
                      value={addUserForm.address}
                      onChange={handleAddUserChange}
                      rows={2}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeAddUser}
                    disabled={addUserSaving}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white disabled:opacity-60"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addUserSaving}
                    className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {addUserSaving ? (
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

        {/* ✅ Edit User — right-side slide-in/out drawer, indigo-violet theme, icon-boxed fields (Edit Lead reference style) */}
        {showEditUser && (
          <div
            className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
              editUserPanelVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeEditUser}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`bg-white h-full w-full sm:max-w-[680px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
                editUserPanelVisible ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* Header — Pencil icon */}
              <div className="bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                      <Pencil className="w-5 h-5 text-white" strokeWidth={2} />
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-900">
                        Edit User
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Update the details of this user
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditUser}
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

              {/* Body */}
              <form onSubmit={handleEditUserSubmit} className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      First Name <span className="text-red-500">*</span>
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
                        name="first_name"
                        value={editUserForm.first_name}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Middle Name
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-gray-50 border-r border-gray-100">
                        <User
                          className="w-4 h-4 text-gray-400"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="middle_name"
                        value={editUserForm.middle_name}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <User
                          className="w-4 h-4 text-violet-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="last_name"
                        value={editUserForm.last_name}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
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
                        type="email"
                        name="email"
                        value={editUserForm.email}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                        <Phone
                          className="w-4 h-4 text-emerald-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="mobile"
                        value={editUserForm.mobile}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <Calendar
                          className="w-4 h-4 text-amber-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={editUserForm.date_of_birth}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Date of Joining <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-indigo-50 border-r border-gray-100">
                        <Calendar
                          className="w-4 h-4 text-indigo-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="date"
                        name="date_of_joining"
                        value={editUserForm.date_of_joining}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-fuchsia-50 border-r border-gray-100">
                        <Shield
                          className="w-4 h-4 text-fuchsia-500"
                          strokeWidth={2}
                        />
                      </span>
                      <select
                        name="role"
                        value={editUserForm.role}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Role</option>
                        {roles.map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Organization
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <Building2
                          className="w-4 h-4 text-blue-500"
                          strokeWidth={2}
                        />
                      </span>
                      <select
                        name="organization"
                        value={editUserForm.organization}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Organization</option>
                        {organizations.map((item) => (
                          <option
                            key={item.id || item.organization_name}
                            value={item.organization_name}
                          >
                            {item.organization_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <Briefcase
                          className="w-4 h-4 text-violet-500"
                          strokeWidth={2}
                        />
                      </span>
                      <select
                        name="designation"
                        value={editUserForm.designation}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Designation</option>
                        {designations.map((item) => (
                          <option key={item.id || item.name} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Country
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Globe
                          className="w-4 h-4 text-cyan-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type="text"
                        name="country"
                        value={editUserForm.country}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      State
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
                        value={editUserForm.state}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      City
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
                        value={editUserForm.city}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Pin Code
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
                        value={editUserForm.pincode}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-red-50 border-r border-gray-100">
                        <Lock
                          className="w-4 h-4 text-red-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type={editUserShowPassword ? "text" : "password"}
                        name="password"
                        value={editUserForm.password}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setEditUserShowPassword((v) => !v)}
                        className="flex items-center justify-center w-9 shrink-0 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {editUserShowPassword ? (
                          <EyeOff className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-rose-50 border-r border-gray-100">
                        <Lock
                          className="w-4 h-4 text-rose-500"
                          strokeWidth={2}
                        />
                      </span>
                      <input
                        type={editUserShowConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        value={editUserForm.confirm_password}
                        onChange={handleEditUserChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditUserShowConfirmPassword((v) => !v)
                        }
                        className="flex items-center justify-center w-9 shrink-0 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {editUserShowConfirmPassword ? (
                          <EyeOff className="w-4 h-4" strokeWidth={2} />
                        ) : (
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Address
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                      <FileText
                        className="w-4 h-4 text-blue-500"
                        strokeWidth={2}
                      />
                    </span>
                    <textarea
                      name="address"
                      value={editUserForm.address}
                      onChange={handleEditUserChange}
                      rows={2}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeEditUser}
                    disabled={editUserSaving}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white disabled:opacity-60"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editUserSaving}
                    className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {editUserSaving ? (
                      <>
                        <i className="bi bi-hourglass-split"></i> Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" strokeWidth={2} /> Save
                        Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ✅ View User — right-side slide-in/out drawer, icon-card read-only fields (image reference style) */}
        {showViewUser && (
          <div
            className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
              viewUserPanelVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeViewUser}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`bg-white h-full w-full sm:max-w-[680px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
                viewUserPanelVisible ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* Header — Eye icon, user's name as title, status as subtitle */}
              <div className="bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                      <Eye className="w-5 h-5 text-white" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {viewUserData.name || "View User"}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Status:{" "}
                        {viewUserData.status === 1
                          ? "Active"
                          : viewUserData.status === 0
                            ? "Inactive"
                            : "-"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeViewUser}
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

              {/* Body — read-only icon-card fields */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-blue-600" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        First Name
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.first_name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Middle Name
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.middle_name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <User
                        className="w-4 h-4 text-violet-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Last Name
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.last_name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-cyan-600" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Email
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.email || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Phone
                        className="w-4 h-4 text-emerald-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Mobile No
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.mobile || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Calendar
                        className="w-4 h-4 text-amber-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Date of Birth
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.date_of_birth || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Calendar
                        className="w-4 h-4 text-indigo-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Date of Joining
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.date_of_joining || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-fuchsia-100 flex items-center justify-center shrink-0">
                      <Shield
                        className="w-4 h-4 text-fuchsia-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Role
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.role || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <Briefcase
                        className="w-4 h-4 text-violet-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Designation
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.designation || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                      <Globe
                        className="w-4 h-4 text-cyan-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Country
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.country || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <MapPin
                        className="w-4 h-4 text-green-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        State
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.state || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <MapPin
                        className="w-4 h-4 text-amber-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        City
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.city || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <Hash className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Pin Code
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.pincode || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                    <span className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText
                        className="w-4 h-4 text-blue-600"
                        strokeWidth={2}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Address
                      </p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
                        {viewUserData.address || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeViewUser}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} /> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
