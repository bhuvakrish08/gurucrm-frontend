"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import { getCache, setCache, fetchWithRetry } from "@/utils/slowNetworkHelper";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import Select from "react-select";
import { checkRole } from "@/utils/checkRole";
import useAuth from "@/app/components/useAuth";
import { parseExcelDate, parseExcelNumber, applyColumnFormats } from "@/utils/excelUtils";
import { Building2, User, Bookmark } from "lucide-react";
import { Trash2, X } from "lucide-react";
export default function QuotationPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [isSplitReadOnly, setIsSplitReadOnly] = useState(false);
  const [splitForm, setSplitForm] = useState({
    amount: 0,
    amount_9: 0,
    amount_18: 0,
    percent_9: 0,
    percent_18: 100,
    tax_percent_9: "9.00",
    tax_percent_18: "18.00",
    tax_9: "0.00",
    tax_18: "0.00",
    grand_total: "0.00",
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // BUG FIX #1: Default tab changed from "sales" to "quotation"
  const [followUpTab, setFollowUpTab] = useState("quotation");

  const [previewFollowUp, setPreviewFollowUp] = useState(null);
  const [quotationData, setQuotationData] = useState(null);

  //view
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewQuotation, setViewQuotation] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

// slide-in slide-out
const closeQuotationDrawer = () => {
  const panel = document.getElementById("quotationDrawerPanel");
  const overlay = document.getElementById("quotationDrawerOverlay");
  if (panel)
    panel.style.animation = "qmSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards";
  if (overlay) overlay.style.animation = "qmFadeOut 0.3s ease-in forwards";
  setTimeout(() => setShowQuotationModal(false), 280);
};
const closeSplitDrawer = () => {
  const panel = document.getElementById("splitDrawerPanel");
  const overlay = document.getElementById("splitDrawerOverlay");
  if (panel)
    panel.style.animation = "spmSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards";
  if (overlay) overlay.style.animation = "spmFadeOut 0.3s ease-in forwards";
  setTimeout(() => handleCancelSplitClick(), 280);
};
 
const closeAssigneeDrawer = () => {
  const panel = document.getElementById("assigneeDrawerPanel");
  const overlay = document.getElementById("assigneeDrawerOverlay");
  if (panel)
    panel.style.animation = "asgSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards";
  if (overlay) overlay.style.animation = "asgFadeOut 0.3s ease-in forwards";
  setTimeout(() => closeAssigneePopover(), 280);
};


const closeViewDrawer = () => {
  const panel = document.getElementById("viewDrawerPanel");
  const overlay = document.getElementById("viewDrawerOverlay");
  if (panel)
    panel.style.animation = "vqmSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards";
  if (overlay) overlay.style.animation = "vqmFadeOut 0.3s ease-in forwards";
  setTimeout(() => setShowViewModal(false), 280);
};


const closeUpdateDrawer = () => {
  const panel = document.getElementById("updateDrawerPanel");
  const overlay = document.getElementById("updateDrawerOverlay");
  if (panel)
    panel.style.animation = "updSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards";
  if (overlay) overlay.style.animation = "updFadeOut 0.3s ease-in forwards";
  setTimeout(() => {
    setShowUpdateModal(false);
    setSelectedFiles([]);
    setPreviewFollowUp(null);
    // BUG FIX #1: Reset to "quotation" tab on close too
    setFollowUpTab("quotation");
  }, 280);
};
  // follow-up
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    follow_up_date: new Date().toISOString().split("T")[0],
    activity_type: "",
    follow_up_by: "",
    contact_person: "",
    // BUG FIX #2: Added quotation_no field to updateForm
    quotation_no: "",
    description: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // PI Modal States
  const [showPIModal, setShowPIModal] = useState(false);
  const [selectedPIQuotation, setSelectedPIQuotation] = useState(null);
  const [piPercentage, setPiPercentage] = useState("");
  const [piRupees, setPiRupees] = useState("");
  const [isCreatingPI, setIsCreatingPI] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignQuotation, setSelectedAssignQuotation] = useState(null);
  const [assignForm, setAssignForm] = useState({
    assigned_to: "",
    task_datetime: "",
    work_description: "",
  });

  // ===== LOST REASON FEATURE STATES =====
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [lostReasonText, setLostReasonText] = useState("");
  const [lostReasonTargetId, setLostReasonTargetId] = useState(null);
  const [isSubmittingLostReason, setIsSubmittingLostReason] = useState(false);

  const [showViewReasonModal, setShowViewReasonModal] = useState(false);
  const [viewReasonText, setViewReasonText] = useState("");
  // ===== END LOST REASON FEATURE STATES =====

  // Assignee Popover States
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [selectedAssigneeRow, setSelectedAssigneeRow] = useState(null);
  const [newAssigneeValue, setNewAssigneeValue] = useState(null);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [assigneePopoverPos, setAssigneePopoverPos] = useState({
    top: 0,
    left: 0,
  });
  const [assigneeDescription, setAssigneeDescription] = useState("");
  const [assigneeFiles, setAssigneeFiles] = useState([]);

  // Assignee History States
  const [assigneeLog, setAssigneeLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // PI Assignee Selection Modal States
  const [showPiUserSelectModal, setShowPiUserSelectModal] = useState(false);
  const [availablePiUsers, setAvailablePiUsers] = useState([]);
  const [selectedPiUserForApproval, setSelectedPiUserForApproval] =
    useState("");
  const [approveTargetHistId, setApproveTargetHistId] = useState(null);

  const [form, setForm] = useState({
    quotation_no: "",
    quotation_date: new Date().toISOString().split("T")[0],
    activity_type: "",
    quotation_status: "Pending",
    assignee: "",
    amount: "",
    discount: "",
    discount_rs: "",
    tax: "0",
    grand_total: "",
    description: "",
    amount_9: "",
    amount_18: "",
    tax_percent_9: "",
    tax_percent_18: "",
    tax_9: "",
    tax_18: "",
  });

  useAuth(["Admin", "Super Admin", "Sales", "Estimation"]);

  const isApprovedLocked = followUpHistory.some(
    (h) => h.quotation_status === "Approved",
  );
  const isWonOrLostLocked =
    selectedLead?.displayStatus === "Won" ||
    selectedLead?.displayStatus === "Lost";
  const isModalLocked = isApprovedLocked || isWonOrLostLocked;

  const isQuotationNoLocked = (() => {
    const hasHistoryNo =
      followUpHistory &&
      followUpHistory.some(
        (item) => item.quotation_no && String(item.quotation_no).trim() !== "",
      );
    if (hasHistoryNo) return true;
    if (
      selectedLead?.quotation_no &&
      String(selectedLead.quotation_no).trim() !== ""
    ) {
      return true;
    }
    if (
      selectedQuotation?.quotation_no &&
      String(selectedQuotation.quotation_no).trim() !== ""
    ) {
      return true;
    }
    return false;
  })();

  const fetchHistoryData = async (quotationId) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/quotation-revision/${quotationId}/full-details`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const quotationHistory =
        res.data?.data?.revisions?.map((item) => ({
          ...item,
          module_type: "quotation",
        })) || [];

      const salesHistory =
        res.data?.data?.follow_ups?.map((item) => ({
          ...item,
          module_type: "sales",
        })) || [];

      const mergedHistory = [...quotationHistory, ...salesHistory].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setFollowUpHistory(mergedHistory);
    } catch (err) {
      console.log("HISTORY ERROR =", err);
      toast.error("Failed to load history");
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdateLoading(true);

      // FormData બનાવો files સાથે
      const formData = new FormData();
      formData.append("quotation_id", selectedQuotation?.id);
      formData.append(
        "quotation_no",
        updateForm.quotation_no || selectedQuotation?.quotation_no || "",
      );
      formData.append("follow_up_date", updateForm.follow_up_date);
      formData.append("activity_type", updateForm.activity_type);
      formData.append("follow_up_by", updateForm.follow_up_by);
      formData.append("contact_person", updateForm.contact_person);
      formData.append("description", updateForm.description);

      // Files append કરો
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });
      }

      const res = await axios.post(
        `${API_BASE}/api/quotation-revision/insert`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Follow-up added successfully!");

      if (selectedQuotation?.id) {
        await fetchHistoryData(selectedQuotation.id);
      }

      setUpdateForm({
        follow_up_date: new Date().toISOString().split("T")[0],
        activity_type: "",
        follow_up_by: "",
        contact_person: "",
        quotation_no:
          updateForm.quotation_no || selectedQuotation?.quotation_no || "",
        description: "",
      });
      setSelectedFiles([]);
      setPreviewFollowUp(null);
    } catch (error) {
      console.log("ERROR =", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setUpdateLoading(false);
    }
  };

  //view
  const handleViewQuotation = async (quotationId) => {
    try {
      setViewLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/quotation/full-details/${quotationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setViewQuotation(res.data.data);
      setShowViewModal(true);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load quotation details");
    } finally {
      setViewLoading(false);
    }
  };

  // ========================
  // FETCH
  // ========================
  const fetchQuotations = async () => {
    // 1. Instantly display cached data if present (SWR)
    const cachedQuotations = getCache("quotations_list_cached");
    if (cachedQuotations && Array.isArray(cachedQuotations)) {
      setQuotations(cachedQuotations);
      setLoading(false);
    }

    try {
      const res = await fetchWithRetry(
        `${API_BASE}/api/quotation/read`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
        { timeout: 15000, maxRetries: 2 }
      );

      const data = (res.data?.result || []).map((item) => {
        const finalStatus =
          item.quotation_status === "Approved"
            ? "Won"
            : item.quotation_status === "Declined"
              ? "Pending"
              : item.quotation_status || "Pending";
        return {
          ...item,
          displayStatus: finalStatus,
          wasApprovedOnce:
            item.has_approved ||
            item.quotation_status === "Won" ||
            item.quotation_status === "Lost",
          pi_exists:
            item.proforma_percentage && Number(item.proforma_percentage) > 0,
        };
      });

      const userRole = localStorage.getItem("role") || "";
      const userFirstName = (localStorage.getItem("username") || "")
        .split(" ")[0]
        .toLowerCase();
      let filteredData = data;
      if (userRole.toLowerCase() === "sales") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee
                .split(",")
                .map((name) => name.trim().toLowerCase())
            : [];
          if (q.displayStatus === "Pending" && qAssignees.length > 0) {
            const isAssignedToMe = qAssignees.some((name) =>
              name.includes(userFirstName),
            );
            if (!isAssignedToMe) {
              return false;
            }
          }

          const hasBeenAssigned =
            qAssignees.some((name) => name.includes(userFirstName)) ||
            lAssignees.some((name) => name.includes(userFirstName));

          let inLog = false;
          if (q.assignee_log) {
            try {
              const logs = JSON.parse(q.assignee_log);
              inLog = logs.some(
                (log) =>
                  (log.previous_assignee &&
                    log.previous_assignee
                      .toLowerCase()
                      .includes(userFirstName)) ||
                  (log.new_assignee &&
                    log.new_assignee.toLowerCase().includes(userFirstName)),
              );
            } catch {}
          }
          return hasBeenAssigned || inLog;
        });
      } else if (userRole.toLowerCase() === "estimation") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee
                .split(",")
                .map((name) => name.trim().toLowerCase())
            : [];

          const matchesQuotation = qAssignees.some((name) =>
            name.includes(userFirstName),
          );
          const matchesLead = lAssignees.some((name) =>
            name.includes(userFirstName),
          );

          if (qAssignees.length === 0) {
            return matchesLead;
          }
          return matchesQuotation;
        });
      }
      setQuotations(filteredData);
      setCache("quotations_list_cached", filteredData);
    } catch (err) {
      console.log("[Quotations Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
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

  // ========================
  // FETCH ASSIGNEE LOG
  // ========================
  const fetchAssigneeLog = async (lead_id) => {
    try {
      setLoadingLog(true);
      const res = await axios.get(
        `${API_BASE}/api/quotation/assignee-log/${lead_id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setAssigneeLog(res.data?.log || []);
    } catch (err) {
      console.log("Assignee log fetch error:", err);
      setAssigneeLog([]);
    } finally {
      setLoadingLog(false);
    }
  };

  // ========================
  // EXPORT TO EXCEL
  // ========================
  const exportToExcel = async () => {
    try {
      if (filteredQuotations.length === 0) {
        toast.error("No data available to export");
        return;
      }
      const XLSX = await import("xlsx");
      const exportData = filteredQuotations.map((q, index) => ({
        "#": index + 1,
        "Company Name": q.company_name || "",
        "Customer Name": q.customer_name || "",
        Reference: q.reference || "",
        "Mobile No": q.mobile_no || "",
        "Quotation No": q.quotation_no || "",
        "Created Date": parseExcelDate(q.first_quotation_date),
        "Last Activity": parseExcelDate(q.quotation_date || q.quotation_created_at),
        "Grand Total (₹)": parseExcelNumber(q.grand_total, 0),
        Assignee: q.assignee || "",
        Status: q.displayStatus || "",
        "Proforma %": q.proforma_percentage !== null && q.proforma_percentage !== undefined && q.proforma_percentage !== ""
          ? parseExcelNumber(q.proforma_percentage, 0) / 100
          : "",
        "Updated By": q.updated_by || "",
        "Updated At": parseExcelDate(q.updated_at),
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData, {
        cellDates: true,
        dateNF: "dd-mm-yyyy",
      });
      applyColumnFormats(XLSX, worksheet, exportData, {
        "Grand Total (₹)": "#,##0.00",
        "Proforma %": "0%",
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations");
      const colWidths = Object.keys(exportData[0]).map((key) => ({
        wch: Math.max(key.length, 18),
      }));
      worksheet["!cols"] = colWidths;
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5).replace(":", "-");
      const fileName = `Quotation_${activeTab}_(${date})_${time}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Excel exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.log("Excel Export Error:", err);
      toast.error("Excel export failed");
    }
  };

  // ========================
  // EXPORT TO PDF
  // ========================
  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`Quotations Report - ${activeTab}`, 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Exported on: ${new Date().toLocaleDateString("en-GB")}   |   Total Records: ${filteredQuotations.length}`,
        14,
        22,
      );
      const tableData = filteredQuotations.map((q, index) => [
        index + 1,
        q.company_name || "",
        q.customer_name || "",
        q.reference || "",
        q.quotation_no || "",
        q.first_quotation_date
          ? new Date(q.first_quotation_date).toLocaleDateString()
          : "",
        q.quotation_date
          ? new Date(q.quotation_date).toLocaleDateString()
          : q.quotation_created_at
            ? new Date(q.quotation_created_at).toLocaleDateString()
            : "",
        q.grand_total ? `Rs.${Number(q.grand_total).toLocaleString()}` : "",
        q.assignee || "",
        q.displayStatus || "",
        q.proforma_percentage
          ? `${Number(q.proforma_percentage).toFixed(0)}%`
          : "-",
      ]);
      autoTable(doc, {
        startY: 27,
        head: [
          [
            "#",
            "Company",
            "Customer",
            "Reference",
            "Quot. No",
            "Created",
            "Last Activity",
            "Grand Total",
            "Assignee",
            "Status",
            "PI %",
          ],
        ],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        columnStyles: {
          0: { cellWidth: 8 },
          3: { cellWidth: 32 },
          9: { cellWidth: 20 },
        },
      });
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5).replace(":", "-");
      doc.save(`Quotation_${activeTab}_(${date})_${time}.pdf`);
      toast.success("PDF exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.log(err);
      toast.error("PDF export failed");
    }
  };

  // ========================
  // FILTER
  // ========================
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const debounceRef = useRef(null);
  const [filters, setFilters] = useState({
    company_name: "",
    customer_name: "",
    reference: "",
    assignee: "",
    quotation_status: "",
    from_date: "",
    to_date: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const searchQuotations = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== ""),
      );
      const res = await axios.get(`${API_BASE}/api/quotation/filter`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = (res.data?.data || []).map((item) => {
        const finalStatus =
          item.quotation_status === "Approved"
            ? "Won"
            : item.quotation_status === "Declined"
              ? "Pending"
              : item.quotation_status || "Pending";
        return {
          ...item,
          displayStatus: finalStatus,
          wasApprovedOnce:
            item.has_approved ||
            item.quotation_status === "Approved" ||
            item.quotation_status === "Lost",
          pi_exists:
            item.proforma_percentage && Number(item.proforma_percentage) > 0,
        };
      });

      const userRole = localStorage.getItem("role") || "";
      const userFirstName = (localStorage.getItem("username") || "")
        .split(" ")[0]
        .toLowerCase();
      let filteredData = data;
      if (userRole.toLowerCase() === "sales") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee
                .split(",")
                .map((name) => name.trim().toLowerCase())
            : [];
          if (q.displayStatus === "Pending" && qAssignees.length > 0) {
            const isAssignedToMe = qAssignees.some((name) =>
              name.includes(userFirstName),
            );
            if (!isAssignedToMe) {
              return false;
            }
          }

          const hasBeenAssigned =
            qAssignees.some((name) => name.includes(userFirstName)) ||
            lAssignees.some((name) => name.includes(userFirstName));

          let inLog = false;
          if (q.assignee_log) {
            try {
              const logs = JSON.parse(q.assignee_log);
              inLog = logs.some(
                (log) =>
                  (log.previous_assignee &&
                    log.previous_assignee
                      .toLowerCase()
                      .includes(userFirstName)) ||
                  (log.new_assignee &&
                    log.new_assignee.toLowerCase().includes(userFirstName)),
              );
            } catch {}
          }
          return hasBeenAssigned || inLog;
        });
      } else if (userRole.toLowerCase() === "estimation") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee
                .split(",")
                .map((name) => name.trim().toLowerCase())
            : [];

          const matchesQuotation = qAssignees.some((name) =>
            name.includes(userFirstName),
          );
          const matchesLead = lAssignees.some((name) =>
            name.includes(userFirstName),
          );

          if (qAssignees.length === 0) {
            return matchesLead;
          }
          return matchesQuotation;
        });
      }
      setQuotations(filteredData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const hasFilter = Object.values(filters).some((v) => v !== "");
    if (!hasFilter) {
      fetchQuotations();
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchQuotations();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      company_name: "",
      customer_name: "",
      reference: "",
      assignee: "",
      quotation_status: "",
      from_date: "",
      to_date: "",
    });
    fetchQuotations();
  };

  // ===== UPDATED: now supports optional reason (for Lost status) =====
  const handleTableStatusChange = async (id, newStatus, reason = "") => {
    try {
      const payload = { quotation_status: newStatus };
      if (newStatus === "Lost") {
        payload.lost_reason = reason;
      }
      await axios.put(
        `${API_BASE}/api/quotation/update-status/${id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Status updated");
      setQuotations((prev) =>
        prev.map((q) => {
          if (q.latest_quotation_id !== id) return q;
          return {
            ...q,
            quotation_status: newStatus,
            displayStatus: newStatus,
            lost_reason: newStatus === "Lost" ? reason : q.lost_reason,
            wasApprovedOnce:
              q.wasApprovedOnce || newStatus === "Won" || newStatus === "Lost",
          };
        }),
      );
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // ===== NEW: wrapper that intercepts "Lost" selection to open reason modal =====
  const handleStatusSelectChange = (id, newStatus) => {
    if (newStatus === "Lost") {
      setLostReasonTargetId(id);
      setLostReasonText("");
      setShowLostReasonModal(true);
    } else {
      handleTableStatusChange(id, newStatus);
    }
  };

  // ===== NEW: submit handler for the Lost Reason modal =====
  const handleSubmitLostReason = async () => {
    if (!lostReasonText.trim()) {
      toast.error("Please enter a reason for losing this quotation");
      return;
    }
    setIsSubmittingLostReason(true);
    await handleTableStatusChange(
      lostReasonTargetId,
      "Lost",
      lostReasonText.trim(),
    );
    setIsSubmittingLostReason(false);
    setShowLostReasonModal(false);
    setLostReasonText("");
    setLostReasonTargetId(null);
  };

  // ========================
  // QUOTATION HISTORY MODAL
  // ========================
  const openQuotationModal = async (lead) => {
    setSelectedLead(lead);
    setShowQuotationModal(true);
    setFollowUpHistory([]);
    setEditingId(null);
    setForm({
      quotation_no: "",
      quotation_date: new Date().toISOString().split("T")[0],
      activity_type: "",
      quotation_status:
        lead.displayStatus === "Revision" ? "Revision" : "Pending",
      assignee: lead.assignee || "",
      discount: "",
      tax: "",
      amount: "",
      grand_total: "",
      description: "",
      amount_9: "",
      amount_18: "",
      tax_9: "",
      tax_18: "",
    });
    try {
      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${lead.lead_id}`,
      );
      const historyData = res.data?.result || [];
      if (historyData.length > 0) {
        setSelectedLead((prev) => ({
          ...prev,
          latest_quotation_id: historyData[0].id,
        }));
      }

      if (historyData.length > 0 && !lead.latest_quotation_id) {
        setSelectedLead((prev) => ({
          ...prev,
          latest_quotation_id: historyData[0].id,
        }));
      }

      const historyWithFiles = await Promise.all(
        historyData.map(async (hist) => {
          const hf = await axios.get(
            `${API_BASE}/api/quotation/files/${hist.id}`,
          );
          return { ...hist, files: hf.data?.files || [] };
        }),
      );
      setFollowUpHistory(historyWithFiles);
      if (historyData.length > 0) {
        const isAllowedToEditFull = checkRole([
          "Admin",
          "Super Admin",
          "Sales",
        ]);
        if (isAllowedToEditFull) {
          const latest = historyData[0];
          setForm((prev) => ({
            ...prev,
            quotation_no: latest.quotation_no || prev.quotation_no,
            quotation_date: latest.quotation_date
              ? new Date(latest.quotation_date).toISOString().split("T")[0]
              : prev.quotation_date,
            activity_type: latest.activity_type || prev.activity_type,
            quotation_status: latest.quotation_status || prev.quotation_status,
            assignee: latest.assignee || prev.assignee,
            amount:
              latest.amount !== null && latest.amount !== undefined
                ? latest.amount.toString()
                : "",
            grand_total:
              latest.grand_total !== null && latest.grand_total !== undefined
                ? latest.grand_total.toString()
                : "",
            description: latest.description || "",
            discount:
              latest.discount !== null && latest.discount !== undefined
                ? latest.discount.toString()
                : "",
            tax:
              latest.tax !== null && latest.tax !== undefined
                ? latest.tax.toString()
                : "",
            amount_9:
              latest.amount_9 !== null && latest.amount_9 !== undefined
                ? latest.amount_9.toString()
                : "",
            amount_18:
              latest.amount_18 !== null && latest.amount_18 !== undefined
                ? latest.amount_18.toString()
                : "",
            tax_percent_9:
              latest.tax_percent_9 !== null &&
              latest.tax_percent_9 !== undefined
                ? latest.tax_percent_9.toString()
                : "",
            tax_percent_18:
              latest.tax_percent_18 !== null &&
              latest.tax_percent_18 !== undefined
                ? latest.tax_percent_18.toString()
                : "",
            tax_9:
              latest.tax_9 !== null && latest.tax_9 !== undefined
                ? latest.tax_9.toString()
                : "",
            tax_18:
              latest.tax_18 !== null && latest.tax_18 !== undefined
                ? latest.tax_18.toString()
                : "",
          }));
          setEditingId(latest.id);
        } else {
          setForm((prev) => ({
            ...prev,
            quotation_no: historyData[0].quotation_no || prev.quotation_no,
            assignee: historyData[0].assignee || prev.assignee,
          }));
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ===================================================
  // 🚦 QUOTATION TRAFFIC LIGHT DOT
  // Returns a colored dot JSX based on quotation_dot_color from API
  // ===================================================
  const getQuotationTrafficDot = (q) => {
    const status = q?.quotation_status || "Pending";

    // Only show traffic light color dot for Pending and Sent stages
    if (!["Pending", "Sent"].includes(status)) {
      return null;
    }

    const color = q.quotation_dot_color || "green"; // 'green' | 'yellow' | 'red'

    const dotColors = {
      green: "#22c55e",
      yellow: "#eab308",
      red: "#ef4444",
    };

    const tooltips =
      status === "Sent"
        ? {
            green: "✅ Sent: Converted/Responded in < 3 days",
            yellow: "⚠️ Sent: Pending 3 to 5 days — Attention needed",
            red: "🔴 Sent: Overdue > 5 days — Critical",
          }
        : {
            green: "✅ Pending: Response time on track (< 24h)",
            yellow: "⚠️ Pending: Action delayed (24h - 48h)",
            red: "🔴 Pending: Action critically delayed (> 48h)",
          };

    const isPulse = color === "yellow" || color === "red";

    return (
      <span
        title={tooltips[color] || tooltips.green}
        style={{
          display: "inline-block",
          width: 9,
          height: 9,
          borderRadius: "50%",
          backgroundColor: dotColors[color] || dotColors.green,
          flexShrink: 0,
          animation: isPulse ? "pulse 1.5s infinite" : "none",
        }}
      />
    );
  };

  const openAssignModal = (quotation) => {
    setSelectedAssignQuotation(quotation);
    setAssignForm({
      assigned_to: "",
      task_datetime: "",
      work_description: "",
    });
    setShowAssignModal(true);
  };

  const handleEditClick = (item) => {
    if (isModalLocked) {
      toast.error("Quotation is locked. No changes allowed.");
      return;
    }
    setEditingId(item.id);
    setForm({
      quotation_no: item.quotation_no || "",
      quotation_date: item.quotation_date
        ? new Date(item.quotation_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      activity_type: item.activity_type || "",
      quotation_status: item.quotation_status || "Pending",
      assignee: item.assignee || "",
      amount: item.amount || "",
      discount: item.discount || "",
      tax: item.tax || "0",
      grand_total: item.grand_total || "",
      description: item.description || "",
      amount_9:
        item.amount_9 !== null && item.amount_9 !== undefined
          ? item.amount_9
          : "",
      amount_18:
        item.amount_18 !== null && item.amount_18 !== undefined
          ? item.amount_18
          : "",
      tax_percent_9:
        item.tax_percent_9 !== null && item.tax_percent_9 !== undefined
          ? item.tax_percent_9
          : "",
      tax_percent_18:
        item.tax_percent_18 !== null && item.tax_percent_18 !== undefined
          ? item.tax_percent_18
          : "",
      tax_9: item.tax_9 !== null && item.tax_9 !== undefined ? item.tax_9 : "",
      tax_18:
        item.tax_18 !== null && item.tax_18 !== undefined ? item.tax_18 : "",
    });
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (
      name === "amount" ||
      name === "grand_total" ||
      name === "discount" ||
      name === "discount_rs" ||
      name === "tax"
    ) {
      value = value.replace(/[^0-9.]/g, "");
      const parts = value.split(".");
      value =
        parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : value;
    }
    let newForm = { ...form, [name]: value };
    if (name === "activity_type") {
      newForm.quotation_status =
        value === "Sent"
          ? "Sent"
          : value === "Revision"
            ? "Revision"
            : "Pending";
    }
    const getNum = (val) => parseFloat(val) || 0;
    let amount = name === "amount" ? getNum(value) : getNum(newForm.amount);
    let discount =
      name === "discount" ? getNum(value) : getNum(newForm.discount);
    let discount_rs =
      name === "discount_rs" ? getNum(value) : getNum(newForm.discount_rs);
    let tax = name === "tax" ? getNum(value) : getNum(newForm.tax);
    if (name === "amount") {
      discount_rs = (amount * discount) / 100;
      newForm.discount_rs = discount_rs > 0 ? discount_rs.toFixed(2) : "";
      // Initialize default participation values:
      newForm.amount_9 = 0;
      newForm.amount_18 = amount;
      newForm.tax_percent_9 = newForm.tax_percent_9 || "9.00";
      newForm.tax_percent_18 = newForm.tax_percent_18 || "18.00";
      newForm.tax_9 = "0.00";
      const pct18 = parseFloat(newForm.tax_percent_18) || 18;
      newForm.tax_18 = ((amount * pct18) / 100).toFixed(2);
      newForm.grand_total = (amount + parseFloat(newForm.tax_18)).toFixed(2);
    } else if (name === "discount") {
      discount_rs = (amount * discount) / 100;
      newForm.discount_rs = discount_rs > 0 ? discount_rs.toFixed(2) : "";
    } else if (name === "discount_rs") {
      discount = amount > 0 ? (discount_rs / amount) * 100 : 0;
      newForm.discount = discount > 0 ? discount.toFixed(2) : "";
    }
    if (name !== "amount") {
      const hasSplits = newForm.amount_9 !== "" || newForm.amount_18 !== "";
      if (hasSplits) {
        const amtVal = parseFloat(newForm.amount) || 0;
        const tax9Val = parseFloat(newForm.tax_9) || 0;
        const tax18Val = parseFloat(newForm.tax_18) || 0;
        newForm.grand_total = (amtVal + tax9Val + tax18Val).toFixed(2);
      } else {
        let subTotal = amount - discount_rs;
        let totalTaxRs = (subTotal * tax) / 100;
        let grand_total = subTotal + totalTaxRs;
        newForm.grand_total = grand_total > 0 ? grand_total.toFixed(2) : "";
      }
    }
    setForm(newForm);
  };

  const openSplitModal = (readOnly = false) => {
    if (isModalLocked && !readOnly) {
      toast.error("Quotation is locked. Cannot edit participation.");
      return;
    }
    if (!readOnly && !["Sent", "Approved", "Won"].includes(form.quotation_status)) {
      toast.error("Tax calculations can only be configured in the Sent stage.");
      return;
    }
    const isAllowedToParticipate = checkRole(["Admin", "Super Admin", "Sales"]);
    if (!isAllowedToParticipate && !readOnly) {
      toast.error("You do not have permission to configure tax calculation.");
      return;
    }
    const amt = parseFloat(form.amount) || 0;
    const pct9 =
      form.tax_percent_9 !== "" && form.tax_percent_9 !== undefined
        ? parseFloat(form.tax_percent_9)
        : 9;
    const pct18 =
      form.tax_percent_18 !== "" && form.tax_percent_18 !== undefined
        ? parseFloat(form.tax_percent_18)
        : 18;

    let amt9 = 0;
    let amt18 = 0;
    if (
      (form.amount_9 === "" ||
        form.amount_9 === undefined ||
        parseFloat(form.amount_9) === 0) &&
      (form.amount_18 === "" ||
        form.amount_18 === undefined ||
        parseFloat(form.amount_18) === 0)
    ) {
      amt18 = amt;
    } else {
      amt9 = parseFloat(form.amount_9) || 0;
      amt18 = parseFloat(form.amount_18) || 0;
    }

    const t9 = parseFloat(form.tax_9) || (amt9 * pct9) / 100;
    const t18 = parseFloat(form.tax_18) || (amt18 * pct18) / 100;
    const gt = parseFloat(form.grand_total) || amt9 + t9 + amt18 + t18;

    const splitPercent9 = amt > 0 ? (amt9 / amt) * 100 : 0;
    const splitPercent18 = amt > 0 ? (amt18 / amt) * 100 : 100;

    setSplitForm({
      amount: amt,
      amount_9: amt9 === 0 ? "" : amt9.toString(),
      amount_18: amt18 === 0 ? "" : amt18.toString(),
      percent_9:
        splitPercent9 === 0 ? "" : Number(splitPercent9.toFixed(4)).toString(),
      percent_18:
        splitPercent18 === 0
          ? ""
          : Number(splitPercent18.toFixed(4)).toString(),
      tax_percent_9: pct9.toString(),
      tax_percent_18: pct18.toString(),
      tax_9: t9.toFixed(2),
      tax_18: t18.toFixed(2),
      grand_total: gt.toFixed(2),
    });
    setIsSplitReadOnly(readOnly);
    setShowSplitModal(true);
  };

  const handleCancelSplitClick = () => {
    setShowSplitModal(false);
  };

  const handleSplitBaseAmountChange = (e) => {
    if (isSplitReadOnly) return;
    let rawVal = e.target.value.replace(/[^0-9.]/g, "");
    const parts = rawVal.split(".");
    rawVal =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : rawVal;

    const value = parseFloat(rawVal) || 0;
    const pct18 = parseFloat(splitForm.tax_percent_18) || 18;
    const t18 = (value * pct18) / 100;
    setSplitForm({
      ...splitForm,
      amount: rawVal,
      amount_9: "",
      amount_18: value === 0 ? "" : rawVal,
      percent_9: "",
      percent_18: "100",
      tax_9: "0.00",
      tax_18: t18.toFixed(2),
      grand_total: (value + t18).toFixed(2),
    });
  };

  const handleSplitFormChange = (e) => {
    if (isSplitReadOnly) return;
    let { name, value } = e.target;
    value = value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    value = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : value;

    const totalAmt = parseFloat(splitForm.amount) || 0;

    let rawAmt9 = splitForm.amount_9;
    let rawAmt18 = splitForm.amount_18;
    let rawPercent9 = splitForm.percent_9;
    let rawPercent18 = splitForm.percent_18;
    let rawTaxPercent9 = splitForm.tax_percent_9;
    let rawTaxPercent18 = splitForm.tax_percent_18;

    let numAmt9 = parseFloat(rawAmt9) || 0;
    let numAmt18 = parseFloat(rawAmt18) || 0;
    let numPercent9 = parseFloat(rawPercent9) || 0;
    let numPercent18 = parseFloat(rawPercent18) || 0;

    if (name === "amount_9") {
      rawAmt9 = value;
      const val = parseFloat(value) || 0;
      numAmt9 = Math.min(val, totalAmt);
      if (val > totalAmt) rawAmt9 = totalAmt.toString();
      numAmt18 = totalAmt - numAmt9;
      rawAmt18 = numAmt18.toString();

      numPercent9 = totalAmt > 0 ? (numAmt9 / totalAmt) * 100 : 0;
      numPercent18 = 100 - numPercent9;
      rawPercent9 = numPercent9.toString();
      rawPercent18 = numPercent18.toString();
    } else if (name === "amount_18") {
      rawAmt18 = value;
      const val = parseFloat(value) || 0;
      numAmt18 = Math.min(val, totalAmt);
      if (val > totalAmt) rawAmt18 = totalAmt.toString();
      numAmt9 = totalAmt - numAmt18;
      rawAmt9 = numAmt9.toString();

      numPercent18 = totalAmt > 0 ? (numAmt18 / totalAmt) * 100 : 0;
      numPercent9 = 100 - numPercent18;
      rawPercent18 = numPercent18.toString();
      rawPercent9 = numPercent9.toString();
    } else if (name === "percent_9") {
      rawPercent9 = value;
      const val = parseFloat(value) || 0;
      numPercent9 = Math.min(val, 100);
      if (val > 100) rawPercent9 = "100";
      numPercent18 = 100 - numPercent9;
      rawPercent18 = numPercent18.toString();

      numAmt9 = (totalAmt * numPercent9) / 100;
      numAmt18 = totalAmt - numAmt9;
      rawAmt9 = numAmt9.toString();
      rawAmt18 = numAmt18.toString();
    } else if (name === "percent_18") {
      rawPercent18 = value;
      const val = parseFloat(value) || 0;
      numPercent18 = Math.min(val, 100);
      if (val > 100) rawPercent18 = "100";
      numPercent9 = 100 - numPercent18;
      rawPercent9 = numPercent9.toString();

      numAmt18 = (totalAmt * numPercent18) / 100;
      numAmt9 = totalAmt - numAmt18;
      rawAmt9 = numAmt9.toString();
      rawAmt18 = numAmt18.toString();
    } else if (name === "tax_percent_9") {
      rawTaxPercent9 = value;
    } else if (name === "tax_percent_18") {
      rawTaxPercent18 = value;
    }

    const numericPct9 = parseFloat(rawTaxPercent9) || 0;
    const numericPct18 = parseFloat(rawTaxPercent18) || 0;

    const t9 = (numAmt9 * numericPct9) / 100;
    const t18 = (numAmt18 * numericPct18) / 100;
    const gt = numAmt9 + t9 + numAmt18 + t18;

    const formatStr = (val) => {
      const n = parseFloat(val);
      if (isNaN(n)) return "";
      if (n === 0) return "";
      if (val.toString().endsWith(".")) return val.toString();
      return Number(n.toFixed(4)).toString();
    };

    setSplitForm({
      amount: totalAmt,
      amount_9: name === "amount_9" ? value : formatStr(rawAmt9),
      amount_18: name === "amount_18" ? value : formatStr(rawAmt18),
      percent_9: name === "percent_9" ? value : formatStr(rawPercent9),
      percent_18: name === "percent_18" ? value : formatStr(rawPercent18),
      tax_percent_9: rawTaxPercent9,
      tax_percent_18: rawTaxPercent18,
      tax_9: t9.toFixed(2),
      tax_18: t18.toFixed(2),
      grand_total: gt.toFixed(2),
    });
  };

  const handleApplySplit = () => {
    const amt9 = parseFloat(splitForm.amount_9) || 0;
    const amt18 = parseFloat(splitForm.amount_18) || 0;
    setForm((prev) => ({
      ...prev,
      amount: splitForm.amount,
      amount_9: amt9 === 0 ? "" : amt9,
      amount_18: amt18 === 0 ? "" : amt18,
      tax_percent_9: splitForm.tax_percent_9,
      tax_percent_18: splitForm.tax_percent_18,
      tax_9: splitForm.tax_9,
      tax_18: splitForm.tax_18,
      grand_total: splitForm.grand_total,
    }));
    setShowSplitModal(false);
  };

  const proceedStatusUpdate = async (histId, status, assignedPiUser = null) => {
    try {
      const payload = { quotation_status: status };
      if (assignedPiUser) {
        payload.assigned_pi_user = assignedPiUser;
      }

      await axios.put(
        `${API_BASE}/api/quotation/update-status/${histId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const historyRes = await axios.get(
        `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`,
      );

      setFollowUpHistory(historyRes.data.result || []);

      toast.success(`Quotation marked as ${status}`);

      setQuotations((prev) =>
        prev.map((q) => {
          if (q.lead_id !== selectedLead.lead_id) return q;
          return {
            ...q,
            quotation_status:
              status === "Approved" ? q.quotation_status : "Pending",
            displayStatus: status === "Approved" ? "Won" : "Pending",
            wasApprovedOnce: status === "Approved",
          };
        }),
      );

      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`,
      );
      const historyData = res.data?.result || [];
      const historyWithFiles = await Promise.all(
        historyData.map(async (hist) => {
          const hf = await axios.get(
            `${API_BASE}/api/quotation/files/${hist.id}`,
          );
          return { ...hist, files: hf.data?.files || [] };
        }),
      );
      setFollowUpHistory(historyWithFiles);

      if (status === "Approved") {
        setActiveTab("Won");
      } else if (status === "Declined") {
        setActiveTab("Pending");
      }

      await fetchQuotations();
    } catch (err) {
      console.log(err);
      const errMsg =
        err.response?.data?.message || err.message || "Status update failed";
      toast.error(errMsg);
    }
  };

  const handleApproveDecline = async (histId, newStatus) => {
    try {
      if (newStatus === "Approved") {
        const usersRes = await axios.get(`${API_BASE}/api/manage-user/read`, {
          params: { search5: "Proforma invoices", search8: "1" },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const piUsersList = usersRes.data || [];
        if (piUsersList.length > 1) {
          setApproveTargetHistId(histId);
          setAvailablePiUsers(piUsersList);
          setSelectedPiUserForApproval("");
          setShowPiUserSelectModal(true);
          return;
        } else if (piUsersList.length === 1) {
          await proceedStatusUpdate(histId, "Approved", piUsersList[0].name);
          return;
        }
      }
      await proceedStatusUpdate(histId, newStatus);
    } catch (err) {
      console.log(err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to initiate status update";
      toast.error(errMsg);
    }
  };

  const openDeleteModal = (id, name = "Quotation") => {
    setDeleteId(id);
    setDeleteName(name);
    setShowDeleteModal(true);
  };

  const handleDeleteQuotation = async () => {
    try {
      setIsDeleting(true);
      await axios.delete(`${API_BASE}/api/quotation/${deleteId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Quotation deleted successfully");
      setShowDeleteModal(false);
      setDeleteId(null);
      if (selectedLead) {
        const res = await axios.get(
          `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`,
        );
        setFollowUpHistory(res.data?.result || []);
        fetchQuotations();
      }
    } catch (err) {
      toast.error("Failed to delete quotation");
    } finally {
      setIsDeleting(false);
    }
  };

  // ========================
  // PI MODAL
  // ========================
  const handlePiPercentageChange = (val) => {
    setPiPercentage(val);
    if (val === "" || val === null) {
      setPiRupees("");
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && selectedPIQuotation) {
      const gt = Number(selectedPIQuotation.grand_total) || 0;
      setPiRupees(((gt * num) / 100).toFixed(2));
    }
  };

  const handlePiRupeesChange = (val) => {
    setPiRupees(val);
    if (val === "" || val === null) {
      setPiPercentage("");
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && selectedPIQuotation) {
      const gt = Number(selectedPIQuotation.grand_total) || 0;
      if (gt > 0) {
        const pct = (num / gt) * 100;
        setPiPercentage(parseFloat(pct.toFixed(4)));
      }
    }
  };

  const handleCreatePI = async () => {
    if (
      !piPercentage ||
      Number(piPercentage) <= 0 ||
      Number(piPercentage) > 100
    ) {
      toast.error("Please enter a valid percentage (1-100)");
      return;
    }
    try {
      setIsCreatingPI(true);
      await axios.post(
        `${API_BASE}/api/pi/create-from-quotation/${selectedPIQuotation.latest_quotation_id}`,
        { percentage: Number(piPercentage) },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Proforma Invoice created successfully!");
      setShowPIModal(false);
      setSelectedPIQuotation(null);
      setPiPercentage("");
      setPiRupees("");
      fetchQuotations();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create PI");
    } finally {
      setIsCreatingPI(false);
    }
  };

  // ========================
  // HANDLE ASSIGNEE UPDATE
  // ========================
  const handleAssigneeFileChange = (e) => {
    const files = Array.from(e.target.files);
    let updatedFiles = [...assigneeFiles];
    let remainingSlots = MAX_FILES - updatedFiles.length;
    if (remainingSlots <= 0) {
      toast.error("You can upload only 5 files");
      e.target.value = "";
      return;
    }
    for (let file of files) {
      if (remainingSlots <= 0) break;
      const ext = file.name.split(".").pop().toLowerCase();
      const isDuplicate = updatedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (isDuplicate) continue;
      if (
        ![
          ...IMAGE_EXT_FE,
          ...EXCEL_EXT_FE,
          ...CAD_EXT_FE,
          ...DOC_EXT_FE,
        ].includes(ext)
      ) {
        toast.error("Only JPG, PNG, PDF, Excel, and CAD files allowed");
        continue;
      }
      if (EXCEL_EXT_FE.includes(ext) && file.size > 2 * 1024 * 1024) {
        toast.error("Excel files must be under 2MB");
        continue;
      }
      if (CAD_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("CAD files must be under 5MB");
        continue;
      }
      if (IMAGE_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("Images must be under 5MB");
        continue;
      }
      if (DOC_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("PDF files must be under 5MB");
        continue;
      }
      updatedFiles.push(file);
      remainingSlots--;
    }
    setAssigneeFiles(updatedFiles);
    e.target.value = "";
  };

  const removeAssigneeFile = (index) => {
    setAssigneeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAssigneeUpdate = async () => {
    if (!selectedAssigneeRow) {
      toast.error("No row selected");
      return;
    }
    if (!newAssigneeValue) {
      toast.error("Please select an assignee");
      return;
    }
    try {
      setIsUpdatingAssignee(true);
      const assigneeStr = newAssigneeValue.value;

      const formData = new FormData();
      formData.append("assignee", assigneeStr);
      formData.append("description", assigneeDescription.trim());

      if (assigneeFiles.length > 0) {
        assigneeFiles.forEach((file) => {
          formData.append("files", file);
        });
      }

      await axios.put(
        `${API_BASE}/api/quotation/update-assignee/${selectedAssigneeRow.lead_id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success("Assignee updated successfully!");
      setShowAssigneeModal(false);
      setSelectedAssigneeRow(null);
      setNewAssigneeValue(null);
      setAssigneeLog([]);
      setAssigneeDescription("");
      setAssigneeFiles([]);
      setShowAllHistory(false);
      fetchQuotations();
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "Failed to update assignee");
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  // Multer Constants
  const MAX_FILES = 5;
  const IMAGE_EXT_FE = ["jpg", "jpeg", "png"];
  const EXCEL_EXT_FE = ["xlsx", "xls", "csv", "excel"];
  const CAD_EXT_FE = ["dwg", "dxf"];
  const DOC_EXT_FE = ["pdf"];

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
      if (remainingSlots <= 0) break;
      const ext = file.name.split(".").pop().toLowerCase();
      const isDuplicate = updatedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (isDuplicate) continue;
      if (
        ![
          ...IMAGE_EXT_FE,
          ...EXCEL_EXT_FE,
          ...CAD_EXT_FE,
          ...DOC_EXT_FE,
        ].includes(ext)
      ) {
        toast.error("Only JPG, PNG, PDF, Excel, and CAD files allowed");
        continue;
      }
      if (EXCEL_EXT_FE.includes(ext) && file.size > 2 * 1024 * 1024) {
        toast.error("Excel files must be under 2MB");
        continue;
      }
      if (CAD_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("CAD files must be under 5MB");
        continue;
      }
      if (IMAGE_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("Images must be under 5MB");
        continue;
      }
      if (DOC_EXT_FE.includes(ext) && file.size > 5 * 1024 * 1024) {
        toast.error("PDF files must be under 5MB");
        continue;
      }
      updatedFiles.push(file);
      remainingSlots--;
    }
    setSelectedFiles(updatedFiles);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleSelect({ target: { files: e.dataTransfer.files, value: "" } });
  };

  const handleFileDownload = async (e, filePath, originalName) => {
    e.preventDefault();
    if (!filePath) return;

    let secureFilePath = filePath;
    if (filePath.startsWith("http://")) {
      secureFilePath = filePath.replace("http://", "https://");
    }

    const ext = originalName.split(".").pop().toLowerCase();

    const isNativePreview = ["pdf", "jpg", "jpeg", "png"].includes(ext);
    if (isNativePreview) {
      window.open(secureFilePath, "_blank");
      return;
    }

    const isExcel = ["xlsx", "xls", "csv", "excel"].includes(ext);
    if (isExcel) {
      const separator = secureFilePath.includes("?") ? "&" : "?";
      const fileWithExt =
        secureFilePath + separator + "file=" + encodeURIComponent(originalName);
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileWithExt)}`;
      window.open(officeUrl, "_blank");
      return;
    }

    try {
      const response = await fetch(secureFilePath);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      window.open(secureFilePath, "_blank");
    }
  };

  // ========================
  // QUOTATION SUBMIT
  // ========================
  const handleQuotationSubmit = async () => {
    if (isModalLocked) {
      toast.error("Quotation is locked. You cannot add or edit quotations.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (!form.activity_type || !form.quotation_no) {
        toast.error("Activity Type and Quotation No are required!");
        setIsSubmitting(false);
        return;
      }
      if (editingId) {
        const formData = new FormData();
        Object.keys(form).forEach((key) => formData.append(key, form[key]));
        if (selectedFiles.length > 0) {
          selectedFiles.forEach((file) => formData.append("files", file));
        }
        await axios.put(
          `${API_BASE}/api/quotation/update/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        toast.success("Quotation updated");
      } else {
        const formData = new FormData();
        formData.append("lead_id", selectedLead.lead_id);
        formData.append("company_name", selectedLead.company_name);
        formData.append("customer_name", selectedLead.customer_name);
        formData.append("reference", selectedLead.reference);
        Object.keys(form).forEach((key) => formData.append(key, form[key]));
        if (selectedFiles.length > 0) {
          selectedFiles.forEach((file) => formData.append("files", file));
        }
        await axios.post(`${API_BASE}/api/quotation/insert`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Quotation activity recorded");
      }
      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`,
      );
      const historyData = res.data?.result || [];
      const historyWithFiles = await Promise.all(
        historyData.map(async (hist) => {
          const hf = await axios.get(
            `${API_BASE}/api/quotation/files/${hist.id}`,
          );
          return { ...hist, files: hf.data?.files || [] };
        }),
      );
      setFollowUpHistory(historyWithFiles);
      setSelectedFiles([]);

      const isAllowedToEditFull = checkRole(["Admin", "Super Admin", "Sales"]);
      if (historyData.length > 0 && isAllowedToEditFull) {
        const latest = historyData[0];
        setForm({
          quotation_no: latest.quotation_no || "",
          quotation_date: latest.quotation_date
            ? new Date(latest.quotation_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          activity_type: latest.activity_type || "",
          quotation_status: latest.quotation_status || "Pending",
          assignee: latest.assignee || "",
          amount:
            latest.amount !== null && latest.amount !== undefined
              ? latest.amount.toString()
              : "",
          grand_total:
            latest.grand_total !== null && latest.grand_total !== undefined
              ? latest.grand_total.toString()
              : "",
          description: latest.description || "",
          discount:
            latest.discount !== null && latest.discount !== undefined
              ? latest.discount.toString()
              : "",
          tax:
            latest.tax !== null && latest.tax !== undefined
              ? latest.tax.toString()
              : "",
          amount_9:
            latest.amount_9 !== null && latest.amount_9 !== undefined
              ? latest.amount_9.toString()
              : "",
          amount_18:
            latest.amount_18 !== null && latest.amount_18 !== undefined
              ? latest.amount_18.toString()
              : "",
          tax_percent_9:
            latest.tax_percent_9 !== null && latest.tax_percent_9 !== undefined
              ? latest.tax_percent_9.toString()
              : "",
          tax_percent_18:
            latest.tax_percent_18 !== null &&
            latest.tax_percent_18 !== undefined
              ? latest.tax_percent_18.toString()
              : "",
          tax_9:
            latest.tax_9 !== null && latest.tax_9 !== undefined
              ? latest.tax_9.toString()
              : "",
          tax_18:
            latest.tax_18 !== null && latest.tax_18 !== undefined
              ? latest.tax_18.toString()
              : "",
        });
        setEditingId(latest.id);
      } else {
        setForm({
          quotation_no: "",
          quotation_date: new Date().toISOString().split("T")[0],
          activity_type: "",
          quotation_status:
            selectedLead.displayStatus === "Revision" ? "Revision" : "Pending",
          assignee: selectedLead.assignee || "",
          amount: "",
          discount: "",
          discount_rs: "",
          tax: "0",
          grand_total: "",
          description: "",
          amount_9: "",
          amount_18: "",
          tax_percent_9: "",
          tax_percent_18: "",
          tax_9: "",
          tax_18: "",
        });
        setEditingId(null);
      }
      fetchQuotations();
    } catch (err) {
      const errMsg =
        err?.response?.data?.sqlMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";
      toast.error(errMsg);
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignQuotation = async () => {
    if (!assignForm.assigned_to) {
      toast.error("Please select a user to assign");
      return;
    }
    if (!selectedAssignQuotation?.latest_quotation_id) {
      toast.error("No quotation selected for assignment");
      return;
    }
    try {
      await axios.put(
        `${API_BASE}/api/quotation/assign/${selectedAssignQuotation.latest_quotation_id}`,
        { assignee: assignForm.assigned_to },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      toast.success("Quotation assigned successfully");
      setShowAssignModal(false);
      await fetchQuotations();
    } catch (err) {
      console.log(err);
      toast.error("Assignment failed");
    }
  };

  // ========================
  // TAB + FILTER LOGIC
  // ========================
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const filteredQuotations = hasActiveFilters
    ? quotations
    : quotations.filter((q) => {
        return q.displayStatus === activeTab;
      });

  const pendingCount = quotations.filter(
    (q) => q.displayStatus === "Pending",
  ).length;
  const sentCount = quotations.filter((q) => q.displayStatus === "Sent").length;
  const revisionCount = quotations.filter(
    (q) => q.displayStatus === "Revision",
  ).length;
  const wonCount = quotations.filter((q) => q.displayStatus === "Won").length;
  const lostCount = quotations.filter((q) => q.displayStatus === "Lost").length;

  // ========================
  // PAGINATION
  // ========================
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedQuotations = filteredQuotations.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

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

  const [asignee, setAsignee] = useState([]);
  const [followUpUsers, setFollowUpUsers] = useState([]);
  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        let data = [];
        const userRole = localStorage.getItem("role") || "";
        if (userRole.toLowerCase() === "estimation") {
          const res = await axios.get(`${API_BASE}/api/manage-user/read`, {
            params: { search5: "Sales", search8: "1" },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          data = res.data || [];
        } else if (userRole.toLowerCase() === "sales") {
          const res = await axios.get(`${API_BASE}/api/manage-user/read`, {
            params: { search5: "Estimation", search8: "1" },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          data = res.data || [];
        } else {
          const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
            params: { status: 1 },
          });
          data = res.data.data || res.data || [];
        }
        const formatted = data.map((item) => {
          const firstName = item.name.split(" ")[0];
          return { value: firstName, label: firstName };
        });
        setAsignee(formatted);

        const resFollowUp = await axios.get(
          `${API_BASE}/api/manage-user/asignee`,
          {
            params: { status: 1 },
          },
        );
        const followUpData = resFollowUp.data.data || resFollowUp.data || [];
        const formattedFollowUp = followUpData.map((item) => {
          const firstName = item.name.split(" ")[0];
          return { value: firstName, label: firstName };
        });
        setFollowUpUsers(formattedFollowUp);
      } catch (error) {
        console.log(error);
        setAsignee([]);
        setFollowUpUsers([]);
      }
    };
    fetchAssignee();
  }, []);

  const isAdmin = mounted ? checkRole(["Admin", "Super Admin"]) : false;
  const isSales = mounted ? checkRole(["Sales"]) : false;
  const isEstimation = mounted ? checkRole(["Estimation"]) : false;
  const isKhushaliEstimation =
    isEstimation &&
    (localStorage.getItem("username") || "").split(" ")[0].toLowerCase() ===
      "khushali";

  const piGrandTotal = selectedPIQuotation
    ? Number(selectedPIQuotation.grand_total) || 0
    : 0;
  const piEnteredPct = Number(piPercentage) || 0;
  const piEnteredAmt = Number(piRupees) || 0;
  const piRemainingPct = 100 - piEnteredPct;
  const piRemainingAmt = piGrandTotal - piEnteredAmt;
  const piIsOver = piEnteredPct > 100;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  // ========================
  // OPEN ASSIGNEE POPOVER
  // ========================
  const openAssigneePopover = (e, q) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const popoverWidth = 340;
    const viewportWidth = window.innerWidth;

    let left = rect.left + window.scrollX;
    if (left + popoverWidth > viewportWidth - 10) {
      left = viewportWidth - popoverWidth - 10;
    }

    setAssigneePopoverPos({
      top: rect.bottom + window.scrollY + 6,
      left,
    });
    setSelectedAssigneeRow(q);
    setNewAssigneeValue(
      q.assignee
        ? {
            value: q.assignee.split(",")[0].trim(),
            label: q.assignee.split(",")[0].trim(),
          }
        : null,
    );
    setAssigneeLog([]);
    setAssigneeDescription("");
    fetchAssigneeLog(q.lead_id);
    setShowAssigneeModal(true);
  };

  const closeAssigneePopover = () => {
    setShowAssigneeModal(false);
    setSelectedAssigneeRow(null);
    setNewAssigneeValue(null);
    setAssigneeLog([]);
    setAssigneeDescription("");
    setAssigneeFiles([]);
    setShowAllHistory(false);
  };

  return (
    <>
      <Header />
      <div className="bg-gray-100 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white w-full border-gray-100 p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
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
                href="/sales/quotation"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Quotation
              </Link>
            </p>
          </div>

          {/* Export Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-auto" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-orange-50 text-orange-500 text-sm font-bold tracking-wide transition-all shadow-sm border border-orange-100"
              >
                <i className="bi bi-download text-base"></i>
                Export
                <i
                  className={`bi bi-chevron-down text-xs transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`}
                ></i>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-sm shadow-lg border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-excel text-green-600 text-base"></i>
                    Export Excel
                  </button>
                  <div className="h-px bg-gray-100 mx-3"></div>
                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-pdf text-red-600 text-base"></i>
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Section - Mobile Toggle */}
        <div className="mx-6 md:hidden mt-3 relative z-40">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all"
          >
            <span className="flex items-center gap-2">
              <i className="bi bi-funnel"></i> Filters
            </span>
            <i
              className={`bi bi-chevron-down text-xs transition-transform duration-200 ${showMobileFilters ? "rotate-180" : ""}`}
            ></i>
          </button>
        </div>

        <div
          className={`
          ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
          md:mx-6 md:mb-3 md:items-center md:gap-2 md:flex-wrap md:flex md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}
        >
          <div className="flex items-center gap-2 px-2 w-full md:w-48 bg-white border border-indigo-400 md:border rounded-sm text-sm">
            <Building2 size={16} className="text-blue-500" />
            <input
              name="company_name"
              value={filters.company_name}
              onChange={handleFilterChange}
              placeholder="Company"
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 px-2 w-full md:w-48 bg-white border border-indigo-400 md:border rounded-sm text-sm">
            <User size={16} className="text-violet-600" />
            <input
              name="customer_name"
              value={filters.customer_name}
              onChange={handleFilterChange}
              placeholder="Customer"
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 px-2 w-full md:w-48 bg-white border border-indigo-400 md:border rounded-sm text-sm">
            <Bookmark size={16} className="text-amber-500" />
            <input
              name="reference"
              value={filters.reference}
              onChange={handleFilterChange}
              placeholder="Reference"
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <select
            name="assignee"
            value={filters.assignee}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-36 bg-white border border-indigo-400 md:border rounded-sm focus:outline-none text-gray-400 text-sm"
          >
            <option value="">Assignee</option>
            {asignee.map((a, index) => (
              <option key={index} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          <select
            name="quotation_status"
            value={filters.quotation_status}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-45 bg-white border border-indigo-400 md:border rounded-sm focus:outline-none text-gray-400 text-sm"
          >
            <option value="">Status</option>
            <option value="Pending">Pending</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
            <option value="Sent">Sent</option>
            <option value="Revision">Revision</option>
          </select>

          <div className="flex p-1 items-center px-2 border bg-white border-indigo-400 rounded-sm w-full md:w-58 outline-none text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              From Date
            </span>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <div className="flex p-1 items-center px-2 border bg-white border-indigo-400 rounded-sm w-full md:w-53 outline-none text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              To Date
            </span>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <div className="flex gap-2 col-span-2">
            <button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-5 py-2 bg-indigo-100 text-indigo-600  text-sm text-center font-semibold transition-colors"
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
          <div className="flex items-center gap-2 sm:gap-6 px-2 sm:px-6 pt-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("Pending")}
              className={`pb-3 px-1 sm:px-0 text-sm font-semibold relative transition-all whitespace-nowrap ${activeTab === "Pending" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <i className="bi bi-clipboard-check"></i>
                <span className="text-xs sm:text-sm">Pending </span>
                <span className="ml-0 sm:ml-1 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingCount}
                </span>
              </span>
              {activeTab === "Pending" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
            {!isEstimation && (
              <button
                onClick={() => setActiveTab("Sent")}
                className={`pb-3 px-1 sm:px-0 text-sm font-semibold relative transition-all whitespace-nowrap  ${activeTab === "Sent" ? "text-sky-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <i className="bi bi-send"></i>
                  <span className="text-xs sm:text-sm">Sent </span>
                  <span className="ml-0 sm:ml-1 bg-sky-100 text-sky-600 text-xs px-2 py-0.5 rounded-full font-bold">
                    {sentCount}
                  </span>
                </span>
                {activeTab === "Sent" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-600 rounded-full"></div>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("Revision")}
              className={`pb-3 px-1 sm:px-0 text-sm font-semibold relative transition-all whitespace-nowrap ${activeTab === "Revision" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <i className="bi bi-arrow-repeat"></i>
                <span className="text-xs sm:text-sm">Revision </span>
                <span className="ml-0 sm:ml-1 bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  {revisionCount}
                </span>
              </span>
              {activeTab === "Revision" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-full"></div>
              )}
            </button>
            {!isEstimation && (
              <>
                <button
                  onClick={() => setActiveTab("Won")}
                  className={`pb-3 px-1 sm:px-0 text-sm font-semibold relative transition-all whitespace-nowrap ${activeTab === "Won" ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <i className="bi bi-trophy"></i>
                    <span className="text-xs sm:text-sm">Won </span>
                    <span className="ml-0 sm:ml-1 bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {wonCount}
                    </span>
                  </span>
                  {activeTab === "Won" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-full"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("Lost")}
                  className={`pb-3 px-1 sm:px-0 text-sm font-semibold relative transition-all whitespace-nowrap ${activeTab === "Lost" ? "text-red-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <i className="bi bi-person-x"></i>
                    <span className="text-xs sm:text-sm">Lost </span>
                    <span className="ml-0 sm:ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {lostCount}
                    </span>
                  </span>
                  {activeTab === "Lost" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-full"></div>
                  )}
                </button>
              </>
            )}

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
                On track (&lt; 3 days for Sent)
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
                3 - 5 days
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
                &gt; 5 days overdue
              </span>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
              <div
                className="overflow-x-auto overflow-y-scroll max-h-[500px] custom-scroll"
                style={{ overflowX: "scroll" }}
              >
                <table className="w-full text-sm whitespace-nowrap">
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
                        Location
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Architecture
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Create Quotation
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Quotation No{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Last Activity{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Grand Total{" "}
                        <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Assignee
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Follow-up
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider">
                        Updated By
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
                    {filteredQuotations.length > 0 ? (
                      paginatedQuotations.map((q, index) => {
                        let rowBgClass =
                          "border-b border-gray-50 hover:bg-indigo-50/30 transition-colors";
                        let customLabelBadge = null;

                        if (q.displayStatus === "Revision") {
                          const assignees = q.assignee
                            ? q.assignee
                                .split(",")
                                .map((name) => name.trim().toLowerCase())
                            : [];
                          const hasKhushali = assignees.includes("khushali");
                          const hasDarshil = assignees.includes("darshil");

                          if (hasKhushali) {
                            if (isSales) {
                              rowBgClass =
                                "border-b border-blue-100 bg-blue-50/50 hover:bg-blue-100/80 transition-colors";
                              customLabelBadge = (
                                <span className="text-blue-600 text-[11px] font-bold whitespace-nowrap animate-pulse">
                                  Sent for Revision
                                </span>
                              );
                            } else if (isKhushaliEstimation) {
                              rowBgClass =
                                "border-b border-red-100 bg-red-50/50 hover:bg-red-100/80 transition-colors";
                              customLabelBadge = (
                                <span className="text-red-600 text-[11px] font-bold whitespace-nowrap animate-pulse">
                                  Revision (Assigned to Khushali)
                                </span>
                              );
                            }
                          } else if (hasDarshil) {
                            if (isSales) {
                              rowBgClass =
                                "border-b border-green-100 bg-green-50/50 hover:bg-green-100/80 transition-colors";
                              customLabelBadge = (
                                <span className="text-green-600 text-[11px] font-bold whitespace-nowrap animate-pulse">
                                  Revision (Updated/Assigned to Darshil)
                                </span>
                              );
                            }
                          }
                        }

                        return (
                          <tr key={q.lead_id} className={rowBgClass}>
                            <td className="py-3 px-3">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="font-semibold text-slate-800 px-3">
                              <div className="flex items-center gap-2">
                                {getQuotationTrafficDot(q)}
                                <span>{q.company_name || "-"}</span>
                                {customLabelBadge}
                              </div>
                            </td>
                            <td className="text-blue-500 font-medium px-3">
                              {q.customer_name || "-"}
                            </td>
                            <td className="px-3 font-semibold text-slate-700">
                              {q.reference || "-"}
                            </td>

                            <td className="px-3">{q.location || "-"}</td>
                            <td className="px-3">{q.architecture || "-"}</td>

                            <td className="text-lg px-3 text-center">
                              {q.latest_quotation_id ? (
                                <button
                                  onClick={() => openQuotationModal(q)}
                                  className="w-9 h-9 tracking-widest rounded-full border inline-flex items-center justify-center transition-all hover:bg-blue-50 border-blue-400 text-blue-600 cursor-pointer shadow-sm mx-auto"
                                  title="Edit / View Quotation"
                                >
                                  <i className="bi bi-pencil-square text-sm"></i>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openQuotationModal(q)}
                                  className="w-9 h-9 tracking-widest rounded-full border inline-flex items-center justify-center transition-all hover:bg-green-50 border-green-400 text-green-600 cursor-pointer shadow-sm mx-auto"
                                  title="Add New Quotation"
                                >
                                  <i className="bi bi-file-earmark-plus text-sm"></i>
                                </button>
                              )}
                            </td>

                            <td className="px-3 font-semibold text-slate-700">
                              {q.quotation_no || "-"}
                            </td>
                            <td className="px-3 text-gray-500">
                              {q.quotation_date
                                ? new Date(
                                    q.quotation_date,
                                  ).toLocaleDateString()
                                : q.quotation_created_at
                                  ? new Date(
                                      q.quotation_created_at,
                                    ).toLocaleDateString()
                                  : "-"}
                            </td>
                            <td className="px-3 font-semibold text-slate-800">
                              {q.grand_total
                                ? `₹ ${Number(q.grand_total).toLocaleString()}`
                                : "-"}
                            </td>

                            {/* ASSIGNEE CELL */}
                            <td className="px-3">
                              {q.displayStatus !== "Won" &&
                              q.displayStatus !== "Lost" ? (
                                <button
                                  onClick={(e) => openAssigneePopover(e, q)}
                                  className="flex gap-1 items-center group cursor-pointer hover:opacity-80 transition-all"
                                  title="Click to change assignee"
                                >
                                  {q.assignee ? (
                                    <>
                                      {String(q.assignee)
                                        .split(",")
                                        .map((name, i) => (
                                          <div
                                            key={i}
                                            title={name.trim()}
                                            className="px-3 py-1.5 bg-blue-800 text-white rounded-full font-semibold text-xs flex justify-center items-center min-w-[28px] select-none"
                                          >
                                            {name
                                              .trim()
                                              .charAt(0)
                                              .toUpperCase()}
                                          </div>
                                        ))}
                                      <i className="bi bi-pencil-fill text-[9px] text-gray-300 group-hover:text-blue-500 ml-1 transition-colors"></i>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-dashed border-gray-400 rounded-full text-gray-500 text-xs font-medium hover:bg-orange-50 hover:border-orange-400 hover:text-orange-600 transition-all">
                                      <i className="bi bi-person-plus text-xs"></i>
                                      <span>Assign</span>
                                    </div>
                                  )}
                                </button>
                              ) : (
                                <div className="flex gap-1 items-center">
                                  {q.assignee ? (
                                    String(q.assignee)
                                      .split(",")
                                      .map((name, i) => (
                                        <div
                                          key={i}
                                          title={name.trim()}
                                          className="px-3 py-1.5 bg-blue-800 text-white rounded-full font-semibold text-xs flex justify-center items-center min-w-[28px] select-none"
                                        >
                                          {name.trim().charAt(0).toUpperCase()}
                                        </div>
                                      ))
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* follow-up */}
                            <td className="text-center">
                              {q.follow_up_date || q.latest_follow_up_date ? (
                                <span
                                  onClick={async () => {
                                    try {
                                      setSelectedLead(q);
                                      setSelectedQuotation({
                                        id: q.latest_quotation_id,
                                        quotation_no: q.quotation_no,
                                      });
                                      setFollowUpTab("quotation");
                                      setUpdateForm({
                                        follow_up_date: new Date()
                                          .toISOString()
                                          .split("T")[0],
                                        activity_type: "",
                                        follow_up_by: "",
                                        contact_person: "",
                                        quotation_no: q.quotation_no || "",
                                        description: "",
                                      });
                                      setSelectedFiles([]);
                                      setPreviewFollowUp(null);

                                      const res = await axios.get(
                                        `${API_BASE}/api/quotation-revision/${q.latest_quotation_id}/full-details`,
                                        {
                                          headers: {
                                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                                          },
                                        },
                                      );

                                      const quotationHistory =
                                        res.data?.data?.revisions?.map(
                                          (item) => ({
                                            ...item,
                                            module_type: "quotation",
                                          }),
                                        ) || [];

                                      const salesHistory =
                                        res.data?.data?.follow_ups?.map(
                                          (item) => ({
                                            ...item,
                                            module_type: "sales",
                                          }),
                                        ) || [];

                                      const mergedHistory = [
                                        ...quotationHistory,
                                        ...salesHistory,
                                      ].sort(
                                        (a, b) =>
                                          new Date(b.created_at) -
                                          new Date(a.created_at),
                                      );

                                      setFollowUpHistory(mergedHistory);
                                      setShowUpdateModal(true);
                                    } catch (err) {
                                      console.log(err);
                                      toast.error("Failed to load history");
                                    }
                                  }}
                                  className="font-semibold text-blue-600 hover:underline cursor-pointer text-xs"
                                  title="Click to view follow-up history"
                                >
                                  {new Date(
                                    q.follow_up_date || q.latest_follow_up_date,
                                  ).toLocaleDateString("en-IN")}
                                </span>
                              ) : (
                                <button
                                  onClick={async () => {
                                    try {
                                      setSelectedLead(q);
                                      setSelectedQuotation({
                                        id: q.latest_quotation_id,
                                        quotation_no: q.quotation_no,
                                      });
                                      setFollowUpTab("quotation");
                                      setUpdateForm({
                                        follow_up_date: new Date()
                                          .toISOString()
                                          .split("T")[0],
                                        activity_type: "",
                                        follow_up_by: "",
                                        contact_person: "",
                                        quotation_no: q.quotation_no || "",
                                        description: "",
                                      });
                                      setSelectedFiles([]);
                                      setPreviewFollowUp(null);

                                      const res = await axios.get(
                                        `${API_BASE}/api/quotation-revision/${q.latest_quotation_id}/full-details`,
                                        {
                                          headers: {
                                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                                          },
                                        },
                                      );

                                      const quotationHistory =
                                        res.data?.data?.revisions?.map(
                                          (item) => ({
                                            ...item,
                                            module_type: "quotation",
                                          }),
                                        ) || [];

                                      const salesHistory =
                                        res.data?.data?.follow_ups?.map(
                                          (item) => ({
                                            ...item,
                                            module_type: "sales",
                                          }),
                                        ) || [];

                                      const mergedHistory = [
                                        ...quotationHistory,
                                        ...salesHistory,
                                      ].sort(
                                        (a, b) =>
                                          new Date(b.created_at) -
                                          new Date(a.created_at),
                                      );

                                      setFollowUpHistory(mergedHistory);
                                      setShowUpdateModal(true);
                                    } catch (err) {
                                      console.log(err);
                                      toast.error("Failed to load history");
                                    }
                                  }}
                                  className="w-9 h-9 rounded-full border border-blue-300 text-blue-500 bg-white flex items-center justify-center mx-auto hover:bg-blue-50 transition-all duration-200"
                                  title="Add Follow-up"
                                >
                                  <i className="bi bi-plus text-xl"></i>
                                </button>
                              )}
                            </td>

                            <td className="px-3">
                              {q.updated_by ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md w-fit">
                                    <i className="bi bi-person-fill text-indigo-400 text-[10px]"></i>
                                    {q.updated_by}
                                  </span>
                                  {q.updated_at && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {formatDateTime(q.updated_at)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300 text-sm">—</span>
                              )}
                            </td>

                            <td className="px-3">
                              <div className="flex items-center gap-1.5">
                                {q.displayStatus === "Pending" ? (
                                  isKhushaliEstimation ? (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                                      Pending
                                    </span>
                                  ) : (
                                    <select
                                      value="Pending"
                                      onChange={(e) =>
                                        handleStatusSelectChange(
                                          q.latest_quotation_id,
                                          e.target.value,
                                        )
                                      }
                                      className="border rounded-md px-2 py-1.5 text-xs font-semibold outline-none bg-blue-50 text-blue-700 border-blue-200 cursor-pointer"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Sent">Sent</option>
                                      <option value="Lost">Lost</option>
                                    </select>
                                  )
                                ) : q.displayStatus === "Sent" ? (
                                  isKhushaliEstimation ? (
                                    <span className="bg-sky-100 text-sky-700 px-2 py-1 rounded-md text-xs font-bold">
                                      Sent
                                    </span>
                                  ) : (
                                    <select
                                      value="Sent"
                                      onChange={(e) =>
                                        handleStatusSelectChange(
                                          q.latest_quotation_id,
                                          e.target.value,
                                        )
                                      }
                                      className="border rounded-md px-2 py-1.5 text-xs font-semibold outline-none bg-sky-50 text-sky-700 border-sky-200 cursor-pointer"
                                    >
                                      <option value="Sent">Sent</option>
                                      <option value="Revision">Revision</option>
                                      <option value="Lost">Lost</option>
                                    </select>
                                  )
                                ) : q.displayStatus === "Revision" ? (
                                  isKhushaliEstimation ? (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">
                                      Revision
                                    </span>
                                  ) : (
                                    <select
                                      value="Revision"
                                      onChange={(e) =>
                                        handleStatusSelectChange(
                                          q.latest_quotation_id,
                                          e.target.value,
                                        )
                                      }
                                      className="border rounded-md px-2 py-1.5 text-xs font-semibold outline-none bg-purple-50 text-purple-700 border-purple-200 cursor-pointer"
                                    >
                                      <option value="Revision">Revision</option>
                                      <option value="Sent">Sent</option>
                                      <option value="Lost">Lost</option>
                                    </select>
                                  )
                                ) : q.displayStatus === "Won" ? (
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                                    Won
                                  </span>
                                ) : q.displayStatus === "Lost" ? (
                                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">
                                    Lost
                                  </span>
                                ) : null}
                              </div>
                            </td>

                            <td className="px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* VIEW BUTTON */}

                                {q.latest_quotation_id && (
                                  <button
                                    onClick={() =>
                                      handleViewQuotation(q.latest_quotation_id)
                                    }
                                    className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                                    title="View Quotation"
                                  >
                                    <i className="bi bi-eye text-lg"></i>
                                  </button>
                                )}

                                {/* PI BUTTON */}

                                {q.displayStatus === "Won" &&
                                  q.latest_quotation_id &&
                                  (() => {
                                    // existing PI logic
                                  })()}

                                {/* ===== ACTION: Lock (Won) / View Reason (Lost) / Delete (Others) ===== */}
                                {q.latest_quotation_id ? (
                                  q.displayStatus === "Won" ? (
                                    <div
                                      className="text-gray-300 w-8 h-8 rounded-full flex items-center justify-center"
                                      title="Locked"
                                    >
                                      <i className="bi bi-lock-fill"></i>
                                    </div>
                                  ) : q.displayStatus === "Lost" ? (
                                    <button
                                      onClick={() => {
                                        setViewReasonText(
                                          q.lost_reason || "No reason provided",
                                        );
                                        setShowViewReasonModal(true);
                                      }}
                                      className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                      title="View Lost Reason"
                                    >
                                      <i className="bi bi-info-circle text-lg"></i>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        openDeleteModal(q.latest_quotation_id)
                                      }
                                      className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 cursor-pointer transition-all"
                                    >
                                      <i className="bi bi-trash3 text-lg"></i>
                                    </button>
                                  )
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="14"
                          className="text-center py-10 text-gray-400"
                        >
                          No Quotations Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
                  {/* Left side: Showing X to Y of Z entries */}
                  <div className="text-sm text-slate-600 font-semibold">
                    Showing{" "}
                    {filteredQuotations.length === 0
                      ? 0
                      : (currentPage - 1) * itemsPerPage + 1}{" "}
                    to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredQuotations.length,
                    )}{" "}
                    of {filteredQuotations.length} entries
                  </div>

                  {/* Center: Navigation buttons */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-left text-sm"></i>
                      </button>
                      <div className="flex items-center gap-1.5">
                        {getSlidingPages().map((page) => (
                          <button
                            type="button"
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
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

      {/* ================== FOLLOW-UP MODAL ================== */}
       
{showUpdateModal && (
  <div
    id="updateDrawerOverlay"
    className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
    style={{ animation: "updFadeIn 0.3s ease-out" }}
  >
    <style>{`
      @keyframes updSlideIn {
        from { transform: translateX(100%); opacity: 0.6; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes updSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0.6; }
      }
      @keyframes updFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes updFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `}</style>
 
    <div
      id="updateDrawerPanel"
      className="bg-white w-full max-w-[820px] h-full shadow-2xl border-l border-gray-100 overflow-hidden flex flex-col"
      style={{ animation: "updSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* ── Header (Image-2 style: white bg + gradient update icon + progress strip) ── */}
      <div className="bg-white flex-shrink-0 z-10">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
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
                Update Lead Activities
              </h2>
              <p className="text-[10px] text-gray-500 font-medium">
                Log follow-ups and keep this lead moving
              </p>
            </div>
          </div>
          <button
            onClick={closeUpdateDrawer}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
          >
            ✕
          </button>
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
 
      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => {
            setFollowUpTab("lead");
            setPreviewFollowUp(null);
          }}
          className={`px-6 py-3 text-sm font-semibold transition-all ${
            followUpTab === "lead"
              ? "text-violet-600 border-b-2 border-violet-600 bg-violet-50"
              : "text-gray-500 hover:text-violet-500"
          }`}
        >
          Lead
        </button>
 
        <button
          onClick={() => {
            setFollowUpTab("quotation");
            setPreviewFollowUp(null);
          }}
          className={`px-6 py-3 text-sm font-semibold transition-all ${
            followUpTab === "quotation"
              ? "text-violet-600 border-b-2 border-violet-600 bg-violet-50"
              : "text-gray-500 hover:text-violet-500"
          }`}
        >
          Quotation
        </button>
      </div>
 
      {/* Body — scrollable */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* LEFT: Form */}
        <div className="w-1/2 px-3 sm:px-6 py-3 sm:py-5 border-r border-gray-100 overflow-y-auto">
          {followUpTab === "lead" && (
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2 sm:mb-4">
              Lead Follow-Up
            </p>
          )}
 
          {followUpTab === "quotation" && (
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2 sm:mb-4">
              Quotation Follow-Up
            </p>
          )}
 
          {/* LEAD TAB: Read-only notice */}
          {followUpTab === "lead" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 sm:gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-2 sm:px-4 py-2 sm:py-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="bi bi-info-circle-fill text-indigo-500 text-sm"></i>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-indigo-700">
                    Lead Follow-Up History
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    Lead follow-ups are managed from the Leads section.
                    You can view the history on the right panel.
                  </p>
                </div>
              </div>
 
              {selectedLead && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 sm:p-4 space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">
                      Company
                    </span>
                    <span className="font-semibold text-gray-700">
                      {selectedLead.company_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">
                      Customer
                    </span>
                    <span className="font-semibold text-gray-700">
                      {selectedLead.customer_name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">
                      Reference
                    </span>
                    <span className="font-semibold text-gray-700">
                      {selectedLead.reference || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">
                      Mobile No
                    </span>
                    <span className="font-semibold text-gray-700">
                      {selectedLead.mobile_no || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-medium">
                      Assignee
                    </span>
                    <span className="font-semibold text-gray-700">
                      {selectedLead.assignee || "—"}
                    </span>
                  </div>
                </div>
              )}
 
              <p className="text-xs text-gray-400 italic text-center pt-2">
                <i className="bi bi-lock mr-1"></i>
                Lead follow-up entries are read-only in this view
              </p>
            </div>
          )}
 
          {/* QUOTATION TAB: Editable Form */}
          {followUpTab === "quotation" && (
            <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-2 sm:gap-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Follow-Up Date
                </label>
                <input
                  type="date"
                  name="follow_up_date"
                  value={updateForm.follow_up_date}
                  onChange={handleInputChange}
                  className="w-full mt-1 sm:mt-1.5 border border-indigo-200 focus:border-violet-400 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Activity Type *
                </label>
                <select
                  name="activity_type"
                  value={updateForm.activity_type}
                  onChange={handleInputChange}
                  className="w-full mt-1 sm:mt-1.5 border border-indigo-200 focus:border-violet-400 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 transition-colors"
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
                  name="follow_up_by"
                  value={updateForm.follow_up_by}
                  onChange={handleInputChange}
                  className="w-full mt-1 sm:mt-1.5 border border-indigo-200 focus:border-violet-400 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 transition-colors"
                >
                  <option value="">Select User</option>
                  {followUpUsers.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Contact Person *
                </label>
                <input
                  name="contact_person"
                  value={updateForm.contact_person}
                  onChange={handleInputChange}
                  className="w-full mt-1 sm:mt-1.5 border border-indigo-200 focus:border-violet-400 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 transition-colors"
                />
              </div>
 
              {/* BUG FIX #2: Added Quotation No field in follow-up form */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Quotation No
                </label>
                <input
                  name="quotation_no"
                  value={updateForm.quotation_no}
                  onChange={handleInputChange}
                  placeholder="e.g. QT-2025-001"
                  disabled={
                    !!selectedQuotation?.quotation_no ||
                    !!selectedLead?.quotation_no
                  }
                  className={`w-full mt-1.5 border border-indigo-200 focus:border-violet-400 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 transition-colors ${
                    selectedQuotation?.quotation_no ||
                    selectedLead?.quotation_no
                      ? "opacity-75 cursor-not-allowed"
                      : ""
                  }`}
                />
              </div>
 
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={updateForm.description}
                  onChange={handleInputChange}
                  className="w-full mt-1 sm:mt-1.5 border border-indigo-200 focus:border-violet-400 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 h-16 sm:h-20 resize-none transition-colors"
                />
              </div>
            </div>
          )}
        </div>
 
        {/* RIGHT: History Panel */}
        <div className="w-1/2 px-2 sm:px-6 py-3 sm:py-5 flex flex-col overflow-hidden bg-slate-50/50">
          {followUpTab === "lead" && (
            <div className="flex flex-wrap justify-between items-center gap-1 mb-2 sm:mb-4 flex-shrink-0">
              <p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest leading-tight">
                Lead Follow-Up History
              </p>
              <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-600 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold border border-indigo-100">
                {
                  followUpHistory.filter((h) => h.module_type === "sales")
                    .length
                }{" "}
                record(s)
              </span>
            </div>
          )}
 
          {followUpTab === "quotation" && (
            <div className="flex flex-wrap justify-between items-center gap-1 mb-2 sm:mb-4 flex-shrink-0">
              <p className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-widest leading-tight">
                Quotation Follow-Up History
              </p>
              <span className="text-[10px] sm:text-xs bg-violet-50 text-violet-600 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold border border-violet-100">
                {
                  followUpHistory.filter(
                    (h) => h.module_type === "quotation",
                  ).length
                }{" "}
                record(s)
              </span>
            </div>
          )}
 
          {/* History List — scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {(() => {
              const filtered = followUpHistory.filter((h) =>
                followUpTab === "lead"
                  ? h.module_type === "sales"
                  : h.module_type === "quotation",
              );
 
              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                    <i className="bi bi-clock-history text-3xl mb-2"></i>
                    <p className="text-sm">No history found</p>
                  </div>
                );
              }
 
              return filtered.map((item, idx) => {
                const itemId = item.follow_up_id || item.id;
                const previewId =
                  previewFollowUp?.follow_up_id || previewFollowUp?.id;
                const isActive = previewId === itemId;
 
                return (
                  <div key={itemId}>
                    <div
                      onClick={() =>
                        setPreviewFollowUp(isActive ? null : item)
                      }
                      className={`border rounded-xl p-2 sm:p-3 cursor-pointer transition-all select-none bg-white ${
                        isActive
                          ? "border-violet-400 bg-violet-50 shadow-sm"
                          : "hover:bg-violet-50/40 hover:border-violet-200 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {idx === 0 && (
                            <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-semibold">
                              Latest
                            </span>
                          )}
                          <div>
                            <p className="font-semibold text-sm text-gray-700">
                              {item.activity_type}
                            </p>
                            <p
                              className={`text-[10px] uppercase font-semibold ${
                                followUpTab === "lead"
                                  ? "text-indigo-400"
                                  : "text-violet-400"
                              }`}
                            >
                              {followUpTab === "lead"
                                ? "Lead"
                                : "Quotation"}
                            </p>
                          </div>
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
                            className={`bi ${isActive ? "bi-chevron-up" : "bi-chevron-down"} text-gray-400 text-xs`}
                          ></i>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {item.description}
                      </p>
                    </div>
 
                    {isActive && (
                      <div className="mt-1 mb-2 border border-violet-200 rounded-xl bg-gradient-to-br from-violet-50 to-white p-4 text-sm shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-bold text-violet-600 text-xs uppercase tracking-wide">
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
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block ${
                                previewFollowUp.status === "Completed"
                                  ? "bg-green-100 text-green-600"
                                  : previewFollowUp.status === "Cancelled"
                                    ? "bg-red-100 text-red-500"
                                    : "bg-violet-100 text-violet-600"
                              }`}
                            >
                              {previewFollowUp.status || "—"}
                            </span>
                          </div>
                          {previewFollowUp.quotation_no && (
                            <div>
                              <p className="text-xs text-gray-400 font-medium">
                                Quotation No
                              </p>
                              <p className="font-semibold text-gray-700 text-sm mt-0.5">
                                {previewFollowUp.quotation_no}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5">
                          <p className="text-xs text-gray-400 font-medium">
                            Description
                          </p>
                          <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
                            {previewFollowUp.description || "—"}
                          </p>
                        </div>
 
                        {previewFollowUp.files &&
                          previewFollowUp.files.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-400 font-medium mb-1.5">
                                Attached Files
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {previewFollowUp.files.map((f, i) => (
                                  <a
                                    key={i}
                                    href={f.file_path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors shadow-sm"
                                  >
                                    <i className="bi bi-file-earmark-check text-indigo-500"></i>
                                    <span className="truncate max-w-[120px]">
                                      {f.filename ||
                                        f.file_name ||
                                        "File"}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
 
      {/* Footer Buttons */}
      <div className="flex justify-between items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
        <p className="text-[10px] sm:text-xs text-gray-400 font-medium hidden sm:flex items-center gap-1">
          <i className="bi bi-info-circle"></i>
          Fields marked * are required
        </p>
        <div className="flex gap-2 sm:gap-3 ml-auto">
          <button
            onClick={closeUpdateDrawer}
            className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-1.5"
          >
            <i className="bi bi-x-lg text-xs"></i>
            Cancel
          </button>
 
          <button
            onClick={followUpTab === "quotation" ? handleUpdate : undefined}
            disabled={followUpTab === "lead" || updateLoading}
            title={
              followUpTab === "lead"
                ? "Lead follow-ups cannot be added here"
                : ""
            }
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-br from-indigo-500 to-violet-600 text-white transition-all shadow-md flex items-center gap-2 ${
              followUpTab === "lead"
                ? "bg-gray-300 cursor-not-allowed shadow-none"
                : updateLoading
                  ? "cursor-not-allowed opacity-70 shadow-violet-100"
                  : "hover:shadow-lg hover:shadow-violet-200"
            }`}
            // style={
            //   followUpTab === "lead"
            //     ? {}
            //     : {
            //         background:
            //           "linear-gradient(to right, #6366f1, #8b5cf6)",
            //       }
            // }
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
                Saving...
              </>
            ) : followUpTab === "lead" ? (
              <>
                <i className="bi bi-lock-fill text-xs"></i>
                Add Follow-Up
              </>
            ) : (
              <>
                <i className="bi bi-check-circle text-sm"></i>
                Add Follow-Up
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
 

      {/* QUOTATION UPDATE MODAL */}
     {showQuotationModal && selectedLead && (
  <div
    id="quotationDrawerOverlay"
    className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
    style={{ animation: "qmFadeIn 0.3s ease-out" }}
  >
    <style>{`
      @keyframes qmSlideIn {
        from { transform: translateX(100%); opacity: 0.6; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes qmSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0.6; }
      }
      @keyframes qmFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes qmFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `}</style>
 
    <div
      id="quotationDrawerPanel"
      className="bg-white w-[95vw] max-w-[900px] h-full shadow-2xl overflow-hidden border-l border-gray-100 flex flex-col"
      style={{ animation: "qmSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* ── Header (Image-2 style: white bg + gradient icon box + progress strip) ── */}
      <div className="bg-white z-10 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <i className="bi bi-receipt text-lg text-white"></i>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                {selectedLead?.company_name} {selectedLead?.mobile_no ? `(${selectedLead.mobile_no})` : ""}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Quotation Management {selectedLead?.customer_name ? `• ${selectedLead.customer_name}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={closeQuotationDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
          >
            ✕
          </button>
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
 
      <div className="flex flex-row flex-1 overflow-hidden relative">
        {/* Left Side: Form */}
        <div className="w-5/12 min-w-[160px] bg-white border-r border-gray-100 flex flex-col relative z-10 overflow-y-auto">
          {isModalLocked && (
            <div
              className={`mx-4 mt-4 flex items-start gap-3 border rounded-xl px-4 py-3 shadow-sm ${
                isWonOrLostLocked
                  ? selectedLead?.displayStatus === "Won"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isWonOrLostLocked
                    ? selectedLead?.displayStatus === "Won"
                      ? "bg-green-100"
                      : "bg-red-100"
                    : "bg-green-100"
                }`}
              >
                <i
                  className={`bi bi-lock-fill text-sm ${
                    isWonOrLostLocked
                      ? selectedLead?.displayStatus === "Won"
                        ? "text-green-600"
                        : "text-red-600"
                      : "text-green-600"
                  }`}
                ></i>
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${
                    isWonOrLostLocked
                      ? selectedLead?.displayStatus === "Won"
                        ? "text-green-700"
                        : "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {isWonOrLostLocked
                    ? selectedLead?.displayStatus === "Won"
                      ? "Lead Won"
                      : "Lead Lost"
                    : "Quotation Approved"}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isWonOrLostLocked
                      ? selectedLead?.displayStatus === "Won"
                        ? "text-green-600"
                        : "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {isWonOrLostLocked
                    ? `This lead is marked as ${selectedLead?.displayStatus}. No further quotation updates are permitted.`
                    : "This quotation is already approved. You cannot add or edit any further quotation activities."}
                </p>
              </div>
            </div>
          )}
 
          <div
            className={`p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 ${isModalLocked ? "opacity-50 pointer-events-none select-none" : ""}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Quotation Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="quotation_date"
                  value={form.quotation_date}
                  onChange={handleChange}
                  className="w-full mt-1 border border-indigo-200 focus:border-violet-400 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Activity Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="activity_type"
                  value={form.activity_type}
                  onChange={handleChange}
                  className="w-full mt-1 border border-indigo-200 focus:border-violet-400 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 transition-colors"
                >
                  <option value="">-- Select --</option>
                  <option>New</option>
                  <option>Revision</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Quotation No <span className="text-red-400">*</span>
                </label>
                <input
                  name="quotation_no"
                  value={form.quotation_no}
                  onChange={handleChange}
                  disabled={isQuotationNoLocked}
                  className={`w-full mt-1 border border-indigo-200 focus:border-violet-400 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 transition-colors ${
                    isQuotationNoLocked ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount (₹)
                </label>
                <div className="relative flex items-center mt-1">
                  <input
                    type="text"
                    name="amount"
                    value={form.amount || ""}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (
                          (isAdmin || isSales) &&
                          ["Sent", "Approved", "Won"].includes(form.quotation_status)
                        ) {
                          openSplitModal(false);
                        }
                      }
                    }}
                    className="w-full border border-indigo-200 focus:border-violet-400 rounded-lg pl-2 pr-10 sm:pl-3 sm:pr-10 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-50 transition-colors"
                  />
                  {(isAdmin || isSales) &&
                    ["Sent", "Approved", "Won"].includes(form.quotation_status) && (
                      <button
                        type="button"
                        onClick={() => openSplitModal(false)}
                        className="absolute right-2 text-violet-500 hover:text-violet-700 font-bold p-1 rounded transition-colors flex items-center justify-center border-0 bg-transparent cursor-pointer"
                        title="Configure Participation"
                      >
                        <i className="bi bi-plus-circle-fill text-lg"></i>
                      </button>
                    )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Grand Total (₹)
                </label>
                <input
                  type="text"
                  name="grand_total"
                  value={form.grand_total || ""}
                  readOnly
                  disabled
                  className="w-full mt-1 border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none bg-gray-100 cursor-not-allowed font-semibold text-gray-700"
                />
              </div>
            </div>
            <div className="hidden">
              <input
                type="hidden"
                name="discount"
                value={form.discount || "0"}
              />
              <input type="hidden" name="tax" value={form.tax || "0"} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="2"
                className="w-full mt-1 border border-indigo-200 focus:border-violet-400 rounded-lg px-3 py-2 text-sm outline-none bg-gray-50 resize-none transition-colors"
              ></textarea>
            </div>
            <div className="border border-dashed border-violet-300 rounded-xl p-4 bg-violet-50/40 text-center">
              {!editingId ? (
                <>
                  <button
                    onClick={() => setShowFileModal(true)}
                    className="text-white px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all hover:shadow-lg hover:shadow-violet-200"
                    style={{
                      background: "linear-gradient(to right, #6366f1, #8b5cf6)",
                    }}
                  >
                    <i className="bi bi-cloud-upload text-sm"></i> Upload
                    Files
                  </button>
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-1.5 text-left">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-white px-3 py-1.5 text-xs rounded-lg border border-gray-100 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <i className="bi bi-file-earmark-text text-violet-500 text-sm"></i>
                            <span className="text-gray-600 font-medium truncate">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedFiles(
                                selectedFiles.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                          >
                            <i className="bi bi-x-circle text-sm"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  File editing is unavailable during updates. Create a new
                  quotation to attach new files.
                </p>
              )}
            </div>
          </div>
 
          <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto flex gap-3">
            {isModalLocked ? (
              <div className="flex-1 flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-400 cursor-not-allowed select-none">
                <i className="bi bi-lock-fill text-gray-400"></i>
                {isWonOrLostLocked
                  ? `Locked — Lead ${selectedLead?.displayStatus}`
                  : "Locked — Quotation Approved"}
              </div>
            ) : (
              <>
                <button
                  onClick={handleQuotationSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl py-3 text-sm font-semibold transition-all flex justify-center items-center gap-2 hover:shadow-lg hover:shadow-violet-200 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  // style={{
                  //   background: "linear-gradient(to right, #6366f1, #8b5cf6)",s
                  // }}
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-floppy2-fill"></i>
                      {editingId
                        ? "Update Quotation"
                        : "Save Quotation Activity"}
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        quotation_no: form.quotation_no,
                        quotation_date: new Date()
                          .toISOString()
                          .split("T")[0],
                        activity_type: "",
                        quotation_status:
                          selectedLead.displayStatus === "Revision"
                            ? "Revision"
                            : "Pending",
                        assignee: form.assignee,
                        amount: "",
                        discount: "",
                        tax: "0",
                        grand_total: "",
                        description: "",
                        amount_9: "",
                        amount_18: "",
                        tax_9: "",
                        tax_18: "",
                      });
                    }}
                    className="flex-none bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>
 
        {/* Right Side: History */}
        <div className="w-7/12 min-w-0 bg-slate-50 flex flex-col relative z-0">
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
              <i
                className="bi bi-clock-history"
                style={{ color: "#7c3aed" }}
              ></i>{" "}
              Quotation History Data
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-3 sm:space-y-4">
            {followUpHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <i className="bi bi-inbox text-4xl mb-2 text-gray-300"></i>
                <p className="text-sm font-medium">
                  No quotation history found.
                </p>
              </div>
            ) : (
              [...followUpHistory]
                .sort((a, b) =>
                  a.quotation_status === "Approved"
                    ? -1
                    : b.quotation_status === "Approved"
                      ? 1
                      : Math.sign(
                          new Date(b.created_at) - new Date(a.created_at),
                        ),
                )
                .map((item, index) => (
                  <div
                    key={index}
                    className={`bg-white border rounded-xl p-2 sm:p-4 shadow-sm transition-colors ${
                      item.quotation_status === "Approved" ||
                      item.quotation_status === "Won"
                        ? "border-green-400 bg-green-50/20"
                        : "border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm ${
                            item.quotation_status === "Approved" ||
                            item.quotation_status === "Won"
                              ? "bg-green-100 text-green-700"
                              : "bg-violet-100 text-violet-600"
                          }`}
                        >
                          {item.assignee ? item.assignee.charAt(0) : "U"}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Recorded by{" "}
                            <span className="text-gray-800 font-bold">
                              {item.assignee || "User"}
                            </span>
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                            Quotation Date:{" "}
                            {new Date(
                              item.quotation_date || item.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {item.quotation_status !== "Won" &&
                          item.quotation_status !== "Lost" &&
                          item.quotation_status !== "Approved" &&
                          item.quotation_status !== "Declined" &&
                          !isModalLocked &&
                          (!isSales ||
                            item.quotation_status === "Sent") &&
                          !isKhushaliEstimation && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveDecline(
                                    item.id,
                                    "Approved",
                                  )
                                }
                                className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-2 py-1 rounded-md transition-all shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleApproveDecline(
                                    item.id,
                                    "Declined",
                                  )
                                }
                                className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2 py-1 rounded-md transition-all shadow-sm"
                              >
                                Decline
                              </button>
                            </>
                          )}
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md ${
                            item.quotation_status === "Approved" ||
                            item.quotation_status === "Won"
                              ? "bg-green-100 text-green-700"
                              : item.quotation_status === "Declined" ||
                                  item.quotation_status === "Lost"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.quotation_status || "Pending"}
                        </span>
                        {item.quotation_status !== "Approved" &&
                          item.quotation_status !== "Declined" &&
                          !isModalLocked && (
                            <button
                              onClick={() => handleEditClick(item)}
                              className="ml-1 text-gray-400 hover:text-violet-600 transition-colors p-1"
                              title="Edit Quotation Activity"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          )}
                      </div>
                    </div>
 
                    {item.updated_by && (
                      <div className="mb-2 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md">
                          <i className="bi bi-pencil-fill text-[9px]"></i>
                          Last edited by{" "}
                          <span className="text-indigo-800">
                            {item.updated_by}
                          </span>
                        </span>
                        {item.updated_at && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formatDateTime(item.updated_at)}
                          </span>
                        )}
                      </div>
                    )}
 
                    <div className="mt-2 grid grid-cols-2 gap-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs">
                          Quotation No:
                        </span>{" "}
                        <span className="font-semibold">
                          {item.quotation_no || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">
                          Activity Type:
                        </span>{" "}
                        <span className="font-semibold">
                          {item.activity_type || "-"}
                        </span>
                      </div>
                      <div className="col-span-2 text-gray-700">
                        <span className="text-gray-400 text-xs block mb-0.5">
                          Description:
                        </span>
                        <p className="whitespace-pre-wrap">
                          {item.description || "No description provided."}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`mt-2 grid ${isAdmin || isSales ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"} gap-2 sm:gap-4 bg-white p-2 sm:p-2.5 rounded-lg border border-gray-100 text-sm`}
                    >
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">
                          Amount
                        </span>
                        <span className="font-semibold text-gray-800">
                          ₹{item.amount || "0"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">
                          Grand Total
                        </span>
                        <span className="font-bold text-green-600">
                          ₹{item.grand_total || "0"}
                        </span>
                      </div>
                      {(isAdmin || isSales) && (
                        <div>
                          <span className="text-gray-400 text-[10px] uppercase block">
                            Participation Details
                          </span>
                          {(item.amount_9 !== null &&
                            Number(item.amount_9) > 0) ||
                          (item.amount_18 !== null &&
                            Number(item.amount_18) > 0) ? (
                            <button
                              type="button"
                              onClick={() => {
                                const totalAmt =
                                  parseFloat(item.amount_9 || 0) +
                                  parseFloat(item.amount_18 || 0);
                                const pct9 =
                                  totalAmt > 0
                                    ? (
                                        (parseFloat(item.amount_9 || 0) /
                                          totalAmt) *
                                        100
                                      ).toFixed(4)
                                    : "0.00";
                                const pct18 =
                                  totalAmt > 0
                                    ? (
                                        (parseFloat(item.amount_18 || 0) /
                                          totalAmt) *
                                        100
                                      ).toFixed(4)
                                    : "0.00";
 
                                setSplitForm({
                                  amount: totalAmt.toFixed(2),
                                  amount_9: item.amount_9 || "",
                                  amount_18: item.amount_18 || "",
                                  percent_9:
                                    parseFloat(pct9) === 0
                                      ? ""
                                      : Number(
                                          parseFloat(pct9).toFixed(4),
                                        ).toString(),
                                  percent_18:
                                    parseFloat(pct18) === 0
                                      ? ""
                                      : Number(
                                          parseFloat(pct18).toFixed(4),
                                        ).toString(),
                                  tax_percent_9:
                                    item.tax_percent_9 !== null &&
                                    item.tax_percent_9 !== undefined
                                      ? item.tax_percent_9.toString()
                                      : "9.00",
                                  tax_percent_18:
                                    item.tax_percent_18 !== null &&
                                    item.tax_percent_18 !== undefined
                                      ? item.tax_percent_18.toString()
                                      : "18.00",
                                  tax_9: (item.tax_9 || 0).toString(),
                                  tax_18: (item.tax_18 || 0).toString(),
                                  grand_total: (
                                    item.split_grand_total ||
                                    item.grand_total ||
                                    0
                                  ).toString(),
                                });
                                setIsSplitReadOnly(true);
                                setShowSplitModal(true);
                              }}
                              className="text-violet-600 hover:text-violet-800 bg-transparent border-0 cursor-pointer flex items-center justify-start mt-0.5 p-0.5 rounded hover:bg-violet-50"
                              title="View Participation Details"
                            >
                              <i className="bi bi-eye text-lg"></i>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              No participation
                            </span>
                          )}
                        </div>
                      )}
                    </div>
 
                    {item.files?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">
                          Attached Files
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.files.map((f, i) => (
                            <a
                              key={i}
                              href={f.file_path}
                              onClick={(e) =>
                                handleFileDownload(
                                  e,
                                  f.file_path,
                                  f.file_name || "File",
                                )
                              }
                              className="flex items-center gap-1.5 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors shadow-sm"
                            >
                              <i className="bi bi-file-earmark-check text-indigo-500"></i>
                              <span className="truncate max-w-[120px]">
                                {f.file_name}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* FILE MANAGER MODAL */}
      {showFileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[440px] rounded-sm shadow-xl overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white border-b border-gray-100">
              <div className="flex items-center gap-2">
                <i className="bi bi-cloud-arrow-up text-orange-500 text-lg"></i>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Select Quotation Files
                </h2>
              </div>
              <button
                onClick={() => setShowFileModal(false)}
                className="w-8 h-8 rounded-full transition-colors flex items-center justify-center text-orange-500"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="p-6">
              <div
                className="w-full border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("quotFiles").click()}
              >
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <i className="bi bi-cloud-arrow-up text-orange-500 text-2xl"></i>
                </div>
                <p className="font-bold text-gray-700 text-sm">
                  Click or drag files here
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  JPG, PNG, PDF, CAD (Max 5MB), Excel (Max 2MB) - Max 5 files
                </p>
                <input
                  type="file"
                  id="quotFiles"
                  multiple
                  className="hidden"
                  onChange={handleSelect}
                  accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls,.csv,.excel,.dwg,.dxf"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-1.5 text-left max-h-[150px] overflow-y-auto pr-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Selected Files:
                  </p>
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-50 px-3 py-1.5 text-xs rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <i className="bi bi-file-earmark-text text-blue-500 text-sm"></i>
                        <span className="text-gray-600 font-medium truncate max-w-[240px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFiles(
                            selectedFiles.filter((_, i) => i !== idx),
                          );
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                      >
                        <i className="bi bi-x-circle text-sm"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowFileModal(false)}
                className="px-5 py-2 rounded-sm text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PARTICIPATION TAX CALCULATION MODAL */}
     
{showSplitModal && (
  <div
    id="splitDrawerOverlay"
    className="fixed inset-0 z-[65] flex justify-end bg-black/50 backdrop-blur-sm"
    style={{ animation: "spmFadeIn 0.3s ease-out" }}
  >
    <style>{`
      @keyframes spmSlideIn {
        from { transform: translateX(100%); opacity: 0.6; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes spmSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0.6; }
      }
      @keyframes spmFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes spmFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `}</style>
 
    <div
      id="splitDrawerPanel"
      className="bg-white w-[500px] max-w-[95vw] h-full shadow-2xl overflow-hidden border-l border-gray-100 flex flex-col text-gray-800"
      style={{ animation: "spmSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* ── Header (Image-2 style: white bg + gradient icon box + progress strip) ── */}
      <div className="bg-white z-10 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <i className="bi bi-calculator-fill text-white text-base"></i>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Quotation Tax Calculation
              </h2>
              <p className="text-[10px] text-gray-500 font-medium">
                Configure 9% & 18% tax components
              </p>
            </div>
          </div>
          <button
            onClick={closeSplitDrawer}
            className="w-8 h-8 rounded-full hover:bg-violet-50 transition-colors flex items-center justify-center text-gray-400 hover:text-violet-600 border-0 bg-transparent cursor-pointer"
          >
            ✕
          </button>
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
      <div className="p-6 space-y-4 text-left flex-1 overflow-y-auto">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center gap-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
            Total Base Amount
          </span>
          {isSplitReadOnly ? (
            <span className="text-lg font-bold text-gray-800">
              ₹ {Number(splitForm.amount || 0).toLocaleString()}
            </span>
          ) : (
            <div className="relative flex items-center max-w-[180px]">
              <span className="absolute left-2.5 text-gray-500 font-bold text-sm">
                ₹
              </span>
              <input
                type="text"
                name="amount"
                value={splitForm.amount || ""}
                onChange={handleSplitBaseAmountChange}
                className="w-full border border-indigo-200 rounded-md pl-6 pr-3 py-1.5 text-sm outline-none bg-white font-bold text-gray-800 focus:border-violet-500 text-right transition-colors"
              />
            </div>
          )}
        </div>
 
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide block mb-1">
                Project Value (₹)
              </label>
              <input
                type="text"
                name="amount_18"
                value={splitForm.amount_18}
                onChange={handleSplitFormChange}
                readOnly={isSplitReadOnly}
                disabled={isSplitReadOnly}
                placeholder="Enter amount"
                className="w-full border border-indigo-300 rounded-md px-3 py-1.5 text-sm outline-none bg-white font-semibold text-gray-800 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                Split (%)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="percent_18"
                  value={splitForm.percent_18}
                  onChange={handleSplitFormChange}
                  readOnly={isSplitReadOnly}
                  disabled={isSplitReadOnly}
                  placeholder="100.00"
                  className="w-full border border-gray-300 rounded-md pl-3 pr-7 py-1.5 text-sm outline-none bg-white font-semibold text-gray-800 focus:border-indigo-500 transition-colors"
                />
                <span className="absolute right-3 text-gray-400 text-xs font-bold">
                  %
                </span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                Tax Rate (%)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="tax_percent_18"
                  value={splitForm.tax_percent_18}
                  onChange={handleSplitFormChange}
                  readOnly={isSplitReadOnly}
                  disabled={isSplitReadOnly}
                  placeholder="18.00"
                  className="w-full border border-gray-300 rounded-md pl-3 pr-7 py-1.5 text-sm outline-none bg-white font-semibold text-gray-800 focus:border-indigo-500 transition-colors"
                />
                <span className="absolute right-3 text-gray-400 text-xs font-bold">
                  %
                </span>
              </div>
            </div>
            <div className="mt-2.5 space-y-1 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
              <div className="flex justify-between">
                <span>Tax ({splitForm.tax_percent_18 || "0"}%):</span>
                <span className="font-medium text-gray-700">
                  ₹ {splitForm.tax_18}
                </span>
              </div>
              <div className="flex justify-between border-t border-dashed border-gray-150 pt-1">
                <span>Total B:</span>
                <span className="font-bold text-gray-700">
                  ₹{" "}
                  {(
                    parseFloat(splitForm.amount_18 || 0) +
                    parseFloat(splitForm.tax_18 || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
 
          <div className="bg-violet-50/30 p-4 rounded-xl border border-violet-100 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-violet-700 uppercase tracking-wide block mb-1">
                Other Charges (₹)
              </label>
              <input
                type="text"
                name="amount_9"
                value={splitForm.amount_9}
                onChange={handleSplitFormChange}
                readOnly={isSplitReadOnly}
                disabled={isSplitReadOnly}
                placeholder="Enter amount"
                className="w-full border border-violet-300 rounded-md px-3 py-1.5 text-sm outline-none bg-white font-semibold text-gray-800 focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                Split (%)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="percent_9"
                  value={splitForm.percent_9}
                  onChange={handleSplitFormChange}
                  readOnly={isSplitReadOnly}
                  disabled={isSplitReadOnly}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-md pl-3 pr-7 py-1.5 text-sm outline-none bg-white font-semibold text-gray-800 focus:border-violet-500 transition-colors"
                />
                <span className="absolute right-3 text-gray-400 text-xs font-bold">
                  %
                </span>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                Tax Rate (%)
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="tax_percent_9"
                  value={splitForm.tax_percent_9}
                  onChange={handleSplitFormChange}
                  readOnly={isSplitReadOnly}
                  disabled={isSplitReadOnly}
                  placeholder="9.00"
                  className="w-full border border-gray-300 rounded-md pl-3 pr-7 py-1.5 text-sm outline-none bg-white font-semibold text-gray-800 focus:border-violet-500 transition-colors"
                />
                <span className="absolute right-3 text-gray-400 text-xs font-bold">
                  %
                </span>
              </div>
            </div>
            <div className="mt-2.5 space-y-1 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
              <div className="flex justify-between">
                <span>Tax ({splitForm.tax_percent_9 || "0"}%):</span>
                <span className="font-medium text-gray-700">
                  ₹ {splitForm.tax_9}
                </span>
              </div>
              <div className="flex justify-between border-t border-dashed border-gray-150 pt-1">
                <span>Total A:</span>
                <span className="font-bold text-gray-700">
                  ₹{" "}
                  {(
                    parseFloat(splitForm.amount_9 || 0) +
                    parseFloat(splitForm.tax_9 || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
 
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
            Project Value
          </span>
          <span className="text-xl font-black text-green-700">
            ₹ {Number(splitForm.grand_total || 0).toLocaleString()}
          </span>
        </div>
      </div>
 
      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 mt-auto">
        <button
          type="button"
          onClick={closeSplitDrawer}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all cursor-pointer border-0"
        >
          {isSplitReadOnly ? "Close" : "Cancel"}
        </button>
        {!isSplitReadOnly && (
          <button
            type="button"
            onClick={handleApplySplit}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer border-0 hover:shadow-lg hover:shadow-violet-200"
            style={{
              background: "linear-gradient(to right, #6366f1, #8b5cf6)",
            }}
          >
            Apply Participation
          </button>
        )}
      </div>
    </div>
  </div>
)}

      {/* Delete Confirmation Modal */}
   {showDeleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
    <div className="bg-white w-full h-[375px] max-w-md rounded-sm shadow-2xl overflow-hidden border border-gray-100 animate-[scaleIn_0.25s_ease-out]">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
            Delete Quotation
          </h3>
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
          {deleteName}
        </h3>

        {/* Divider */}
        <div className="w-10 h-[3px] bg-red-500 rounded-full mx-auto mb-4"></div>

        {/* Message */}
        <p className="text-gray-500 text-sm leading-relaxed">
          This action cannot be undone.
          <br />
          Are you sure you want to delete this quotation?
        </p>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3.5 px-7 pb-0">
        <button
          onClick={() => setShowDeleteModal(false)}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" strokeWidth={2.2} />
          Cancel
        </button>

        <button
          onClick={handleDeleteQuotation}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold text-white bg-red-600  shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
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
              Delete Quotation
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

      {/* STATUS CONFIRM MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-[350px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 from-orange-100 to-white bg-gradient-to-r">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-orange-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Confirm Status Change
                </h2>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-orange-600 text-sm leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to change status?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleTableStatusChange(
                      statusChangeData.id,
                      statusChangeData.status,
                    );
                    setShowStatusModal(false);
                  }}
                  className="px-6 py-2 rounded-sm text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Yes Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOST REASON MODAL (NEW) ===== */}
      {showLostReasonModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[420px] rounded-sm shadow-xl overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center px-5 py-3 bg-gradient-to-r from-red-100 to-white border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 tracking-wide flex items-center gap-2">
                <i className="bi bi-x-circle text-red-500 text-sm"></i>
                Mark Quotation as Lost
              </h3>
              <button
                onClick={() => {
                  setShowLostReasonModal(false);
                  setLostReasonText("");
                  setLostReasonTargetId(null);
                }}
                className="w-7 h-7 flex items-center justify-center text-red-500"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Reason for Loss <span className="text-red-400">*</span>
              </label>
              <textarea
                value={lostReasonText}
                onChange={(e) => setLostReasonText(e.target.value)}
                rows={4}
                placeholder="e.g. Price too high, Client chose another vendor..."
                className="w-full mt-1.5 border border-red-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setShowLostReasonModal(false);
                  setLostReasonText("");
                  setLostReasonTargetId(null);
                }}
                className="px-4 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitLostReason}
                disabled={isSubmittingLostReason}
                className="px-5 py-2 rounded-sm text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md transition flex items-center gap-2"
              >
                {isSubmittingLostReason ? "Saving..." : "Confirm Lost"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== VIEW LOST REASON MODAL (NEW) ===== */}
      {showViewReasonModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[400px] rounded-sm shadow-xl overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center px-5 py-3 bg-gradient-to-r from-red-100 to-white border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 tracking-wide flex items-center gap-2">
                <i className="bi bi-info-circle text-red-500 text-sm"></i>
                Lost Reason
              </h3>
              <button
                onClick={() => setShowViewReasonModal(false)}
                className="w-7 h-7 flex items-center justify-center text-red-500"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {viewReasonText}
              </p>
            </div>
            <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowViewReasonModal(false)}
                className="px-4 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT TO PI MODAL */}
      {showPIModal && selectedPIQuotation && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/30">
          <div className="bg-white w-[480px] rounded-sm shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 from-orange-100 to-white bg-gradient-to-r">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center">
                  <i
                    className="bi bi-file-earmark-arrow-up text-lg"
                    style={{ color: "#f07400" }}
                  ></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Convert to Proforma Invoice
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">
                    {selectedPIQuotation.company_name} —{" "}
                    {selectedPIQuotation.customer_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPIModal(false);
                  setPiPercentage("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-orange-500 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quotation No</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPIQuotation.quotation_no || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPIQuotation.reference || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Assignee</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPIQuotation.assignee || "-"}
                  </span>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Grand Total</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    ₹{" "}
                    {piGrandTotal
                      ? Number(piGrandTotal).toLocaleString("en-IN")
                      : "0"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Percentage <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={piPercentage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          handlePiPercentageChange("");
                          return;
                        }
                        const num = Number(val);
                        if (num >= 0 && num <= 100)
                          handlePiPercentageChange(num);
                      }}
                      className="w-full border border-orange-300 rounded-sm pl-3 pr-8 py-2.5 text-sm outline-none bg-gray-50 transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      %
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={piRupees}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          handlePiRupeesChange("");
                          return;
                        }
                        handlePiRupeesChange(Number(val));
                      }}
                      className="w-full border border-orange-300 rounded-sm pl-7 pr-3 py-2.5 text-sm outline-none bg-gray-50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {piGrandTotal > 0 && (
                <div
                  className={`rounded-sm p-3 border transition-all ${
                    piIsOver
                      ? "bg-red-50 border-red-200"
                      : piEnteredPct === 100
                        ? "bg-green-50 border-green-200"
                        : piEnteredPct > 0
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                    {piEnteredPct > 0
                      ? "Remaining After This Entry"
                      : "Total Available"}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p
                        className={`text-xl font-bold ${piIsOver ? "text-red-600" : piEnteredPct === 100 ? "text-green-600" : "text-green-700"}`}
                      >
                        {piIsOver
                          ? "Over!"
                          : piEnteredPct > 0
                            ? `${parseFloat(piRemainingPct.toFixed(2))}%`
                            : "100%"}
                      </p>
                      <p className="text-xs text-gray-400">Percentage</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200"></div>
                    <div className="text-center">
                      <p
                        className={`text-xl font-bold ${piIsOver ? "text-red-600" : piEnteredPct === 100 ? "text-green-600" : "text-green-700"}`}
                      >
                        {piIsOver
                          ? "Over!"
                          : piEnteredPct > 0
                            ? `₹${Number(piRemainingAmt).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                            : `₹${Number(piGrandTotal).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                      </p>
                      <p className="text-xs text-gray-400">Amount</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-white rounded-full h-2 border border-gray-200 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          piIsOver
                            ? "bg-red-500"
                            : piEnteredPct >= 100
                              ? "bg-green-500"
                              : "bg-green-400"
                        }`}
                        style={{ width: `${Math.min(piEnteredPct, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {piEnteredPct > 0
                          ? `${parseFloat(piEnteredPct.toFixed(2))}% entered`
                          : "Enter % or ₹ above"}
                      </span>
                      <span className="text-xs text-gray-400">100%</span>
                    </div>
                  </div>
                </div>
              )}

              {piIsOver && (
                <p className="text-xs text-red-500 font-medium -mt-1">
                  ⚠ Percentage cannot exceed 100%
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowPIModal(false);
                  setPiPercentage("");
                  setPiRupees("");
                }}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-sm py-2.5 text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePI}
                disabled={
                  isCreatingPI ||
                  !piPercentage ||
                  Number(piPercentage) <= 0 ||
                  Number(piPercentage) > 100
                }
                className={`flex-1 bg-green-500 hover:bg-green-600 text-white rounded-sm py-2.5 text-sm font-semibold shadow-md shadow-green-200 transition-all flex justify-center items-center gap-2 ${
                  isCreatingPI ||
                  !piPercentage ||
                  Number(piPercentage) <= 0 ||
                  Number(piPercentage) > 100
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {isCreatingPI ? (
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
                    Creating PI...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-check"></i>
                    Create Proforma Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNEE MODAL */}
  {showAssigneeModal && selectedAssigneeRow && (
  <div
    id="assigneeDrawerOverlay"
    className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm"
    style={{ animation: "asgFadeIn 0.3s ease-out" }}
    onClick={closeAssigneeDrawer}
  >
    <style>{`
      @keyframes asgSlideIn {
        from { transform: translateX(100%); opacity: 0.6; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes asgSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0.6; }
      }
      @keyframes asgFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes asgFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `}</style>
 
    <div
      id="assigneeDrawerPanel"
      className="bg-white border-l border-gray-100 w-[460px] max-w-[95vw] h-full shadow-2xl flex flex-col overflow-hidden"
      style={{ animation: "asgSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header (Image-2 style: white bg + gradient icon box + progress strip) ── */}
      <div className="bg-white flex-shrink-0 shadow-sm z-10">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <i className="bi bi-person-fill-gear text-white text-base"></i>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 tracking-wide">
                Change Assignee
              </h2>
              <p className="text-[10px] text-gray-500 font-medium">
                Reassign and keep this lead moving
              </p>
            </div>
          </div>
          <button
            onClick={closeAssigneeDrawer}
            className="text-gray-400 hover:text-violet-600 hover:bg-violet-50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
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
      <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">
              Last Assignee
            </p>
            <div className="flex gap-1 flex-wrap min-h-[36px] items-center">
              {selectedAssigneeRow.assignee ? (
                String(selectedAssigneeRow.assignee)
                  .split(",")
                  .map((name, i) => (
                    <span
                      key={i}
                      className="text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{
                        background:
                          "linear-gradient(to right, #6366f1, #8b5cf6)",
                      }}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                        {name.trim().charAt(0).toUpperCase()}
                      </span>
                      {name.trim()}
                    </span>
                  ))
              ) : (
                <span className="text-gray-400 text-xs italic">None</span>
              )}
            </div>
          </div>
 
          <div>
            <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">
              New Assignee <span className="text-red-400">*</span>
            </label>
            <Select
              menuPosition="fixed"
              instanceId="inline-assignee-select"
              options={asignee}
              value={newAssigneeValue}
              onChange={(selected) =>
                setNewAssigneeValue(selected || null)
              }
              placeholder="Select..."
              unstyled
              classNames={{
                control: ({ isFocused }) =>
                  `w-full border rounded-md px-2 py-1 text-xs bg-gray-50 outline-none cursor-pointer min-h-[36px] ${isFocused ? "border-violet-400 ring-1 ring-violet-200" : "border-gray-300"}`,
                valueContainer: () => "gap-1 flex-wrap",
                placeholder: () => "text-gray-400 text-xs",
                input: () => "text-xs text-gray-700",
                menu: () =>
                  "mt-1 border border-gray-200 rounded-md bg-white shadow-lg z-[200]",
                option: ({ isFocused, isSelected }) =>
                  `px-3 py-2 text-xs cursor-pointer ${isSelected ? "bg-indigo-600 text-white" : isFocused ? "bg-violet-50 text-violet-700" : "text-gray-700"}`,
                multiValue: () =>
                  "bg-indigo-600 text-white rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px]",
                multiValueLabel: () => "text-white font-medium",
                multiValueRemove: () =>
                  "text-white hover:bg-indigo-700 rounded ml-0.5 cursor-pointer",
                dropdownIndicator: () =>
                  "text-gray-400 px-1 cursor-pointer hover:text-violet-500",
                clearIndicator: () =>
                  "text-gray-400 px-1 cursor-pointer hover:text-red-500",
              }}
            />
          </div>
        </div>
 
        <div className="h-px bg-gray-100"></div>
 
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1">
            <i className="bi bi-pencil-square text-gray-300"></i>
            Task Description
            <span className="text-gray-300 font-normal normal-case ml-1">
              (optional)
            </span>
          </label>
          <textarea
            value={assigneeDescription}
            onChange={(e) => setAssigneeDescription(e.target.value)}
            placeholder="Write task details, instructions or notes..."
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-700 bg-gray-50 outline-none resize-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 transition-all placeholder:text-gray-400"
          />
        </div>
 
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1">
            <i className="bi bi-paperclip text-gray-300"></i>
            Attach Files
            <span className="text-gray-300 font-normal normal-case ml-1">
              (optional, max 5)
            </span>
          </label>
          <input
            type="file"
            multiple
            onChange={handleAssigneeFileChange}
            accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls,.csv,.excel,.dwg,.dxf"
            className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer outline-none border border-gray-300 rounded-md p-1 bg-gray-50"
          />
          {assigneeFiles.length > 0 && (
            <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto pr-1">
              {assigneeFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded px-2 py-1 text-[10px] text-gray-600"
                >
                  <span className="truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAssigneeFile(i)}
                    className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
 
        {loadingLog ? (
          <div className="border-t border-gray-100 pt-3 text-center text-xs text-gray-400 py-2">
            Loading history...
          </div>
        ) : assigneeLog.length > 0 ? (
          (() => {
            const sortedLogs = [...assigneeLog].sort(
              (a, b) => new Date(b.changed_at) - new Date(a.changed_at),
            );
            const displayedLogs =
              isAdmin || showAllHistory
                ? sortedLogs
                : sortedLogs.slice(0, 1);
 
            return (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                  <i className="bi bi-clock-history text-gray-300"></i>
                  {isAdmin ? "History Log" : "Last Change"}
                </p>
                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {displayedLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            {log.changed_by || "System"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            assigned
                          </span>
                          <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                            {log.new_assignee || "-"}
                          </span>
                        </div>
                        {log.changed_at && (
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            {formatDateTime(log.changed_at)}
                          </p>
                        )}
                        {log.description &&
                          log.description.trim() !== "" && (
                            <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                              <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1 mb-0.5">
                                <i className="bi bi-chat-text-fill text-[9px]"></i>
                                Task Note
                              </p>
                              <p className="text-[10px] text-amber-800 leading-relaxed whitespace-pre-wrap">
                                {log.description}
                              </p>
                            </div>
                          )}
                        {log.files && log.files.length > 0 && (
                          <div className="mt-1.5">
                            <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
                              <i className="bi bi-paperclip"></i> Attached
                              Files
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {log.files.map((file, fileIdx) => (
                                <a
                                  key={fileIdx}
                                  href={file.file_path}
                                  onClick={(e) =>
                                    handleFileDownload(
                                      e,
                                      file.file_path,
                                      file.file_name || "File",
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded text-[9px] font-medium transition-colors cursor-pointer"
                                >
                                  <i className="bi bi-file-earmark-arrow-down"></i>
                                  <span
                                    className="truncate max-w-[100px]"
                                    title={file.file_name}
                                  >
                                    {file.file_name}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {!isAdmin && sortedLogs.length > 1 && (
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="mt-3 w-full py-1.5 bg-gray-50 border border-gray-200 hover:bg-violet-50 hover:border-violet-200 rounded text-[10px] text-gray-500 hover:text-violet-600 font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <i
                      className={`bi ${showAllHistory ? "bi-chevron-up" : "bi-chevron-down"}`}
                    ></i>
                    {showAllHistory
                      ? "Hide History"
                      : `Show History (${sortedLogs.length - 1} more)`}
                  </button>
                )}
              </div>
            );
          })()
        ) : (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
              <i className="bi bi-clock-history text-gray-300"></i>
              Last Change
            </p>
            <p className="text-xs text-gray-300 italic text-center py-2">
              No history found
            </p>
          </div>
        )}
      </div>
 
      {/* Footer sticky buttons */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0 mt-auto">
        <button
          onClick={closeAssigneeDrawer}
          className="flex-1 py-2.5 rounded-lg text-xs border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleAssigneeUpdate}
          disabled={isUpdatingAssignee || !newAssigneeValue}
          className={`flex-[2] py-2.5 rounded-lg text-xs text-white font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-gradient-to-br from-indigo-500 to-violet-600 ${
            isUpdatingAssignee || !newAssigneeValue
              ? "cursor-not-allowed opacity-60"
              : "hover:shadow-lg hover:shadow-violet-200"
          }`}
          // style={{
          //   background:
          //     isUpdatingAssignee || !newAssigneeValue
          //       ? "#a5b4fc"
          //       : "linear-gradient(to right, #6366f1, #8b5cf6)",
          // }}
        >
          {isUpdatingAssignee ? (
            <>
              <svg
                className="animate-spin h-3.5 w-3.5"
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
              Updating...
            </>
          ) : (
            <>
              <i className="bi bi-person-check-fill text-xs"></i>
              Update Assignee
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
 

      {/* Proforma Invoice Assignee Selection Modal */}
      {showPiUserSelectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-[90vw] max-w-[450px] rounded-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <i className="bi bi-person-badge text-lg text-orange-600"></i>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Select Proforma Invoice Assignee
                </h3>
                <p className="text-xs text-gray-500">
                  Multiple Proforma Invoice users found. Please select one to
                  assign.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 my-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Assignee User
              </label>
              <select
                value={selectedPiUserForApproval}
                onChange={(e) => setSelectedPiUserForApproval(e.target.value)}
                className="w-full border border-orange-300 rounded-lg px-3.5 py-2.5 text-sm outline-none bg-gray-50 focus:border-orange-500 focus:bg-white transition-all font-medium text-gray-700"
              >
                <option value="">-- Choose User --</option>
                {availablePiUsers.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPiUserSelectModal(false);
                  setApproveTargetHistId(null);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedPiUserForApproval) {
                    toast.error("Please select an assignee!");
                    return;
                  }
                  setShowPiUserSelectModal(false);
                  await proceedStatusUpdate(
                    approveTargetHistId,
                    "Approved",
                    selectedPiUserForApproval,
                  );
                  setApproveTargetHistId(null);
                }}
                className="flex-1 text-white rounded-lg py-2.5 text-sm font-semibold transition-all shadow-md hover:opacity-90"
                style={{ background: "#f07400" }}
              >
                Approve & Assign
              </button>
            </div>
          </div>
        </div>
      )}

   
{showViewModal && viewQuotation && (
  <div
    id="viewDrawerOverlay"
    className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
    style={{ animation: "vqmFadeIn 0.3s ease-out" }}
  >
    <style>{`
      @keyframes vqmSlideIn {
        from { transform: translateX(100%); opacity: 0.6; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes vqmSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0.6; }
      }
      @keyframes vqmFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes vqmFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `}</style>
 
    <div
      id="viewDrawerPanel"
      className="bg-white w-full max-w-2xl h-full border-l border-gray-100 shadow-2xl flex flex-col overflow-hidden"
      style={{ animation: "vqmSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* ── HEADER (Image-2 style: white bg + gradient view icon + progress strip) ── */}
      <div className="bg-white flex-shrink-0 z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <i className="bi bi-eye text-white text-lg"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                {viewQuotation.customer_name || "—"}
              </p>
              <p className="text-gray-500 text-xs font-medium">
                Quotation Details
              </p>
            </div>
          </div>
          <button
            onClick={closeViewDrawer}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
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
 
      {/* BODY — scrollable */}
      <div className="p-5 grid grid-cols-2 gap-3 flex-1 overflow-y-auto content-start">
        {[
          {
            icon: "bi-building",
            label: "Company Name",
            value: viewQuotation.company_name,
            color: "bg-indigo-50 text-indigo-500",
          },
          {
            icon: "bi-percent",
            label: "Tax",
            value: `${viewQuotation.tax || 0} %`,
            color: "bg-amber-50 text-amber-500",
          },
          {
            icon: "bi-person-circle",
            label: "Customer Name",
            value: viewQuotation.customer_name,
            color: "bg-violet-50 text-violet-500",
          },
          {
            icon: "bi-telephone",
            label: "Mobile No",
            value: viewQuotation.mobile_no || "—",
            color: "bg-blue-50 text-blue-500",
          },
          {
            icon: "bi-tag",
            label: "Discount",
            value: `${viewQuotation.discount || 0} %`,
            color: "bg-pink-50 text-pink-500",
          },
          {
            icon: "bi-file-text",
            label: "Reference",
            value: viewQuotation.reference,
            color: "bg-amber-50 text-amber-500",
          },
          {
            icon: "bi-file-text",
            label: "location",
            value: viewQuotation.location,
            color: "bg-green-50 text-green-500",
          },
          {
            icon: "bi-file-text",
            label: "architecture",
            value: viewQuotation.architecture,
            color: "bg-teal-50 text-teal-500",
          },
          {
            icon: "bi-receipt",
            label: "Amount",
            value: `₹ ${Number(viewQuotation.amount || 0).toLocaleString()}`,
            color: "bg-blue-50 text-blue-500",
          },
          {
            icon: "bi-flag",
            label: "Source",
            value: viewQuotation.source,
            color: "bg-cyan-50 text-cyan-500",
          },
          {
            icon: "bi-currency-rupee",
            label: "Grand Total",
            value: `₹ ${Number(viewQuotation.grand_total || 0).toLocaleString()}`,
            color: "bg-emerald-50 text-emerald-500",
          },
          {
            icon: "bi-hash",
            label: "Quotation No",
            value: viewQuotation.quotation_no,
            color: "bg-indigo-50 text-indigo-500",
          },
          {
            icon: "bi-calendar3",
            label: "Created At",
            value: viewQuotation.created_at
              ? new Date(viewQuotation.created_at).toLocaleDateString(
                  "en-GB",
                )
              : "—",
            color: "bg-violet-50 text-violet-500",
          },
          {
            icon: "bi-clock-history",
            label: "Updated At",
            value: viewQuotation.updated_at
              ? new Date(viewQuotation.updated_at).toLocaleString("en-GB")
              : "—",
            color: "bg-sky-50 text-sky-500",
          },
          {
            icon: "bi-person-check",
            label: "Updated By",
            value: viewQuotation.updated_by,
            color: "bg-fuchsia-50 text-fuchsia-500",
          },
        ].map(({ icon, label, value, color }) => (
          <div
            key={label}
            className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 flex items-center gap-3 hover:border-violet-200 transition-colors"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
            >
              <i className={`bi ${icon} text-base`}></i>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                {label}
              </p>
              <p className="text-sm font-semibold text-gray-700 truncate">
                {value || "—"}
              </p>
            </div>
          </div>
        ))}
 
        {/* Description — full width */}
        <div className="col-span-2 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 flex items-start gap-3 hover:border-violet-200 transition-colors">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-500">
            <i className="bi bi-chat-left-text text-base"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
              Description
            </p>
            <p className="text-sm font-semibold text-gray-700 break-words whitespace-normal">
              {viewQuotation.description || "—"}
            </p>
          </div>
        </div>
      </div>
 
      {/* FOOTER */}
      <div className="flex justify-end px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex-shrink-0 mt-auto">
        <button
          onClick={closeViewDrawer}
          className="px-6 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 hover:border-violet-200 hover:text-violet-600 transition-all flex items-center gap-1.5"
        >
          <i className="bi bi-x-lg text-xs"></i>
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
