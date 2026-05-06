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
  }

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
      <div className=" bg-gray-100 ">
        {/* Header */}
        <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5">
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
                href="/customer-list"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Customer List
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/customer"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Add Customer
              </Link>
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-2 w-7xl mx-auto">
          {/* Tab Header */}
          <div className="flex mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={`px-4 py-2 font-medium ${activeTab === "customer" ? "text-blue-900 border-b-2 border-blue-600" : "text-gray-600"}`}
            >
              Personal Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`px-4 py-2 font-medium ${activeTab === "contact" ? "text-blue-900 border-b-2 border-blue-600" : "text-gray-600"}`}
            >
              Contact Details
            </button>
          </div>

          {/* Personal Information Section */}
          {activeTab === "customer" && (
            <div className="bg-white shadow rounded-2xl p-6">
              {/* Customer Type */}
              <div className="mb-4 flex gap-4">
                <label className="font-semibold">Customer Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="customer_type"
                      value="Individual"
                      checked={formData.customer_type === "Individual"}
                      onChange={handleChange}
                    />
                    Individual
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="customer_type"
                      value="Business"
                      checked={formData.customer_type === "Business"}
                      onChange={handleChange}
                    />
                    Business
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Company Name *
                  </label>
                  <input
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Enter Company name"
                    className="w-full border rounded-sm p-2 border-orange-300 outline-none"
                  />
                
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Customer Name *
                  </label>
                  <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Enter customer name" className="w-full border rounded-sm p-2 border-orange-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email*</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" className="w-full border rounded-sm p-2 border-orange-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1  ">Mobile No.</label>
                  <PhoneInput
                    country={"in"}
                    value={formData.mobile}
                    onChange={handleMobileChange}
                    inputStyle={{
                      width: "100%",
                      height: "38px",
                      borderRadius: "0.375rem",
                      border: "1px solid #d1d5db",
                    }}
                    buttonStyle={{
                      borderTopLeftRadius: "0.375rem",
                      borderBottomLeftRadius: "0.375rem",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 border-orange-300 outline-none">Industry *</label>
                  <select name="industry" value={formData.industry} onChange={handleChange} className="w-full border rounded-sm p-2 border-orange-300 outline-none">
                    <option value="">Select Industry*</option>
                    {industries.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address Details */}
              <div className="mb-4">
                <h3 className="text-blue-900 font-medium mb-2">
                  Add Address Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Address Type *
                    </label>
                    <select name="address_type" value={formData.address_type} onChange={handleChange} className="w-full border rounded-sm p-2 border-orange-300 outline-none">
                      <option value="">Select Adress Type</option>
                      <option>Billing</option>
                      <option>Shipping</option>
                      <option>Corporate</option>
                      <option>Warehouse</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1"> Address * </label>
                    <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter address" className="w-full border rounded-sm p-2 border-orange-300 outline-none"></textarea>
                  </div>

                </div>
              </div>

              {/* GST Details */}
              <div className="mb-4">
                <h3 className="text-blue-900 font-medium mb-2">Add GST Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">GST Type</label>
                    <select name="gst_type" value={formData.gst_type} onChange={handleChange} className="w-full border rounded-sm p-2 border-orange-300 outline-none">
                      <option value="">Select GST Type</option>
                      <option>Registered Regular</option>
                      <option>Registered Composite</option>
                      <option>Unregistered / Consumer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      GST Number
                    </label>
                    <input type="text" name="gst_number" value={formData.gst_number} onChange={handleChange} placeholder="Enter GST number" className="w-full border rounded-sm p-2 border-orange-300 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input type="text" name="gst_state" value={formData.gst_state} onChange={handleChange} placeholder="Enter State" className="w-full border rounded-sm p-2 border-orange-300 outline-none" />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="mb-6">
                <h3 className="text-blue-900 font-medium mb-2">Add more details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <input type="text" name="website" ref={websiteRef} value={formData.website} onFocus={handleFocus} onBlur={handleBlur} onChange={handleChange} className="w-full border rounded-sm p-2 border-orange-300 outline-none" />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Enter remarks" className="w-full border rounded-sm p-2 border-orange-300 outline-none"></textarea>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button type="button" className="border px-4 py-2 rounded bg-gray-200 hover:cursor-not-allowed" disabled>Previous</button>
                <button type="button" onClick={() => setActiveTab("contact")} className="bg-blue-900 hover:bg-blue-950 cursor-pointer text-white px-4 py-2 rounded">
                  Next
                </button>
                <button type="button" onClick={() => router.push("/customer-list")} className="border px-4 py-2 rounded hover:bg-gray-200 cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          {/* Contact Details Section */}
          {activeTab === "contact" && (
            <div className="bg-white shadow rounded-2xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contact Person*
                  </label>
                  <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} placeholder="Enter contact person name" className="w-full border rounded-sm p-2 border-orange-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contact Number*
                  </label>
                  <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} placeholder="Enter contact number" className="w-full border rounded-sm p-2 border-orange-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email*</label>
                  <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="Enter email" className="w-full border rounded-sm p-2 border-orange-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Designation*</label>
                  <select name="contact_designation" value={formData.contact_designation} onChange={handleChange} className="w-full border rounded-sm p-2 border-orange-300 outline-none">
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
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setActiveTab("customer")} className="border px-4 py-2 rounded cursor-pointer hover:bg-gray-200">
                  Previous
                </button>
                <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded cursor-pointer">
                  Save
                </button>
                <button type="button" onClick={() => router.push("/customer-list")} className="border px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer">Cancel</button>
              </div>
            </div>
          )}
        </form>
      </div>


    </>
  );
}
