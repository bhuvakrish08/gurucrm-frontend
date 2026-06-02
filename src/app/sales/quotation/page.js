"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import Select from "react-select";
import { checkRole } from "@/utils/checkRole";
import useAuth from "@/app/components/useAuth";

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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // BUG FIX #1: Default tab changed from "sales" to "quotation"
  const [followUpTab, setFollowUpTab] = useState("quotation");

  const [previewFollowUp, setPreviewFollowUp] = useState(null);
  const [quotationData, setQuotationData] = useState(null);

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

  // Assignee Popover States
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [selectedAssigneeRow, setSelectedAssigneeRow] = useState(null);
  const [newAssigneeValue, setNewAssigneeValue] = useState(null);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const [assigneePopoverPos, setAssigneePopoverPos] = useState({ top: 0, left: 0 });
  const [assigneeDescription, setAssigneeDescription] = useState("");

  // Assignee History States
  const [assigneeLog, setAssigneeLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);

  // PI Assignee Selection Modal States
  const [showPiUserSelectModal, setShowPiUserSelectModal] = useState(false);
  const [availablePiUsers, setAvailablePiUsers] = useState([]);
  const [selectedPiUserForApproval, setSelectedPiUserForApproval] = useState("");
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
  });

  useAuth(["Admin", "Super Admin", "Sales", "Estimation"]);

  const isApprovedLocked = followUpHistory.some(
    (h) => h.quotation_status === "Approved"
  );

  const isQuotationNoLocked = (() => {
    const hasHistoryNo = followUpHistory && followUpHistory.some(
      (item) => item.quotation_no && String(item.quotation_no).trim() !== ""
    );
    if (hasHistoryNo) return true;
    if (selectedLead?.quotation_no && String(selectedLead.quotation_no).trim() !== "") {
      return true;
    }
    if (selectedQuotation?.quotation_no && String(selectedQuotation.quotation_no).trim() !== "") {
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
        }
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
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
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
      formData.append("quotation_no", updateForm.quotation_no || selectedQuotation?.quotation_no || "");
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
            // Content-Type set ન કરો - axios automatically multipart/form-data set કરે
          },
        }
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
        quotation_no: updateForm.quotation_no || selectedQuotation?.quotation_no || "",
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
  // ========================
  // FETCH
  // ========================
  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/quotation/read`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

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
      const userFirstName = (localStorage.getItem("username") || "").split(" ")[0].toLowerCase();
      let filteredData = data;
      if (userRole.toLowerCase() === "sales") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const hasBeenAssigned =
            qAssignees.some(name => name.includes(userFirstName)) ||
            lAssignees.some(name => name.includes(userFirstName));

          let inLog = false;
          if (q.assignee_log) {
            try {
              const logs = JSON.parse(q.assignee_log);
              inLog = logs.some(
                (log) =>
                  (log.previous_assignee &&
                    log.previous_assignee.toLowerCase().includes(userFirstName)) ||
                  (log.new_assignee &&
                    log.new_assignee.toLowerCase().includes(userFirstName))
              );
            } catch { }
          }
          return hasBeenAssigned || inLog;
        });
      } else if (userRole.toLowerCase() === "estimation") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];

          const matchesQuotation = qAssignees.some(name => name.includes(userFirstName));
          const matchesLead = lAssignees.some(name => name.includes(userFirstName));

          if (qAssignees.length === 0) {
            return matchesLead;
          }
          return matchesQuotation;
        });
      }
      setQuotations(filteredData);
    } catch (err) {
      console.log(err);
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
        }
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
        "Quotation No": q.quotation_no || "",
        "Created Date": q.first_quotation_date
          ? new Date(q.first_quotation_date).toLocaleDateString()
          : "",
        "Last Activity": q.quotation_date
          ? new Date(q.quotation_date).toLocaleDateString()
          : q.quotation_created_at
            ? new Date(q.quotation_created_at).toLocaleDateString()
            : "",
        "Grand Total (₹)": q.grand_total
          ? Number(q.grand_total).toLocaleString()
          : "",
        Assignee: q.assignee || "",
        Status: q.displayStatus || "",
        "Proforma %": q.proforma_percentage
          ? `${Number(q.proforma_percentage).toFixed(0)}%`
          : "-",
        "Updated By": q.updated_by || "",
        "Updated At": q.updated_at
          ? new Date(q.updated_at).toLocaleString("en-IN")
          : "",
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
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
        22
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
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      const res = await axios.get(`${API_BASE}/api/quotation/filter`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = (res.data?.data || []).map((item) => {
        const finalStatus = item.quotation_status || "Pending";
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
      const userFirstName = (localStorage.getItem("username") || "").split(" ")[0].toLowerCase();
      let filteredData = data;
      if (userRole.toLowerCase() === "sales") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const hasBeenAssigned =
            qAssignees.some(name => name.includes(userFirstName)) ||
            lAssignees.some(name => name.includes(userFirstName));

          let inLog = false;
          if (q.assignee_log) {
            try {
              const logs = JSON.parse(q.assignee_log);
              inLog = logs.some(
                (log) =>
                  (log.previous_assignee &&
                    log.previous_assignee.toLowerCase().includes(userFirstName)) ||
                  (log.new_assignee &&
                    log.new_assignee.toLowerCase().includes(userFirstName))
              );
            } catch { }
          }
          return hasBeenAssigned || inLog;
        });
      } else if (userRole.toLowerCase() === "estimation") {
        filteredData = data.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];

          const matchesQuotation = qAssignees.some(name => name.includes(userFirstName));
          const matchesLead = lAssignees.some(name => name.includes(userFirstName));

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

  const handleTableStatusChange = async (id, newStatus) => {
    try {
      await axios.put(
        `${API_BASE}/api/quotation/update-status/${id}`,
        { quotation_status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Status updated");
      setQuotations((prev) =>
        prev.map((q) => {
          if (q.latest_quotation_id !== id) return q;
          return {
            ...q,
            quotation_status: newStatus,
            displayStatus: newStatus,
            wasApprovedOnce:
              q.wasApprovedOnce || newStatus === "Won" || newStatus === "Lost",
          };
        })
      );
    } catch (err) {
      toast.error("Failed to update status");
    }
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
      quotation_status: lead.displayStatus === "Revision" ? "Revision" : "Pending",
      assignee: lead.assignee || "",
      discount: "",
      tax: "",
      amount: "",
      grand_total: "",
      description: "",
    });
    try {
      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${lead.lead_id}`
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
            `${API_BASE}/api/quotation/files/${hist.id}`
          );
          return { ...hist, files: hf.data?.files || [] };
        })
      );
      setFollowUpHistory(historyWithFiles);
      if (historyData.length > 0) {
        setForm((prev) => ({
          ...prev,
          quotation_no: historyData[0].quotation_no || prev.quotation_no,
          assignee: historyData[0].assignee || prev.assignee,
        }));
      }
    } catch (err) {
      console.log(err);
    }
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
    if (isApprovedLocked) {
      toast.error("Quotation is approved. No changes allowed.");
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
    });
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    let newForm = { ...form, [name]: value };
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
    } else if (name === "discount") {
      discount_rs = (amount * discount) / 100;
      newForm.discount_rs = discount_rs > 0 ? discount_rs.toFixed(2) : "";
    } else if (name === "discount_rs") {
      discount = amount > 0 ? (discount_rs / amount) * 100 : 0;
      newForm.discount = discount > 0 ? discount.toFixed(2) : "";
    }
    let subTotal = amount - discount_rs;
    let totalTaxRs = (subTotal * tax) / 100;
    let grand_total = subTotal + totalTaxRs;
    newForm.grand_total = grand_total > 0 ? grand_total.toFixed(2) : "";
    setForm(newForm);
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
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (status === "Approved") {
        await axios.put(
          `${API_BASE}/api/quotation/update-main-status/${selectedLead.latest_quotation_id}`,
          { quotation_status: "Won" }
        );
      }

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
        })
      );

      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`
      );
      const historyData = res.data?.result || [];
      const historyWithFiles = await Promise.all(
        historyData.map(async (hist) => {
          const hf = await axios.get(
            `${API_BASE}/api/quotation/files/${hist.id}`
          );
          return { ...hist, files: hf.data?.files || [] };
        })
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
      const errMsg = err.response?.data?.message || err.message || "Status update failed";
      toast.error(errMsg);
    }
  };

  const handleApproveDecline = async (histId, newStatus) => {
    try {
      if (newStatus === "Approved") {
        const usersRes = await axios.get(
          `${API_BASE}/api/manage-user/read`,
          {
            params: { search5: "Proforma invoices", search8: "1" },
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
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
      const errMsg = err.response?.data?.message || err.message || "Failed to initiate status update";
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
          `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`
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
        }
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

      await axios.put(
        `${API_BASE}/api/quotation/update-assignee/${selectedAssigneeRow.lead_id}`,
        {
          assignee: assigneeStr,
          description: assigneeDescription.trim(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("Assignee updated successfully!");
      setShowAssigneeModal(false);
      setSelectedAssigneeRow(null);
      setNewAssigneeValue(null);
      setAssigneeLog([]);
      setAssigneeDescription("");
      fetchQuotations();
    } catch (err) {
      console.log(err);
      toast.error("Failed to update assignee");
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  // Multer Constants
  const MAX_FILES = 5;
  const IMAGE_EXT_FE = ["jpg", "jpeg", "png"];
  const DOC_EXT_FE = ["pdf"];
  const MAX_IMG_SIZE = 2 * 1024 * 1024;
  const MAX_DOC_SIZE_FE = 2 * 1024 * 1024;

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
        (f) => f.name === file.name && f.size === file.size
      );
      if (isDuplicate) continue;
      if (![...IMAGE_EXT_FE, ...DOC_EXT_FE].includes(ext)) {
        toast.error("Only JPG, PNG, PDF allowed");
        continue;
      }
      if (IMAGE_EXT_FE.includes(ext) && file.size > MAX_IMG_SIZE) {
        toast.error("Image must be under 2MB");
        continue;
      }
      if (DOC_EXT_FE.includes(ext) && file.size > MAX_DOC_SIZE_FE) {
        toast.error("PDF must be under 2MB");
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

  // ========================
  // QUOTATION SUBMIT
  // ========================
  const handleQuotationSubmit = async () => {
    if (isApprovedLocked) {
      toast.error(
        "Quotation is already Approved. You cannot add or edit quotations."
      );
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
        await axios.put(`${API_BASE}/api/quotation/update/${editingId}`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
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
        `${API_BASE}/api/quotation/history/${selectedLead.lead_id}`
      );
      const historyData = res.data?.result || [];
      const historyWithFiles = await Promise.all(
        historyData.map(async (hist) => {
          const hf = await axios.get(
            `${API_BASE}/api/quotation/files/${hist.id}`
          );
          return { ...hist, files: hf.data?.files || [] };
        })
      );
      setFollowUpHistory(historyWithFiles);
      setForm({
        quotation_no: "",
        quotation_date: new Date().toISOString().split("T")[0],
        activity_type: "",
        quotation_status: selectedLead.displayStatus === "Revision" ? "Revision" : "Pending",
        assignee: form.assignee || "",
        amount: "",
        discount: "",
        discount_rs: "",
        tax: "0",
        grand_total: "",
        description: "",
      });
      setSelectedFiles([]);
      setEditingId(null);
      fetchQuotations();
    } catch (err) {
      const errMsg = err?.response?.data?.sqlMessage || err?.response?.data?.message || err?.message || "Something went wrong";
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
      // Use the backend assign route to update assignee and set status to Pending
      await axios.put(
        `${API_BASE}/api/quotation/assign/${selectedAssignQuotation.latest_quotation_id}`,
        { assignee: assignForm.assigned_to },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success("Quotation assigned successfully");
      setShowAssignModal(false);
      // Refresh data to reflect changes in both Estimation and Sales views
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

  const pendingCount = quotations.filter((q) => q.displayStatus === "Pending").length;
  const sentCount = quotations.filter((q) => q.displayStatus === "Sent").length;
  const revisionCount = quotations.filter((q) => q.displayStatus === "Revision").length;
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
    indexOfLastItem
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
  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        let data = [];
        const userRole = localStorage.getItem("role") || "";
        if (userRole.toLowerCase() === "estimation") {
          const res = await axios.get(`${API_BASE}/api/manage-user/read`, {
            params: { search5: "Sales", search8: "1" },
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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
      } catch (error) {
        console.log(error);
        setAsignee([]);
      }
    };
    fetchAssignee();
  }, []);

  const isAdmin = mounted ? checkRole(["Admin", "Super Admin"]) : false;
  const isSales = mounted ? checkRole(["Sales"]) : false;
  const isEstimation = mounted ? checkRole(["Estimation"]) : false;

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
        ? { value: q.assignee.split(",")[0].trim(), label: q.assignee.split(",")[0].trim() }
        : null
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
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Sales
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/sales/quotation"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
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
            placeholder="Company"
            className="p-2 w-full md:w-48 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <input
            name="customer_name"
            value={filters.customer_name}
            onChange={handleFilterChange}
            placeholder="Customer"
            className="p-2 w-full md:w-48 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <input
            name="reference"
            value={filters.reference}
            onChange={handleFilterChange}
            placeholder="Reference"
            className="p-2 w-full md:w-48 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <select
            name="assignee"
            value={filters.assignee}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-36 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-400 text-sm"
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
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-400 text-sm"
          >
            <option value="">Status</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-58 outline-none text-gray-400 text-sm col-span-2 md:col-span-1">
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

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-53 outline-none text-gray-400 text-sm col-span-2 md:col-span-1">
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
          <div className="flex items-center gap-6 px-6 pt-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("Pending")}
              className={`pb-3 px-3 text-sm font-medium relative transition-all ${activeTab === "Pending" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Pending{" "}
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
              {activeTab === "Pending" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
              )}
            </button>
            {!isEstimation && (
              <button
                onClick={() => setActiveTab("Sent")}
                className={`pb-3 px-3 text-sm font-medium relative transition-all ${activeTab === "Sent" ? "text-sky-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                Sent{" "}
                <span className="ml-2 bg-sky-100 text-sky-600 text-xs px-2 py-0.5 rounded-full">
                  {sentCount}
                </span>
                {activeTab === "Sent" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-600"></div>
                )}
              </button>
            )}
            <button
              onClick={() => setActiveTab("Revision")}
              className={`pb-3 px-3 text-sm font-medium relative transition-all ${activeTab === "Revision" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Revision{" "}
              <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                {revisionCount}
              </span>
              {activeTab === "Revision" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>
              )}
            </button>
            {!isEstimation && (
              <>
                <button
                  onClick={() => setActiveTab("Won")}
                  className={`pb-3 text-sm font-medium relative ${activeTab === "Won" ? "text-green-600" : "text-gray-500"}`}
                >
                  Won{" "}
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
                  Lost{" "}
                  <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                    {lostCount}
                  </span>
                  {activeTab === "Lost" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>
                  )}
                </button>
              </>
            )}
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
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Name</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer Name</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Create Quotation</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quotation No</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Activity</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Grand Total</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Assignee</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Follow-up</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Updated By</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotations.length > 0 ? (
                      paginatedQuotations.map((q, index) => {
                        const isRevisionTab = q.displayStatus === "Revision";
                        const isAssignedToEstimation = q.assignee && q.assignee.toLowerCase().includes("khushali");
                        const isAssignedToSales = q.assignee && q.assignee.toLowerCase().includes("darshil");

                        let rowClassName = "border-b border-gray-50 hover:bg-indigo-50/30 transition-colors";
                        if (isRevisionTab) {
                          if (isAssignedToEstimation) {
                            if (isEstimation || isAdmin) {
                              rowClassName = "border-b border-red-100 bg-red-50/40 hover:bg-red-100/50 transition-colors";
                            } else if (isSales) {
                              rowClassName = "border-b border-blue-100 bg-blue-50/40 hover:bg-blue-100/50 transition-colors";
                            }
                          } else if (isAssignedToSales && (isSales || isAdmin)) {
                            rowClassName = "border-b border-green-100 bg-green-50/40 hover:bg-green-100/50 transition-colors";
                          }
                        }

                        return (
                          <tr
                            key={q.lead_id}
                            className={rowClassName}
                          >
                            <td className="py-3 px-3">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="font-medium px-3">
                              <div className="flex items-center gap-2">
                                <span>{q.company_name || "-"}</span>
                                {isRevisionTab && isAssignedToEstimation && (isEstimation || isAdmin) && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 animate-blink shadow-sm border border-red-200">
                                    <span className="w-1.5 h-1.5 mr-1 rounded-full bg-red-500"></span>
                                    Work Not Done
                                  </span>
                                )}
                                {isRevisionTab && isAssignedToEstimation && isSales && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 animate-blink shadow-sm border border-blue-200">
                                    <span className="w-1.5 h-1.5 mr-1 rounded-full bg-blue-500"></span>
                                    Sent for Revision
                                  </span>
                                )}
                                {isRevisionTab && isAssignedToSales && (isSales || isAdmin) && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800 shadow-sm border border-green-200">
                                    <span className="w-1.5 h-1.5 mr-1 rounded-full bg-green-500"></span>
                                    Updated
                                  </span>
                                )}
                              </div>
                            </td>
                          <td className="text-orange-500 px-3">{q.customer_name || "-"}</td>
                          <td className="px-3">{q.reference || "-"}</td>
                          <td className="px-3">{q.source || "-"}</td>

                          <td className="text-lg px-3 text-center">
                            {q.displayStatus === "Won" || q.displayStatus === "Lost" ? (
                              <div
                                className="w-9 h-9 tracking-widest rounded-full border inline-flex items-center justify-center bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed mx-auto shadow-sm"
                                title="Quotation locked"
                              >
                                <i className="bi bi-lock text-sm"></i>
                              </div>
                            ) : q.latest_quotation_id ? (
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

                          <td className="px-3 text-gray-600">{q.quotation_no || "-"}</td>
                          <td className="px-3 text-gray-500">
                            {q.quotation_date
                              ? new Date(q.quotation_date).toLocaleDateString()
                              : q.quotation_created_at
                                ? new Date(q.quotation_created_at).toLocaleDateString()
                                : "-"}
                          </td>
                          <td className="px-3 font-semibold text-gray-700">
                            {q.grand_total
                              ? `₹ ${Number(q.grand_total).toLocaleString()}`
                              : "-"}
                          </td>

                          {/* ASSIGNEE CELL */}
                          <td className="px-3">
                            {q.displayStatus !== "Won" && q.displayStatus !== "Lost" ? (
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
                                          {name.trim().charAt(0).toUpperCase()}
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
                            <button
                              onClick={async () => {
                                try {
                                  setSelectedLead(q);
                                  setSelectedQuotation({
                                    id: q.latest_quotation_id,
                                    quotation_no: q.quotation_no,
                                  });

                                  // BUG FIX #1: Default to "quotation" tab
                                  setFollowUpTab("quotation");

                                  setUpdateForm({
                                    follow_up_date: new Date().toISOString().split("T")[0],
                                    activity_type: "",
                                    follow_up_by: "",
                                    contact_person: "",
                                    // BUG FIX #2: Pre-fill quotation_no from row data
                                    quotation_no: q.quotation_no || "",
                                    description: "",
                                  });

                                  setSelectedFiles([]);
                                  setPreviewFollowUp(null);

                                  // Fetch history
                                  const res = await axios.get(
                                    `${API_BASE}/api/quotation-revision/${q.latest_quotation_id}/full-details`,
                                    {
                                      headers: {
                                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                                      },
                                    }
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

                                  const mergedHistory = [
                                    ...quotationHistory,
                                    ...salesHistory,
                                  ].sort(
                                    (a, b) =>
                                      new Date(b.created_at) - new Date(a.created_at)
                                  );

                                  setFollowUpHistory(mergedHistory);
                                  setShowUpdateModal(true);
                                } catch (err) {
                                  console.log(err);
                                  toast.error("Failed to load history");
                                }
                              }}
                              className="w-10 h-10 rounded-full border border-black bg-white flex items-center justify-center mx-auto hover:bg-gray-100 transition-all duration-200"
                            >
                              <i className="bi bi-plus text-xl"></i>
                            </button>
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
                            {q.displayStatus !== "Won" && q.displayStatus !== "Lost" ? (
                              <select
                                value={q.displayStatus}
                                disabled={isEstimation && !q.assignee}
                                onChange={(e) =>
                                  handleTableStatusChange(q.latest_quotation_id, e.target.value)
                                }
                                className={`border rounded-md px-2 py-1 text-xs font-semibold outline-none cursor-pointer transition-all
                                  ${q.displayStatus === "Pending" ? "bg-yellow-50 text-yellow-700 border-yellow-300" : ""}
                                  ${q.displayStatus === "Sent" ? "bg-blue-50 text-blue-700 border-blue-300" : ""}
                                  ${q.displayStatus === "Revision" ? "bg-purple-50 text-purple-700 border-purple-300" : ""}
                                  ${q.displayStatus === "Lost" ? "bg-red-50 text-red-700 border-red-300" : ""}
                                `}
                              >
                                {isEstimation ? (
                                  <>
                                    <option value="Pending">Pending</option>
                                    <option value="Revision">Revision</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="Pending">Pending</option>
                                    <option value="Sent">Sent</option>
                                    <option value="Revision">Revision</option>
                                    {isSales || isAdmin ? (
                                      <>
                                        <option value="Won">Won</option>
                                        <option value="Lost">Lost</option>
                                      </>
                                    ) : (
                                      <option value="Lost">Lost</option>
                                    )}
                                  </>
                                )}
                              </select>
                            ) : q.displayStatus === "Won" ? (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold">Won</span>
                            ) : q.displayStatus === "Lost" ? (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">Lost</span>
                            ) : null}
                          </td>

                          <td className="px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {q.displayStatus === "Won" &&
                                q.latest_quotation_id &&
                                (() => {
                                  const percentage = Number(q.proforma_percentage || 0);
                                  if (!q.pi_exists || percentage === 0) {
                                    return (
                                      <button
                                        onClick={() => {
                                          setSelectedPIQuotation(q);
                                          setPiPercentage("");
                                          setPiRupees("");
                                          setShowPIModal(true);
                                        }}
                                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
                                        title="Create Proforma Invoice"
                                      >
                                        <i className="bi bi-file-earmark-plus text-sm"></i>
                                      </button>
                                    );
                                  }
                                  if (percentage > 0 && percentage < 100) {
                                    return (
                                      <button
                                        disabled
                                        className="flex items-center gap-1 bg-gray-300 text-gray-600 text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-not-allowed whitespace-nowrap"
                                        title={`PI In Progress (${percentage}%)`}
                                      >
                                        <i className="bi bi-hourglass-split text-sm"></i>
                                        {percentage}%
                                      </button>
                                    );
                                  }
                                  if (percentage === 100) {
                                    return (
                                      <span
                                        className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
                                        title="Proforma Invoice Completed"
                                      >
                                        <i className="bi bi-check-circle-fill text-emerald-500"></i>
                                        Completed
                                      </span>
                                    );
                                  }
                                })()}

                              {q.latest_quotation_id ? (
                                q.displayStatus === "Won" || q.displayStatus === "Lost" ? (
                                  <div
                                    className="text-gray-300 w-8 h-8 rounded-full flex items-center justify-center"
                                    title="Locked"
                                  >
                                    <i className="bi bi-lock-fill"></i>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => openDeleteModal(q.latest_quotation_id)}
                                    className="text-gray-400 hover:text-red-600 cursor-pointer"
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
                        <td colSpan="14" className="text-center py-10 text-gray-400">
                          No Quotations Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-medium">Rows per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer font-medium"
                    >
                      {[10, 20, 100, 200].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page ? "bg-[#212121] text-white shadow-md shadow-black/10" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
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
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================== FOLLOW-UP MODAL ================== */}
      {showUpdateModal && (
        // BUG FIX #6: Full modal is scrollable with overflow-y-auto on inner container
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4">
          <div className="bg-white w-full max-w-[820px] rounded-sm shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white flex-shrink-0">
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
                  // BUG FIX #1: Reset to "quotation" tab on close too
                  setFollowUpTab("quotation");
                }}
                className="w-7 h-7 flex items-center justify-center text-orange-500 text-md"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  setFollowUpTab("lead");
                  setPreviewFollowUp(null);
                }}
                className={`px-6 py-3 text-sm font-semibold transition-all ${followUpTab === "lead"
                  ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50"
                  : "text-gray-500"
                  }`}
              >
                Lead
              </button>

              <button
                onClick={() => {
                  setFollowUpTab("quotation");
                  setPreviewFollowUp(null);
                }}
                className={`px-6 py-3 text-sm font-semibold transition-all ${followUpTab === "quotation"
                  ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50"
                  : "text-gray-500"
                  }`}
              >
                Quotation
              </button>
            </div>

            {/* Body — scrollable */}
            {/* BUG FIX #6: overflow-y-auto on this body div makes modal content scroll */}
            <div className="flex flex-1 overflow-hidden">

              {/* LEFT: Form */}
              <div className="w-1/2 px-6 py-5 border-r border-gray-100 overflow-y-auto">

                {followUpTab === "lead" && (
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
                    Lead Follow-Up
                  </p>
                )}

                {followUpTab === "quotation" && (
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
                    Quotation Follow-Up
                  </p>
                )}

                {/* LEAD TAB: Read-only notice */}
                {followUpTab === "lead" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="bi bi-info-circle-fill text-blue-500 text-sm"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-700">Lead Follow-Up History</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Lead follow-ups are managed from the Leads section. You can view the history on the right panel.
                        </p>
                      </div>
                    </div>

                    {selectedLead && (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-medium">Company</span>
                          <span className="font-semibold text-gray-700">{selectedLead.company_name || "—"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-medium">Customer</span>
                          <span className="font-semibold text-gray-700">{selectedLead.customer_name || "—"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-medium">Reference</span>
                          <span className="font-semibold text-gray-700">{selectedLead.reference || "—"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 font-medium">Assignee</span>
                          <span className="font-semibold text-gray-700">{selectedLead.assignee || "—"}</span>
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
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Follow-Up Date
                      </label>
                      <input
                        type="date"
                        name="follow_up_date"
                        value={updateForm.follow_up_date}
                        onChange={handleInputChange}
                        className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
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
                        className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
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
                        className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
                      >
                        <option value="">Select User</option>
                        {asignee.map((item) => (
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
                        className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
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
                        disabled={!!selectedQuotation?.quotation_no || !!selectedLead?.quotation_no}
                        className={`w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50 ${
                          (selectedQuotation?.quotation_no || selectedLead?.quotation_no)
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
                        className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50 h-20 resize-none"
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
                              <span className="text-gray-600 truncate">{file.name}</span>
                              <button
                                onClick={() =>
                                  setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
                                }
                                className="text-orange-400 hover:text-orange-600 ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5">Max 2MB · JPG, PNG, PDF</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: History Panel */}
              {/* BUG FIX #5 & #6: Proper overflow-y-auto, aligned layout */}
              <div className="w-1/2 px-6 py-5 flex flex-col overflow-hidden">

                {followUpTab === "lead" && (
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                      Lead Follow-Up History
                    </p>
                    <span className="text-xs bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                      {followUpHistory.filter((h) => h.module_type === "sales").length} record(s)
                    </span>
                  </div>
                )}

                {followUpTab === "quotation" && (
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                      Quotation Follow-Up History
                    </p>
                    <span className="text-xs bg-orange-50 text-orange-500 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
                      {followUpHistory.filter((h) => h.module_type === "quotation").length} record(s)
                    </span>
                  </div>
                )}

                {/* History List — scrollable */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(() => {
                    const filtered = followUpHistory.filter((h) =>
                      followUpTab === "lead"
                        ? h.module_type === "sales"
                        : h.module_type === "quotation"
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
                      const previewId = previewFollowUp?.follow_up_id || previewFollowUp?.id;
                      const isActive = previewId === itemId;

                      return (
                        <div key={itemId}>
                          <div
                            onClick={() => setPreviewFollowUp(isActive ? null : item)}
                            className={`border rounded-xl p-3 cursor-pointer transition-all select-none ${isActive
                              ? "border-orange-400 bg-orange-50 shadow-sm"
                              : "hover:bg-gray-50 border-gray-200"
                              }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {idx === 0 && (
                                  <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
                                    Latest
                                  </span>
                                )}
                                <div>
                                  <p className="font-semibold text-sm text-gray-700">
                                    {item.activity_type}
                                  </p>
                                  <p className={`text-[10px] uppercase font-semibold ${followUpTab === "lead" ? "text-blue-400" : "text-orange-400"
                                    }`}>
                                    {followUpTab === "lead" ? "Lead" : "Quotation"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400">
                                  {item.follow_up_date
                                    ? new Date(item.follow_up_date).toLocaleDateString()
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

                          {/* BUG FIX #5: Preview panel rendered inline below each card for proper alignment */}
                          {isActive && (
                            <div className="mt-1 mb-2 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 text-sm shadow-sm">
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
                                    <p className="font-semibold text-gray-700 text-sm mt-0.5">{value || "—"}</p>
                                  </div>
                                ))}
                                <div>
                                  <p className="text-xs text-gray-400 font-medium">Status</p>
                                  <span
                                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block ${previewFollowUp.status === "Completed"
                                      ? "bg-green-100 text-green-600"
                                      : previewFollowUp.status === "Cancelled"
                                        ? "bg-orange-100 text-orange-500"
                                        : "bg-orange-100 text-orange-600"
                                      }`}
                                  >
                                    {previewFollowUp.status || "—"}
                                  </span>
                                </div>
                                {previewFollowUp.quotation_no && (
                                  <div>
                                    <p className="text-xs text-gray-400 font-medium">Quotation No</p>
                                    <p className="font-semibold text-gray-700 text-sm mt-0.5">{previewFollowUp.quotation_no}</p>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2.5">
                                <p className="text-xs text-gray-400 font-medium">Description</p>
                                <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
                                  {previewFollowUp.description || "—"}
                                </p>
                              </div>

                              {/* BUG FIX #4: File URLs as clickable links that open in new tab */}
                              {previewFollowUp.files && previewFollowUp.files.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-gray-400 font-medium mb-1.5">Attached Files</p>
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
                                          {f.filename || f.file_name || "File"}
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
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedFiles([]);
                  setPreviewFollowUp(null);
                  setFollowUpTab("quotation");
                }}
                className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>

              <button
                onClick={followUpTab === "quotation" ? handleUpdate : undefined}
                disabled={followUpTab === "lead" || updateLoading}
                title={followUpTab === "lead" ? "Lead follow-ups cannot be added here" : ""}
                className={`px-6 py-2 rounded-sm text-sm font-semibold text-white transition-all shadow-md flex items-center gap-2 ${followUpTab === "lead"
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : updateLoading
                    ? "bg-orange-400 cursor-not-allowed shadow-orange-200"
                    : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                  }`}
              >
                {updateLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                      <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Saving...
                  </>
                ) : followUpTab === "lead" ? (
                  <>
                    <i className="bi bi-lock-fill text-xs"></i>
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

      {/* QUOTATION UPDATE MODAL */}
      {showQuotationModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[90vw] max-w-[900px] h-[85vh] rounded-sm shadow-xl overflow-hidden border border-gray-100 flex flex-col">
            <div
              className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shadow-sm z-10"
              style={{ background: "linear-gradient(to right, #f5e0c6, #ffffff)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                  <i className="bi bi-activity text-lg text-orange-500"></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    {selectedLead?.company_name}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">Quotation Management</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuotationModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-orange-500 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
              {/* Left Side: Form */}
              <div className="w-5/12 bg-white border-r border-gray-100 flex flex-col relative z-10 overflow-y-auto">
                {isApprovedLocked && (
                  <div className="mx-4 mt-4 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i className="bi bi-lock-fill text-green-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-700">Quotation Approved</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        This quotation is already approved. You cannot add or edit any further quotation activities.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={`p-6 flex flex-col gap-4 ${isApprovedLocked ? "opacity-50 pointer-events-none select-none" : ""}`}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quotation Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        name="quotation_date"
                        value={form.quotation_date}
                        onChange={handleChange}
                        className="w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
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
                        className="w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
                      >
                        <option value="">-- Select --</option>
                        <option>Sent</option>
                        <option>Call</option>
                        <option>Meeting</option>
                        <option>Revision</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quotation No <span className="text-red-400">*</span>
                      </label>
                       <input
                        name="quotation_no"
                        value={form.quotation_no}
                        onChange={handleChange}
                        disabled={isQuotationNoLocked}
                        className={`w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50 ${
                          isQuotationNoLocked ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={form.amount || ""}
                        onChange={handleChange}
                        className="w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        name="discount"
                        value={form.discount || ""}
                        onChange={handleChange}
                        className="w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tax (%)
                      </label>
                      <select
                        name="tax"
                        value={form.tax}
                        onChange={handleChange}
                        className="w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="18">18%</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Grand Total (₹)
                      </label>
                      <input
                        type="number"
                        name="grand_total"
                        value={form.grand_total || ""}
                        onChange={handleChange}
                        className="w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
                      />
                    </div>
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
                      className="w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50 resize-none"
                    ></textarea>
                  </div>
                  <div className="border border-dashed border-orange-200 rounded-xl p-4 bg-orange-50/30 text-center">
                    {!editingId ? (
                      <>
                        <button
                          onClick={() => setShowFileModal(true)}
                          className="text-white px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all"
                          style={{ background: "#f07400" }}
                        >
                          <i className="bi bi-cloud-upload text-sm"></i> Upload Files
                        </button>
                        {selectedFiles.length > 0 && (
                          <div className="mt-3 space-y-1.5 text-left">
                            {selectedFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-white px-3 py-1.5 text-xs rounded-lg border border-gray-100 shadow-sm"
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <i className="bi bi-file-earmark-text text-blue-500 text-sm"></i>
                                  <span className="text-gray-600 font-medium truncate">{file.name}</span>
                                </div>
                                <button
                                  onClick={() =>
                                    setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))
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
                        File editing is unavailable during updates. Create a new quotation to attach new files.
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto flex gap-3">
                  {isApprovedLocked ? (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-gray-100 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-400 cursor-not-allowed select-none">
                      <i className="bi bi-lock-fill text-gray-400"></i>
                      Locked — Quotation Approved
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleQuotationSubmit}
                        disabled={isSubmitting}
                        className={`flex-1 text-white rounded-xl py-3 text-sm font-semibold transition-all flex justify-center items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                        style={{ background: "#f07400" }}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                              <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-floppy2-fill"></i>
                            {editingId ? "Update Quotation" : "Save Quotation Activity"}
                          </>
                        )}
                      </button>
                      {editingId && (
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setForm({
                              quotation_no: form.quotation_no,
                              quotation_date: new Date().toISOString().split("T")[0],
                              activity_type: "",
                              quotation_status: selectedLead.displayStatus === "Revision" ? "Revision" : "Pending",
                              assignee: form.assignee,
                              amount: "",
                              discount: "",
                              tax: "0",
                              grand_total: "",
                              description: "",
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
              <div className="w-7/12 bg-slate-50 flex flex-col relative z-0">
                <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                    <i className="bi bi-clock-history" style={{ color: "#f07400" }}></i>{" "}
                    Quotation History Data
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {followUpHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <i className="bi bi-inbox text-4xl mb-2 text-gray-300"></i>
                      <p className="text-sm font-medium">No quotation history found.</p>
                    </div>
                  ) : (
                    [...followUpHistory]
                      .sort((a, b) =>
                        a.quotation_status === "Approved"
                          ? -1
                          : b.quotation_status === "Approved"
                            ? 1
                            : Math.sign(new Date(b.created_at) - new Date(a.created_at))
                      )
                      .map((item, index) => (
                        <div
                          key={index}
                          className={`bg-white border rounded-xl p-4 shadow-sm transition-colors ${item.quotation_status === "Approved"
                            ? "border-green-400 bg-green-50/20"
                            : "border-gray-200 hover:border-blue-200"
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm ${item.quotation_status === "Approved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-600"
                                  }`}
                              >
                                {item.assignee ? item.assignee.charAt(0) : "U"}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-medium">
                                  Recorded by{" "}
                                  <span className="text-gray-800 font-bold">{item.assignee || "User"}</span>
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                                  Quotation Date:{" "}
                                  {new Date(item.quotation_date || item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center">
                              {item.quotation_status !== "Won" &&
                                item.quotation_status !== "Lost" &&
                                item.quotation_status !== "Approved" &&
                                item.quotation_status !== "Declined" &&
                                !followUpHistory.find((h) => h.quotation_status === "Approved") &&
                                (!isSales || item.quotation_status === "Sent") && (
                                  <>
                                    <button
                                      onClick={() => handleApproveDecline(item.id, "Approved")}
                                      className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-2 py-1 rounded-md transition-all shadow-sm"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleApproveDecline(item.id, "Declined")}
                                      className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2 py-1 rounded-md transition-all shadow-sm"
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                              <span
                                className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md ${item.quotation_status === "Approved"
                                  ? "bg-green-100 text-green-700"
                                  : item.quotation_status === "Declined"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                  }`}
                              >
                                {item.quotation_status || "Pending"}
                              </span>
                              {item.quotation_status !== "Approved" &&
                                item.quotation_status !== "Declined" &&
                                !isApprovedLocked && (
                                  <button
                                    onClick={() => handleEditClick(item)}
                                    className="ml-1 text-gray-400 hover:text-blue-600 transition-colors p-1"
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
                                <span className="text-indigo-800">{item.updated_by}</span>
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
                              <span className="text-gray-400 text-xs">Quotation No:</span>{" "}
                              <span className="font-semibold">{item.quotation_no || "-"}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-xs">Activity Type:</span>{" "}
                              <span className="font-semibold">{item.activity_type || "-"}</span>
                            </div>
                            <div className="col-span-2 text-gray-700">
                              <span className="text-gray-400 text-xs block mb-0.5">Description:</span>
                              <p className="whitespace-pre-wrap">
                                {item.description || "No description provided."}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-4 gap-4 bg-white p-2.5 rounded-lg border border-gray-100 text-sm">
                            <div>
                              <span className="text-gray-400 text-[10px] uppercase block">Amount</span>
                              <span className="font-semibold text-gray-800">₹{item.amount || "0"}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] uppercase block">Discount</span>
                              <span className="font-semibold text-gray-800">
                                ₹{item.amount && item.discount
                                  ? ((item.amount * item.discount) / 100).toFixed(2)
                                  : "0"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] uppercase block">Tax</span>
                              <span className="font-semibold text-gray-800">{item.tax || "0"}%</span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] uppercase block">Grand Total</span>
                              <span className="font-bold text-green-600">₹{item.grand_total || "0"}</span>
                            </div>
                          </div>

                          {/* BUG FIX #4: Files in quotation history cards also open in new tab */}
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
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors shadow-sm"
                                  >
                                    <i className="bi bi-file-earmark-check text-indigo-500"></i>
                                    <span className="truncate max-w-[120px]">{f.file_name}</span>
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
                <p className="font-bold text-gray-700 text-sm">Click or drag files here</p>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG, PDF (Max 2MB per file, Max 5 files)</p>
                <input
                  type="file"
                  id="quotFiles"
                  multiple
                  className="hidden"
                  onChange={handleSelect}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
              </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[400px] rounded-sm shadow-xl overflow-hidden border border-gray-100">
            <div className="flex justify-between items-center px-5 py-3 bg-gradient-to-r from-orange-100 to-white border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 tracking-wide flex items-center gap-2">
                <i className="bi bi-trash text-orange-500 text-sm"></i>
                DELETE QUOTATION
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-orange-500"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center py-8 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                <i className="bi bi-trash text-orange-500 text-3xl"></i>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">{deleteName}</h2>
              <p className="text-gray-400 text-sm mt-2">This action cannot be undone. Are you sure?</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuotation}
                disabled={isDeleting}
                className="px-6 py-2 rounded-sm text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" fill="none" opacity="0.3" />
                      <path d="M4 12a8 8 0 018-8" stroke="white" strokeWidth="3" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
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
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to change status?</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleTableStatusChange(statusChangeData.id, statusChangeData.status);
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

      {/* CONVERT TO PI MODAL */}
      {showPIModal && selectedPIQuotation && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/30">
          <div className="bg-white w-[480px] rounded-sm shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 from-orange-100 to-white bg-gradient-to-r">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center">
                  <i className="bi bi-file-earmark-arrow-up text-lg" style={{ color: "#f07400" }}></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Convert to Proforma Invoice
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">
                    {selectedPIQuotation.company_name} — {selectedPIQuotation.customer_name}
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
                  <span className="font-semibold text-gray-700">{selectedPIQuotation.quotation_no || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Reference</span>
                  <span className="font-semibold text-gray-700">{selectedPIQuotation.reference || "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Assignee</span>
                  <span className="font-semibold text-gray-700">{selectedPIQuotation.assignee || "-"}</span>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Grand Total</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    ₹ {piGrandTotal ? Number(piGrandTotal).toLocaleString("en-IN") : "0"}
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
                        if (val === "") { handlePiPercentageChange(""); return; }
                        const num = Number(val);
                        if (num >= 0 && num <= 100) handlePiPercentageChange(num);
                      }}
                      className="w-full border border-orange-300 rounded-sm pl-3 pr-8 py-2.5 text-sm outline-none bg-gray-50 transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={piRupees}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") { handlePiRupeesChange(""); return; }
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
                  className={`rounded-sm p-3 border transition-all ${piIsOver
                    ? "bg-red-50 border-red-200"
                    : piEnteredPct === 100
                      ? "bg-green-50 border-green-200"
                      : piEnteredPct > 0
                        ? "bg-green-50 border-green-200"
                        : "bg-blue-50 border-blue-100"
                    }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                    {piEnteredPct > 0 ? "Remaining After This Entry" : "Total Available"}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p className={`text-xl font-bold ${piIsOver ? "text-red-600" : piEnteredPct === 100 ? "text-green-600" : "text-green-700"}`}>
                        {piIsOver ? "Over!" : piEnteredPct > 0 ? `${parseFloat(piRemainingPct.toFixed(2))}%` : "100%"}
                      </p>
                      <p className="text-xs text-gray-400">Percentage</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200"></div>
                    <div className="text-center">
                      <p className={`text-xl font-bold ${piIsOver ? "text-red-600" : piEnteredPct === 100 ? "text-green-600" : "text-green-700"}`}>
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
                        className={`h-2 rounded-full transition-all duration-300 ${piIsOver ? "bg-red-500" : piEnteredPct >= 100 ? "bg-green-500" : "bg-green-400"
                          }`}
                        style={{ width: `${Math.min(piEnteredPct, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {piEnteredPct > 0 ? `${parseFloat(piEnteredPct.toFixed(2))}% entered` : "Enter % or ₹ above"}
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
                disabled={isCreatingPI || !piPercentage || Number(piPercentage) <= 0 || Number(piPercentage) > 100}
                className={`flex-1 bg-green-500 hover:bg-green-600 text-white rounded-sm py-2.5 text-sm font-semibold shadow-md shadow-green-200 transition-all flex justify-center items-center gap-2 ${isCreatingPI || !piPercentage || Number(piPercentage) <= 0 || Number(piPercentage) > 100
                  ? "opacity-60 cursor-not-allowed"
                  : ""
                  }`}
              >
                {isCreatingPI ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                      <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
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

      {/* ASSIGNEE POPOVER */}
      {showAssigneeModal && selectedAssigneeRow && (
        <div className="fixed inset-0 z-[80]" onClick={closeAssigneePopover}>
          <div
            className="fixed bg-white rounded-lg border border-gray-200 w-[340px] shadow-2xl flex flex-col"
            style={{
              top: Math.min(assigneePopoverPos.top, window.innerHeight - 520),
              left: Math.min(assigneePopoverPos.left, window.innerWidth - 356),
              maxHeight: `${window.innerHeight - Math.min(assigneePopoverPos.top, window.innerHeight - 520) - 16}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-orange-500 rounded-t-lg flex-shrink-0">
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <i className="bi bi-person-fill-gear"></i>
                Change Assignee
              </p>
              <button onClick={closeAssigneePopover} className="text-white/80 hover:text-white">
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Last Assignee</p>
                  <div className="flex gap-1 flex-wrap min-h-[36px] items-center">
                    {selectedAssigneeRow.assignee ? (
                      String(selectedAssigneeRow.assignee).split(",").map((name, i) => (
                        <span
                          key={i}
                          className="bg-blue-800 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
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
                    onChange={(selected) => setNewAssigneeValue(selected || null)}
                    placeholder="Select..."
                    unstyled
                    classNames={{
                      control: ({ isFocused }) =>
                        `w-full border rounded-md px-2 py-1 text-xs bg-gray-50 outline-none cursor-pointer min-h-[36px] ${isFocused ? "border-orange-400 ring-1 ring-orange-200" : "border-gray-300"}`,
                      valueContainer: () => "gap-1 flex-wrap",
                      placeholder: () => "text-gray-400 text-xs",
                      input: () => "text-xs text-gray-700",
                      menu: () => "mt-1 border border-gray-200 rounded-md bg-white shadow-lg z-[200]",
                      option: ({ isFocused, isSelected }) =>
                        `px-3 py-2 text-xs cursor-pointer ${isSelected ? "bg-blue-800 text-white" : isFocused ? "bg-orange-50 text-orange-700" : "text-gray-700"}`,
                      multiValue: () => "bg-blue-800 text-white rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px]",
                      multiValueLabel: () => "text-white font-medium",
                      multiValueRemove: () => "text-white hover:bg-blue-900 rounded ml-0.5 cursor-pointer",
                      dropdownIndicator: () => "text-gray-400 px-1 cursor-pointer hover:text-orange-500",
                      clearIndicator: () => "text-gray-400 px-1 cursor-pointer hover:text-red-500",
                    }}
                  />
                </div>
              </div>

              <div className="h-px bg-gray-100"></div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1">
                  <i className="bi bi-pencil-square text-gray-300"></i>
                  Task Description
                  <span className="text-gray-300 font-normal normal-case ml-1">(optional)</span>
                </label>
                <textarea
                  value={assigneeDescription}
                  onChange={(e) => setAssigneeDescription(e.target.value)}
                  placeholder="Write task details, instructions or notes..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-700 bg-gray-50 outline-none resize-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeAssigneePopover}
                  className="flex-1 py-2 rounded-md text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssigneeUpdate}
                  disabled={isUpdatingAssignee || !newAssigneeValue}
                  className={`flex-[2] py-2 rounded-md text-xs text-white font-semibold flex items-center justify-center gap-1.5 transition-all ${isUpdatingAssignee || !newAssigneeValue
                    ? "bg-orange-300 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                    }`}
                >
                  {isUpdatingAssignee ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                        <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-check-fill text-xs"></i>
                      Update
                    </>
                  )}
                </button>
              </div>

              {loadingLog ? (
                <div className="border-t border-gray-100 pt-3 text-center text-xs text-gray-400 py-2">
                  Loading history...
                </div>
              ) : assigneeLog.length > 0 ? (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                    <i className="bi bi-clock-history text-gray-300"></i>
                    Last Change
                  </p>
                  {assigneeLog.slice(0, 1).map((log, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            {log.changed_by || "System"}
                          </span>
                          <span className="text-[10px] text-gray-400">assigned</span>
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {log.new_assignee || "-"}
                          </span>
                        </div>
                        {log.changed_at && (
                          <p className="text-[9px] text-gray-400 mt-0.5">{formatDateTime(log.changed_at)}</p>
                        )}
                        {log.description && log.description.trim() !== "" && (
                          <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                            <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1 mb-0.5">
                              <i className="bi bi-chat-text-fill text-[9px]"></i>
                              Task Note
                            </p>
                            <p className="text-[10px] text-amber-800 leading-relaxed whitespace-pre-wrap">{log.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                    <i className="bi bi-clock-history text-gray-300"></i>
                    Last Change
                  </p>
                  <p className="text-xs text-gray-300 italic text-center py-2">No history found</p>
                </div>
              )}
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
                  Multiple Proforma Invoice users found. Please select one to assign.
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
                  await proceedStatusUpdate(approveTargetHistId, "Approved", selectedPiUserForApproval);
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
    </>
  );
}