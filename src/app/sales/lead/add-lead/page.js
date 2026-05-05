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

  const companyRef = useRef(null);
  const categoryRef = useRef(null);

  const [companyname, setCompanyname] = useState([]);
  const [customername, setCustomername] = useState([]);
  const [leadSource, setLeadSource] = useState([]);
  const [leadCategory, setLeadCategory] = useState([]);
  const [category, setCategory] = useState([]);
  const [productList, setProductList] = useState([]);
  const [asignee, setAsignee] = useState([]);
  // Add this state at the top with other states:
  const [isSubmitting, setIsSubmitting] = useState(false);
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
const [errors, setErrors] = useState({});
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const newErrors = {};

  // Required fields validation
  if (!formData.customer_name.trim()) {
    newErrors.customer_name = "Customer Name is required";
  }

  if (!formData.lead_title.trim()) {
    newErrors.lead_title = "Lead Title is required";
  }

  if (!formData.product_category) {
    newErrors.product_category = "Product Category is required";
  }

  if (!formData.product_name) {
    newErrors.product_name = "Product Name is required";
  }

  if (!formData.assignee.trim()) {
    newErrors.assignee = "Assignee is required";
  }

  setErrors(newErrors);

  // Stop submit if validation fails
  if (Object.keys(newErrors).length > 0) {
    toast.error("Please fill all required fields");
    return;
  }

  try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/api/lead/insert`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    if (res.status === 200 || res.status === 201) {
      toast.success("Lead added successfully!");
      router.push("/sales/lead");
      resetForm();
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to add lead");
  }
};


  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   try {
  //     const res = await axios.post(`${API_BASE}/api/lead/insert`, formData);

  //     if (res.status === 200 || res.status === 201) {
  //       toast.success("Lead added successfully!");

  //       router.push("/sales/lead");

  //       resetForm();
  //     }
  //   } catch (err) {
  //     console.error(err);

  //     toast.error("Failed to add lead");
  //   }
  // };

  const resetForm = () => {
    setFormData({
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
  };

  // Dynamic Dropdown for Company and Customer
  // useEffect(() => {
  //   const fetchCompanyName = async () => {
  //     try {
  //       const res = await axios.get(`${API_BASE}/api/organizations/organization-name`);
  //       setCompanyname(res.data.data || res.data);
  //     } catch {
  //       setCompanyname([]);
  //     }
  //   };

  //   fetchCompanyName();
  // }, []);

  // useEffect(() => {
  //   const dropdown = companyRef.current;
  //   if (!dropdown) return;

  //   const handleCompanyChange = async () => {
  //     const selected = dropdown.value;

  //     if (!selected) {
  //       setCustomername([]);
  //       return;
  //     }

  //     try {
  //       const res = await axios.get(`${API_BASE}/api/customers/customer-name`,
  //         { params: { company_name: selected } }
  //       );

  //       setCustomername(res.data.data || res.data);
  //     } catch {
  //       setCustomername([]);
  //     }
  //   };

  //   dropdown.addEventListener("change", handleCompanyChange);

  //   return () => dropdown.removeEventListener("change", handleCompanyChange);
  // }, []);

  // Dropdown for lead Source
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

  // Dropdown for lead Category
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

  // Dropdown for Product Category
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

  useEffect(() => {
    if (!formData.product_category) {
      setProductList([]);
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/product-master/read`, {
          params: {
            search2: formData.product_category,
          },
        });
        setProductList(res.data);
      } catch {
        setProductList([]);
      }
    };
    fetchProducts();
  }, [formData.product_category]);

  // Dynamic Dropdown for Assignee
  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
          params: { status: 1 },
        });

        const data = res.data.data || res.data || [];

        // convert full name -> first name only
        const formatted = data.map((item) => {
          const firstName = item.name.split(" ")[0];
          return {
            value: firstName,
            label: firstName,
          };
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
    <div className="bg-gray-100 ">
      <Header />

      {/* Breadcrumb */}

      <div className="bg-white w-full shadow-lg border-gray-100 p-3 mt-1 mb-5 flex justify-between items-center">
        {" "}
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
              href="sales/lead"
              className="mx-3 text-md text-gray-700 hover:text-orange-500"
            >
              Lead
            </Link>
            <i className="bi bi-chevron-right"></i>
            <Link
              href="sales/lead/add-lead"
              className="mx-3 text-md text-gray-700 hover:text-orange-500"
            >
              Add-Lead
            </Link>
          </p>
        </div>
      </div>
      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 pb-6 mx-auto max-w-5xl max-h-[80vh] overflow-y-scroll">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Lead</h2>
          <hr className="border-gray-100 mt-2 mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Company Name 
              </label>
              <input
                name="company_name"
                value={formData.company_name}
                placeholder="Company Name"
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Customer Name *
              </label>
              <input
                name="customer_name"
                value={formData.customer_name}
                placeholder="Customer Name"
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Lead Title *
              </label>
              <input
                type="text"
                name="lead_title"
                value={formData.lead_title}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Source 
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white"
              >
                <option value="">-- Select --</option>
                {leadSource.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                disabled
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              >
                <option>Qualified</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Product Category *
              </label>
              <select
                name="product_category"
                value={formData.product_category}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white"
              >
                <option value="">-- Select --</option>
                {category.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Product Name*
              </label>
              <select
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white"
              >
                <option value="">-- Select Product --</option>
                {productList.map((item) => (
                  <option key={item.id} value={item.product_name}>
                    {item.product_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Priority 
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white"
              >
                <option value="">-- Select --</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium ">
                Assignee *
              </label>

              <Select
                isMulti
                placeholder="-- Select --"
                instanceId="assignee-select"
                options={asignee}
                value={asignee.filter((option) =>
                  formData.assignee?.split(",").includes(option.value),
                )}
                onChange={(selectedOptions) => {
                  const values = selectedOptions
                    ? selectedOptions.map((option) => option.value).join(",")
                    : "";

                  setFormData({ ...formData, assignee: values });
                }}
                className="w-full "
                styles={{
                  control: (provided, state) => ({
                    ...provided,
                    borderColor: state.isFocused ? "#F5C99A" : "#e5e7eb",
                    boxShadow: state.isFocused ? "0 0 0 1px #F5C99A" : "none",
                    "&:hover": {
                      borderColor: "#F5C99A",
                    },
                    minHeight: "40px",
                    borderRadius: "6px",
                  }),

                  // ✅ DROPDOWN BACKGROUND
                  menu: (provided) => ({
                    ...provided,
                    backgroundColor: "bg-white",
                    borderRadius: "0px",
                    overflow: "hidden",
                    padding: "4px", // remove default padding
                  }),

                  // ✅ EACH OPTION STYLE
                  option: (provided, state) => ({
                    ...provided,
                    fontSize: "14px",
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
                    padding: "5px 6px",
                    ":active": {
                      ...provided[":active"],
                      backgroundColor: "#767676", // ✅ this fixes the blue flash on click
                    },
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: "#767676",
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
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white"
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
            <label className="block mb-1 text-sm font-medium text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-300">
              Description
            </label>
            <textarea
              name="description"
              rows="1"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-300"
            />
          </div>

          {/* Buttons */}
          <div className="mt-3 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                router.push("/sales/lead");
              }}
              className="px-6 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition flex items-center gap-2
    ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
  `}
            >
              {isSubmitting ? (
                <>
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
                  {/* ❌ Removed "Processing..." text */}
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
