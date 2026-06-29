"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import Link from "next/link";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import useAuth from "@/app/components/useAuth";

export default function ProformaPage() {
  const [piData, setPiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPI, setSelectedPI] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [editing, setEditing] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [quotationData, setQuotationData] = useState(null);
  const [showQuotationModal, setShowQuotationModal] = useState(false);

  const handleQuotationView = async (quotationId) => {
    try {
      const res = await axios.get(`${API}/api/pi/quotation-file/${quotationId}`);
      if (res.data.success) {
        window.open(res.data.file, "_blank");
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Unable to open attachment");
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

  const [pct9, setPct9] = useState("");
  const [amt9, setAmt9] = useState("");
  const [pct18, setPct18] = useState("");
  const [amt18, setAmt18] = useState("");

  const [activePartTab, setActivePartTab] = useState("b");
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

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== "" && v !== null && v !== undefined
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
        Object.entries(filters).filter(([_, v]) => v !== "")
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
        prev.map((item) => (item.pi_id === pi_id ? { ...item, stage } : item))
      );
      toast.success(
        stage === "completed" ? "Moved to Completed!" : "Moved to Pending!"
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
    if (pi.follow_ups && pi.follow_ups.length > 0) {
      const f = pi.follow_ups[pi.follow_ups.length - 1];
      if (f.proforma_percentage > 0)
        return (f.total / f.proforma_percentage) * 100;
    }
    if (pi.proforma_percentage > 0)
      return (pi.total / pi.proforma_percentage) * 100;
    return pi.total || 0;
  };

  const getBaseAmounts = (pi) => {
    const rawAmt9 = Number(pi.split_amount_9 ?? pi.amount_9 ?? 0);
    const rawAmt18 = Number(pi.split_amount_18 ?? pi.amount_18 ?? 0);
    const rawTax9 = Number(pi.split_tax_9 ?? pi.tax_9 ?? 0);
    const rawTax18 = Number(pi.split_tax_18 ?? pi.tax_18 ?? 0);
    const base9 = rawAmt9 + rawTax9;
    const base18 = rawAmt18 + rawTax18;
    return { base9, base18 };
  };

  const getDefaultTab = (pi) => {
    const { base9, base18 } = getBaseAmounts(pi);
    if (base9 > 0 && base18 > 0) return "a";
    if (base18 > 0) return "b";
    if (base9 > 0) return "a";
    return "b";
  };

  const getUsedSplitPct = (pi, excludeId = null) => {
    const followUps = pi.follow_ups || [];
    let used9 = 0,
      used18 = 0;
    followUps.forEach((f) => {
      if (excludeId && f.id === excludeId) return;
      used9 += Number(f.proforma_percentage_9 || 0);
      used18 += Number(f.proforma_percentage_18 || 0);
    });
    return { used9, used18 };
  };

  const handlePct9Change = (val) => {
    setPct9(val);
    if (val === "" || val === null) { setAmt9(""); return; }
    const num = Number(val);
    if (!isNaN(num) && selectedPI) {
      const { base9 } = getBaseAmounts(selectedPI);
      setAmt9(((base9 * num) / 100).toFixed(2));
    }
  };

  const handleAmt9Change = (val) => {
    setAmt9(val);
    if (val === "" || val === null) { setPct9(""); return; }
    const num = Number(val);
    if (!isNaN(num) && selectedPI) {
      const { base9 } = getBaseAmounts(selectedPI);
      if (base9 > 0) setPct9(parseFloat(((num / base9) * 100).toFixed(4)));
    }
  };

  const handlePct18Change = (val) => {
    setPct18(val);
    if (val === "" || val === null) { setAmt18(""); return; }
    const num = Number(val);
    if (!isNaN(num) && selectedPI) {
      const { base18 } = getBaseAmounts(selectedPI);
      setAmt18(((base18 * num) / 100).toFixed(2));
    }
  };

  const handleAmt18Change = (val) => {
    setAmt18(val);
    if (val === "" || val === null) { setPct18(""); return; }
    const num = Number(val);
    if (!isNaN(num) && selectedPI) {
      const { base18 } = getBaseAmounts(selectedPI);
      if (base18 > 0) setPct18(parseFloat(((num / base18) * 100).toFixed(4)));
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditing(null);
    setPct9("");
    setAmt9("");
    setPct18("");
    setAmt18("");
    setActiveIndex(null);
    setActivePartTab("b");
  };

  const handleSubmitFollowUp = async () => {
    const new9 = Number(pct9 || 0);
    const new18 = Number(pct18 || 0);
    const { base9: b9, base18: b18 } = getBaseAmounts(selectedPI);

    if (b9 > 0 && b18 === 0 && new9 <= 0) {
      toast.error("Please enter Part A (Other Charges) percentage");
      return;
    }
    if (b18 > 0 && b9 === 0 && new18 <= 0) {
      toast.error("Please enter Part B (Project Value) percentage");
      return;
    }
    if (b9 > 0 && b18 > 0 && new9 <= 0 && new18 <= 0) {
      toast.error("Please enter at least one amount (Part A or Part B)");
      return;
    }

    const { used9, used18 } = getUsedSplitPct(selectedPI);
    if (b9 > 0 && used9 + new9 > 100) {
      toast.error(`Part A: Only ${(100 - used9).toFixed(2)}% remaining`);
      return;
    }
    if (b18 > 0 && used18 + new18 > 100) {
      toast.error(`Part B: Only ${(100 - used18).toFixed(2)}% remaining`);
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await axios.post(
        `${API}/api/pi/add-followup/${selectedPI.pi_id}`,
        { percentage_9: new9, percentage_18: new18 }
      );
      const confirmedTotal =
        res.data?.total_percentage ?? (used9 + new9 + used18 + new18) / 2;
      await updateStatus(selectedPI.pi_id, confirmedTotal);
      toast.success(
        confirmedTotal >= 100
          ? "Follow-up added & marked as Won!"
          : "Follow-up added successfully"
      );
      resetModal();
      fetchPI();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdate = async () => {
    const new9 = Number(pct9 || 0);
    const new18 = Number(pct18 || 0);
    const { base9: b9, base18: b18 } = getBaseAmounts(selectedPI);

    if (b9 > 0 && b18 === 0 && new9 <= 0) {
      toast.error("Enter valid percentage for Part A");
      return;
    }
    if (b18 > 0 && b9 === 0 && new18 <= 0) {
      toast.error("Enter valid percentage for Part B");
      return;
    }
    if (b9 > 0 && b18 > 0 && new9 <= 0 && new18 <= 0) {
      toast.error("Enter valid percentage for at least one part");
      return;
    }

    const { used9, used18 } = getUsedSplitPct(selectedPI, editing.id);
    if (b9 > 0 && used9 + new9 > 100) {
      toast.error(`Part A: Only ${(100 - used9).toFixed(2)}% remaining`);
      return;
    }
    if (b18 > 0 && used18 + new18 > 100) {
      toast.error(`Part B: Only ${(100 - used18).toFixed(2)}% remaining`);
      return;
    }

    try {
      setUpdateLoading(true);
      await axios.put(
        `${API}/api/pi/update-followup/${selectedPI.pi_id}/${editing.id}`,
        { percentage_9: new9, percentage_18: new18 }
      );
      const grandTotal = getGrandTotal(selectedPI);
      const { base9, base18 } = getBaseAmounts(selectedPI);
      const newAmt9 = (base9 * new9) / 100;
      const newAmt18 = (base18 * new18) / 100;
      const newTotal = newAmt9 + newAmt18;
      const newOverall = grandTotal > 0 ? (newTotal / grandTotal) * 100 : 0;
      const newTotalOverall = used9 + used18 + newOverall;
      await updateStatus(selectedPI.pi_id, newTotalOverall);
      toast.success(
        newTotalOverall >= 100 ? "Updated & marked as Won!" : "Updated successfully"
      );
      resetModal();
      fetchPI();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setPct9(item.proforma_percentage_9 || "");
    setAmt9(item.total_9 || "");
    setPct18(item.proforma_percentage_18 || "");
    setAmt18(item.total_18 || "");
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const exportData = piData.map((item, index) => ({
        "No.": index + 1,
        "PI No": formatPINumber(index),
        "PI Date": item.pi_date ? new Date(item.pi_date).toLocaleDateString() : "",
        "Customer Name": item.customer_name || "",
        "Quotation No": item.quotation_no || "",
        Assignee: item.assignee || "",
        Total: item.total || "",
        "Proforma %": item.proforma_percentage || "",
        Status: item.status || "",
        Stage: item.stage || "pending",
        "Created At": item.created_at ? new Date(item.created_at).toLocaleDateString() : "",
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Proforma");
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet["!cols"] = colWidths;
      const now = new Date();
      XLSX.writeFile(
        workbook,
        `Proforma_(${now.toISOString().split("T")[0]})_${now.toTimeString().slice(0, 5)}.xlsx`
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
        22
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
        head: [["#", "PI No", "PI Date", "Customer", "Quotation", "Assignee", "Total", "PI %", "Status", "Stage", "Created"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
        headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        columnStyles: { 0: { cellWidth: 8 } },
      });
      const now = new Date();
      doc.save(
        `Proforma_(${now.toISOString().split("T")[0]})_${now.toTimeString().slice(0, 5).replace(":", "-")}.pdf`
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
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      const historyA = sortedFollowUps.filter(
        (f) => Number(f.proforma_percentage_9 || 0) > 0
      );
      const historyB = sortedFollowUps.filter(
        (f) => Number(f.proforma_percentage_18 || 0) > 0
      );

      const { base9, base18 } = getBaseAmounts(item);
      const grandTotal = getGrandTotal(item);

      const latestFollowUp = sortedFollowUps[0];
      const totalPaid = latestFollowUp
        ? Number(latestFollowUp.total || 0)
        : Number(item.total || 0);
      const totalPaidPct = latestFollowUp
        ? Number(latestFollowUp.proforma_percentage || 0)
        : Number(item.proforma_percentage || 0);

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
      doc.text(`Date: ${piDate.toLocaleDateString("en-GB")}`, pageWidth - 14, 24, { align: "right" });

      doc.setDrawColor(40, 40, 40);
      doc.setLineWidth(0.6);
      doc.line(14, 28, pageWidth - 14, 28);

      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, "bold");
      doc.text(`PI No: ${piNumber}`, 14, 37);

      doc.setFillColor(
        statusLabel === "WON / PAID" ? 22 : statusLabel === "PENDING" ? 234 : 100,
        statusLabel === "WON / PAID" ? 163 : statusLabel === "PENDING" ? 88 : 100,
        statusLabel === "WON / PAID" ? 74 : statusLabel === "PENDING" ? 12 : 100
      );
      const badgeWidth = doc.getTextWidth(statusLabel) + 10;
      doc.roundedRect(pageWidth - 14 - badgeWidth, 32, badgeWidth, 7, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text(statusLabel, pageWidth - 14 - badgeWidth / 2, 36.5, { align: "center" });

      const boxTop = 42;
      const boxHeight = 32;
      const colGap = 4;
      const colWidth = (pageWidth - 28 - colGap) / 2;

      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(14, boxTop, colWidth, boxHeight, 2, 2, "FD");
      doc.roundedRect(14 + colWidth + colGap, boxTop, colWidth, boxHeight, 2, 2, "FD");

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
        ["Quotation:", item.quotation_no || "-"],
        ["Created:", item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB") : "-"],
      ];
      const rightRows = [
        ["PI Number:", piNumber],
        ["PI Date:", piDate.toLocaleDateString("en-GB")],
        ["Grand Total:", `Rs. ${Number(grandTotal).toLocaleString("en-IN")}`],
        ["Total Paid %:", `${totalPaidPct.toFixed(0)}%`],
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
      doc.text("PAYMENT HISTORY — OTHER CHARGES", 14, cursorY);
      cursorY += 2;

      const historyRowsA = historyA.map((h, i) => [
        i + 1,
        h.created_at ? new Date(h.created_at).toLocaleDateString("en-GB") : "-",
        i === 0 ? "Latest Follow-Up" : `Follow-Up #${historyA.length - i}`,
        `${Number(h.proforma_percentage_9 || 0).toFixed(0)}%`,
        `Rs. ${Number(h.total_9 || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        i === 0 ? "Latest" : "Received",
      ]);

      autoTable(doc, {
        startY: cursorY + 2,
        head: [["#", "Date", "Description", "Paid %", "Amount", "Status"]],
        body: historyRowsA.length > 0 ? historyRowsA : [["-", "-", "No follow-up recorded", "-", "-", "-"]],
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [40, 40, 40] },
        headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        columnStyles: { 0: { cellWidth: 10 }, 3: { cellWidth: 22 }, 5: { cellWidth: 24 } },
        margin: { left: 14, right: 14 },
      });

      cursorY = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235);
      doc.setFont(undefined, "bold");
      doc.text("PAYMENT HISTORY — PROJECT VALUE", 14, cursorY);
      cursorY += 2;

      const historyRowsB = historyB.map((h, i) => [
        i + 1,
        h.created_at ? new Date(h.created_at).toLocaleDateString("en-GB") : "-",
        i === 0 ? "Latest Follow-Up" : `Follow-Up #${historyB.length - i}`,
        `${Number(h.proforma_percentage_18 || 0).toFixed(0)}%`,
        `Rs. ${Number(h.total_18 || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        i === 0 ? "Latest" : "Received",
      ]);

      autoTable(doc, {
        startY: cursorY + 2,
        head: [["#", "Date", "Description", "Paid %", "Amount", "Status"]],
        body: historyRowsB.length > 0 ? historyRowsB : [["-", "-", "No follow-up recorded", "-", "-", "-"]],
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [40, 40, 40] },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        columnStyles: { 0: { cellWidth: 10 }, 3: { cellWidth: 22 }, 5: { cellWidth: 24 } },
        margin: { left: 14, right: 14 },
      });

      cursorY = doc.lastAutoTable.finalY + 12;
      if (cursorY > 250) { doc.addPage(); cursorY = 20; }

      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, "bold");
      doc.text("Thank you for your business!", 14, cursorY);
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.setFont(undefined, "normal");
      doc.text("This is a system-generated document.", 14, cursorY + 6);
      doc.text("No signature is required.", 14, cursorY + 11);

      const summaryX = pageWidth - 14 - 78;
      const summaryRows = [
        ["Grand Total", `Rs. ${Number(grandTotal).toLocaleString("en-IN")}`],
        ["Total Paid", `Rs. ${Number(totalPaid).toLocaleString("en-IN")}`],
        ["Follow-ups", `${followUps.length} record(s)`],
      ];
      summaryRows.forEach(([label, value], i) => {
        const y = cursorY - 4 + i * 7;
        doc.setFontSize(8.5);
        doc.setTextColor(130, 130, 130);
        doc.setFont(undefined, "normal");
        doc.text(label, summaryX, y);
        doc.setFont(undefined, "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(String(value), summaryX + 78, y, { align: "right" });
      });

      const finalBoxY = cursorY - 4 + summaryRows.length * 7 + 3;
      const finalBoxColor = statusLabel === "WON / PAID" ? [22, 163, 74] : [234, 88, 12];
      doc.setFillColor(...finalBoxColor);
      doc.roundedRect(summaryX, finalBoxY, 78, 8, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont(undefined, "bold");
      doc.text("Final Status", summaryX + 3, finalBoxY + 5.5);
      doc.text(statusLabel, summaryX + 75, finalBoxY + 5.5, { align: "right" });

      const safeName = (item.customer_name || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
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
    const stage = String(item.stage || "pending").trim().toLowerCase();
    if (activeTab === "pending") return stage !== "completed";
    if (activeTab === "completed") return stage === "completed";
    return true;
  });

  const pendingCount = piData.filter(
    (d) => String(d.stage || "pending").trim().toLowerCase() !== "completed"
  ).length;
  const completedCount = piData.filter(
    (d) => String(d.stage || "").trim().toLowerCase() === "completed"
  ).length;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = tabFilteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tabFilteredData.length / itemsPerPage);

  const getSlidingPages = () => {
    const visibleCount = 5;
    if (totalPages <= visibleCount)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = currentPage - Math.floor(visibleCount / 2);
    let end = currentPage + Math.floor(visibleCount / 2);
    if (start < 1) { start = 1; end = visibleCount; }
    if (end > totalPages) { end = totalPages; start = totalPages - visibleCount + 1; }
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
              <Link href="/dashboard" className="mx-2 text-xl text-gray-400 hover:text-indigo-600">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="#" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">
                Sales
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="/sales/proforma" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">
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
                <i className={`bi bi-chevron-down text-xs transition-transform ${showExportMenu ? "rotate-180" : ""}`}></i>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-sm shadow-lg border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-excel text-green-600 text-base"></i> Export Excel
                  </button>
                  <div className="h-px bg-gray-100 mx-3"></div>
                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-pdf text-red-600 text-base"></i> Export PDF
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
            <i className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}></i>
          </button>
        </div>

        <div
          className={`${showMobileFilters ? "absolute left-6 right-6 top-[170px] bg-white p-5 shadow-2xl rounded-lg grid grid-cols-2 gap-3 mt-1 z-[999] ring-2 ring-orange-300" : "hidden"} md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:ring-0`}
        >
          <input name="customer_name" value={filters.customer_name} onChange={handleFilterChange} placeholder="Customer" className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm" />
          <input name="quotation_no" value={filters.quotation_no} onChange={handleFilterChange} placeholder="Quotation No" className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm" />
          <select name="assignee" value={filters.assignee} onChange={handleFilterChange} className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-400 text-sm">
            <option value="">Assignee</option>
            {assigneeList.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-400 text-sm">
            <option value="">Status</option>
            <option value="draft">Draft</option>
            <option value="partial">Pending</option>
            <option value="paid">Won</option>
          </select>
          <div className="flex items-center px-2 w-full md:w-58 bg-white border border-orange-300 md:border rounded-sm text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 text-gray-400 whitespace-nowrap">From</span>
            <input type="date" name="from_date" value={filters.from_date} onChange={handleFilterChange} className="p-2 w-full md:w-35 outline-none" />
          </div>
          <div className="flex items-center px-2 w-full md:w-53 bg-white border border-orange-300 md:border rounded-sm text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 text-gray-400 whitespace-nowrap">To</span>
            <input type="date" name="to_date" value={filters.to_date} onChange={handleFilterChange} className="p-2 w-full md:w-35 outline-none" />
          </div>
          <input type="number" name="min_percentage" value={filters.min_percentage} onChange={handleFilterChange} placeholder="Min %" min="0" max="100" className="p-2 w-full md:w-24 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm" />
          <input type="number" name="max_percentage" value={filters.max_percentage} onChange={handleFilterChange} placeholder="Max %" min="0" max="100" className="p-2 w-full md:w-24 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm" />
          <input type="number" name="min_total" value={filters.min_total} onChange={handleFilterChange} placeholder="Min Rs." className="p-2 w-full md:w-32 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm" />
          <input type="number" name="max_total" value={filters.max_total} onChange={handleFilterChange} placeholder="Max Rs." className="p-2 w-full md:w-32 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm" />
          <div className="flex gap-2 col-span-2 md:col-span-1">
            <button onClick={() => { resetFilters(); setShowMobileFilters(false); }} className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-semibold text-center px-6">
              Clear
            </button>
            <button onClick={() => setShowMobileFilters(false)} className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm font-semibold text-center px-6">
              Apply
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="mx-7 mt-2 mb-0 flex items-center gap-0 border-b border-gray-200 bg-white px-2 pt-2 rounded-t-sm">
          <button
            onClick={() => { setActiveTab("pending"); setCurrentPage(1); }}
            className={`px-5 py-2.5 text-sm font-semibold transition-all relative rounded-t-md ${activeTab === "pending" ? "text-blue-600 border-b-2 border-blue-500 bg-white" : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"}`}
          >
            Pending
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "pending" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab("completed"); setCurrentPage(1); }}
            className={`px-5 py-2.5 text-sm font-semibold transition-all relative rounded-t-md ${activeTab === "completed" ? "text-green-600 border-b-2 border-green-500 bg-white" : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"}`}
          >
            Completed
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === "completed" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
              {completedCount}
            </span>
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-b-sm rounded-tr-sm border border-gray-100 mx-7 py-2">
          <div className="py-1">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto overflow-y-scroll max-h-[500px] custom-scroll" style={{ overflowX: "scroll" }}>
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["#", "PI No", "PI Date", "Customer Name", "Quotation No", "Source", "Reference", "Assignee", "Total", "PI %", "Status", "Stage", "Follow-Up", "Quotation", "Download"].map((h) => (
                        <th key={h} className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {h}
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
                          <tr key={item.pi_id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                            <td className="py-3 px-3">{globalIndex + 1}</td>
                            <td className="py-3 px-3 font-medium text-gray-800">{formatPINumber(globalIndex)}</td>
                            <td className="py-3 px-3 text-gray-500">
                              {item.pi_date ? new Date(item.pi_date).toLocaleDateString("en-IN") : "-"}
                            </td>
                            <td className="py-3 px-3 text-orange-500">{item.customer_name || "-"}</td>
                            <td className="py-3 px-3 text-gray-600">{item.quotation_no || "-"}</td>
                            <td className="py-3 px-3 text-gray-500">{item.source || "-"}</td>
                            <td className="py-3 px-3 text-gray-500">{item.reference || "-"}</td>
                            <td className="py-3 px-3">
                              {item.assignee ? (
                                <div className="flex gap-1 items-center">
                                  {String(item.assignee).split(",").map((name, i) => (
                                    <div key={i} title={name.trim()} className="px-3 py-1.5 bg-blue-800 text-white rounded-full font-semibold text-sm flex justify-center items-center min-w-[28px] text-center select-none">
                                      {name.trim().charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              ) : "-"}
                            </td>
                            <td className="py-3 px-3 font-medium text-gray-800">
                              Rs.{Number(item.total).toLocaleString()}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${Number(item.proforma_percentage) >= 100 ? "bg-green-500" : Number(item.proforma_percentage) >= 50 ? "bg-orange-400" : "bg-blue-400"}`}
                                    style={{ width: `${Math.min(Number(item.proforma_percentage), 100)}%` }}
                                  ></div>
                                </div>
                                <span className="font-semibold text-gray-800 text-xs">{item.proforma_percentage}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`border rounded-sm px-3 py-1 text-xs font-semibold ${item.status === "paid" ? "border-green-200 bg-green-50 text-green-700" : ""} ${item.status === "partial" ? "border-orange-200 bg-orange-50 text-orange-700" : ""} ${item.status === "draft" ? "border-gray-200 bg-gray-50 text-gray-700" : ""} ${item.status === "sent" ? "border-blue-200 bg-blue-50 text-blue-700" : ""} ${item.status === "cancelled" ? "border-red-200 bg-red-50 text-red-700" : ""}`}>
                                {item.status === "paid" ? "Won" : item.status === "partial" ? "Pending" : item.status === "sent" ? "Sent" : item.status === "cancelled" ? "Cancelled" : "Draft"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <select
                                value={currentStage}
                                onChange={(e) => updateStage(item.pi_id, e.target.value)}
                                className={`text-xs font-semibold px-2 py-1.5 rounded-sm border cursor-pointer outline-none transition-all ${currentStage === "completed" ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"}`}
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
                                  setPct9("");
                                  setAmt9("");
                                  setPct18("");
                                  setAmt18("");
                                  setActiveIndex(null);
                                  setActivePartTab(getDefaultTab(item));
                                  setShowModal(true);
                                }}
                                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center mx-auto hover:bg-gray-100 cursor-pointer"
                              >
                                <i className="bi bi-plus text-lg"></i>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleQuotationView(item.quotation_id)}
                                title="View Quotation File"
                                className="group relative w-9 h-9 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center mx-auto hover:bg-blue-500 hover:border-blue-500 transition-all cursor-pointer"
                              >
                                <i className="bi bi-eye text-blue-600 group-hover:text-white text-base transition-all"></i>
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                title="Download PI PDF"
                                onClick={() => downloadInvoicePDF(item, globalIndex)}
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
                        <td colSpan="15" className="text-center py-10 text-gray-400">
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* PAGINATION */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-medium">Rows per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none cursor-pointer font-medium"
                    >
                      {[10, 20, 100, 200].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-left text-sm"></i>
                      </button>
                      {getSlidingPages().map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page ? "bg-[#212121] text-white shadow-md" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* ── FOLLOW-UP MODAL ── */}
      {showModal && selectedPI && (() => {
        const { base9, base18 } = getBaseAmounts(selectedPI);
        const { used9, used18 } = getUsedSplitPct(selectedPI, editing?.id);

        const entered9 = Number(pct9 || 0);
        const entered18 = Number(pct18 || 0);

        const remaining9 = 100 - used9;
        const remaining18 = 100 - used18;

        const after9 = remaining9 - entered9;
        const after18 = remaining18 - entered18;

        const afterAmt9 = (base9 * after9) / 100;
        const afterAmt18 = (base18 * after18) / 100;

        const over9 = base9 > 0 && after9 < 0 && entered9 > 0;
        const over18 = base18 > 0 && after18 < 0 && entered18 > 0;
        const isDisabled = over9 || over18 || submitLoading || updateLoading;

        const activeParts = (base9 > 0 ? 1 : 0) + (base18 > 0 ? 1 : 0);
        const totalUsed = (base9 > 0 ? used9 : 0) + (base18 > 0 ? used18 : 0);
        const totalEntered = (base9 > 0 ? entered9 : 0) + (base18 > 0 ? entered18 : 0);
        const avgUsed = activeParts > 0 ? totalUsed / activeParts : 0;
        const avgEntered = activeParts > 0 ? totalEntered / activeParts : 0;
        const barFill = Math.min(avgUsed + avgEntered, 100);
        const barOver = over9 || over18;

        const allFollowUps = selectedPI.follow_ups || [];
        const historyA = allFollowUps.filter((f) => Number(f.proforma_percentage_9 || 0) > 0);
        const historyB = allFollowUps.filter((f) => Number(f.proforma_percentage_18 || 0) > 0);
        const shownHistory = activePartTab === "a" ? historyA : historyB;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-[980px] rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[95vh] overflow-y-auto">

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Update Proforma Activities
                  </h2>
                </div>
                <button
                  onClick={resetModal}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-orange-100 text-gray-400 hover:text-orange-500 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-col md:flex-row">

                {/* ── LEFT PANEL ── */}
                <div className="w-full md:w-1/2 px-6 py-5 border-b md:border-b-0 md:border-r border-gray-100">

                  {/* Part Tabs */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      onClick={() => base9 > 0 && setActivePartTab("a")}
                      disabled={base9 === 0}
                      className={`px-5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all ${
                        base9 === 0
                          ? "border-transparent text-gray-300 cursor-not-allowed opacity-40"
                          : activePartTab === "a"
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Other Charges
                      {base9 === 0 && <span className="ml-1 text-[10px]">🔒</span>}
                    </button>
                    <button
                      onClick={() => base18 > 0 && setActivePartTab("b")}
                      disabled={base18 === 0}
                      className={`px-5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all ${
                        base18 === 0
                          ? "border-transparent text-gray-300 cursor-not-allowed opacity-40"
                          : activePartTab === "b"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Project Value
                      {base18 === 0 && <span className="ml-1 text-[10px]">🔒</span>}
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1 text-sm mb-4">
                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Customer</span>
                      <span className="font-medium text-gray-700">{selectedPI.customer_name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Quotation</span>
                      <span className="font-medium text-gray-700">{selectedPI.quotation_no || selectedPI.quotation_id || "-"}</span>
                    </div>
                    {activePartTab === "a" ? (
                      <div className="flex justify-between py-1.5">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          Part A Base (Other Charges, incl. tax)
                        </span>
                        <span className="font-semibold text-orange-500">
                          Rs.{Number(base9).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between py-1.5">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          Part B Base (Project Value, incl. tax)
                        </span>
                        <span className="font-semibold text-blue-600">
                          Rs.{Number(base18).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Overall progress bar */}
                  <div className="mb-5 bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Overall Progress</p>
                    <div className="w-full bg-white rounded-full h-2 border border-gray-200 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${barOver ? "bg-red-500" : barFill >= 100 ? "bg-green-500" : "bg-orange-400"}`}
                        style={{ width: `${barFill}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        Used: {avgUsed.toFixed(1)}%{avgEntered > 0 && ` + ${avgEntered.toFixed(1)}% new`}
                      </span>
                      <span className="text-xs text-gray-400">100%</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {base9 > 0 && (
                        <span className="text-[10px] bg-orange-50 border border-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                          A: {used9.toFixed(1)}% used
                        </span>
                      )}
                      {base18 > 0 && (
                        <span className="text-[10px] bg-blue-50 border border-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                          B: {used18.toFixed(1)}% used
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Part A Form */}
                  {activePartTab === "a" && (
                    <div className={`rounded-xl border p-4 ${over9 ? "border-red-200 bg-red-50" : "border-orange-100 bg-orange-50/30"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Part A — Other Charges</p>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                          Used: {used9.toFixed(1)}% | Rem: {remaining9.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex gap-3 mb-2">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Percentage</label>
                          <div className="relative mt-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={pct9}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") { handlePct9Change(""); return; }
                                const n = Number(v);
                                if (n >= 0 && n <= 100) handlePct9Change(n);
                              }}
                              className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-orange-300 outline-none bg-white"
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</label>
                          <div className="relative mt-1.5">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rs.</span>
                            <input
                              type="number"
                              min="0"
                              value={amt9}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") { handleAmt9Change(""); return; }
                                handleAmt9Change(Number(v));
                              }}
                              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-orange-300 outline-none bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                      <div className={`flex justify-between text-xs font-semibold px-2 py-1.5 rounded-lg ${over9 ? "bg-red-100 text-red-600" : after9 === 0 && entered9 > 0 ? "bg-green-100 text-green-600" : "bg-white text-gray-500 border border-gray-100"}`}>
                        <span>Remaining after entry:</span>
                        <span>
                          {over9
                            ? `Over by ${Math.abs(after9).toFixed(2)}%`
                            : entered9 > 0
                            ? `${after9.toFixed(2)}% | Rs.${Number(afterAmt9).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                            : `${remaining9.toFixed(2)}% | Rs.${Number((base9 * remaining9) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Part B Form */}
                  {activePartTab === "b" && (
                    <div className={`rounded-xl border p-4 ${over18 ? "border-red-200 bg-red-50" : "border-blue-100 bg-blue-50/20"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Part B — Project Value</p>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                          Used: {used18.toFixed(1)}% | Rem: {remaining18.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex gap-3 mb-2">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Percentage</label>
                          <div className="relative mt-1.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={pct18}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") { handlePct18Change(""); return; }
                                const n = Number(v);
                                if (n >= 0 && n <= 100) handlePct18Change(n);
                              }}
                              className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</label>
                          <div className="relative mt-1.5">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rs.</span>
                            <input
                              type="number"
                              min="0"
                              value={amt18}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "") { handleAmt18Change(""); return; }
                                handleAmt18Change(Number(v));
                              }}
                              className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                      <div className={`flex justify-between text-xs font-semibold px-2 py-1.5 rounded-lg ${over18 ? "bg-red-100 text-red-600" : after18 === 0 && entered18 > 0 ? "bg-green-100 text-green-600" : "bg-white text-gray-500 border border-gray-100"}`}>
                        <span>Remaining after entry:</span>
                        <span>
                          {over18
                            ? `Over by ${Math.abs(after18).toFixed(2)}%`
                            : entered18 > 0
                            ? `${after18.toFixed(2)}% | Rs.${Number(afterAmt18).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                            : `${remaining18.toFixed(2)}% | Rs.${Number((base18 * remaining18) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── RIGHT PANEL — History ── */}
                <div className="w-full md:w-1/2 px-6 py-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    {activePartTab === "a" ? "Part A — Other Charges History" : "Part B — Project Value History"}
                  </p>
                  <div className="space-y-2 overflow-y-auto max-h-[500px]">
                    {shownHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                        <i className="bi bi-clock-history text-3xl mb-2"></i>
                        <p className="text-sm">No history found</p>
                      </div>
                    ) : (
                      shownHistory.map((h, index) => {
                        const isLatest = index === 0;
                        const pct9v = Number(h.proforma_percentage_9 || 0);
                        const pct18v = Number(h.proforma_percentage_18 || 0);
                        const t9v = Number(h.total_9 || 0);
                        const t18v = Number(h.total_18 || 0);
                        const displayPct = activePartTab === "a" ? pct9v : pct18v;
                        const displayAmt = activePartTab === "a" ? t9v : t18v;

                        return (
                          <div key={h.id}>
                            <div
                              onClick={() => setActiveIndex(index === activeIndex ? null : index)}
                              className={`border rounded-xl p-3 cursor-pointer transition-all select-none ${
                                isLatest
                                  ? activePartTab === "a"
                                    ? "border-orange-400 bg-orange-50 shadow-sm"
                                    : "border-blue-400 bg-blue-50 shadow-sm"
                                  : "hover:bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {isLatest && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${activePartTab === "a" ? "bg-orange-100 text-orange-500" : "bg-blue-100 text-blue-500"}`}>
                                      Latest
                                    </span>
                                  )}
                                  <p className="font-semibold text-sm text-gray-700">
                                    {displayPct.toFixed(1)}% → Rs.{Number(displayAmt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    {new Date(h.created_at).toLocaleDateString("en-IN")}
                                  </span>
                                  {isLatest && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleEdit(h); }}
                                      className="text-gray-400 hover:text-orange-500 transition-all"
                                    >
                                      <i className="bi bi-pencil-square text-xs"></i>
                                    </button>
                                  )}
                                  <i className={`bi ${activeIndex === index ? "bi-chevron-up" : "bi-chevron-down"} text-gray-400 text-xs`}></i>
                                </div>
                              </div>

                              {/* Mini chip */}
                              <div className="flex gap-3 mt-2">
                                {activePartTab === "a" ? (
                                  <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1">
                                    <span className="font-bold">A:</span>
                                    <span>{pct9v.toFixed(1)}%</span>
                                    <span className="text-gray-400">|</span>
                                    <span>Rs.{Number(t9v).toLocaleString("en-IN")}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
                                    <span className="font-bold">B:</span>
                                    <span>{pct18v.toFixed(1)}%</span>
                                    <span className="text-gray-400">|</span>
                                    <span>Rs.{Number(t18v).toLocaleString("en-IN")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={resetModal}
                  className="px-5 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={editing ? handleUpdate : handleSubmitFollowUp}
                  disabled={isDisabled}
                  className={`px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                    isDisabled ? "bg-gray-300 cursor-not-allowed shadow-none" : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                  }`}
                >
                  {submitLoading || updateLoading ? (
                    <><i className="bi bi-arrow-repeat animate-spin"></i> Processing...</>
                  ) : editing ? (
                    "Update Follow-Up"
                  ) : (
                    "Add Follow-Up"
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
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Quotation Tax Calculation Details</h2>
                  <p className="text-[10px] text-gray-500 font-medium">Calculations for the linked quotation</p>
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
              const percent9 = amtTotal > 0 ? ((amt9 / amtTotal) * 100).toFixed(2) : "0.00";
              const percent18 = amtTotal > 0 ? ((amt18 / amtTotal) * 100).toFixed(2) : "0.00";
              return (
                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Base Amount</span>
                    <span className="text-lg font-bold text-gray-800">₹ {Number(splitForm.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-100 space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-blue-700 uppercase tracking-wide block mb-1">Project Value (₹)</label>
                        <div className="border border-blue-200 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">
                          ₹ {Number(splitForm.amount_18 || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Split (%)</label>
                        <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">{percent18}%</div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Tax Rate (%)</label>
                        <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">{splitForm.tax_percent_18}%</div>
                      </div>
                      <div className="mt-2.5 space-y-1 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
                        <div className="flex justify-between">
                          <span>Tax ({splitForm.tax_percent_18}%):</span>
                          <span className="font-medium text-gray-700">₹ {splitForm.tax_18}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-gray-150 pt-1">
                          <span>Total B:</span>
                          <span className="font-bold text-gray-700">
                            ₹ {(parseFloat(splitForm.amount_18 || 0) + parseFloat(splitForm.tax_18 || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50/20 p-4 rounded-xl border border-orange-100 space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-orange-700 uppercase tracking-wide block mb-1">Other Charges (₹)</label>
                        <div className="border border-orange-200 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">
                          ₹ {Number(splitForm.amount_9 || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Split (%)</label>
                        <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">{percent9}%</div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Tax Rate (%)</label>
                        <div className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white font-semibold text-gray-800 shadow-sm">{splitForm.tax_percent_9}%</div>
                      </div>
                      <div className="mt-2.5 space-y-1 text-xs text-gray-500 pt-2 border-t border-dashed border-gray-200">
                        <div className="flex justify-between">
                          <span>Tax ({splitForm.tax_percent_9}%):</span>
                          <span className="font-medium text-gray-700">₹ {splitForm.tax_9}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-gray-150 pt-1">
                          <span>Total A:</span>
                          <span className="font-bold text-gray-700">
                            ₹ {(parseFloat(splitForm.amount_9 || 0) + parseFloat(splitForm.tax_9 || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Project Value</span>
                    <span className="text-xl font-black text-green-700">₹ {Number(splitForm.grand_total || 0).toLocaleString()}</span>
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
    </>
  );
}