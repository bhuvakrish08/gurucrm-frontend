"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import Link from "next/link";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Select from "react-select";
import useAuth from "@/app/components/useAuth";

export default function Page() {
  const router = useRouter();
  useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [leadSource, setLeadSource] = useState([]);
  const [leadCategory, setLeadCategory] = useState([]);
  const [category, setCategory] = useState([]);
  const [productList, setProductList] = useState([]);
  const [asignee, setAsignee] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    company_name: "",
    customer_name: "",
    lead_title: "",
    source: "",
    status: "Qualified",
    product_category: "",
    product_name: "",
    priority: "",
    assignee: "",
    category: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customer_name.trim()) newErrors.customer_name = "Customer Name is required";
    if (!formData.lead_title.trim()) newErrors.lead_title = "Lead Title is required";
    if (!formData.product_category) newErrors.product_category = "Product Category is required";
    if (!formData.product_name) newErrors.product_name = "Product Name is required";
    if (!formData.assignee.trim()) newErrors.assignee = "Assignee is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      const payload = {
        ...formData,
        source: formData.source || null,
        priority: formData.priority || null,
        category: formData.category || null,
      };

      const res = await axios.post(`${API_BASE}/api/lead/insert`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data && res.data.success) {
        toast.success("Lead added successfully!");
        resetForm();
        router.push("/sales/lead");
      } else {
        toast.error(res.data?.message || "Failed to add lead");
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.data?.message ||
        err?.message ||
        "Failed to add lead. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: "",
      customer_name: "",
      lead_title: "",
      source: "",
      status: "Qualified",
      product_category: "",
      product_name: "",
      priority: "",
      assignee: "",
      category: "",
      description: "",
    });
    setErrors({});
  };

  // ✅ FIX: lowercase 'source' — matches server.js after fix
  useEffect(() => {
    const fetchSource = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/inquiry-lead-source/read`, {
          params: { status: 1 },
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeadSource(res.data);
      } catch (err) {
        console.error("Lead source fetch error:", err);
      }
    };
    fetchSource();
  }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/inquiry-lead-category/read`, {
          params: { status: 1 },
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeadCategory(res.data);
      } catch (err) {
        console.error("Lead category fetch error:", err);
      }
    };
    fetchCategory();
  }, []);

  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/product-category/read`, {
          params: { status: 1 },
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategory(res.data);
      } catch (err) {
        console.error("Product category fetch error:", err);
      }
    };
    fetchProductCategory();
  }, []);

  useEffect(() => {
    if (!formData.product_category) {
      setProductList([]);
      return;
    }
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/product-master/read`, {
          params: { search2: formData.product_category },
          headers: { Authorization: `Bearer ${token}` },
        });
        setProductList(res.data);
      } catch {
        setProductList([]);
      }
    };
    fetchProducts();
  }, [formData.product_category]);

  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
          params: { status: 1 },
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.data || res.data || [];
        const formatted = data.map((item) => {
          const firstName = item.name.split(" ")[0];
          return { value: firstName, label: firstName };
        });
        setAsignee(formatted);
      } catch (error) {
        console.error("Assignee fetch error:", error);
        setAsignee([]);
      }
    };
    fetchAssignee();
  }, []);

  return (
    <div className="bg-gray-100">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white w-full shadow-lg border-gray-100 p-3 mt-1 mb-5 flex justify-between items-center">
        <div className="flex items-center text-gray-700">
          <p>
            <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
              <i className="bi bi-house"></i>
            </Link>
            <i className="bi bi-chevron-right"></i>
            <Link href="#" className="mx-3 text-md text-gray-700 hover:text-orange-500">Sales</Link>
            <i className="bi bi-chevron-right"></i>
            <Link href="/sales/lead" className="mx-3 text-md text-gray-700 hover:text-orange-500">Lead</Link>
            <i className="bi bi-chevron-right"></i>
            <Link href="/sales/lead/add-lead" className="mx-3 text-md text-gray-700 hover:text-orange-500">Add Lead</Link>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-6 mx-auto max-w-5xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Lead</h2>
          <hr className="border-gray-100 mt-2 mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">

            {/* Company Name */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Company Name</label>
              <input
                name="company_name"
                value={formData.company_name}
                placeholder="Company Name"
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Customer Name *</label>
              <input
                name="customer_name"
                value={formData.customer_name}
                placeholder="Customer Name"
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
              />
              {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
            </div>

            {/* Lead Title */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Lead Title *</label>
              <input
                type="text"
                name="lead_title"
                value={formData.lead_title}
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
              />
              {errors.lead_title && <p className="text-red-500 text-xs mt-1">{errors.lead_title}</p>}
            </div>

            {/* Source */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Source</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
              >
                <option value="">-- Select --</option>
                {leadSource.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Status</label>
              <select
                name="status"
                value={formData.status}
                disabled
                className="w-full border border-orange-300 rounded-md px-3 py-1.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                <option>Qualified</option>
              </select>
            </div>

            {/* Product Category */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Product Category *</label>
              <select
                name="product_category"
                value={formData.product_category}
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
              >
                <option value="">-- Select --</option>
                {category.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              {errors.product_category && <p className="text-red-500 text-xs mt-1">{errors.product_category}</p>}
            </div>

            {/* Product Name */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Product Name *</label>
              <select
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
              >
                <option value="">-- Select Product --</option>
                {productList.map((item) => (
                  <option key={item.id} value={item.product_name}>{item.product_name}</option>
                ))}
              </select>
              {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>}
            </div>

            {/* Priority */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
              >
                <option value="">-- Select --</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block mb-1 text-sm font-medium  ">
                Assignee *
              </label>

              <Select
                isMulti
                placeholder="-- Select --"
                instanceId="assignee-select"
                options={asignee}
                value={asignee.filter((option) => {
                  if (!formData.assignee) return false;
                  return formData.assignee.split(",").includes(option.value);
                })}
                onChange={(selectedOptions) => {
                  const values = selectedOptions
                    ? selectedOptions.map((o) => o.value).join(",")
                    : "";
                  setFormData((prev) => ({ ...prev, assignee: values }));
                  if (errors.assignee) setErrors((prev) => ({ ...prev, assignee: "" }));
                }}
                className="w-full"
                styles={{
                  control: (provided, state) => ({
                    ...provided,
                    borderColor: state.isFocused ? "border-orange-300" : "border-orange-300",
                    boxShadow: state.isFocused ? "0 0 0 1px #F5C99A" : "none",
                    "&:hover": {
                      borderColor: "border-orange-300",
                    },
                    minHeight: "40px",
                    borderRadius: "6px",
                  }),
                  menu: (provided) => ({ ...provided, borderRadius: "6px", overflow: "hidden" }),
                  option: (provided, state) => ({
                    ...provided,
                    fontSize: "14px",
                    backgroundColor: state.isSelected || state.isFocused ? "#767676" : "#ffffff",
                    color: state.isSelected || state.isFocused ? "#ffffff" : "#000000",
                    cursor: "pointer",
                    padding: "5px 6px",
                    ":active": { ...provided[":active"], backgroundColor: "#767676" },
                  }),
                  placeholder: (provided) => ({ ...provided, color: "#767676" }),
                  multiValue: (provided) => ({ ...provided, backgroundColor: "#767676" }),
                  multiValueLabel: (provided) => ({ ...provided, color: "#fff" }),
                  multiValueRemove: (provided) => ({
                    ...provided,
                    color: "#fff",
                    "&:hover": { backgroundColor: "#767676", color: "#fff" },
                  }),
                }}
              />
              {errors.assignee && <p className="text-red-500 text-xs mt-1">{errors.assignee}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-sm px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
              >
                <option value="">-- Select --</option>
                {leadCategory.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mt-3">
            <label className="block mb-1 text-sm font-medium text-gray-600">Description</label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-orange-300 rounded-sm px-3 py-1.5 text-sm text-gray-700 focus:outline-none  bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="mt-3 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => { resetForm(); router.push("/sales/lead"); }}
              className="px-6 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                  <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}