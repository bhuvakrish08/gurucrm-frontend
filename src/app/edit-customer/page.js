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
  const [activeTab, setActiveTab] = useState("update-customer");

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  useAuth();
  const router = useRouter(); // ← yeh add karo

  const [designations, setDesignations] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [companyname, setCompanyname] = useState([]);
  const [showaddressModal, setShowAddressModal] = useState(false);
  const [showcontactsModal, setShowContactsModal] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);

  const [gstDetails, setGstDetails] = useState([]);

  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("customer_edit_id");
    if (id) {
      setCustomerId(id);
    }
  }, []);

  // Website Validation
  const websiteRef = useRef();
  const [error, setError] = useState("");

  const handleBlur = () => {
    let value = formData.website;
    if (!value.startsWith("https://")) {
      value = "https://" + value.replace(/^https?:\/\//, "");
    }
    setFormData((prev) => ({ ...prev, website: value }));
    const domain = value.replace(/^https:\/\//, "");
    const domainRegex = /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      setError("Invalid website (e.g., google.com or www.google.com)");
    } else {
      setError("");
    }
  };

  const handleFocus = (e) => {
    const el = websiteRef.current;
    const length = el.value.length;
    el.setSelectionRange(length, length);
  };

  const [formData, setFormData] = useState({
    customer_type: "",
    company_name: "",
    customer_name: "",
    email: "",
    mobile: "",
    industry: "",
    website: "https://",
    remarks: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMobileChange = (value) => {
    setFormData((prev) => ({ ...prev, mobile: value }));
  };

  const addGst = () => {
    if (gstDetails.length >= 5) return;
    setGstDetails([
      ...gstDetails,
      { gst_type: "", gst_number: "", gst_state: "" },
    ]);
  };

  const removeGst = async (id) => {
    if (gstDetails.length === 1) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/customers/delete-gst/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGstDetails((prev) => prev.filter((gst) => gst.id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to Remove GST");
    }
  };

  const updateGst = (id, field, value) => {
    setGstDetails(
      gstDetails.map((gst) =>
        gst.id === id ? { ...gst, [field]: value } : gst,
      ),
    );
  };

  const saveGstDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const customerId = localStorage.getItem("customer_edit_id");
      await axios.put(
        `${API_BASE}/api/customers/customer-gst/${customerId}`,
        { gst_details: gstDetails },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      console.error(err);
      toast.error("GST update failed");
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!customerId) {
      toast.error("Customer ID not found");
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const payload = {
        company_name: formData.company_name,
        customer_type: formData.customer_type,
        customer_name: formData.customer_name,
        email: formData.email,
        mobile: formData.mobile,
        industry: formData.industry,
        website: formData.website,
        remarks: formData.remarks,
      };
      const res = await axios.put(
        `${API_BASE}/api/customers/customer-data/${customerId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(res.data.message || "Customer updated successfully");
      router.push("/customer-list"); // ← aa line add karo
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch existing customer data
  useEffect(() => {
    if (!customerId) return;
    const fetchCustomer = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE}/api/customers/customer/${customerId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const { customer, gst_details } = res.data;
        setFormData({
          customer_type: customer.customer_type || "",
          company_name: customer.company_id || "",
          customer_name: customer.customer_name || "",
          email: customer.email || "",
          mobile: customer.mobile || "",
          industry: customer.industry || "",
          website: customer.website || "https://",
          remarks: customer.remarks || "",
        });
        setGstDetails(
          gst_details.map((gst) => ({
            id: gst.id,
            gst_type: gst.gst_type,
            gst_number: gst.gst_number,
            gst_state: gst.state,
          })),
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load customer");
      }
    };
    fetchCustomer();
  }, [customerId]);

  // Fetch designations
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

  // Fetch industries
  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/Industries/industries`, {
          params: { status: 1 },
        });
        setIndustries(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch names:", err);
        setIndustries([]);
      }
    };
    fetchIndustry();
  }, []);

  // Fetch company names
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/organizations/organization-name`,
          { params: { status: 1 } },
        );
        setCompanyname(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch company names:", err);
        setCompanyname([]);
      }
    };
    fetchCompanyName();
  }, []);

  // ── ADDRESS FUNCTIONS ──

  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    address_type: "",
    address: "",
  });
  const [editAddressId, setEditAddressId] = useState(null);

  const fetchAddresses = async () => {
    if (!customerId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE}/api/customers/customer-address/${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setAddresses(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load addresses");
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchContacts();
  }, [customerId]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveAddress = async () => {
    // Validation
    if (!addressForm.address_type) {
      toast.error("Please select an address type");
      return;
    }
    if (!addressForm.address.trim()) {
      toast.error("Please enter an address");
      return;
    }

    try {
      setIsSavingAddress(true);
      const token = localStorage.getItem("token");

      if (editAddressId) {
        await axios.put(
          `${API_BASE}/api/customers/customer-address/${editAddressId}`,
          addressForm,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Address updated");
      } else {
        await axios.post(
          `${API_BASE}/api/customers/customer-address`,
          { customer_id: customerId, ...addressForm },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Address added");
      }

      setShowAddressModal(false);
      setAddressForm({ address_type: "", address: "" });
      setEditAddressId(null);
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const editAddress = (item) => {
    setEditAddressId(item.id);
    setAddressForm({
      address_type: item.address_type,
      address: item.address,
    });
    setShowAddressModal(true);
  };

  const deleteAddress = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/customers/customer-address/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      toast.success("Address deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete address");
    }
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setEditAddressId(null);
    setAddressForm({ address_type: "", address: "" });
  };

  // ── CONTACT FUNCTIONS ──

  const [contacts, setContacts] = useState([]);
  const [contactForm, setContactForm] = useState({
    contact_person: "",
    contact_number: "",
    email: "",
    contact_designation: "",
  });
  const [editContactId, setEditContactId] = useState(null);

  const fetchContacts = async () => {
    if (!customerId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE}/api/customers/customer-contacts/${customerId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setContacts(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contacts");
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveContact = async () => {
    try {
      setIsSavingContact(true);
      const token = localStorage.getItem("token");

      if (editContactId) {
        await axios.put(
          `${API_BASE}/api/customers/customer-contacts/${editContactId}`,
          {
            company_name: formData.company_name,
            customer_name: formData.customer_name,
            ...contactForm,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Contact updated");
      } else {
        await axios.post(
          `${API_BASE}/api/customers/customer-contacts`,
          {
            customer_id: customerId,
            company_name: formData.company_name,
            customer_name: formData.customer_name,
            ...contactForm,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success("Contact added");
      }

      setShowContactsModal(false);
      setContactForm({
        contact_person: "",
        contact_number: "",
        email: "",
        contact_designation: "",
      });
      setEditContactId(null);
      fetchContacts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save contact");
    } finally {
      setIsSavingContact(false);
    }
  };

  const editContact = (item) => {
    setEditContactId(item.id);
    setContactForm({
      contact_person: item.contact_person,
      contact_number: item.contact_number,
      email: item.email,
      contact_designation: item.contact_designation,
    });
    setShowContactsModal(true);
  };

  const deleteContact = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/customers/customer-contacts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts((prev) => prev.filter((contact) => contact.id !== id));
      toast.success("Contact deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete contact");
    }
  };

  const closeContactModal = () => {
    setShowContactsModal(false);
    setEditContactId(null);
    setContactForm({
      contact_person: "",
      contact_number: "",
      email: "",
      contact_designation: "",
    });
  };

  return (
    <>
      <Header />
      <div className="bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white w-full rounded-sm shadow-lg p-3 mt-1 mb-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
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
                href="#"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Update Customer
              </Link>
              {formData.customer_name && (
                <>
                  <i className="bi bi-chevron-right text-[10px]"></i>
                  <span className="mx-2 text-md text-orange-500 font-bold">
                    {formData.customer_name}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-5">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200">
            {[
              {
                key: "update-customer",
                label: "Update Customer",
                icon: "bi-person",
              },
              {
                key: "address-details",
                label: "Address Details",
                icon: "bi-geo-alt",
              },
              {
                key: "contact-details",
                label: "Contact Details",
                icon: "bi-telephone",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px hover:cursor-pointer ${
                  activeTab === tab.key
                    ? "text-orange-500 border-orange-500"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                <i className={`bi ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── UPDATE CUSTOMER TAB ── */}
          {activeTab === "update-customer" && (
            <form className="bg-white rounded-sm border border-gray-200 shadow-sm p-6 space-y-5 max-w-[800px] max-h-[63vh] overflow-y-auto custom-scroll">
              {/* Customer Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Customer Type
                </label>
                <div className="flex gap-4">
                  {["Individual", "Business"].map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
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

              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Company Name
                  </label>
                  <input
                    name="company_name"
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                    placeholder="Enter Company Name"
                    value={formData.company_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    placeholder="Enter customer name"
                    value={formData.customer_name}
                    onChange={handleChange}
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
                      borderRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                    buttonStyle={{
                      borderTopLeftRadius: "0.5rem",
                      borderBottomLeftRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                    }}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
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
                      <option key={item.name} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    ref={websiteRef}
                    onBlur={handleBlur}
                    value={formData.website}
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
                    placeholder="Enter remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              {/* GST Details */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    GST Details
                  </label>
                  {gstDetails.length < 5 && (
                    <button
                      type="button"
                      onClick={addGst}
                      className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 hover:cursor-pointer transition-colors border border-orange-200 hover:border-orange-300 bg-orange-50 px-3 py-1.5 rounded-lg"
                    >
                      <i className="bi bi-plus-lg"></i> Add GST
                    </button>
                  )}
                </div>

                {gstDetails.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <i className="bi bi-receipt text-3xl mb-2 block"></i>
                    <p className="text-sm">No GST details added</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gstDetails.map((gst, index) => (
                      <div
                        key={gst.id || index}
                        className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="col-span-4">
                          {index === 0 && (
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              GST Type
                            </label>
                          )}
                          <select
                            className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                            value={gst.gst_type}
                            onChange={(e) =>
                              updateGst(gst.id, "gst_type", e.target.value)
                            }
                          >
                            <option value="">Select GST Type</option>
                            <option>Registered Regular</option>
                            <option>Registered Composite</option>
                            <option>Unregistered / Consumer</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          {index === 0 && (
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              GST Number
                            </label>
                          )}
                          <input
                            type="text"
                            className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                            placeholder="Enter GST number"
                            value={gst.gst_number}
                            onChange={(e) =>
                              updateGst(gst.id, "gst_number", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-3">
                          {index === 0 && (
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              State
                            </label>
                          )}
                          <input
                            type="text"
                            className="w-full bg-white border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none transition-all"
                            placeholder="Enter state"
                            value={gst.gst_state}
                            onChange={(e) =>
                              updateGst(gst.id, "gst_state", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {gstDetails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGst(gst.id)}
                              className="w-9 h-9 rounded-sm bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 hover:cursor-pointer transition-all"
                            >
                              <i className="bi bi-trash3 text-sm"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/customer-list")}
                  className="px-6 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-sm hover:bg-gray-50 hover:cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    await handleSubmit();
                    await saveGstDetails();
                  }}
                  className={`w-40 flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg transition-all shadow-sm
                    ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-orange-600 hover:cursor-pointer"}`}
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
                    <>
                      <i className="bi bi-check2"></i> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── ADDRESS DETAILS TAB ── */}
          {activeTab === "address-details" && (
            <div className="bg-white rounded-sm border border-gray-200 shadow-sm max-w-[800px]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <i className="bi bi-geo-alt text-orange-500"></i>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">
                      Address Listing
                    </h2>
                    <p className="text-xs text-gray-400">
                      {addresses.length} address(es) added
                    </p>
                  </div>
                </div>

                {/* ✅ FIX: "Add Address" button — opens modal, does NOT save */}
                <button
                  type="button"
                  onClick={() => {
                    setEditAddressId(null);
                    setAddressForm({ address_type: "", address: "" });
                    setShowAddressModal(true);
                  }}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:cursor-pointer transition-all shadow-sm"
                >
                  <i className="bi bi-plus-lg"></i> Add Address
                </button>
              </div>

              <div className="overflow-y-auto max-h-[300px] custom-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">
                        #
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                        Type
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-10 text-gray-400"
                        >
                          <i className="bi bi-geo-alt text-3xl block mb-2"></i>
                          No addresses added yet
                        </td>
                      </tr>
                    ) : (
                      addresses.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-semibold">
                              {item.address_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {item.address}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => editAddress(item)}
                                className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 hover:text-blue-600 hover:cursor-pointer transition-all"
                              >
                                <i className="bi bi-pencil-square text-sm"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAddress(item.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 hover:cursor-pointer transition-all"
                              >
                                <i className="bi bi-trash3 text-sm"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ✅ Address Modal — Add & Edit both work here */}
              {showaddressModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 from-orange-100 to-white bg-gradient-to-r">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-geo-alt text-black"></i>
                        <h3 className="text-black font-semibold">
                          {editAddressId ? "Edit Address" : "Add New Address"}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={closeAddressModal}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#ff6b00] hover:bg-[#f5e8d8] hover:cursor-pointer transition-all"
                      >
                        <i className="bi bi-x-lg text-sm"></i>
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Address Type <span className="text-red-400">*</span>
                        </label>
                        <select
                          name="address_type"
                          value={addressForm.address_type}
                          onChange={handleAddressChange}
                          className="w-full bg-gray-50 border border-orange-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none "
                        >
                          <option value="">Select Address Type</option>
                          <option>Billing</option>
                          <option>Shipping</option>
                          <option>Corporate</option>
                          <option>Warehouse</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Address <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          name="address"
                          value={addressForm.address}
                          onChange={handleAddressChange}
                          rows="3"
                          placeholder="Enter full address"
                          className="w-full bg-gray-50 border border-orange-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none "
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 px-6 pb-6">
                      <button
                        type="button"
                        onClick={closeAddressModal}
                        className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveAddress}
                        disabled={isSavingAddress}
                        className={`w-40 flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg transition-all
                          ${isSavingAddress ? "opacity-70 cursor-not-allowed" : "hover:bg-orange-600 hover:cursor-pointer"}`}
                      >
                        {isSavingAddress ? (
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
                        ) : editAddressId ? (
                          "Update Address"
                        ) : (
                          "Save Address"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CONTACT DETAILS TAB ── */}
          {activeTab === "contact-details" && (
            <div className="bg-white rounded-sm border border-gray-200 shadow-sm max-w-[900px]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                    <i className="bi bi-telephone text-orange-500"></i>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">
                      Contacts Listing
                    </h2>
                    <p className="text-xs text-gray-400">
                      {contacts.length} contact(s) added
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditContactId(null);
                    setContactForm({
                      contact_person: "",
                      contact_number: "",
                      email: "",
                      contact_designation: "",
                    });
                    setShowContactsModal(true);
                  }}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:cursor-pointer transition-all shadow-sm"
                >
                  <i className="bi bi-plus-lg"></i> Add Contact
                </button>
              </div>

              <div className="overflow-y-auto max-h-[400px] custom-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Number
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          className="text-center py-10 text-gray-400"
                        >
                          <i className="bi bi-telephone text-3xl block mb-2"></i>
                          No contacts added yet
                        </td>
                      </tr>
                    ) : (
                      contacts.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-gray-400 text-xs font-medium">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {item.company_name}
                          </td>
                          <td className="px-4 py-3.5 text-gray-700 font-medium">
                            {item.customer_name}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {item.contact_person}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {item.contact_number}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {item.email}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-600 text-xs font-semibold">
                              {item.designation_name}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => editContact(item)}
                                className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 hover:text-blue-600 hover:cursor-pointer transition-all"
                              >
                                <i className="bi bi-pencil-square text-sm"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteContact(item.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 hover:cursor-pointer transition-all"
                              >
                                <i className="bi bi-trash3 text-sm"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Contact Modal */}
              {showcontactsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 from-orange-100 to-white bg-gradient-to-r">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-telephone text-black"></i>
                        <h3 className="text-black font-semibold">
                          {editContactId ? "Edit Contact" : "Add Contact"}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={closeContactModal}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[#ff6b00] hover:bg-[#f5e8d8] hover:cursor-pointer transition-all"
                      >
                        <i className="bi bi-x-lg text-sm"></i>
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Contact Person <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="contact_person"
                          value={contactForm.contact_person}
                          onChange={handleContactChange}
                          placeholder="Enter contact person name"
                          className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Contact Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="contact_number"
                          value={contactForm.contact_number}
                          onChange={handleContactChange}
                          placeholder="Enter contact number"
                          className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Email
                        </label>
                        <input
                          type="text"
                          name="email"
                          value={contactForm.email}
                          onChange={handleContactChange}
                          placeholder="Enter email address"
                          className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Designation <span className="text-red-400">*</span>
                        </label>
                        <select
                          name="contact_designation"
                          value={contactForm.contact_designation}
                          onChange={handleContactChange}
                          className="w-full bg-gray-50 border border-orange-300 rounded-sm px-3 py-2.5 text-sm text-gray-700 outline-none"
                        >
                          <option value="">Select Designation</option>
                          {designations.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 px-6 pb-6">
                      <button
                        type="button"
                        onClick={closeContactModal}
                        className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveContact}
                        disabled={isSavingContact}
                        className={`w-40 flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg transition-all
                          ${isSavingContact ? "opacity-70 cursor-not-allowed" : "hover:bg-orange-600 hover:cursor-pointer"}`}
                      >
                        {isSavingContact ? (
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
                        ) : editContactId ? (
                          "Update Contact"
                        ) : (
                          "Save Contact"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
