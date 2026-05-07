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

  // ── PAGINATION STATE ──────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);

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

  // ── PAGINATION LOGIC ──────────────────────────────────────
  const totalRecords = piData.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = piData.slice(startIndex, endIndex);

  const handleRecordsPerPageChange = (val) => {
    setRecordsPerPage(Number(val));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

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

  // ── EXPORT PDF ────────────────────────────────────────────
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
        item.total ? `₹${Number(item.total).toLocaleString()}` : "",
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
          ? "Follow-up added & marked as Won 🎉"
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
      setSubmitLoading(false); // ✅ ADD THIS
    }
  };
  // ===================================================
  // UPDATE FOLLOW-UP + AUTO STATUS
  // ===================================================
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
      setUpdateLoading(true); // ✅ ADD THIS

      await axios.put(
        `${API}/api/pi/update-followup/${selectedPI.pi_id}/${editing.id}`,
        { percentage: newPercent },
      );

      await updateStatus(selectedPI.pi_id, newTotal);
      toast.success(
        newTotal >= 100 ? "Updated & marked as Won 🎉" : "Updated successfully",
      );
      setShowModal(false);
      setEditing(null);
      setPercentage("");
      setRupees("");
      fetchPI();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdateLoading(false); // ✅ ADD THIS
    }
  };
  const handleEdit = (item) => {
    setEditing(item);
    setPercentage(item.proforma_percentage);
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
    ${
      showMobileFilters
        ? "absolute left-6 right-6 top-[170px] bg-white p-5 shadow-2xl rounded-lg grid grid-cols-2 gap-3 mt-1 z-[999] ring-2 ring-orange-300"
        : "hidden"
    }
    md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:ring-0
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
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-600 text-sm"
          />
          <select
            name="assignee"
            value={filters.assignee}
            onChange={handleFilterChange}
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-400 text-sm"
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
            className="p-2 w-full md:w-45 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-400 text-sm"
          >
            <option value="">Status</option>
            <option value="draft">Draft</option>
            <option value="partial">Pending</option>
            <option value="paid">Won</option>
          </select>
          <div className="flex items-center px-2 w-full md:w-58 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 text-gray-400 whitespace-nowrap">From</span>
            <input
              type="date"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
              className="p-2 w-full md:w-35 outline-none"
            />
          </div>
          <div className="flex items-center px-2 w-full md:w-53 bg-white border border-orange-300 md:border rounded-sm focus:outline-none text-gray-400 text-sm col-span-2 md:col-span-1">
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
            className="p-2 w-full md:w-24 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-600 text-sm"
          />
          <input
            type="number"
            name="max_percentage"
            value={filters.max_percentage}
            onChange={handleFilterChange}
            placeholder="Max %"
            min="0"
            max="100"
            className="p-2 w-full md:w-24 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-600 text-sm"
          />
          <input
            type="number"
            name="min_total"
            value={filters.min_total}
            onChange={handleFilterChange}
            placeholder="Min ₹"
            className="p-2 w-full md:w-32 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-600 text-sm"
          />
          <input
            type="number"
            name="max_total"
            value={filters.max_total}
            onChange={handleFilterChange}
            placeholder="Max ₹"
            className="p-2 w-full md:w-32 bg-white border border-orange-300 md:border rounded-sm focus:outline-none  text-gray-600 text-sm"
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
              // <div className="overflow-x-auto">
              //   <table className="w-full text-sm custom-scroll">
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
                        PI No
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        PI Date
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Quotation No
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        PI %
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Follow-Up
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item, index) => {
                        const globalIndex = startIndex + index;
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
                                ? new Date(item.pi_date).toLocaleDateString(
                                    "en-IN",
                                  )
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
                              ₹{Number(item.total).toLocaleString()}
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
                            <td className="py-3 px-3 text-gray-500">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString(
                                    "en-IN",
                                  )
                                : "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="11"
                          className="text-center py-10 text-gray-400"
                        >
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ── PAGINATION BAR ────────────────────────── */}
                {piData.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-3 border-t border-gray-100 mt-2 gap-3">
                    {/* Left: Records info + per-page dropdown */}
                    <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                      <span className="text-xs text-gray-400">
                        Showing{" "}
                        <span className="font-semibold text-gray-600">
                          {startIndex + 1}
                        </span>
                        {" – "}
                        <span className="font-semibold text-gray-600">
                          {Math.min(endIndex, totalRecords)}
                        </span>
                        {" of "}
                        <span className="font-semibold text-gray-600">
                          {totalRecords}
                        </span>
                        {hasActiveFilters ? " filtered" : ""} record(s)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">Show</span>
                        <select
                          value={recordsPerPage}
                          onChange={(e) =>
                            handleRecordsPerPageChange(e.target.value)
                          }
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-300 bg-white cursor-pointer"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={200}>200</option>
                        </select>
                        <span className="text-xs text-gray-400">per page</span>
                      </div>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="text-xs text-orange-500 hover:text-orange-600 font-semibold"
                        >
                          Clear filters ✕
                        </button>
                      )}
                    </div>

                    {/* Right: Page navigation */}
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1 mt-3 sm:mt-0">
                        {/* Prev */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all
                            ${currentPage === 1 ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500"}`}
                        >
                          <i className="bi bi-chevron-left text-xs"></i>
                        </button>

                        {/* Page numbers */}
                        {getPageNumbers().map((page, i) =>
                          page === "..." ? (
                            <span
                              key={`dots-${i}`}
                              className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all
                                ${
                                  currentPage === page
                                    ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200"
                                    : "border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500"
                                }`}
                            >
                              {page}
                            </button>
                          ),
                        )}

                        {/* Next */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all
                            ${currentPage === totalPages ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500"}`}
                        >
                          <i className="bi bi-chevron-right text-xs"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                  f.id === editing.id
                    ? sum
                    : sum + Number(f.proforma_percentage),
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
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          Customer
                        </span>
                        <span className="font-medium text-gray-700">
                          {selectedPI.customer_name}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          Quotation
                        </span>
                        <span className="font-medium text-gray-700">
                          {selectedPI.quotation_no}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          Grand Total
                        </span>
                        <span className="font-semibold text-gray-800">
                          ₹
                          {Number(grandTotal).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                          {editing ? "Other Entries Paid" : "Paid So Far"}
                        </span>
                        <span className="font-semibold text-orange-500">
                          {parseFloat(paidPercentage.toFixed(2))}% &nbsp;|&nbsp;
                          ₹
                          {Number(basePaidAmount).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Remaining Card */}
                    <div
                      className={`rounded-xl p-3 mb-4 border transition-all ${afterRemainingPct < 0 ? "bg-red-50 border-red-200" : afterRemainingPct === 0 && enteredPct > 0 ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-100"}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                        Remaining After This Entry
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <p
                            className={`text-xl font-bold ${afterRemainingPct < 0 ? "text-red-600" : afterRemainingPct === 0 && enteredPct > 0 ? "text-green-600" : "text-blue-600"}`}
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
                            className={`text-xl font-bold ${afterRemainingPct < 0 ? "text-red-600" : afterRemainingPct === 0 && enteredPct > 0 ? "text-green-600" : "text-blue-600"}`}
                          >
                            {enteredPct > 0
                              ? afterRemainingPct < 0
                                ? "Over!"
                                : `₹${Number(afterRemainingAmt).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                              : `₹${Number(remainingAmount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                          </p>
                          <p className="text-xs text-gray-400">Amount</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-white rounded-full h-2 border border-gray-200 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${afterRemainingPct < 0 ? "bg-red-500" : paidPercentage + enteredPct >= 100 ? "bg-green-500" : "bg-orange-400"}`}
                            style={{
                              width: `${Math.min(paidPercentage + enteredPct, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            {editing ? "Others" : "Paid"}:{" "}
                            {parseFloat(paidPercentage.toFixed(2))}%
                            {enteredPct > 0 &&
                              ` + ${parseFloat(enteredPct.toFixed(2))}% ${editing ? "edited" : "new"}`}
                          </span>
                          <span className="text-xs text-gray-400">100%</span>
                        </div>
                      </div>
                    </div>

                    {/* % and ₹ Inputs */}
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
                              if (val === "") {
                                handlePercentageChange("");
                                return;
                              }
                              const num = Number(val);
                              if (num >= 0 && num <= 100)
                                handlePercentageChange(num);
                            }}
                            className="w-full border border-gray-200 rounded-xl pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:border-transparent outline-none bg-gray-50 transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Amount <span className="text-orange-500">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={rupees}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                handleRupeesChange("");
                                return;
                              }
                              handleRupeesChange(Number(val));
                            }}
                            className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-sm focus:ring-1 focus:ring-orange-300 focus:border-transparent outline-none bg-gray-50 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    {afterRemainingPct < 0 && enteredPct > 0 && (
                      <p className="text-xs text-red-500 mt-2 font-medium">
                        ⚠ Exceeds remaining by{" "}
                        {parseFloat(Math.abs(afterRemainingPct).toFixed(2))}%
                      </p>
                    )}
                  </div>

                  {/* RIGHT - History */}
                  <div className="w-full md:w-1/2 px-6 py-5 flex flex-col bg-gray-50/50">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                        Follow-Up History
                      </p>
                      <span className="text-xs bg-orange-50 text-orange-500 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
                        {selectedPI.follow_ups?.length || 0} record(s)
                      </span>
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-80">
                      {!selectedPI.follow_ups ||
                      selectedPI.follow_ups.length === 0 ? (
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
                                onClick={() =>
                                  setActiveIndex(
                                    index === activeIndex ? null : index,
                                  )
                                }
                                className={`border rounded-xl p-3 cursor-pointer transition-all select-none ${isLatest ? "border-orange-400 bg-orange-50 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {isLatest && (
                                      <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
                                        Latest
                                      </span>
                                    )}
                                    <p className="font-semibold text-sm text-gray-700">
                                      {h.proforma_percentage}% → ₹
                                      {Number(h.total).toLocaleString()}
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
                                        className="text-gray-400 hover:text-orange-500 transition-all"
                                      >
                                        <i className="bi bi-pencil-square text-xs"></i>
                                      </button>
                                    )}
                                    <i
                                      className={`bi ${activeIndex === index ? "bi-chevron-up" : "bi-chevron-down"} text-gray-400 text-xs`}
                                    ></i>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  NA
                                </p>
                              </div>
                              {activeIndex === index && (
                                <div className="mt-2 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 text-sm shadow-sm">
                                  <div className="flex justify-between items-center mb-3">
                                    <p className="font-bold text-orange-500 text-xs uppercase tracking-wide">
                                      Details
                                    </p>
                                    <button
                                      onClick={() => setActiveIndex(null)}
                                      className="text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                      ✕ Close
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                    <div>
                                      <p className="text-xs text-gray-400 font-medium">
                                        Percentage
                                      </p>
                                      <p className="font-semibold text-gray-700 text-sm mt-0.5">
                                        {h.proforma_percentage}%
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400 font-medium">
                                        Amount
                                      </p>
                                      <p className="font-semibold text-gray-700 text-sm mt-0.5">
                                        ₹{Number(h.total).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400 font-medium">
                                        Date
                                      </p>
                                      <p className="font-semibold text-gray-700 text-sm mt-0.5">
                                        {new Date(
                                          h.created_at,
                                        ).toLocaleDateString("en-IN")}
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
                    className={`px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md ${afterRemainingPct < 0 && enteredPct > 0 ? "bg-gray-300 cursor-not-allowed shadow-none" : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"}`}
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
