"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";

export default function Page() {

    useAuth();
    
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    const [formdata, setFormData] = useState({
        product_name: "",
        product_category: "",
        unit: "",
        product_code: "",
        product_type: "",
        purchase_price: "",
        sales_price: "",
        product_code_type: "",
        code: "",
        current_stocks: "",
        description: "",
    });
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [products, setProducts] = useState([]);
    const [productCategory, setProductCategory] = useState([]);
    const [productUnit, setProductUnit] = useState([]);
    const [scrollOffsets, setScrollOffsets] = useState({});
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [filters, setFilters] = useState({
        product_name: "",
        product_category: "",
        unit: "",
        product_code: "",
        product_type: "",
        purchase_price: "",
        sales_price: "",
        product_code_type: "",
        code: "",
        current_stocks: "",
        description: "",
    });
    const [viewProduct, setViewProduct] = useState(null);


    const APIBase = `${API_BASE}/api/product-master`


    // Standardized Micara IMS Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);


    const fetchData = async () => {
        try {
            const res = await axios.get(`${APIBase}/read`, {
                params: {
                    search1: filters.product_name,
                    search2: filters.product_category,
                    search3: filters.product_code,
                    search4: filters.unit,
                    search5: filters.code,
                    search6: filters.purchase_price,
                    search7: filters.current_stocks,
                    search8: filters.product_type,
                },
            });
            setProducts(res.data);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load contacts");
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




    // useEffect(() => {
    //     fetchData();
    // }, [fetchData]);


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await axios.put(`${APIBase}/update/${editId}`, formdata);
                toast.success("Updated successfully");
                await fetchData();
            } else {
                await axios.post(`${APIBase}/insert`, formdata);
                toast.success("Inserted successfully");
                await fetchData();
            }
            resetForm();
        } catch (err) {
            console.error("Error saving:", err);
            toast.error("Error saving data");
        }
    };


    const resetForm = () => {
        setFormData({
            product_name: "",
            product_category: "",
            unit: "",
            product_code: "",
            product_type: "",
            purchase_price: "",
            sales_price: "",
            product_code_type: "",
            code: "",
            current_stocks: "",
            description: "",
        });
        setEditId(null);
        setShowForm(false);
    }

    // Code for Update Data
    const handleEdit = (item) => {
        setEditId(item.id);
        setFormData({
            product_name: item.product_name || "",
            product_category: item.product_category || "",
            unit: item.unit || "",
            product_code: item.product_code || "",
            product_type: item.product_type || "",
            purchase_price: item.purchase_price || "",
            sales_price: item.sales_price || "",
            product_code_type: item.product_code_type || "",
            code: item.code || "",
            current_stocks: item.current_stocks || "",
            description: item.description || "",
        });
        setShowForm(true);
    };



    // to fetch active contact designations

    useEffect(() => {
        const fetchProductCategory = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/product-category/product-category`, {
                    params: { status: 1 }
                });
                setProductCategory(res.data.data);
            } catch (err) {
                console.error("Failed to fetch designations:", err);
            }
        };

        fetchProductCategory();
    }, []);

    useEffect(() => {
        const fetchProductUnit = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/product-unit/product-unit`, {
                    params: { status: 1 },
                });

                // If your API wraps data like { data: [...] }
                setProductUnit(res.data.data || res.data);
            } catch (err) {
                console.error("Failed to fetch company names:", err);
                setProductUnit([]); // fallback
            }
        };

        fetchProductUnit();
    }, []);



    // Standardized Pagination Calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentData = products.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(products.length / itemsPerPage);

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
                {/* Header */}
                <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
                        <p className="flex items-center flex-wrap">
                            <Link href="/dashboard" className="mx-2 text-xl text-gray-400 hover:text-indigo-600">
                                <i className="bi bi-house"></i>
                            </Link>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                            <Link href="/setup" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">
                                Setup
                            </Link>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                            <Link href="#" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">
                                Product
                            </Link>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                            <Link href="/setup/product/product-master" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">
                                Product Master
                            </Link>
                        </p>
                    </div>

                    <div className="w-full sm:w-auto">
                        <button type="button" onClick={() => { setEditId(null); setFormData({ product_name: "", product_category: "", unit: "", product_code: "", product_type: "", purchase_price: "", sales_price: "", product_code_type: "", code: "", current_stocks: "", description: "" }); setShowForm(true); }} className="w-full sm:w-auto bg-blue-800 text-white px-5 py-2 rounded-sm shadow hover:bg-blue-900 font-bold text-sm">
                            + ADD PRODUCT
                        </button>
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

                    <input type="text" name="product_name" placeholder="Product Name" className="p-2 w-full md:w-53 mb-0 md:mb-3 border border-gray-200 md:border text-gray-700 bg-white rounded-md md:mx-2 text-sm" value={filters.product_name} onChange={handleFilterChange} />

                    <select name="product_category" value={filters.product_category} onChange={handleFilterChange} className="p-2 w-full md:w-53 mb-0 md:mb-3 border border-gray-200 md:border text-gray-500 bg-white rounded-md md:mx-2 text-sm">
                        <option value="">Category</option>
                        {productCategory.map((item) => (
                            <option key={item.id || item.name} value={item.name}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <input type="text" name="product_code" placeholder="Product Code" className="p-2 w-full md:w-53 mb-0 md:mb-3 border border-gray-200 md:border text-gray-700 bg-white rounded-md md:mx-2 text-sm" value={filters.product_code} onChange={handleFilterChange} />

                    <select name="unit" value={filters.unit} onChange={handleFilterChange} className="p-2 w-full md:w-53 mb-0 md:mb-3 border border-gray-200 md:border text-gray-500 bg-white rounded-md md:mx-2 text-sm">
                        <option value="">Unit</option>
                        {productUnit.map((item) => (
                            <option key={item.id || item.name} value={item.name}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <input type="text" name="code" placeholder="Code" className="p-2 w-full md:w-53 mb-0 md:mb-3 border border-gray-200 md:border text-gray-700 bg-white rounded-md md:mx-2 text-sm" value={filters.code} onChange={handleFilterChange} />

                    <input type="text" name="purchase_price" placeholder="Purchase Price" className="p-2 w-full md:w-53 mb-0 md:mb-3 border border-gray-200 md:border text-gray-700 bg-white rounded-md md:mx-2 text-sm" value={filters.purchase_price} onChange={handleFilterChange} />

                    <input type="text" name="current_stocks" placeholder="Current Stocks" className="p-2 w-full md:w-53 mb-0 md:mb-3 border border-gray-200 md:border text-gray-700 bg-white rounded-md md:mx-2 text-sm" value={filters.current_stocks} onChange={handleFilterChange} />

                    <select name="product_type" value={filters.product_type} onChange={handleFilterChange} className="p-2 w-full md:w-53 mb-0 md:mb-3 border border-gray-200 md:border text-gray-500 bg-white rounded-md md:mx-2 text-sm">
                        <option value="">Type</option>
                        <option value="Both">Both</option>
                        <option value="sales">Sales</option>
                        <option value="purchase">Purchase</option>
                    </select>

                    <div className="flex gap-2 col-span-2">
                        <button type="button" onClick={() => { setFilters({ product_name: "", product_category: "", product_code: "", unit: "", code: "", purchase_price: "", current_stocks: "", product_type: "" }); setShowMobileFilters(false); fetchData(); }}
                            className="border border-gray-300 w-full md:w-auto md:mb-3 cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold">
                            Clear
                        </button>
                        <button type="button" onClick={() => setShowMobileFilters(false)} className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold">
                            Apply
                        </button>
                    </div>
                </div>

                {/* Table */}
                <form className="p-1 mx-4">
                    <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
                        <table className=" w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-900  text-xs">
                                <tr>
                                    <th className="py-3 px-5 w-10">#</th>
                                    <th className="py-3 px-4 text-center">
                                        Product Name
                                    </th>

                                    <th className="py-3 px-4 text-center">
                                        Product Category
                                    </th>
                                    <th className="py-3 px-4 text-center">Product Code
                                    </th>
                                    <th className="py-3 px-4 text-center">Unit
                                    </th>
                                    <th className="py-3 px-4 text-center">Code
                                    </th>
                                    <th className="py-3 px-4 text-center">Purchase Price
                                    </th>
                                    <th className="py-3 px-4 text-center">Current Stocks
                                    </th>
                                    <th className="py-3 px-4 text-center">Product Type
                                    </th>
                                    <th className="py-3 px-4 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentData.length > 0 ? (
                                    currentData.map((item, index) => (
                                        <tr key={item.id} className={`hover:bg-gray-50 transition`}>
                                            <td className="py-1 px-4 text-gray-600">
                                                {index + 1}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                {item.product_name}
                                            </td>
                                            <td className="py-1 px-4 text-center text-gray-800">
                                                {
                                                    productCategory.find(
                                                        c => c.id == item.product_category
                                                    )?.name
                                                }
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                {item.product_code}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                {item.unit}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                {item.code}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                {item.purchase_price}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                {item.current_stocks}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                {item.product_type}
                                            </td>
                                            <td className="py-2 px-4 text-center text-lg">
                                                <button type="button" onClick={() => setViewProduct(item)} className="text-gray-400 text-xl hover:text-green-700 mx-1" title="View Product">
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                                <button type="button" onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-800 mx-1">
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="text-center text-gray-500 py-3">
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
                    <div className="fixed inset-0 bg-gray-900/30 z-50 flex justify-center items-center overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-lg p-6 w-[800px] relative my-10 max-h-[85vh] overflow-y-auto">
                            <button type="button" onClick={() => { setShowForm(false); }}
                                className="absolute top-5 right-4 text-xl text-gray-500 hover:text-gray-800">
                                ✕
                            </button>

                            <h3 className="text-lg mb-3 text-black">
                                {editId ? "Edit" : "Add"} Product
                                <hr className="mt-3 mb-5 text-gray-300" />
                            </h3>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                        <label className="block text-sm text-gray-600  mb-1">
                                            Product Name *
                                        </label>
                                        <input type="text" name="product_name" value={formdata.product_name} onChange={handleChange} className="w-full border rounded p-2" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600  mb-1">
                                            Product Category *
                                        </label>
                                        <select name="product_category" value={formdata.product_category} onChange={handleChange} className="w-full border rounded p-2 ">
                                            <option value="">Select Product Category</option>
                                            {productCategory.map((item) => (
                                                <option key={item.id || item.name} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Unit
                                        </label>
                                        <select name="unit" value={formdata.unit} onChange={handleChange} className="w-full border rounded p-2">
                                            <option value="">Select Unit</option>
                                            {productUnit.map((item) => (
                                                <option key={item.id || item.name} value={item.name}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600  mb-1">
                                            Product Code *
                                        </label>
                                        <input type="text" name="product_code" value={formdata.product_code} onChange={handleChange} className="w-full border rounded p-2" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600  mb-1">
                                            Product Type *
                                        </label>
                                        <select name="product_type" value={formdata.product_type} onChange={handleChange} className="w-full border rounded p-2">
                                            <option value="Both">Both</option>
                                            <option value="sales">Sales</option>
                                            <option value="purchase">Purchase</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600  mb-1">
                                            Purchase Price *
                                        </label>
                                        <input type="text" name="purchase_price" value={formdata.purchase_price} onChange={handleChange} className="w-full border rounded p-2" required />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600  mb-1">
                                            Sales Price *
                                        </label>
                                        <input type="text" name="sales_price" value={formdata.sales_price} onChange={handleChange} className="w-full border rounded p-2" required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label className="block text-sm text-gray-600  mb-1">
                                                Product Code Type *
                                            </label>
                                            <select name="product_code_type" value={formdata.product_code_type} onChange={handleChange} className="w-full border rounded p-2">
                                                <option value="">-- Select --</option>
                                                <option value="SAC Code">SAC Code</option>
                                                <option value="HSN Code">HSN Code</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-600  mb-1">
                                                Code *
                                            </label>
                                            <input type="text" name="code" value={formdata.code} onChange={handleChange} className="w-full border rounded p-2" required />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600  mb-1">
                                            Current Stocks *
                                        </label>
                                        <input type="text" name="current_stocks" value={formdata.current_stocks} onChange={handleChange} className="w-full border rounded p-2" required />
                                    </div>

                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600  mb-1">
                                        Description
                                    </label>
                                    <textarea type="text" name="description" value={formdata.description} onChange={handleChange} className="w-full border rounded p-2" required />
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => { setShowForm(false); }}
                                        className="px-4 py-2 bg-gray-200 rounded-lg">
                                        Cancel
                                    </button>
                                    <button type="submit" className="bg-blue-800 text-white px-4 py-1.5 rounded-lg">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                )}

                {/* ===================== VIEW PRODUCT MODAL ===================== */}
                {viewProduct && (
                    <div className="fixed inset-0 bg-gray-900/40 z-50 flex justify-center items-center overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-lg p-6 w-[800px] relative my-10 max-h-[85vh] overflow-y-auto">
                            <button type="button" onClick={() => setViewProduct(null)} className="absolute top-5 right-4 text-xl text-gray-500 hover:text-gray-800">
                                ✕
                            </button>

                            <h3 className="text-lg mb-3 text-black ">
                                View Product
                                <hr className="mt-3 mb-5 text-gray-300" />
                            </h3>

                            <div className="grid grid-cols-2 gap-3 mb-3">

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Product Name</label>
                                    <input type="text" value={viewProduct.product_name || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Product Category</label>
                                    <input type="text" value={
                                        productCategory.find(
                                            c => c.id == viewProduct.product_category
                                        )?.name
                                    } disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Unit</label>
                                    <input type="text" value={viewProduct.unit || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Product Code</label>
                                    <input type="text" value={viewProduct.product_code || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Product Type</label>
                                    <input type="text" value={viewProduct.product_type || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Purchase Price</label>
                                    <input type="text" value={viewProduct.purchase_price || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Sales Price</label>
                                    <input type="text" value={viewProduct.sales_price || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Product Code Type</label>
                                        <input type="text" value={viewProduct.product_code_type || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Code</label>
                                        <input type="text" value={viewProduct.code || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Current Stocks</label>
                                    <input type="text" value={viewProduct.current_stocks || ""} disabled className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Description</label>
                                <textarea value={viewProduct.description || ""} disabled rows={3} className="w-full border rounded p-2 bg-gray-100 cursor-not-allowed" />
                            </div>

                            <div className="flex justify-end mt-4">
                                <button type="button" onClick={() => setViewProduct(null)} className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}
