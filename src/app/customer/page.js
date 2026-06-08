"use client";
import { useEffect, useRef, useState } from "react";
import Header from "../components/header";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import axios from "redaxios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "../components/useAuth";

export default function AddCustomer() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [activeTab, setActiveTab] = useState("customer");
  const API_base = `${API_BASE}/api/customers`;
  const [designations, setDesignations] = useState([]);

  const [industries, setIndustries] = useState([]);
  const [companyname, setCompanyname] = useState([]);

  // Token Check
  const [role, setRole] = useState("");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/");
      toast.error("Please Login First");
    } else {
      setRole(role);
    }
  }, [router]);

  // Website Validatation >>>
  const websiteRef = useRef();
  const [error, setError] = useState("");

  const handleBlur = () => {
    let value = formData.website;

    // Ensure https:// is present
    if (!value.startsWith("https://")) {
      value = "https://" + value.replace(/^https?:\/\//, "");
    }

    // Update formData
    setFormData((prev) => ({ ...prev, website: value }));

    // Validate domain
    const domain = value.replace(/^https:\/\//, "");
    const domainRegex = /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      setError("Invalid website (e.g., google.com or www.google.com)");
    } else {
      setError("");
    }
  };

  // Keep cursor at the end when focusing
  const handleFocus = (e) => {
    const el = websiteRef.current;
    const length = el.value.length;
    el.setSelectionRange(length, length);
    console.log(e.target.value);
  };

  //  <<< Website Validation

  const [formData, setFormData] = useState({
    customer_type: "",
    company_name: "",
    customer_name: "",
    email: "",
    mobile: "",
    industry: "",
    address_type: "",
    address: "",
    gst_type: "",
    gst_number: "",
    gst_state: "",
    website: "https://",
    remarks: "",
    contact_person: "",
    contact_number: "",
    contact_email: "",
    contact_designation: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMobileChange = (value) => {
    setFormData((prev) => ({ ...prev, mobile: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true); // ✅ START

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("User not logged in. Please login first");
        return;
      }

      const dataToSend = {
        ...formData,
        website: formData.website === "https://" ? "" : formData.website,
      };

      const res = await axios.post(`${API_base}/add`, dataToSend, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Customer added successfully");
      console.log("DATA SENT TO BACKEND:", dataToSend);
      console.log("Response:", res.data);

      // Redirect to customer list page
      router.push("/customer-list");

      setFormData({
        customer_type: "",
        company_name: "",
        customer_code: "",
        customer_name: "",
        email: "",
        mobile: "",
        industry: "",
        address_type: "",
        address: "",
        gst_type: "",
        gst_number: "",
        gst_state: "",
        website: "https://",
        remarks: "",
        contact_person: "",
        contact_number: "",
        contact_email: "",
        contact_designation: "",
      });
    } catch (err) {
      const status = err?.response?.status || err?.status;
    }
  };

  // ✅ Fetch designations
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/contact/read`, {
          params: { status: 1 },
        });
        setDesignations(res.data);
      } catch (err) {
        console.error("Failed to fetch designations:", err);
      }
    };
    fetchDesignations();
  }, []);

  // ✅ Fetch industries
  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/Industries/industries`, {
          params: { status: 1 },
        });
        setIndustries(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch industries:", err);
        setIndustries([]);
      }
    };
    fetchIndustry();
  }, []);

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/organizations/organization-name`,
          {
            params: { status: 1 },
          },
        );

        // If your API wraps data like { data: [...] }
        setCompanyname(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch company names:", err);
        setCompanyname([]);
      }
    };

    fetchCompanyName();
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 pb-6">
        {/* Header */}
        <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5">
          <div className="flex items-center text-gray-700 w-full">
            <p className="flex items-center flex-wrap gap-y-2 text-sm sm:text-base">
              <Link
                href="/dashboard"
                className="mr-2 sm:mx-2 text-xl text-gray-400 hover:text-indigo-600"
              >
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/customer-list"
                className="mx-2 text-sm sm:text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Customer List
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/customer"
                className="mx-2 text-sm sm:text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Add Customer
              </Link>
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-6">
          {/* Tab Header */}
          <div className="flex mb-4 overflow-x-auto border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={`min-w-max flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "customer"
                  ? "text-orange-500 border-b-2 border-orange-500 -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Personal Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`min-w-max flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "contact"
                  ? "text-orange-500 border-b-2 border-orange-500 -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Contact Details
            </button>
          </div>

          {/* ── PERSONAL INFORMATION TAB ── */}
          {activeTab === "customer" && (
            <div className="w-full max-w-[900px] mx-auto bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5 max-h-none lg:max-h-[calc(100vh-220px)] overflow-y-visible lg:overflow-y-auto custom-scroll">
              {/* Customer Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Customer Type
                </label>
                <div className="grid grid-cols-1 sm:flex gap-3 sm:gap-4">
                  {["Individual", "Business"].map((type) => (
                    <label
                      key={type}
                      className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.customer_type === type
                          ? "border-orange-400 bg-orange-50 text-orange-500"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="customer_type"
                        value={type}
                        checked={formData.customer_type === type}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          formData.customer_type === type
                            ? "border-orange-500"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.customer_type === type && (
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Row 1 — Company / Customer / Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Enter Company name"
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Customer Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Mobile No.
                  </label>
                  <PhoneInput
                    country={"in"}
                    value={formData.mobile}
                    onChange={handleMobileChange}
                    inputStyle={{
                      width: "100%",
                      height: "42px",
                      borderRadius: "0.125rem",
                      border: "1px solid #fdba74",
                      backgroundColor: "#f9fafb",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                    buttonStyle={{
                      borderTopLeftRadius: "0.125rem",
                      borderBottomLeftRadius: "0.125rem",
                      border: "1px solid #fdba74",
                      backgroundColor: "#f9fafb",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Industry <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                  >
                    <option value="">Select Industry</option>
                    {industries.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Address Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Address Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="address_type"
                      value={formData.address_type}
                      onChange={handleChange}
                      className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                    >
                      <option value="">Select Address Type</option>
                      <option>Billing</option>
                      <option>Shipping</option>
                      <option>Corporate</option>
                      <option>Warehouse</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Address <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter address"
                      rows="2"
                      className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* GST Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  GST Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      GST Type
                    </label>
                    <select
                      name="gst_type"
                      value={formData.gst_type}
                      onChange={handleChange}
                      className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                    >
                      <option value="">Select GST Type</option>
                      <option>Registered Regular</option>
                      <option>Registered Composite</option>
                      <option>Unregistered / Consumer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gst_number"
                      value={formData.gst_number}
                      onChange={handleChange}
                      placeholder="Enter GST number"
                      className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      name="gst_state"
                      value={formData.gst_state}
                      onChange={handleChange}
                      placeholder="Enter State"
                      className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  More Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      ref={websiteRef}
                      value={formData.website}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                    />
                    {error && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <i className="bi bi-exclamation-circle"></i> {error}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      placeholder="Enter remarks"
                      rows="3"
                      className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-400 border border-gray-200 rounded-sm bg-gray-50 cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/customer-list")}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          

          {/* ── CONTACT DETAILS TAB ── */}
          {activeTab === "contact" && (
            <div className="w-full max-w-[900px] mx-auto bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5 max-h-none lg:max-h-[calc(100vh-220px)] overflow-y-visible lg:overflow-y-auto custom-scroll">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Contact Person <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Contact Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Contact Designation <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="contact_designation"
                    value={formData.contact_designation}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                  >
                    <option value="">Select Contact Designation</option>
                    {designations.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("customer")}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 cursor-pointer transition-all"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="bi bi-check2"></i> Save
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/customer-list")}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
        
      </div>
    </>
  );
}