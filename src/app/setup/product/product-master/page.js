"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  ChevronUpIcon, ChevronDownIcon, X, Save, Package, Layers, Ruler,
  Hash, ToggleLeft, IndianRupee, TrendingUp, FileText, Boxes, PackagePlus,
  Eye, Pencil,
} from "lucide-react";
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
  // ✅ NEW: slide visibility flag — right-side slide-in/out for the product form drawer
  const [formPanelVisible, setFormPanelVisible] = useState(false);
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
  // ✅ NEW: slide visibility flag — right-side slide-in/out for the View Product drawer
  const [viewPanelVisible, setViewPanelVisible] = useState(false);

  const APIBase = `${API_BASE}/api/product-master`;

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

  // ✅ NEW: Product form drawer slide-in trigger
  useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => setFormPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showForm]);

  // ✅ NEW: View Product drawer slide-in trigger
  useEffect(() => {
    if (viewProduct) {
      const t = setTimeout(() => setViewPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [viewProduct]);

  // ✅ NEW: animated close for View Product — slide-out first, then
  // clear viewProduct (which unmounts the drawer)
  const closeViewProduct = () => {
    setViewPanelVisible(false);
    setTimeout(() => {
      setViewProduct(null);
    }, 300);
  };

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

  // ✅ CHANGED: now animates the drawer out (300ms) before resetting
  // form fields, editId, and hiding the modal — so save also slides out.
  const resetForm = () => {
    setFormPanelVisible(false);
    setTimeout(() => {
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
    }, 300);
  };

  // ✅ NEW: animated close for Cancel / X / backdrop click — slide-out
  // first, then hide the modal (does not reset form fields, same as
  // the original Cancel behavior which also didn't reset fields).
  const closeProductForm = () => {
    setFormPanelVisible(false);
    setTimeout(() => {
      setShowForm(false);
    }, 300);
  };

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
        const res = await axios.get(
          `${API_BASE}/api/product-category/product-category`,
          {
            params: { status: 1 },
          },
        );
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
        const res = await axios.get(
          `${API_BASE}/api/product-unit/product-unit`,
          {
            params: { status: 1 },
          },
        );

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
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Setup
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="#"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Product
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/setup/product/product-master"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Product Master
              </Link>
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setEditId(null);
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
                setShowForm(true);
              }}
              className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              + ADD PRODUCT
            </button>
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
                    ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1" : "hidden"} 
                    md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
                `}
        >
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
              <Package size={16} className="text-blue-500" />
            <input
              type="text"
              name="product_name"
              placeholder="Product Name"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.product_name}
              onChange={handleFilterChange}
            />
          </div>

            <select
              name="product_category"
              value={filters.product_category}
              onChange={handleFilterChange}
            className="border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
            >
              <option value="">Category</option>
              {productCategory.map((item) => (
                <option key={item.id || item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
              <Hash size={15} className="text-cyan-500" />
            <input
              type="text"
              name="product_code"
              placeholder="Product Code"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.product_code}
              onChange={handleFilterChange}
            />
          </div>

         
            <select
              name="unit"
              value={filters.unit}
              onChange={handleFilterChange}
            className="border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
            >
              <option value="">Unit</option>
              {productUnit.map((item) => (
                <option key={item.id || item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
              <Hash size={15} className="text-amber-500" />
            <input
              type="text"
              name="code"
              placeholder="Code"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.code}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
              <IndianRupee size={15} className="text-emerald-500" />
            <input
              type="text"
              name="purchase_price"
              placeholder="Purchase Price"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.purchase_price}
              onChange={handleFilterChange}
            />
          </div>

          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
              <Boxes size={15} className="text-indigo-500" />
            <input
              type="text"
              name="current_stocks"
              placeholder="Current Stocks"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
              value={filters.current_stocks}
              onChange={handleFilterChange}
            />
          </div>

          
            <select
              name="product_type"
              value={filters.product_type}
              onChange={handleFilterChange}
            className="border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
            >
              <option value="">Type</option>
              <option value="Both">Both</option>
              <option value="sales">Sales</option>
              <option value="purchase">Purchase</option>
            </select>

          <div className="flex gap-2 col-span-1 sm:col-span-2 md:col-span-auto">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  product_name: "",
                  product_category: "",
                  product_code: "",
                  unit: "",
                  code: "",
                  purchase_price: "",
                  current_stocks: "",
                  product_type: "",
                });
                setShowMobileFilters(false);
                fetchData();
              }}
               className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-4 py-2 bg-indigo-100 text-indigo-600  text-sm text-center font-semibold transition-colors"
            >
              <i className="bi bi-arrow-counterclockwise"></i> Clear Filter
            </button>
            <button
              type="button"
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-indigo-300 w-full cursor-pointer rounded-lg p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm text-center font-semibold"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Table */}
        <form className="p-1 mx-4">
          <div className="bg-white shadow-md rounded-sm p-1 border border-gray-200">
            <table className=" w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
              <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
                <tr>
                  <th className="py-3 px-5 w-10 text-center">#</th>
                  <th className="py-3 px-4 text-center">
                    Product Name{" "}
                    <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                  </th>
                  <th className="py-3 px-4 text-center">Product Category</th>
                  <th className="py-3 px-4 text-center">Product Code</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-center">Code</th>
                  <th className="py-3 px-4 text-center">
                    Purchase Price{" "}
                    <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                  </th>
                  <th className="py-3 px-4 text-center">
                    Current Stocks{" "}
                    <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                  </th>
                  <th className="py-3 px-4 text-center">Product Type</th>
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
                      <td className="py-3 px-4 text-gray-400 text-xs font-medium text-center">
                        {index + 1}
                      </td>
                      <td className="py-2 px-4 text-center font-semibold text-slate-800">
                        {item.product_name}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 text-violet-600 text-xs font-semibold">
                          {
                            productCategory.find(
                              (c) => c.id == item.product_category,
                            )?.name
                          }
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center text-gray-600">
                        {item.product_code}
                      </td>
                      <td className="py-2 px-4 text-center text-gray-600">
                        {item.unit}
                      </td>
                      <td className="py-2 px-4 text-center text-gray-600">
                        {item.code}
                      </td>
                      <td className="py-2 px-4 text-center text-gray-600">
                        {item.purchase_price}
                      </td>
                      <td className="py-2 px-4 text-center font-semibold text-slate-800">
                        {item.current_stocks}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                            item.product_type === "sales"
                              ? "bg-emerald-50 text-emerald-600"
                              : item.product_type === "purchase"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                         {item.product_type}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewProduct(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                            title="View Product"
                          >
                                    <i className="bi bi-eye text-lg"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer transition-all"
                            title="Edit Product"
                          >
                                    <i className="bi bi-pencil-square text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center text-gray-500 py-6">
                      <Boxes size={26} className="mx-auto mb-2 text-gray-300" />
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ✅ PAGINATION — image style: "Showing X to Y entries" (left) + indigo "Rows per page" (right) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
              {/* Left side: Showing entries text */}
              <p className="text-sm font-semibold text-slate-800">
                Showing {products.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, products.length)} entries
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
          </div>
        </form>

        {/* ✅ Add/Edit Product — right-side slide-in/out drawer, indigo-violet theme */}
        {showForm && (
          <div
            className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
              formPanelVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeProductForm}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`bg-white h-full w-full sm:max-w-[620px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
                formPanelVisible ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* ── Header (gradient icon box + title + subtitle) ── */}
              <div className="bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                      <PackagePlus size={20} className="text-white" />
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-900">
                        {editId ? "Edit" : "Add"} Product
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {editId
                          ? "Update the product details"
                          : "Fill in the details to create a new product"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeProductForm}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="h-1 w-full bg-gray-100">
                  <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-600"></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <Package size={16} className="text-blue-500" />
                      </span>
                      <input
                        type="text"
                        name="product_name"
                        value={formdata.product_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Product Category <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <Layers size={16} className="text-violet-500" />
                      </span>
                      <select
                        name="product_category"
                        value={formdata.product_category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Product Category</option>
                        {productCategory.map((item) => (
                          <option key={item.id || item.name} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Unit
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Ruler size={16} className="text-cyan-500" />
                      </span>
                      <select
                        name="unit"
                        value={formdata.unit}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Unit</option>
                        {productUnit.map((item) => (
                          <option key={item.id || item.name} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Product Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Hash size={16} className="text-cyan-500" />
                      </span>
                      <input
                        type="text"
                        name="product_code"
                        value={formdata.product_code}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Product Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <ToggleLeft size={16} className="text-amber-500" />
                      </span>
                      <select
                        name="product_type"
                        value={formdata.product_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="Both">Both</option>
                        <option value="sales">Sales</option>
                        <option value="purchase">Purchase</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Purchase Price <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                        <IndianRupee size={16} className="text-emerald-500" />
                      </span>
                      <input
                        type="text"
                        name="purchase_price"
                        value={formdata.purchase_price}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Sales Price <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                        <TrendingUp size={16} className="text-green-500" />
                      </span>
                      <input
                        type="text"
                        name="sales_price"
                        value={formdata.sales_price}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Current Stocks <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-indigo-50 border-r border-gray-100">
                        <Boxes size={16} className="text-indigo-500" />
                      </span>
                      <input
                        type="text"
                        name="current_stocks"
                        value={formdata.current_stocks}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Product Code Type + Code — same row, sub-grid (jem juna code ma hatu) */}
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-600">
                        Product Code Type <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                          <FileText size={16} className="text-violet-500" />
                        </span>
                        <select
                          name="product_code_type"
                          value={formdata.product_code_type}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                        >
                          <option value="">-- Select --</option>
                          <option value="SAC Code">SAC Code</option>
                          <option value="HSN Code">HSN Code</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-600">
                        Code <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                          <Hash size={16} className="text-amber-500" />
                        </span>
                        <input
                          type="text"
                          name="code"
                          value={formdata.code}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Description
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                      <FileText size={16} className="text-blue-500" />
                    </span>
                    <textarea
                      name="description"
                      value={formdata.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeProductForm}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white"
                  >
                    <X size={15} /> Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Save size={15} /> Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== VIEW PRODUCT — right-side slide-in/out drawer ===================== */}
        {viewProduct && (
          <div
            className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
              viewPanelVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeViewProduct}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`bg-white h-full w-full sm:max-w-[620px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
                viewPanelVisible ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* ── Header (Image-2 style: gradient eye icon box + title + status subtitle) ── */}
              <div className="bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                      <Eye size={20} className="text-white" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {viewProduct.product_name || "Product Details"}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {viewProduct.product_type
                          ? `Type: ${viewProduct.product_type}`
                          : "Product Details"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeViewProduct}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="h-1 w-full bg-gray-100">
                  <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-600"></div>
                </div>
              </div>

              {/* ── Body (Image-3 style: colored icon-box fields, read-only) ── */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Product Name
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                        <Package size={16} className="text-blue-500" />
                      </span>
                      <input
                        type="text"
                        value={viewProduct.product_name || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Product Category
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <Layers size={16} className="text-violet-500" />
                      </span>
                      <input
                        type="text"
                        value={
                          productCategory.find(
                            (c) => c.id == viewProduct.product_category,
                          )?.name || ""
                        }
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Unit
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Ruler size={16} className="text-cyan-500" />
                      </span>
                      <input
                        type="text"
                        value={viewProduct.unit || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Product Code
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Hash size={16} className="text-cyan-500" />
                      </span>
                      <input
                        type="text"
                        value={viewProduct.product_code || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Product Type
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <ToggleLeft size={16} className="text-amber-500" />
                      </span>
                      <input
                        type="text"
                        value={viewProduct.product_type || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Purchase Price
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                        <IndianRupee size={16} className="text-emerald-500" />
                      </span>
                      <input
                        type="text"
                        value={viewProduct.purchase_price || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Sales Price
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                        <TrendingUp size={16} className="text-green-500" />
                      </span>
                      <input
                        type="text"
                        value={viewProduct.sales_price || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Current Stocks
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-indigo-50 border-r border-gray-100">
                        <Boxes size={16} className="text-indigo-500" />
                      </span>
                      <input
                        type="text"
                        value={viewProduct.current_stocks || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Product Code Type + Code — same row, sub-grid (jem Add form ma hatu) */}
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-600">
                        Product Code Type
                      </label>
                      <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                          <FileText size={16} className="text-violet-500" />
                        </span>
                        <input
                          type="text"
                          value={viewProduct.product_code_type || ""}
                          disabled
                          className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-600">
                        Code
                      </label>
                      <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                          <Hash size={16} className="text-amber-500" />
                        </span>
                        <input
                          type="text"
                          value={viewProduct.code || ""}
                          disabled
                          className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Description
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                      <FileText size={16} className="text-blue-500" />
                    </span>
                    <textarea
                      value={viewProduct.description || ""}
                      disabled
                      rows={3}
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent resize-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeViewProduct}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white"
                  >
                    <X size={15} /> Close
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