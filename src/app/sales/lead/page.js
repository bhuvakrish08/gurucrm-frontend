"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import { getCache, setCache, fetchWithRetry } from "@/utils/slowNetworkHelper";
import Link from "next/link";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { checkRole } from "@/utils/checkRole";
import useAuth from "@/app/components/useAuth";
import { parseExcelDate } from "@/utils/excelUtils";
import { Sparkles } from "lucide-react";
import { Trash2} from "lucide-react";
import SkeletonTable from "@/app/components/SkeletonTable";

import {
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Clock,
  Loader2,
} from "lucide-react";
import {
  CalendarDays,
  ListChecks,
  User,
  UserRound,
  FileText,
  CloudUpload,
  Info,
  X,
  CheckCircle2,
  Building2,
  Phone,
  Radio,
  Bookmark,
  ShieldCheck,
  Star,
  FolderOpen,
  Save,
  Plus,
  Pencil,
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

  const [modalClosing, setModalClosing] = useState(false);
const [updateModalClosing, setUpdateModalClosing] = useState(false);
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
    location: "",
    architecture: "",
    status: "Qualified",
    priority: "",
    assignee: "",
    category: "",
    description: "",
  });
// for view model slide-in slide-out animation
const [isClosing, setIsClosing] = useState(false);

const handleCloseModal = () => {
  setIsClosing(true);
  setTimeout(() => {
    setIsClosing(false);
    setShowViewModal(false);
  }, 250);
};

const handleCloseAddModal = () => {
  setModalClosing(true);
  setTimeout(() => {
    setShowModal(false);
    setModalClosing(false);
  }, 260);
};

const handleCloseUpdateModal = () => {
  setUpdateModalClosing(true);
  setTimeout(() => {
    setShowUpdateModal(false);
    setSelectedFiles([]);
    setPreviewFollowUp(null);
    setUpdateModalClosing(false);
  }, 260);
};
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
    location: "",
    architecture: "",
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

  const fetchLeads = async (page = 1, searchQuery = "") => {
    setLoading(true);
    // 1. Immediately show cached data if on page 1
    if (page === 1 && !searchQuery) {
      const cachedLeads = getCache("leads_list_cached");
      if (cachedLeads && Array.isArray(cachedLeads)) {
        setLeads(cachedLeads);
      }
    }

    try {
      const params = new URLSearchParams({
        page: page,
        limit: "all",
      });
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetchWithRetry(
        `${API_BASE}/api/lead/read?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
        { timeout: 15000, maxRetries: 2 }
      );

      const formatted = (res.data?.result || []).map((item) => {
        let finalStatus = "Pending";
        if (item.status === "Won") finalStatus = "Won";
        else if (item.status === "Lost") finalStatus = "Lost";
        return { ...item, status: finalStatus };
      });

      setLeads(formatted);
      if (page === 1 && !searchQuery) {
        setCache("leads_list_cached", formatted);
      }
    } catch (err) {
      console.log("[Leads Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
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

      location: "", // ✅ ADD
      architecture: "", // ✅ ADD

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

          location: editLeadForm.location,

          architecture: editLeadForm.architecture,
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
        "Next Follow Up": parseExcelDate(lead.next_follow_up_date),
        "Created At": parseExcelDate(lead.created_at),
        Status: lead.status || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData, {
        cellDates: true,
        dateNF: "dd-mm-yyyy",
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet["!cols"] = colWidths;

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      2;
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
  const exportToPDF = async () => {
    ``;
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

        location: leadData.location || "", // ✅
        architecture: leadData.architecture || "", // ✅

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
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      console.log("VIEW API RESPONSE :", res.data.lead);

      setViewLead(res.data.lead);
      setShowViewModal(true);
    } catch (error) {
      console.log(error);
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

    const tooltips = isPending
      ? {
          green: "✅ Follow-up on track (<= 24h)",
          yellow: "⚠️ No follow-up in 24h - 48h — Attention needed",
          red: "🔴 No follow-up in > 48h — Critical",
        }
      : {
          green: "✅ Converted to Won on track (<= 24h)",
          yellow: "⚠️ Converted to Won in 24h - 48h",
          red: "🔴 Converted to Won in > 48h",
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
      } catch {}
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
      } catch {}
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
      } catch {}
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
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Sales
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/sales/lead"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
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
              className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all cursor-pointer"
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
          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
                      <Building2 size={16} className="text-blue-500" />
            <input
              name="company_name"
              value={filters.company_name}
              onChange={handleFilterChange}
              ref={companyRef}
              placeholder="Company Name"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
                      <User size={16} className="text-violet-600" />
            <input
              name="customer_name"
              value={filters.customer_name}
              onChange={handleFilterChange}
              placeholder="Customer Name"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
                      <Bookmark size={16} className="text-amber-500" />
            <input
              name="reference"
              value={filters.reference}
              onChange={handleFilterChange}
              placeholder="Enter Reference"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
            />
          </div>

          {/* <select
            name="product_category"
            value={filters.product_category}
            onChange={handleFilterChange}
            className="border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-48  outline-none  text-gray-400 text-sm"
          >
            <option value="">Select Product Category</option>
            {category.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select> */}

          <select
            name="source"
            value={filters.source}
            onChange={handleFilterChange}
            className="border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Select Source</option>
            {leadSource.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 border bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45">
                      <Phone size={16} className="text-green-500" />
            <input
              name="mobile_no"
              value={filters.mobile_no}
              onChange={handleFilterChange}
              placeholder="Mobile No"
              className="w-full text-gray-600 text-sm outline-none bg-transparent"
            />
          </div>

          <div className="flex p-1 items-center px-2 border bg-white border-indigo-400 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
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

          <div className="flex p-1 items-center px-2 border bg-white border-indigo-400 rounded-sm w-full md:w-53  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
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
            className="border p-1 bg-white border-indigo-400 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Pending</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <div className="flex p-1 items-center px-2 border bg-white border-indigo-400 rounded-sm w-full md:w-60  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
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

          <div className="flex p-1 items-center px-2 border bg-white border-indigo-400 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
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
              className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-4 py-2 bg-indigo-100 text-indigo-600  text-sm text-center font-semibold transition-colors"
            >
              <i className="bi bi-arrow-counterclockwise"></i> Clear Filter
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
              className={`pb-3 px-3 text-sm font-semibold relative cursor-pointer transition-all flex items-center gap-2 ${activeTab === "Pending" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <i className="bi bi-clipboard-check"></i>
              Pending
              <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
              {activeTab === "Pending" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab("Won")}
              className={`pb-3 text-sm font-semibold cursor-pointer relative flex items-center gap-2 ${activeTab === "Won" ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <i className="bi bi-trophy"></i>
              Won
              <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {wonCount}
              </span>
              {activeTab === "Won" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab("Lost")}
              className={`pb-3 text-sm font-semibold relative cursor-pointer flex items-center gap-2 ${activeTab === "Lost" ? "text-red-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <i className="bi bi-person-x"></i>
              Lost
              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {lostCount}
              </span>
              {activeTab === "Lost" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-full"></div>
              )}
            </button>

            {/* 🚦 Traffic Light Legend */}
            <div className="ml-auto flex items-center gap-4 pb-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                  }}
                />
                On track (&le; 24h)
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#eab308",
                  }}
                />
                24h - 48h
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                  }}
                />
                &gt; 48h overdue
              </span>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <SkeletonTable rows={8} columns={9} />
            ) : (
              <div
                className="overflow-x-auto overflow-y-scroll max-h-[600px] custom-scroll"
                style={{ overflowX: "scroll" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-50 border-b border-gray-100">
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        #
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Company Name{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Customer Name{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Reference{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Source{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>

                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Architecture
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Mobile No{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-xs font-bold text-slate-700 tracking-wider">
                        Next Follow Up{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Created{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Status{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
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

                          <td className="font-semibold text-slate-800 px-2">
                            <div className="flex items-center gap-2">
                              {getTrafficDot(lead)}
                              {lead.company_name}
                            </div>
                          </td>

                          <td className="text-blue-500 font-medium cursor-pointer px-3">
                            {lead.customer_name}
                          </td>

                          <td className="py-3 px-2 w-46 max-w-46 truncate font-semibold text-slate-700">
                            {lead.reference}
                          </td>

                          <td className="px-3">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                                lead.source === "Walk In"
                                  ? "bg-yellow-50 text-yellow-600"
                                  : lead.source === "Website"
                                    ? "bg-fuchsia-50 text-fuchsia-600"
                                    : lead.source === "Reference"
                                      ? "bg-purple-50 text-purple-600"
                                      : lead.source === "Instagram"
                                        ? "bg-cyan-50 text-cyan-600"
                                        : lead.source === "Facebook"
                                          ? "bg-blue-50 text-blue-600"
                                          : "bg-pink-50 text-pink-600"
                              }`}
                            >
                              {lead.source}
                            </span>
                          </td>
                          <td>{lead.architecture}</td>
                          <td className="py-2 px-4 text-start font-semibold text-slate-800">
                            {lead.mobile_no}
                          </td>

                          <td className="text-center">
                            {lead.next_follow_up_date ? (
                              <span
                                onClick={() => {
                                  if (lead.status === "Pending")
                                    openUpdateModal(lead);
                                }}
                                className={`font-semibold ${lead.status === "Pending" ? "cursor-pointer text-blue-600" : "text-gray-400 cursor-not-allowed"}`}
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
                                  ${lead.status === "Pending" ? "border-blue-300 text-blue-500 hover:bg-blue-50 cursor-pointer" : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"}`}
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
                              className={`border rounded-md px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer
                                ${lead.status === "Pending" ? "border-indigo-200 bg-indigo-50 text-indigo-600" : ""}
                                ${lead.status === "Won" ? "border-green-200 bg-green-50 text-green-600" : ""}
                                ${lead.status === "Lost" ? "border-red-200 bg-red-50 text-red-600" : ""}
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
                                    className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                                    title="View"
                                  >
                                    <i className="bi bi-eye text-lg"></i>
                                  </button>

                                  <button
                                    onClick={() => handleEdit(lead)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors"
                                    title="Edit"
                                  >
                                    <i className="bi bi-pencil-square text-sm"></i>
                                  </button>

                                  <button
                                    onClick={() => openDeleteModal(lead)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash3 text-sm"></i>
                                  </button>
                                </>
                              ) : lead.status === "Lost" ? (
                                // ✅ NEW: View Reason button for Lost leads

                                <>
                                  <button
                                    onClick={() => handleView(lead)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                                    title="View"
                                  >
                                    <i className="bi bi-eye text-lg"></i>
                                  </button>

                                  <button
                                    onClick={() => handleViewReason(lead)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                                    title="View Lost Reason"
                                  >
                                    <i className="bi bi-info-circle text-lg"></i>
                                  </button>
                                </>
                              ) : (
                                <span className="w-8 h-8 flex items-center justify-center text-gray-300 cursor-not-allowed">
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
                  {/* Left side: Showing X to Y of Z entries */}
                  <div className="text-sm text-slate-600 font-semibold">
                    Showing{" "}
                    {filteredLeads.length === 0
                      ? 0
                      : (currentPage - 1) * itemsPerPage + 1}{" "}
                    to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredLeads.length)}{" "}
                    of {filteredLeads.length} entries
                  </div>

                  {/* Center: Navigation buttons (only if totalPages > 1) */}
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
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                              currentPage === page
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
          className={`fixed inset-0 z-50 flex justify-end bg-gray-900/30 transition-opacity duration-300 ease-in-out ${
            addLeadVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => closeAddLeadModal()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-[720px] max-w-full h-full shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ease-in-out ${
              addLeadVisible ? "translate-x-0" : "translate-x-full"
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
                {/* Location */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Location
                  </label>

                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                      <i className="bi bi-geo-alt text-emerald-500 text-sm"></i>
                    </span>

                    <input
                      type="text"
                      name="location"
                      value={addLeadForm.location}
                      onChange={handleAddLeadChange}
                      placeholder="Enter Location"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Architecture */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Architecture
                  </label>

                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-orange-50 border-r border-gray-100">
                      <i className="bi bi-diagram-3 text-orange-500 text-sm"></i>
                    </span>

                    <input
                      type="text"
                      name="architecture"
                      value={addLeadForm.architecture}
                      onChange={handleAddLeadChange}
                      placeholder="Enter Architecture"
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
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
                    <path
                      fill="white"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
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
          className={`fixed inset-0 z-50 flex justify-end bg-gray-900/30 backdrop-blur-sm  transition-opacity duration-300 ease-in-out ${
            editLeadVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => closeEditLeadModal()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white w-[720px] max-w-full h-full shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ease-in-out ${
              editLeadVisible ? "translate-x-0" : "translate-x-full"
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
                {/* Location */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Location
                  </label>

                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-emerald-50 border-r border-gray-100">
                      <i className="bi bi-geo-alt text-emerald-500 text-sm"></i>
                    </span>

                    <input
                      type="text"
                      name="location"
                      value={editLeadForm.location || ""}
                      placeholder="Enter Location"
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                {/* Architecture */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    Architecture
                  </label>

                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-orange-50 border-r border-gray-100">
                      <i className="bi bi-diagram-3 text-orange-500 text-sm"></i>
                    </span>

                    <input
                      type="text"
                      name="architecture"
                      value={editLeadForm.architecture || ""}
                      placeholder="Enter Architecture"
                      onChange={handleEditLeadChange}
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    />
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
                className={`px-6 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${editLeadSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
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
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
     {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
    <div className="bg-white w-full h-[375px] max-w-md rounded-sm shadow-2xl overflow-hidden animate-[scaleIn_0.25s_ease-out]">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2} />
          </div>
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
            Delete Lead
          </h2>
        </div>

        <button
          onClick={() => setShowDeleteModal(false)}
          className="w-8 h-8 flex items-center justify-center text-red-600 transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={2} />
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
          {leadToDelete?.customer_name || "This Lead"}
        </h3>

        {/* Divider */}
        <div className="w-10 h-[3px] bg-red-500 rounded-full mx-auto mb-4"></div>

        {/* Message */}
        <p className="text-sm text-gray-500 leading-relaxed">
          This action cannot be undone.
          <br />
          Are you sure you want to delete this lead?
        </p>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3.5 px-7 pb-0">
        <button
          onClick={() => setShowDeleteModal(false)}
          disabled={deleteLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" strokeWidth={2.2} />
          Cancel
        </button>

        <button
          onClick={handleDelete}
          disabled={deleteLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold text-white bg-red-600  shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {deleteLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.3"
                />
                <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="3" />
              </svg>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" strokeWidth={2.2} />
              Delete Lead
            </>
          )}
        </button>
      </div>
    </div>

    <style jsx>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.95) translateY(8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
    `}</style>
  </div>
)}
{/* ADD FOLLOW-UP MODAL */}
{showModal && (
  <div
    className={`fixed inset-0 z-50 flex justify-end bg-gray-900/30 ${modalClosing ? "ladp-overlayOut" : "ladp-overlayIn"}`}
  >
    <style>{`
      @keyframes ladpSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes ladpSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
      @keyframes ladpFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes ladpFadeOut { from { opacity: 1; } to { opacity: 0; } }
      .ladp-overlayIn { animation: ladpFadeIn 0.22s ease-out; }
      .ladp-overlayOut { animation: ladpFadeOut 0.22s ease-in forwards; }
      .ladp-panelIn { animation: ladpSlideIn 0.3s cubic-bezier(0.16,1,0.3,1); }
      .ladp-panelOut { animation: ladpSlideOut 0.22s cubic-bezier(0.4,0,1,1) forwards; }
      @media (prefers-reduced-motion: reduce) {
        .ladp-overlayIn, .ladp-overlayOut, .ladp-panelIn, .ladp-panelOut { animation: none !important; }
      }
    `}</style>

    <div
      className={`bg-white w-[480px] max-w-full h-full shadow-2xl overflow-hidden flex flex-col ${modalClosing ? "ladp-panelOut" : "ladp-panelIn"}`}
    >
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
            </div>
          </div>
          <button
            onClick={handleCloseAddModal}
            className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-600 transition-all"
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
                  <span className="text-gray-600 truncate">{file.name}</span>
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
          onClick={handleCloseAddModal}
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
    : "bg-gradient-to-br from-indigo-500 to-violet-600"
}`}
        >
          {btnLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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
  <div
    className={`fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm ${updateModalClosing ? "ladp-overlayOut" : "ladp-overlayIn"}`}
  >
    <style>{`
      @keyframes ladpSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes ladpSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
      @keyframes ladpFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes ladpFadeOut { from { opacity: 1; } to { opacity: 0; } }
      .ladp-overlayIn { animation: ladpFadeIn 0.22s ease-out; }
      .ladp-overlayOut { animation: ladpFadeOut 0.22s ease-in forwards; }
      .ladp-panelIn { animation: ladpSlideIn 0.3s cubic-bezier(0.16,1,0.3,1); }
      .ladp-panelOut { animation: ladpSlideOut 0.22s cubic-bezier(0.4,0,1,1) forwards; }
      .ula-field { opacity: 0; animation: ulaFadeUp 0.35s ease-out forwards; }
      @keyframes ulaFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @media (prefers-reduced-motion: reduce) {
        .ladp-overlayIn, .ladp-overlayOut, .ladp-panelIn, .ladp-panelOut, .ula-field { animation: none !important; opacity: 1 !important; }
      }
    `}</style>

    <div
      className={`bg-white w-[680px] max-w-full h-full shadow-2xl border-l border-gray-100 overflow-hidden flex flex-col ${updateModalClosing ? "ladp-panelOut" : "ladp-panelIn"}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Update Lead Activities
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Log follow-ups and keep this lead moving
            </p>
          </div>
        </div>
        <button
          onClick={handleCloseUpdateModal}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1 w-full bg-gray-100">
        <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
      </div>

      <div className="flex overflow-y-auto">
        {/* LEFT: Add New Follow-Up */}
        <div className="w-1/2 px-6 py-5 border-r border-gray-100">
          <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4">
            Add New Follow-Up
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="ula-field" style={{ animationDelay: "0.03s" }}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    updateForm.follow_up_date
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <CalendarDays className="w-3 h-3" />
                </span>
                Follow-Up Date
              </label>
              <input
                type="date"
                value={updateForm.follow_up_date}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, follow_up_date: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="ula-field" style={{ animationDelay: "0.06s" }}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    updateForm.activity_type
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <ListChecks className="w-3 h-3" />
                </span>
                Activity Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={updateForm.activity_type}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, activity_type: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="">-- Select --</option>
                <option>Call</option>
                <option>Meeting</option>
                <option>Email</option>
              </select>
            </div>

            <div className="ula-field" style={{ animationDelay: "0.09s" }}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    updateForm.follow_up_by
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <User className="w-3 h-3" />
                </span>
                Follow-Up By
              </label>
              <select
                value={updateForm.follow_up_by}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, follow_up_by: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              >
                <option value="">Select User</option>
                {assignee.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="ula-field" style={{ animationDelay: "0.12s" }}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    updateForm.contact_person
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <UserRound className="w-3 h-3" />
                </span>
                Contact Person <span className="text-rose-500">*</span>
              </label>
              <input
                value={updateForm.contact_person}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, contact_person: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="col-span-2 ula-field" style={{ animationDelay: "0.15s" }}>
              <label className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      updateForm.description
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                  </span>
                  Description <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-gray-300 normal-case tracking-normal">
                  {(updateForm.description || "").length}/500
                </span>
              </label>
              <textarea
                value={updateForm.description}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, description: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 h-20 resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div
              className="col-span-2 ula-field border-2 border-dashed border-indigo-200 rounded-xl p-4 text-center bg-indigo-50/30 hover:border-indigo-300 transition-colors"
              style={{ animationDelay: "0.18s" }}
            >
              <button
                onClick={() => setShowFileModal(true)}
                className="flex flex-col items-center gap-2 mx-auto group"
              >
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                  <CloudUpload className="w-4 h-4 text-white" />
                </span>
                <span className="text-xs font-semibold text-indigo-600">
                  Browse Files
                </span>
              </button>
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-1 text-left">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white px-3 py-1 text-xs rounded-lg border border-gray-100 shadow-sm"
                    >
                      <span className="text-gray-600 truncate">{file.name}</span>
                      <button
                        onClick={() =>
                          setSelectedFiles(
                            selectedFiles.filter((_, i) => i !== index),
                          )
                        }
                        className="text-indigo-400 hover:text-indigo-600 ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Max 5MB · JPG, PNG, PDF, XLSX, DWG
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Follow-Up History */}
        <div className="w-1/2 px-6 py-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
              Follow-Up History
            </p>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-semibold border border-indigo-100">
              {followUpHistory.length} record(s)
            </span>
          </div>
          <div className="space-y-2">
            {followUpHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                <Clock className="w-8 h-8 mb-2" />
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
                  className={`ula-field border rounded-xl p-3 cursor-pointer transition-all select-none
                    ${previewFollowUp?.follow_up_id === item.follow_up_id ? "border-indigo-400 bg-indigo-50 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                  style={{ animationDelay: `${0.04 * idx}s` }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
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
                          ? new Date(item.follow_up_date).toLocaleDateString()
                          : "—"}
                      </span>
                      {previewFollowUp?.follow_up_id === item.follow_up_id ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
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
            <div className="mt-4 border border-indigo-200 rounded-xl bg-gradient-to-br from-indigo-50 to-white p-4 text-sm shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-indigo-500 text-xs uppercase tracking-wide">
                  Details
                </p>
                <button
                  onClick={() => setPreviewFollowUp(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {[
                  { label: "Activity Type", value: previewFollowUp.activity_type },
                  {
                    label: "Follow-Up Date",
                    value: previewFollowUp.follow_up_date
                      ? new Date(previewFollowUp.follow_up_date).toLocaleDateString()
                      : "—",
                  },
                  { label: "Contact Person", value: previewFollowUp.contact_person },
                  { label: "Follow-Up By", value: previewFollowUp.follow_up_by },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="font-semibold text-gray-700 text-sm mt-0.5">
                      {value || "—"}
                    </p>
                  </div>
                ))}
                <div>
                  <p className="text-xs text-gray-400 font-medium">Status</p>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block
                    ${previewFollowUp.status === "Completed" ? "bg-green-100 text-green-600" : previewFollowUp.status === "Cancelled" ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"}`}
                  >
                    {previewFollowUp.status}
                  </span>
                </div>
              </div>
              <div className="mt-2.5">
                <p className="text-xs text-gray-400 font-medium">Description</p>
                <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
                  {previewFollowUp.description || "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Fields marked * are required
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleCloseUpdateModal}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center gap-1.5 transition-all"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={updateLoading}
            className={`px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all shadow-md flex items-center gap-2
            ${updateLoading ? "bg-indigo-300 cursor-not-allowed shadow-none" : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-200"}`}
          >
            {updateLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Add Follow-Up
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Add Follow-Up
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* STATUS CHANGE POPUP (Won / Pending) */}

{showPopup && (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50"
    style={{ animation: "stcFadeIn 0.2s ease-out" }}
  >
    <style>{`
      @keyframes stcFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes stcPopIn {
        from { transform: scale(0.92) translateY(10px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }
    `}</style>

    <div
      className="bg-white rounded-2xl shadow-2xl w-80 border border-gray-100 overflow-hidden"
      style={{ animation: "stcPopIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center gap-3 px-5 py-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            }}
          >
            <i className="bi bi-arrow-repeat text-white text-lg"></i>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-wide">
              Confirm Status Change
            </h2>
            <p className="text-[10px] text-gray-500 font-medium">
              This will update the record status
            </p>
          </div>
        </div>
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full w-1/3 rounded-r-full"
            style={{
              background: "linear-gradient(to right, #6366f1, #8b5cf6)",
            }}
          ></div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to change status?
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={() => setShowPopup(false)}
          className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-1.5"
        >
          <i className="bi bi-x-lg text-xs"></i>
          Cancel
        </button>
        <button
          onClick={confirmStatusChange}
          className="text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-violet-200 flex bg-gradient-to-br from-indigo-500 to-violet-600 items-center gap-1.5"
          
        >
          <i className="bi bi-check-circle text-sm"></i>
          Yes, Change
        </button>
      </div>
    </div>
  </div>
)}

    {/* ═══════════════════════════════════════════════════════════════
    Juno banne popup blocks replace karo aa sathe.
    Image-2 structure + red theme (Lost = destructive action).
    Logic same — fakt UI changes.
   ═══════════════════════════════════════════════════════════════ */}

{/* ✅ LOST REASON POPUP */}
{showLostReasonPopup && (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50"
    style={{ animation: "lstFadeIn 0.2s ease-out" }}
  >
    <style>{`
      @keyframes lstFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes lstPopIn {
        from { transform: scale(0.92) translateY(10px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }
    `}</style>

    <div
      className="bg-white rounded-2xl shadow-2xl w-96 border border-gray-100 overflow-hidden"
      style={{ animation: "lstPopIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center gap-3 px-5 py-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
            }}
          >
            <i className="bi bi-x-octagon text-white text-lg"></i>
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 tracking-wide">
              Mark Lead as Lost
            </h2>
            <p className="text-[10px] text-gray-500 font-medium">
              This action requires a reason
            </p>
          </div>
        </div>
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full w-1/3 rounded-r-full"
            style={{
              background: "linear-gradient(to right, #ef4444, #dc2626)",
            }}
          ></div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
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
          className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm outline-none h-24 resize-none bg-gray-50 focus:border-red-400 focus:ring-1 focus:ring-red-200 transition-all placeholder:text-gray-400"
        />
        {lostReasonError && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <i className="bi bi-exclamation-circle text-[10px]"></i>
            {lostReasonError}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={() => {
            setShowLostReasonPopup(false);
            setLostReason("");
            setLostReasonError("");
          }}
          className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-1.5"
        >
          <i className="bi bi-x-lg text-xs"></i>
          Cancel
        </button>
        <button
          onClick={confirmLostStatusChange}
          className="text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-red-200 flex items-center gap-1.5"
          style={{
            background: "linear-gradient(to right, #ef4444, #dc2626)",
          }}
        >
          <i className="bi bi-x-octagon text-sm"></i>
          Confirm Lost
        </button>
      </div>
    </div>
  </div>
)}

{/* ✅ VIEW LOST REASON MODAL */}
{showViewReasonModal && viewReasonLead && (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50"
    style={{ animation: "vlrFadeIn 0.2s ease-out" }}
  >
    <style>{`
      @keyframes vlrFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes vlrPopIn {
        from { transform: scale(0.92) translateY(10px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }
    `}</style>

    <div
      className="bg-white rounded-2xl shadow-2xl w-96 border border-gray-100 overflow-hidden"
      style={{ animation: "vlrPopIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
              }}
            >
              <i className="bi bi-chat-left-text text-white text-base"></i>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 tracking-wide">
                Lost Reason
              </h2>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                {viewReasonLead.customer_name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowViewReasonModal(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full w-1/3 rounded-r-full"
            style={{
              background: "linear-gradient(to right, #ef4444, #dc2626)",
            }}
          ></div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-red-50/50 rounded-lg p-3 border border-red-100">
          {viewReasonLead.lost_reason || "No reason provided"}
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-end px-5 py-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={() => setShowViewReasonModal(false)}
          className="px-5 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-1.5"
        >
          <i className="bi bi-x-lg text-xs"></i>
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
                      const ext = (
                        file.name.split(".").pop() || ""
                      ).toLowerCase();
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
                      const fc = fileColors[ext] || {
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
                                selectedFiles.filter((_, index) => index !== i),
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
                className=" ml-auto bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-6  py-1.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-200 flex items-center gap-2 shrink-0"
              >
                <CheckCircle2 size={15} /> Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW LEAD MODAL */}
   {(showViewModal || isClosing) && viewLead && (
  <div
    className={`fixed inset-0 z-50 flex justify-end bg-gray-900/30 ${
      isClosing ? "lead-overlay-out" : "lead-overlay-in"
    }`}
  >
    <div
      className={`bg-white h-full w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col ${
        isClosing ? "lead-drawer-out" : "lead-drawer-in"
      }`}
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <i className="bi bi-eye-fill text-white text-lg"></i>
          </div>
          <div>
            <p className="text-base font-bold text-gray-800">
              {viewLead.customer_name || "Lead Details"}
            </p>
            <p className="text-xs text-gray-400">
              {viewLead.status
                ? `Status: ${viewLead.status}`
                : "Complete information about this lead"}
            </p>
          </div>
        </div>
        <button
          onClick={handleCloseModal}
          className="w-8 h-8 flex items-center justify-center text-violet-500 hover:bg-violet-50 rounded-lg transition-colors"
        >
          <i className="bi bi-x-lg text-base"></i>
        </button>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto flex-1">
        {[
          {
            icon: "bi-building",
            label: "Company",
            value: viewLead.company_name,
            bg: "bg-blue-50",
            iconColor: "text-blue-500",
          },
          {
            icon: "bi-person-circle",
            label: "Customer Name",
            value: viewLead.customer_name,
            bg: "bg-violet-50",
            iconColor: "text-violet-500",
          },
          {
            icon: "bi-flag",
            label: "Source",
            value: viewLead.source,
            bg: "bg-cyan-50",
            iconColor: "text-cyan-500",
          },
          {
            icon: "bi-geo-alt",
            label: "Location",
            value: viewLead.location,
            bg: "bg-teal-50",
            iconColor: "text-teal-500",
          },
          {
            icon: "bi-diagram-3",
            label: "Architecture",
            value: viewLead.architecture,
            bg: "bg-orange-50",
            iconColor: "text-orange-500",
          },
          {
            icon: "bi-tag",
            label: "Category",
            value: viewLead.category,
            bg: "bg-purple-50",
            iconColor: "text-purple-500",
          },
          {
            icon: "bi-telephone",
            label: "Mobile No",
            value: viewLead.mobile_no,
            bg: "bg-emerald-50",
            iconColor: "text-emerald-500",
          },
          {
            icon: "bi-person-check",
            label: "Assignee",
            value: viewLead.assignee,
            bg: "bg-indigo-50",
            iconColor: "text-indigo-500",
          },
          {
            icon: "bi-calendar3",
            label: "Created",
            value: viewLead.created_at
              ? new Date(viewLead.created_at).toLocaleDateString()
              : "—",
            bg: "bg-slate-100",
            iconColor: "text-slate-500",
          },
        ].map(({ icon, label, value, bg, iconColor }) => (
          <div
            key={label}
            className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${bg}`}>
              <i className={`bi ${icon} ${iconColor} text-base`}></i>
            </div>

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
          <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-amber-50">
            <i className="bi bi-pencil text-amber-500 text-base"></i>
          </div>
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
          <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-blue-50">
            <i className="bi bi-chat-left-text text-blue-500 text-base"></i>
          </div>
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
            <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-slate-100">
              <i className="bi bi-person-gear text-slate-500 text-base"></i>
            </div>
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
            <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-gray-100">
              <i className="bi bi-clock-history text-gray-500 text-base"></i>
            </div>
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

      {/* Footer */}
      <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
        <button
          onClick={handleCloseModal}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 bg-white hover:bg-gray-100 transition-all"
        >
          <i className="bi bi-x-lg text-xs"></i>
          Close
        </button>
      </div>
    </div>

    <style>{`
      @keyframes leadOverlayFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes leadOverlayFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes leadDrawerSlideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @keyframes leadDrawerSlideOut {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
      }
      .lead-overlay-in { animation: leadOverlayFadeIn 0.2s ease-out forwards; }
      .lead-overlay-out { animation: leadOverlayFadeOut 0.2s ease-in forwards; }
      .lead-drawer-in { animation: leadDrawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .lead-drawer-out { animation: leadDrawerSlideOut 0.25s ease-in forwards; }

      @media (prefers-reduced-motion: reduce) {
        .lead-overlay-in, .lead-overlay-out, .lead-drawer-in, .lead-drawer-out {
          animation: none !important;
        }
      }
    `}</style>
  </div>
)}
    </>
  );
}
