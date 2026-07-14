// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import axios from "redaxios";
// import Link from "next/link";
// import Header from "@/app/components/header";
// import { useRouter } from "next/navigation";
// import { toast } from "react-toastify";
// import { checkRole } from "@/utils/checkRole";
// import useAuth from "@/app/components/useAuth";
// import { Sparkles } from "lucide-react";
// import {
//   CalendarDays,
//   ListChecks,
//   User,
//   UserRound,
//   FileText,
//   CloudUpload,
//   Info,
//   X,
//   CheckCircle2,
//   Building2,
//   Phone,
//   Radio,
//   Bookmark,
//   ShieldCheck,
//   Star,
//   FolderOpen,
//   Save,
//   Plus,
//   Pencil,
// } from "lucide-react";
// export default function Page() {
//   const [btnLoading, setBtnLoading] = useState(false);
//   const [updateLoading, setUpdateLoading] = useState(false);
//   const [showExportMenu, setShowExportMenu] = useState(false);
//   const exportRef = useRef(null);

//   const [leads, setLeads] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("Pending");
//   const [showMobileFilters, setShowMobileFilters] = useState(false);

//   // ✅ FIXED: Separated status popup state — selectedLead always full object
//   const [showPopup, setShowPopup] = useState(false);
//   const [statusChangeLeadId, setStatusChangeLeadId] = useState(null);
//   const [selectedStatus, setSelectedStatus] = useState("");

//   const [selectedLead, setSelectedLead] = useState(null);

//   const router = useRouter();

//   const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

//   const [showModal, setShowModal] = useState(false);
//   const [showFileModal, setShowFileModal] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);

//   const [showUpdateModal, setShowUpdateModal] = useState(false);
//   const [followUpHistory, setFollowUpHistory] = useState([]);
//   const [previewFollowUp, setPreviewFollowUp] = useState(null);

//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [leadToDelete, setLeadToDelete] = useState(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);

//   const [showViewModal, setShowViewModal] = useState(false);
//   const [viewLead, setViewLead] = useState(null);

//   // ===================================================
//   // ✅ NEW: ADD LEAD POPUP STATE (moved from add-lead page)
//   // ===================================================
//   const [showAddLeadModal, setShowAddLeadModal] = useState(false);
//   const [addLeadSubmitting, setAddLeadSubmitting] = useState(false);
//   const [addLeadErrors, setAddLeadErrors] = useState({});
//   const [addLeadForm, setAddLeadForm] = useState({
//     company_name: "",
//     customer_name: "",
//     mobile_no: "",
//     reference: "",
//     source: "",
//     status: "Qualified",
//     priority: "",
//     assignee: "",
//     category: "",
//     description: "",
//   });

//   // ===================================================
//   // ✅ NEW: EDIT LEAD POPUP STATE (moved from update-lead page)
//   // ===================================================
//   const [showEditLeadModal, setShowEditLeadModal] = useState(false);
//   const [editLeadSubmitting, setEditLeadSubmitting] = useState(false);
//   const [editLeadForm, setEditLeadForm] = useState({
//     lead_id: "",
//     company_name: "",
//     customer_name: "",
//     mobile_no: "",
//     reference: "",
//     source: "",
//     status: "",
//     priority: "",
//     assignee: "",
//     category: "",
//     description: "",
//   });

//   const [updateForm, setUpdateForm] = useState({
//     follow_up_date: "",
//     activity_type: "",
//     follow_up_by: "",
//     contact_person: "",
//     description: "",
//   });

//   const [form, setForm] = useState({
//     follow_up_date: "",
//     activity_type: "",
//     follow_up_by: "",
//     contact_person: "",
//     description: "",
//   });

//   useAuth();

//   const getToken = () => localStorage.getItem("token");

//   const fetchLeads = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/api/lead/read`, {
//         headers: {
//           Authorization: `Bearer ${getToken()}`,
//         },
//       });

//       const formatted = (res.data?.result || []).map((item) => {
//         let finalStatus = "Pending";
//         if (item.status === "Won") finalStatus = "Won";
//         else if (item.status === "Lost") finalStatus = "Lost";
//         return { ...item, status: finalStatus };
//       });

//       setLeads(formatted);
//     } catch (err) {
//       console.log(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLeads();
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (exportRef.current && !exportRef.current.contains(e.target)) {
//         setShowExportMenu(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // ===================================================
//   // ✅ NEW: ADD LEAD HANDLERS (same logic as add-lead page)
//   // ===================================================
//   const handleAddLeadChange = (e) => {
//     let { name, value } = e.target;
//     if (name === "mobile_no") {
//       value = value.replace(/[^0-9]/g, "").slice(0, 10);
//     }
//     setAddLeadForm((prev) => ({ ...prev, [name]: value }));
//     if (addLeadErrors[name])
//       setAddLeadErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const validateAddLead = () => {
//     const newErrors = {};
//     if (!addLeadForm.customer_name.trim())
//       newErrors.customer_name = "Customer Name is required";
//     if (!addLeadForm.reference.trim())
//       newErrors.reference = "Lead Title is required";
//     if (!addLeadForm.source) newErrors.source = "Source is required";
//     if (addLeadForm.mobile_no && addLeadForm.mobile_no.length !== 10) {
//       newErrors.mobile_no = "Mobile number must be exactly 10 digits";
//     }
//     return newErrors;
//   };

//   const resetAddLeadForm = () => {
//     setAddLeadForm({
//       company_name: "",
//       customer_name: "",
//       mobile_no: "",
//       reference: "",
//       source: "",
//       status: "Qualified",
//       priority: "",
//       assignee: "",
//       category: "",
//       description: "",
//     });
//     setAddLeadErrors({});
//   };

//   const handleAddLeadSubmit = async (e) => {
//     e.preventDefault();

//     const newErrors = validateAddLead();
//     setAddLeadErrors(newErrors);

//     if (Object.keys(newErrors).length > 0) {
//       if (newErrors.mobile_no && Object.keys(newErrors).length === 1) {
//         toast.error(newErrors.mobile_no);
//       } else {
//         toast.error("Please fill all required fields and correct any errors");
//       }
//       return;
//     }

//     try {
//       setAddLeadSubmitting(true);
//       const token = getToken();

//       const payload = {
//         ...addLeadForm,
//         source: addLeadForm.source || null,
//         mobile_no: addLeadForm.mobile_no || null,
//         priority: addLeadForm.priority || null,
//         category: addLeadForm.category || null,
//       };

//       const res = await axios.post(`${API_BASE}/api/lead/insert`, payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (res.data && res.data.success) {
//         toast.success("Lead added successfully!");
//         resetAddLeadForm();
//         setShowAddLeadModal(false);
//         fetchLeads(); // ✅ refresh list instead of router.push
//       } else {
//         toast.error(res.data?.message || "Failed to add lead");
//       }
//     } catch (err) {
//       console.error(err);
//       const msg =
//         err?.data?.message ||
//         err?.message ||
//         "Failed to add lead. Please try again.";
//       toast.error(msg);
//     } finally {
//       setAddLeadSubmitting(false);
//     }
//   };

//   // ===================================================
//   // ✅ NEW: EDIT LEAD HANDLERS (moved from update-lead page)
//   // ===================================================
//   const handleEditLeadChange = (e) => {
//     let { name, value } = e.target;
//     if (name === "mobile_no") {
//       value = value.replace(/[^0-9]/g, "").slice(0, 10);
//     }
//     setEditLeadForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleEditLeadSubmit = async (e) => {
//     e.preventDefault();

//     if (!editLeadForm.lead_id) {
//       toast.error("Lead ID missing. Cannot update.");
//       return;
//     }

//     try {
//       setEditLeadSubmitting(true);
//       const token = getToken();

//       const res = await axios.put(
//         `${API_BASE}/api/lead/update/${editLeadForm.lead_id}`,
//         {
//           company_name: editLeadForm.company_name,
//           customer_name: editLeadForm.customer_name,
//           mobile_no: editLeadForm.mobile_no || null,
//           reference: editLeadForm.reference,
//           source: editLeadForm.source,
//           status: editLeadForm.status,
//           priority: editLeadForm.priority,
//           assignee: editLeadForm.assignee,
//           category: editLeadForm.category,
//           description: editLeadForm.description,
//         },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );

//       if (res.data.success) {
//         toast.success("Lead Updated Successfully");
//         setShowEditLeadModal(false);
//         fetchLeads();
//       } else {
//         toast.error(res.data.message || "Update Failed");
//       }
//     } catch (error) {
//       console.error("Update error:", error);
//       toast.error("Something went wrong");
//     } finally {
//       setEditLeadSubmitting(false);
//     }
//   };

//   // ===================================================
//   // EXPORT TO EXCEL
//   // ===================================================
//   const exportToExcel = async () => {
//     try {
//       const XLSX = await import("xlsx");

//       const exportData = filteredLeads.map((lead, index) => ({
//         "No.": index + 1,
//         "Company Name": lead.company_name || "",
//         "Customer Name": lead.customer_name || "",
//         "Lead Title": lead.reference || "",
//         Source: lead.source || "",
//         Assignee: lead.assignee || "",
//         "Next Follow Up": lead.next_follow_up_date
//           ? new Date(lead.next_follow_up_date).toLocaleDateString()
//           : "",
//         "Created At": lead.created_at
//           ? new Date(lead.created_at).toLocaleDateString()
//           : "",
//         Status: lead.status || "",
//       }));

//       const worksheet = XLSX.utils.json_to_sheet(exportData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

//       const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
//         wch: Math.max(key.length, 15),
//       }));
//       worksheet["!cols"] = colWidths;

//       const now = new Date();
//       const date = now.toISOString().split("T")[0];
//       const time = now.toTimeString().slice(0, 5);
//       const fileName = `Leads_${activeTab}_(${date})_${time}.xlsx`;

//       XLSX.writeFile(workbook, fileName);
//       toast.success("Excel exported successfully");
//       setShowExportMenu(false);
//     } catch (err) {
//       console.log(err);
//       toast.error("Excel export failed");
//     }
//   };

//   // ===================================================
//   // EXPORT TO PDF
//   // ===================================================
//   const exportToPDF = async () => {
//     try {
//       const { default: jsPDF } = await import("jspdf");
//       const { default: autoTable } = await import("jspdf-autotable");

//       const doc = new jsPDF({ orientation: "landscape" });

//       doc.setFontSize(14);
//       doc.setTextColor(40, 40, 40);
//       doc.text(`Leads Report - ${activeTab}`, 14, 15);

//       doc.setFontSize(9);
//       doc.setTextColor(120, 120, 120);
//       doc.text(
//         `Exported on: ${new Date().toLocaleDateString("en-GB")}   |   Total Records: ${filteredLeads.length}`,
//         14,
//         22,
//       );

//       const tableData = filteredLeads.map((lead, index) => [
//         index + 1,
//         lead.company_name || "",
//         lead.customer_name || "",
//         lead.reference || "",
//         lead.source || "",
//         lead.assignee || "",
//         lead.next_follow_up_date
//           ? new Date(lead.next_follow_up_date).toLocaleDateString()
//           : "",
//         lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "",
//         lead.status || "",
//       ]);

//       autoTable(doc, {
//         startY: 27,
//         head: [
//           [
//             "#",
//             "Company",
//             "Customer",
//             "Lead Title",
//             "Product Cat.",
//             "Source",
//             "Assignee",
//             "Next Follow Up",
//             "Created",
//             "Status",
//           ],
//         ],
//         body: tableData,
//         theme: "grid",
//         styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
//         headStyles: {
//           fillColor: [234, 88, 12],
//           textColor: [255, 255, 255],
//           fontStyle: "bold",
//           fontSize: 8,
//         },
//         alternateRowStyles: { fillColor: [255, 247, 237] },
//         columnStyles: {
//           0: { cellWidth: 8 },
//           3: { cellWidth: 35 },
//           9: { cellWidth: 20 },
//         },
//       });

//       const now = new Date();
//       const date = now.toISOString().split("T")[0];
//       const time = now.toTimeString().slice(0, 5).replace("_", "-");
//       const fileName = `Leads_${activeTab}_(${date})_${time}.pdf`;

//       doc.save(fileName);
//       toast.success("PDF exported successfully");
//       setShowExportMenu(false);
//     } catch (err) {
//       console.log(err);
//       toast.error("PDF export failed");
//     }
//   };

//   // ===================================================
//   // FILE HANDLING
//   // ===================================================
//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     handleSelect({ target: { files: e.dataTransfer.files, value: "" } });
//   };

//   const MAX_FILES = 5;
//   const IMAGE_EXT = ["jpg", "jpeg", "png"];
//   const DOC_EXT = ["pdf", "xlsx", "dwg"];
//   const MAX_IMG_SIZE = 5 * 1024 * 1024;
//   const MAX_DOC_SIZE = 5 * 1024 * 1024;

//   const handleSelect = (e) => {
//     const files = Array.from(e.target.files);
//     let updatedFiles = [...selectedFiles];
//     let remainingSlots = MAX_FILES - updatedFiles.length;

//     if (remainingSlots <= 0) {
//       toast.error("You can upload only 5 files");
//       e.target.value = "";
//       return;
//     }

//     for (let file of files) {
//       if (remainingSlots <= 0) {
//         toast.error("Maximum 5 files allowed");
//         break;
//       }
//       const ext = file.name.split(".").pop().toLowerCase();
//       const isDuplicate = updatedFiles.some(
//         (f) => f.name === file.name && f.size === file.size,
//       );
//       if (isDuplicate) {
//         toast.error("Duplicate file not allowed");
//         continue;
//       }
//       if (![...IMAGE_EXT, ...DOC_EXT].includes(ext)) {
//         toast.error("Unsupported File");
//         continue;
//       }
//       if (IMAGE_EXT.includes(ext) && file.size > MAX_IMG_SIZE) {
//         toast.error("Image must be under 2MB");
//         continue;
//       }
//       if (DOC_EXT.includes(ext) && file.size > MAX_DOC_SIZE) {
//         toast.error("Document must be under 15MB");
//         continue;
//       }
//       updatedFiles.push(file);
//       remainingSlots--;
//     }

//     setSelectedFiles(updatedFiles);
//     e.target.value = "";
//   };

//   // ===================================================
//   // ADD FOLLOW-UP (first time)
//   // ===================================================
//   const handleSubmit = async () => {
//     try {
//       if (!form.activity_type || !form.contact_person || !form.description) {
//         toast.error("Please fill all required fields");
//         return;
//       }

//       setBtnLoading(true);

//       const formData = new FormData();
//       Object.keys(form).forEach((key) => {
//         if (key !== "files") formData.append(key, form[key]);
//       });
//       formData.append("lead_id", selectedLead.lead_id);
//       formData.append("status", "Pending");
//       formData.append("remarks", "");

//       if (selectedFiles.length > 0) {
//         selectedFiles.forEach((file) => formData.append("files", file));
//       }

//       await axios.post(`${API_BASE}/api/lead-follow-up/insert`, formData, {
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });

//       toast.success("Follow-up added");
//       setShowModal(false);
//       setSelectedFiles([]);
//       fetchLeads();
//     } catch (err) {
//       console.log(err);
//       toast.error("Something went wrong");
//     } finally {
//       setBtnLoading(false);
//     }
//   };

//   // ===================================================
//   // OPEN UPDATE MODAL
//   // ===================================================
//   const openUpdateModal = async (lead) => {
//     setSelectedLead(lead);
//     setShowUpdateModal(true);
//     setFollowUpHistory([]);
//     setPreviewFollowUp(null);
//     setSelectedFiles([]);

//     setUpdateForm({
//       follow_up_date: new Date().toISOString().split("T")[0],
//       activity_type: "",
//       follow_up_by: "",
//       contact_person: "",
//       description: "",
//     });

//     try {
//       const res = await axios.get(
//         `${API_BASE}/api/lead-follow-up/history/${lead.lead_id}`,
//       );
//       setFollowUpHistory(res.data?.result || []);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   // ===================================================
//   // ADD FOLLOW-UP (update modal)
//   // ===================================================
//   const handleUpdate = async () => {
//     try {
//       if (
//         !updateForm.activity_type ||
//         !updateForm.contact_person ||
//         !updateForm.description
//       ) {
//         toast.error("Please fill all required fields");
//         return;
//       }

//       setUpdateLoading(true);

//       const formData = new FormData();
//       formData.append("lead_id", selectedLead.lead_id);
//       formData.append("follow_up_date", updateForm.follow_up_date);
//       formData.append("activity_type", updateForm.activity_type);
//       formData.append("follow_up_by", updateForm.follow_up_by);
//       formData.append("contact_person", updateForm.contact_person);
//       formData.append("description", updateForm.description);
//       formData.append("status", "Pending");
//       formData.append("remarks", "");

//       if (selectedFiles.length > 0) {
//         selectedFiles.forEach((file) => formData.append("files", file));
//       }

//       await axios.post(`${API_BASE}/api/lead-follow-up/insert`, formData, {
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });

//       toast.success("New follow-up added");

//       const res = await axios.get(
//         `${API_BASE}/api/lead-follow-up/history/${selectedLead.lead_id}`,
//       );
//       setFollowUpHistory(res.data?.result || []);
//       setPreviewFollowUp(null);

//       setUpdateForm({
//         follow_up_date: new Date().toISOString().split("T")[0],
//         activity_type: "",
//         follow_up_by: "",
//         contact_person: "",
//         description: "",
//       });

//       setSelectedFiles([]);
//       fetchLeads();
//     } catch (err) {
//       toast.error("Failed to add follow-up");
//       console.log(err);
//     } finally {
//       setUpdateLoading(false);
//     }
//   };

//   // ===================================================
//   // DELETE LEAD
//   // ===================================================
//   const openDeleteModal = (lead) => {
//     setLeadToDelete(lead);
//     setShowDeleteModal(true);
//   };

//   const handleDelete = async () => {
//     if (!leadToDelete) return;
//     setDeleteLoading(true);
//     try {
//       await axios.delete(`${API_BASE}/api/lead/${leadToDelete.lead_id}`, {
//         headers: { Authorization: `Bearer ${getToken()}` },
//       });
//       toast.success("Lead deleted successfully");
//       setShowDeleteModal(false);
//       setLeadToDelete(null);
//       fetchLeads();
//     } catch (err) {
//       toast.error("Failed to delete lead");
//       console.log(err);
//     } finally {
//       setDeleteLoading(false);
//     }
//   };

//   // ===================================================
//   // EDIT LEAD
//   // ===================================================
//   const handleEdit = async (lead) => {
//     try {
//       const res = await axios.get(
//         `${API_BASE}/api/lead/sales/leads/view-leads/${lead.lead_id}`,
//         { headers: { Authorization: `Bearer ${getToken()}` } },
//       );

//       const leadData = res.data.lead;

//       setEditLeadForm({
//         lead_id: leadData.lead_id || "",
//         company_name: leadData.company_name || "",
//         customer_name: leadData.customer_name || "",
//         mobile_no: leadData.mobile_no || "",
//         reference: leadData.reference || "",
//         source: leadData.source || "",
//         status: leadData.status || "",
//         priority: leadData.priority || "",
//         assignee: leadData.assignee || "",
//         category: leadData.category || "",
//         description: leadData.description || "",
//       });

//       setShowEditLeadModal(true);
//     } catch (error) {
//       console.log(error);
//       toast.error("Failed to fetch lead details");
//     }
//   };

//   // ===================================================
//   // VIEW LEAD
//   // ===================================================
//   const handleView = async (lead) => {
//     try {
//       const res = await axios.get(
//         `${API_BASE}/api/lead/sales/leads/view-details/${lead.lead_id}`,
//         { headers: { Authorization: `Bearer ${getToken()}` } },
//       );
//       setViewLead(res.data.lead);
//       setShowViewModal(true);
//     } catch (error) {
//       console.log(error);
//       toast.error("Failed to fetch lead details");
//     }
//   };

//   // ===================================================
//   // ✅ FIXED: STATUS CHANGE — now sends Authorization header
//   // ===================================================
//   const handleStatusChange = (lead_id, newStatus) => {
//     setStatusChangeLeadId(lead_id); // ✅ separate state — no conflict with selectedLead
//     setSelectedStatus(newStatus);
//     setShowPopup(true);
//   };

//   const confirmStatusChange = async () => {
//     try {
//       await axios.put(
//         `${API_BASE}/api/lead/update-status/${statusChangeLeadId}`,
//         { status: selectedStatus },
//         {
//           headers: { Authorization: `Bearer ${getToken()}` }, // ✅ FIXED: was missing
//         },
//       );

//       setLeads((prev) =>
//         prev.map((lead) =>
//           lead.lead_id === statusChangeLeadId
//             ? { ...lead, status: selectedStatus }
//             : lead,
//         ),
//       );

//       setShowPopup(false);
//       toast.success("Status Updated");
//     } catch (err) {
//       console.log(err);
//       toast.error("Failed to update status");
//     }
//   };

//   // ===================================================
//   // FILTER LOGIC
//   // ===================================================
//   const debounceRef = useRef(null);

//   const [filters, setFilters] = useState({
//     company_name: "",
//     customer_name: "",
//     reference: "",
//     source: "",
//     mobile_no: "",
//     status: "",
//     created_by: "",
//     from_created: "",
//     to_created: "",
//     from_followup: "",
//     to_followup: "",
//   });

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

//   const searchLeads = async () => {
//     try {
//       const params = Object.fromEntries(
//         Object.entries(filters).filter(([_, v]) => v !== ""),
//       );

//       const res = await axios.get(`${API_BASE}/api/lead/sales/leads/filter`, {
//         params,
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });

//       const formatted = (res.data?.data || []).map((item) => {
//         let finalStatus = "Pending";
//         if (item.status === "Won") finalStatus = "Won";
//         else if (item.status === "Lost") finalStatus = "Lost";
//         return { ...item, status: finalStatus };
//       });

//       setLeads(formatted);
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   useEffect(() => {
//     const hasFilter = Object.values(filters).some((v) => v !== "");

//     if (!hasFilter) {
//       fetchLeads();
//       return;
//     }

//     if (debounceRef.current) clearTimeout(debounceRef.current);

//     debounceRef.current = setTimeout(() => {
//       searchLeads();
//     }, 200);

//     return () => clearTimeout(debounceRef.current);
//   }, [filters]);

//   const resetFilters = () => {
//     setFilters({
//       company_name: "",
//       customer_name: "",
//       reference: "",
//       source: "",
//       mobile_no: "",
//       status: "",
//       created_by: "",
//       from_created: "",
//       to_created: "",
//       from_followup: "",
//       to_followup: "",
//     });
//     fetchLeads();
//   };
//   // ===================================================
//   // 🚦 TRAFFIC LIGHT DOT
//   // Returns a colored dot JSX based on follow_up_status from API
//   // Only shown for Pending leads; Won/Lost get no dot
//   // ===================================================
//   const getTrafficDot = (lead) => {
//     const color = lead.follow_up_status || "green"; // 'green' | 'yellow' | 'red'

//     const dotColors = {
//       green: "#22c55e",
//       yellow: "#eab308",
//       red: "#ef4444",
//     };

//     const isPending = lead.status === "Pending";

//     const tooltips = isPending
//       ? {
//           green: "✅ Follow-up on track (< 24h)",
//           yellow: "⚠️ No follow-up in 24h — Attention needed",
//           red: "🔴 No follow-up in 48h+ — Critical",
//         }
//       : {
//           green: "✅ Completed on track (< 24h)",
//           yellow: "⚠️ Completed late (24h - 48h)",
//           red: "🔴 Completed late (48h+)",
//         };

//     const isPulse = isPending && (color === "yellow" || color === "red");

//     return (
//       <span
//         title={tooltips[color]}
//         style={{
//           display: "inline-block",
//           width: 9,
//           height: 9,
//           borderRadius: "50%",
//           backgroundColor: dotColors[color],
//           flexShrink: 0,
//           animation: isPulse ? "pulse 1.5s infinite" : "none",
//         }}
//       />
//     );
//   };

//   // ===================================================
//   // TAB + FILTER MERGE
//   // ===================================================
//   const hasActiveFilters = Object.values(filters).some((v) => v !== "");

//   const filteredLeads = hasActiveFilters
//     ? leads
//     : leads.filter((l) => {
//         if (activeTab === "Pending")
//           return l.status !== "Won" && l.status !== "Lost";
//         return l.status === activeTab;
//       });

//   const pendingCount = leads.filter((l) => l.status === "Pending").length;
//   const wonCount = leads.filter((l) => l.status === "Won").length;
//   const lostCount = leads.filter((l) => l.status === "Lost").length;

//   // ===================================================
//   // PAGINATION
//   // ===================================================
//   // ================= PAGINATION =================

//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);

//   // Reset page when filters, tab, or items per page changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [filters, activeTab, itemsPerPage]);

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const paginatedLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

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

//   // ===================================================
//   // DYNAMIC DROPDOWNS
//   // ===================================================
//   const companyRef = useRef(null);

//   const [assignee, setAssignee] = useState([]);
//   const [leadSource, setLeadSource] = useState([]);
//   const [leadCategory, setLeadCategory] = useState([]);
//   const [category, setCategory] = useState([]);

//   useEffect(() => {
//     const fetchAssignee = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
//           params: { status: 1 },
//         });
//         const cleanedData = (res.data?.data || res.data || []).map((item) => ({
//           ...item,
//           name: item.name ? item.name.split(" ")[0] : "",
//         }));
//         setAssignee(cleanedData);
//       } catch (err) {
//         console.error("Failed to fetch names:", err);
//         setAssignee([]);
//       }
//     };
//     fetchAssignee();
//   }, []);

//   useEffect(() => {
//     const fetchSource = async () => {
//       try {
//         const res = await axios.get(
//           `${API_BASE}/api/inquiry-lead-source/read`,
//           {
//             params: { status: 1 },
//           },
//         );
//         setLeadSource(res.data);
//       } catch {}
//     };
//     fetchSource();
//   }, []);

//   useEffect(() => {
//     const fetchCategory = async () => {
//       try {
//         const res = await axios.get(
//           `${API_BASE}/api/inquiry-lead-category/read`,
//           {
//             params: { status: 1 },
//           },
//         );
//         setLeadCategory(res.data);
//       } catch {}
//     };
//     fetchCategory();
//   }, []);

//   useEffect(() => {
//     const fetchProductCategory = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/api/product-category/read`, {
//           params: { status: 1 },
//         });
//         setCategory(res.data);
//       } catch {}
//     };
//     fetchProductCategory();
//   }, []);

//   const isAdmin = checkRole(["Admin"]);

//   return (
//     <>
//       <Header />

//       <div className="bg-gray-100">
//         {/* Breadcrumb */}
//         <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
//           <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
//             <p className="flex items-center flex-wrap">
//               <Link
//                 href="/dashboard"
//                 className="mx-2 text-xl text-gray-400 hover:text-indigo-600"
//               >
//                 <i className="bi bi-house"></i>
//               </Link>
//               <i className="bi bi-chevron-right text-[10px]"></i>
//               <Link
//                 href="#"
//                 className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
//               >
//                 Sales
//               </Link>
//               <i className="bi bi-chevron-right text-[10px]"></i>
//               <Link
//                 href="/sales/lead"
//                 className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
//               >
//                 Lead
//               </Link>
//             </p>
//           </div>

//           <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
//             <div className="relative   w-1/2 sm:w-auto" ref={exportRef}>
//               <button
//                 onClick={() => setShowExportMenu((prev) => !prev)}
//                 className="flex items-center justify-center gap-2 bg-orange-50 text-orange-500 px-4 py-2 rounded-sm text-sm font-semibold tracking-wide transition-all shadow-sm"
//               >
//                 <i className="bi bi-download text-base"></i>
//                 Export
//                 <i
//                   className={`bi bi-chevron-down text-xs transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`}
//                 ></i>
//               </button>

//               {showExportMenu && (
//                 <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden z-50">
//                   <button
//                     onClick={exportToExcel}
//                     className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all"
//                   >
//                     <div className="w-7 h-7 rounded-sm flex items-center justify-center">
//                       <i className="bi bi-file-earmark-excel text-green-600 text-sm"></i>
//                     </div>
//                     Export Excel
//                   </button>
//                   <div className="h-px bg-gray-100 mx-3"></div>
//                   <button
//                     onClick={exportToPDF}
//                     className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all"
//                   >
//                     <div className="w-7 h-7 rounded-sm flex items-center justify-center">
//                       <i className="bi bi-file-earmark-pdf text-red-600 text-sm"></i>
//                     </div>
//                     Export PDF
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* ✅ CHANGED: opens Add Lead popup instead of navigating to /sales/lead/add-lead */}
//             <button
//               onClick={() => {
//                 resetAddLeadForm();
//                 setShowAddLeadModal(true);
//               }}
//               className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all cursor-pointer"
//             >
//               + ADD LEAD
//             </button>
//           </div>
//         </div>

//         {/* Mobile Filter Toggle */}
//         <div className="mx-6 mb-2 md:hidden mt-3 relative z-40">
//           <button
//             onClick={() => setShowMobileFilters(!showMobileFilters)}
//             className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all"
//           >
//             <span className="flex items-center gap-2">
//               <i className="bi bi-funnel"></i> Filters
//             </span>
//             <i
//               className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
//             ></i>
//           </button>
//         </div>

//         <div
//           className={`
//           ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
//           md:mx-6 md:mb-3 md:items-center md:gap-2 md:flex-wrap md:flex md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
//         `}
//         >
//           <input
//             name="company_name"
//             value={filters.company_name}
//             onChange={handleFilterChange}
//             ref={companyRef}
//             placeholder="Company Name"
//             className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  text-gray-600 text-sm outline-none"
//           />

//           <input
//             name="customer_name"
//             value={filters.customer_name}
//             onChange={handleFilterChange}
//             placeholder="Customer Name"
//             className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  text-gray-600 text-sm outline-none"
//           />

//           <input
//             name="reference"
//             value={filters.reference}
//             onChange={handleFilterChange}
//             placeholder="Enter Reference"
//             className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-600 text-sm"
//           />

//           {/* <select
//             name="product_category"
//             value={filters.product_category}
//             onChange={handleFilterChange}
//             className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-48  outline-none  text-gray-400 text-sm"
//           >
//             <option value="">Select Product Category</option>
//             {category.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
//           </select> */}

//           <select
//             name="source"
//             value={filters.source}
//             onChange={handleFilterChange}
//             className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
//           >
//             <option value="">Select Source</option>
//             {leadSource.map((item) => (
//               <option key={item.id} value={item.id}>
//                 {item.name}
//               </option>
//             ))}
//           </select>

//           <input
//             name="mobile_no"
//             value={filters.mobile_no}
//             onChange={handleFilterChange}
//             placeholder="Mobile No"
//             className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-600 text-sm"
//           />

//           <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
//             <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
//               From Next
//             </span>
//             <input
//               type="date"
//               name="from_followup"
//               value={filters.from_followup}
//               onChange={handleFilterChange}
//               className="p-1 w-full md:w-35 outline-none bg-transparent"
//             />
//           </div>

//           <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-53  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
//             <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
//               To Next
//             </span>
//             <input
//               type="date"
//               name="to_followup"
//               value={filters.to_followup}
//               onChange={handleFilterChange}
//               className="p-1 w-full md:w-35 outline-none bg-transparent"
//             />
//           </div>

//           <select
//             name="status"
//             value={filters.status}
//             onChange={handleFilterChange}
//             className="border p-1 bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
//           >
//             <option value="">Pending</option>
//             <option value="Won">Won</option>
//             <option value="Lost">Lost</option>
//           </select>

//           <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-60  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
//             <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
//               From Create
//             </span>
//             <input
//               type="date"
//               name="from_created"
//               value={filters.from_created}
//               onChange={handleFilterChange}
//               className="p-1 w-full md:w-35 outline-none bg-transparent"
//             />
//           </div>

//           <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
//             <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
//               To Create
//             </span>
//             <input
//               type="date"
//               name="to_created"
//               value={filters.to_created}
//               onChange={handleFilterChange}
//               className="p-1 w-full md:w-35 outline-none bg-transparent"
//             />
//           </div>

//           <div className="flex gap-2 col-span-2 md:col-span-1">
//             <button
//               onClick={() => {
//                 resetFilters();
//                 setShowMobileFilters(false);
//               }}
//               className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold"
//             >
//               Clear
//             </button>
//             <button
//               onClick={() => setShowMobileFilters(false)}
//               className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold"
//             >
//               Apply
//             </button>
//           </div>
//         </div>

//         {/* Tabs + Table */}
//         <div className="bg-white rounded-sm border border-gray-100 py-2 mx-7">
//           <div className="flex items-center gap-8 px-6 pt-4 border-b border-gray-100">
//             <button
//               onClick={() => setActiveTab("Pending")}
//               className={`pb-3 px-3 text-sm font-medium relative cursor-pointer transition-all ${activeTab === "Pending" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
//             >
//               Pending
//               <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
//                 {pendingCount}
//               </span>
//               {activeTab === "Pending" && (
//                 <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
//               )}
//             </button>

//             <button
//               onClick={() => setActiveTab("Won")}
//               className={`pb-3 text-sm font-medium cursor-pointer relative ${activeTab === "Won" ? "text-green-600" : "text-gray-500"}`}
//             >
//               Won
//               <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
//                 {wonCount}
//               </span>
//               {activeTab === "Won" && (
//                 <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>
//               )}
//             </button>

//             <button
//               onClick={() => setActiveTab("Lost")}
//               className={`pb-3 text-sm font-medium relative ${activeTab === "Lost" ? "text-red-600" : "text-gray-500"}`}
//             >
//               Lost
//               <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
//                 {lostCount}
//               </span>
//               {activeTab === "Lost" && (
//                 <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>
//               )}
//             </button>

//             {/* 🚦 Traffic Light Legend */}
//             <div className="ml-auto flex items-center gap-4 pb-3 text-xs text-gray-500">
//               <span className="flex items-center gap-1.5">
//                 <span
//                   style={{
//                     display: "inline-block",
//                     width: 8,
//                     height: 8,
//                     borderRadius: "50%",
//                     backgroundColor: "#22c55e",
//                   }}
//                 />
//                 On track
//               </span>
//               <span className="flex items-center gap-1.5">
//                 <span
//                   style={{
//                     display: "inline-block",
//                     width: 8,
//                     height: 8,
//                     borderRadius: "50%",
//                     backgroundColor: "#eab308",
//                   }}
//                 />
//                 24h no follow-up
//               </span>
//               <span className="flex items-center gap-1.5">
//                 <span
//                   style={{
//                     display: "inline-block",
//                     width: 8,
//                     height: 8,
//                     borderRadius: "50%",
//                     backgroundColor: "#ef4444",
//                   }}
//                 />
//                 48h+ overdue
//               </span>
//             </div>
//           </div>

//           <div className="p-4">
//             {loading ? (
//               <div className="text-center py-10 text-gray-400">Loading...</div>
//             ) : (
//               <div
//                 className="overflow-x-auto overflow-y-scroll max-h-[600px] custom-scroll"
//                 style={{ overflowX: "scroll" }}
//               >
//                 <table className="w-full text-sm">
//                   <thead>
//                     <tr className="bg-gray-50 border-b border-gray-100">
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         #
//                       </th>
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Company Name
//                       </th>
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Customer Name
//                       </th>
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Reference
//                       </th>
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Source
//                       </th>
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Mobile No
//                       </th>
//                       <th className="py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Next Follow Up
//                       </th>
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Created
//                       </th>
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Status
//                       </th>
//                       <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                         Action
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {filteredLeads.length > 0 ? (
//                       paginatedLeads.map((lead, index) => (
//                         <tr
//                           key={lead.lead_id}
//                           className="border-b border-gray-50 hover:bg-indigo-50/30 transition-all"
//                         >
//                           <td className="py-3 px-2">
//                             {(currentPage - 1) * itemsPerPage + index + 1}
//                           </td>

//                           <td className="font-medium px-2">
//                             <div className="flex items-center gap-2">
//                               {getTrafficDot(lead)}
//                               {lead.company_name}
//                             </div>
//                           </td>

//                           <td className="text-orange-500 cursor-pointer px-3">
//                             {lead.customer_name}
//                           </td>

//                           <td className="py-3 px-2 w-46 max-w-46 truncate">
//                             {lead.reference}
//                           </td>

//                           <td className="px-3">{lead.source}</td>

//                           <td className="py-2 px-4 text-start">
//                             {lead.mobile_no}
//                           </td>

//                           <td className="text-center">
//                             {lead.next_follow_up_date ? (
//                               <span
//                                 onClick={() => {
//                                   if (lead.status === "Pending")
//                                     openUpdateModal(lead);
//                                 }}
//                                 className={`${lead.status === "Pending" ? "cursor-pointer text-blue-800" : "text-gray-400 cursor-not-allowed"}`}
//                               >
//                                 {new Date(
//                                   lead.next_follow_up_date,
//                                 ).toLocaleDateString()}
//                               </span>
//                             ) : (
//                               <button
//                                 disabled={lead.status !== "Pending"}
//                                 onClick={() => {
//                                   if (lead.status !== "Pending") return;
//                                   setSelectedLead(lead);
//                                   setSelectedFiles([]);
//                                   setForm({
//                                     follow_up_date: new Date()
//                                       .toISOString()
//                                       .split("T")[0],
//                                     activity_type: "",
//                                     follow_up_by: "",
//                                     contact_person: "",
//                                     description: "",
//                                   });
//                                   setShowModal(true);
//                                 }}
//                                 className={`w-9 h-9 rounded-full border flex items-center justify-center mx-auto
//                                   ${lead.status === "Pending" ? "hover:bg-gray-100 cursor-pointer" : "bg-gray-100 cursor-not-allowed opacity-60"}`}
//                               >
//                                 <i className="bi bi-plus text-lg"></i>
//                               </button>
//                             )}
//                           </td>

//                           <td className="text-gray-500 px-2">
//                             {new Date(lead.created_at).toLocaleDateString()}
//                           </td>

//                           <td>
//                             <select
//                               value={lead.status}
//                               onMouseDown={(e) => {
//                                 if (
//                                   !isAdmin &&
//                                   (lead.status === "Won" ||
//                                     lead.status === "Lost")
//                                 ) {
//                                   e.preventDefault();
//                                   toast.error("Only Admin can change Status");
//                                 }
//                               }}
//                               onChange={(e) =>
//                                 handleStatusChange(lead.lead_id, e.target.value)
//                               }
//                               className={`border rounded-sm px-3 py-1 text-xs font-semibold outline-none cursor-pointer
//                                 ${lead.status === "Pending" ? "border-gray-200 bg-gray-50 text-gray-700" : ""}
//                                 ${lead.status === "Won" ? "border-green-200 bg-green-50 text-green-700" : ""}
//                                 ${lead.status === "Lost" ? "border-red-200 bg-red-50 text-red-700" : ""}
//                               `}
//                             >
//                               <option value="Pending">Pending</option>
//                               <option value="Won">Won</option>
//                               <option value="Lost">Lost</option>
//                             </select>
//                           </td>

//                           <td className="text-lg">
//                             <div className="flex items-center gap-2 flex-nowrap">
//                               {lead.status === "Pending" ? (
//                                 <>
//                                   <button
//                                     onClick={() => handleView(lead)}
//                                     className="text-gray-400 hover:text-green-600 cursor-pointer"
//                                   >
//                                     <i className="bi bi-eye text-xl"></i>
//                                   </button>

//                                   <button
//                                     onClick={() => handleEdit(lead)}
//                                     className="text-gray-400 hover:text-blue-800 cursor-pointer"
//                                   >
//                                     <i className="bi bi-pencil-square"></i>
//                                   </button>

//                                   <button
//                                     onClick={() => openDeleteModal(lead)}
//                                     className="text-gray-400 hover:text-red-600 cursor-pointer"
//                                   >
//                                     <i className="bi bi-trash3"></i>
//                                   </button>
//                                 </>
//                               ) : (
//                                 <span className="text-gray-300 cursor-not-allowed">
//                                   <i className="bi bi-lock text-lg"></i>
//                                 </span>
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td
//                           colSpan="10"
//                           className="text-center py-10 text-gray-400"
//                         >
//                           No Data Found
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>

//                 <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
//                   {/* Left side: Rows per page selector */}
//                   <div className="flex items-center gap-3">
//                     <span className="text-sm text-slate-500 font-medium">
//                       Rows per page:
//                     </span>
//                     <select
//                       value={itemsPerPage}
//                       onChange={(e) => {
//                         setItemsPerPage(Number(e.target.value));
//                         setCurrentPage(1);
//                       }}
//                       className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer font-medium"
//                     >
//                       {[10, 20, 100, 200].map((size) => (
//                         <option key={size} value={size}>
//                           {size}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Right side: Navigation buttons (only if totalPages > 1) */}
//                   {totalPages > 1 && (
//                     <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
//                       {/* Previous Button */}
//                       <button
//                         onClick={() =>
//                           setCurrentPage((prev) => Math.max(prev - 1, 1))
//                         }
//                         disabled={currentPage === 1}
//                         className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
//                       >
//                         <i className="bi bi-chevron-left text-sm"></i>
//                       </button>

//                       {/* Page Buttons */}
//                       <div className="flex items-center gap-1.5">
//                         {getSlidingPages().map((page) => (
//                           <button
//                             key={page}
//                             onClick={() => setCurrentPage(page)}
//                             className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
//                               currentPage === page
//                                 ? "bg-[#212121] text-white shadow-md shadow-black/10"
//                                 : "border border-slate-200 text-slate-600 hover:bg-slate-50"
//                             }`}
//                           >
//                             {page}
//                           </button>
//                         ))}
//                       </div>

//                       {/* Next Button */}
//                       <button
//                         onClick={() =>
//                           setCurrentPage((prev) =>
//                             Math.min(prev + 1, totalPages),
//                           )
//                         }
//                         disabled={currentPage === totalPages}
//                         className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
//                       >
//                         <i className="bi bi-chevron-right text-sm"></i>
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ===================================================
//           ✅ NEW: ADD LEAD MODAL (converted from add-lead page)
//           Same fields, validation & payload — UI adapted to popup
//       =================================================== */}
//       {showAddLeadModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
//           <div className="bg-white w-[720px] max-w-full rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
//             {/* Header */}
//             <div className="px-6 pt-5 pb-4 border-b border-gray-100">
//               <div className="flex justify-between items-start">
//                 <div className="flex items-center gap-3">
//                   <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
//                     <Plus size={20} className="text-white" />
//                   </span>
//                   <div>
//                     <h2 className="text-lg font-bold text-gray-900">
//                       Add Lead
//                     </h2>
//                     <p className="text-xs text-gray-500 mt-0.5">
//                       Fill in the details to create a new lead
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => {
//                     resetAddLeadForm();
//                     setShowAddLeadModal(false);
//                   }}
//                   className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 transition-all"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
//             </div>

//             {/* Body */}
//             <div className="px-6 py-5 overflow-y-auto">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
//                 {/* Company Name */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Company Name
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
//                       <Building2 size={16} className="text-blue-500" />
//                     </span>
//                     <input
//                       name="company_name"
//                       value={addLeadForm.company_name}
//                       placeholder="Company Name"
//                       onChange={handleAddLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>

//                 {/* Customer Name */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Customer Name <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
//                       <User size={16} className="text-violet-500" />
//                     </span>
//                     <input
//                       name="customer_name"
//                       value={addLeadForm.customer_name}
//                       placeholder="Customer Name"
//                       onChange={handleAddLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                   {addLeadErrors.customer_name && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {addLeadErrors.customer_name}
//                     </p>
//                   )}
//                 </div>

//                 {/* Mobile No. */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Mobile No.
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
//                       <Phone size={16} className="text-green-500" />
//                     </span>
//                     <input
//                       name="mobile_no"
//                       value={addLeadForm.mobile_no}
//                       placeholder="Mobile No."
//                       onChange={handleAddLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                   {addLeadErrors.mobile_no && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {addLeadErrors.mobile_no}
//                     </p>
//                   )}
//                 </div>

//                 {/* Source */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Source <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
//                       <Radio size={16} className="text-cyan-500" />
//                     </span>
//                     <select
//                       name="source"
//                       value={addLeadForm.source}
//                       onChange={handleAddLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">-- Select --</option>
//                       {leadSource.map((item) => (
//                         <option key={item.id} value={item.id}>
//                           {item.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   {addLeadErrors.source && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {addLeadErrors.source}
//                     </p>
//                   )}
//                 </div>

//                 {/* Reference */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Reference
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
//                       <Bookmark size={16} className="text-amber-500" />
//                     </span>
//                     <input
//                       type="text"
//                       name="reference"
//                       value={addLeadForm.reference}
//                       placeholder="Reference"
//                       onChange={handleAddLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                   {addLeadErrors.reference && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {addLeadErrors.reference}
//                     </p>
//                   )}
//                 </div>

//                 {/* Status */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Status
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
//                       <ShieldCheck size={16} className="text-green-500" />
//                     </span>
//                     <select
//                       name="status"
//                       value={addLeadForm.status}
//                       disabled
//                       className="w-full px-3 py-2 text-sm bg-transparent text-gray-400 cursor-not-allowed focus:outline-none"
//                     >
//                       <option>Qualified</option>
//                     </select>
//                   </div>
//                 </div>

//                 {/* Priority */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Priority
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span
//                       className={`flex items-center justify-center w-10 shrink-0 border-r border-gray-100 transition-colors duration-300 ${
//                         addLeadForm.priority === "High"
//                           ? "bg-red-50"
//                           : addLeadForm.priority === "Medium"
//                             ? "bg-amber-50"
//                             : addLeadForm.priority === "Low"
//                               ? "bg-green-50"
//                               : "bg-rose-50"
//                       }`}
//                     >
//                       <Star
//                         size={16}
//                         className={`transition-colors duration-300 ${
//                           addLeadForm.priority === "High"
//                             ? "text-red-500"
//                             : addLeadForm.priority === "Medium"
//                               ? "text-amber-500"
//                               : addLeadForm.priority === "Low"
//                                 ? "text-green-500"
//                                 : "text-rose-500"
//                         }`}
//                       />
//                     </span>
//                     <select
//                       name="priority"
//                       value={addLeadForm.priority}
//                       onChange={handleAddLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">-- Select --</option>
//                       <option>High</option>
//                       <option>Medium</option>
//                       <option>Low</option>
//                     </select>
//                   </div>
//                 </div>

//                 {/* Category */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Category
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
//                       <FolderOpen size={16} className="text-violet-500" />
//                     </span>
//                     <select
//                       name="category"
//                       value={addLeadForm.category}
//                       onChange={handleAddLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">-- Select --</option>
//                       {leadCategory.map((item) => (
//                         <option key={item.id} value={item.id}>
//                           {item.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Description */}
//               <div className="mt-3">
//                 <label className="block mb-1 text-sm font-medium text-gray-600">
//                   Description
//                 </label>
//                 <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                   <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
//                     <FileText size={16} className="text-blue-500" />
//                   </span>
//                   <textarea
//                     name="description"
//                     rows="2"
//                     value={addLeadForm.description}
//                     onChange={handleAddLeadChange}
//                     placeholder="Enter description..."
//                     className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-y"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
//               <button
//                 type="button"
//                 onClick={() => {
//                   resetAddLeadForm();
//                   setShowAddLeadModal(false);
//                 }}
//                 className="px-6 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 bg-white"
//               >
//                 <X size={15} /> Cancel
//               </button>

//               <button
//                 type="button"
//                 onClick={handleAddLeadSubmit}
//                 disabled={addLeadSubmitting}
//                 className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${addLeadSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
//               >
//                 {addLeadSubmitting ? (
//                   <svg
//                     className="animate-spin h-4 w-4"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                   >
//                     <circle
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="white"
//                       strokeWidth="4"
//                       opacity="0.25"
//                     />
//                     <path
//                       fill="white"
//                       d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                     />
//                   </svg>
//                 ) : (
//                   <>
//                     <Save size={15} /> Save
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ===================================================
//           ✅ NEW: EDIT LEAD MODAL (converted from update-lead page)
//           Same fields, validation & payload — UI adapted to popup
//       =================================================== */}
//       {showEditLeadModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
//           <div className="bg-white w-[720px] max-w-full rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
//             {/* Header */}
//             <div className="px-6 pt-5 pb-4 border-b border-gray-100">
//               <div className="flex justify-between items-start">
//                 <div className="flex items-center gap-3">
//                   <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
//                     <Pencil size={20} className="text-white" />
//                   </span>
//                   <div>
//                     <h2 className="text-lg font-bold text-gray-900">
//                       Edit Lead
//                     </h2>
//                     <p className="text-xs text-gray-500 mt-0.5">
//                       Update the details of this lead
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setShowEditLeadModal(false)}
//                   className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 transition-all"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
//             </div>

//             {/* Body */}
//             <div className="px-6 py-5 overflow-y-auto">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
//                 {/* Company Name */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Company Name
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
//                       <Building2 size={16} className="text-blue-500" />
//                     </span>
//                     <input
//                       name="company_name"
//                       value={editLeadForm.company_name}
//                       placeholder="Company Name"
//                       onChange={handleEditLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>

//                 {/* Customer Name */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Customer Name <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
//                       <User size={16} className="text-violet-500" />
//                     </span>
//                     <input
//                       name="customer_name"
//                       value={editLeadForm.customer_name}
//                       placeholder="Customer Name"
//                       onChange={handleEditLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>

//                 {/* Mobile No. */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Mobile No.
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
//                       <Phone size={16} className="text-green-500" />
//                     </span>
//                     <input
//                       name="mobile_no"
//                       value={editLeadForm.mobile_no}
//                       placeholder="Mobile No."
//                       onChange={handleEditLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>

//                 {/* Source */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Source <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
//                       <Radio size={16} className="text-cyan-500" />
//                     </span>
//                     <select
//                       name="source"
//                       value={editLeadForm.source}
//                       onChange={handleEditLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">-- Select --</option>
//                       {leadSource.map((item) => (
//                         <option key={item.id} value={item.id}>
//                           {item.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 {/* Reference */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Reference
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
//                       <Bookmark size={16} className="text-amber-500" />
//                     </span>
//                     <input
//                       type="text"
//                       name="reference"
//                       value={editLeadForm.reference}
//                       placeholder="Reference"
//                       onChange={handleEditLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
//                     />
//                   </div>
//                 </div>

//                 {/* Status */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Status
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span
//                       className={`flex items-center justify-center w-10 shrink-0 border-r border-gray-100 transition-colors duration-300 ${
//                         editLeadForm.status === "Lost"
//                           ? "bg-red-50"
//                           : editLeadForm.status === "Pending"
//                             ? "bg-amber-50"
//                             : editLeadForm.status === "Quotation Send"
//                               ? "bg-blue-50"
//                               : editLeadForm.status === "Technical Discussion"
//                                 ? "bg-violet-50"
//                                 : editLeadForm.status === "Call Initiated"
//                                   ? "bg-cyan-50"
//                                   : "bg-green-50"
//                       }`}
//                     >
//                       <ShieldCheck
//                         size={16}
//                         className={`transition-colors duration-300 ${
//                           editLeadForm.status === "Lost"
//                             ? "text-red-500"
//                             : editLeadForm.status === "Pending"
//                               ? "text-amber-500"
//                               : editLeadForm.status === "Quotation Send"
//                                 ? "text-blue-500"
//                                 : editLeadForm.status === "Technical Discussion"
//                                   ? "text-violet-500"
//                                   : editLeadForm.status === "Call Initiated"
//                                     ? "text-cyan-500"
//                                     : "text-green-500"
//                         }`}
//                       />
//                     </span>
//                     <select
//                       name="status"
//                       value={editLeadForm.status}
//                       onChange={handleEditLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">-- Select --</option>
//                       <option>Qualified</option>
//                       <option>Pending</option>
//                       <option>Won</option>
//                       <option>Lost</option>
//                       <option>Quotation Send</option>
//                       <option>Technical Discussion</option>
//                       <option>Call Initiated</option>
//                     </select>
//                   </div>
//                 </div>

//                 {/* Priority */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Priority <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span
//                       className={`flex items-center justify-center w-10 shrink-0 border-r border-gray-100 transition-colors duration-300 ${
//                         editLeadForm.priority === "High"
//                           ? "bg-red-50"
//                           : editLeadForm.priority === "Medium"
//                             ? "bg-amber-50"
//                             : editLeadForm.priority === "Low"
//                               ? "bg-green-50"
//                               : "bg-rose-50"
//                       }`}
//                     >
//                       <Star
//                         size={16}
//                         className={`transition-colors duration-300 ${
//                           editLeadForm.priority === "High"
//                             ? "text-red-500"
//                             : editLeadForm.priority === "Medium"
//                               ? "text-amber-500"
//                               : editLeadForm.priority === "Low"
//                                 ? "text-green-500"
//                                 : "text-rose-500"
//                         }`}
//                       />
//                     </span>
//                     <select
//                       name="priority"
//                       value={editLeadForm.priority}
//                       onChange={handleEditLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">-- Select --</option>
//                       <option>High</option>
//                       <option>Medium</option>
//                       <option>Low</option>
//                     </select>
//                   </div>
//                 </div>

//                 {/* Category */}
//                 <div>
//                   <label className="block mb-1 text-sm font-medium text-gray-600">
//                     Category
//                   </label>
//                   <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                     <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
//                       <FolderOpen size={16} className="text-violet-500" />
//                     </span>
//                     <select
//                       name="category"
//                       value={editLeadForm.category}
//                       onChange={handleEditLeadChange}
//                       className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
//                     >
//                       <option value="">-- Select --</option>
//                       {leadCategory.map((item) => (
//                         <option key={item.id} value={item.id}>
//                           {item.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Description */}
//               <div className="mt-3">
//                 <label className="block mb-1 text-sm font-medium text-gray-600">
//                   Description
//                 </label>
//                 <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
//                   <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
//                     <FileText size={16} className="text-blue-500" />
//                   </span>
//                   <textarea
//                     name="description"
//                     rows="2"
//                     value={editLeadForm.description}
//                     onChange={handleEditLeadChange}
//                     placeholder="Enter description..."
//                     className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-y"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
//               <button
//                 type="button"
//                 onClick={() => setShowEditLeadModal(false)}
//                 className="px-6 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 bg-white"
//               >
//                 <X size={15} /> Cancel
//               </button>

//               <button
//                 type="button"
//                 onClick={handleEditLeadSubmit}
//                 disabled={editLeadSubmitting}
//                 className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${editLeadSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
//               >
//                 {editLeadSubmitting ? (
//                   <svg
//                     className="animate-spin h-4 w-4"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                   >
//                     <circle
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="white"
//                       strokeWidth="4"
//                       opacity="0.25"
//                     />
//                     <path
//                       fill="white"
//                       d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                     />
//                   </svg>
//                 ) : (
//                   <>
//                     <Save size={15} /> Save Changes
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* DELETE MODAL */}
//       {showDeleteModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
//           <div className="bg-white w-full max-w-md rounded-[20px] shadow-xl overflow-hidden">
//             <div
//               className="flex justify-between items-center px-6 py-4"
//               style={{ background: "#f5e6d8" }}
//             >
//               <div className="flex items-center gap-2">
//                 <span
//                   className="w-2.5 h-2.5 rounded-full"
//                   style={{ background: "#f07400" }}
//                 ></span>
//                 <h2 className="text-[13px] font-bold text-gray-600 tracking-widest uppercase">
//                   Delete Lead
//                 </h2>
//               </div>
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 className="text-[#f07400] hover:text-orange-600"
//               >
//                 <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
//                   <line
//                     x1="2"
//                     y1="2"
//                     x2="16"
//                     y2="16"
//                     stroke="#f07400"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                   />
//                   <line
//                     x1="16"
//                     y1="2"
//                     x2="2"
//                     y2="16"
//                     stroke="#f07400"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                   />
//                 </svg>
//               </button>
//             </div>
//             <div className="px-7 pt-9 pb-5 text-center">
//               <div
//                 className="w-[78px] h-[78px] mx-auto rounded-full flex items-center justify-center mb-5"
//                 style={{ background: "#f5e0c6" }}
//               >
//                 <svg width="32" height="34" viewBox="0 0 32 34" fill="none">
//                   <path
//                     d="M3 8H29"
//                     stroke="#f07400"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                   />
//                   <path
//                     d="M12 8V5C12 4.448 12.448 4 13 4H19C19.552 4 20 4.448 20 5V8"
//                     stroke="#f07400"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                   />
//                   <path
//                     d="M5 8L6.5 29C6.5 29.552 6.948 30 7.5 30H24.5C25.052 30 25.5 29.552 25.5 29L27 8"
//                     stroke="#f07400"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                   />
//                   <path
//                     d="M12 14V24"
//                     stroke="#f07400"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                   />
//                   <path
//                     d="M20 14V24"
//                     stroke="#f07400"
//                     strokeWidth="2"
//                     strokeLinecap="round"
//                   />
//                 </svg>
//               </div>
//               <h3 className="text-[17px] font-bold text-gray-800 tracking-widest uppercase mb-2">
//                 {leadToDelete?.customer_name || "DELETE LEAD"}
//               </h3>
//               <p className="text-[13px] text-gray-400">
//                 This action cannot be undone. Are you sure?
//               </p>
//             </div>

//             <div className="flex gap-3.5 px-7 pb-8 pt-2">
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 className="flex-1 border border-gray-200 py-3 rounded-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition text-[15px] font-medium"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDelete}
//                 disabled={deleteLoading}
//                 className="flex-1 py-3 rounded-xl text-white text-[15px] font-semibold hover:opacity-90 transition"
//                 style={{ background: "#f07400" }}
//               >
//                 {deleteLoading ? "Deleting..." : "Delete"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ADD FOLLOW-UP MODAL */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
//           <div className="bg-white w-[480px] max-w-full rounded-2xl shadow-2xl overflow-hidden max-h-[91vh] flex flex-col">
//             {/* Header */}
//             <div className="px-6 pt-5 pb-4 border-b border-gray-100">
//               <div className="flex justify-between items-start">
//                 <div className="flex items-center gap-3">
//                   <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
//                     <CalendarDays size={20} className="text-white" />
//                   </span>
//                   <div>
//                     <h2 className="text-lg font-bold text-gray-900">
//                       Add Lead Activities
//                     </h2>
//                     {/* <p className="text-xs text-gray-500 mt-0.5">
//                       Capture follow-up activities and stay on top of your
//                       leads
//                     </p> */}
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setShowModal(false)}
//                   className="w-8 h-8 flex items-center justify-center rounded-full  text-indigo-600 transition-all"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>
//             </div>

//             <div className="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4 overflow-y-auto">
//               {/* Follow-Up Date */}
//               <div className="col-span-1">
//                 <div className="flex items-center gap-2 mb-1.5">
//                   <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
//                     <CalendarDays size={14} className="text-blue-500" />
//                   </span>
//                   <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
//                     Follow-Up Date <span className="text-red-500">*</span>
//                   </label>
//                 </div>
//                 <input
//                   type="date"
//                   name="follow_up_date"
//                   value={form.follow_up_date}
//                   onChange={handleChange}
//                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
//                 />
//               </div>

//               {/* Activity Type */}
//               <div className="col-span-1">
//                 <div className="flex items-center gap-2 mb-1.5">
//                   <span
//                     className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300 ${
//                       form.activity_type === "Call"
//                         ? "bg-green-50"
//                         : form.activity_type === "Meeting"
//                           ? "bg-blue-50"
//                           : form.activity_type === "Email"
//                             ? "bg-violet-50"
//                             : "bg-emerald-50"
//                     }`}
//                   >
//                     <ListChecks
//                       size={14}
//                       className={`transition-colors duration-300 ${
//                         form.activity_type === "Call"
//                           ? "text-green-500"
//                           : form.activity_type === "Meeting"
//                             ? "text-blue-500"
//                             : form.activity_type === "Email"
//                               ? "text-violet-500"
//                               : "text-emerald-500"
//                       }`}
//                     />
//                   </span>
//                   <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
//                     Activity Type <span className="text-red-500">*</span>
//                   </label>
//                 </div>
//                 <select
//                   name="activity_type"
//                   value={form.activity_type}
//                   onChange={handleChange}
//                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
//                 >
//                   <option value="">-- Select Activity Type --</option>
//                   <option>Call</option>
//                   <option>Meeting</option>
//                   <option>Email</option>
//                 </select>
//               </div>

//               {/* Follow-Up By */}
//               <div className="col-span-1">
//                 <div className="flex items-center gap-2 mb-1.5">
//                   <span className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
//                     <User size={14} className="text-violet-500" />
//                   </span>
//                   <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
//                     Follow-Up By <span className="text-red-500">*</span>
//                   </label>
//                 </div>
//                 <select
//                   name="follow_up_by"
//                   value={form.follow_up_by}
//                   onChange={handleChange}
//                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
//                 >
//                   <option value="">Select User</option>
//                   {assignee.map((item) => (
//                     <option key={item.id} value={item.name}>
//                       {item.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Contact Person */}
//               <div className="col-span-1">
//                 <div className="flex items-center gap-2 mb-1.5">
//                   <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
//                     <UserRound size={14} className="text-amber-500" />
//                   </span>
//                   <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
//                     Contact Person <span className="text-red-500">*</span>
//                   </label>
//                 </div>
//                 <div className="flex">
//                   <input
//                     name="contact_person"
//                     value={form.contact_person}
//                     onChange={handleChange}
//                     placeholder="Enter contact person name"
//                     className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
//                   />
//                 </div>
//               </div>

//               {/* Description */}
//               <div className="col-span-2">
//                 <div className="flex items-center gap-2 mb-1.5">
//                   <span className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
//                     <FileText size={14} className="text-rose-500" />
//                   </span>
//                   <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
//                     Description <span className="text-red-500">*</span>
//                   </label>
//                 </div>
//                 <div className="relative">
//                   <textarea
//                     name="description"
//                     value={form.description}
//                     onChange={handleChange}
//                     placeholder="Enter description of the activity..."
//                     className="w-full border border-gray-200 rounded-lg px-3 py-2 pb-6 text-sm text-gray-700 outline-none bg-white h-24 resize-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
//                   />
//                   <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-400 font-medium">
//                     {(form.description || "").length}/500
//                   </span>
//                 </div>
//               </div>

//               {/* File Upload */}
//               <div className="col-span-2 border-2 border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50/30">
//                 <div
//                   onClick={() => setShowFileModal(true)}
//                   className="text-center cursor-pointer group"
//                 >
//                   <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-md shadow-indigo-200 group-hover:scale-110 transition-transform">
//                     <CloudUpload size={18} className="text-white" />
//                   </span>
//                   <p className="text-sm font-medium text-gray-700 mt-2">
//                     Drag &amp; drop files here or click to browse
//                   </p>
//                   <p className="text-xs text-gray-400 mt-1">
//                     Upload supporting documents or images (Max 5MB)
//                   </p>
//                   <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
//                     <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">
//                       JPG
//                     </span>
//                     <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">
//                       PNG
//                     </span>
//                     <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
//                       PDF
//                     </span>
//                     <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold">
//                       XLSX
//                     </span>
//                     <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">
//                       DWG
//                     </span>
//                   </div>
//                 </div>
//                 {selectedFiles.length > 0 && (
//                   <div className="mt-3 space-y-1 text-left">
//                     {selectedFiles.map((file, index) => (
//                       <div
//                         key={index}
//                         className="flex justify-between items-center bg-white px-3 py-1.5 text-xs rounded-lg border border-indigo-100 shadow-sm"
//                       >
//                         <span className="text-gray-600 truncate">
//                           {file.name}
//                         </span>
//                         <button
//                           onClick={() =>
//                             setSelectedFiles(
//                               selectedFiles.filter((_, i) => i !== index),
//                             )
//                           }
//                           className="text-red-400 hover:text-red-600 ml-2"
//                         >
//                           <X size={13} />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="px-5 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2 bg-white"
//               >
//                 <X size={15} /> Cancel
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={btnLoading}
//                 className={`px-6 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-md shadow-indigo-200 flex items-center gap-2
//   ${
//     btnLoading
//       ? "bg-indigo-400 cursor-not-allowed"
//       : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-800"
//   }`}
//               >
//                 {btnLoading ? (
//                   <>
//                     <svg
//                       className="animate-spin h-4 w-4"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                     >
//                       <circle
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="white"
//                         strokeWidth="4"
//                         opacity="0.25"
//                       />
//                       <path
//                         fill="white"
//                         d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                       />
//                     </svg>
//                     Adding...
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle2 size={15} /> Add Activity
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       {/* UPDATE FOLLOW-UP MODAL */}
//       {showUpdateModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
//           <div className="bg-white w-full max-w-[600px] rounded-sm shadow-xl border border-gray-100 overflow-hidden">
//             <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white">
//               <div className="flex items-center gap-2">
//                 <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
//                 <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
//                   Update Lead Activities
//                 </h2>
//               </div>
//               <button
//                 onClick={() => {
//                   setShowUpdateModal(false);
//                   setSelectedFiles([]);
//                   setPreviewFollowUp(null);
//                 }}
//                 className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="flex">
//               <div className="w-1/2 px-6 py-5 border-r border-gray-100">
//                 <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
//                   Add New Follow-Up
//                 </p>
//                 <div className="grid grid-cols-2 gap-x-4 gap-y-3">
//                   <div>
//                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                       Follow-Up Date
//                     </label>
//                     <input
//                       type="date"
//                       value={updateForm.follow_up_date}
//                       onChange={(e) =>
//                         setUpdateForm({
//                           ...updateForm,
//                           follow_up_date: e.target.value,
//                         })
//                       }
//                       className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                       Activity Type *
//                     </label>
//                     <select
//                       value={updateForm.activity_type}
//                       onChange={(e) =>
//                         setUpdateForm({
//                           ...updateForm,
//                           activity_type: e.target.value,
//                         })
//                       }
//                       className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
//                     >
//                       <option value="">-- Select --</option>
//                       <option>Call</option>
//                       <option>Meeting</option>
//                       <option>Email</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                       Follow-Up By
//                     </label>
//                     <select
//                       value={updateForm.follow_up_by}
//                       onChange={(e) =>
//                         setUpdateForm({
//                           ...updateForm,
//                           follow_up_by: e.target.value,
//                         })
//                       }
//                       className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
//                     >
//                       <option value="">Select User</option>
//                       {assignee.map((item) => (
//                         <option key={item.id} value={item.name}>
//                           {item.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                       Contact Person *
//                     </label>
//                     <input
//                       value={updateForm.contact_person}
//                       onChange={(e) =>
//                         setUpdateForm({
//                           ...updateForm,
//                           contact_person: e.target.value,
//                         })
//                       }
//                       className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
//                     />
//                   </div>
//                   <div className="col-span-2">
//                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                       Description *
//                     </label>
//                     <textarea
//                       value={updateForm.description}
//                       onChange={(e) =>
//                         setUpdateForm({
//                           ...updateForm,
//                           description: e.target.value,
//                         })
//                       }
//                       className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50 h-20 resize-none"
//                     />
//                   </div>
//                   <div className="col-span-2 border-2 border-dashed border-orange-300 rounded-xl p-3 text-center bg-orange-50/40">
//                     <button
//                       onClick={() => setShowFileModal(true)}
//                       className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all shadow-md shadow-orange-200"
//                     >
//                       <i className="bi bi-cloud-upload"></i> Browse Files
//                     </button>
//                     {selectedFiles.length > 0 && (
//                       <div className="mt-2 space-y-1 text-left">
//                         {selectedFiles.map((file, index) => (
//                           <div
//                             key={index}
//                             className="flex justify-between items-center bg-white px-3 py-1 text-xs rounded-lg border border-gray-100 shadow-sm"
//                           >
//                             <span className="text-gray-600 truncate">
//                               {file.name}
//                             </span>
//                             <button
//                               onClick={() =>
//                                 setSelectedFiles(
//                                   selectedFiles.filter((_, i) => i !== index),
//                                 )
//                               }
//                               className="text-orange-400 hover:text-orange-600 ml-2"
//                             >
//                               ✕
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                     <p className="text-xs text-gray-400 mt-1.5">
//                       Max 5MB · JPG, PNG, PDF, XLSX, DWG
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="w-1/2 px-6 py-5 flex flex-col">
//                 <div className="flex justify-between items-center mb-4">
//                   <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
//                     Follow-Up History
//                   </p>
//                   <span className="text-xs bg-orange-50 text-orange-500 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
//                     {followUpHistory.length} record(s)
//                   </span>
//                 </div>
//                 <div className="space-y-2">
//                   {followUpHistory.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center py-8 text-gray-300">
//                       <i className="bi bi-clock-history text-3xl mb-2"></i>
//                       <p className="text-sm">No history found</p>
//                     </div>
//                   ) : (
//                     followUpHistory.map((item, idx) => (
//                       <div
//                         key={item.follow_up_id}
//                         onClick={() =>
//                           setPreviewFollowUp(
//                             previewFollowUp?.follow_up_id === item.follow_up_id
//                               ? null
//                               : item,
//                           )
//                         }
//                         className={`border rounded-xl p-3 cursor-pointer transition-all select-none
//                           ${previewFollowUp?.follow_up_id === item.follow_up_id ? "border-orange-400 bg-orange-50 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
//                       >
//                         <div className="flex justify-between items-center">
//                           <div className="flex items-center gap-2">
//                             {idx === 0 && (
//                               <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
//                                 Latest
//                               </span>
//                             )}
//                             <p className="font-semibold text-sm text-gray-700">
//                               {item.activity_type}
//                             </p>
//                           </div>
//                           <div className="flex items-center gap-1.5">
//                             <span className="text-xs text-gray-400">
//                               {item.follow_up_date
//                                 ? new Date(
//                                     item.follow_up_date,
//                                   ).toLocaleDateString()
//                                 : "—"}
//                             </span>
//                             <i
//                               className={`bi ${previewFollowUp?.follow_up_id === item.follow_up_id ? "bi-chevron-up" : "bi-chevron-down"} text-gray-400 text-xs`}
//                             ></i>
//                           </div>
//                         </div>
//                         <p className="text-xs text-gray-400 mt-1 truncate">
//                           {item.description}
//                         </p>
//                       </div>
//                     ))
//                   )}
//                 </div>

//                 {previewFollowUp && (
//                   <div className="mt-4 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 text-sm shadow-sm">
//                     <div className="flex justify-between items-center mb-3">
//                       <p className="font-bold text-orange-500 text-xs uppercase tracking-wide">
//                         Details
//                       </p>
//                       <button
//                         onClick={() => setPreviewFollowUp(null)}
//                         className="text-gray-400 hover:text-gray-600 text-xs"
//                       >
//                         ✕ Close
//                       </button>
//                     </div>
//                     <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
//                       {[
//                         {
//                           label: "Activity Type",
//                           value: previewFollowUp.activity_type,
//                         },
//                         {
//                           label: "Follow-Up Date",
//                           value: previewFollowUp.follow_up_date
//                             ? new Date(
//                                 previewFollowUp.follow_up_date,
//                               ).toLocaleDateString()
//                             : "—",
//                         },
//                         {
//                           label: "Contact Person",
//                           value: previewFollowUp.contact_person,
//                         },
//                         {
//                           label: "Follow-Up By",
//                           value: previewFollowUp.follow_up_by,
//                         },
//                       ].map(({ label, value }) => (
//                         <div key={label}>
//                           <p className="text-xs text-gray-400 font-medium">
//                             {label}
//                           </p>
//                           <p className="font-semibold text-gray-700 text-sm mt-0.5">
//                             {value || "—"}
//                           </p>
//                         </div>
//                       ))}
//                       <div>
//                         <p className="text-xs text-gray-400 font-medium">
//                           Status
//                         </p>
//                         <span
//                           className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block
//                           ${previewFollowUp.status === "Completed" ? "bg-green-100 text-green-600" : previewFollowUp.status === "Cancelled" ? "bg-orange-100 text-orange-500" : "bg-orange-100 text-orange-600"}`}
//                         >
//                           {previewFollowUp.status}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="mt-2.5">
//                       <p className="text-xs text-gray-400 font-medium">
//                         Description
//                       </p>
//                       <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
//                         {previewFollowUp.description || "—"}
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
//               <button
//                 onClick={() => {
//                   setShowUpdateModal(false);
//                   setSelectedFiles([]);
//                   setPreviewFollowUp(null);
//                 }}
//                 className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleUpdate}
//                 disabled={updateLoading}
//                 className={`px-6 py-2 rounded-sm text-sm font-semibold text-white transition-all shadow-md shadow-orange-200 flex items-center gap-2
//                 ${updateLoading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}
//               >
//                 {updateLoading ? (
//                   <>
//                     <svg
//                       className="animate-spin h-4 w-4"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                     >
//                       <circle
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="white"
//                         strokeWidth="4"
//                         opacity="0.25"
//                       />
//                       <path
//                         fill="white"
//                         d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                       />
//                     </svg>
//                     Add Follow-Up
//                   </>
//                 ) : (
//                   "Add Follow-Up"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* STATUS CHANGE POPUP */}
//       {showPopup && (
//         <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center backdrop-blur-sm z-50">
//           <div className="bg-white rounded-lg shadow-lg p-6 w-80">
//             <h2 className="text-lg font-semibold mb-3 text-center">
//               Confirm Status Change
//             </h2>
//             <p className="text-sm text-gray-600 mb-5">
//               Are you sure you want to change status?
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowPopup(false)}
//                 className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmStatusChange}
//                 className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-orange-200"
//               >
//                 Yes Change
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* FILE UPLOAD MODAL */}
//       {showFileModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
//           <div className="bg-white w-[680px] max-w-full rounded-2xl shadow-2xl overflow-hidden h-[500px]  flex flex-col">
//             {/* Header */}
//             <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
//               <div className="flex items-center gap-3">
//                 <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
//                   <CloudUpload size={20} className="text-white" />
//                 </span>
//                 <div>
//                   <h2 className="text-lg font-bold text-gray-900">
//                     Upload Files
//                   </h2>
//                   {/* <p className="text-xs text-gray-500 mt-0.5">
//                     Attach files to this activity
//                   </p> */}
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowFileModal(false)}
//                 className="w-8 h-8 flex items-center justify-center   text-indigo-600  transition-all"
//               >
//                 <X size={16} />
//               </button>
//             </div>

//             <div className="flex gap-4 p-6 overflow-y-auto">
//               {/* Drop zone */}
//               <div
//                 className="w-1/2 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-indigo-50/30 hover:bg-indigo-50/60 transition-all cursor-pointer group"
//                 onDrop={handleDrop}
//                 onDragOver={(e) => e.preventDefault()}
//                 onClick={() => document.getElementById("fileInput").click()}
//               >
//                 <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
//                   <CloudUpload size={26} className="text-indigo-500" />
//                 </div>
//                 <p className="font-bold text-gray-800 text-sm">
//                   Drag &amp; Drop files here
//                 </p>
//                 <p className="text-xs text-gray-500 mt-1.5">
//                   or{" "}
//                   <span className="text-blue-600 font-semibold underline">
//                     browse files
//                   </span>
//                 </p>
//                 <div className="mt-4 bg-white border border-gray-100 rounded-lg px-4 py-2 shadow-sm">
//                   <p className="text-[11px] text-gray-400">Maximum file size</p>
//                   <p className="text-xs font-bold text-gray-700">
//                     5 MB per file
//                   </p>
//                 </div>
//                 <p className="text-[11px] text-gray-400 mt-3 mb-1.5">
//                   Supported formats:
//                 </p>
//                 <div className="flex items-center justify-center gap-1.5 flex-wrap">
//                   <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">
//                     JPG
//                   </span>
//                   <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">
//                     PNG
//                   </span>
//                   <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
//                     PDF
//                   </span>
//                   <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold">
//                     XLSX
//                   </span>
//                   <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">
//                     DWG
//                   </span>
//                 </div>
//                 <input
//                   id="fileInput"
//                   type="file"
//                   multiple
//                   className="hidden"
//                   onChange={handleSelect}
//                 />
//               </div>

//               {/* Selected files panel */}
//               <div className="w-1/2 border border-gray-100 rounded-xl p-4 flex flex-col">
//                 <p className="text-sm font-semibold text-gray-800 mb-3">
//                   Selected Files ({selectedFiles.length})
//                 </p>
//                 {selectedFiles.length === 0 ? (
//                   <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-b from-indigo-50/40 to-slate-50/40 rounded-xl py-10 px-4 text-center">
//                     <div className="relative mb-4">
//                       <div className="w-16 h-16 rounded-full bg-indigo-100/70 flex items-center justify-center">
//                         <FileText size={26} className="text-indigo-400" />
//                       </div>
//                       <Sparkles
//                         size={14}
//                         className="text-indigo-300 absolute -top-1 -right-3"
//                       />
//                       <Sparkles
//                         size={11}
//                         className="text-indigo-200 absolute bottom-0 -left-4"
//                       />
//                     </div>
//                     <p className="text-sm font-bold text-gray-800">
//                       No files selected yet
//                     </p>
//                     <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
//                       Choose files from the left
//                       <br />
//                       to get started
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-2 overflow-y-auto">
//                     {selectedFiles.map((file, i) => {
//                       // UI-only: icon color per file type
//                       const ext = (
//                         file.name.split(".").pop() || ""
//                       ).toLowerCase();
//                       const fileColors = {
//                         jpg: { bg: "bg-blue-50", icon: "text-blue-500" },
//                         jpeg: { bg: "bg-blue-50", icon: "text-blue-500" },
//                         png: { bg: "bg-green-50", icon: "text-green-500" },
//                         pdf: { bg: "bg-red-50", icon: "text-red-500" },
//                         xlsx: {
//                           bg: "bg-emerald-50",
//                           icon: "text-emerald-500",
//                         },
//                         xls: { bg: "bg-emerald-50", icon: "text-emerald-500" },
//                         dwg: { bg: "bg-amber-50", icon: "text-amber-500" },
//                         docx: {
//                           bg: "bg-violet-50",
//                           icon: "text-violet-500",
//                         },
//                         doc: { bg: "bg-violet-50", icon: "text-violet-500" },
//                       };
//                       const fc = fileColors[ext] || {
//                         bg: "bg-indigo-50",
//                         icon: "text-indigo-500",
//                       };

//                       return (
//                         <div
//                           key={i}
//                           className="flex justify-between items-center border border-gray-100 rounded-lg px-2 py-0.5 bg-gray-50/60 hover:bg-white hover:shadow-sm transition-all"
//                         >
//                           <div className="flex items-center gap-2 min-w-0">
//                             <div
//                               className={`w-8 h-8 rounded-lg ${fc.bg} flex items-center justify-center flex-shrink-0`}
//                             >
//                               <FileText size={14} className={fc.icon} />
//                             </div>
//                             <div className="min-w-0">
//                               <span className="text-sm text-gray-700 truncate block">
//                                 {file.name}
//                               </span>
//                               <span
//                                 className={`text-[9px] font-bold uppercase ${fc.icon}`}
//                               >
//                                 {ext}
//                               </span>
//                             </div>
//                           </div>
//                           <button
//                             onClick={() =>
//                               setSelectedFiles(
//                                 selectedFiles.filter((_, index) => index !== i),
//                               )
//                             }
//                             className="text-gray-300 hover:text-red-500 ml-2 flex-shrink-0 transition-all"
//                           >
//                             <X size={14} />
//                           </button>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="flex justify-between items-center gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
//               {/* <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex-1">
//                 <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
//                 {/* <p className="text-xs text-blue-600 leading-snug">
//                   <span className="font-semibold">
//                     You can upload multiple files at once.
//                   </span>
//                   <br />
//                   <span className="text-blue-500/80">
//                     All files will be attached to this activity.
//                   </span>
//                 </p> 
//               </div> */}
//               <button
//                 onClick={() => setShowFileModal(false)}
//                 className="bg-gradient-to-r ml-auto from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6  py-1.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 shrink-0"
//               >
//                 <CheckCircle2 size={15} /> Done
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* VIEW LEAD MODAL */}
//       {showViewModal && viewLead && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
//           <div className="bg-white w-full max-w-2xl border border-gray-100 rounded-sm shadow-2xl overflow-hidden">
//             <div className="from-orange-100 to-white px-6 py-3 flex items-center justify-between bg-gradient-to-r">
//               <div className="flex items-center gap-3">
//                 <div className="w-7 h-7 flex items-center justify-center">
//                   <i className="bi bi-person text-md text-orange-500"></i>
//                 </div>
//                 <div>
//                   <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
//                     {viewLead.customer_name || "—"}
//                   </p>
//                   <p className="text-gray-400 text-md">
//                     {viewLead.status || "—"}
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowViewModal(false)}
//                 className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
//               >
//                 <i className="bi bi-x-lg text-sm"></i>
//               </button>
//             </div>

//             <div className="p-6 grid grid-cols-2 gap-4">
//               {[
//                 {
//                   icon: "bi-building",
//                   label: "Company",
//                   value: viewLead.company_name,
//                 },
//                 {
//                   icon: "bi-person-circle",
//                   label: "Customer Name",
//                   value: viewLead.customer_name,
//                 },
//                 { icon: "bi-flag", label: "Source", value: viewLead.source },
//                 { icon: "bi-tag", label: "Category", value: viewLead.category },
//                 {
//                   icon: "bi-tag",
//                   label: "mobile no",
//                   value: viewLead.mobile_no,
//                 },
//                 {
//                   icon: "bi-person-check",
//                   label: "Assignee",
//                   value: viewLead.assignee,
//                 },
//                 {
//                   icon: "bi-calendar3",
//                   label: "Created",
//                   value: viewLead.created_at
//                     ? new Date(viewLead.created_at).toLocaleDateString()
//                     : "—",
//                 },
//               ].map(({ icon, label, value }) => (
//                 <div
//                   key={label}
//                   className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3"
//                 >
//                   <i className={`bi ${icon} text-orange-400 text-lg`}></i>
//                   <div>
//                     <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
//                       {label}
//                     </p>
//                     <p className="text-sm font-semibold text-gray-700">
//                       {value || "—"}
//                     </p>
//                   </div>
//                 </div>
//               ))}

//               <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
//                 <i className="bi bi-pencil text-orange-400 text-lg"></i>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
//                     Lead Title
//                   </p>
//                   <p className="text-sm font-semibold text-gray-700 break-words whitespace-normal">
//                     {viewLead.reference || "—"}
//                   </p>
//                 </div>
//               </div>

//               <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
//                 <i className="bi bi-chat-left-text text-orange-400 text-lg"></i>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
//                     Description
//                   </p>
//                   <p className="text-sm font-semibold text-gray-700 break-words whitespace-normal">
//                     {viewLead.description || "—"}
//                   </p>
//                 </div>
//               </div>

//               {viewLead.updated_by && (
//                 <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
//                   <i className="bi bi-person-gear text-orange-400 text-lg"></i>
//                   <div>
//                     <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
//                       Updated By
//                     </p>
//                     <p className="text-sm font-semibold text-gray-700">
//                       {viewLead.updated_by}
//                     </p>
//                   </div>
//                 </div>
//               )}

//               {viewLead.updated_at && (
//                 <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
//                   <i className="bi bi-clock-history text-orange-400 text-lg"></i>
//                   <div>
//                     <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
//                       Last Updated
//                     </p>
//                     <p className="text-sm font-semibold text-gray-700">
//                       {new Date(viewLead.updated_at).toLocaleString()}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="flex justify-end px-6 py-4 border-t border-gray-100">
//               <button
//                 onClick={() => setShowViewModal(false)}
//                 className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }


"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import Link from "next/link";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { checkRole } from "@/utils/checkRole";
import useAuth from "@/app/components/useAuth";
import { Sparkles } from "lucide-react";
import {
  CalendarDays, ListChecks, User, UserRound,
  FileText, CloudUpload, Info, X, CheckCircle2,
  Building2, Phone, Radio, Bookmark, ShieldCheck,
  Star, FolderOpen, Save, Plus, Pencil,
} from "lucide-react";
export default function Page() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ✅ FIXED: Separated status popup state — selectedLead always full object
  const [showPopup, setShowPopup] = useState(false);
  const [statusChangeLeadId, setStatusChangeLeadId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  // ✅ NEW: Lost reason popup states
  const [showLostReasonPopup, setShowLostReasonPopup] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [lostReasonError, setLostReasonError] = useState("");

  // ✅ NEW: View lost reason modal states
  const [showViewReasonModal, setShowViewReasonModal] = useState(false);
  const [viewReasonLead, setViewReasonLead] = useState(null);

  const [selectedLead, setSelectedLead] = useState(null);

  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [showModal, setShowModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [previewFollowUp, setPreviewFollowUp] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLead, setViewLead] = useState(null);

  // ===================================================
  // ✅ NEW: ADD LEAD POPUP STATE (moved from add-lead page)
  // ===================================================
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  // ✅ NEW: controls slide-in / slide-out animation for Add Lead drawer
  const [addLeadVisible, setAddLeadVisible] = useState(false);
  const [addLeadSubmitting, setAddLeadSubmitting] = useState(false);
  const [addLeadErrors, setAddLeadErrors] = useState({});
  const [addLeadForm, setAddLeadForm] = useState({
    company_name: "",
    customer_name: "",
    mobile_no: "",
    reference: "",
    source: "",
    status: "Qualified",
    priority: "",
    assignee: "",
    category: "",
    description: "",
  });

  // ===================================================
  // ✅ NEW: EDIT LEAD POPUP STATE (moved from update-lead page)
  // ===================================================
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  // ✅ NEW: controls slide-in / slide-out animation for Edit Lead drawer
  const [editLeadVisible, setEditLeadVisible] = useState(false);
  const [editLeadSubmitting, setEditLeadSubmitting] = useState(false);
  const [editLeadForm, setEditLeadForm] = useState({
    lead_id: "",
    company_name: "",
    customer_name: "",
    mobile_no: "",
    reference: "",
    source: "",
    status: "",
    priority: "",
    assignee: "",
    category: "",
    description: "",
  });

  const [updateForm, setUpdateForm] = useState({
    follow_up_date: "",
    activity_type: "",
    follow_up_by: "",
    contact_person: "",
    description: "",
  });

  const [form, setForm] = useState({
    follow_up_date: "",
    activity_type: "",
    follow_up_by: "",
    contact_person: "",
    description: "",
  });

  useAuth();

  const getToken = () => localStorage.getItem("token");

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/lead/read`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const formatted = (res.data?.result || []).map((item) => {
        let finalStatus = "Pending";
        if (item.status === "Won") finalStatus = "Won";
        else if (item.status === "Lost") finalStatus = "Lost";
        return { ...item, status: finalStatus };
      });

      setLeads(formatted);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===================================================
  // ✅ NEW: SLIDE IN / SLIDE OUT ANIMATION CONTROLLERS
  // ===================================================
  // Add Lead drawer: when opened, flip "visible" on next tick so the
  // transform transition animates from translate-x-full -> translate-x-0.
  useEffect(() => {
    let t;
    if (showAddLeadModal) {
      t = setTimeout(() => setAddLeadVisible(true), 10);
    } else {
      setAddLeadVisible(false);
    }
    return () => clearTimeout(t);
  }, [showAddLeadModal]);

  // Edit Lead drawer: same pattern
  useEffect(() => {
    let t;
    if (showEditLeadModal) {
      t = setTimeout(() => setEditLeadVisible(true), 10);
    } else {
      setEditLeadVisible(false);
    }
    return () => clearTimeout(t);
  }, [showEditLeadModal]);

  // Closing helpers: flip visible -> false first (plays slide-out),
  // then unmount the modal after the transition duration (300ms).
  const closeAddLeadModal = () => {
    setAddLeadVisible(false);
    setTimeout(() => setShowAddLeadModal(false), 300);
  };

  const closeEditLeadModal = () => {
    setEditLeadVisible(false);
    setTimeout(() => setShowEditLeadModal(false), 300);
  };

  // ===================================================
  // ✅ NEW: ADD LEAD HANDLERS (same logic as add-lead page)
  // ===================================================
  const handleAddLeadChange = (e) => {
    let { name, value } = e.target;
    if (name === "mobile_no") {
      value = value.replace(/[^0-9]/g, "").slice(0, 10);
    }
    setAddLeadForm((prev) => ({ ...prev, [name]: value }));
    if (addLeadErrors[name])
      setAddLeadErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateAddLead = () => {
    const newErrors = {};
    if (!addLeadForm.customer_name.trim())
      newErrors.customer_name = "Customer Name is required";
    if (!addLeadForm.reference.trim())
      newErrors.reference = "Lead Title is required";
    if (!addLeadForm.source) newErrors.source = "Source is required";
    if (addLeadForm.mobile_no && addLeadForm.mobile_no.length !== 10) {
      newErrors.mobile_no = "Mobile number must be exactly 10 digits";
    }
    return newErrors;
  };

  const resetAddLeadForm = () => {
    setAddLeadForm({
      company_name: "",
      customer_name: "",
      mobile_no: "",
      reference: "",
      source: "",
      status: "Qualified",
      priority: "",
      assignee: "",
      category: "",
      description: "",
    });
    setAddLeadErrors({});
  };

  const handleAddLeadSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateAddLead();
    setAddLeadErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.mobile_no && Object.keys(newErrors).length === 1) {
        toast.error(newErrors.mobile_no);
      } else {
        toast.error("Please fill all required fields and correct any errors");
      }
      return;
    }

    try {
      setAddLeadSubmitting(true);
      const token = getToken();

      const payload = {
        ...addLeadForm,
        source: addLeadForm.source || null,
        mobile_no: addLeadForm.mobile_no || null,
        priority: addLeadForm.priority || null,
        category: addLeadForm.category || null,
      };

      const res = await axios.post(`${API_BASE}/api/lead/insert`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data && res.data.success) {
        toast.success("Lead added successfully!");
        resetAddLeadForm();
        closeAddLeadModal(); // ✅ slide-out then close instead of instant close
        fetchLeads(); // ✅ refresh list instead of router.push
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
      setAddLeadSubmitting(false);
    }
  };

  // ===================================================
  // ✅ NEW: EDIT LEAD HANDLERS (moved from update-lead page)
  // ===================================================
  const handleEditLeadChange = (e) => {
    let { name, value } = e.target;
    if (name === "mobile_no") {
      value = value.replace(/[^0-9]/g, "").slice(0, 10);
    }
    setEditLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditLeadSubmit = async (e) => {
    e.preventDefault();

    if (!editLeadForm.lead_id) {
      toast.error("Lead ID missing. Cannot update.");
      return;
    }

    try {
      setEditLeadSubmitting(true);
      const token = getToken();

      const res = await axios.put(
        `${API_BASE}/api/lead/update/${editLeadForm.lead_id}`,
        {
          company_name: editLeadForm.company_name,
          customer_name: editLeadForm.customer_name,
          mobile_no: editLeadForm.mobile_no || null,
          reference: editLeadForm.reference,
          source: editLeadForm.source,
          status: editLeadForm.status,
          priority: editLeadForm.priority,
          assignee: editLeadForm.assignee,
          category: editLeadForm.category,
          description: editLeadForm.description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        toast.success("Lead Updated Successfully");
        closeEditLeadModal(); // ✅ slide-out then close instead of instant close
        fetchLeads();
      } else {
        toast.error(res.data.message || "Update Failed");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Something went wrong");
    } finally {
      setEditLeadSubmitting(false);
    }
  };

  // ===================================================
  // EXPORT TO EXCEL
  // ===================================================
  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const exportData = filteredLeads.map((lead, index) => ({
        "No.": index + 1,
        "Company Name": lead.company_name || "",
        "Customer Name": lead.customer_name || "",
        "Lead Title": lead.reference || "",
        Source: lead.source || "",
        Assignee: lead.assignee || "",
        "Next Follow Up": lead.next_follow_up_date
          ? new Date(lead.next_follow_up_date).toLocaleDateString()
          : "",
        "Created At": lead.created_at
          ? new Date(lead.created_at).toLocaleDateString()
          : "",
        Status: lead.status || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet["!cols"] = colWidths;

      const now = new Date();
      const date = now.toISOString().split("T")[0];2
      const time = now.toTimeString().slice(0, 5);
      const fileName = `Leads_${activeTab}_(${date})_${time}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success("Excel exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.log(err);
      toast.error("Excel export failed");
    }
  };

  // ===================================================
  // EXPORT TO PDF
  // ===================================================
  const exportToPDF = async () => {``
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`Leads Report - ${activeTab}`, 14, 15);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Exported on: ${new Date().toLocaleDateString("en-GB")}   |   Total Records: ${filteredLeads.length}`,
        14,
        22,
      );

      const tableData = filteredLeads.map((lead, index) => [
        index + 1,
        lead.company_name || "",
        lead.customer_name || "",
        lead.reference || "",
        lead.source || "",
        lead.assignee || "",
        lead.next_follow_up_date
          ? new Date(lead.next_follow_up_date).toLocaleDateString()
          : "",
        lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "",
        lead.status || "",
      ]);

      autoTable(doc, {
        startY: 27,
        head: [
          [
            "#",
            "Company",
            "Customer",
            "Lead Title",
            "Product Cat.",
            "Source",
            "Assignee",
            "Next Follow Up",
            "Created",
            "Status",
          ],
        ],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        columnStyles: {
          0: { cellWidth: 8 },
          3: { cellWidth: 35 },
          9: { cellWidth: 20 },
        },
      });

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5).replace("_", "-");
      const fileName = `Leads_${activeTab}_(${date})_${time}.pdf`;

      doc.save(fileName);
      toast.success("PDF exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.log(err);
      toast.error("PDF export failed");
    }
  };

  // ===================================================
  // FILE HANDLING
  // ===================================================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleSelect({ target: { files: e.dataTransfer.files, value: "" } });
  };

  const MAX_FILES = 5;
  const IMAGE_EXT = ["jpg", "jpeg", "png"];
  const DOC_EXT = ["pdf", "xlsx", "dwg"];
  const MAX_IMG_SIZE = 5 * 1024 * 1024;
  const MAX_DOC_SIZE = 5 * 1024 * 1024;

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);
    let updatedFiles = [...selectedFiles];
    let remainingSlots = MAX_FILES - updatedFiles.length;

    if (remainingSlots <= 0) {
      toast.error("You can upload only 5 files");
      e.target.value = "";
      return;
    }

    for (let file of files) {
      if (remainingSlots <= 0) {
        toast.error("Maximum 5 files allowed");
        break;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      const isDuplicate = updatedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (isDuplicate) {
        toast.error("Duplicate file not allowed");
        continue;
      }
      if (![...IMAGE_EXT, ...DOC_EXT].includes(ext)) {
        toast.error("Unsupported File");
        continue;
      }
      if (IMAGE_EXT.includes(ext) && file.size > MAX_IMG_SIZE) {
        toast.error("Image must be under 2MB");
        continue;
      }
      if (DOC_EXT.includes(ext) && file.size > MAX_DOC_SIZE) {
        toast.error("Document must be under 15MB");
        continue;
      }
      updatedFiles.push(file);
      remainingSlots--;
    }

    setSelectedFiles(updatedFiles);
    e.target.value = "";
  };

  // ===================================================
  // ADD FOLLOW-UP (first time)
  // ===================================================
  const handleSubmit = async () => {
    try {
      if (!form.activity_type || !form.contact_person || !form.description) {
        toast.error("Please fill all required fields");
        return;
      }

      setBtnLoading(true);

      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (key !== "files") formData.append(key, form[key]);
      });
      formData.append("lead_id", selectedLead.lead_id);
      formData.append("status", "Pending");
      formData.append("remarks", "");

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => formData.append("files", file));
      }

      await axios.post(`${API_BASE}/api/lead-follow-up/insert`, formData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      toast.success("Follow-up added");
      setShowModal(false);
      setSelectedFiles([]);
      fetchLeads();
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    } finally {
      setBtnLoading(false);
    }
  };

  // ===================================================
  // OPEN UPDATE MODAL
  // ===================================================
  const openUpdateModal = async (lead) => {
    setSelectedLead(lead);
    setShowUpdateModal(true);
    setFollowUpHistory([]);
    setPreviewFollowUp(null);
    setSelectedFiles([]);

    setUpdateForm({
      follow_up_date: new Date().toISOString().split("T")[0],
      activity_type: "",
      follow_up_by: "",
      contact_person: "",
      description: "",
    });

    try {
      const res = await axios.get(
        `${API_BASE}/api/lead-follow-up/history/${lead.lead_id}`,
      );
      setFollowUpHistory(res.data?.result || []);
    } catch (err) {
      console.log(err);
    }
  };

  // ===================================================
  // ADD FOLLOW-UP (update modal)
  // ===================================================
  const handleUpdate = async () => {
    try {
      if (
        !updateForm.activity_type ||
        !updateForm.contact_person ||
        !updateForm.description
      ) {
        toast.error("Please fill all required fields");
        return;
      }

      setUpdateLoading(true);

      const formData = new FormData();
      formData.append("lead_id", selectedLead.lead_id);
      formData.append("follow_up_date", updateForm.follow_up_date);
      formData.append("activity_type", updateForm.activity_type);
      formData.append("follow_up_by", updateForm.follow_up_by);
      formData.append("contact_person", updateForm.contact_person);
      formData.append("description", updateForm.description);
      formData.append("status", "Pending");
      formData.append("remarks", "");

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => formData.append("files", file));
      }

      await axios.post(`${API_BASE}/api/lead-follow-up/insert`, formData, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      toast.success("New follow-up added");

      const res = await axios.get(
        `${API_BASE}/api/lead-follow-up/history/${selectedLead.lead_id}`,
      );
      setFollowUpHistory(res.data?.result || []);
      setPreviewFollowUp(null);

      setUpdateForm({
        follow_up_date: new Date().toISOString().split("T")[0],
        activity_type: "",
        follow_up_by: "",
        contact_person: "",
        description: "",
      });

      setSelectedFiles([]);
      fetchLeads();
    } catch (err) {
      toast.error("Failed to add follow-up");
      console.log(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // ===================================================
  // DELETE LEAD
  // ===================================================
  const openDeleteModal = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/lead/${leadToDelete.lead_id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success("Lead deleted successfully");
      setShowDeleteModal(false);
      setLeadToDelete(null);
      fetchLeads();
    } catch (err) {
      toast.error("Failed to delete lead");
      console.log(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===================================================
  // EDIT LEAD
  // ===================================================
  const handleEdit = async (lead) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/lead/sales/leads/view-leads/${lead.lead_id}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );

      const leadData = res.data.lead;

      setEditLeadForm({
        lead_id: leadData.lead_id || "",
        company_name: leadData.company_name || "",
        customer_name: leadData.customer_name || "",
        mobile_no: leadData.mobile_no || "",
        reference: leadData.reference || "",
        source: leadData.source || "",
        status: leadData.status || "",
        priority: leadData.priority || "",
        assignee: leadData.assignee || "",
        category: leadData.category || "",
        description: leadData.description || "",
      });

      setShowEditLeadModal(true);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch lead details");
    }
  };

  // ===================================================
  // VIEW LEAD
  // ===================================================
  const handleView = async (lead) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/lead/sales/leads/view-details/${lead.lead_id}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setViewLead(res.data.lead);
      setShowViewModal(true);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch lead details");
    }
  };

  // ===================================================
  // ✅ FIXED: STATUS CHANGE — now sends Authorization header
  // ✅ UPDATED: "Lost" status now opens the Lost Reason popup
  //    instead of the normal confirm popup
  // ===================================================
  const handleStatusChange = (lead_id, newStatus) => {
    setStatusChangeLeadId(lead_id); // ✅ separate state — no conflict with selectedLead
    setSelectedStatus(newStatus);

    if (newStatus === "Lost") {
      setLostReason("");
      setLostReasonError("");
      setShowLostReasonPopup(true);
    } else {
      setShowPopup(true);
    }
  };

  const confirmStatusChange = async () => {
    try {
      await axios.put(
        `${API_BASE}/api/lead/update-status/${statusChangeLeadId}`,
        { status: selectedStatus },
        {
          headers: { Authorization: `Bearer ${getToken()}` }, // ✅ FIXED: was missing
        },
      );

      setLeads((prev) =>
        prev.map((lead) =>
          lead.lead_id === statusChangeLeadId
            ? { ...lead, status: selectedStatus }
            : lead,
        ),
      );

      setShowPopup(false);
      toast.success("Status Updated");
    } catch (err) {
      console.log(err);
      toast.error("Failed to update status");
    }
  };

  // ===================================================
  // ✅ NEW: CONFIRM LOST STATUS CHANGE (with reason)
  // ===================================================
  const confirmLostStatusChange = async () => {
    if (!lostReason.trim()) {
      setLostReasonError("Please enter a reason");
      return;
    }

    try {
      await axios.put(
        `${API_BASE}/api/lead/update-status/${statusChangeLeadId}`,
        { status: "Lost", lost_reason: lostReason.trim() },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );

      setLeads((prev) =>
        prev.map((lead) =>
          lead.lead_id === statusChangeLeadId
            ? { ...lead, status: "Lost", lost_reason: lostReason.trim() }
            : lead,
        ),
      );

      setShowLostReasonPopup(false);
      setLostReason("");
      setLostReasonError("");
      toast.success("Lead marked as Lost");
    } catch (err) {
      console.log(err);
      toast.error("Failed to update status");
    }
  };

  // ===================================================
  // ✅ NEW: VIEW LOST REASON
  // ===================================================
  const handleViewReason = (lead) => {
    setViewReasonLead(lead);
    setShowViewReasonModal(true);
  };

  // ===================================================
  // FILTER LOGIC
  // ===================================================
  const debounceRef = useRef(null);

  const [filters, setFilters] = useState({
    company_name: "",
    customer_name: "",
    reference: "",
    source: "",
    mobile_no: "",
    status: "",
    created_by: "",
    from_created: "",
    to_created: "",
    from_followup: "",
    to_followup: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const searchLeads = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== ""),
      );

      const res = await axios.get(`${API_BASE}/api/lead/sales/leads/filter`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const formatted = (res.data?.data || []).map((item) => {
        let finalStatus = "Pending";
        if (item.status === "Won") finalStatus = "Won";
        else if (item.status === "Lost") finalStatus = "Lost";
        return { ...item, status: finalStatus };
      });

      setLeads(formatted);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const hasFilter = Object.values(filters).some((v) => v !== "");

    if (!hasFilter) {
      fetchLeads();
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchLeads();
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      company_name: "",
      customer_name: "",
      reference: "",
      source: "",
      mobile_no: "",
      status: "",
      created_by: "",
      from_created: "",
      to_created: "",
      from_followup: "",
      to_followup: "",
    });
    fetchLeads();
  };
  // ===================================================
  // 🚦 TRAFFIC LIGHT DOT
  // Returns a colored dot JSX based on follow_up_status from API
  // Only shown for Pending leads; Won/Lost get no dot
  // ===================================================
  const getTrafficDot = (lead) => {
    const color = lead.follow_up_status || "green"; // 'green' | 'yellow' | 'red'

    const dotColors = {
      green: "#22c55e",
      yellow: "#eab308",
      red: "#ef4444",
    };

    const isPending = lead.status === "Pending";

    const tooltips = isPending ? {
      green: "✅ Follow-up on track (< 24h)",
      yellow: "⚠️ No follow-up in 24h — Attention needed",
      red: "🔴 No follow-up in 48h+ — Critical",
    } : {
      green: "✅ Completed on track (< 24h)",
      yellow: "⚠️ Completed late (24h - 48h)",
      red: "🔴 Completed late (48h+)",
    };

    const isPulse = isPending && (color === "yellow" || color === "red");

    return (
      <span
        title={tooltips[color]}
        style={{
          display: "inline-block",
          width: 9,
          height: 9,
          borderRadius: "50%",
          backgroundColor: dotColors[color],
          flexShrink: 0,
          animation: isPulse ? "pulse 1.5s infinite" : "none",
        }}
      />
    );
  };

  // ===================================================
  // TAB + FILTER MERGE
  // ===================================================
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const filteredLeads = hasActiveFilters
    ? leads
    : leads.filter((l) => {
      if (activeTab === "Pending")
        return l.status !== "Won" && l.status !== "Lost";
      return l.status === activeTab;
    });

  const pendingCount = leads.filter((l) => l.status === "Pending").length;
  const wonCount = leads.filter((l) => l.status === "Won").length;
  const lostCount = leads.filter((l) => l.status === "Lost").length;

  // ===================================================
  // PAGINATION
  // ===================================================
  // ================= PAGINATION =================

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters, tab, or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

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

  // ===================================================
  // DYNAMIC DROPDOWNS
  // ===================================================
  const companyRef = useRef(null);

  const [assignee, setAssignee] = useState([]);
  const [leadSource, setLeadSource] = useState([]);
  const [leadCategory, setLeadCategory] = useState([]);
  const [category, setCategory] = useState([]);

  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
          params: { status: 1 },
        });
        const cleanedData = (res.data?.data || res.data || []).map((item) => ({
          ...item,
          name: item.name ? item.name.split(" ")[0] : "",
        }));
        setAssignee(cleanedData);
      } catch (err) {
        console.error("Failed to fetch names:", err);
        setAssignee([]);
      }
    };
    fetchAssignee();
  }, []);

  useEffect(() => {
    const fetchSource = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/inquiry-lead-source/read`,
          {
            params: { status: 1 },
          },
        );
        setLeadSource(res.data);
      } catch { }
    };
    fetchSource();
  }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/inquiry-lead-category/read`,
          {
            params: { status: 1 },
          },
        );
        setLeadCategory(res.data);
      } catch { }
    };
    fetchCategory();
  }, []);

  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/product-category/read`, {
          params: { status: 1 },
        });
        setCategory(res.data);
      } catch { }
    };
    fetchProductCategory();
  }, []);

  const isAdmin = checkRole(["Admin"]);

  return (
    <>
      <Header />

      <div className="bg-gray-100">
        {/* Breadcrumb */}
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
                href="#"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Sales
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/sales/lead"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Lead
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <div className="relative   w-1/2 sm:w-auto" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="flex items-center justify-center gap-2 bg-orange-50 text-orange-500 px-4 py-2 rounded-sm text-sm font-semibold tracking-wide transition-all shadow-sm"
              >
                <i className="bi bi-download text-base"></i>
                Export
                <i
                  className={`bi bi-chevron-down text-xs transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`}
                ></i>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all"
                  >
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center">
                      <i className="bi bi-file-earmark-excel text-green-600 text-sm"></i>
                    </div>
                    Export Excel
                  </button>
                  <div className="h-px bg-gray-100 mx-3"></div>
                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all"
                  >
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center">
                      <i className="bi bi-file-earmark-pdf text-red-600 text-sm"></i>
                    </div>
                    Export PDF
                  </button>
                </div>
              )}
            </div>

            {/* ✅ CHANGED: opens Add Lead popup instead of navigating to /sales/lead/add-lead */}
            <button
              onClick={() => {
                resetAddLeadForm();
                setShowAddLeadModal(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              + ADD LEAD
            </button>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="mx-6 mb-2 md:hidden mt-3 relative z-40">
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
          ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
          md:mx-6 md:mb-3 md:items-center md:gap-2 md:flex-wrap md:flex md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}
        >
          <input
            name="company_name"
            value={filters.company_name}
            onChange={handleFilterChange}
            ref={companyRef}
            placeholder="Company Name"
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  text-gray-600 text-sm outline-none"
          />

          <input
            name="customer_name"
            value={filters.customer_name}
            onChange={handleFilterChange}
            placeholder="Customer Name"
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  text-gray-600 text-sm outline-none"
          />

          <input
            name="reference"
            value={filters.reference}
            onChange={handleFilterChange}
            placeholder="Enter Reference"
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-600 text-sm"
          />

          {/* <select
            name="product_category"
            value={filters.product_category}
            onChange={handleFilterChange}
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-48  outline-none  text-gray-400 text-sm"
          >
            <option value="">Select Product Category</option>
            {category.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select> */}

          <select
            name="source"
            value={filters.source}
            onChange={handleFilterChange}
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Select Source</option>
            {leadSource.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <input
            name="mobile_no"
            value={filters.mobile_no}
            onChange={handleFilterChange}
            placeholder="Mobile No"
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-600 text-sm" />

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              From Next
            </span>
            <input
              type="date"
              name="from_followup"
              value={filters.from_followup}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-53  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              To Next
            </span>
            <input
              type="date"
              name="to_followup"
              value={filters.to_followup}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="border p-1 bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Pending</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-60  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              From Create
            </span>
            <input
              type="date"
              name="from_created"
              value={filters.from_created}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              To Create
            </span>
            <input
              type="date"
              name="to_created"
              value={filters.to_created}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <div className="flex gap-2 col-span-2 md:col-span-1">
            <button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold"
            >
              Clear
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Tabs + Table */}
        <div className="bg-white rounded-sm border border-gray-100 py-2 mx-7">
          <div className="flex items-center gap-8 px-6 pt-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("Pending")}
              className={`pb-3 px-3 text-sm font-medium relative cursor-pointer transition-all ${activeTab === "Pending" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Pending
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
              {activeTab === "Pending" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab("Won")}
              className={`pb-3 text-sm font-medium cursor-pointer relative ${activeTab === "Won" ? "text-green-600" : "text-gray-500"}`}
            >
              Won
              <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                {wonCount}
              </span>
              {activeTab === "Won" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab("Lost")}
              className={`pb-3 text-sm font-medium relative ${activeTab === "Lost" ? "text-red-600" : "text-gray-500"}`}
            >
              Lost
              <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                {lostCount}
              </span>
              {activeTab === "Lost" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>
              )}
            </button>

            {/* 🚦 Traffic Light Legend */}
            <div className="ml-auto flex items-center gap-4 pb-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e" }} />
                On track
              </span>
              <span className="flex items-center gap-1.5">
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#eab308" }} />
                24h no follow-up
              </span>
              <span className="flex items-center gap-1.5">
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }} />
                48h+ overdue
              </span>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
              <div
                className="overflow-x-auto overflow-y-scroll max-h-[600px] custom-scroll"
                style={{ overflowX: "scroll" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Mobile No
                      </th>
                      <th className="py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Next Follow Up
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLeads.length > 0 ? (
                      paginatedLeads.map((lead, index) => (
                        <tr
                          key={lead.lead_id}
                          className="border-b border-gray-50 hover:bg-indigo-50/30 transition-all"
                        >
                          <td className="py-3 px-2">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>

                          <td className="font-medium px-2">
                            <div className="flex items-center gap-2">
                              {getTrafficDot(lead)}
                              {lead.company_name}
                            </div>
                          </td>

                          <td className="text-orange-500 cursor-pointer px-3">
                            {lead.customer_name}
                          </td>

                          <td className="py-3 px-2 w-46 max-w-46 truncate">
                            {lead.reference}
                          </td>

                          <td className="px-3">{lead.source}</td>

                          <td className="py-2 px-4 text-start">
                            {lead.mobile_no}
                          </td>

                          <td className="text-center">
                            {lead.next_follow_up_date ? (
                              <span
                                onClick={() => {
                                  if (lead.status === "Pending")
                                    openUpdateModal(lead);
                                }}
                                className={`${lead.status === "Pending" ? "cursor-pointer text-blue-800" : "text-gray-400 cursor-not-allowed"}`}
                              >
                                {new Date(
                                  lead.next_follow_up_date,
                                ).toLocaleDateString()}
                              </span>
                            ) : (
                              <button
                                disabled={lead.status !== "Pending"}
                                onClick={() => {
                                  if (lead.status !== "Pending") return;
                                  setSelectedLead(lead);
                                  setSelectedFiles([]);
                                  setForm({
                                    follow_up_date: new Date()
                                      .toISOString()
                                      .split("T")[0],
                                    activity_type: "",
                                    follow_up_by: "",
                                    contact_person: "",
                                    description: "",
                                  });
                                  setShowModal(true);
                                }}
                                className={`w-9 h-9 rounded-full border flex items-center justify-center mx-auto
                                  ${lead.status === "Pending" ? "hover:bg-gray-100 cursor-pointer" : "bg-gray-100 cursor-not-allowed opacity-60"}`}
                              >
                                <i className="bi bi-plus text-lg"></i>
                              </button>
                            )}
                          </td>

                          <td className="text-gray-500 px-2">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>

                          <td>
                            <select
                              value={lead.status}
                              onMouseDown={(e) => {
                                if (
                                  !isAdmin &&
                                  (lead.status === "Won" ||
                                    lead.status === "Lost")
                                ) {
                                  e.preventDefault();
                                  toast.error("Only Admin can change Status");
                                }
                              }}
                              onChange={(e) =>
                                handleStatusChange(lead.lead_id, e.target.value)
                              }
                              className={`border rounded-sm px-3 py-1 text-xs font-semibold outline-none cursor-pointer
                                ${lead.status === "Pending" ? "border-gray-200 bg-gray-50 text-gray-700" : ""}
                                ${lead.status === "Won" ? "border-green-200 bg-green-50 text-green-700" : ""}
                                ${lead.status === "Lost" ? "border-red-200 bg-red-50 text-red-700" : ""}
                              `}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Won">Won</option>
                              <option value="Lost">Lost</option>
                            </select>
                          </td>

                          <td className="text-lg">
                            <div className="flex items-center gap-2 flex-nowrap">
                              {lead.status === "Pending" ? (
                                <>


                                  <button
                                    onClick={() => handleView(lead)}
                                    className="text-gray-400 hover:text-green-600 cursor-pointer"
                                  >
                                    <i className="bi bi-eye text-xl"></i>
                                  </button>

                                  <button
                                    onClick={() => handleEdit(lead)}
                                    className="text-gray-400 hover:text-blue-800 cursor-pointer"
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>

                                  <button
                                    onClick={() => openDeleteModal(lead)}
                                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <i className="bi bi-trash3"></i>
                                  </button>
                                </>
                              ) : lead.status === "Lost" ? (
                                // ✅ NEW: View Reason button for Lost leads

                                <>
                                


                                <button onClick={() => handleView(lead)} className="text-gray-400 hover:text-green-600 cursor-pointer" > <i className="bi bi-eye text-xl"></i> </button>

                                <button
                                  onClick={() => handleViewReason(lead)}
                                  className="text-gray-400 hover:text-red-600 cursor-pointer flex items-center gap-1"
                                  title="View Lost Reason"
                                >
                                  <i className="bi bi-info-circle text-lg"></i>
                                  <span className="text-xs font-medium hidden lg:inline">
                                  
                                  </span>
                                </button>

                                </>
                              ) : (
                                <span className="text-gray-300 cursor-not-allowed">
                                  <i className="bi bi-lock text-lg"></i>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="10"
                          className="text-center py-10 text-gray-400"
                        >
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
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
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page
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
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
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
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          ✅ NEW: ADD LEAD MODAL (converted from add-lead page)
          Same fields, validation & payload — UI adapted to a
          right-side drawer that SLIDES IN / SLIDES OUT
      =================================================== */}
      {showAddLeadModal && (
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-gray-900/30 transition-opacity duration-300 ease-in-out ${addLeadVisible ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => closeAddLeadModal()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-[720px] max-w-full h-full shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ease-in-out ${addLeadVisible ? "translate-x-0" : "translate-x-full"
              }`}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                    <Plus size={20} className="text-white" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Add Lead
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Fill in the details to create a new lead
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => closeAddLeadModal()}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                {/* Company Name */}
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
                      value={addLeadForm.company_name}
                      placeholder="Company Name"
                      onChange={handleAddLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <User size={16} className="text-violet-500" />
                    </span>
                    <input
                      name="customer_name"
                      value={addLeadForm.customer_name}
                      placeholder="Customer Name"
                      onChange={handleAddLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                  {addLeadErrors.customer_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {addLeadErrors.customer_name}
                    </p>
                  )}
                </div>

                {/* Mobile No. */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Mobile No.
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                      <Phone size={16} className="text-green-500" />
                    </span>
                    <input
                      name="mobile_no"
                      value={addLeadForm.mobile_no}
                      placeholder="Mobile No."
                      onChange={handleAddLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                  {addLeadErrors.mobile_no && (
                    <p className="text-red-500 text-xs mt-1">
                      {addLeadErrors.mobile_no}
                    </p>
                  )}
                </div>

                {/* Source */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                      <Radio size={16} className="text-cyan-500" />
                    </span>
                    <select
                      name="source"
                      value={addLeadForm.source}
                      onChange={handleAddLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                    >
                      <option value="">-- Select --</option>
                      {leadSource.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {addLeadErrors.source && (
                    <p className="text-red-500 text-xs mt-1">
                      {addLeadErrors.source}
                    </p>
                  )}
                </div>

                {/* Reference */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Reference
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                      <Bookmark size={16} className="text-amber-500" />
                    </span>
                    <input
                      type="text"
                      name="reference"
                      value={addLeadForm.reference}
                      placeholder="Reference"
                      onChange={handleAddLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                  {addLeadErrors.reference && (
                    <p className="text-red-500 text-xs mt-1">
                      {addLeadErrors.reference}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                      <ShieldCheck size={16} className="text-green-500" />
                    </span>
                    <select
                      name="status"
                      value={addLeadForm.status}
                      disabled
                      className="w-full px-3 py-2 text-sm bg-transparent text-gray-400 cursor-not-allowed focus:outline-none"
                    >
                      <option>Qualified</option>
                    </select>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Priority
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span
                      className={`flex items-center justify-center w-10 shrink-0 border-r border-gray-100 transition-colors duration-300 ${
                        addLeadForm.priority === "High"
                          ? "bg-red-50"
                          : addLeadForm.priority === "Medium"
                            ? "bg-amber-50"
                            : addLeadForm.priority === "Low"
                              ? "bg-green-50"
                              : "bg-rose-50"
                      }`}
                    >
                      <Star
                        size={16}
                        className={`transition-colors duration-300 ${
                          addLeadForm.priority === "High"
                            ? "text-red-500"
                            : addLeadForm.priority === "Medium"
                              ? "text-amber-500"
                              : addLeadForm.priority === "Low"
                                ? "text-green-500"
                                : "text-rose-500"
                        }`}
                      />
                    </span>
                    <select
                      name="priority"
                      value={addLeadForm.priority}
                      onChange={handleAddLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                    >
                      <option value="">-- Select --</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Category
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <FolderOpen size={16} className="text-violet-500" />
                    </span>
                    <select
                      name="category"
                      value={addLeadForm.category}
                      onChange={handleAddLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
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
              </div>

              {/* Description */}
              <div className="mt-3">
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Description
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                    <FileText size={16} className="text-blue-500" />
                  </span>
                  <textarea
                    name="description"
                    rows="2"
                    value={addLeadForm.description}
                    onChange={handleAddLeadChange}
                    placeholder="Enter description..."
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={() => closeAddLeadModal()}
                className="px-6 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 bg-white"
              >
                <X size={15} /> Cancel
              </button>

              <button
                type="button"
                onClick={handleAddLeadSubmit}
                disabled={addLeadSubmitting}
                className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${addLeadSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {addLeadSubmitting ? (
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
                    <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <>
                    <Save size={15} /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          ✅ NEW: EDIT LEAD MODAL (converted from update-lead page)
          Same fields, validation & payload — UI adapted to a
          right-side drawer that SLIDES IN / SLIDES OUT
      =================================================== */}
      {showEditLeadModal && (
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-gray-900/30 backdrop-blur-sm  transition-opacity duration-300 ease-in-out ${editLeadVisible ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => closeEditLeadModal()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-[720px] max-w-full h-full shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ease-in-out ${editLeadVisible ? "translate-x-0" : "translate-x-full"
              }`}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                    <Pencil size={20} className="text-white" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Edit Lead
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Update the details of this lead
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => closeEditLeadModal()}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                {/* Company Name */}
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
                      value={editLeadForm.company_name}
                      placeholder="Company Name"
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <User size={16} className="text-violet-500" />
                    </span>
                    <input
                      name="customer_name"
                      value={editLeadForm.customer_name}
                      placeholder="Customer Name"
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Mobile No. */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Mobile No.
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                      <Phone size={16} className="text-green-500" />
                    </span>
                    <input
                      name="mobile_no"
                      value={editLeadForm.mobile_no}
                      placeholder="Mobile No."
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Source */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                      <Radio size={16} className="text-cyan-500" />
                    </span>
                    <select
                      name="source"
                      value={editLeadForm.source}
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                    >
                      <option value="">-- Select --</option>
                      {leadSource.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Reference
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-amber-50 border-r border-gray-100">
                      <Bookmark size={16} className="text-amber-500" />
                    </span>
                    <input
                      type="text"
                      name="reference"
                      value={editLeadForm.reference}
                      placeholder="Reference"
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span
                      className={`flex items-center justify-center w-10 shrink-0 border-r border-gray-100 transition-colors duration-300 ${
                        editLeadForm.status === "Lost"
                          ? "bg-red-50"
                          : editLeadForm.status === "Pending"
                            ? "bg-amber-50"
                            : editLeadForm.status === "Quotation Send"
                              ? "bg-blue-50"
                              : editLeadForm.status === "Technical Discussion"
                                ? "bg-violet-50"
                                : editLeadForm.status === "Call Initiated"
                                  ? "bg-cyan-50"
                                  : "bg-green-50"
                      }`}
                    >
                      <ShieldCheck
                        size={16}
                        className={`transition-colors duration-300 ${
                          editLeadForm.status === "Lost"
                            ? "text-red-500"
                            : editLeadForm.status === "Pending"
                              ? "text-amber-500"
                              : editLeadForm.status === "Quotation Send"
                                ? "text-blue-500"
                                : editLeadForm.status === "Technical Discussion"
                                  ? "text-violet-500"
                                  : editLeadForm.status === "Call Initiated"
                                    ? "text-cyan-500"
                                    : "text-green-500"
                        }`}
                      />
                    </span>
                    <select
                      name="status"
                      value={editLeadForm.status}
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
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
                </div>

                {/* Priority */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span
                      className={`flex items-center justify-center w-10 shrink-0 border-r border-gray-100 transition-colors duration-300 ${
                        editLeadForm.priority === "High"
                          ? "bg-red-50"
                          : editLeadForm.priority === "Medium"
                            ? "bg-amber-50"
                            : editLeadForm.priority === "Low"
                              ? "bg-green-50"
                              : "bg-rose-50"
                      }`}
                    >
                      <Star
                        size={16}
                        className={`transition-colors duration-300 ${
                          editLeadForm.priority === "High"
                            ? "text-red-500"
                            : editLeadForm.priority === "Medium"
                              ? "text-amber-500"
                              : editLeadForm.priority === "Low"
                                ? "text-green-500"
                                : "text-rose-500"
                        }`}
                      />
                    </span>
                    <select
                      name="priority"
                      value={editLeadForm.priority}
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
                    >
                      <option value="">-- Select --</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Category
                  </label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                      <FolderOpen size={16} className="text-violet-500" />
                    </span>
                    <select
                      name="category"
                      value={editLeadForm.category}
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent cursor-pointer"
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
              </div>

              {/* Description */}
              <div className="mt-3">
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Description
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-start justify-center w-10 shrink-0 pt-2.5 bg-blue-50 border-r border-gray-100">
                    <FileText size={16} className="text-blue-500" />
                  </span>
                  <textarea
                    name="description"
                    rows="2"
                    value={editLeadForm.description}
                    onChange={handleEditLeadChange}
                    placeholder="Enter description..."
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={() => closeEditLeadModal()}
                className="px-6 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 bg-white"
              >
                <X size={15} /> Cancel
              </button>

              <button
                type="button"
                onClick={handleEditLeadSubmit}
                disabled={editLeadSubmitting}
                className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${editLeadSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {editLeadSubmitting ? (
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
                    <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <>
                    <Save size={15} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-xl overflow-hidden">
            <div
              className="flex justify-between items-center px-6 py-4"
              style={{ background: "#f5e6d8" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#f07400" }}
                ></span>
                <h2 className="text-[13px] font-bold text-gray-600 tracking-widest uppercase">
                  Delete Lead
                </h2>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#f07400] hover:text-orange-600"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line
                    x1="2"
                    y1="2"
                    x2="16"
                    y2="16"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="16"
                    y1="2"
                    x2="2"
                    y2="16"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="px-7 pt-9 pb-5 text-center">
              <div
                className="w-[78px] h-[78px] mx-auto rounded-full flex items-center justify-center mb-5"
                style={{ background: "#f5e0c6" }}
              >
                <svg width="32" height="34" viewBox="0 0 32 34" fill="none">
                  <path
                    d="M3 8H29"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 8V5C12 4.448 12.448 4 13 4H19C19.552 4 20 4.448 20 5V8"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 8L6.5 29C6.5 29.552 6.948 30 7.5 30H24.5C25.052 30 25.5 29.552 25.5 29L27 8"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 14V24"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 14V24"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-[17px] font-bold text-gray-800 tracking-widest uppercase mb-2">
                {leadToDelete?.customer_name || "DELETE LEAD"}
              </h3>
              <p className="text-[13px] text-gray-400">
                This action cannot be undone. Are you sure?
              </p>
            </div>

            <div className="flex gap-3.5 px-7 pb-8 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-gray-200 py-3 rounded-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition text-[15px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl text-white text-[15px] font-semibold hover:opacity-90 transition"
                style={{ background: "#f07400" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FOLLOW-UP MODAL */}
     {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
          <div className="bg-white w-[480px] max-w-full rounded-2xl shadow-2xl overflow-hidden max-h-[91vh] flex flex-col">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                    <CalendarDays size={20} className="text-white" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Add Lead Activities
                    </h2>
                    {/* <p className="text-xs text-gray-500 mt-0.5">
                      Capture follow-up activities and stay on top of your
                      leads
                    </p> */}
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full  text-indigo-600 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4 overflow-y-auto">
              {/* Follow-Up Date */}
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CalendarDays size={14} className="text-blue-500" />
                  </span>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Follow-Up Date <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="date"
                  name="follow_up_date"
                  value={form.follow_up_date}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              {/* Activity Type */}
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                      form.activity_type === "Call"
                        ? "bg-green-50"
                        : form.activity_type === "Meeting"
                          ? "bg-blue-50"
                          : form.activity_type === "Email"
                            ? "bg-violet-50"
                            : "bg-emerald-50"
                    }`}
                  >
                    <ListChecks
                      size={14}
                      className={`transition-colors duration-300 ${
                        form.activity_type === "Call"
                          ? "text-green-500"
                          : form.activity_type === "Meeting"
                            ? "text-blue-500"
                            : form.activity_type === "Email"
                              ? "text-violet-500"
                              : "text-emerald-500"
                      }`}
                    />
                  </span>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Activity Type <span className="text-red-500">*</span>
                  </label>
                </div>
                <select
                  name="activity_type"
                  value={form.activity_type}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="">-- Select Activity Type --</option>
                  <option>Call</option>
                  <option>Meeting</option>
                  <option>Email</option>
                </select>
              </div>

              {/* Follow-Up By */}
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <User size={14} className="text-violet-500" />
                  </span>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Follow-Up By <span className="text-red-500">*</span>
                  </label>
                </div>
                <select
                  name="follow_up_by"
                  value={form.follow_up_by}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                  <option value="">Select User</option>
                  {assignee.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Person */}
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <UserRound size={14} className="text-amber-500" />
                  </span>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="flex">
                  <input
                    name="contact_person"
                    value={form.contact_person}
                    onChange={handleChange}
                    placeholder="Enter contact person name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                    <FileText size={14} className="text-rose-500" />
                  </span>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Description <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter description of the activity..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pb-6 text-sm text-gray-700 outline-none bg-white h-24 resize-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[10px] text-gray-400 font-medium">
                    {(form.description || "").length}/500
                  </span>
                </div>
              </div>

              {/* File Upload */}
              <div className="col-span-2 border-2 border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50/30">
                <div
                  onClick={() => setShowFileModal(true)}
                  className="text-center cursor-pointer group"
                >
                  <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto shadow-md shadow-indigo-200 group-hover:scale-110 transition-transform">
                    <CloudUpload size={18} className="text-white" />
                  </span>
                  <p className="text-sm font-medium text-gray-700 mt-2">
                    Drag &amp; drop files here or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload supporting documents or images (Max 5MB)
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">
                      JPG
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">
                      PNG
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
                      PDF
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                      XLSX
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">
                      DWG
                    </span>
                  </div>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-1 text-left">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white px-3 py-1.5 text-xs rounded-lg border border-indigo-100 shadow-sm"
                      >
                        <span className="text-gray-600 truncate">
                          {file.name}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedFiles(
                              selectedFiles.filter((_, i) => i !== index),
                            )
                          }
                          className="text-red-400 hover:text-red-600 ml-2"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2 bg-white"
              >
                <X size={15} /> Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={btnLoading}
                className={`px-6 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-md shadow-indigo-200 flex items-center gap-2
  ${
    btnLoading
      ? "bg-indigo-400 cursor-not-allowed"
      : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-800"
  }`}
              >
                {btnLoading ? (
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
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} /> Add Activity
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* UPDATE FOLLOW-UP MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
          <div className="bg-white w-full max-w-[600px] rounded-sm shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Update Lead Activities
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedFiles([]);
                  setPreviewFollowUp(null);
                }}
                className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
              >
                ✕
              </button>
            </div>

            <div className="flex">
              <div className="w-1/2 px-6 py-5 border-r border-gray-100">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
                  Add New Follow-Up
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Follow-Up Date
                    </label>
                    <input
                      type="date"
                      value={updateForm.follow_up_date}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          follow_up_date: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Activity Type *
                    </label>
                    <select
                      value={updateForm.activity_type}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          activity_type: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
                    >
                      <option value="">-- Select --</option>
                      <option>Call</option>
                      <option>Meeting</option>
                      <option>Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Follow-Up By
                    </label>
                    <select
                      value={updateForm.follow_up_by}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          follow_up_by: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
                    >
                      <option value="">Select User</option>
                      {assignee.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Contact Person *
                    </label>
                    <input
                      value={updateForm.contact_person}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          contact_person: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Description *
                    </label>
                    <textarea
                      value={updateForm.description}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50 h-20 resize-none"
                    />
                  </div>
                  <div className="col-span-2 border-2 border-dashed border-orange-300 rounded-xl p-3 text-center bg-orange-50/40">
                    <button
                      onClick={() => setShowFileModal(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all shadow-md shadow-orange-200"
                    >
                      <i className="bi bi-cloud-upload"></i> Browse Files
                    </button>
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-1 text-left">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center bg-white px-3 py-1 text-xs rounded-lg border border-gray-100 shadow-sm"
                          >
                            <span className="text-gray-600 truncate">
                              {file.name}
                            </span>
                            <button
                              onClick={() =>
                                setSelectedFiles(
                                  selectedFiles.filter((_, i) => i !== index),
                                )
                              }
                              className="text-orange-400 hover:text-orange-600 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      Max 5MB · JPG, PNG, PDF, XLSX, DWG
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-1/2 px-6 py-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Follow-Up History
                  </p>
                  <span className="text-xs bg-orange-50 text-orange-500 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
                    {followUpHistory.length} record(s)
                  </span>
                </div>
                <div className="space-y-2">
                  {followUpHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                      <i className="bi bi-clock-history text-3xl mb-2"></i>
                      <p className="text-sm">No history found</p>
                    </div>
                  ) : (
                    followUpHistory.map((item, idx) => (
                      <div
                        key={item.follow_up_id}
                        onClick={() =>
                          setPreviewFollowUp(
                            previewFollowUp?.follow_up_id === item.follow_up_id
                              ? null
                              : item,
                          )
                        }
                        className={`border rounded-xl p-3 cursor-pointer transition-all select-none
                          ${previewFollowUp?.follow_up_id === item.follow_up_id ? "border-orange-400 bg-orange-50 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
                                Latest
                              </span>
                            )}
                            <p className="font-semibold text-sm text-gray-700">
                              {item.activity_type}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">
                              {item.follow_up_date
                                ? new Date(
                                  item.follow_up_date,
                                ).toLocaleDateString()
                                : "—"}
                            </span>
                            <i
                              className={`bi ${previewFollowUp?.follow_up_id === item.follow_up_id ? "bi-chevron-up" : "bi-chevron-down"} text-gray-400 text-xs`}
                            ></i>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {item.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {previewFollowUp && (
                  <div className="mt-4 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 text-sm shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-bold text-orange-500 text-xs uppercase tracking-wide">
                        Details
                      </p>
                      <button
                        onClick={() => setPreviewFollowUp(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {[
                        {
                          label: "Activity Type",
                          value: previewFollowUp.activity_type,
                        },
                        {
                          label: "Follow-Up Date",
                          value: previewFollowUp.follow_up_date
                            ? new Date(
                              previewFollowUp.follow_up_date,
                            ).toLocaleDateString()
                            : "—",
                        },
                        {
                          label: "Contact Person",
                          value: previewFollowUp.contact_person,
                        },
                        {
                          label: "Follow-Up By",
                          value: previewFollowUp.follow_up_by,
                        },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-gray-400 font-medium">
                            {label}
                          </p>
                          <p className="font-semibold text-gray-700 text-sm mt-0.5">
                            {value || "—"}
                          </p>
                        </div>
                      ))}
                      <div>
                        <p className="text-xs text-gray-400 font-medium">
                          Status
                        </p>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block
                          ${previewFollowUp.status === "Completed" ? "bg-green-100 text-green-600" : previewFollowUp.status === "Cancelled" ? "bg-orange-100 text-orange-500" : "bg-orange-100 text-orange-600"}`}
                        >
                          {previewFollowUp.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <p className="text-xs text-gray-400 font-medium">
                        Description
                      </p>
                      <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
                        {previewFollowUp.description || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedFiles([]);
                  setPreviewFollowUp(null);
                }}
                className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateLoading}
                className={`px-6 py-2 rounded-sm text-sm font-semibold text-white transition-all shadow-md shadow-orange-200 flex items-center gap-2
                ${updateLoading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                {updateLoading ? (
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
                    Add Follow-Up
                  </>
                ) : (
                  "Add Follow-Up"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE POPUP (Won / Pending) */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-3 text-center">
              Confirm Status Change
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to change status?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-orange-200"
              >
                Yes Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: LOST REASON POPUP */}
      {showLostReasonPopup && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-3 text-center text-red-600">
              Mark Lead as Lost
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Please provide a reason for marking this lead as Lost.
            </p>
            <textarea
              value={lostReason}
              onChange={(e) => {
                setLostReason(e.target.value);
                if (e.target.value.trim()) setLostReasonError("");
              }}
              placeholder="Enter lost reason..."
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none h-24 resize-none focus:border-red-400"
            />
            {lostReasonError && (
              <p className="text-xs text-red-500 mt-1">{lostReasonError}</p>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowLostReasonPopup(false);
                  setLostReason("");
                  setLostReasonError("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLostStatusChange}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-red-200"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: VIEW LOST REASON MODAL */}
      {showViewReasonModal && viewReasonLead && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-red-600">
                Lost Reason
              </h2>
              <button
                onClick={() => setShowViewReasonModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
              {viewReasonLead.customer_name}
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-sm p-3 border border-gray-100">
              {viewReasonLead.lost_reason || "No reason provided"}
            </p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowViewReasonModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
    {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
          <div className="bg-white w-[680px] max-w-full rounded-2xl shadow-2xl overflow-hidden h-[500px]  flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                  <CloudUpload size={20} className="text-white" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Upload Files
                  </h2>
                  {/* <p className="text-xs text-gray-500 mt-0.5">
                    Attach files to this activity
                  </p> */}
                </div>
              </div>
              <button
                onClick={() => setShowFileModal(false)}
                className="w-8 h-8 flex items-center justify-center   text-indigo-600  transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-4 p-6 overflow-y-auto">
              {/* Drop zone */}
              <div
                className="w-1/2 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-indigo-50/30 hover:bg-indigo-50/60 transition-all cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("fileInput").click()}
              >
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CloudUpload size={26} className="text-indigo-500" />
                </div>
                <p className="font-bold text-gray-800 text-sm">
                  Drag &amp; Drop files here
                </p>
                <p className="text-xs text-gray-500 mt-1.5">
                  or{" "}
                  <span className="text-blue-600 font-semibold underline">
                    browse files
                  </span>
                </p>
                <div className="mt-4 bg-white border border-gray-100 rounded-lg px-4 py-2 shadow-sm">
                  <p className="text-[11px] text-gray-400">Maximum file size</p>
                  <p className="text-xs font-bold text-gray-700">
                    5 MB per file
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 mt-3 mb-1.5">
                  Supported formats:
                </p>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">
                    JPG
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">
                    PNG
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">
                    PDF
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                    XLSX
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">
                    DWG
                  </span>
                </div>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleSelect}
                />
              </div>

              {/* Selected files panel */}
              <div className="w-1/2 border border-gray-100 rounded-xl p-4 flex flex-col">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Selected Files ({selectedFiles.length})
                </p>
                {selectedFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-b from-indigo-50/40 to-slate-50/40 rounded-xl py-10 px-4 text-center">
                    <div className="relative mb-4">
                      <div className="w-16 h-16 rounded-full bg-indigo-100/70 flex items-center justify-center">
                        <FileText size={26} className="text-indigo-400" />
                      </div>
                      <Sparkles
                        size={14}
                        className="text-indigo-300 absolute -top-1 -right-3"
                      />
                      <Sparkles
                        size={11}
                        className="text-indigo-200 absolute bottom-0 -left-4"
                      />
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      No files selected yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                      Choose files from the left
                      <br />
                      to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto">
                    {selectedFiles.map((file, i) => {
                      // UI-only: icon color per file type
                      const ext = (file.name.split(".").pop() || "")
                        .toLowerCase();
                      const fileColors = {
                        jpg: { bg: "bg-blue-50", icon: "text-blue-500" },
                        jpeg: { bg: "bg-blue-50", icon: "text-blue-500" },
                        png: { bg: "bg-green-50", icon: "text-green-500" },
                        pdf: { bg: "bg-red-50", icon: "text-red-500" },
                        xlsx: {
                          bg: "bg-emerald-50",
                          icon: "text-emerald-500",
                        },
                        xls: { bg: "bg-emerald-50", icon: "text-emerald-500" },
                        dwg: { bg: "bg-amber-50", icon: "text-amber-500" },
                        docx: {
                          bg: "bg-violet-50",
                          icon: "text-violet-500",
                        },
                        doc: { bg: "bg-violet-50", icon: "text-violet-500" },
                      };
                      const fc =
                        fileColors[ext] || {
                          bg: "bg-indigo-50",
                          icon: "text-indigo-500",
                        };

                      return (
                        <div
                          key={i}
                          className="flex justify-between items-center border border-gray-100 rounded-lg px-2 py-0.5 bg-gray-50/60 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg ${fc.bg} flex items-center justify-center flex-shrink-0`}
                            >
                              <FileText size={14} className={fc.icon} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm text-gray-700 truncate block">
                                {file.name}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase ${fc.icon}`}
                              >
                                {ext}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedFiles(
                                selectedFiles.filter(
                                  (_, index) => index !== i,
                                ),
                              )
                            }
                            className="text-gray-300 hover:text-red-500 ml-2 flex-shrink-0 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              {/* <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex-1">
                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                {/* <p className="text-xs text-blue-600 leading-snug">
                  <span className="font-semibold">
                    You can upload multiple files at once.
                  </span>
                  <br />
                  <span className="text-blue-500/80">
                    All files will be attached to this activity.
                  </span>
                </p> 
              </div> */}
              <button
                onClick={() => setShowFileModal(false)}
                className="bg-gradient-to-r ml-auto from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6  py-1.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 shrink-0"
              >
                <CheckCircle2 size={15} /> Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW LEAD MODAL */}
      {showViewModal && viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
          <div className="bg-white w-full max-w-2xl border border-gray-100 rounded-sm shadow-2xl overflow-hidden">
            <div className="from-orange-100 to-white px-6 py-3 flex items-center justify-between bg-gradient-to-r">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center">
                  <i className="bi bi-person text-md text-orange-500"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {viewLead.customer_name || "—"}
                  </p>
                  <p className="text-gray-400 text-md">
                    {viewLead.status || "—"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                {
                  icon: "bi-building",
                  label: "Company",
                  value: viewLead.company_name,
                },
                {
                  icon: "bi-person-circle",
                  label: "Customer Name",
                  value: viewLead.customer_name,
                },
                { icon: "bi-flag", label: "Source", value: viewLead.source },
                { icon: "bi-tag", label: "Category", value: viewLead.category },
                { icon: "bi-tag", label: "mobile no", value: viewLead.mobile_no },
                {
                  icon: "bi-person-check",
                  label: "Assignee",
                  value: viewLead.assignee,
                },
                {
                  icon: "bi-calendar3",
                  label: "Created",
                  value: viewLead.created_at
                    ? new Date(viewLead.created_at).toLocaleDateString()
                    : "—",
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3"
                >
                  <i className={`bi ${icon} text-orange-400 text-lg`}></i>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      {value || "—"}
                    </p>
                  </div>
                </div>
              ))}

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
                <i className="bi bi-pencil text-orange-400 text-lg"></i>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Lead Title
                  </p>
                  <p className="text-sm font-semibold text-gray-700 break-words whitespace-normal">
                    {viewLead.reference || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
                <i className="bi bi-chat-left-text text-orange-400 text-lg"></i>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Description
                  </p>
                  <p className="text-sm font-semibold text-gray-700 break-words whitespace-normal">
                    {viewLead.description || "—"}
                  </p>
                </div>
              </div>

              {viewLead.updated_by && (
                <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
                  <i className="bi bi-person-gear text-orange-400 text-lg"></i>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      Updated By
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      {viewLead.updated_by}
                    </p>
                  </div>
                </div>
              )}

              {viewLead.updated_at && (
                <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
                  <i className="bi bi-clock-history text-orange-400 text-lg"></i>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                      Last Updated
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date(viewLead.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
