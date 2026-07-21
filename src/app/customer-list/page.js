// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import Header from "../components/header";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { toast } from "react-toastify";
// import axios from "redaxios";
// import useAuth from "../components/useAuth";
// import "react-phone-input-2/lib/style.css";
// import PhoneInput from "react-phone-input-2";
// import {
//   UserPlus, X, Save, Eye, Building2, User, Mail, Phone, Tag, Globe,
//   Briefcase, FileText, UserRound, Trash2, MapPin, Receipt, Hash,
// } from "lucide-react";

// // =======================================================================
// // ✅ ADD CUSTOMER POPUP — defined right here in the same file, no separate
// // component file needed. Rendered conditionally inside CustomerList below.
// // Slide-in on mount, slide-out (300ms) before onClose fires.
// // ✅ Theme: indigo-to-violet gradient header + colored field icons,
// // matching the Add Lead popup reference.
// // =======================================================================
// function AddCustomerModal({ onClose, onSuccess }) {
//   const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
//   const API_base = `${API_BASE}/api/customers`;

//   const [activeTab, setActiveTab] = useState("customer");
//   const [designations, setDesignations] = useState([]);
//   const [industries, setIndustries] = useState([]);
//   const [companyname, setCompanyname] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Slide in / out
//   const [panelVisible, setPanelVisible] = useState(false);

//   useEffect(() => {
//     const t = setTimeout(() => setPanelVisible(true), 10);
//     return () => clearTimeout(t);
//   }, []);

//   const handleClose = () => {
//     setPanelVisible(false);
//     setTimeout(() => {
//       onClose?.();
//     }, 300);
//   };

//   // Website Validation >>>
//   const websiteRef = useRef();
//   const [error, setError] = useState("");

//   const handleBlur = () => {
//     let value = formData.website;

//     if (!value.startsWith("https://")) {
//       value = "https://" + value.replace(/^https?:\/\//, "");
//     }

//     setFormData((prev) => ({ ...prev, website: value }));

//     const domain = value.replace(/^https:\/\//, "");
//     const domainRegex = /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
//     if (!domainRegex.test(domain)) {
//       setError("Invalid website (e.g., google.com or www.google.com)");
//     } else {
//       setError("");
//     }
//   };

//   const handleFocus = (e) => {
//     const el = websiteRef.current;
//     const length = el.value.length;
//     el.setSelectionRange(length, length);
//   };
//   //  <<< Website Validation

//   const [formData, setFormData] = useState({
//     customer_type: "",
//     company_name: "",
//     customer_name: "",
//     email: "",
//     mobile: "",
//     industry: "",
//     address_type: "",
//     address: "",
//     gst_type: "",
//     gst_number: "",
//     gst_state: "",
//     website: "https://",
//     remarks: "",
//     contact_person: "",
//     contact_number: "",
//     contact_email: "",
//     contact_designation: "",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleMobileChange = (value) => {
//     setFormData((prev) => ({ ...prev, mobile: value }));
//   };

//   const resetForm = () => {
//     setFormData({
//       customer_type: "",
//       company_name: "",
//       customer_name: "",
//       email: "",
//       mobile: "",
//       industry: "",
//       address_type: "",
//       address: "",
//       gst_type: "",
//       gst_number: "",
//       gst_state: "",
//       website: "https://",
//       remarks: "",
//       contact_person: "",
//       contact_number: "",
//       contact_email: "",
//       contact_designation: "",
//     });
//     setActiveTab("customer");
//     setError("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       setIsSubmitting(true);

//       const token = localStorage.getItem("token");

//       if (!token) {
//         toast.error("User not logged in. Please login first");
//         setIsSubmitting(false);
//         return;
//       }

//       const dataToSend = {
//         ...formData,
//         website: formData.website === "https://" ? "" : formData.website,
//       };

//       await axios.post(`${API_base}/add`, dataToSend, {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       toast.success("Customer added successfully");

//       resetForm();
//       onSuccess?.(); // refresh customer list in parent
//       handleClose(); // slide out, then unmount
//     } catch (err) {
//       const status = err?.response?.status || err?.status;
//       toast.error("Failed to add customer. Please try again.");
//       console.log(err, status);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Fetch designations
//   useEffect(() => {
//     const fetchDesignations = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/api/contact/read`, {
//           params: { status: 1 },
//         });
//         setDesignations(res.data);
//       } catch (err) {
//         console.error("Failed to fetch designations:", err);
//       }
//     };
//     fetchDesignations();
//   }, []);

//   // Fetch industries
//   useEffect(() => {
//     const fetchIndustry = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/api/Industries/industries`, {
//           params: { status: 1 },
//         });
//         setIndustries(res.data.data || res.data);
//       } catch (err) {
//         console.error("Failed to fetch industries:", err);
//         setIndustries([]);
//       }
//     };
//     fetchIndustry();
//   }, []);

//   useEffect(() => {
//     const fetchCompanyName = async () => {
//       try {
//         const res = await axios.get(
//           `${API_BASE}/api/organizations/organization-name`,
//           { params: { status: 1 } },
//         );
//         setCompanyname(res.data.data || res.data);
//       } catch (err) {
//         console.error("Failed to fetch company names:", err);
//         setCompanyname([]);
//       }
//     };
//     fetchCompanyName();
//   }, []);

//   return (
//     <div
//       className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
//         panelVisible ? "opacity-100" : "opacity-0"
//       }`}
//       onClick={handleClose}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className={`bg-gray-100 h-full w-full lg:max-w-[900px]  shadow-2xl overflow-y-auto pb-6 transform transition-transform duration-300 ease-in-out ${
//           panelVisible ? "translate-x-0" : "translate-x-full"
//         }`}
//       >
//         {/* ✅ Header — indigo-to-violet gradient icon box, matches Add Lead popup */}
//         <div className="bg-white w-full  p-3 mt-1 mb-2 flex items-center justify-between  ">
//           <div className="flex items-center gap-3 ">
//             <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
//               <UserPlus size={20} className="text-white" />
//             </span>
//             <div>
//               <h2 className="text-base sm:text-lg font-bold text-gray-900">
//                 Add Customer
//               </h2>
//               {/* <p className="text-xs text-gray-500 mt-0.5">
//                 Fill in the details to create a new customer
//               </p> */}
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={handleClose}
//             className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         <form
//           onSubmit={handleSubmit}
//           className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-6"
//         >
//           {/* Tab Header */}
//           <div className="flex mb-4 overflow-x-auto border-b border-gray-200">
//             <button
//               type="button"
//               onClick={() => setActiveTab("customer")}
//               className={`min-w-max flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm font-semibold transition-all ${
//                 activeTab === "customer"
//                   ? "text-indigo-600 border-b-2 border-indigo-600 -mb-px"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Personal Information
//             </button>
//             <button
//               type="button"
//               onClick={() => setActiveTab("contact")}
//               className={`min-w-max flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm font-semibold transition-all ${
//                 activeTab === "contact"
//                   ? "text-indigo-600 border-b-2 border-indigo-600 -mb-px"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Contact Details
//             </button>
//           </div>

//           {/* ── PERSONAL INFORMATION TAB ── */}
//           {activeTab === "customer" && (
//             <div className="w-full max-w-[900px] mx-auto bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5 max-h-none lg:max-h-[calc(100vh-220px)] overflow-y-visible lg:overflow-y-auto custom-scroll">
//               {/* Customer Type */}
//               <div>
//                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
//                   Customer Type
//                 </label>
//                 <div className="grid grid-cols-1 sm:flex gap-3 sm:gap-4">
//                   {["Individual", "Business"].map((type) => (
//                     <label
//                       key={type}
//                       className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${
//                         formData.customer_type === type
//                           ? "border-indigo-400 bg-indigo-50 text-indigo-600"
//                           : "border-gray-200 text-gray-600 hover:border-gray-300"
//                       }`}
//                     >
//                       <input
//                         type="radio"
//                         name="customer_type"
//                         value={type}
//                         checked={formData.customer_type === type}
//                         onChange={handleChange}
//                         className="hidden"
//                       />
//                       <div
//                         className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
//                           formData.customer_type === type
//                             ? "border-indigo-600"
//                             : "border-gray-300"
//                         }`}
//                       >
//                         {formData.customer_type === type && (
//                           <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
//                         )}
//                       </div>
//                       <span className="text-sm font-medium">{type}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {/* Row 1 — Company / Customer / Email */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Company Name <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
//                       <Building2 size={16} className="text-blue-500" />
//                     </span>
//                     <input
//                       name="company_name"
//                       value={formData.company_name}
//                       onChange={handleChange}
//                       placeholder="Enter Company name"
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Customer Name <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
//                       <User size={16} className="text-violet-500" />
//                     </span>
//                     <input
//                       type="text"
//                       name="customer_name"
//                       value={formData.customer_name}
//                       onChange={handleChange}
//                       placeholder="Enter customer name"
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Email <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
//                       <Mail size={16} className="text-cyan-500" />
//                     </span>
//                     <input
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleChange}
//                       placeholder="Enter email address"
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Mobile No.
//                   </label>
//                   <PhoneInput
//                     country={"in"}
//                     value={formData.mobile}
//                     onChange={handleMobileChange}
//                     inputStyle={{
//                       width: "100%",
//                       height: "42px",
//                       borderRadius: "0.5rem",
//                       border: "1px solid #e5e7eb",
//                       backgroundColor: "#fff",
//                       fontSize: "14px",
//                       color: "#374151",
//                     }}
//                     buttonStyle={{
//                       borderTopLeftRadius: "0.5rem",
//                       borderBottomLeftRadius: "0.5rem",
//                       border: "1px solid #e5e7eb",
//                       backgroundColor: "#f0fdf4",
//                     }}
//                   />
//                 </div>
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Industry <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
//                       <Briefcase size={16} className="text-emerald-500" />
//                     </span>
//                     <select
//                       name="industry"
//                       value={formData.industry}
//                       onChange={handleChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">Select Industry</option>
//                       {industries.map((item) => (
//                         <option key={item.id} value={item.id}>
//                           {item.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Address Details */}
//               <div>
//                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                   Address Details
//                 </label>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100">
//                   <div>
//                     <label className="block mb-1 text-sm font-medium text-gray-600">
//                       Address Type <span className="text-red-500">*</span>
//                     </label>
//                     <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                       <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
//                         <Tag size={16} className="text-amber-500" />
//                       </span>
//                       <select
//                         name="address_type"
//                         value={formData.address_type}
//                         onChange={handleChange}
//                         className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                       >
//                         <option value="">Select Address Type</option>
//                         <option>Billing</option>
//                         <option>Shipping</option>
//                         <option>Corporate</option>
//                         <option>Warehouse</option>
//                       </select>
//                     </div>
//                   </div>
//                   <div className="sm:col-span-2">
//                     <label className="block mb-1 text-sm font-medium text-gray-600">
//                       Address <span className="text-red-500">*</span>
//                     </label>
//                     <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                       <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
//                         <MapPin size={16} className="text-blue-500" />
//                       </span>
//                       <textarea
//                         name="address"
//                         value={formData.address}
//                         onChange={handleChange}
//                         placeholder="Enter address"
//                         rows="2"
//                         className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
//                       ></textarea>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* GST Details */}
//               <div>
//                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                   GST Details
//                 </label>
//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100">
//                   <div>
//                     <label className="block mb-1 text-sm font-medium text-gray-600">
//                       GST Type
//                     </label>
//                     <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                       <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
//                         <Receipt size={16} className="text-violet-500" />
//                       </span>
//                       <select
//                         name="gst_type"
//                         value={formData.gst_type}
//                         onChange={handleChange}
//                         className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                       >
//                         <option value="">Select GST Type</option>
//                         <option>Registered Regular</option>
//                         <option>Registered Composite</option>
//                         <option>Unregistered / Consumer</option>
//                       </select>
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block mb-1 text-sm font-medium text-gray-600">
//                       GST Number
//                     </label>
//                     <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                       <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
//                         <Hash size={16} className="text-cyan-500" />
//                       </span>
//                       <input
//                         type="text"
//                         name="gst_number"
//                         value={formData.gst_number}
//                         onChange={handleChange}
//                         placeholder="Enter GST number"
//                         className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                       />
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block mb-1 text-sm font-medium text-gray-600">
//                       State
//                     </label>
//                     <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                       <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
//                         <MapPin size={16} className="text-amber-500" />
//                       </span>
//                       <input
//                         type="text"
//                         name="gst_state"
//                         value={formData.gst_state}
//                         onChange={handleChange}
//                         placeholder="Enter State"
//                         className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Additional Details */}
//               <div>
//                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                   More Details
//                 </label>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block mb-1 text-sm font-medium text-gray-600">
//                       Website
//                     </label>
//                     <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                       <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
//                         <Globe size={16} className="text-cyan-500" />
//                       </span>
//                       <input
//                         type="text"
//                         name="website"
//                         ref={websiteRef}
//                         value={formData.website}
//                         onFocus={handleFocus}
//                         onBlur={handleBlur}
//                         onChange={handleChange}
//                         className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                       />
//                     </div>
//                     {error && (
//                       <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
//                         <i className="bi bi-exclamation-circle"></i> {error}
//                       </p>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block mb-1 text-sm font-medium text-gray-600">
//                       Remarks
//                     </label>
//                     <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                       <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
//                         <FileText size={16} className="text-blue-500" />
//                       </span>
//                       <textarea
//                         name="remarks"
//                         value={formData.remarks}
//                         onChange={handleChange}
//                         placeholder="Enter remarks"
//                         rows="3"
//                         className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
//                       ></textarea>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Buttons */}
//               <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
//                 <button
//                   type="button"
//                   disabled
//                   className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
//                 >
//                   Previous
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setActiveTab("contact")}
//                   className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
//                 >
//                   Next
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleClose}
//                   className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2 bg-white"
//                 >
//                   <X size={15} /> Cancel
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ── CONTACT DETAILS TAB ── */}
//           {activeTab === "contact" && (
//             <div className="w-full max-w-[900px] mx-auto bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5 max-h-none lg:max-h-[calc(100vh-220px)] overflow-y-visible lg:overflow-y-auto custom-scroll">
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Contact Person <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
//                       <UserRound size={16} className="text-amber-500" />
//                     </span>
//                     <input
//                       type="text"
//                       name="contact_person"
//                       value={formData.contact_person}
//                       onChange={handleChange}
//                       placeholder="Enter contact person name"
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Contact Number <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
//                       <Phone size={16} className="text-green-500" />
//                     </span>
//                     <input
//                       type="text"
//                       name="contact_number"
//                       value={formData.contact_number}
//                       onChange={handleChange}
//                       placeholder="Enter contact number"
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Email <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
//                       <Mail size={16} className="text-cyan-500" />
//                     </span>
//                     <input
//                       type="email"
//                       name="contact_email"
//                       value={formData.contact_email}
//                       onChange={handleChange}
//                       placeholder="Enter email"
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Contact Designation <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
//                       <Briefcase size={16} className="text-violet-500" />
//                     </span>
//                     <select
//                       name="contact_designation"
//                       value={formData.contact_designation}
//                       onChange={handleChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">Select Contact Designation</option>
//                       {designations.map((item) => (
//                         <option key={item.id} value={item.id}>
//                           {item.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Buttons */}
//               <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => setActiveTab("customer")}
//                   className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
//                 >
//                   Previous
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className={`w-full sm:w-auto px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${
//                     isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
//                   }`}
//                 >
//                   {isSubmitting ? (
//                     <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
//                       <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
//                       <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//                     </svg>
//                   ) : (
//                     <>
//                       <Save size={15} /> Save
//                     </>
//                   )}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleClose}
//                   className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2 bg-white"
//                 >
//                   <X size={15} /> Cancel
//                 </button>
//               </div>
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// }

// // =======================================================================
// // ✅ VIEW CUSTOMER POPUP — same right-side slide-in / slide-out pattern as
// // AddCustomerModal above. Rendered conditionally inside CustomerList below.
// // ✅ Theme: indigo-to-violet gradient header, matches the Add Lead popup.
// // =======================================================================
// function ViewCustomerModal({ data, onClose }) {
//   // Slide in / out
//   const [panelVisible, setPanelVisible] = useState(false);

//   useEffect(() => {
//     const t = setTimeout(() => setPanelVisible(true), 10);
//     return () => clearTimeout(t);
//   }, []);

//   const handleClose = () => {
//     setPanelVisible(false);
//     setTimeout(() => {
//       onClose?.();
//     }, 300);
//   };

//   const details = [
//     { icon: Building2, label: "Company", value: data.company_name, color: "blue" },
//     { icon: User, label: "Customer Name", value: data.customer_name, color: "violet" },
//     { icon: Mail, label: "Email", value: data.email, color: "cyan" },
//     { icon: Phone, label: "Mobile", value: data.mobile, color: "green" },
//     { icon: Tag, label: "Customer Type", value: data.customer_type, color: "amber" },
//     { icon: Globe, label: "Website", value: data.website, color: "cyan" },
//     { icon: Briefcase, label: "Industry", value: data.industry_name, color: "emerald" },
//   ];

//   const colorMap = {
//     blue: { bg: "bg-blue-50", text: "text-blue-500" },
//     violet: { bg: "bg-violet-50", text: "text-violet-500" },
//     cyan: { bg: "bg-cyan-50", text: "text-cyan-500" },
//     green: { bg: "bg-green-50", text: "text-green-500" },
//     amber: { bg: "bg-amber-50", text: "text-amber-500" },
//     emerald: { bg: "bg-emerald-50", text: "text-emerald-500" },
//   };

//   return (
//     <div
//       className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
//         panelVisible ? "opacity-100" : "opacity-0"
//       }`}
//       onClick={handleClose}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className={`bg-gray-100 h-full w-full sm:max-w-[520px] shadow-2xl overflow-y-auto pb-6 transform transition-transform duration-300 ease-in-out ${
//           panelVisible ? "translate-x-0" : "translate-x-full"
//         }`}
//       >
//         {/* Header — indigo-to-violet gradient, matches Add Customer / Add Lead */}
//         <div className="bg-white w-full shadow-lg p-4 mt-1 mb-5 flex items-center justify-between">
//           <div className="flex items-center gap-3 min-w-0">
//             <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
//               <Eye size={20} className="text-white" />
//             </span>
//             <div className="min-w-0">
//               <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
//                 {data.customer_name || "Customer Details"}
//               </h2>
//               <p className="text-xs text-gray-500 mt-0.5">
//                 {data.customer_type || "—"}
//               </p>
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={handleClose}
//             className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600  transition-all shrink-0"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="px-4 sm:px-5">
//           <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6">
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {details.map(({ icon: Icon, label, value, color }) => {
//                 const c = colorMap[color];
//                 return (
//                   <div
//                     key={label}
//                     className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3"
//                   >
//                     <span className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
//                       <Icon size={16} className={c.text} />
//                     </span>
//                     <div className="min-w-0">
//                       <p className="text-xs text-gray-400 uppercase tracking-wide">
//                         {label}
//                       </p>
//                       <p className="text-sm font-semibold text-gray-700 break-words">
//                         {value || "—"}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             <div className="flex justify-end pt-5">
//               <button
//                 type="button"
//                 onClick={handleClose}
//                 className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
//               >
//                 <X size={15} /> Close
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // =======================================================================
// // ✅ DELETE CUSTOMER POPUP — animated center dialog (fade + scale-in on
// // mount, fade + scale-out before the confirm/cancel action actually fires).
// // ✅ Theme: red/rose gradient icon box (keeps the destructive "danger"
// // meaning), rounded-full pill buttons — matches the reference screenshot.
// // =======================================================================
// function DeleteCustomerModal({ name, onCancel, onConfirm }) {
//   const [visible, setVisible] = useState(false);

//   useEffect(() => {
//     const t = setTimeout(() => setVisible(true), 10);
//     return () => clearTimeout(t);
//   }, []);

//   // Plays the fade+scale-out animation first, then fires the real action
//   // (cancel or confirm) so the dialog is always fully closed before the
//   // parent state actually unmounts it.
//   const closeWith = (action) => {
//     setVisible(false);
//     setTimeout(() => {
//       action?.();
//     }, 200);
//   };

//   return (
//   <div
//   className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 px-4 transition-opacity duration-200 ease-out ${
//     visible ? "opacity-100" : "opacity-0"
//   }`}
//   onClick={() => closeWith(onCancel)}
// >
//   <div
//     onClick={(e) => e.stopPropagation()}
//     className={`bg-white w-full h-[375px] max-w-md rounded-sm shadow-2xl overflow-hidden transform transition-all duration-200 ease-out ${
//       visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
//     }`}
//   >
//     {/* Header */}
//       <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
//       <div className="flex items-center gap-3">
//           <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
//           <Trash2 size={16} className="text-red-600" strokeWidth={2} />
//         </div>
//           <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
//           Delete Customer
//         </h2>
//       </div>
//       <button
//         onClick={() => closeWith(onCancel)}
//         className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
//       >
//         <X size={20} />
//       </button>
//     </div>

//     {/* Body */}
//       <div className="px-6 pt-4 pb-4  text-center">
//       {/* Icon */}
//      <div className="w-24 h-24 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-5">
//               <Trash2 className="w-10 h-10 text-red-600" strokeWidth={1.8} />
//             </div>

//       {/* Name */}
//         <h3 className="text-xl font-extrabold text-gray-900 tracking-wide uppercase mb-2">
//         {name?.toUpperCase() || "THIS CUSTOMER"}
//       </h3>

//       {/* Divider */}
//         <div className="w-10 h-[3px] bg-red-500 rounded-full mx-auto mb-4"></div>

//       {/* Message */}
//       <p className="text-sm text-gray-500 leading-relaxed">
//         This action cannot be undone.
//         <br />
//         Are you sure you want to delete this customer?
//       </p>
//     </div>

//     {/* Footer Buttons */}
//       <div className="flex gap-3.5 px-7 pb-0">
//       <button
//         onClick={() => closeWith(onCancel)}
//           className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//       >
//         <X size={16} strokeWidth={2.2} /> Cancel
//       </button>
//       <button
//         onClick={() => closeWith(onConfirm)}
//           className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold text-white bg-red-600  shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
//       >
//         <Trash2 size={16} strokeWidth={2.2} /> Delete Customer
//       </button>
//     </div>
//   </div>
// </div>
//   );
// }

// // =======================================================================
// // ✅ MAIN CUSTOMER LIST PAGE
// // =======================================================================
// export default function CustomerList() {
//   const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
//   const router = useRouter();

//   // useAuth(["Admin", "Super Admin"]);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   const [search, setSearch] = useState("");
//   // BUG FIX #1: was "setDesignations" (undefined variable), changed to setIndustries
//   const [industries, setIndustries] = useState([]);

//   const [viewModal, setViewModal] = useState({ open: false, data: null });
//   const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });

//   // ✅ NEW: controls the Add Customer slide-in/out popup
//   const [showAddCustomer, setShowAddCustomer] = useState(false);

//   const [showMobileFilters, setShowMobileFilters] = useState(false);
//   const [filters, setFilters] = useState({
//     customer_name: "",
//     // BUG FIX #4: renamed contact_number to mobile to match backend param
//     mobile: "",
//     email: "",
//     industry: "",
//   });

//   const [data, setData] = useState([]);
//   const [sortConfig, setSortConfig] = useState({ key: "id", direction: "ASC" });


//   // Store offset for each scrollable column
//   const [columnOffsets, setColumnOffsets] = useState({
//     company_name: 0,
//     customer_name: 0,
//     email: 0,
//     website: 0,
//     industry: 0,
//   });

//   // Fetch table data
//   const fetchCustomers = async () => {
//     try {
//       const query = new URLSearchParams({
//         // Remove server-side pagination to allow client-side slicing
//         // page,
//         // limit: 10,
//         search,
//         sortBy: sortConfig.key,
//         order: sortConfig.direction,
//         ...filters,
//       }).toString();

//       const res = await axios.get(`${API_BASE}/api/customers/get-customers?${query}`);
//       const result = res.data;

//       if (result.success) {
//         setData(result.data);
//       } else {
//         setData([]);
//       }
//     } catch (error) {
//       console.error("Error fetching customers:", error);
//     }
//   };


//   // Fetching Active Industries
//   useEffect(() => {
//     const fetchIndustry = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/api/Industries/industries`, {
//           params: { status: 1 },
//         });
//         // BUG FIX #1: was calling setDesignations (undefined), now correctly calls setIndustries
//         setIndustries(res.data.data || res.data);
//       } catch (err) {
//         console.error("Failed to fetch industries:", err);
//         setIndustries([]);
//       }
//     };
//     fetchIndustry();
//   }, []);

//   useEffect(() => {
//     fetchCustomers();
//   }, [sortConfig]);

//   useEffect(() => {
//     const delay = setTimeout(() => {
//       fetchCustomers();
//     }, 300);
//     return () => clearTimeout(delay);
//   }, [search, filters]);

//   // Reset page when filters, search, or items per page changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [filters, search, itemsPerPage]);


//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   // Standardized Pagination Calculations
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(data.length / itemsPerPage);

//   const getSlidingPages = () => {
//     const visibleCount = 5;
//     if (totalPages <= visibleCount) {
//       return Array.from({ length: totalPages }, (_, i) => i + 1);
//     }
//     let start = currentPage - Math.floor(visibleCount / 2);
//     let end = currentPage + Math.floor(visibleCount / 2);
//     if (start < 1) {
//       start = 1;
//       end = visibleCount;
//     }
//     if (end > totalPages) {
//       end = totalPages;
//       start = totalPages - visibleCount + 1;
//     }
//     return Array.from({ length: end - start + 1 }, (_, i) => start + i);
//   };


//   const handleDelete = async (id) => {
//     try {
//       const token = localStorage.getItem("token");

//       const res = await axios.delete(`${API_BASE}/api/customers/${id}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       console.log("DELETE SUCCESS:", res.data);

//       toast.success("Customer deleted successfully");
//       fetchCustomers();
//     } catch (error) {
//       console.error("FULL DELETE ERROR:", error);

//       if (error.response) {
//         console.error("Server Response:", error.response.data);
//       }

//       toast.error("Failed to delete customer");
//     }
//   };

//   return (
//     <>
//       <Header />
//       <div className="bg-gray-100">
//         {/*breadcrumb */}
//         <div className="bg-white w-full rounded-sm shadow-lg p-3 mt-1 mb-5">
//           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
//             <p className="hidden sm:flex items-center flex-wrap">
//               <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
//                 <i className="bi bi-house"></i>
//               </Link>
//               <i className="bi bi-chevron-right text-[10px]"></i>
//               <Link href="/customer-list" className="mx-3 text-md text-gray-700 hover:text-indigo-600 ">
//                 Customer List
//               </Link>
//             </p>
//             <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
//               <input
//                 type="text"
//                 placeholder="🔍 Search..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="border w-full sm:w-64 border-gray-300 text-gray-700 placeholder-gray-400 p-2 sm:p-1 px-3 rounded-sm  outline-none  transition-all text-sm  focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
//               />
//               {/* ✅ CHANGED: was <Link href="/customer">, now opens the slide-in popup defined above in this same file */}
//               <button
//                 type="button"
//                 onClick={() => setShowAddCustomer(true)}
//                 className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-4 py-2 rounded-sm w-full sm:w-auto text-center font-bold text-sm cursor-pointer"
//               >
//                 + ADD CUSTOMER
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="mx-4 mb-2 md:hidden mt-3 relative z-40">
//           <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all">
//             <span className="flex items-center gap-2"><i className="bi bi-funnel"></i> Filters</span>
//             <i className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}></i>
//           </button>
//         </div>

//         <div
//           className={`
//             ${showMobileFilters ? "mx-4 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-xl" : "hidden"}
//             md:mx-4 md:mb-2 md:flex md:flex-wrap md:gap-2 md:bg-transparent md:p-0 md:shadow-none md:border-none
//           `}
//         >
//           <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-56 md:mx-2 text-sm">
//                       <User size={16} className="text-violet-500" />
//             <input
//               type="text"
//               name="customer_name"
//               value={filters.customer_name}
//               onChange={handleChange}
//               placeholder="Enter Name"
//               className="py-2 w-full text-sm outline-none bg-transparent"
//             />
//           </div>

//           <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-56 md:mx-2 text-sm">
//                       <Phone size={16} className="text-green-500" />
//             <input
//               type="text"
//               name="mobile"
//               placeholder="Contact No."
//               className="py-2 w-full text-sm outline-none bg-transparent"
//               value={filters.mobile || ""}
//               onChange={(e) => {
//                 const val = e.target.value;
//                 if (!/^\d*$/.test(val)) return;
//                 if (val.length === 1 && !["6", "7", "8", "9"].includes(val)) return;
//                 if (val.length > 10) return;
//                 setFilters((p) => ({ ...p, mobile: val }));
//               }}
//               maxLength={10}
//             />
//           </div>

//           <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-56 md:mx-2 text-sm">
// <Mail size={16} className="text-red-500" />            <input
//               type="text"
//               name="email"
//               value={filters.email}
//               onChange={handleChange}
//               placeholder="Enter Email"
//               className="py-2 w-full text-sm outline-none bg-transparent"
//             />
//           </div>

//           <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-56 md:mx-2 text-sm">
// <Building2 size={16} className="text-blue-500" />
//             <select
//               name="industry"
//               value={filters.industry}
//               onChange={handleChange}
//               className="py-2 w-full text-gray-500 text-sm outline-none bg-transparent"
//             >
//               <option value="">Industry</option>
//               {industries.map((item) => (
//                 <option key={item.id} value={item.id}>
//                   {item.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="flex gap-2 sm:col-span-2 md:col-span-auto">
//             <button
//               type="button"
//               onClick={() => {
//                 setFilters({
//                   customer_name: "",
//                   mobile: "",
//                   email: "",
//                   industry: "",
//                 });
//                 setShowMobileFilters(false);
//               }}
//               className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-5 py-2 bg-indigo-100 text-indigo-600  text-sm text-center font-semibold transition-colors"
//             >
//               <i className="bi bi-arrow-counterclockwise"></i> Clear Filter
//             </button>
//             <button
//               type="button"
//               onClick={() => setShowMobileFilters(false)}
//               className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold"
//             >
//               Apply
//             </button>
//           </div>
//         </div>

//         {/* Table */}
//       <form className="p-2 w-8xl mx-3">
//           <div className="bg-white shadow rounded-sm p-6">
//             <div className="overflow-x-auto overflow-y-scroll max-h-[380px] custom-scroll" style={{ overflowX: "scroll" }}>
//               <table className="w-full text-sm border border-gray-200 text-left whitespace-nowrap">
//                 <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
//                   <tr>
//                     <th className="px-3 py-3 text-center">#</th>
//                     <th className="px-4 py-3">
//                       Company Name <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
//                     </th>
//                     <th className="px-4 py-3">
//                       Customer Name <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
//                     </th>
//                     <th className="px-4 py-3">Email</th>
//                     <th className="px-4 py-3">
//                       Mobile No. <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
//                     </th>
//                     <th className="px-4 py-3">Customer Type</th>
//                     <th className="px-4 py-3">Website</th>
//                     <th className="px-4 py-3">Industry</th>
//                     <th className="px-4 py-3">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {currentData.length > 0 ? (
//                     currentData.map((row, index) => (
//                       <tr key={index} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
//                         <td className="px-2 py-3">{indexOfFirstItem + index + 1}</td>
//                         <td className="px-2 py-3 font-semibold text-slate-800">{row.company_name}</td>
//                         <td className="px-2 py-3 text-blue-500 font-medium">{row.customer_name}</td>
//                         <td className="px-2 py-3 text-gray-500">{row.email}</td>
//                         <td className="px-2 py-3 font-semibold text-slate-800">{row.mobile}</td>
//                         <td className="px-2 py-3 text-gray-500">{row.customer_type}</td>
//                         <td className="px-2 py-3 text-gray-500">{row.website}</td>
//                         <td className="px-2 py-3 text-gray-500">{row.industry_name}</td>
//                         <td className="py-2 px-3">
//                           <div className="flex items-center gap-2">
//                             <button
//                               type="button"
//                               onClick={() => setViewModal({ open: true, data: row })}
//                               className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
//                             >
//                               <i className="bi bi-eye text-lg"></i>
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 localStorage.setItem("customer_edit_id", JSON.stringify(row.id));
//                                 router.push("/edit-customer");
//                               }}
//                               className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition-all"
//                             >
//                               <i className="bi bi-pencil-square text-sm"></i>
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => setDeleteModal({ open: true, id: row.id, name: row.customer_name })}
//                               className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 cursor-pointer transition-all"
//                             >
//                               <i className="bi bi-trash3 text-sm"></i>
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan="9" className="text-center py-4 text-gray-500">
//                         No data found
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
//             <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg mt-4">
//               {/* Left side: Showing X to Y of Z entries */}
//               <div className="text-sm text-slate-600 font-semibold">
//                 Showing {currentData.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
//                 {indexOfFirstItem + currentData.length} entries
//               </div>

//               {/* Center: Navigation buttons (only if totalPages > 1) */}
//               {totalPages > 1 && (
//                 <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
//                   {/* Previous Button */}
//                   <button
//                     type="button"
//                     onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                     disabled={currentPage === 1}
//                     className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
//                   >
//                     <i className="bi bi-chevron-left text-sm"></i>
//                   </button>

//                   {/* Page Buttons */}
//                   <div className="flex items-center gap-1.5">
//                     {getSlidingPages().map((page) => (
//                       <button
//                         type="button"
//                         key={page}
//                         onClick={() => setCurrentPage(page)}
//                         className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page
//                             ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
//                             : "border border-slate-200 text-slate-600 hover:bg-slate-50"
//                           }`}
//                       >
//                         {page}
//                       </button>
//                     ))}
//                   </div>

//                   {/* Next Button */}
//                   <button
//                     type="button"
//                     onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//                     disabled={currentPage === totalPages}
//                     className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
//                   >
//                     <i className="bi bi-chevron-right text-sm"></i>
//                   </button>
//                 </div>
//               )}

//               {/* Right side: Rows per page selector */}
//               <div className="flex items-center gap-3">
//                 <span className="text-sm text-slate-500 font-medium">
//                   Rows per page:
//                 </span>
//                 <select
//                   value={itemsPerPage}
//                   onChange={(e) => {
//                     setItemsPerPage(Number(e.target.value));
//                     setCurrentPage(1);
//                   }}
//                   className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm text-indigo-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
//                 >
//                   {[10, 20, 100, 200].map((size) => (
//                     <option key={size} value={size}>
//                       {size}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//           </div>
//         </form>
//       </div>

//       {/* ✅ Delete Modal — now animated (fade + scale-in/out) and uses
//           rounded-full pill buttons matching the reference design */}
//       {deleteModal.open && (
//         <DeleteCustomerModal
//           name={deleteModal.name}
//           onCancel={() => setDeleteModal({ open: false, id: null, name: "" })}
//           onConfirm={() => {
//             handleDelete(deleteModal.id);
//             setDeleteModal({ open: false, id: null, name: "" });
//           }}
//         />
//       )}

//       {/* ✅ View Customer popup — slides in/out from the right, indigo-violet theme */}
//       {viewModal.open && viewModal.data && (
//         <ViewCustomerModal
//           data={viewModal.data}
//           onClose={() => setViewModal({ open: false, data: null })}
//         />
//       )}

//       {/* ✅ Add Customer popup — component defined at the top of this same file */}
//       {showAddCustomer && (
//         <AddCustomerModal
//           onClose={() => setShowAddCustomer(false)}
//           onSuccess={fetchCustomers}
//         />
//       )}
//     </>
//   );
// }


"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Header from "../components/header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "redaxios";
import useAuth from "../components/useAuth";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import {
  UserPlus, X, Save, Eye, Building2, User, Mail, Phone, Tag, Globe,
  Briefcase, FileText, UserRound, Trash2, MapPin, Receipt, Hash,
  UserCog, Plus, Pencil,
} from "lucide-react";

// =======================================================================
// ✅ ADD CUSTOMER POPUP — defined right here in the same file, no separate
// component file needed. Rendered conditionally inside CustomerList below.
// Slide-in on mount, slide-out (300ms) before onClose fires.
// ✅ Theme: indigo-to-violet gradient header + colored field icons,
// matching the Add Lead popup reference.
// =======================================================================
function AddCustomerModal({ onClose, onSuccess }) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const API_base = `${API_BASE}/api/customers`;

  const [activeTab, setActiveTab] = useState("customer");
  const [designations, setDesignations] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [companyname, setCompanyname] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Slide in / out
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPanelVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setPanelVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  // Website Validation >>>
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

  const resetForm = () => {
    setFormData({
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
    setActiveTab("customer");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("User not logged in. Please login first");
        setIsSubmitting(false);
        return;
      }

      const dataToSend = {
        ...formData,
        website: formData.website === "https://" ? "" : formData.website,
      };

      await axios.post(`${API_base}/add`, dataToSend, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Customer added successfully");

      resetForm();
      onSuccess?.(); // refresh customer list in parent
      handleClose(); // slide out, then unmount
    } catch (err) {
      const status = err?.response?.status || err?.status;
      toast.error("Failed to add customer. Please try again.");
      console.log(err, status);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
        panelVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-gray-100 h-full w-full lg:max-w-[900px]  shadow-2xl overflow-y-auto pb-6 transform transition-transform duration-300 ease-in-out ${
          panelVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ✅ Header — indigo-to-violet gradient icon box, matches Add Lead popup */}
        <div className="bg-white w-full  p-3 mt-1 mb-2 flex items-center justify-between  ">
          <div className="flex items-center gap-3 ">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <UserPlus size={20} className="text-white" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Add Customer
              </h2>
              {/* <p className="text-xs text-gray-500 mt-0.5">
                Fill in the details to create a new customer
              </p> */}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-6"
        >
          {/* Tab Header */}
          <div className="flex mb-4 overflow-x-auto border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={`min-w-max flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "customer"
                  ? "text-indigo-600 border-b-2 border-indigo-600 -mb-px"
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
                  ? "text-indigo-600 border-b-2 border-indigo-600 -mb-px"
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
                          ? "border-indigo-400 bg-indigo-50 text-indigo-600"
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
                            ? "border-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.customer_type === type && (
                          <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Row 1 — Company / Customer / Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                      <Building2 size={16} className="text-blue-500" />
                    </span>
                    <input
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Enter Company name"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <User size={16} className="text-violet-500" />
                    </span>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      placeholder="Enter customer name"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                      <Mail size={16} className="text-cyan-500" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
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
                      backgroundColor: "#fff",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                    buttonStyle={{
                      borderTopLeftRadius: "0.5rem",
                      borderBottomLeftRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f0fdf4",
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                      <Briefcase size={16} className="text-emerald-500" />
                    </span>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
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
              </div>

              {/* Address Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Address Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Address Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <Tag size={16} className="text-amber-500" />
                      </span>
                      <select
                        name="address_type"
                        value={formData.address_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select Address Type</option>
                        <option>Billing</option>
                        <option>Shipping</option>
                        <option>Corporate</option>
                        <option>Warehouse</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                        <MapPin size={16} className="text-blue-500" />
                      </span>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter address"
                        rows="2"
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
                      ></textarea>
                    </div>
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
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      GST Type
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                        <Receipt size={16} className="text-violet-500" />
                      </span>
                      <select
                        name="gst_type"
                        value={formData.gst_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                      >
                        <option value="">Select GST Type</option>
                        <option>Registered Regular</option>
                        <option>Registered Composite</option>
                        <option>Unregistered / Consumer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      GST Number
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Hash size={16} className="text-cyan-500" />
                      </span>
                      <input
                        type="text"
                        name="gst_number"
                        value={formData.gst_number}
                        onChange={handleChange}
                        placeholder="Enter GST number"
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      State
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                        <MapPin size={16} className="text-amber-500" />
                      </span>
                      <input
                        type="text"
                        name="gst_state"
                        value={formData.gst_state}
                        onChange={handleChange}
                        placeholder="Enter State"
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
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
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Website
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                        <Globe size={16} className="text-cyan-500" />
                      </span>
                      <input
                        type="text"
                        name="website"
                        ref={websiteRef}
                        value={formData.website}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      />
                    </div>
                    {error && (
                      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                        <i className="bi bi-exclamation-circle"></i> {error}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">
                      Remarks
                    </label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                      <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                        <FileText size={16} className="text-blue-500" />
                      </span>
                      <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        placeholder="Enter remarks"
                        rows="3"
                        className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2 bg-white"
                >
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── CONTACT DETAILS TAB ── */}
          {activeTab === "contact" && (
            <div className="w-full max-w-[900px] mx-auto bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5 max-h-none lg:max-h-[calc(100vh-220px)] overflow-y-visible lg:overflow-y-auto custom-scroll">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                      <UserRound size={16} className="text-amber-500" />
                    </span>
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person}
                      onChange={handleChange}
                      placeholder="Enter contact person name"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                      <Phone size={16} className="text-green-500" />
                    </span>
                    <input
                      type="text"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleChange}
                      placeholder="Enter contact number"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                      <Mail size={16} className="text-cyan-500" />
                    </span>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleChange}
                      placeholder="Enter email"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Contact Designation <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <Briefcase size={16} className="text-violet-500" />
                    </span>
                    <select
                      name="contact_designation"
                      value={formData.contact_designation}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
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
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("customer")}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {isSubmitting ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                      <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <>
                      <Save size={15} /> Save
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-2 bg-white"
                >
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// =======================================================================
// ✅ NEW: EDIT CUSTOMER POPUP — aakhu edit-customer page nu logic ahi
// inline component ma laavyu che (separate route ni jarur nathi).
// Same right-side slide-in / slide-out pattern as AddCustomerModal.
// ✅ Theme: indigo-to-violet gradient header + colored field icons,
// matching the Add Customer popup reference image.
// Tabs: Update Customer | Address Details | Contact Details
// ✅ UPDATED: nested Address Modal ane Contact Modal have pan right-side
// slide-in/slide-out drawers che (center popup ni jagya e).
// =======================================================================
function EditCustomerModal({ customerId, onClose, onSuccess }) {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [activeTab, setActiveTab] = useState("update-customer");
  const [designations, setDesignations] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [companyname, setCompanyname] = useState([]);
  const [showaddressModal, setShowAddressModal] = useState(false);
  const [showcontactsModal, setShowContactsModal] = useState(false);
  // ✅ NEW: slide visibility flags — right-side slide-in/out for nested drawers
  const [addressPanelVisible, setAddressPanelVisible] = useState(false);
  const [contactPanelVisible, setContactPanelVisible] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [gstDetails, setGstDetails] = useState([]);

  // Slide in / out — same pattern as AddCustomerModal
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPanelVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setPanelVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  // ✅ NEW: Address drawer slide-in trigger
  useEffect(() => {
    if (showaddressModal) {
      const t = setTimeout(() => setAddressPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showaddressModal]);

  // ✅ NEW: Contact drawer slide-in trigger
  useEffect(() => {
    if (showcontactsModal) {
      const t = setTimeout(() => setContactPanelVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [showcontactsModal]);

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
      // ✅ CHANGED: router.push ni jagya e — list refresh + drawer slide-out
      onSuccess?.();
      handleClose();
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

      // ✅ CHANGED: animated slide-out close instead of instant state reset
      closeAddressModal();
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

  // ✅ CHANGED: now animates the drawer out (300ms) before resetting state
  const closeAddressModal = () => {
    setAddressPanelVisible(false);
    setTimeout(() => {
      setShowAddressModal(false);
      setEditAddressId(null);
      setAddressForm({ address_type: "", address: "" });
    }, 300);
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

      // ✅ CHANGED: animated slide-out close instead of instant state reset
      closeContactModal();
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

  // ✅ CHANGED: now animates the drawer out (300ms) before resetting state
  const closeContactModal = () => {
    setContactPanelVisible(false);
    setTimeout(() => {
      setShowContactsModal(false);
      setEditContactId(null);
      setContactForm({
        contact_person: "",
        contact_number: "",
        email: "",
        contact_designation: "",
      });
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
        panelVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-gray-100 h-full w-full lg:max-w-[900px] shadow-2xl overflow-y-auto pb-6 transform transition-transform duration-300 ease-in-out ${
          panelVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ✅ Header — indigo-to-violet gradient icon box, matches Add Customer popup */}
        <div className="bg-white w-full p-3 mt-1 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <UserCog size={20} className="text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                Update Customer
              </h2>
              {formData.customer_name && (
                <p className="text-xs text-indigo-600 font-semibold mt-0.5 truncate">
                  {formData.customer_name}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
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
                className={`min-w-max flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px hover:cursor-pointer ${
                  activeTab === tab.key
                    ? "text-indigo-600 border-indigo-600"
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
            <form className="bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6 space-y-5 max-h-none lg:max-h-[calc(100vh-220px)] overflow-y-visible lg:overflow-y-auto custom-scroll">
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
                          ? "border-indigo-400 bg-indigo-50 text-indigo-600"
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
                            ? "border-indigo-600"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.customer_type === type && (
                          <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
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
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Company Name
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                      <Building2 size={16} className="text-blue-500" />
                    </span>
                    <input
                      name="company_name"
                      className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                      placeholder="Enter Company Name"
                      value={formData.company_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Customer Name
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <User size={16} className="text-violet-500" />
                    </span>
                    <input
                      type="text"
                      name="customer_name"
                      placeholder="Enter customer name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
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
                      backgroundColor: "#fff",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                    buttonStyle={{
                      borderTopLeftRadius: "0.5rem",
                      borderBottomLeftRadius: "0.5rem",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f0fdf4",
                    }}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                      <Mail size={16} className="text-cyan-500" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                      <Briefcase size={16} className="text-emerald-500" />
                    </span>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
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
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Website
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                      <Globe size={16} className="text-cyan-500" />
                    </span>
                    <input
                      type="text"
                      name="website"
                      ref={websiteRef}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <i className="bi bi-exclamation-circle"></i> {error}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Remarks
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                      <FileText size={16} className="text-blue-500" />
                    </span>
                    <textarea
                      name="remarks"
                      placeholder="Enter remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
                    ></textarea>
                  </div>
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
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:cursor-pointer transition-colors border border-indigo-200 hover:border-indigo-300 bg-indigo-50 px-3 py-1.5 rounded-lg"
                    >
                      <Plus size={13} /> Add GST
                    </button>
                  )}
                </div>

                {gstDetails.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Receipt size={30} className="mx-auto mb-2 text-gray-300" />
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
                            <label className="block mb-1 text-sm font-medium text-gray-600">
                              GST Type
                            </label>
                          )}
                          <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                              <Receipt size={16} className="text-violet-500" />
                            </span>
                            <select
                              className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
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
                        </div>
                        <div className="col-span-4">
                          {index === 0 && (
                            <label className="block mb-1 text-sm font-medium text-gray-600">
                              GST Number
                            </label>
                          )}
                          <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                              <Hash size={16} className="text-cyan-500" />
                            </span>
                            <input
                              type="text"
                              className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                              placeholder="Enter GST number"
                              value={gst.gst_number}
                              onChange={(e) =>
                                updateGst(gst.id, "gst_number", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="col-span-3">
                          {index === 0 && (
                            <label className="block mb-1 text-sm font-medium text-gray-600">
                              State
                            </label>
                          )}
                          <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                            <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                              <MapPin size={16} className="text-amber-500" />
                            </span>
                            <input
                              type="text"
                              className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                              placeholder="Enter state"
                              value={gst.gst_state}
                              onChange={(e) =>
                                updateGst(gst.id, "gst_state", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {gstDetails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeGst(gst.id)}
                              className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 hover:cursor-pointer transition-all"
                            >
                              <Trash2 size={15} />
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
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:cursor-pointer transition-all flex items-center gap-2 bg-white"
                >
                  <X size={15} /> Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    await handleSubmit();
                    await saveGstDetails();
                  }}
                  className={`w-44 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm
                    ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:cursor-pointer"}`}
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
                      <Save size={15} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── ADDRESS DETAILS TAB ── */}
          {activeTab === "address-details" && (
            <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <MapPin size={16} className="text-indigo-500" />
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
                  className="flex items-center gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <Plus size={15} /> Add Address
                </button>
              </div>

              <div className="overflow-y-auto max-h-[300px] custom-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-50/60 border-b border-gray-100">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                        #
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                        Type
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
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
                          <MapPin size={30} className="mx-auto mb-2 text-gray-300" />
                          No addresses added yet
                        </td>
                      </tr>
                    ) : (
                      addresses.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-400 text-xs font-medium">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-xs font-semibold">
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
                                className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 hover:cursor-pointer transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAddress(item.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 hover:cursor-pointer transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ✅ Address Modal — Add & Edit both work here (right-side slide-in/out) */}
              {showaddressModal && (
                <div
                  className={`fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
                    addressPanelVisible ? "opacity-100" : "opacity-0"
                  }`}
                  onClick={closeAddressModal}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`bg-white h-full w-full max-w-[95vw] sm:max-w-[440px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
                      addressPanelVisible ? "translate-x-0" : "translate-x-full"
                    }`}
                  >
                    <div className="bg-white">
                      <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                            <MapPin size={17} className="text-white" />
                          </span>
                          <h3 className="text-gray-900 font-bold text-sm">
                            {editAddressId ? "Edit Address" : "Add New Address"}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={closeAddressModal}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 hover:cursor-pointer transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="h-1 w-full bg-gray-100">
                        <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-600"></div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">
                          Address Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                          <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                            <Tag size={16} className="text-amber-500" />
                          </span>
                          <select
                            name="address_type"
                            value={addressForm.address_type}
                            onChange={handleAddressChange}
                            className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                          >
                            <option value="">Select Address Type</option>
                            <option>Billing</option>
                            <option>Shipping</option>
                            <option>Corporate</option>
                            <option>Warehouse</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">
                          Address <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                          <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                            <MapPin size={16} className="text-blue-500" />
                          </span>
                          <textarea
                            name="address"
                            value={addressForm.address}
                            onChange={handleAddressChange}
                            rows="4"
                            placeholder="Enter full address"
                            className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={closeAddressModal}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 hover:cursor-pointer transition-all flex items-center gap-1.5 bg-white"
                      >
                        <X size={14} /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveAddress}
                        disabled={isSavingAddress}
                        className={`w-40 flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl transition-all shadow-sm
                          ${isSavingAddress ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:cursor-pointer"}`}
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
            <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Phone size={16} className="text-indigo-500" />
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
                  className="flex items-center gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <Plus size={15} /> Add Contact
                </button>
              </div>

              <div className="overflow-y-auto max-h-[400px] custom-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-50/60 border-b border-gray-100">
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Number
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                          <Phone size={30} className="mx-auto mb-2 text-gray-300" />
                          No contacts added yet
                        </td>
                      </tr>
                    ) : (
                      contacts.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
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
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 text-violet-600 text-xs font-semibold">
                              {item.designation_name}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => editContact(item)}
                                className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 hover:cursor-pointer transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteContact(item.id)}
                                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 hover:cursor-pointer transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Contact Modal — right-side slide-in/out (indigo-violet theme) */}
              {showcontactsModal && (
                <div
                  className={`fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
                    contactPanelVisible ? "opacity-100" : "opacity-0"
                  }`}
                  onClick={closeContactModal}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`bg-white h-full w-full max-w-[95vw] sm:max-w-[440px] shadow-2xl overflow-y-auto border-l border-gray-100 transform transition-transform duration-300 ease-in-out ${
                      contactPanelVisible ? "translate-x-0" : "translate-x-full"
                    }`}
                  >
                    <div className="bg-white">
                      <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                            <Phone size={17} className="text-white" />
                          </span>
                          <h3 className="text-gray-900 font-bold text-sm">
                            {editContactId ? "Edit Contact" : "Add Contact"}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={closeContactModal}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 hover:cursor-pointer transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="h-1 w-full bg-gray-100">
                        <div className="h-full w-1/3 rounded-r-full bg-gradient-to-r from-indigo-500 to-violet-600"></div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">
                          Contact Person <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                          <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                            <UserRound size={16} className="text-amber-500" />
                          </span>
                          <input
                            type="text"
                            name="contact_person"
                            value={contactForm.contact_person}
                            onChange={handleContactChange}
                            placeholder="Enter contact person name"
                            className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">
                          Contact Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                          <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                            <Phone size={16} className="text-green-500" />
                          </span>
                          <input
                            type="text"
                            name="contact_number"
                            value={contactForm.contact_number}
                            onChange={handleContactChange}
                            placeholder="Enter contact number"
                            className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">
                          Email
                        </label>
                        <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                          <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                            <Mail size={16} className="text-cyan-500" />
                          </span>
                          <input
                            type="text"
                            name="email"
                            value={contactForm.email}
                            onChange={handleContactChange}
                            placeholder="Enter email address"
                            className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-600">
                          Designation <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                          <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                            <Briefcase size={16} className="text-violet-500" />
                          </span>
                          <select
                            name="contact_designation"
                            value={contactForm.contact_designation}
                            onChange={handleContactChange}
                            className="w-full px-3 py-2.5 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
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
                    </div>
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={closeContactModal}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 hover:cursor-pointer transition-all flex items-center gap-1.5 bg-white"
                      >
                        <X size={14} /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveContact}
                        disabled={isSavingContact}
                        className={`w-40 flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl transition-all shadow-sm
                          ${isSavingContact ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:cursor-pointer"}`}
                      >
                        {isSavingContact ? (
                          <svg
                            className="animate-spin h-4 w-4 "
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
    </div>
  );
}

// =======================================================================
// ✅ VIEW CUSTOMER POPUP — same right-side slide-in / slide-out pattern as
// AddCustomerModal above. Rendered conditionally inside CustomerList below.
// ✅ Theme: indigo-to-violet gradient header, matches the Add Lead popup.
// =======================================================================
function ViewCustomerModal({ data, onClose }) {
  // Slide in / out
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPanelVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setPanelVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const details = [
    { icon: Building2, label: "Company", value: data.company_name, color: "blue" },
    { icon: User, label: "Customer Name", value: data.customer_name, color: "violet" },
    { icon: Mail, label: "Email", value: data.email, color: "cyan" },
    { icon: Phone, label: "Mobile", value: data.mobile, color: "green" },
    { icon: Tag, label: "Customer Type", value: data.customer_type, color: "amber" },
    { icon: Globe, label: "Website", value: data.website, color: "cyan" },
    { icon: Briefcase, label: "Industry", value: data.industry_name, color: "emerald" },
  ];

  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-500" },
    violet: { bg: "bg-violet-50", text: "text-violet-500" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-500" },
    green: { bg: "bg-green-50", text: "text-green-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-500" },
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
        panelVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-gray-100 h-full w-full sm:max-w-[520px] shadow-2xl overflow-y-auto pb-6 transform transition-transform duration-300 ease-in-out ${
          panelVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header — indigo-to-violet gradient, matches Add Customer / Add Lead */}
        <div className="bg-white w-full shadow-lg p-4 mt-1 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <Eye size={20} className="text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {data.customer_name || "Customer Details"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {data.customer_type || "—"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600  transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-5">
          <div className="bg-white rounded-sm border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {details.map(({ icon: Icon, label, value, color }) => {
                const c = colorMap[color];
                return (
                  <div
                    key={label}
                    className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3"
                  >
                    <span className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={16} className={c.text} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-gray-700 break-words">
                        {value || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-5">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <X size={15} /> Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =======================================================================
// ✅ DELETE CUSTOMER POPUP — animated center dialog (fade + scale-in on
// mount, fade + scale-out before the confirm/cancel action actually fires).
// ✅ Theme: red/rose gradient icon box (keeps the destructive "danger"
// meaning), rounded-full pill buttons — matches the reference screenshot.
// =======================================================================
function DeleteCustomerModal({ name, onCancel, onConfirm }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Plays the fade+scale-out animation first, then fires the real action
  // (cancel or confirm) so the dialog is always fully closed before the
  // parent state actually unmounts it.
  const closeWith = (action) => {
    setVisible(false);
    setTimeout(() => {
      action?.();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 px-4 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => closeWith(onCancel)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white w-full h-[375px] max-w-md rounded-sm shadow-2xl overflow-hidden transform transition-all duration-200 ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={16} className="text-red-600" strokeWidth={2} />
            </div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
              Delete Customer
            </h2>
          </div>
          <button
            onClick={() => closeWith(onCancel)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-4 pb-4  text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-5">
            <Trash2 className="w-10 h-10 text-red-600" strokeWidth={1.8} />
          </div>

          {/* Name */}
          <h3 className="text-xl font-extrabold text-gray-900 tracking-wide uppercase mb-2">
            {name?.toUpperCase() || "THIS CUSTOMER"}
          </h3>

          {/* Divider */}
          <div className="w-10 h-[3px] bg-red-500 rounded-full mx-auto mb-4"></div>

          {/* Message */}
          <p className="text-sm text-gray-500 leading-relaxed">
            This action cannot be undone.
            <br />
            Are you sure you want to delete this customer?
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3.5 px-7 pb-0">
          <button
            onClick={() => closeWith(onCancel)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={16} strokeWidth={2.2} /> Cancel
          </button>
          <button
            onClick={() => closeWith(onConfirm)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold text-white bg-red-600  shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} strokeWidth={2.2} /> Delete Customer
          </button>
        </div>
      </div>
    </div>
  );
}

// =======================================================================
// ✅ MAIN CUSTOMER LIST PAGE
// =======================================================================
export default function CustomerList() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  // useAuth(["Admin", "Super Admin"]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [search, setSearch] = useState("");
  // BUG FIX #1: was "setDesignations" (undefined variable), changed to setIndustries
  const [industries, setIndustries] = useState([]);

  const [viewModal, setViewModal] = useState({ open: false, data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: "" });

  // ✅ NEW: controls the Add Customer slide-in/out popup
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // ✅ NEW: controls the Edit Customer slide-in/out popup — holds the id
  // of the customer being edited (drawer opens when this is not null)
  const [editCustomerId, setEditCustomerId] = useState(null);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer_name: "",
    // BUG FIX #4: renamed contact_number to mobile to match backend param
    mobile: "",
    email: "",
    industry: "",
  });

  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "ASC" });


  // Store offset for each scrollable column
  const [columnOffsets, setColumnOffsets] = useState({
    company_name: 0,
    customer_name: 0,
    email: 0,
    website: 0,
    industry: 0,
  });

  // Fetch table data
  const fetchCustomers = async () => {
    try {
      const query = new URLSearchParams({
        // Remove server-side pagination to allow client-side slicing
        // page,
        // limit: 10,
        search,
        sortBy: sortConfig.key,
        order: sortConfig.direction,
        ...filters,
      }).toString();

      const res = await axios.get(`${API_BASE}/api/customers/get-customers?${query}`);
      const result = res.data;

      if (result.success) {
        setData(result.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };


  // Fetching Active Industries
  useEffect(() => {
    const fetchIndustry = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/Industries/industries`, {
          params: { status: 1 },
        });
        // BUG FIX #1: was calling setDesignations (undefined), now correctly calls setIndustries
        setIndustries(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch industries:", err);
        setIndustries([]);
      }
    };
    fetchIndustry();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [sortConfig]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delay);
  }, [search, filters]);

  // Reset page when filters, search, or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search, itemsPerPage]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

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


  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.delete(`${API_BASE}/api/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("DELETE SUCCESS:", res.data);

      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.error("FULL DELETE ERROR:", error);

      if (error.response) {
        console.error("Server Response:", error.response.data);
      }

      toast.error("Failed to delete customer");
    }
  };

  return (
    <>
      <Header />
      <div className="bg-gray-100">
        {/*breadcrumb */}
        <div className="bg-white w-full rounded-sm shadow-lg p-3 mt-1 mb-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <p className="hidden sm:flex items-center flex-wrap">
              <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="/customer-list" className="mx-3 text-md text-gray-700 hover:text-indigo-600 ">
                Customer List
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="🔍 Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border w-full sm:w-64 border-gray-300 text-gray-700 placeholder-gray-400 p-2 sm:p-1 px-3 rounded-sm  outline-none  transition-all text-sm  focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
              />
              {/* ✅ CHANGED: was <Link href="/customer">, now opens the slide-in popup defined above in this same file */}
              <button
                type="button"
                onClick={() => setShowAddCustomer(true)}
                className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-4 py-2 rounded-sm w-full sm:w-auto text-center font-bold text-sm cursor-pointer"
              >
                + ADD CUSTOMER
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mx-4 mb-2 md:hidden mt-3 relative z-40">
          <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all">
            <span className="flex items-center gap-2"><i className="bi bi-funnel"></i> Filters</span>
            <i className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}></i>
          </button>
        </div>

        <div
          className={`
            ${showMobileFilters ? "mx-4 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-xl" : "hidden"}
            md:mx-4 md:mb-2 md:flex md:flex-wrap md:gap-2 md:bg-transparent md:p-0 md:shadow-none md:border-none
          `}
        >
          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-56 md:mx-2 text-sm">
                      <User size={16} className="text-violet-500" />
            <input
              type="text"
              name="customer_name"
              value={filters.customer_name}
              onChange={handleChange}
              placeholder="Enter Name"
              className="py-2 w-full text-sm outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-56 md:mx-2 text-sm">
                      <Phone size={16} className="text-green-500" />
            <input
              type="text"
              name="mobile"
              placeholder="Contact No."
              className="py-2 w-full text-sm outline-none bg-transparent"
              value={filters.mobile || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!/^\d*$/.test(val)) return;
                if (val.length === 1 && !["6", "7", "8", "9"].includes(val)) return;
                if (val.length > 10) return;
                setFilters((p) => ({ ...p, mobile: val }));
              }}
              maxLength={10}
            />
          </div>

          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-56 md:mx-2 text-sm">
            <Mail size={16} className="text-red-500" />
            <input
              type="text"
              name="email"
              value={filters.email}
              onChange={handleChange}
              placeholder="Enter Email"
              className="py-2 w-full text-sm outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 px-3 border bg-white border-indigo-400 rounded-sm w-full md:w-56 md:mx-2 text-sm">
            <Building2 size={16} className="text-blue-500" />
            <select
              name="industry"
              value={filters.industry}
              onChange={handleChange}
              className="py-2 w-full text-gray-500 text-sm outline-none bg-transparent"
            >
              <option value="">Industry</option>
              {industries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 sm:col-span-2 md:col-span-auto">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  customer_name: "",
                  mobile: "",
                  email: "",
                  industry: "",
                });
                setShowMobileFilters(false);
              }}
              className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-5 py-2 bg-indigo-100 text-indigo-600  text-sm text-center font-semibold transition-colors"
            >
              <i className="bi bi-arrow-counterclockwise"></i> Clear Filter
            </button>
            <button
              type="button"
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Table */}
      <form className="p-2 w-8xl mx-3">
          <div className="bg-white shadow rounded-sm p-6">
            <div className="overflow-x-auto overflow-y-scroll max-h-[380px] custom-scroll" style={{ overflowX: "scroll" }}>
              <table className="w-full text-sm border border-gray-200 text-left whitespace-nowrap">
                <thead className="bg-indigo-50 border-b border-gray-200 text-xs font-bold text-slate-700 tracking-wider">
                  <tr>
                    <th className="px-3 py-3 text-center">#</th>
                    <th className="px-4 py-3">
                      Company Name <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                    <th className="px-4 py-3">
                      Customer Name <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">
                      Mobile No. <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                    </th>
                    <th className="px-4 py-3">Customer Type</th>
                    <th className="px-4 py-3">Website</th>
                    <th className="px-4 py-3">Industry</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((row, index) => (
                      <tr key={index} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                        <td className="px-2 py-3">{indexOfFirstItem + index + 1}</td>
                        <td className="px-2 py-3 font-semibold text-slate-800">{row.company_name}</td>
                        <td className="px-2 py-3 text-blue-500 font-medium">{row.customer_name}</td>
                        <td className="px-2 py-3 text-gray-500">{row.email}</td>
                        <td className="px-2 py-3 font-semibold text-slate-800">{row.mobile}</td>
                        <td className="px-2 py-3 text-gray-500">{row.customer_type}</td>
                        <td className="px-2 py-3 text-gray-500">{row.website}</td>
                        <td className="px-2 py-3 text-gray-500">{row.industry_name}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewModal({ open: true, data: row })}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                            >
                              <i className="bi bi-eye text-lg"></i>
                            </button>
                            {/* ✅ CHANGED: was localStorage.setItem + router.push("/edit-customer"),
                                now opens the inline EditCustomerModal slide-in drawer instead */}
                            <button
                              type="button"
                              onClick={() => setEditCustomerId(row.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer transition-all"
                            >
                              <i className="bi bi-pencil-square text-sm"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModal({ open: true, id: row.id, name: row.customer_name })}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 cursor-pointer transition-all"
                            >
                              <i className="bi bi-trash3 text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-gray-500">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg mt-4">
              {/* Left side: Showing X to Y of Z entries */}
              <div className="text-sm text-slate-600 font-semibold">
                Showing {currentData.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                {indexOfFirstItem + currentData.length} entries
              </div>

              {/* Center: Navigation buttons (only if totalPages > 1) */}
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
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
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

              {/* Right side: Rows per page selector */}
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
                  className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm text-indigo-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  {[10, 20, 100, 200].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        </form>
      </div>

      {/* ✅ Delete Modal — now animated (fade + scale-in/out) and uses
          rounded-full pill buttons matching the reference design */}
      {deleteModal.open && (
        <DeleteCustomerModal
          name={deleteModal.name}
          onCancel={() => setDeleteModal({ open: false, id: null, name: "" })}
          onConfirm={() => {
            handleDelete(deleteModal.id);
            setDeleteModal({ open: false, id: null, name: "" });
          }}
        />
      )}

      {/* ✅ View Customer popup — slides in/out from the right, indigo-violet theme */}
      {viewModal.open && viewModal.data && (
        <ViewCustomerModal
          data={viewModal.data}
          onClose={() => setViewModal({ open: false, data: null })}
        />
      )}

      {/* ✅ Add Customer popup — component defined at the top of this same file */}
      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onSuccess={fetchCustomers}
        />
      )}

      {/* ✅ NEW: Edit Customer popup — component defined above in this same
          file. Opens as a right-side slide-in/slide-out drawer, replacing
          the old /edit-customer route navigation. Refreshes the list via
          fetchCustomers() on successful save. */}
      {editCustomerId && (
        <EditCustomerModal
          customerId={editCustomerId}
          onClose={() => setEditCustomerId(null)}
          onSuccess={fetchCustomers}
        />
      )}
    </>
  );
}