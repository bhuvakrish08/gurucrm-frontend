"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "redaxios";
import Header from "@/app/components/header";
import CheckPermission from "@/app/components/CheckPermission";
import useAuth from "@/app/components/useAuth";
import { toast } from "react-toastify";
import Link from "next/link";
import { 
  AVAILABLE_COLORS, 
  AVAILABLE_ICONS, 
  getCategoryStyles, 
  getCategoryIconHTML,
  reverseMapColor,
  reverseMapIcon
} from "@/utils/CategoryThemeHelper";
import CategoryDisplay from "@/app/components/CategoryDisplay";

export default function StrategyCategoryMaster() {
  useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const [categories, setCategories] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    display_order: 0,
    is_active: 1,
    icon: "Store",
    color: "Purple",
  });
  const [mappedSourcesCount, setMappedSourcesCount] = useState(0);

  const getHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/strategy/categories?all=true`, {
        headers: getHeaders(),
      });
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories.");
    }
  }, [API_BASE, getHeaders]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    const generatedCode = value.toUpperCase().replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    setFormData((prev) => ({
      ...prev,
      name: value,
      code: generatedCode,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name || "",
      code: category.code || "",
      display_order: category.display_order || 0,
      is_active: category.is_active !== undefined ? category.is_active : 1,
      icon: reverseMapIcon(category.icon_svg),
      color: reverseMapColor(category.badge_background),
    });
    setMappedSourcesCount(category.mapped_sources_count || 0);
    setEditId(category.id);
    setShowDrawer(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      display_order: 0,
      is_active: 1,
      icon: "Store",
      color: "Purple",
    });
    setMappedSourcesCount(0);
    setEditId(null);
    setShowDrawer(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error("Name is required to generate a valid Code.");
      return;
    }
    if (!formData.icon || !formData.color) {
      toast.error("Icon and Color must be selected.");
      return;
    }

    const style = getCategoryStyles(formData.color);
    const iconHtml = getCategoryIconHTML(formData.icon);
    
    // Convert to exactly what the backend API expects
    const payload = {
      ...formData,
      icon_svg: iconHtml,
      icon_background: style.bg,
      icon_color: style.text,
      badge_background: style.bg,
      badge_text_color: style.text
    };

    try {
      setIsSubmitting(true);
      if (editId) {
        await axios.put(`${API_BASE}/api/strategy/categories/${editId}`, payload, {
          headers: getHeaders(),
        });
        toast.success("Category updated successfully.");
      } else {
        await axios.post(`${API_BASE}/api/strategy/categories`, payload, {
          headers: getHeaders(),
        });
        toast.success("Category created successfully.");
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error(err.response?.data?.message || "Error saving category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const updatedData = {
        ...category,
        is_active: category.is_active === 1 ? 0 : 1,
      };
      await axios.put(`${API_BASE}/api/strategy/categories/${category.id}`, updatedData, {
        headers: getHeaders(),
      });
      toast.success(`Category ${updatedData.is_active ? 'activated' : 'deactivated'}.`);
      fetchCategories();
    } catch (err) {
      console.error("Error toggling status:", err);
      toast.error("Failed to update status.");
    }
  };

  return (
    <>
      <Header />
      <CheckPermission allowedRoles={["Super Admin", "Admin"]}>
        <div className="bg-slate-50 min-h-screen">
          <div className="bg-white w-full shadow-sm p-3 border-b border-slate-200">
            <div className="flex items-center text-slate-500 text-[13px] font-semibold tracking-wide">
              <Link href="/dashboard" className="mx-2 hover:text-[#6366f1] transition-colors">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px] text-slate-400"></i>
              <Link href="/setup" className="mx-2 hover:text-[#6366f1] transition-colors">
                Settings
              </Link>
              <i className="bi bi-chevron-right text-[10px] text-slate-400"></i>
              <span className="mx-2 text-slate-800 font-bold">Strategy Category Master</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Strategy Categories</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Manage sales strategy categories and visual mappings.</p>
              </div>
              <button
                onClick={() => { resetForm(); setShowDrawer(true); }}
                className="mt-4 sm:mt-0 flex items-center justify-center px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
              >
                <i className="bi bi-plus-lg mr-2"></i> Add Category
              </button>
            </div>

            {/* Datatable */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f8fafc] border-b border-slate-200">
                    <tr>
                      <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">Mapped Sources</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">Order</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[14px]">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-500 font-medium">
                          No categories found.
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat) => {
                        const style = getCategoryStyles(cat.color);
                        return (
                          <tr key={cat.id} className="hover:bg-[#f8fafc] transition-colors group">
                            {/* Category Column */}
                            <td className="py-4 px-6 whitespace-nowrap">
                              <CategoryDisplay cat={cat} />
                            </td>
                            {/* Mapped Sources */}
                            <td className="py-4 px-6 text-center font-bold text-slate-600 whitespace-nowrap">
                              {cat.mapped_sources_count || 0}
                            </td>
                            {/* Display Order */}
                            <td className="py-4 px-6 text-center font-semibold text-slate-600 whitespace-nowrap">
                              {cat.display_order}
                            </td>
                            {/* Status */}
                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleToggleActive(cat)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${cat.is_active === 1 ? 'bg-[#22c55e]' : 'bg-slate-300'}`}
                                title={cat.is_active === 1 ? "Active" : "Inactive"}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${cat.is_active === 1 ? 'translate-x-4.5' : 'translate-x-1'}`} />
                              </button>
                            </td>
                            {/* Actions */}
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleEdit(cat)}
                                className="p-2 text-[#6366f1] hover:bg-[#e0e7ff] rounded-lg transition-colors inline-flex items-center justify-center"
                                title="Edit Category"
                              >
                                <i className="bi bi-pencil-square text-lg"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sliding Drawer */}
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${showDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={resetForm} />
          
          <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${showDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {editId ? "Edit Strategy Category" : "New Strategy Category"}
              </h2>
              <button
                onClick={resetForm}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <form id="categoryForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Category Name */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Category Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all shadow-sm"
                    placeholder="e.g. Enterprise Sales"
                    required
                  />
                </div>

                {/* Auto-generated Code (Read-Only) */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Category Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    readOnly
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed shadow-inner"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium"><i className="bi bi-info-circle mr-1"></i> Code is automatically generated from the name.</p>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Display Order <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-[#6366f1] transition-all shadow-sm"
                    min="0"
                    required
                  />
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-3">Category Icon <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_ICONS.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: iconName }))}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl border transition-all ${
                          formData.icon === iconName
                            ? "bg-[#6366f1] border-[#6366f1] text-white shadow-md shadow-[#6366f1]/20 scale-105"
                            : "bg-white border-slate-200 text-slate-600 hover:border-[#6366f1]/50 hover:bg-[#f8fafc]"
                        }`}
                        title={iconName}
                      >
                        <div dangerouslySetInnerHTML={{ __html: getCategoryIconHTML(iconName) }} className="w-6 h-6 [&>svg]:w-full [&>svg]:h-full" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-3">Category Color <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_COLORS.map((colorName) => {
                      const style = getCategoryStyles(colorName);
                      return (
                        <button
                          key={colorName}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: colorName }))}
                          className={`flex items-center justify-center h-10 rounded-xl border-2 transition-all ${
                            formData.color === colorName
                              ? `${style.border} scale-105 shadow-sm`
                              : "border-transparent hover:scale-105"
                          } ${style.bg}`}
                          title={colorName}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full`} style={{ backgroundColor: style.dotHex }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800">Active Status</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Inactive categories are hidden from new mappings.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: prev.is_active === 1 ? 0 : 1 }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.is_active === 1 ? 'bg-[#22c55e]' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active === 1 ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Mapped Sources Display (Edit Mode Only) */}
                {editId && (
                  <div className="p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#dbeafe] text-[#2563eb] flex items-center justify-center">
                        <i className="bi bi-diagram-3-fill"></i>
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-[#1e3a8a]">Mapped Sources</h4>
                        <p className="text-[11px] text-[#2563eb] font-medium">Lead sources currently using this strategy</p>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-[#1d4ed8] tracking-tight">{mappedSourcesCount}</span>
                  </div>
                )}
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="categoryForm"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#6366f1] hover:bg-[#4f46e5] rounded-xl transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <><i className="bi bi-arrow-repeat animate-spin"></i> Saving...</>
                ) : (
                  <><i className="bi bi-check-lg"></i> Save Category</>
                )}
              </button>
            </div>
          </div>
        </div>
      </CheckPermission>
    </>
  );
}
