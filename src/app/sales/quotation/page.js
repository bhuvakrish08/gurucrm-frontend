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

  // PI Modal States
  const [showPIModal, setShowPIModal] = useState(false);
  const [selectedPIQuotation, setSelectedPIQuotation] = useState(null);
  const [piPercentage, setPiPercentage] = useState("");
  const [piRupees, setPiRupees] = useState("");
  const [isCreatingPI, setIsCreatingPI] = useState(false);

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

  useAuth();

  // ========================
  // FETCH
  // ========================
  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/quotation/read`);
      const data = (res.data?.result || []).map((item) => {
        const finalStatus = item.quotation_status || "Pending";
        return {
          ...item,
          displayStatus: finalStatus,
          wasApprovedOnce:
            item.has_approved ||
            item.quotation_status === "Won" ||
            item.quotation_status === "Lost",
          // ✅ PI already exists check — proforma_percentage > 0 means PI was created
          pi_exists:
            item.proforma_percentage && Number(item.proforma_percentage) > 0,
        };
      });

      setQuotations(data);
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
        "Lead Title": q.lead_title || "",
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
        22,
      );
      const tableData = filteredQuotations.map((q, index) => [
        index + 1,
        q.company_name || "",
        q.customer_name || "",
        q.lead_title || "",
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
            "Lead Title",
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
    lead_title: "",
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
      setQuotations(data);
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
      lead_title: "",
      assignee: "",
      quotation_status: "",
      from_date: "",
      to_date: "",
    });
    fetchQuotations();
  };

  const handleTableStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/quotation/update-status/${id}`, {
        quotation_status: newStatus,
      });
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
        }),
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
      quotation_status: "Pending",
      assignee: lead.assignee || "",
      discount: "",
      tax: "",
      amount: "",
      grand_total: "",
      description: "",
    });
    try {
      const res = await axios.get(
        `${API_BASE}/api/quotation/history/${lead.lead_id}`,
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

  const handleEditClick = (item) => {
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

  const handleApproveDecline = async (histId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/quotation/update-status/${histId}`, {
        quotation_status: newStatus,
      });
      toast.success(`Quotation marked as ${newStatus}`);
      if (selectedLead) {
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
        fetchQuotations();
      }
    } catch (err) {
      toast.error("Status update failed");
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
  // PI MODAL — % ↔ ₹ SYNC
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

  // ========================
  // CONVERT TO PI
  // ========================
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

  // Multer Constants
  const MAX_FILES = 5;
  const IMAGE_EXT = ["jpg", "jpeg", "png"];
  const DOC_EXT = ["pdf"];
  const MAX_IMG_SIZE = 2 * 1024 * 1024;
  const MAX_DOC_SIZE = 2 * 1024 * 1024;

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
      if (![...IMAGE_EXT, ...DOC_EXT].includes(ext)) {
        toast.error("Only JPG, PNG, PDF allowed");
        continue;
      }
      if (IMAGE_EXT.includes(ext) && file.size > MAX_IMG_SIZE) {
        toast.error("Image must be under 2MB");
        continue;
      }
      if (DOC_EXT.includes(ext) && file.size > MAX_DOC_SIZE) {
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

  const handleQuotationSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (!form.activity_type || !form.quotation_no) {
        toast.error("Activity Type and Quotation No are required!");
        setIsSubmitting(false);
        return;
      }
      if (editingId) {
        await axios.put(`${API_BASE}/api/quotation/update/${editingId}`, form, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Quotation updated");
      } else {
        const formData = new FormData();
        formData.append("lead_id", selectedLead.lead_id);
        formData.append("company_name", selectedLead.company_name);
        formData.append("customer_name", selectedLead.customer_name);
        formData.append("lead_title", selectedLead.lead_title);
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
      setForm({
        quotation_no: "",
        quotation_date: new Date().toISOString().split("T")[0],
        activity_type: "",
        quotation_status: "Pending",
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
      toast.error("Failed to add quotation activity");
      console.log(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================
  // TAB + FILTER LOGIC
  // ========================
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const filteredQuotations = hasActiveFilters
    ? quotations
    : quotations.filter((q) => {
        if (activeTab === "Pending")
          return q.displayStatus !== "Won" && q.displayStatus !== "Lost";
        return q.displayStatus === activeTab;
      });

  const pendingCount = quotations.filter(
    (q) => q.displayStatus !== "Won" && q.displayStatus !== "Lost",
  ).length;
  const wonCount = quotations.filter((q) => q.displayStatus === "Won").length;
  const lostCount = quotations.filter((q) => q.displayStatus === "Lost").length;

  // Standardized Micara IMS Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedQuotations = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem);
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

  const isAdmin = checkRole(["Admin"]);

  // ========================
  // PI MODAL derived values
  // ========================
  const piGrandTotal = selectedPIQuotation
    ? Number(selectedPIQuotation.grand_total) || 0
    : 0;
  const piEnteredPct = Number(piPercentage) || 0;
  const piEnteredAmt = Number(piRupees) || 0;
  const piRemainingPct = 100 - piEnteredPct;
  const piRemainingAmt = piGrandTotal - piEnteredAmt;
  const piIsOver = piEnteredPct > 100;

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

        {/* Filter Section */}
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
          md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-2.5 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}>
          <input
            name="company_name"
            value={filters.company_name}
            onChange={handleFilterChange}
            placeholder="Company"
            className="p-2 w-full md:w-48 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-600 text-sm"
          />
          <input
            name="customer_name"
            value={filters.customer_name}
            onChange={handleFilterChange}
            placeholder="Customer"
            className="p-2 w-full md:w-48 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-600 text-sm"
          />
          <input
            name="lead_title"
            value={filters.lead_title}
            onChange={handleFilterChange}
            placeholder="Lead Title"
            className="p-2 w-full md:w-48 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-600 text-sm"
          />
          <select
            name="assignee"
            value={filters.assignee}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-36 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-400 text-sm"
          >
            <option value="">Assignee</option>
            {asignee.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            name="quotation_status"
            value={filters.quotation_status}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-400 text-sm"
          >
            <option value="">Status</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <div className="p-1 w-full md:w-58 border border-orange-300 md:border  text-gray-400 bg-white rounded-sm  transition-all outline-none">
            <span className="text-[10px] text-gray-400 uppercase font-bold mx-2 pt-1">From Date</span>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none text-sm"
            />
          </div>

          <div className="p-1 w-full md:w-58 border border-orange-300 md:border  text-gray-400 bg-white rounded-sm  transition-all outline-none">
            <span className="text-[10px] text-gray-400 uppercase font-bold pt-1 mx-2">To Date</span>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none text-sm"
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
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
              // <div className="overflow-x-auto">
              //   <table className="w-full text-sm">
              <div
                className="overflow-x-auto overflow-y-scroll max-h-[500px] custom-scroll"
                style={{ overflowX: "scroll" }}
              >
                <table className="w-full text-sm whitespace-nowrap">
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
                        Lead Title
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Create Quotation
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Quotation No
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Grand Total
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Assignee
                      </th>
                      {/* ✅ NEW: Proforma % Column */}
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Proforma %
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
                    {filteredQuotations.length > 0 ? (
                      paginatedQuotations.map((q, index) => (
                        <tr
                          key={q.lead_id}
                          className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="py-3 px-3">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="font-medium px-3">
                            {q.company_name || "-"}
                          </td>
                          <td className="text-orange-500 px-3">
                            {q.customer_name || "-"}
                          </td>
                          <td className="px-3">{q.lead_title || "-"}</td>

                          <td className="text-lg px-3 text-center">
                            {q.displayStatus === "Won" ||
                            q.displayStatus === "Lost" ? (
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
                          <td className="px-3 text-gray-600">
                            {q.quotation_no || "-"}
                          </td>
                          <td className="px-3 text-gray-500">
                            {q.first_quotation_date
                              ? new Date(
                                  q.first_quotation_date,
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-3 text-gray-500">
                            {q.quotation_date
                              ? new Date(q.quotation_date).toLocaleDateString()
                              : q.quotation_created_at
                                ? new Date(
                                    q.quotation_created_at,
                                  ).toLocaleDateString()
                                : "-"}
                          </td>
                          <td className="px-3 font-semibold text-gray-700">
                            {q.grand_total
                              ? `₹ ${Number(q.grand_total).toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-3">
                            {q.assignee ? (
                              <div className="flex gap-1 items-center">
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
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-3 text-center">
                            {q.proforma_percentage &&
                            Number(q.proforma_percentage) > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                <i className="bi bi-check-circle-fill text-emerald-500 text-[10px]"></i>
                                {Number(q.proforma_percentage).toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </td>

                          <td className="px-3">
                            <select
                              value={q.displayStatus || "Pending"}
                              onMouseDown={(e) => {
                                const isPendingLocked =
                                  q.displayStatus === "Pending" &&
                                  (!q.has_approved || q.wasApprovedOnce);
                                const isFinalStage =
                                  q.displayStatus === "Won" ||
                                  q.displayStatus === "Lost";
                                if (isPendingLocked) {
                                  e.preventDefault();

                                  toast.error(
                                    "Quotation must be Approved first",
                                  );

                                  return;
                                }

                                // non-admin cannot edit Won/Lost
                                if (!isAdmin && isFinalStage) {
                                  e.preventDefault();
                                  toast.error("Only Admin can change status");
                                }
                              }}
                              onChange={(e) => {
                                const newStatus = e.target.value;

                                // show popup only for Won/Lost
                                if (
                                  newStatus === "Won" ||
                                  newStatus === "Lost"
                                ) {
                                  setStatusChangeData({
                                    id: q.latest_quotation_id,
                                    status: newStatus,
                                  });
                                  setShowStatusModal(true);
                                } else {
                                  handleTableStatusChange(
                                    q.latest_quotation_id,
                                    newStatus,
                                  );
                                }
                              }}
                              className={`border rounded-sm px-3 py-1 text-xs font-semibold outline-none
                                ${q.displayStatus === "Pending" && !q.has_approved ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
                                ${q.displayStatus === "Pending" && q.has_approved ? "border-gray-200 bg-gray-50 text-gray-700 cursor-pointer" : ""}
                                ${q.displayStatus === "Won" ? "border-green-300 bg-green-50 text-green-700" : ""}
                                ${q.displayStatus === "Lost" ? "border-red-300 bg-red-50 text-red-700" : ""}
                              `}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Won">Won</option>
                              <option value="Lost">Lost</option>
                            </select>
                          </td>

                          <td className="px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {q.displayStatus === "Won" &&
                                q.latest_quotation_id &&
                                (() => {
                                  const percentage = Number(
                                    q.proforma_percentage || 0,
                                  );
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
                                q.displayStatus === "Won" ||
                                q.displayStatus === "Lost" ? (
                                  <div
                                    className="text-gray-300 w-8 h-8 rounded-full flex items-center justify-center"
                                    title="Locked"
                                  >
                                    <i className="bi bi-lock-fill"></i>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      openDeleteModal(q.latest_quotation_id)
                                    }
                                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <i className="bi bi-trash3 text-lg"></i>
                                  </button>
                                )
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="13"
                          className="text-center py-10 text-gray-400"
                        >
                          No Quotations Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
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
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                              currentPage === page
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

      {/* ──────────────────── QUOTATION UPDATE MODAL ──────────────────── */}
      {showQuotationModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[90vw] max-w-[900px] h-[85vh] rounded-sm shadow-xl overflow-hidden border border-gray-100 flex flex-col">
            <div
              className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shadow-sm z-10"
              style={{
                background: "linear-gradient(to right, #f5e0c6, #ffffff)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center ">
                  <i className="bi bi-activity text-lg text-orange-500"></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    {selectedLead?.company_name}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Quotation Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuotationModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full  text-orange-500 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
              {/* Left Side: Form */}
              <div className="w-5/12 bg-white border-r border-gray-100 flex flex-col relative z-10 overflow-y-auto">
                <div className="p-6 flex flex-col gap-4">
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
                        className="w-full mt-1 border border-orange-300 rounded-sm px-3 py-2 text-sm outline-none bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Assignee
                      </label>
                      <Select
                        isMulti
                        instanceId="assignee-select"
                        options={asignee}
                        placeholder="-- Select --"
                        value={asignee.filter((option) =>
                          form.assignee?.split(",").includes(option.value),
                        )}
                        onChange={(selectedOptions) => {
                          const values = selectedOptions
                            ? selectedOptions
                                .map((option) => option.value)
                                .join(",")
                            : "";
                          setForm((prev) => ({ ...prev, assignee: values }));
                        }}
                        unstyled
                        classNames={{
                          control: ({ isFocused }) =>
                            `w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none ${isFocused ? "border-orange-300 ring-1 ring-orange-300" : "border-gray-200"}`,
                          valueContainer: () => "p-0 gap-1",
                          placeholder: () => "text-black",
                          input: () => "text-sm text-gray-700",
                          menu: () =>
                            "mt-1 border border-gray-200 rounded-lg bg-white shadow-md overflow-hidden",
                          // REPLACE WITH:
                          option: ({ isFocused, isSelected }) =>
                            `px-3 py-2 text-sm cursor-pointer ${isSelected ? "bg-gray-600 text-white" : isFocused ? "bg-gray-100" : "text-gray-700"}`,
                          multiValue: () =>
                            "bg-gray-600 text-white rounded-md px-1",
                          multiValueLabel: () => "text-white text-xs",
                          multiValueRemove: () =>
                            "text-white hover:bg-gray-700 rounded",
                          indicatorsContainer: () => "text-gray-400",
                          dropdownIndicator: () => "text-black",
                          clearIndicator: () => "text-gray-400",
                        }}
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
                                  <i className="bi bi-file-earmark-text text-blue-500 text-sm"></i>
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
                  <button
                    onClick={handleQuotationSubmit}
                    disabled={isSubmitting}
                    className={`flex-1 text-white rounded-xl py-3 text-sm font-semibold transition-all flex justify-center items-center gap-2
  ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
`}
                    style={{ background: "#f07400" }}
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
                          quotation_status: "Pending",
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
                </div>
              </div>

              {/* Right Side: History */}
              <div className="w-7/12 bg-slate-50 flex flex-col relative z-0">
                <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                    <i
                      className="bi bi-clock-history"
                      style={{ color: "#f07400" }}
                    ></i>{" "}
                    Quotation History Data
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                          className={`bg-white border rounded-xl p-4 shadow-sm transition-colors ${item.quotation_status === "Approved" ? "border-green-400 bg-green-50/20" : "border-gray-200 hover:border-blue-200"}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm ${item.quotation_status === "Approved" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-600"}`}
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
                                !followUpHistory.find(
                                  (h) => h.quotation_status === "Approved",
                                ) && (
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
                                className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md ${item.quotation_status === "Approved" ? "bg-green-100 text-green-700" : item.quotation_status === "Declined" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                              >
                                {item.quotation_status || "Pending"}
                              </span>
                              {item.quotation_status !== "Approved" &&
                                item.quotation_status !== "Declined" && (
                                  <button
                                    onClick={() => handleEditClick(item)}
                                    className="ml-1 text-gray-400 hover:text-blue-600 transition-colors p-1"
                                    title="Edit Quotation Activity"
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                )}
                              {/* DELETE IN HISTORY - COMMENTED OUT (will be enabled later) */}
                              {/* <button
  onClick={() => handleDeleteQuotation(item.id)}
  className="text-gray-400 hover:text-red-600 transition-colors p-1"
  title="Delete Quotation Activity"
>
  <i className="bi bi-trash"></i>
</button> */}
                            </div>
                          </div>
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
                          <div className="mt-2 grid grid-cols-4 gap-4 bg-white p-2.5 rounded-lg border border-gray-100 text-sm">
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
                                Discount
                              </span>
                              <span className="font-semibold text-gray-800">
                                ₹
                                {item.amount && item.discount
                                  ? (
                                      (item.amount * item.discount) /
                                      100
                                    ).toFixed(2)
                                  : "0"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400 text-[10px] uppercase block">
                                Tax
                              </span>
                              <span className="font-semibold text-gray-800">
                                {item.tax || "0"}%
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
                          </div>
                          {item.files?.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5 flex flex-col">
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

      {/* ──────────────────── FILE MANAGER MODAL ──────────────────── */}
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
                className="w-8 h-8 rounded-full  transition-colors flex items-center justify-center text-orange-500 "
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="p-6">
              <div
                className="w-full border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center p-8  transition-colors cursor-pointer"
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
                  JPG, PNG, PDF (Max 2MB per file, Max 5 files)
                </p>
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
            <div className="px-6 py-3 bg-white  flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowFileModal(false)}
                className="px-5 py-2 rounded-sm text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600  transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Model */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[400px] rounded-sm shadow-xl overflow-hidden border border-gray-100">
            {/* header */}
            <div className="flex justify-between items-center px-5 py-3 bg-gradient-to-r from-orange-100 to-white border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 tracking-wide flex items-center gap-2">
                <i className="bi bi-trash  text-orange-500 text-sm"></i>
                DELETE QUOTATION
              </h3>

              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full  text-orange-500"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center py-8 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                <i className="bi bi-trash text-orange-500 text-3xl"></i>
              </div>

              <h2 className="text-lg font-semibold text-gray-800">
                {deleteName}
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                This action cannot be undone. Are you sure?
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-3 ">
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
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="3"
                        fill="none"
                        opacity="0.3"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="white"
                        strokeWidth="3"
                      />
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
            {/* Header - styled like Delete Quotation */}
            <div className="flex items-center justify-between px-4 py-3 from-orange-100 to-white bg-gradient-to-r">
              <div className="flex items-center gap-2">
                {/* Status change icon */}
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

            {/* Body */}
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
                  className="px-6 py-2 rounded-sm text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white "
                >
                  Yes Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────── CONVERT TO PI MODAL ──────────────────── */}
      {showPIModal && selectedPIQuotation && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/30 ">
          <div className="bg-white w-[480px] rounded-sm shadow-xl overflow-hidden ">
            {/* Header */}
            <div
              className="flex justify-between items-center px-6 py-4  from-orange-100 to-white bg-gradient-to-r"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                >
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
                className="w-8 h-8 flex items-center justify-center rounded-full  text-orange-500 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Quotation Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quotation No</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPIQuotation.quotation_no || "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Lead Title</span>
                  <span className="font-semibold text-gray-700">
                    {selectedPIQuotation.lead_title || "-"}
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

              {/* % AND ₹ INPUTS SIDE BY SIDE */}
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
                      className="w-full border border-orange-300 rounded-sm pl-3 pr-8 py-2.5 text-sm   outline-none bg-gray-50 transition-all"
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
                      className="w-full border border-orange-300 rounded-sm pl-7 pr-3 py-2.5 text-sm   outline-none bg-gray-50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* REMAINING CARD */}
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
                        className={`text-xl font-bold ${
                          piIsOver
                            ? "text-red-600"
                            : piEnteredPct === 100
                              ? "text-green-600"
                              : "text-green-700"
                        }`}
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
                        className={`text-xl font-bold ${
                          piIsOver
                            ? "text-red-600"
                            : piEnteredPct === 100
                              ? "text-green-600"
                              : "text-green-700"
                        }`}
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

                  {/* Progress bar */}
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

            {/* Footer */}
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
    </>
  );
}
