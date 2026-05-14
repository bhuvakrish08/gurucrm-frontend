"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import Select from "react-select";
import axios from "redaxios";
import { toast } from "react-toastify";
import useAuth from "@/app/components/useAuth";

export default function Page() {
  const companyRef = useRef(null);
  const categoryRef = useRef(null);

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  useAuth();
  const router = useRouter();

  const [leadSource, setLeadSource] = useState([]);
  const [leadCategory, setLeadCategory] = useState([]);
  const [category, setCategory] = useState([]);
  const [productList, setProductList] = useState([]);
  const [asignee, setAsignee] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    lead_id: "",
    company_name: "",
    customer_name: "",
    lead_title: "",
    source: "",
    status: "",
    product_category: "",
    product_name: "",
    priority: "",
    assignee: "",
    category: "",
    description: "",
  });

  // ✅ Helper: get token from localStorage/sessionStorage
  const getToken = () => {
    return (
      localStorage.getItem("token") || sessionStorage.getItem("token") || ""
    );
  };

  // ✅ Load lead data from sessionStorage on mount
  useEffect(() => {
    const lead = sessionStorage.getItem("editLead");
    if (!lead) {
      router.push("/sales/lead");
      return;
    }
    const parsedLead = JSON.parse(lead);
    setFormData({
      lead_id: parsedLead.lead_id || "",
      company_name: parsedLead.company_id || parsedLead.company_name || "",
      customer_name: parsedLead.customer_name || "",
      lead_title: parsedLead.lead_title || "",
      source: parsedLead.source_id || parsedLead.source || "",
      status: parsedLead.status || "",
      product_category:
        parsedLead.product_category_id || parsedLead.product_category || "",
      product_name: parsedLead.product_id || parsedLead.product_name || "",
      priority: parsedLead.priority || "",
      assignee: parsedLead.assignee || "",
      category: parsedLead.category_id || parsedLead.category || "",
      description: parsedLead.description || "",
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ FIXED: Authorization header added to fetch
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.lead_id) {
      toast.error("Lead ID missing. Cannot update.");
      return;
    }

    const timeout = setTimeout(() => {
      setIsSubmitting(false);
      toast.error("Request timed out. Please try again.");
    }, 60000);

    try {
      setIsSubmitting(true);

      const token = getToken();

      const response = await fetch(
        `${API_BASE}/api/lead/update/${formData.lead_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Token added here
          },
          body: JSON.stringify({
            company_name: formData.company_name,
            customer_name: formData.customer_name,
            lead_title: formData.lead_title,
            source: formData.source,
            status: formData.status,
            product_category: formData.product_category,
            product_name: formData.product_name,
            priority: formData.priority,
            assignee: formData.assignee,
            category: formData.category,
            description: formData.description,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Lead Updated Successfully");
        clearTimeout(timeout);
        sessionStorage.removeItem("editLead");
        router.push("/sales/lead");
      } else {
        toast.error(data.message || "Update Failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Something went wrong");
    } finally {
      clearTimeout(timeout);
      setIsSubmitting(false);
    }
  };

  // ✅ Fetch Lead Sources
  useEffect(() => {
    const fetchSource = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/inquiry-lead-source/read`,
          { params: { status: 1 } },
        );
        setLeadSource(res.data);
      } catch {}
    };
    fetchSource();
  }, []);

  // ✅ Fetch Lead Categories
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/inquiry-lead-category/read`,
          { params: { status: 1 } },
        );
        setLeadCategory(res.data);
      } catch {}
    };
    fetchCategory();
  }, []);

  // ✅ Fetch Product Categories
  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/product-category/read`, {
          params: { status: 1 },
        });
        setCategory(res.data);
      } catch {}
    };
    fetchProductCategory();
  }, []);

  // ✅ Fetch Products filtered by selected category
  useEffect(() => {
    if (!formData.product_category) {
      setProductList([]);
      return;
    }
    axios
      .get(`${API_BASE}/api/product-master/read`, {
        params: { search2: formData.product_category },
      })
      .then((res) => setProductList(res.data))
      .catch(() => setProductList([]));
  }, [formData.product_category]);

  // ✅ Fetch Assignees
  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
          params: { status: 1 },
        });
        const data = res.data.data || res.data || [];
        const formatted = data.map((item) => {
          const firstName = item.name.split(" ")[0];
          return { value: firstName, label: firstName };
        });
        setAsignee(formatted);
      } catch (error) {
        console.log(error);
        setAsignee([]);
      }
    };
    fetchAssignee();
  }, []);

  return (
    <>
      <Header />

      <div className="bg-gray-100">
        {/* Breadcrumb */}
        <div className="bg-white w-full shadow-lg border-gray-100 p-3 mt-1 mb-5 flex justify-between items-center">
          <div className="flex items-center text-gray-700">
            <p>
              <Link
                href="/dashboard"
                className="mx-3 text-xl text-gray-400 hover:text-indigo-600"
              >
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right"></i>
              <Link
                href="#"
                className="mx-3 text-md text-gray-700 hover:text-orange-500"
              >
                Sales
              </Link>
              <i className="bi bi-chevron-right"></i>
              <Link
                href="/sales/lead"
                className="mx-3 text-md text-gray-700 hover:text-orange-500"
              >
                Lead
              </Link>
              <i className="bi bi-chevron-right"></i>
              <Link
                href="/add-lead"
                className="mx-3 text-md text-gray-700 hover:text-orange-500"
              >
                Edit Lead
              </Link>
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-3 pb-3 mx-auto max-w-5xl max-h-[85vh] overflow-y-scroll"
        >
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Lead Information
            </h2>
            <hr className="border-gray-200 mt-1 mb-3" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              {/* Company Name */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Company Name *
                </label>
                <input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Company Name"
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Customer Name *
                </label>
                <input
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Customer Name"
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                />
              </div>

              {/* Lead Title */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Lead Title *
                </label>
                <input
                  type="text"
                  name="lead_title"
                  value={formData.lead_title}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Source *
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                >
                  <option value="">-- Select --</option>
                  {leadSource.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                >
                  <option value="">-- Select --</option>
                  <option>Qualified</option>
                  <option>Pending</option>
                  <option>Won</option>
                  <option>Lost</option>
                  <option>Quotation Send</option>
                  <option>Technical Discussion</option>
                  <option>Call Initiated</option>
                </select>
              </div>

              {/* Product Category */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Product Category *
                </label>
                <select
                  name="product_category"
                  value={formData.product_category}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                >
                  <option value="">-- Select --</option>
                  {category.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Product Name
                </label>
                <select
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                >
                  <option value="">-- Select Product --</option>
                  {productList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.product_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                >
                  <option value="">-- Select --</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Assignee *
                </label>
                <Select
                  isMulti
                  instanceId="assignee-select"
                  options={asignee}
                  value={asignee.filter((option) =>
                    formData.assignee?.split(",").includes(option.value),
                  )}
                  onChange={(selectedOptions) => {
                    const values = selectedOptions
                      ? selectedOptions.map((option) => option.value).join(",")
                      : "";
                    setFormData((prev) => ({ ...prev, assignee: values }));
                  }}
                  className="w-full"
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      borderColor: "#fdba74",
                      boxShadow: state.isFocused ? "0 0 0 1px #F5C99A" : "none",
                      "&:hover": { borderColor: "#fdba74" },
                      minHeight: "34px",
                      fontSize: "13px",
                      borderRadius: "6px",
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "#fff",
                      borderRadius: "6px",
                      overflow: "hidden",
                      padding: "2px",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      fontSize: "13px",
                      backgroundColor: state.isSelected
                        ? "#767676"
                        : state.isFocused
                          ? "#767676"
                          : "#ffffff",
                      color:
                        state.isSelected || state.isFocused
                          ? "#ffffff"
                          : "#000000",
                      cursor: "pointer",
                      padding: "4px 6px",
                      ":active": {
                        ...provided[":active"],
                        backgroundColor: "#767676",
                      },
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: "#767676",
                      fontSize: "13px",
                    }),
                    multiValue: (provided) => ({
                      ...provided,
                      backgroundColor: "#767676",
                    }),
                    multiValueLabel: (provided) => ({
                      ...provided,
                      color: "#fff",
                    }),
                    multiValueRemove: (provided) => ({
                      ...provided,
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "#767676",
                        color: "#fff",
                      },
                    }),
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
                >
                  <option value="">-- Select --</option>
                  {leadCategory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mt-3">
              <label className="block mb-1 text-xs font-medium text-gray-600">
                Description
              </label>
              <textarea
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleChange}
                className="w-full border border-orange-300 rounded-md px-2 py-1.5 text-sm text-gray-700 outline-none bg-white"
              />
            </div>

            {/* Buttons */}
            <div className="mt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/sales/lead")}
                className="px-5 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition flex items-center gap-2
                  ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="4"
                      opacity="0.25"
                    />
                    <path
                      fill="white"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
