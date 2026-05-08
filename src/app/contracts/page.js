"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import Header from "../components/header";
import Select from "react-select";
import { useRouter } from "next/navigation";
import useAuth from "../components/useAuth";


export default function Page() {

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
    useAuth();

    const [formData, setFormData] = useState({
        company_name: "",
        customer_name: "",
        contract_name: "",
        contract_type: "",
        contract_value: "",
        start_date: "",
        end_date: "",
        description: "",
        assignee: "",
    });
    const [editId, setEditId] = useState(null);
    const [contractList, setContractList] = useState([]);
    const [asignee, setAsignee] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [users, setUsers] = useState([]);
    const [token, setToken] = useState("");
    const [company, setCompany] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [filters, setFilters] = useState({
        search: "",
        company_name: "",
        customer_name: "",
        contract_name: "",
        contract_type: "",
        contract_value: "",
        start_date: "",
        end_date: "",
        assignee: "",
        created_by_name: "",
        created_at: "",
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);


    const router = useRouter()

    const [scrollOffsets, setScrollOffsets] = useState({});
    const [loadingColumns, setLoadingColumns] = useState({})


    const APIBase = `${API_BASE}/api/contracts-list`


    // Standardized Micara IMS Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);



    const fetchData = async () => {
        const res = await axios.get(`${APIBase}/read`, {
            headers: { Authorization: `Bearer ${token}` },
            params: filters
        });
        const data = res.data.result || [];
        setContracts(Array.isArray(data) ? data : []);
    };


    useEffect(() => {
        const t = localStorage.getItem("token");
        setToken(t);
    }, []);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, filters]);

    // Reset page when filters or items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, itemsPerPage]);




    // delete functionality

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        try {
            const res = await axios.delete(`${API_BASE}/api/contracts-list/delete/${deleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("Contract deleted successfully");
                setContracts((prev) => prev.filter(item => item.id !== deleteId));
            } else {
                toast.error("Failed to delete contract");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong!");
        } finally {
            setShowDeleteModal(false);
            setDeleteId(null);
        }
    };


    // Standardized Pagination Calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = contracts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(contracts.length / itemsPerPage);

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



    // Asignee dropdown api calling
    useEffect(() => {
        const fetchAsignee = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
                    params: { status: 1 },
                });

                const cleanedData = (res.data.data || []).map(item => ({
                    ...item,
                    name: item.name.split(" ")[0] // Only first name
                }));

                setAsignee(cleanedData);

            } catch (err) {
                console.error("Failed to fetch names:", err);
                setAsignee([]); // fallback
            }
        };

        fetchAsignee();
    }, []);



    // Asignee dropdown api calling
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
                    params: { status: 1 },
                });

                const data = res.data.data || res.data;
                setUsers(Array.isArray(data) ? data : []);

            } catch (err) {
                console.error("Failed to fetch names:", err);
                setAsignee([]); // fallback
            }
        };

        fetchUsers();
    }, []);


    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/contract-types/contracts`, {
                    params: { status: 1 },
                });

                const data = res.data.data || res.data;
                setCompany(Array.isArray(data) ? data : []);

            } catch (err) {
                console.error("Failed to fetch names:", err);
                setCompany([]); // fallback
            }
        };

        fetchCompany();
    }, []);


    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/customers/customer-name`, {
                    params: { status: 1 },
                });

                const data = res.data.data || res.data;
                setCustomers(Array.isArray(data) ? data : []);

            } catch (err) {
                console.error("Failed to fetch names:", err);
                setCustomers([]); // fallback
            }
        };

        fetchCustomers();
    }, []);


    // Dynamic Dropdown for contracts types
    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/contract-types/contracts`,
                    { params: { status: 1 } }
                );
                const data = res.data.data || res.data;
                setContractList(Array.isArray(data) ? data : []);
            } catch { }
        };

        fetchContracts();
    }, []);


    const formatDateTime = (dateString) => {
        if (!dateString) return "-";

        const d = new Date(dateString);

        const date = d.toLocaleDateString("en-GB").replace(/\//g, "-");
        const time = d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        return `${date}  ${time}`;
    };

    return (
        <>
            <Header />
            <div className="bg-gray-100">
                {/* Header */}
                {/* Header */}
                <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
                        <p className="flex items-center flex-wrap">
                            <Link href="/dashboard" className="mx-2 text-xl text-gray-400 hover:text-indigo-600">
                                <i className="bi bi-house"></i>
                            </Link>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                            <Link href="#" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">
                                Contract
                            </Link>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                            <Link href="/contracts" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">
                                Contract List
                            </Link>
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <input type="text" placeholder="🔍 Search..." value={filters.search || ""} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="border w-full sm:w-64 border-gray-300 text-gray-700 placeholder-gray-400 p-2 sm:p-1 px-3 rounded-sm focus:ring-1 outline-none focus:ring-orange-200 transition-all text-sm" />
                        </div>
                        <Link href="/contracts/add-contracts" className="block text-center bg-blue-800 text-white px-5 py-2 rounded-sm shadow hover:bg-blue-900 font-bold text-sm w-full sm:w-auto">
                            + ADD CONTRACT
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mx-6 md:hidden mt-3 relative z-40">
                    <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all">
                        <span className="flex items-center gap-2"><i className="bi bi-funnel"></i> Filters</span>
                        <i className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}></i>
                    </button>
                </div>

                <div className={`
                    ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
                    md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
                `}>
                    <input type="text" name="contract_name" placeholder="Contract Name" value={filters.contract_name || ""} onChange={(e) => setFilters({ ...filters, contract_name: e.target.value })} className="p-2 w-full md:w-52 border border-gray-200 md:border text-gray-700 bg-white rounded-md text-sm" />

                    {/* Status */}
                    <select name="customer_name" value={filters.customer_name || ""} onChange={(e) => setFilters({ ...filters, customer_name: e.target.value })} className="p-2 w-full md:w-52 border border-gray-200 md:border text-gray-700 bg-white rounded-md text-sm">
                        <option value="">Customer</option>
                        {customers.map((item) => (
                            <option key={item.id} value={item.customer_name}>
                                {item.customer_name}
                            </option>
                        ))}
                    </select>

                    {/* Priority */}
                    <select name="contract_type" value={filters.contract_type || ""} onChange={(e) => setFilters({ ...filters, contract_type: e.target.value })} className="p-2 w-full md:w-52 border border-gray-200 md:border text-gray-700 bg-white rounded-md text-sm">
                        <option value="">Type</option>
                        {contractList.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    {/* Assignee - dynamic API */}
                    <select name="assignee" value={filters.assignee || "-"} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })} className="p-2 w-full md:w-52 border border-gray-200 md:border text-gray-700 bg-white rounded-md text-sm">
                        <option value="">Assignee</option>

                        {asignee.map((item) => (
                            <option key={item.id} value={item.name}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    {/* Start Date Range */}
                    <div className="flex flex-col border border-gray-200 md:border bg-white rounded-md px-2 w-full md:w-auto">
                        <span className="text-[10px] text-gray-400 uppercase font-bold pt-1">Start Date</span>
                        <input type="date" value={filters.start_date || ""} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} className="p-1 w-full md:w-32 outline-none text-sm" />
                    </div>

                    {/* Due Date Range */}
                    <div className="flex flex-col border border-gray-200 md:border bg-white rounded-md px-2 w-full md:w-auto">
                        <span className="text-[10px] text-gray-400 uppercase font-bold pt-1">Due Date</span>
                        <input type="date" value={filters.end_date || ""} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} className="p-1 w-full md:w-32 outline-none text-sm" />
                    </div>

                    {/* Assignee - dynamic API */}
                    <select name="created_by_name" value={filters.created_by_name || ""} onChange={(e) => setFilters({ ...filters, created_by_name: e.target.value })} className="p-2 w-full md:w-52 border border-gray-200 md:border text-gray-700 bg-white rounded-md text-sm">
                        <option value="">Created By</option>

                        {users.map((item) => (
                            <option key={item.id} value={item.name}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    {/* Start Date Range */}
                    <div className="flex flex-col border border-gray-200 md:border bg-white rounded-md px-2 w-full md:w-auto">
                        <span className="text-[10px] text-gray-400 uppercase font-bold pt-1 whitespace-nowrap">Created Date</span>
                        <input type="date" value={filters.created_at || ""} onChange={(e) => setFilters({ ...filters, created_at: e.target.value })} className="p-1 w-full md:w-32 outline-none text-sm" />
                    </div>

                    <div className="flex gap-2 col-span-2">
                        <button onClick={() => {
                            setFilters({
                                search: "",
                                company_name: "",
                                customer_name: "",
                                contract_name: "",
                                contract_type: "",
                                contract_value: "",
                                start_date: "",
                                end_date: "",
                                assignee: "",
                                created_by_name: "",
                                created_at: "",
                            });
                            setShowMobileFilters(false);
                        }} className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-md p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold">
                            Clear
                        </button>
                        <button onClick={() => setShowMobileFilters(false)} className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold">
                            Apply
                        </button>
                    </div>
                </div>

                {/* Table */}
                <form className="p-1 mx-4">
                    <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
                        <h3 className="mx-2 text-md mt-2">Contract Listing</h3>
                        <hr className="text-gray-300 mx-2 mt-2 mb-3" />
                        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll">
                            <table className=" w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-900  text-xs">
                                <tr>
                                    <th className="py-3 px-5 w-10">#</th>
                                    <th className="py-3 px-4">
                                        Customer
                                    </th>

                                    <th className="py-3 px-4">
                                        Contract Name
                                        
                                    </th>
                                    <th className="py-3 px-4 ">Contract Type
                                       
                                    </th>
                                    <th className="py-3 px-4 ">Contract Value
                                        
                                    </th>
                                    <th className="py-3 px-4 ">Start Date
                                        
                                    </th>
                                    <th className="py-3 px-4 ">End Date
                                     
                                    </th>
                                    <th className="py-3 px-4 ">Assignee
                                    
                                    </th>
                                    <th className="py-3 px-4 ">Created
                                    </th>
                                    <th className="py-3 px-4 ">Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentData.length > 0 ? (
                                    currentData.map((item, index) => (
                                        <tr key={item.id} className={`hover:bg-gray-50 transition font-medium`}>
                                            <td className="py-1 px-4 text-gray-600">
                                                {index + 1}
                                            </td>
                                            <td className="py-2 px-5 text-gray-800">
                                                {item.customer_name}
                                            </td>
                                            <td className="py-2 px-5 text-gray-800">
                                                {item.contract_name}
                                            </td>
                                            <td className="py-2 px-5 text-gray-800">
                                                {item.contract_type}
                                            </td>
                                            <td className="py-2 px-5 text-gray-800">
                                                {item.contract_value}
                                            </td>
                                            <td className="py-1 px-4">
                                                {item.start_date
                                                    ? new Date(item.start_date).toLocaleDateString("en-GB").replace(/\//g, "-")
                                                    : "-"}
                                            </td>

                                            <td className="py-2 px-4 ">
                                                {item.end_date
                                                    ? new Date(item.end_date).toLocaleDateString("en-GB").replace(/\//g, "-")
                                                    : "-"}
                                            </td>

                                            <td style={{ display: "flex", gap: "1px", alignItems: "center" }} className="py-2 px-4">
                                                {(item.assignee ? String(item.assignee) : "")
                                                    .split(",")
                                                    .map((name, index) => {
                                                        const cleanName = name.trim();
                                                        if (!cleanName) return null;
                                                        const letter = cleanName.charAt(0).toUpperCase();

                                                        return (
                                                            <div key={index} title={cleanName} className="px-3 py-1.5 bg-blue-800 text-white rounded-full font-semibold text-sm flex justify-center items-center min-w-[28px] text-center select-none">
                                                                {letter}
                                                            </div>
                                                        );
                                                    })}
                                            </td>

                                            <td className="py-2 px-4 w-50">
                                                {item.created_by_name} | {formatDateTime(item.created_at)}
                                            </td>

                                            <td className="py-2 px-4  text-lg">
                                                <button type="button" onClick={() => { localStorage.setItem("view_contract_data", JSON.stringify(item)); router.push("/contracts/view-contracts"); }} className="text-gray-400 hover:text-green-600">
                                                    <i className="bi bi-eye text-xl"></i>
                                                </button>
                                                <button type="button" onClick={() => { localStorage.setItem("edit_contract_data", JSON.stringify(item)); router.push("/contracts/edit-contracts"); }} className="text-gray-400 hover:text-blue-800 mx-2">
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                                <button type="button" onClick={() => confirmDelete(item.id)} className="text-gray-400 hover:text-red-800">
                                                    <i className="bi bi-trash3"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center text-gray-500 py-3">
                                            No records found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>

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


            </div>


            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900/30 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-96 text-center">
                        <h2 className="text-lg font-semibold mb-4 text-red-500">Confirm Delete</h2>
                        <p className="mb-6">Are you sure you want to delete this contract?</p>
                        <div className="flex justify-center gap-4">
                            <button type="button" onClick={handleDelete} className="bg-blue-800 text-white px-8 py-2 rounded-xl hover:bg-blue-900">
                                Yes
                            </button>
                            <button type="button" onClick={() => setShowDeleteModal(false)} className="bg-gray-300 text-gray-800 px-8 py-2 rounded-xl hover:bg-gray-400">
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}

