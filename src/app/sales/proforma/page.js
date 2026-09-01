"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import useAuth from "@/app/components/useAuth";
import { parseExcelDate, parseExcelNumber, applyColumnFormats } from "@/utils/excelUtils";
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
export default function ProformaPage() {
  const [piData, setPiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPI, setSelectedPI] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [editing, setEditing] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [quotationFiles, setQuotationFiles] = useState([]);
  const [selectedQuotationNo, setSelectedQuotationNo] = useState("");
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationLoading, setQuotationLoading] = useState(false);

  const handleQuotationView = async (quotationId, quotationNo = "") => {
    if (!quotationId) return;
    try {
      setQuotationLoading(true);
      setSelectedQuotationNo(quotationNo);
      const res = await axios.get(
        `${API}/api/pi/quotation-files/${quotationId}`,
      );
      if (res.data.success && res.data.files && res.data.files.length > 0) {
        setQuotationFiles(res.data.files);
        if (res.data.quotation?.quotation_no) {
          setSelectedQuotationNo(res.data.quotation.quotation_no);
        }
        setShowQuotationModal(true);
      } else {
        toast.info(res.data.message || "No quotation documents found");
      }
    } catch (err) {
      toast.error("Unable to fetch quotation documents");
    } finally {
      setQuotationLoading(false);
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitForm, setSplitForm] = useState({
    amount_9: 0,
    amount_18: 0,
    tax_percent_9: "9.00",
    tax_percent_18: "18.00",
    tax_9: "0.00",
    tax_18: "0.00",
    grand_total: "0.00",
    amount: 0,
  });
  const exportRef = useRef(null);
  const debounceRef = useRef(null);

  const [amtInput, setAmtInput] = useState("");
  const [amtInput18, setAmtInput18] = useState("");
  const [amtInput9, setAmtInput9] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer_name: "",
    assignee: "",
    status: "",
    quotation_no: "",
    from_date: "",
    to_date: "",
    min_percentage: "",
    max_percentage: "",
    min_total: "",
    max_total: "",
  });


  // slide-in slide-out animation 
  const closeProformaDrawer = () => {
  const panel = document.getElementById("proformaDrawerPanel");
  const overlay = document.getElementById("proformaDrawerOverlay");
  if (panel)
    panel.style.animation = "prfSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards";
  if (overlay) overlay.style.animation = "prfFadeOut 0.3s ease-in forwards";
  setTimeout(() => resetModal(), 280);
};

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== "" && v !== null && v !== undefined,
  );
  const [assigneeList, setAssigneeList] = useState([]);

  useAuth(["Admin", "Super Admin", "Proforma invoices"]);

  const API = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchPI = async () => {
    try {
      const res = await axios.get(`${API}/api/pi/list`);
      setPiData(res.data.data || []);
      setCurrentPage(1);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleViewSplit = async (quotationId) => {
    if (!quotationId) return;
    try {
      const res = await axios.get(`${API}/api/quotation/split/${quotationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success && res.data.split) {
        const split = res.data.split;
        setSplitForm({
          amount_9: split.amount_9 || 0,
          amount_18: split.amount_18 || 0,
          tax_percent_9: split.tax_percent_9?.toString() ?? "9.00",
          tax_percent_18: split.tax_percent_18?.toString() ?? "18.00",
          tax_9: (split.tax_9 || 0).toString(),
          tax_18: (split.tax_18 || 0).toString(),
          grand_total: (split.grand_total || 0).toString(),
          amount: (
            parseFloat(split.amount_9 || 0) + parseFloat(split.amount_18 || 0)
          ).toFixed(2),
        });
        setShowSplitModal(true);
      } else {
        toast.info("No participation details recorded for this quotation.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch participation details");
    }
  };

  const searchPI = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== ""),
      );
      const res = await axios.get(`${API}/api/pi/filter`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPiData(res.data?.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const hasFilter = Object.values(filters).some((v) => v !== "");
    if (!hasFilter) {
      fetchPI();
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPI(), 200);
    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      customer_name: "",
      assignee: "",
      status: "",
      quotation_no: "",
      from_date: "",
      to_date: "",
      min_percentage: "",
      max_percentage: "",
      min_total: "",
      max_total: "",
    });
    fetchPI();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        const res = await axios.get(`${API}/api/manage-user/asignee`, {
          params: { status: 1 },
        });
        const cleaned = (res.data?.data || res.data || []).map((item) => ({
          ...item,
          name: item.name ? item.name.split(" ")[0] : "",
        }));
        setAssigneeList(cleaned);
      } catch (err) {
        setAssigneeList([]);
      }
    };
    fetchAssignee();
  }, []);

  useEffect(() => {
    fetchPI();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target))
        setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateStage = async (pi_id, stage) => {
    try {
      await axios.put(`${API}/api/pi/update-stage/${pi_id}`, { stage });
      setPiData((prev) =>
        prev.map((item) => (item.pi_id === pi_id ? { ...item, stage } : item)),
      );
      toast.success(
        stage === "completed" ? "Moved to Completed!" : "Moved to Pending!",
      );
      fetchPI();
    } catch (err) {
      toast.error("Stage update failed");
    }
  };

  const formatPINumber = (index) => {
    const date = new Date();
    let year = date.getFullYear();
    let nextYear = year + 1;
    if (date.getMonth() < 3) {
      year = year - 1;
      nextYear = year + 1;
    }
    const shortYear = String(year).slice(2);
    const shortNextYear = String(nextYear).slice(2);
    const serial = String(index + 1).padStart(5, "0");
    return `PI/${shortYear}-${shortNextYear}/${serial}`;
  };

  const updateStatus = async (pi_id, newTotalPercentage) => {
    let newStatus =
      newTotalPercentage >= 100
        ? "paid"
        : newTotalPercentage > 0
          ? "partial"
          : "draft";
    try {
      await axios.put(`${API}/api/pi/update-status/${pi_id}`, {
        status: newStatus,
      });
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const getGrandTotal = (pi) => {
    if (!pi) return 0;
    if (pi.quotation_grand_total && Number(pi.quotation_grand_total) > 0) {
      return Number(pi.quotation_grand_total);
    }
    const followUps = pi.follow_ups || [];
    if (followUps.length > 0) {
      const latest = followUps[0];
      const amt = Number(latest.total_18 || 0) + Number(latest.total_9 || 0) || Number(latest.total || 0);
      const pct = Number(latest.proforma_percentage_18 || 0) + Number(latest.proforma_percentage_9 || 0) || Number(latest.proforma_percentage || 0);
      if (pct > 0 && amt > 0) return (amt / pct) * 100;
    }
    if (Number(pi.proforma_percentage || 0) > 0 && Number(pi.total || 0) > 0) {
      return (Number(pi.total) / Number(pi.proforma_percentage)) * 100;
    }
    return Number(pi.total || 0);
  };

  const getPIPaidTotal = (pi, excludeId = null) => {
    if (!pi) return 0;
    const followUps = pi.follow_ups || [];
    let total = 0;
    followUps.forEach((f) => {
      if (excludeId && f.id === excludeId) return;
      total += Number(f.total || 0) || (Number(f.total_18 || 0) + Number(f.total_9 || 0));
    });
    return total;
  };

  const getSplitBase18 = (pi) => {
    if (!pi) return 0;
    const amt = Number(pi.split_amount_18 !== undefined && pi.split_amount_18 !== null && pi.split_amount_18 !== "" ? pi.split_amount_18 : (pi.amount_18 || 0));
    const tax = Number(pi.split_tax_18 !== undefined && pi.split_tax_18 !== null && pi.split_tax_18 !== "" ? pi.split_tax_18 : (pi.tax_18 || 0));
    return amt + tax;
  };

  const getSplitBase9 = (pi) => {
    if (!pi) return 0;
    const amt = Number(pi.split_amount_9 !== undefined && pi.split_amount_9 !== null && pi.split_amount_9 !== "" ? pi.split_amount_9 : (pi.amount_9 || 0));
    const tax = Number(pi.split_tax_9 !== undefined && pi.split_tax_9 !== null && pi.split_tax_9 !== "" ? pi.split_tax_9 : (pi.tax_9 || 0));
    return amt + tax;
  };

  const isTwoSplitPI = (pi) => {
    if (!pi) return false;
    const base18 = getSplitBase18(pi);
    const base9 = getSplitBase9(pi);
    return base18 > 0 && base9 > 0;
  };

  const getPIPaid18 = (pi, excludeId = null) => {
    if (!pi) return 0;
    const followUps = pi.follow_ups || [];
    let total = 0;
    followUps.forEach((f) => {
      if (excludeId && f.id === excludeId) return;
      total += Number(f.total_18 || 0);
    });
    return total;
  };

  const getPIPaid9 = (pi, excludeId = null) => {
    if (!pi) return 0;
    const followUps = pi.follow_ups || [];
    let total = 0;
    followUps.forEach((f) => {
      if (excludeId && f.id === excludeId) return;
      total += Number(f.total_9 || 0);
    });
    return total;
  };

  const resetModal = () => {
    setShowModal(false);
    setEditing(null);
    setAmtInput("");
    setAmtInput18("");
    setAmtInput9("");
    setActiveIndex(null);
  };

  const handleSubmitFollowUp = async () => {
    if (isTwoSplitPI(selectedPI)) {
      const entered18 = Number(amtInput18 || 0);
      const entered9  = Number(amtInput9 || 0);
      const totalEntered = entered18 + entered9;

      if (totalEntered <= 0) {
        toast.error("Please enter a valid amount for at least one split");
        return;
      }

      const base18 = getSplitBase18(selectedPI);
      const base9  = getSplitBase9(selectedPI);
      const used18 = getPIPaid18(selectedPI);
      const used9  = getPIPaid9(selectedPI);

      if (entered18 > 0 && used18 + entered18 > base18 + 0.5) {
        const rem18 = Math.max(0, base18 - used18);
        toast.error(`Part 1 amount exceeds remaining balance. Only Rs. ${rem18.toFixed(2)} remaining`);
        return;
      }

      if (entered9 > 0 && used9 + entered9 > base9 + 0.5) {
        const rem9 = Math.max(0, base9 - used9);
        toast.error(`Part 2 amount exceeds remaining balance. Only Rs. ${rem9.toFixed(2)} remaining`);
        return;
      }

      const grandTotal = getGrandTotal(selectedPI);
      const usedAmt = getPIPaidTotal(selectedPI);

      try {
        setSubmitLoading(true);
        const res = await axios.post(
          `${API}/api/pi/add-followup/${selectedPI.pi_id}`,
          { amount_18: entered18, amount_9: entered9 },
        );
        const confirmedTotal =
          res.data?.total_percentage ?? (grandTotal > 0 ? ((usedAmt + totalEntered) / grandTotal) * 100 : 0);
        await updateStatus(selectedPI.pi_id, confirmedTotal);
        toast.success(
          confirmedTotal >= 100
            ? "Follow-up added & marked as Won!"
            : "Follow-up added successfully",
        );
        resetModal();
        fetchPI();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error");
      } finally {
        setSubmitLoading(false);
      }
    } else {
      const enteredAmt = Number(amtInput || 0);
      if (enteredAmt <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const grandTotal = getGrandTotal(selectedPI);
      const usedAmt = getPIPaidTotal(selectedPI);
      if (grandTotal > 0 && (usedAmt + enteredAmt > grandTotal + 0.5)) {
        const rem = Math.max(0, grandTotal - usedAmt);
        toast.error(`Amount exceeds remaining balance. Only Rs. ${rem.toFixed(2)} remaining`);
        return;
      }

      const enteredPct = grandTotal > 0 ? (enteredAmt / grandTotal) * 100 : 0;
      const usedPct = grandTotal > 0 ? (usedAmt / grandTotal) * 100 : 0;

      try {
        setSubmitLoading(true);
        const res = await axios.post(
          `${API}/api/pi/add-followup/${selectedPI.pi_id}`,
          { amount: enteredAmt, percentage: enteredPct },
        );
        const confirmedTotal =
          res.data?.total_percentage ?? (usedPct + enteredPct);
        await updateStatus(selectedPI.pi_id, confirmedTotal);
        toast.success(
          confirmedTotal >= 100
            ? "Follow-up added & marked as Won!"
            : "Follow-up added successfully",
        );
        resetModal();
        fetchPI();
      } catch (err) {
        toast.error(err.response?.data?.message || "Error");
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (isTwoSplitPI(selectedPI)) {
      const entered18 = Number(amtInput18 || 0);
      const entered9  = Number(amtInput9 || 0);
      const totalEntered = entered18 + entered9;

      if (totalEntered <= 0) {
        toast.error("Please enter a valid amount for at least one split");
        return;
      }

      const base18 = getSplitBase18(selectedPI);
      const base9  = getSplitBase9(selectedPI);
      const usedOther18 = getPIPaid18(selectedPI, editing?.id);
      const usedOther9  = getPIPaid9(selectedPI, editing?.id);

      if (entered18 > 0 && usedOther18 + entered18 > base18 + 0.5) {
        const rem18 = Math.max(0, base18 - usedOther18);
        toast.error(`Part 1 amount exceeds remaining balance. Only Rs. ${rem18.toFixed(2)} remaining`);
        return;
      }

      if (entered9 > 0 && usedOther9 + entered9 > base9 + 0.5) {
        const rem9 = Math.max(0, base9 - usedOther9);
        toast.error(`Part 2 amount exceeds remaining balance. Only Rs. ${rem9.toFixed(2)} remaining`);
        return;
      }

      const grandTotal = getGrandTotal(selectedPI);
      const usedOther = getPIPaidTotal(selectedPI, editing?.id);

      try {
        setUpdateLoading(true);
        await axios.put(
          `${API}/api/pi/update-followup/${selectedPI.pi_id}/${editing.id}`,
          { amount_18: entered18, amount_9: entered9 },
        );
        const newTotalOverall = grandTotal > 0 ? ((usedOther + totalEntered) / grandTotal) * 100 : 0;
        await updateStatus(selectedPI.pi_id, newTotalOverall);
        toast.success(
          newTotalOverall >= 100
            ? "Updated & marked as Won!"
            : "Updated successfully",
        );
        resetModal();
        fetchPI();
      } catch (err) {
        toast.error(err.response?.data?.message || "Update failed");
      } finally {
        setUpdateLoading(false);
      }
    } else {
      const enteredAmt = Number(amtInput || 0);
      if (enteredAmt <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const grandTotal = getGrandTotal(selectedPI);
      const usedOther = getPIPaidTotal(selectedPI, editing?.id);

      if (grandTotal > 0 && (usedOther + enteredAmt > grandTotal + 0.5)) {
        const rem = Math.max(0, grandTotal - usedOther);
        toast.error(`Amount exceeds remaining balance. Only Rs. ${rem.toFixed(2)} remaining`);
        return;
      }

      const enteredPct = grandTotal > 0 ? (enteredAmt / grandTotal) * 100 : 0;

      try {
        setUpdateLoading(true);
        await axios.put(
          `${API}/api/pi/update-followup/${selectedPI.pi_id}/${editing.id}`,
          { amount: enteredAmt, percentage: enteredPct },
        );
        const newTotalOverall = grandTotal > 0 ? ((usedOther + enteredAmt) / grandTotal) * 100 : 0;
        await updateStatus(selectedPI.pi_id, newTotalOverall);
        toast.success(
          newTotalOverall >= 100
            ? "Updated & marked as Won!"
            : "Updated successfully",
        );
        resetModal();
        fetchPI();
      } catch (err) {
        toast.error(err.response?.data?.message || "Update failed");
      } finally {
        setUpdateLoading(false);
      }
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    if (isTwoSplitPI(selectedPI)) {
      setAmtInput18(item.total_18 ? String(item.total_18) : "");
      setAmtInput9(item.total_9 ? String(item.total_9) : "");
      setAmtInput("");
    } else {
      const itemAmt = Number(item.total || 0) || (Number(item.total_18 || 0) + Number(item.total_9 || 0));
      setAmtInput(itemAmt ? String(itemAmt) : "");
      setAmtInput18("");
      setAmtInput9("");
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const exportData = piData.map((item, index) => ({
        "No.": index + 1,
        "PI No": formatPINumber(index),
        "PI Date": parseExcelDate(item.pi_date),
        "Customer Name": item.customer_name || "",
        "Quotation No": item.quotation_no || "",
        Assignee: item.assignee || "",
        Total: parseExcelNumber(item.total, 0),
        "Proforma %": item.proforma_percentage !== null && item.proforma_percentage !== undefined && item.proforma_percentage !== ""
          ? parseExcelNumber(item.proforma_percentage, 0) / 100
          : "",
        Status: item.status || "",
        Stage: item.stage || "pending",
        "Created At": parseExcelDate(item.created_at),
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData, {
        cellDates: true,
        dateNF: "dd-mm-yyyy",
      });
      applyColumnFormats(XLSX, worksheet, exportData, {
        Total: "#,##0.00",
        "Proforma %": "0%",
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Proforma");
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet["!cols"] = colWidths;
      const now = new Date();
      XLSX.writeFile(
        workbook,
        `Proforma_(${now.toISOString().split("T")[0]})_${now.toTimeString().slice(0, 5)}.xlsx`,
      );
      toast.success("Excel exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      toast.error("Excel export failed");
    }
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("Proforma Invoice Report", 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Exported on: ${new Date().toLocaleDateString("en-GB")}   |   Total Records: ${piData.length}`,
        14,
        22,
      );
      const tableData = piData.map((item, index) => [
        index + 1,
        formatPINumber(index),
        item.pi_date ? new Date(item.pi_date).toLocaleDateString() : "",
        item.customer_name || "",
        item.quotation_no || "",
        item.assignee || "",
        item.total ? `Rs.${Number(item.total).toLocaleString()}` : "",
        item.proforma_percentage ? `${item.proforma_percentage}%` : "",
        item.status || "",
        item.stage || "pending",
        item.created_at ? new Date(item.created_at).toLocaleDateString() : "",
      ]);
      autoTable(doc, {
        startY: 27,
        head: [
          [
            "#",
            "PI No",
            "PI Date",
            "Customer",
            "Quotation",
            "Assignee",
            "Total",
            "PI %",
            "Status",
            "Stage",
            "Created",
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
        columnStyles: { 0: { cellWidth: 8 } },
      });
      const now = new Date();
      doc.save(
        `Proforma_(${now.toISOString().split("T")[0]})_${now.toTimeString().slice(0, 5).replace(":", "-")}.pdf`,
      );
      toast.success("PDF exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      toast.error("PDF export failed");
    }
  };

  const downloadInvoicePDF = async (item, index) => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const followUps = item.follow_ups || [];
      const sortedFollowUps = [...followUps].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      const grandTotal = getGrandTotal(item);
      const totalPaid = getPIPaidTotal(item);
      const totalPaidPct = grandTotal > 0 ? (totalPaid / grandTotal) * 100 : Number(item.proforma_percentage || 0);

      const piNumber = item.pi_number || formatPINumber(index ?? 0);
      const piDate = item.pi_date ? new Date(item.pi_date) : new Date();
      const statusLabel =
        item.status === "paid"
          ? "WON / PAID"
          : item.status === "partial"
            ? "PENDING"
            : item.status === "sent"
              ? "SENT"
              : item.status === "cancelled"
                ? "CANCELLED"
                : "DRAFT";

      const doc = new jsPDF({ orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(20);
      doc.setTextColor(234, 88, 12);
      doc.setFont(undefined, "bold");
      doc.text("VENSTER", 14, 18);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont(undefined, "normal");
      doc.text("ALUMINIUM", 14, 23);

      doc.setFontSize(18);
      doc.setTextColor(234, 88, 12);
      doc.setFont(undefined, "bold");
      doc.text("PROFORMA INVOICE", pageWidth - 14, 18, { align: "right" });
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.setFont(undefined, "normal");
      doc.text(
        `Date: ${piDate.toLocaleDateString("en-GB")}`,
        pageWidth - 14,
        24,
        { align: "right" },
      );

      doc.setDrawColor(40, 40, 40);
      doc.setLineWidth(0.6);
      doc.line(14, 28, pageWidth - 14, 28);

      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, "bold");
      doc.text(`PI No: ${piNumber}`, 14, 37);

      doc.setFillColor(
        statusLabel === "WON / PAID"
          ? 22
          : statusLabel === "PENDING"
            ? 234
            : 100,
        statusLabel === "WON / PAID"
          ? 163
          : statusLabel === "PENDING"
            ? 88
            : 100,
        statusLabel === "WON / PAID"
          ? 74
          : statusLabel === "PENDING"
            ? 12
            : 100,
      );
      const badgeWidth = doc.getTextWidth(statusLabel) + 10;
      doc.roundedRect(
        pageWidth - 14 - badgeWidth,
        32,
        badgeWidth,
        7,
        1.5,
        1.5,
        "F",
      );
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text(statusLabel, pageWidth - 14 - badgeWidth / 2, 36.5, {
        align: "center",
      });

      const boxTop = 42;
      const boxHeight = 32;
      const colGap = 4;
      const colWidth = (pageWidth - 28 - colGap) / 2;

      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(14, boxTop, colWidth, boxHeight, 2, 2, "FD");
      doc.roundedRect(
        14 + colWidth + colGap,
        boxTop,
        colWidth,
        boxHeight,
        2,
        2,
        "FD",
      );

      doc.setFontSize(8);
      doc.setTextColor(234, 88, 12);
      doc.setFont(undefined, "bold");
      doc.text("BILL TO / COMPANY INFO", 18, boxTop + 6);
      doc.text("ORDER DETAILS", 18 + colWidth + colGap, boxTop + 6);

      doc.setFontSize(8.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(60, 60, 60);

      const leftRows = [
        ["Customer:", item.customer_name || "-"],
        ["Assignee:", item.assignee || "-"],
        ["Quotation No:", item.quotation_no || "-"],
        [
          "Created:",
          item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-GB")
            : "-",
        ],
      ];
      const isSplit = isTwoSplitPI(item);
      const base18 = getSplitBase18(item);
      const base9  = getSplitBase9(item);
      const paid18 = getPIPaid18(item);
      const paid9  = getPIPaid9(item);
      const rem18  = Math.max(0, base18 - paid18);
      const rem9   = Math.max(0, base9 - paid9);

      const rightRows = isSplit
        ? [
            ["PI Number:", piNumber],
            ["PI Date:", piDate.toLocaleDateString("en-GB")],
            ["Part 1 (18%):", `Rs. ${base18.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Part 2 (9%):", `Rs. ${base9.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
          ]
        : [
            ["PI Number:", piNumber],
            ["PI Date:", piDate.toLocaleDateString("en-GB")],
            ["Grand Total:", `Rs. ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Total Paid %:", `${totalPaidPct.toFixed(2)}%`],
          ];

      leftRows.forEach(([label, value], i) => {
        const y = boxTop + 12 + i * 5.5;
        doc.setFont(undefined, "normal");
        doc.setTextColor(130, 130, 130);
        doc.text(label, 18, y);
        doc.setFont(undefined, "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(String(value), 45, y);
      });

      rightRows.forEach(([label, value], i) => {
        const y = boxTop + 12 + i * 5.5;
        const x = 18 + colWidth + colGap;
        doc.setFont(undefined, "normal");
        doc.setTextColor(130, 130, 130);
        doc.text(label, x, y);
        doc.setFont(undefined, "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(String(value), x + 28, y);
      });

      let cursorY = boxTop + boxHeight + 10;

      doc.setFontSize(10);
      doc.setTextColor(234, 88, 12);
      doc.setFont(undefined, "bold");
      doc.text("PAYMENT HISTORY", 14, cursorY);
      cursorY += 2;

      let tableHead = [["#", "Date", "Description", "Paid %", "Amount", "Status"]];
      let historyRows = [];

      if (isSplit) {
        tableHead = [["#", "Date", "Description", "Part 1 Paid (18%)", "Part 2 Paid (9%)", "Total Paid", "Status"]];
        historyRows = sortedFollowUps.map((h, i) => {
          const amt18 = Number(h.total_18 || 0);
          const amt9  = Number(h.total_9 || 0);
          const totalAmt = amt18 + amt9 || Number(h.total || 0);
          return [
            i + 1,
            h.created_at ? new Date(h.created_at).toLocaleDateString("en-GB") : "-",
            i === 0 ? "Latest Follow-Up" : `Follow-Up #${sortedFollowUps.length - i}`,
            `Rs. ${amt18.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `Rs. ${amt9.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `Rs. ${totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            i === 0 ? "Latest" : "Received",
          ];
        });
      } else {
        historyRows = sortedFollowUps.map((h, i) => {
          const amt = Number(h.total || 0) || (Number(h.total_18 || 0) + Number(h.total_9 || 0));
          const pct = grandTotal > 0 ? (amt / grandTotal) * 100 : (Number(h.proforma_percentage || 0) || (Number(h.proforma_percentage_18 || 0) + Number(h.proforma_percentage_9 || 0)));
          return [
            i + 1,
            h.created_at ? new Date(h.created_at).toLocaleDateString("en-GB") : "-",
            i === 0 ? "Latest Follow-Up" : `Follow-Up #${sortedFollowUps.length - i}`,
            `${pct.toFixed(2)}%`,
            `Rs. ${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            i === 0 ? "Latest" : "Received",
          ];
        });
      }

      autoTable(doc, {
        startY: cursorY + 2,
        head: tableHead,
        body:
          historyRows.length > 0
            ? historyRows
            : [isSplit ? ["-", "-", "No follow-up recorded", "-", "-", "-", "-"] : ["-", "-", "No follow-up recorded", "-", "-", "-"]],
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [40, 40, 40] },
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
        },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        columnStyles: isSplit
          ? { 0: { cellWidth: 8 }, 3: { cellWidth: 32 }, 4: { cellWidth: 32 }, 5: { cellWidth: 32 }, 6: { cellWidth: 20 } }
          : { 0: { cellWidth: 10 }, 3: { cellWidth: 22 }, 5: { cellWidth: 24 } },
        margin: { left: 14, right: 14 },
      });

      cursorY = doc.lastAutoTable.finalY + 12;
      if (cursorY > 250) {
        doc.addPage();
        cursorY = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, "bold");
      doc.text("Thank you for your business!", 14, cursorY);
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.setFont(undefined, "normal");
      doc.text("This is a system-generated document.", 14, cursorY + 6);
      doc.text("No signature is required.", 14, cursorY + 11);

      const summaryX = pageWidth - 14 - 85;
      const summaryRows = isSplit
        ? [
            ["Part 1 Total (18%)", `Rs. ${base18.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Part 1 Paid", `Rs. ${paid18.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Part 2 Total (9%)", `Rs. ${base9.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Part 2 Paid", `Rs. ${paid9.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Grand Total", `Rs. ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Total Paid", `Rs. ${totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
          ]
        : [
            ["Grand Total", `Rs. ${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Total Paid", `Rs. ${totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
            ["Follow-ups", `${followUps.length} record(s)`],
          ];
      summaryRows.forEach(([label, value], i) => {
        const y = cursorY - 4 + i * 6.5;
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.setFont(undefined, "normal");
        doc.text(label, summaryX, y);
        doc.setFont(undefined, "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(String(value), summaryX + 85, y, { align: "right" });
      });

      const finalBoxY = cursorY - 4 + summaryRows.length * 6.5 + 3;
      const finalBoxColor =
        statusLabel === "WON / PAID" ? [22, 163, 74] : [234, 88, 12];
      doc.setFillColor(...finalBoxColor);
      doc.roundedRect(summaryX, finalBoxY, 85, 8, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont(undefined, "bold");
      doc.text("Final Status", summaryX + 3, finalBoxY + 5.5);
      doc.text(statusLabel, summaryX + 82, finalBoxY + 5.5, { align: "right" });

      const safeName = (item.customer_name || "Customer").replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      doc.save(`${piNumber.replace(/\//g, "_")}_${safeName}.pdf`);
      toast.success("Invoice downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Invoice download failed");
    }
  };

  // ── PAGINATION ──
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage, activeTab]);

  const tabFilteredData = piData.filter((item) => {
    const stage = String(item.stage || "pending")
      .trim()
      .toLowerCase();
    if (activeTab === "pending") return stage !== "completed";
    if (activeTab === "completed") return stage === "completed";
    return true;
  });

  const pendingCount = piData.filter(
    (d) =>
      String(d.stage || "pending")
        .trim()
        .toLowerCase() !== "completed",
  ).length;
  const completedCount = piData.filter(
    (d) =>
      String(d.stage || "")
        .trim()
        .toLowerCase() === "completed",
  ).length;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = tabFilteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(tabFilteredData.length / itemsPerPage);

  const getSlidingPages = () => {
    const visibleCount = 5;
    if (totalPages <= visibleCount)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
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

  return (
    <>
      <Header />

      <div className="bg-gray-100 min-h-screen">
        {/* BREADCRUMB + EXPORT */}
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
                href="/sales/proforma"
                className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
              >
                Proforma
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-auto" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-500 px-4 py-2 rounded-sm text-sm font-bold tracking-wide transition-all shadow-sm border border-orange-100"
              >
                <i className="bi bi-download text-base"></i> Export
                <i
                  className={`bi bi-chevron-down text-xs transition-transform ${showExportMenu ? "rotate-180" : ""}`}
                ></i>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-sm shadow-lg border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-excel text-green-600 text-base"></i>{" "}
                    Export Excel
                  </button>
                  <div className="h-px bg-gray-100 mx-3"></div>
                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-pdf text-red-600 text-base"></i>{" "}
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FILTER SECTION */}
      <div className="mx-6 md:hidden mt-3 relative z-40">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm"
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
          className={`${showMobileFilters ? "absolute left-6 right-6 top-[170px] bg-white p-5 shadow-2xl rounded-lg grid grid-cols-2 gap-3 mt-1 z-[999] ring-2 ring-orange-300" : "hidden"} md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:ring-0`}
        >
          <div className="flex items-center gap-2 px-2 w-full md:w-45 bg-white border border-indigo-400 md:border rounded-sm text-sm">
                      <User size={16} className="text-violet-600" />
            <input
              name="customer_name"
              value={filters.customer_name}
              onChange={handleFilterChange}
              placeholder="Customer"
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 px-2 w-full md:w-45 bg-white border border-indigo-400 md:border rounded-sm text-sm">
                    <FileText size={16} className="text-blue-500" />
            <input
              name="quotation_no"
              value={filters.quotation_no}
              onChange={handleFilterChange}
              placeholder="Quotation No"
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <select
            name="assignee"
            value={filters.assignee}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-45 bg-white border border-indigo-400 md:border rounded-sm focus:outline-none text-gray-400 text-sm"
          >
            <option value="">Assignee</option>
            {assigneeList.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-45 bg-white border border-indigo-400 md:border rounded-sm focus:outline-none text-gray-400 text-sm"
          >
            <option value="">Status</option>
            <option value="draft">Draft</option>
            <option value="partial">Pending</option>
            <option value="paid">Won</option>
          </select>

          <div className="flex items-center px-2 w-full md:w-58 bg-white border border-indigo-400 md:border rounded-sm text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 text-gray-400 whitespace-nowrap">From</span>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="p-2 w-full md:w-35 outline-none"
            />
          </div>

          <div className="flex items-center px-2 w-full md:w-53 bg-white border border-indigo-400 md:border rounded-sm text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 text-gray-400 whitespace-nowrap">To</span>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="p-2 w-full md:w-35 outline-none"
            />
          </div>

          <div className="flex items-center gap-1 px-2 w-full md:w-24 bg-white border border-indigo-400 md:border rounded-sm text-sm">
            {/* <i className="bi bi-percent text-gray-400 text-xs"></i> */}
            <input
              type="number"
              name="min_percentage"
              value={filters.min_percentage}
              onChange={handleFilterChange}
              placeholder="Min %"
              min="0"
              max="100"
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <div className="flex items-center gap-1 px-2 w-full md:w-24 bg-white border border-indigo-400 md:border rounded-sm text-sm">
            {/* <i className="bi bi-percent text-gray-400 text-xs"></i> */}
            <input
              type="number"
              name="max_percentage"
              value={filters.max_percentage}
              onChange={handleFilterChange}
              placeholder="Max %"
              min="0"
              max="100"
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <div className="flex items-center gap-1 px-2 w-full md:w-32 bg-white border border-indigo-400 md:border rounded-sm text-sm">
            <i className="bi bi-currency-rupee text-gray-400 text-xs"></i>
            <input
              type="number"
              name="min_total"
              value={filters.min_total}
              onChange={handleFilterChange}
              placeholder="Min Rs."
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <div className="flex items-center gap-1 px-2 w-full md:w-32 bg-white border border-indigo-400 md:border rounded-sm text-sm">
            <i className="bi bi-currency-rupee text-gray-400 text-xs"></i>
            <input
              type="number"
              name="max_total"
              value={filters.max_total}
              onChange={handleFilterChange}
              placeholder="Max Rs."
              className="p-2 w-full focus:outline-none text-gray-600 text-sm bg-transparent"
            />
          </div>

          <div className="flex gap-2 col-span-2 md:col-span-1">
            <button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              className="flex items-center justify-center gap-2 w-full md:w-auto cursor-pointer rounded-sm px-5 py-2 bg-indigo-100 text-indigo-600  text-sm font-semibold text-center transition-colors"
            >
              <i className="bi bi-arrow-counterclockwise"></i> Clear Filter
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm font-semibold text-center px-6"
            >
              Apply
            </button>
          </div>
        </div>

        {/* TABS */}
      <div className="mx-7 mt-2 mb-0 flex items-center gap-0 border-b border-gray-200 bg-white px-2 pt-2 rounded-t-sm">
          <button
            onClick={() => {
              setActiveTab("pending");
              setCurrentPage(1);
            }}
            className={`px-5 py-2.5 text-sm font-semibold transition-all relative rounded-t-md ${activeTab === "pending" ? "text-blue-600 border-b-2 border-blue-500 bg-white" : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <i className="bi bi-clipboard-check"></i>
              Pending
              <span
                className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "pending" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
              >
                {pendingCount}
              </span>
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("completed");
              setCurrentPage(1);
            }}
            className={`px-5 py-2.5 text-sm font-semibold transition-all relative rounded-t-md ${activeTab === "completed" ? "text-green-600 border-b-2 border-green-500 bg-white" : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"}`}
          >
            <span className="inline-flex items-center gap-1.5">
              <i className="bi bi-check2-circle"></i>
              Completed
              <span
                className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "completed" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
              >
                {completedCount}
              </span>
            </span>
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-b-sm rounded-tr-sm border border-gray-100 mx-7 py-2">
          <div className="py-1">
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
                      {[
                        "#",
                        "PI No",
                        "PI Date",
                        "Customer Name",
                        "Quotation No",
                        "Source",
                        "Reference",
                        "Assignee",
                        "Total",
                        "PI %",
                        "Status",
                        "Stage",
                        "Follow-Up",
                        "Quotation",
                        "Download",
                      ].map((h) => (
                        <th
                          key={h}
                          className="py-3 px-3 text-left text-xs font-bold text-slate-700 tracking-wider"
                        >
                          {h}
                          {[
                            "PI No",
                            "PI Date",
                            "Customer Name",
                            "Quotation No",
                            "Source",
                            "Total",
                            "PI %",
                            "Status",
                          ].includes(h) && (
                            <>
                              {" "}
                              <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
                            </>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item, index) => {
                        const globalIndex = indexOfFirstItem + index;
                        const currentStage = item.stage || "pending";
                        return (
                          <tr
                            key={item.pi_id}
                            className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                          >
                            <td className="py-3 px-3">{globalIndex + 1}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {formatPINumber(globalIndex)}
                            </td>
                            <td className="py-3 px-3 text-gray-500">
                              {item.pi_date
                                ? new Date(item.pi_date).toLocaleDateString(
                                    "en-IN",
                                  )
                                : "-"}
                            </td>
                            <td className="py-3 px-3 text-blue-500 font-medium">
                              {item.customer_name || "-"}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              {item.quotation_no || "-"}
                            </td>
                            <td className="py-3 px-3">
                              {item.source ? (
                                <span
                                  className={`inline-block px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                                    item.source === "Walk In"
                                      ? "bg-yellow-50 text-yellow-600"
                                      : item.source === "Website"
                                        ? "bg-fuchsia-50 text-fuchsia-600"
                                        : item.source === "Reference"
                                          ? "bg-purple-50 text-purple-600"
                                          : item.source === "Instagram"
                                            ? "bg-cyan-50 text-cyan-600"
                                            : item.source === "Facebook"
                                              ? "bg-blue-50 text-blue-600"
                                              : "bg-pink-50 text-pink-600"
                                  }`}
                                >
                                  {item.source}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              {item.reference || "-"}
                            </td>
                            <td className="py-3 px-3">
                              {item.assignee ? (
                                <div className="flex gap-1 items-center">
                                  {String(item.assignee)
                                    .split(",")
                                    .map((name, i) => (
                                      <div
                                        key={i}
                                        title={name.trim()}
                                        className="px-3 py-1.5 bg-blue-800 text-white rounded-full font-semibold text-sm flex justify-center items-center min-w-[28px] text-center select-none"
                                      >
                                        {name.trim().charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              Rs.{Number(item.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      Number(item.proforma_percentage) >= 100
                                        ? "bg-green-500"
                                        : Number(item.proforma_percentage) >= 50
                                          ? "bg-orange-400"
                                          : "bg-blue-400"
                                    }`}
                                    style={{
                                      width: `${Math.min(Number(item.proforma_percentage || 0), 100)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="font-semibold text-slate-800 text-xs">
                                  {Number(item.proforma_percentage || 0).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`border rounded-md px-3 py-1 text-xs font-semibold ${item.status === "paid" ? "border-green-200 bg-green-50 text-green-600" : ""} ${item.status === "partial" ? "border-orange-200 bg-orange-50 text-orange-600" : ""} ${item.status === "draft" ? "border-gray-200 bg-gray-50 text-gray-600" : ""} ${item.status === "sent" ? "border-blue-200 bg-blue-50 text-blue-600" : ""} ${item.status === "cancelled" ? "border-red-200 bg-red-50 text-red-600" : ""}`}
                              >
                                {item.status === "paid"
                                  ? "Won"
                                  : item.status === "partial"
                                    ? "Pending"
                                    : item.status === "sent"
                                      ? "Sent"
                                      : item.status === "cancelled"
                                        ? "Cancelled"
                                        : "Draft"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <select
                                value={currentStage}
                                onChange={(e) =>
                                  updateStage(item.pi_id, e.target.value)
                                }
                                className={`text-xs font-semibold px-2 py-1.5 rounded-md border cursor-pointer outline-none transition-all ${currentStage === "completed" ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100" : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedPI(item);
                                  setEditing(null);
                                  setAmtInput("");
                                  setActiveIndex(null);
                                  setShowModal(true);
                                }}
                                className="w-9 h-9 rounded-full border border-blue-300 text-blue-500 flex items-center justify-center mx-auto hover:bg-blue-50 cursor-pointer transition-all"
                              >
                                <i className="bi bi-plus text-lg"></i>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() =>
                                  handleQuotationView(item.quotation_id, item.quotation_no)
                                }
                                title="View Quotation Files"
                                className="group relative w-9 h-9 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center mx-auto hover:bg-blue-500 hover:border-blue-500 transition-all cursor-pointer"
                              >
                                <i className="bi bi-eye text-blue-600 group-hover:text-white text-base transition-all"></i>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                title="Download PI PDF"
                                onClick={() =>
                                  downloadInvoicePDF(item, globalIndex)
                                }
                                className="group relative w-9 h-9 rounded-full border border-green-200 bg-green-50 flex items-center justify-center mx-auto hover:bg-green-500 hover:border-green-500 transition-all cursor-pointer"
                              >
                                <i className="bi bi-file-earmark-pdf text-green-600 group-hover:text-white text-base transition-all"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="15"
                          className="text-center py-10 text-gray-400"
                        >
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
                  {/* Left side: Showing X to Y of Z entries */}
                  <div className="text-sm text-slate-600 font-semibold">
                    Showing {paginatedData.length === 0 ? 0 : indexOfFirstItem + 1}{" "}
                    to {indexOfFirstItem + paginatedData.length} entries
                  </div>

                  {/* Center: Navigation buttons */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-left text-sm"></i>
                      </button>
                      {getSlidingPages().map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
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
                      className="border border-indigo-200 rounded-lg px-3 py-1.5 text-sm text-indigo-600 font-semibold bg-white focus:outline-none cursor-pointer"
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

      {/* ── FOLLOW-UP MODAL ── */}
      {showModal &&
        selectedPI &&
        (() => {
          const grandTotal = getGrandTotal(selectedPI);
          const hasTwoSplits = isTwoSplitPI(selectedPI);

          const base18 = getSplitBase18(selectedPI);
          const base9  = getSplitBase9(selectedPI);

          const used18 = getPIPaid18(selectedPI, editing?.id);
          const used9  = getPIPaid9(selectedPI, editing?.id);

          const rem18 = Math.max(0, base18 - used18);
          const rem9  = Math.max(0, base9 - used9);

          const usedAmt = getPIPaidTotal(selectedPI, editing?.id);
          const usedPct = grandTotal > 0 ? (usedAmt / grandTotal) * 100 : 0;
          const remainingAmt = Math.max(0, grandTotal - usedAmt);
          const remainingPct = Math.max(0, 100 - usedPct);

          let enteredAmt = 0;
          let isOver = false;
          let isDisabled = false;

          let afterAmt18 = 0;
          let afterAmt9 = 0;
          let isOver18 = false;
          let isOver9 = false;

          let enteredAmt18 = 0;
          let enteredAmt9 = 0;

          if (hasTwoSplits) {
            enteredAmt18 = Number(amtInput18 || 0);
            enteredAmt9 = Number(amtInput9 || 0);
            enteredAmt = enteredAmt18 + enteredAmt9;

            afterAmt18 = rem18 - enteredAmt18;
            afterAmt9  = rem9 - enteredAmt9;

            isOver18 = base18 > 0 && afterAmt18 < -0.5 && enteredAmt18 > 0;
            isOver9  = base9 > 0 && afterAmt9 < -0.5 && enteredAmt9 > 0;
            const isOverCombined = grandTotal > 0 && (usedAmt + enteredAmt > grandTotal + 0.5) && enteredAmt > 0;

            isOver = isOver18 || isOver9 || isOverCombined;
            isDisabled = isOver || (enteredAmt18 === 0 && enteredAmt9 === 0) || submitLoading || updateLoading;
          } else {
            enteredAmt = Number(amtInput || 0);
            const afterAmt = remainingAmt - enteredAmt;
            isOver = grandTotal > 0 && afterAmt < -0.5 && enteredAmt > 0;
            isDisabled = isOver || enteredAmt <= 0 || submitLoading || updateLoading;
          }

          const enteredPct = grandTotal > 0 ? (enteredAmt / grandTotal) * 100 : 0;
          const barFill = Math.min(usedPct + enteredPct, 100);
          const barOver = isOver;

          const allFollowUps = selectedPI.follow_ups || [];

          return (
<div
  id="proformaDrawerOverlay"
  className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
  style={{ animation: "prfFadeIn 0.3s ease-out" }}
>
  <style>{`
    @keyframes prfSlideIn {
      from { transform: translateX(100%); opacity: 0.6; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes prfSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0.6; }
    }
    @keyframes prfFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes prfFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `}</style>
 
  <div
    id="proformaDrawerPanel"
    className="bg-white w-full max-w-[980px] h-full shadow-2xl border-l border-gray-100 overflow-hidden flex flex-col"
    style={{ animation: "prfSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
  >
    {/* ── Header ── */}
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
              Update Proforma Activities
            </h2>
            <p className="text-[10px] text-gray-500 font-medium">
              Track proforma progress {hasTwoSplits ? "(Two-Split Payment)" : "(Single Payment)"}
            </p>
          </div>
        </div>
        <button
          onClick={closeProformaDrawer}
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
 
    {/* Body — scrollable */}
    <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
      {/* ── LEFT PANEL ── */}
      <div className="w-full md:w-1/2 px-6 py-5 border-b md:border-b-0 md:border-r border-gray-100">

        {/* Summary */}
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Customer
            </span>
            <span className="font-medium text-gray-700">
              {selectedPI.customer_name}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              Quotation No
            </span>
            <span className="font-medium text-gray-700">
              {selectedPI.quotation_no ||
                selectedPI.quotation_id ||
                "-"}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
              PI Base Amount (incl. tax)
            </span>
            <span className="font-semibold text-indigo-600">
              Rs. {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
 
        {/* Overall progress bar */}
        <div className="mb-5 bg-gray-50 rounded-xl border border-gray-100 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Overall Progress
          </p>
          <div className="w-full bg-white rounded-full h-2 border border-gray-200 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${barOver ? "bg-red-500" : barFill >= 100 ? "bg-green-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
              style={{ width: `${barFill}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              Used: {usedPct.toFixed(2)}%
              {enteredPct > 0 && ` + ${enteredPct.toFixed(2)}% new`}
            </span>
            <span className="text-xs text-gray-400">100.00%</span>
          </div>
        </div>
 
        {/* Form Inputs */}
        {hasTwoSplits ? (
          <div className="space-y-4">
            {/* Part 1: Project Value (18% Split) */}
            <div className={`rounded-xl border p-4 ${isOver18 ? "border-red-200 bg-red-50" : "border-blue-100 bg-blue-50/20"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">
                  Part 1: Project Value (18% Tax)
                </p>
                <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  Total: Rs. {base18.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Paid: Rs. {used18.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="font-semibold text-blue-600">Rem: Rs. {rem18.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amtInput18}
                  onChange={(e) => setAmtInput18(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm font-semibold focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none bg-white text-gray-800"
                  placeholder="Enter Part 1 Amount"
                />
              </div>
              {enteredAmt18 > 0 && (
                <div className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg flex justify-between ${isOver18 ? "bg-red-100 text-red-600" : "bg-white text-gray-600 border border-gray-100"}`}>
                  <span>After entry:</span>
                  <span>{isOver18 ? `Over limit by Rs. ${Math.abs(afterAmt18).toFixed(2)}` : `Rem: Rs. ${afterAmt18.toFixed(2)}`}</span>
                </div>
              )}
            </div>

            {/* Part 2: Other Charges (9% Split) */}
            <div className={`rounded-xl border p-4 ${isOver9 ? "border-red-200 bg-red-50" : "border-orange-100 bg-orange-50/20"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">
                  Part 2: Other Charges (9% Tax)
                </p>
                <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                  Total: Rs. {base9.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Paid: Rs. {used9.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="font-semibold text-orange-600">Rem: Rs. {rem9.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amtInput9}
                  onChange={(e) => setAmtInput9(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm font-semibold focus:ring-1 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white text-gray-800"
                  placeholder="Enter Part 2 Amount"
                />
              </div>
              {enteredAmt9 > 0 && (
                <div className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg flex justify-between ${isOver9 ? "bg-red-100 text-red-600" : "bg-white text-gray-600 border border-gray-100"}`}>
                  <span>After entry:</span>
                  <span>{isOver9 ? `Over limit by Rs. ${Math.abs(afterAmt9).toFixed(2)}` : `Rem: Rs. ${afterAmt9.toFixed(2)}`}</span>
                </div>
              )}
            </div>

            {/* Total Entered Summary */}
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center text-xs font-bold text-indigo-900">
              <span>Total Entered Amount:</span>
              <span className="text-sm text-indigo-700">
                Rs. {enteredAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-xl border p-4 ${isOver ? "border-red-200 bg-red-50" : "border-indigo-100 bg-indigo-50/20"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Proforma Invoice
              </p>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold">
                Used: {usedPct.toFixed(2)}% | Rem: {remainingPct.toFixed(2)}%
              </span>
            </div>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount
                </label>
                <span className="text-xs font-bold text-violet-600">
                  Percentage: {enteredPct.toFixed(2)}%
                </span>
              </div>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amtInput}
                  onChange={(e) => setAmtInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm font-semibold focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 outline-none bg-white text-gray-800"
                  placeholder="0.00"
                />
              </div>
            </div>
            {enteredAmt > 0 && (
              <div
                className={`flex justify-between text-xs font-semibold px-3 py-2 rounded-lg ${isOver ? "bg-red-100 text-red-600" : (remainingAmt - enteredAmt) === 0 ? "bg-green-100 text-green-600" : "bg-white text-gray-600 border border-gray-100 shadow-sm"}`}
              >
                <span>Remaining after entry:</span>
                <span>
                  {isOver
                    ? `Over by Rs. ${Math.abs(remainingAmt - enteredAmt).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `${(remainingPct - enteredPct).toFixed(2)}% | Rs. ${(remainingAmt - enteredAmt).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* ── RIGHT PANEL — History ── */}
      <div className="w-full md:w-1/2 px-6 py-5 bg-slate-50/50">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          PROFORMA PAYMENT HISTORY
        </p>
        <div className="space-y-2 overflow-y-auto max-h-[500px]">
          {allFollowUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <i className="bi bi-clock-history text-3xl mb-2"></i>
              <p className="text-sm">No history found</p>
            </div>
          ) : (
            allFollowUps.map((h, index) => {
              const isLatest = index === 0;
              const amt18 = Number(h.total_18 || 0);
              const amt9 = Number(h.total_9 || 0);
              const amt = Number(h.total || 0) || (amt18 + amt9);
              const pct = grandTotal > 0 ? (amt / grandTotal) * 100 : (Number(h.proforma_percentage || 0) || (Number(h.proforma_percentage_18 || 0) + Number(h.proforma_percentage_9 || 0)));
 
              return (
                <div key={h.id}>
                  <div
                    onClick={() =>
                      setActiveIndex(
                        index === activeIndex ? null : index,
                      )
                    }
                    className={`border rounded-xl p-3 cursor-pointer transition-all select-none bg-white ${
                      isLatest
                        ? "border-indigo-400 bg-indigo-50 shadow-sm"
                        : "hover:bg-violet-50/40 hover:border-violet-200 border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {isLatest && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-600"
                          >
                            Latest
                          </span>
                        )}
                        <p className="font-semibold text-sm text-gray-700">
                          {pct.toFixed(2)}% → Rs. {amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {new Date(
                            h.created_at,
                          ).toLocaleDateString("en-IN")}
                        </span>
                        {isLatest && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(h);
                            }}
                            className="text-gray-400 hover:text-violet-600 transition-all"
                          >
                            <i className="bi bi-pencil-square text-xs"></i>
                          </button>
                        )}
                        <i
                          className={`bi ${activeIndex === index ? "bi-chevron-up" : "bi-chevron-down"} text-gray-400 text-xs`}
                        ></i>
                      </div>
                    </div>
                    {hasTwoSplits && (amt18 > 0 || amt9 > 0) && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                        <span>Part 1: <strong className="text-blue-600">Rs. {amt18.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                        <span>Part 2: <strong className="text-orange-600">Rs. {amt9.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
 
    {/* Footer */}
    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 mt-auto">
      <button
        onClick={closeProformaDrawer}
        className="px-5 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-1.5"
      >
        <i className="bi bi-x-lg text-xs"></i>
        Cancel
      </button>
      <button
        onClick={editing ? handleUpdate : handleSubmitFollowUp}
        disabled={isDisabled}
        className={`px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-500 to-violet-600 ${
          isDisabled
            ? "bg-gray-300 cursor-not-allowed shadow-none"
            : "hover:shadow-lg hover:shadow-violet-200"
        }`}
      >
        {submitLoading || updateLoading ? (
          <>
            <i className="bi bi-arrow-repeat animate-spin"></i>{" "}
            Processing...
          </>
        ) : editing ? (
          <>
            <i className="bi bi-check-circle text-sm"></i>
            Update Follow-Up
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
          );
        })()}

      {/* PARTICIPATION TAX CALCULATION MODAL */}
      {showSplitModal && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-[500px] rounded-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col text-gray-800">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-orange-100 to-white border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-calculator-fill text-orange-500 text-base"></i>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                    Quotation Tax Calculation Details
                  </h2>
                  <p className="text-[10px] text-gray-500 font-medium">
                    Calculations for the linked quotation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSplitModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-orange-500 border-0 bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const amtTotal = parseFloat(splitForm.amount) || 0;
              const amt9 = parseFloat(splitForm.amount_9) || 0;
              const amt18 = parseFloat(splitForm.amount_18) || 0;
              const percent9 =
                amtTotal > 0 ? ((amt9 / amtTotal) * 100).toFixed(2) : "0.00";
              const percent18 =
                amtTotal > 0 ? ((amt18 / amtTotal) * 100).toFixed(2) : "0.00";
              return (
                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Total Base Amount
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      ₹ {Number(splitForm.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100 space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-blue-700 uppercase tracking-wide block mb-1">
                          Project Value (₹)
                        </label>
                        <div className="border border-blue-200 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">
                          ₹ {Number(splitForm.amount_18 || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                          Split (%)
                        </label>
                        <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">
                          {percent18}%
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                          Tax Rate (%)
                        </label>
                        <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">
                          {splitForm.tax_percent_18}%
                        </div>
                      </div>
                      <div className="mt-2.5 space-y-1 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
                        <div className="flex justify-between">
                          <span>Tax ({splitForm.tax_percent_18}%):</span>
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
                    <div className="bg-orange-50/20 p-4 rounded-xl border border-orange-100 space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-orange-700 uppercase tracking-wide block mb-1">
                          Other Charges (₹)
                        </label>
                        <div className="border border-orange-200 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">
                          ₹ {Number(splitForm.amount_9 || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                          Split (%)
                        </label>
                        <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">
                          {percent9}%
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">
                          Tax Rate (%)
                        </label>
                        <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">
                          {splitForm.tax_percent_9}%
                        </div>
                      </div>
                      <div className="mt-2.5 space-y-1 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
                        <div className="flex justify-between">
                          <span>Tax ({splitForm.tax_percent_9}%):</span>
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
              );
            })()}

            <div className="px-6 py-4 bg-gray-50 flex justify-end border-t border-gray-100 rounded-b-lg">
              <button
                type="button"
                onClick={() => setShowSplitModal(false)}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all cursor-pointer border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUOTATION FILES POPUP MODAL ── */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col text-gray-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
                  <i className="bi bi-file-earmark-pdf text-xl"></i>
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-wide">
                    Quotation Attachments
                  </h2>
                  <p className="text-xs text-blue-100 font-medium">
                    {selectedQuotationNo ? `Quotation No: ${selectedQuotationNo}` : "Uploaded Documents"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuotationModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-white bg-transparent border-0 cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* List Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {quotationFiles.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <i className="bi bi-folder-x text-4xl mb-2 block text-gray-300"></i>
                  No attachments found for this quotation.
                </div>
              ) : (
                quotationFiles.map((file, idx) => {
                  const fileName = file.file_name || (file.file_path ? file.file_path.split("/").pop() : `Document #${idx + 1}`);
                  return (
                    <div
                      key={file.id || idx}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-all group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 border border-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <i className="bi bi-file-earmark-pdf-fill text-lg"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate" title={fileName}>
                            {fileName}
                          </p>
                          {file.created_at && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Uploaded on: {new Date(file.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => window.open(file.file_path, "_blank")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex-shrink-0 cursor-pointer"
                      >
                        <i className="bi bi-box-arrow-up-right"></i>
                        Open
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-3.5 bg-gray-50 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-500">
                Total Files: <strong className="text-gray-700">{quotationFiles.length}</strong>
              </span>
              <button
                onClick={() => setShowQuotationModal(false)}
                className="px-5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
