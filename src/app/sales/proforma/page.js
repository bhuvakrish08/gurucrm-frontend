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
  const [percentage, setPercentage] = useState("");
  const [rupees, setRupees] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const [editing, setEditing] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);
  const debounceRef = useRef(null);

  // ── FILTER STATE ──────────────────────────────────────────
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
    (value) => value !== "" && value !== null && value !== undefined,
  );

  const [assigneeList, setAssigneeList] = useState([]);

  useAuth();

  const API = process.env.NEXT_PUBLIC_BACKEND_URL;

  // ── FETCH ALL PI ─────────────────────────────────────────
  const fetchPI = async () => {
    try {
      const res = await axios.get(`${API}/api/pi/list`);
      setPiData(res.data.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── FILTER SEARCH ─────────────────────────────────────────
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

  // ── DEBOUNCE FILTER ───────────────────────────────────────
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

 

  // ── RESET FILTERS ─────────────────────────────────────────
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

  // ── FETCH ASSIGNEE DROPDOWN ───────────────────────────────
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
        console.error(err);
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
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── PI NUMBER FORMAT ──────────────────────────────────────
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

  // ── AUTO STATUS UPDATE ────────────────────────────────────
  const updateStatus = async (pi_id, newTotalPercentage) => {
    let newStatus;
    if (newTotalPercentage >= 100) {
      newStatus = "paid";
    } else if (newTotalPercentage > 0) {
      newStatus = "partial";
    } else {
      newStatus = "draft";
    }
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
      if (f.proforma_percentage > 0) {
        return (f.total / f.proforma_percentage) * 100;
      }
    }
    if (pi.proforma_percentage > 0) {
      return (pi.total / pi.proforma_percentage) * 100;
    }
    return pi.total || 0;
  };

  const getRemainingInfo = (pi) => {
    const grandTotal = getGrandTotal(pi);
    const paidPercentage = Number(pi.proforma_percentage) || 0;
    const paidAmount = (grandTotal * paidPercentage) / 100;
    const remainingPercentage = 100 - paidPercentage;
    const remainingAmount = grandTotal - paidAmount;
    return {
      grandTotal,
      paidPercentage,
      paidAmount,
      remainingPercentage,
      remainingAmount,
    };
  };

  // ── SYNC % → ₹ ───────────────────────────────────────────
  const handlePercentageChange = (val) => {
    setPercentage(val);
    if (val === "" || val === null) {
      setRupees("");
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && selectedPI) {
      const grandTotal = getGrandTotal(selectedPI);
      setRupees(((grandTotal * num) / 100).toFixed(2));
    }
  };

  // ── SYNC ₹ → % ───────────────────────────────────────────
  const handleRupeesChange = (val) => {
    setRupees(val);
    if (val === "" || val === null) {
      setPercentage("");
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && selectedPI) {
      const grandTotal = getGrandTotal(selectedPI);
      if (grandTotal > 0) {
        setPercentage(parseFloat(((num / grandTotal) * 100).toFixed(4)));
      }
    }
  };

  // ── EXPORT EXCEL ──────────────────────────────────────────
  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const exportData = piData.map((item, index) => ({
        "No.": index + 1,
        "PI No": formatPINumber(index),
        "PI Date": item.pi_date
          ? new Date(item.pi_date).toLocaleDateString()
          : "",
        "Customer Name": item.customer_name || "",
        "Quotation No": item.quotation_no || "",
        Assignee: item.assignee || "",
        Total: item.total || "",
        "Proforma %": item.proforma_percentage || "",
        Status: item.status || "",
        "Created At": item.created_at
          ? new Date(item.created_at).toLocaleDateString()
          : "",
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
        `Proforma_(${now.toISOString().split("T")[0]})_${now.toTimeString().slice(0, 5)}.xlsx`,
      );
      toast.success("Excel exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      toast.error("Excel export failed");
    }
  };

  // ── EXPORT PDF (LIST) ─────────────────────────────────────
  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
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

  // ════════════════════════════════════════════════════════════════════
  // ── DOWNLOAD SINGLE PI PDF — Fixed Alignment Version ────────────────
  // ════════════════════════════════════════════════════════════════════
  const downloadPIPdf = async (item, globalIndex) => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // ── Colours ──────────────────────────────────────────────────────
      const orange = [255, 132, 0];
      const darkGray = [40, 40, 40];
      const lightBg = [248, 248, 248];
      const borderC = [220, 220, 220];
      const textGray = [100, 100, 100];
      const white = [255, 255, 255];
      const green = [22, 163, 74];

      const piNumber = formatPINumber(globalIndex);
      const grandTotal = getGrandTotal(item);
      const followUps = item.follow_ups || [];

      // ── Helper: horizontal rule ───────────────────────────────────────
      const hRule = (y, r = 220, g = 220, b = 220, lw = 0.2) => {
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(lw);
        doc.line(14, y, pageW - 14, y);
      };

      // ════════════════════════════════════════════════════════════════
      // 1. HEADER BANNER
      // ════════════════════════════════════════════════════════════════
      doc.setFillColor(...white);
      doc.rect(0, 0, pageW, 30, "F");

      // Company name
      const logo = new Image();
      logo.src = "/venster_logo.png";

      await new Promise((resolve) => {
        logo.onload = resolve;
      });

      doc.addImage(logo, "PNG", 14, 6, 38, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...darkGray);
      // doc.text("A QUALITY BUSINESS SOLUTIONS BRAND", 14, 27);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(...darkGray);
      // doc.text("Where Excellence Meets Professionalism", 14, 26);

      // Title right side
      doc.setTextColor(...orange);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("PROFORMA INVOICE", pageW - 14, 13, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...darkGray);
      const piDateStr = item.pi_date
        ? new Date(item.pi_date).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN");
      doc.text(`Date: ${piDateStr}`, pageW - 14, 21, { align: "right" });

      // Accent line
      doc.setFillColor(...darkGray);
      doc.rect(0, 30, pageW, 1.2, "F");

      // ════════════════════════════════════════════════════════════════
      // 2. PI NUMBER + STATUS BADGE STRIP
      // ════════════════════════════════════════════════════════════════
      doc.setFillColor(...lightBg);
      doc.rect(0, 31.2, pageW, 13, "F");

      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`PI No: ${piNumber}`, 14, 40);

      // ── WON badge ────────────────────────────────────────────────
      const badgeW = 32;
      const badgeH = 8;
      const badgeX = pageW - 14 - badgeW;
      const badgeY = 33.5;

      doc.setFillColor(...green);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");

      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("WON / PAID", badgeX + badgeW / 2, badgeY + 5.3, { align: "center" });

      // ════════════════════════════════════════════════════════════════
      // 3. COMPANY INFO + ORDER DETAILS (two-column card)
      // ════════════════════════════════════════════════════════════════
      const cardTop = 48;
      const cardH = 52;
      const colLeft = 14;
      const colMid = pageW / 2 + 2;
      const colRight = pageW - 14;

      // Card background
      doc.setFillColor(252, 252, 252);
      doc.setDrawColor(...borderC);
      doc.setLineWidth(0.3);
      doc.roundedRect(colLeft, cardTop, colRight - colLeft, cardH, 2, 2, "FD");

      // Column divider
      doc.setDrawColor(...borderC);
      doc.setLineWidth(0.3);
      doc.line(colMid, cardTop + 5, colMid, cardTop + cardH - 5);

      // ── LEFT: Bill To ─────────────────────────────────────────────
      doc.setTextColor(...orange);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("BILL TO / COMPANY INFO", colLeft + 6, cardTop + 9);

      doc.setDrawColor(...orange);
      doc.setLineWidth(0.5);
      doc.line(colLeft + 6, cardTop + 11, colLeft + 55, cardTop + 11);

      const leftLabelX = colLeft + 6;
      const leftValueX = colLeft + 36;

      const companyRows = [
        ["Customer:", item.customer_name || "N/A"],
        ["Assignee:", item.assignee || "N/A"],
        ["Quotation:", item.quotation_no || "N/A"],
        ["Created:", item.created_at
          ? new Date(item.created_at).toLocaleDateString("en-IN")
          : "N/A"],
      ];

      let cy = cardTop + 19;
      companyRows.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...darkGray);
        doc.text(label, leftLabelX, cy);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textGray);
        doc.text(String(val), leftValueX, cy);
        cy += 8;
      });

      // ── RIGHT: Order Details ──────────────────────────────────────
      const rightLabelX = colMid + 6;
      const rightValueX = colMid + 40;

      doc.setTextColor(...orange);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("ORDER DETAILS", rightLabelX, cardTop + 9);

      doc.setDrawColor(...orange);
      doc.setLineWidth(0.5);
      doc.line(rightLabelX, cardTop + 11, rightLabelX + 38, cardTop + 11);

      const orderRows = [
        ["PI Number:", piNumber],
        ["PI Date:", piDateStr],
        ["Grand Total:", `Rs. ${Number(grandTotal).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`],
        ["Total Paid %:", `${parseFloat(Number(item.proforma_percentage).toFixed(2))}%`],
      ];

      let oy = cardTop + 19;
      orderRows.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...darkGray);
        doc.text(label, rightLabelX, oy);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...textGray);
        doc.text(String(val), rightValueX, oy);
        oy += 8;
      });

      // ════════════════════════════════════════════════════════════════
      // 4. PAYMENT HISTORY TABLE
      // ════════════════════════════════════════════════════════════════
      const tableTop = cardTop + cardH + 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text("PAYMENT HISTORY", 14, tableTop);

      doc.setFillColor(...orange);
      doc.rect(14, tableTop + 1.5, 40, 0.8, "F");

      // Build rows
      const tableRows = [];

      const basePct = Number(item.proforma_percentage) || 0;
      const baseAmt = followUps.length === 0
        ? Number(item.total || 0)
        : (grandTotal * basePct) / 100;

      if (basePct > 0) {
        tableRows.push([
          "1",
          item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-IN")
            : "-",
          "Initial Payment",
          `${basePct}%`,
          `Rs. ${Number(baseAmt).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
          "Received",
        ]);
      }

      followUps.forEach((f, idx) => {
        const pct = Number(f.proforma_percentage || 0);
        const amt = Number(f.total || 0);
        tableRows.push([
          String(tableRows.length + 1),
          f.created_at
            ? new Date(f.created_at).toLocaleDateString("en-IN")
            : "-",
          `Follow-Up #${idx + 1}`,
          `${pct}%`,
          `Rs. ${Number(amt).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
          idx === followUps.length - 1 ? "Final" : "Received",
        ]);
      });

      if (tableRows.length === 0) {
        tableRows.push(["1", "-", "No payment records found", "-", "-", "-"]);
      }

      autoTable(doc, {
        startY: tableTop + 5,
        head: [["#", "Date", "Description", "Paid %", "Amount", "Status"]],
        body: tableRows,
        theme: "grid",
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
          textColor: darkGray,
          lineColor: borderC,
          lineWidth: 0.25,
          valign: "middle",
        },
        headStyles: {
          fillColor: orange,
          textColor: white,
          fontStyle: "bold",
          fontSize: 8.5,
          cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
          halign: "left",
        },
        alternateRowStyles: {
          fillColor: [255, 250, 244],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 28, halign: "left" },
          2: { cellWidth: "auto", halign: "left" },
          3: { cellWidth: 18, halign: "center" },
          4: { cellWidth: 42, halign: "right" },
          5: { cellWidth: 22, halign: "center", textColor: green, fontStyle: "bold" },
        },
        margin: { left: 14, right: 14 },
      });

      // ════════════════════════════════════════════════════════════════
      // 5. SUMMARY SECTION
      // ════════════════════════════════════════════════════════════════
      const summaryY = doc.lastAutoTable.finalY + 10;

      // ── Left: Thank you note ──────────────────────────────────────
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Thank you for your business!", 14, summaryY + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...textGray);
      doc.text("This is a system-generated document.", 14, summaryY + 17);
      doc.text("No signature is required.", 14, summaryY + 24);

      // ── Right: Summary card ───────────────────────────────────────
      const sCardW = 80;
      const sCardX = pageW - 14 - sCardW;
      const labelX = sCardX + 6;
      const valueX = sCardX + sCardW - 6;

      const paidAmt = (grandTotal * Number(item.proforma_percentage)) / 100;

      const summaryItems = [
        ["Grand Total", `Rs. ${Number(grandTotal).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`],
        ["Total Paid", `Rs. ${Number(paidAmt).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`],
        ["Follow-ups", `${followUps.length} record(s)`],
      ];

      const sCardH = summaryItems.length * 10 + 14;
      doc.setFillColor(252, 252, 252);
      doc.setDrawColor(...borderC);
      doc.setLineWidth(0.3);
      doc.roundedRect(sCardX, summaryY, sCardW, sCardH, 2, 2, "FD");

      let sY = summaryY + 10;
      summaryItems.forEach(([label, val]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...darkGray);
        doc.text(label, labelX, sY);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkGray);
        doc.text(val, valueX, sY, { align: "right" });

        doc.setDrawColor(...borderC);
        doc.setLineWidth(0.2);
        doc.line(sCardX + 4, sY + 3, sCardX + sCardW - 4, sY + 3);

        sY += 10;
      });

      // Final Status row — full orange highlight
      const finalRowY = summaryY + sCardH - 1;
      doc.setFillColor(...orange);
      doc.roundedRect(sCardX, finalRowY - 7, sCardW, 10, 2, 2, "F");

      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Final Status", labelX, finalRowY - 0.5);
      doc.text("WON / PAID", valueX, finalRowY - 0.5, { align: "right" });

      // ════════════════════════════════════════════════════════════════
      // 6. FOOTER
      // ════════════════════════════════════════════════════════════════
      doc.setFillColor(...orange);
      doc.rect(0, pageH - 12, 60, 12, "F");

      doc.setFillColor(...darkGray);
      doc.rect(60, pageH - 12, pageW - 60, 12, "F");

      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Venster Pvt. Ltd.", 8, pageH - 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(200, 200, 200);
      doc.text(
        `© ${new Date().getFullYear()} Venster Pvt. Ltd. — All rights reserved.   |   Generated: ${new Date().toLocaleDateString("en-IN")}`,
        pageW - 14,
        pageH - 4.5,
        { align: "right" }
      );

      // ════════════════════════════════════════════════════════════════
      // 7. SAVE
      // ════════════════════════════════════════════════════════════════
      const safeName = (item.customer_name || "Invoice")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 30);

      doc.save(`${piNumber}_${safeName}.pdf`);

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  };

  // ── ADD FOLLOW-UP ─────────────────────────────────────────
  const handleSubmitFollowUp = async () => {
    const newPercent = Number(percentage);
    if (!newPercent || newPercent <= 0) {
      toast.error("Please enter percentage");
      return;
    }
    const followUps = selectedPI.follow_ups || [];
    const existingTotal = followUps.reduce(
      (sum, f) => sum + Number(f.proforma_percentage),
      0,
    );
    const newTotal = existingTotal + newPercent;
    if (newTotal > 100) {
      toast.error("Total percentage cannot exceed 100%");
      return;
    }
    try {
      const res = await axios.post(
        `${API}/api/pi/add-followup/${selectedPI.pi_id}`,
        { percentage: newPercent },
      );
      const confirmedTotal = res.data?.total_percentage ?? newTotal;
      await updateStatus(selectedPI.pi_id, confirmedTotal);
      toast.success(
        confirmedTotal >= 100
          ? "Follow-up added & marked as Won!"
          : "Follow-up added successfully",
      );
      setShowModal(false);
      setPercentage("");
      setRupees("");
      setEditing(null);
      fetchPI();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── UPDATE FOLLOW-UP ──────────────────────────────────────
  const handleUpdate = async () => {
    const newPercent = Number(percentage);
    if (!newPercent || newPercent <= 0) {
      toast.error("Enter valid percentage");
      return;
    }
    const followUps = selectedPI.follow_ups || [];
    const totalExcludingEdited = followUps.reduce(
      (sum, f) =>
        f.id === editing.id ? sum : sum + Number(f.proforma_percentage),
      0,
    );
    const newTotal = totalExcludingEdited + newPercent;
    if (newTotal > 100) {
      toast.error("Total percentage cannot exceed 100%");
      return;
    }
    try {
      setUpdateLoading(true);
      await axios.put(
        `${API}/api/pi/update-followup/${selectedPI.pi_id}/${editing.id}`,
        { percentage: newPercent },
      );
      await updateStatus(selectedPI.pi_id, newTotal);
      toast.success(
        newTotal >= 100 ? "Updated & marked as Won!" : "Updated successfully",
      );
      setShowModal(false);
      setEditing(null);
      setPercentage("");
      setRupees("");
      fetchPI();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setPercentage(item.proforma_percentage);
  };


  // ================= PAGINATION =================

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = piData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(piData.length / itemsPerPage);

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


  return (
    <>
      <Header />

      <div className="bg-gray-100 min-h-screen">
        {/* ── BREADCRUMB + EXPORT ─────────────────────────── */}
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
                href="/sales/proforma"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
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
                <i className="bi bi-download text-base"></i>
                Export
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

        {/* ── FILTER SECTION ──────────────────────────────── */}
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
            ${showMobileFilters
              ? "absolute left-6 right-6 top-[170px] bg-white p-5 shadow-2xl rounded-lg grid grid-cols-2 gap-3 mt-1 z-[999] ring-2 ring-orange-300"
              : "hidden"
            }
            md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-3 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:ring-0
          `}
        >
          <input
            name="customer_name"
            value={filters.customer_name}
            onChange={handleFilterChange}
            placeholder="Customer"
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <input
            name="quotation_no"
            value={filters.quotation_no}
            onChange={handleFilterChange}
            placeholder="Quotation No"
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <select
            name="assignee"
            value={filters.assignee}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-400 text-sm"
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
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-400 text-sm"
          >
            <option value="">Status</option>
            <option value="draft">Draft</option>
            <option value="partial">Pending</option>
            <option value="paid">Won</option>
          </select>
          <div className="flex items-center px-2 w-full md:w-58 bg-white border border-orange-300 md:border rounded-sm text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 text-gray-400 whitespace-nowrap">From</span>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="p-2 w-full md:w-35 outline-none"
            />
          </div>
          <div className="flex items-center px-2 w-full md:w-53 bg-white border border-orange-300 md:border rounded-sm text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 text-gray-400 whitespace-nowrap">To</span>
            <input
              type="date"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
              className="p-2 w-full md:w-35 outline-none"
            />
          </div>
          <input
            type="number"
            name="min_percentage"
            value={filters.min_percentage}
            onChange={handleFilterChange}
            placeholder="Min %"
            min="0"
            max="100"
            className="p-2 w-full md:w-24 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <input
            type="number"
            name="max_percentage"
            value={filters.max_percentage}
            onChange={handleFilterChange}
            placeholder="Max %"
            min="0"
            max="100"
            className="p-2 w-full md:w-24 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <input
            type="number"
            name="min_total"
            value={filters.min_total}
            onChange={handleFilterChange}
            placeholder="Min Rs."
            className="p-2 w-full md:w-32 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <input
            type="number"
            name="max_total"
            value={filters.max_total}
            onChange={handleFilterChange}
            placeholder="Max Rs."
            className="p-2 w-full md:w-32 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-600 text-sm"
          />
          <div className="flex gap-2 col-span-2 md:col-span-1">
            <button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-semibold text-center px-6"
            >
              Clear
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm font-semibold text-center px-6"
            >
              Apply
            </button>
          </div>
        </div>

        {/* ── TABLE ────────────────────────────────────────── */}
        <div className="bg-white rounded-sm border border-gray-100 mx-7 py-2">
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
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">PI No</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">PI Date</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer Name</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quotation No</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Assignee</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">PI %</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Follow-Up</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Download</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item, index) => {
                        const globalIndex = indexOfFirstItem + index;
                        const isWon = item.status === "paid";
                        return (
                          <tr
                            key={item.pi_id}
                            className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                          >
                            <td className="py-3 px-3">{globalIndex + 1}</td>
                            <td className="py-3 px-3 font-medium text-gray-800">
                              {formatPINumber(globalIndex)}
                            </td>
                            <td className="py-3 px-3 text-gray-500">
                              {item.pi_date
                                ? new Date(item.pi_date).toLocaleDateString("en-IN")
                                : "-"}
                            </td>
                            <td className="py-3 px-3 text-orange-500">
                              {item.customer_name || "-"}
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              {item.quotation_no || "-"}
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
                            <td className="py-3 px-3 font-medium text-gray-800">
                              Rs.{Number(item.total).toLocaleString()}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${Number(item.proforma_percentage) >= 100 ? "bg-green-500" : Number(item.proforma_percentage) >= 50 ? "bg-orange-400" : "bg-blue-400"}`}
                                    style={{
                                      width: `${Math.min(Number(item.proforma_percentage), 100)}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="font-semibold text-gray-800 text-xs">
                                  {item.proforma_percentage}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`border rounded-sm px-3 py-1 text-xs font-semibold
                                  ${item.status === "paid" ? "border-green-200 bg-green-50 text-green-700" : ""}
                                  ${item.status === "partial" ? "border-orange-200 bg-orange-50 text-orange-700" : ""}
                                  ${item.status === "draft" ? "border-gray-200 bg-gray-50 text-gray-700" : ""}
                                  ${item.status === "sent" ? "border-blue-200 bg-blue-50 text-blue-700" : ""}
                                  ${item.status === "cancelled" ? "border-red-200 bg-red-50 text-red-700" : ""}
                                `}
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
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedPI(item);
                                  setEditing(null);
                                  setPercentage("");
                                  setRupees("");
                                  setActiveIndex(null);
                                  setShowModal(true);
                                }}
                                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center mx-auto hover:bg-gray-100 cursor-pointer"
                              >
                                <i className="bi bi-plus text-lg"></i>
                              </button>
                            </td>

                            {/* DOWNLOAD BUTTON — only for Won PIs */}
                            <td className="py-3 px-3 text-center">
                              {isWon ? (
                                <button
                                  onClick={() => downloadPIPdf(item, globalIndex)}
                                  title="Download PI PDF"
                                  className="group relative w-9 h-9 rounded-full border border-green-200 bg-green-50 flex items-center justify-center mx-auto hover:bg-green-500 hover:border-green-500 transition-all cursor-pointer"
                                >
                                  <i className="bi bi-file-earmark-pdf text-green-600 group-hover:text-white text-base transition-all"></i>
                                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Download PDF
                                  </span>
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-gray-500">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString("en-IN")
                                : "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="12" className="text-center py-10 text-gray-400">
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ── PAGINATION BAR ────────────────────────── */}
                {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
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

      {/* ── FOLLOW-UP MODAL ─────────────────────────────────── */}
      {showModal &&
        selectedPI &&
        (() => {
          const grandTotal = getGrandTotal(selectedPI);
          const basePaidPercentage = editing
            ? (selectedPI.follow_ups || []).reduce(
              (sum, f) =>
                f.id === editing.id ? sum : sum + Number(f.proforma_percentage),
              0,
            )
            : Number(selectedPI.proforma_percentage) || 0;
          const basePaidAmount = (grandTotal * basePaidPercentage) / 100;
          const baseRemainingPercentage = 100 - basePaidPercentage;
          const baseRemainingAmount = grandTotal - basePaidAmount;
          const paidPercentage = basePaidPercentage;
          const remainingPercentage = baseRemainingPercentage;
          const remainingAmount = baseRemainingAmount;
          const enteredPct = Number(percentage) || 0;
          const afterRemainingPct = remainingPercentage - enteredPct;
          const afterRemainingAmt = remainingAmount - (Number(rupees) || 0);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-[920px] rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Update Proforma Activities
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditing(null);
                      setPercentage("");
                      setRupees("");
                      setActiveIndex(null);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-orange-100 text-gray-400 hover:text-orange-500 transition-all"
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div className="flex flex-col md:flex-row">
                  {/* LEFT */}
                  <div className="w-full md:w-1/2 px-6 py-5 border-b md:border-b-0 md:border-r border-gray-100">
                    <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
                      {editing ? "Edit Follow-Up" : "Add New Follow-Up"}
                    </p>
                    <div className="space-y-1 text-sm mb-4">
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Customer</span>
                        <span className="font-medium text-gray-700">{selectedPI.customer_name}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Quotation</span>
                        <span className="font-medium text-gray-700">{selectedPI.quotation_no}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Grand Total</span>
                        <span className="font-semibold text-gray-800">
                          Rs.{Number(grandTotal).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          {editing ? "Other Entries Paid" : "Paid So Far"}
                        </span>
                        <span className="font-semibold text-orange-500">
                          {parseFloat(paidPercentage.toFixed(2))}% &nbsp;|&nbsp;
                          Rs.{Number(basePaidAmount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Remaining Card */}
                    <div
                      className={`rounded-xl p-3 mb-4 border transition-all ${afterRemainingPct < 0
                        ? "bg-red-50 border-red-200"
                        : afterRemainingPct === 0 && enteredPct > 0
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-100"
                        }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                        Remaining After This Entry
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <p
                            className={`text-xl font-bold ${afterRemainingPct < 0
                              ? "text-red-600"
                              : afterRemainingPct === 0 && enteredPct > 0
                                ? "text-green-600"
                                : "text-blue-600"
                              }`}
                          >
                            {enteredPct > 0
                              ? afterRemainingPct < 0
                                ? "Over!"
                                : `${parseFloat(afterRemainingPct.toFixed(2))}%`
                              : `${parseFloat(remainingPercentage.toFixed(2))}%`}
                          </p>
                          <p className="text-xs text-gray-400">Percentage</p>
                        </div>
                        <div className="w-px h-10 bg-gray-200"></div>
                        <div className="text-center">
                          <p
                            className={`text-xl font-bold ${afterRemainingPct < 0
                              ? "text-red-600"
                              : afterRemainingPct === 0 && enteredPct > 0
                                ? "text-green-600"
                                : "text-blue-600"
                              }`}
                          >
                            {enteredPct > 0
                              ? afterRemainingPct < 0
                                ? "Over!"
                                : `Rs.${Number(afterRemainingAmt).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                              : `Rs.${Number(remainingAmount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                          </p>
                          <p className="text-xs text-gray-400">Amount</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-white rounded-full h-2 border border-gray-200 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${afterRemainingPct < 0
                              ? "bg-red-500"
                              : paidPercentage + enteredPct >= 100
                                ? "bg-green-500"
                                : "bg-orange-400"
                              }`}
                            style={{ width: `${Math.min(paidPercentage + enteredPct, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            {editing ? "Others" : "Paid"}: {parseFloat(paidPercentage.toFixed(2))}%
                            {enteredPct > 0 && ` + ${parseFloat(enteredPct.toFixed(2))}% ${editing ? "edited" : "new"}`}
                          </span>
                          <span className="text-xs text-gray-400">100%</span>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Percentage <span className="text-orange-500">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={percentage}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") { handlePercentageChange(""); return; }
                              const num = Number(val);
                              if (num >= 0 && num <= 100) handlePercentageChange(num);
                            }}
                            className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:border-transparent outline-none bg-gray-50 transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Amount <span className="text-orange-500">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rs.</span>
                          <input
                            type="number"
                            min="0"
                            value={rupees}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") { handleRupeesChange(""); return; }
                              handleRupeesChange(Number(val));
                            }}
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:border-transparent outline-none bg-gray-50 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    {afterRemainingPct < 0 && enteredPct > 0 && (
                      <p className="text-xs text-red-500 mt-2 font-medium">
                        ⚠ Exceeds remaining by {parseFloat(Math.abs(afterRemainingPct).toFixed(2))}%
                      </p>
                    )}
                  </div>

                  {/* RIGHT - History */}
                  <div className="w-full md:w-1/2 px-6 py-5 flex flex-col bg-gray-50/50">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Follow-Up History</p>
                      <span className="text-xs bg-orange-50 text-orange-500 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
                        {selectedPI.follow_ups?.length || 0} record(s)
                      </span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-80">
                      {!selectedPI.follow_ups || selectedPI.follow_ups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                          <i className="bi bi-clock-history text-3xl mb-2"></i>
                          <p className="text-sm">No history found</p>
                        </div>
                      ) : (
                        selectedPI.follow_ups.map((h, index) => {
                          const isLatest = index === 0;
                          return (
                            <div key={h.id}>
                              <div
                                onClick={() => setActiveIndex(index === activeIndex ? null : index)}
                                className={`border rounded-xl p-3 cursor-pointer transition-all select-none ${isLatest
                                  ? "border-orange-400 bg-orange-50 shadow-sm"
                                  : "hover:bg-gray-50 border-gray-200"
                                  }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {isLatest && (
                                      <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold">Latest</span>
                                    )}
                                    <p className="font-semibold text-sm text-gray-700">
                                      {h.proforma_percentage}% → Rs.{Number(h.total).toLocaleString()}
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
                                <p className="text-xs text-gray-400 mt-1 truncate">NA</p>
                              </div>
                              {activeIndex === index && (
                                <div className="mt-2 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 text-sm shadow-sm">
                                  <div className="flex justify-between items-center mb-3">
                                    <p className="font-bold text-orange-500 text-xs uppercase tracking-wide">Details</p>
                                    <button onClick={() => setActiveIndex(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕ Close</button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                    <div>
                                      <p className="text-xs text-gray-400 font-medium">Percentage</p>
                                      <p className="font-semibold text-gray-700 text-sm mt-0.5">{h.proforma_percentage}%</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400 font-medium">Amount</p>
                                      <p className="font-semibold text-gray-700 text-sm mt-0.5">Rs.{Number(h.total).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400 font-medium">Date</p>
                                      <p className="font-semibold text-gray-700 text-sm mt-0.5">
                                        {new Date(h.created_at).toLocaleDateString("en-IN")}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
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
                    onClick={() => {
                      setShowModal(false);
                      setEditing(null);
                      setPercentage("");
                      setRupees("");
                      setActiveIndex(null);
                    }}
                    className="px-5 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editing ? handleUpdate : handleSubmitFollowUp}
                    disabled={afterRemainingPct < 0 && enteredPct > 0}
                    className={`px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md ${afterRemainingPct < 0 && enteredPct > 0
                      ? "bg-gray-300 cursor-not-allowed shadow-none"
                      : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                      }`}
                  >
                    {editing ? "Update Follow-Up" : "Add Follow-Up"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}