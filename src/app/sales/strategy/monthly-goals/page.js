"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Button } from "../components/Button";
import Header from "@/app/components/header";
import StrategyNav from "../components/StrategyNav";
import CheckPermission from "@/app/components/CheckPermission";
import useAuth from "@/app/components/useAuth";
import { checkRole } from "@/utils/checkRole";
import { getCategoryStyles, getCategoryIconHTML } from "@/utils/CategoryThemeHelper";
import CategoryDisplay from "@/app/components/CategoryDisplay";
import { toast } from "react-toastify";
import { Select } from "../components/Select";
import { MonthSelect } from "../components/MonthSelect";

const MONTHS_ORDER = [
  { monthNumber: 4,  monthName: "April",     shortName: "APR", quarterNumber: 1 },
  { monthNumber: 5,  monthName: "May",       shortName: "MAY", quarterNumber: 1 },
  { monthNumber: 6,  monthName: "June",      shortName: "JUN", quarterNumber: 1 },
  { monthNumber: 7,  monthName: "July",      shortName: "JUL", quarterNumber: 2 },
  { monthNumber: 8,  monthName: "August",    shortName: "AUG", quarterNumber: 2 },
  { monthNumber: 9,  monthName: "September", shortName: "SEP", quarterNumber: 2 },
  { monthNumber: 10, monthName: "October",   shortName: "OCT", quarterNumber: 3 },
  { monthNumber: 11, monthName: "November",  shortName: "NOV", quarterNumber: 3 },
  { monthNumber: 12, monthName: "December",  shortName: "DEC", quarterNumber: 3 },
  { monthNumber: 1,  monthName: "January",   shortName: "JAN", quarterNumber: 4 },
  { monthNumber: 2,  monthName: "February",  shortName: "FEB", quarterNumber: 4 },
  { monthNumber: 3,  monthName: "March",     shortName: "MAR", quarterNumber: 4 },
];

const Q_STYLES = {
  1: {
    bannerBg: "bg-[#EEF4FF]",
    bannerText: "text-[#1a73e8]",
    bannerBorder: "border-[#E8EEF8]",
    thBorder: "border-[#E8EEF8]",
    thText: "text-[#1a73e8]",
    totalThBg: "bg-[#e8f0fe]",
    focusBg: "bg-[#DDE7FF]",
    focusBorder: "border-[#4F46E5]",
    focusRing: "ring-[#4F46E5]/20 shadow-[0_2px_4px_rgba(79,70,229,0.18)]",
    dirtyBg: "bg-[#CBD8FF]",
    dirtyBorder: "border-[#4F46E5]",
    dirtyTdBg: "bg-[#CBD8FF]/20",
    cellActiveBg: "bg-[#DBEAFE]",
  },
  2: {
    bannerBg: "bg-[#F0FDF4]",
    bannerText: "text-[#1e8e3e]",
    bannerBorder: "border-[#E8EEF8]",
    thBorder: "border-[#E8EEF8]",
    thText: "text-[#1e8e3e]",
    totalThBg: "bg-[#e6f4ea]",
    focusBg: "bg-[#DCFCE7]",
    focusBorder: "border-[#16A34A]",
    focusRing: "ring-[#16A34A]/20 shadow-[0_2px_4px_rgba(22,163,74,0.18)]",
    dirtyBg: "bg-[#BBF7D0]",
    dirtyBorder: "border-[#16A34A]",
    dirtyTdBg: "bg-[#BBF7D0]/20",
    cellActiveBg: "bg-[#DCFCE7]",
  },
  3: {
    bannerBg: "bg-[#FFF8E6]",
    bannerText: "text-[#b06000]",
    bannerBorder: "border-[#E8EEF8]",
    thBorder: "border-[#E8EEF8]",
    thText: "text-[#b06000]",
    totalThBg: "bg-[#fef7e0]",
    focusBg: "bg-[#FFEDD5]",
    focusBorder: "border-[#EA580C]",
    focusRing: "ring-[#EA580C]/20 shadow-[0_2px_4px_rgba(234,88,12,0.18)]",
    dirtyBg: "bg-[#FED7AA]",
    dirtyBorder: "border-[#EA580C]",
    dirtyTdBg: "bg-[#FED7AA]/20",
    cellActiveBg: "bg-[#FFEDD5]",
  },
  4: {
    bannerBg: "bg-[#FEF2F2]",
    bannerText: "text-[#c5221f]",
    bannerBorder: "border-[#E8EEF8]",
    thBorder: "border-[#E8EEF8]",
    thText: "text-[#c5221f]",
    totalThBg: "bg-[#fce8e6]",
    focusBg: "bg-[#FCE7F3]",
    focusBorder: "border-[#E11D48]",
    focusRing: "ring-[#E11D48]/20 shadow-[0_2px_4px_rgba(225,29,72,0.18)]",
    dirtyBg: "bg-[#FBCFE8]",
    dirtyBorder: "border-[#E11D48]",
    dirtyTdBg: "bg-[#FBCFE8]/20",
    cellActiveBg: "bg-[#FCE7F3]",
  },
};

// Category themes are now dynamically fetched from the database

function formatCurrency(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function MonthlyGoalsPage() {
  useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const canEdit = checkRole(["admin", "super admin", "leads management", "sales"]);

  const [financialYear, setFinancialYear] = useState("2026-2027");
  const availableYears = ["2025-2026", "2026-2027", "2027-2028", "2028-2029", "2029-2030"];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [cellGoals, setCellGoals] = useState({});
  const [originalGoals, setOriginalGoals] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [focusedCell, setFocusedCell] = useState(null);

  const [selectedMonthDetail, setSelectedMonthDetail] = useState(4);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const inputRefs = useRef({});

  // --- New state and refs for improved modal scroll experience ---
  const tableContainerRef = useRef(null);
  const customScrollbarRef = useRef(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(1100);
  const [modalScrollState, setModalScrollState] = useState({ left: false, right: true });
  const isSyncing = useRef(false);

  useEffect(() => {
    if (showDetailModal && tableContainerRef.current) {
       const observer = new ResizeObserver(() => {
          if (tableContainerRef.current) {
             setTableScrollWidth(tableContainerRef.current.scrollWidth);
             handleTableScroll();
          }
       });
       observer.observe(tableContainerRef.current);
       return () => observer.disconnect();
    }
  }, [showDetailModal, detailData]);

  const handleTableScroll = () => {
    if (!tableContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
    
    setModalScrollState({
      left: scrollLeft > 0,
      right: scrollLeft < scrollWidth - clientWidth - 2
    });

    if (!isSyncing.current && customScrollbarRef.current) {
      isSyncing.current = true;
      customScrollbarRef.current.scrollLeft = scrollLeft;
      requestAnimationFrame(() => { isSyncing.current = false; });
    }
  };

  const handleCustomScrollbarScroll = () => {
    if (!customScrollbarRef.current || !tableContainerRef.current) return;
    
    if (!isSyncing.current) {
      isSyncing.current = true;
      tableContainerRef.current.scrollLeft = customScrollbarRef.current.scrollLeft;
      requestAnimationFrame(() => { isSyncing.current = false; });
    }
  };

  const fetchGoalsMatrix = useCallback(async (fy) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/strategy/goals/${fy}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const matrix = data.data;
        setCategories(matrix.categories || []);
        const initial = {};
        (matrix.categories || []).forEach((cat) => {
          MONTHS_ORDER.forEach((m) => {
            const key = `${cat.categoryId}_${m.monthNumber}`;
            const goalEntry = cat.goals && cat.goals[String(m.monthNumber)];
            initial[key] = goalEntry ? Number(goalEntry.baseGoal || 0) : 0;
          });
        });
        setCellGoals(initial);
        setOriginalGoals({ ...initial });
        setIsDirty(false);
      } else {
        toast.error(data.message || "Failed to fetch Monthly Base Goals matrix");
      }
    } catch (err) {
      console.error("Error loading goals matrix:", err);
      toast.error("Network error while fetching goals matrix");
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchGoalsMatrix(financialYear);
  }, [financialYear, fetchGoalsMatrix]);

  const fetchMonthBreakdown = async (fy, mNum) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/strategy/month/${fy}/${mNum}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (data.success && data.data) setDetailData(data.data);
      else toast.error(data.message || "Failed to load month breakdown");
    } catch {
      toast.error("Network error while loading calculation breakdown");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenDetailModal = (mNum = selectedMonthDetail) => {
    setSelectedMonthDetail(mNum);
    setShowDetailModal(true);
    fetchMonthBreakdown(financialYear, mNum);
  };

  const enterEditMode = () => {
    if (!canEdit) {
      toast.error("You do not have permission to edit Base Goals.");
      return;
    }
    setEditMode(true);
    toast.info("Edit mode active — click inside any cell to update monthly base goals.", { autoClose: 3000 });
  };

  const cancelEditMode = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      setCellGoals({ ...originalGoals });
      setIsDirty(false);
      setEditMode(false);
      setFocusedCell(null);
    }
  };

  const handleCellChange = (categoryId, monthNumber, rawValue) => {
    const clean = rawValue.replace(/[^0-9]/g, "");
    const numValue = clean === "" ? 0 : Number(clean);
    const key = `${categoryId}_${monthNumber}`;
    const next = { ...cellGoals, [key]: numValue };
    setCellGoals(next);
    const dirty = Object.keys(next).some(
      (k) => Number(next[k] || 0) !== Number(originalGoals[k] || 0)
    );
    setIsDirty(dirty);
  };

  const handleKeyDown = (e, categoryId, monthNumber) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const currentIdx = MONTHS_ORDER.findIndex((m) => m.monthNumber === monthNumber);
      const nextMonth = MONTHS_ORDER[currentIdx + 1];
      if (nextMonth) {
        const nextKey = `${categoryId}_${nextMonth.monthNumber}`;
        inputRefs.current[nextKey]?.focus();
        inputRefs.current[nextKey]?.select();
      } else {
        const catIdx = categories.findIndex((c) => c.categoryId === categoryId);
        const nextCat = categories[catIdx + 1];
        if (nextCat) {
          const nextKey = `${nextCat.categoryId}_4`;
          inputRefs.current[nextKey]?.focus();
          inputRefs.current[nextKey]?.select();
        }
      }
    }
    if (e.key === "Escape") {
      e.target.blur();
      setFocusedCell(null);
    }
  };

  const handleReset = () => {
    setCellGoals({ ...originalGoals });
    setIsDirty(false);
    toast.info("Changes discarded — reset to last saved targets.");
  };

  const handleClearAll = () => {
    const cleared = {};
    categories.forEach((cat) => {
      for (let m = 1; m <= 12; m++) {
        cleared[`${cat.categoryId}_${m}`] = 0;
      }
    });
    setCellGoals(cleared);
    setIsDirty(true);
    toast.info("All amounts cleared. Click 'Save Goal' to apply changes.");
  };

  const handleBulkSave = async () => {
    if (!canEdit) { toast.error("No permission to modify Base Goals."); return; }
    if (!isDirty) { toast.info("No changes to save."); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const goalsPayload = [];
      categories.forEach((cat) => {
        MONTHS_ORDER.forEach((m) => {
          const key = `${cat.categoryId}_${m.monthNumber}`;
          goalsPayload.push({
            monthNumber: m.monthNumber,
            strategyCategoryId: cat.categoryId,
            baseGoalAmount: Number(cellGoals[key] || 0),
          });
        });
      });
      const res = await fetch(`${API_BASE}/api/strategy/goals/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          financialYear,
          reason: "Updated via Monthly Base Goals Matrix",
          goals: goalsPayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Monthly Base Goals saved successfully to MySQL!");
        await fetchGoalsMatrix(financialYear);
        setEditMode(false);
        setFocusedCell(null);
        if (showDetailModal) fetchMonthBreakdown(financialYear, selectedMonthDetail);
      } else {
        toast.error(data.message || "Failed to save Base Goals");
      }
    } catch {
      toast.error("Network error while saving Base Goals");
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    const catTotals = {};
    const monthTotals = {};
    const qTotals = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let grand = 0;
    MONTHS_ORDER.forEach((m) => { monthTotals[m.monthNumber] = 0; });
    categories.forEach((cat) => {
      let catSum = 0;
      const catQ = { 1: 0, 2: 0, 3: 0, 4: 0 };
      MONTHS_ORDER.forEach((m) => {
        const v = Number(cellGoals[`${cat.categoryId}_${m.monthNumber}`] || 0);
        catSum += v;
        catQ[m.quarterNumber] += v;
        monthTotals[m.monthNumber] += v;
        qTotals[m.quarterNumber] += v;
      });
      catTotals[cat.categoryId] = { annualTotal: catSum, quarters: catQ };
      grand += catSum;
    });
    return { categories: catTotals, months: monthTotals, quarters: qTotals, grandAnnualTotal: grand };
  }, [categories, cellGoals]);

  const hasExistingGoals = useMemo(() => {
    return Object.values(originalGoals || {}).some((val) => Number(val) > 0);
  }, [originalGoals]);

  return (
    <CheckPermission allowedRoles={["Admin", "Super Admin", "Sales", "Estimation", "Leads Management"]}>
      <div className="min-h-screen bg-[#f8f9fa] pb-24 font-sans text-slate-800">
        <Header />
        <StrategyNav />

        <main className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">

          <div className="bg-white rounded-md py-[20px] px-[36px] mb-8 border border-[#E2E8F0] shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-md bg-gradient-to-br from-[#3B82F6] to-[#6366F1] shadow-[0_4px_14px_rgba(59,130,246,0.35)] flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[40px] font-bold text-[#0F172A] tracking-tight leading-none whitespace-nowrap">
                    Monthly Goal Matrix
                  </h2>
                  <p className="text-[16px] font-medium text-[#64748B] mt-1.5">
                    Plan, manage, and review monthly sales goals across all strategy categories.
                  </p>
                  {editMode && (
                    <div className="mt-2.5">
                      <span className="inline-flex items-center bg-green-100 text-green-700 rounded-full text-xs font-bold px-4 h-[34px]">
                        ● Editing Mode Active
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto mt-4 lg:mt-0">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <span className="text-[15px] font-semibold text-slate-700 whitespace-nowrap">Financial Year:</span>
                  <div className="w-full sm:w-[140px] shrink-0">
                    <Select
                      value={financialYear}
                      onChange={(val) => { setFinancialYear(val); setEditMode(false); }}
                      options={availableYears.map(fy => ({ value: fy, label: fy }))}
                      disabled={loading || saving || editMode}
                      className="w-full h-[46px]"
                    />
                  </div>
                </div>

                {!editMode && (
                  <Button variant="secondary" onClick={() => handleOpenDetailModal(4)}>
    <svg className="w-4 h-4 text-[#2563EB] transition-transform duration-200 group-hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <span>Analyze Month</span>
  </Button>
                )}

                {canEdit && !editMode && (
                  <Button variant="secondary" onClick={enterEditMode} disabled={loading}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Goals
                  </Button>
                )}

                {editMode && (
                  <>
                    <Button variant="secondary" onClick={cancelEditMode} disabled={saving}>
                      ✕ Exit Editing
                    </Button>
                    <Button variant="secondary" onClick={handleReset} disabled={saving || !isDirty}>
                      ↺ Reset Changes
                    </Button>
                    <Button variant="danger" onClick={handleClearAll} disabled={saving}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All
                    </Button>
                    <button
                      type="button"
                      onClick={handleBulkSave}
                      disabled={saving || !isDirty}
                      
                     className={`group flex items-center justify-center gap-2 h-[42px] px-[18px] rounded-md text-[14px] font-semibold transition-all duration-200 shadow-[0_4px_14px_0_rgba(91,107,255,0.39)] hover:shadow-[0_6px_20px_rgba(91,107,255,0.23)] w-fit whitespace-nowrap focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-[linear-gradient(135deg,#5B6BFF_0%,#6B5CFF_45%,#7C3AED_100%)] text-white hover:brightness-110 active:brightness-95 hover:-translate-y-[1px] active:scale-[0.98] border border-transparent ${saving ? "opacity-50 pointer-events-none" : ""}`}>
                      ✓ Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-24 flex flex-col items-center justify-center text-slate-500">
                <svg className="animate-spin h-10 w-10 text-[#5C55FA] mb-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="font-bold text-[15px]">Loading {financialYear} Strategy Matrix...</p>
              </div>
            ) : (
              <div className="overflow-x-scroll w-full custom-scrollbar">
                <table className="min-w-max w-full border-collapse text-[13px]">
                  <thead className="sticky top-0 z-40 bg-[#0F172A] shadow-md">
                    <tr>
                      <th
                        rowSpan={2}
                        className="py-5 px-6 text-white text-left font-bold text-[11px] uppercase tracking-wider sticky left-0 z-30 border-r main-category-header"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span>Main Category</span>
                        </div>
                      </th>

                      {[1, 2, 3, 4].map((qNum) => {
                        const qs = Q_STYLES[qNum];
                        const labels = {
                          1: "Q1 (APR - JUN)",
                          2: "Q2 (JUL - SEP)",
                          3: "Q3 (OCT - DEC)",
                          4: "Q4 (JAN - MAR)",
                        };
                        const bannerClass = `q${qNum}-banner`;
                        return (
                          <th
                            key={`banner-q${qNum}`}
                            colSpan={4}
                            className={`py-3 px-4 ${qs.bannerBg} ${bannerClass} border-r border-[#E8EEF8]`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <svg className={`w-3.5 h-3.5 ${qs.bannerText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className={`font-bold text-[12px] uppercase tracking-wide ${qs.bannerText}`}>{labels[qNum]}</span>
                            </div>
                          </th>
                        );
                      })}

                      <th
                        rowSpan={2}
                        className="py-4 px-4 text-white font-bold text-[11px] uppercase tracking-wider text-center align-middle min-w-[120px] annual-banner"
                      >
                        Annual<br/>Total
                      </th>
                    </tr>

                    <tr>
                      {[1, 2, 3, 4].map((qNum) => {
                        const qs = Q_STYLES[qNum];
                        const qMonths = MONTHS_ORDER.filter((m) => m.quarterNumber === qNum);
                        return (
                          <React.Fragment key={`subhead-q${qNum}`}>
                            {qMonths.map((m) => (
                              <th
                                key={m.monthNumber}
                                onClick={() => !editMode && handleOpenDetailModal(m.monthNumber)}
                                className={`py-2 px-2 text-center bg-white border-r border-b ${qs.thBorder} month-header ${!editMode ? "cursor-pointer hover:bg-gray-50" : ""}`}
                              >
                                <div className="flex flex-col items-center">
                                  <span className={`font-bold text-[13px] uppercase ${qs.thText}`}>{m.shortName}</span>
                                  <span className={`text-[9px] ${qs.thText}`}>Q{qNum} (Detail)</span>
                                </div>
                              </th>
                            ))}
                            <th className={`py-2 px-3 text-center ${qs.totalThBg} border-r border-b border-[#E8EEF8]`}>
                              <span className={`font-bold text-[12px] uppercase ${qs.bannerText}`}>Q{qNum} Total</span>
                            </th>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {categories.map((cat, idx) => {
                      const catT = totals.categories[cat.categoryId] || { annualTotal: 0, quarters: { 1: 0, 2: 0, 3: 0, 4: 0 } };

                      return (
                        <tr key={cat.categoryId} className="border-b border-slate-200">
                          <td className="py-3 px-6 sticky left-0 bg-white z-20 border-r border-slate-200 category-cell transition-all duration-[180ms]">
                            <CategoryDisplay cat={cat} />
                          </td>

                          {[1, 2, 3, 4].map((qNum) => {
                            const qs = Q_STYLES[qNum];
                            const qMonths = MONTHS_ORDER.filter((m) => m.quarterNumber === qNum);
                            const qTotal = catT.quarters[qNum] || 0;
                            return (
                              <React.Fragment key={`cat${cat.categoryId}-q${qNum}`}>
                                {qMonths.map((m) => {
                                  const key = `${cat.categoryId}_${m.monthNumber}`;
                                  const cellVal = Number(cellGoals[key] || 0);
                                  const originalVal = Number(originalGoals[key] || 0);
                                  const isDirtyCell = cellVal !== originalVal;
                                  const isFocused = focusedCell === key;

                                  return (
                                    <td
                                      key={key}
                                      onDoubleClick={() => canEdit && !editMode && enterEditMode()}
                                      className={`py-2.5 px-2 text-center border-r ${qs.bannerBorder} month-cell transition-all duration-[180ms] ease-in-out ${editMode && isDirtyCell ? `dirty-cell ${qs.cellActiveBg}` : ""}`}
                                    >
                                      {editMode ? (
                                        <div className="relative">
                                          <input
                                            ref={(el) => { inputRefs.current[key] = el; }}
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={cellVal === 0 ? "" : cellVal}
                                            placeholder="0"
                                            onChange={(e) => handleCellChange(cat.categoryId, m.monthNumber, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, cat.categoryId, m.monthNumber)}
                                            onFocus={() => setFocusedCell(key)}
                                            onBlur={() => setFocusedCell(null)}
                                            className={`w-full text-center px-2 py-1.5 text-[14px] font-bold rounded border outline-none transition-all duration-[180ms] ease-in-out
                                              ${isFocused
                                                ? `${qs.focusBorder} bg-transparent text-[#0f172a] ring-2 ${qs.focusRing}`
                                                : isDirtyCell
                                                ? `${qs.dirtyBorder} bg-transparent text-[#0f172a] shadow-sm`
                                                : "border-slate-200 bg-white text-slate-800"
                                              } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                          />
                                        </div>
                                      ) : (
                                        <span className="font-bold text-[14px] text-slate-800">
                                          {cellVal === 0 ? "0" : cellVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className={`py-2.5 px-2 text-center font-bold text-[14px] border-r border-[#E8EEF8] ${qs.totalThBg} ${qs.thText}`}>
                                  {qTotal === 0 ? "0" : formatCurrency(qTotal)}
                                </td>
                              </React.Fragment>
                            );
                          })}
                          
                          <td className="py-2.5 px-4 text-center text-[14px] border-r border-slate-200 annual-total-col">
                            {catT.annualTotal === 0 ? "0" : formatCurrency(catT.annualTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot className="sticky bottom-0 z-40">
                    <tr>
                      <td className="py-5 px-6 font-extrabold text-[12px] text-[#28419a] uppercase sticky left-0 z-50 border-r border-slate-200 summary-cell">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#28419a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          TOTAL BASE GOALS
                        </div>
                      </td>
                      {[1, 2, 3, 4].map((qNum) => {
                        const qs = Q_STYLES[qNum];
                        const qMonths = MONTHS_ORDER.filter((m) => m.quarterNumber === qNum);
                        return (
                          <React.Fragment key={`foot-q${qNum}`}>
                            {qMonths.map((m) => (
                              <td
                                key={`foot-m-${m.monthNumber}`}
                                className={`py-5 px-2 text-center font-extrabold text-[14px] border-r ${qs.bannerBorder} ${qs.thText} summary-cell`}
                              >
                                {totals.months[m.monthNumber] === 0 ? "0" : formatCurrency(totals.months[m.monthNumber])}
                              </td>
                            ))}
                            <td className={`py-5 px-2 text-center font-extrabold text-[14px] border-r border-[#E8EEF8] ${qs.totalThBg} ${qs.thText} summary-cell-quarter`}>
                              {totals.quarters[qNum] === 0 ? "0" : formatCurrency(totals.quarters[qNum])}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="py-5 px-4 text-center text-[15px] border-r border-slate-200 summary-cell-quarter annual-total-col">
                        {totals.grandAnnualTotal === 0 ? "0" : formatCurrency(totals.grandAnnualTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>


        </main>

      {showDiscardConfirm && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
          style={{ 
            backgroundColor: "rgba(15, 23, 42, 0.20)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)"
          }}
        >
          <div className="bg-white rounded-md shadow-[0_20px_40px_rgba(15,23,42,0.15)] max-w-md w-full p-8 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#DC2626] flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Unsaved Changes</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  You have unsaved changes. If you leave now, your edits will not be saved.
                </p>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Button
                variant="secondary" onClick={() => setShowDiscardConfirm(false)}
                className="px-4 h-[42px]"
              >
                Continue Editing
              </Button>
              <button
                type="button" onClick={() => {
                  setCellGoals({ ...originalGoals });
                  setIsDirty(false);
                  setEditMode(false);
                  setFocusedCell(null);
                  setShowDiscardConfirm(false);
                }}
                className="px-4 py-2.5 text-white font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-md shadow-sm transition-colors cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-[96vw] max-h-[92vh] flex flex-col overflow-hidden">
            <div 
              className="text-white px-[28px] py-[20px] flex items-center justify-between border-b flex-shrink-0"
              style={{
                background: "linear-gradient(90deg, #0F172A 0%, #172554 45%, #1E293B 100%)",
                borderColor: "rgba(255, 255, 255, 0.08)",
                boxShadow: "0 8px 30px rgba(15, 23, 42, 0.18)",
                minHeight: "76px"
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-md flex items-center justify-center bg-gradient-to-br from-[#3B82F6] to-[#6366F1] shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-white/12 flex-shrink-0"
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <h3 className="text-[30px] font-extrabold text-white leading-none">
                    Month Strategy Calculation Breakdown
                  </h3>
                  <p className="text-[14px] text-white/72 leading-none">
                    Effective Goal = Base Goal + Incoming Shortfall − Excess Credit ± Quarter Reallocations
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-[180px]">
                  <MonthSelect
                    value={selectedMonthDetail}
                    onChange={(val) => {
                      const m = Number(val);
                      setSelectedMonthDetail(m);
                      fetchMonthBreakdown(financialYear, m);
                    }}
                    options={MONTHS_ORDER}
                    className="w-full h-[44px]"
                  />
                </div>
                
                <button type="button" onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none font-light mt-1">×</button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0 bg-white p-4 sm:p-6 overflow-hidden">
              {detailLoading || !detailData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 h-full min-h-[300px]">
                  <svg className="animate-spin h-8 w-8 text-[#5C55FA] mb-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm font-bold">Loading breakdown...</p>
                </div>
              ) : (
                <div className="relative flex flex-col flex-1 bg-white border border-[#E7EEF7] rounded-md shadow-sm overflow-hidden h-full">
                  
                  {/* Right shadow overlay */}
                  <div className={`absolute right-0 top-0 bottom-0 w-12 pointer-events-none transition-opacity duration-300 z-40 ${modalScrollState.right ? 'opacity-100' : 'opacity-0'}`} style={{ background: 'linear-gradient(to left, rgba(15,23,42,0.06), transparent)' }} />
                  
                  {/* Table Container - Vertically and Horizontally Scrollable */}
                  <div 
                     ref={tableContainerRef}
                     onScroll={handleTableScroll}
                     className="flex-1 overflow-auto hide-horizontal-scrollbar relative"
                  >
                     <table className="min-w-[1100px] w-full border-collapse text-sm breakdown-table">
                        <thead className="bg-[#EEF2FF] sticky top-0 z-30">
                          <tr className="h-[68px]">
                            <th className={`py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-left min-w-[220px] sticky left-0 bg-[#EEF2FF] z-40 transition-shadow duration-300 ${modalScrollState.left ? 'shadow-[6px_0_12px_rgba(0,0,0,0.06)] border-r border-[#E0E7FF]' : 'shadow-[1px_0_0_#E0E7FF]'}`}>Main Category</th>
                            <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right min-w-[140px]">Base Goal</th>
                            <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right min-w-[135px] leading-tight">+ Carry <br /> Shortfall</th>
                            <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right min-w-[135px] leading-tight">− Excess Credit</th>
                            <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right min-w-[155px] leading-tight">± Quarter <br /> Adjustments</th>
                            <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right min-w-[150px] leading-tight">= Effective <br /> Goal</th>
                            <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right min-w-[155px] leading-tight">Won <br /> Achievement</th>
                            <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right min-w-[135px]">Variance</th>
                            <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right min-w-[200px]">Closing Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7EEF7] bg-white text-right">
                          {(detailData.categories || []).map((cat, idx) => {
                            const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#FCFCFD]";
                            return (
                              <tr key={cat.strategyCategoryId} className={`breakdown-row ${rowBg} h-[74px]`}>
                                <td className={`py-4 pl-[22px] pr-[18px] text-left font-semibold text-slate-900 border border-[#E7EEF7] text-[18px] leading-[1.3] whitespace-nowrap align-middle sticky left-0 z-20 ${rowBg} transition-shadow duration-300 ${modalScrollState.left ? 'shadow-[6px_0_12px_rgba(0,0,0,0.06)] border-r border-[#E7EEF7]' : 'shadow-[1px_0_0_#E7EEF7]'}`}>{cat.categoryName}</td>
                                <td className="py-4 px-[18px] font-semibold text-slate-800 border border-[#E7EEF7] text-[16px] whitespace-nowrap align-middle">{formatCurrency(cat.baseGoal)}</td>
                                <td className="py-4 px-[18px] font-semibold text-red-600 border border-[#E7EEF7] text-[16px] whitespace-nowrap align-middle">{formatCurrency(cat.incomingShortfall)}</td>
                                <td className="py-4 px-[18px] font-semibold text-green-600 border border-[#E7EEF7] text-[16px] whitespace-nowrap align-middle">{formatCurrency(cat.incomingExcessCredit)}</td>
                                <td className="py-4 px-[18px] font-semibold text-blue-600 border border-[#E7EEF7] text-[16px] whitespace-nowrap align-middle">{formatCurrency(cat.quarterShortfallAddition - cat.quarterExcessReduction)}</td>
                                <td 
                                  className="py-4 px-[18px] font-bold text-blue-900 border border-[#E7EEF7] text-[16px] whitespace-nowrap align-middle"
                                  style={{ background: "linear-gradient(180deg, #F6FAFF 0%, #EDF4FF 100%)" }}
                                >
                                  {formatCurrency(cat.effectiveGoal)}
                                </td>
                                <td className="py-4 px-[18px] font-semibold text-green-600 border border-[#E7EEF7] text-[16px] whitespace-nowrap align-middle">{formatCurrency(cat.achievement)}</td>
                                <td className={`py-4 px-[18px] font-semibold border border-[#E7EEF7] text-[16px] whitespace-nowrap align-middle ${cat.variance > 0 ? "text-green-600" : cat.variance < 0 ? "text-red-600" : "text-slate-400"}`}>
                                  {formatCurrency(cat.variance)}
                                </td>
                                <td className="py-4 px-[18px] border border-[#E7EEF7] bg-[#F8FAFC]/30 text-[16px] align-middle">
                                  {cat.closingShortfall > 0 ? (
                                    <div className="flex flex-col items-end gap-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-red-100 text-red-700 whitespace-nowrap">
                                        Shortfall
                                      </span>
                                      <span className="text-[14px] text-red-600 font-bold whitespace-nowrap">
                                        {formatCurrency(cat.closingShortfall)}
                                      </span>
                                    </div>
                                  ) : cat.closingExcess > 0 ? (
                                    <div className="flex flex-col items-end gap-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-green-100 text-green-700 whitespace-nowrap">
                                        Excess
                                      </span>
                                      <span className="text-[14px] text-green-600 font-bold whitespace-nowrap">
                                        {formatCurrency(cat.closingExcess)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-end gap-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-slate-100 text-slate-600 whitespace-nowrap">
                                        Balanced
                                      </span>
                                      <span className="text-[14px] text-slate-400 font-bold whitespace-nowrap">
                                        ₹0
                                      </span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                     </table>
                  </div>
                  
                  {/* Dedicated Bottom Sticky Scrollbar Container */}
                  <div className="bg-[#F8FAFC] border-t border-[#E7EEF7] px-1 py-2 flex-shrink-0 z-40">
                     <div 
                       ref={customScrollbarRef}
                       onScroll={handleCustomScrollbarScroll}
                       className="strategy-bottom-scrollbar w-full"
                     >
                        <div style={{ width: `${tableScrollWidth}px`, height: '1px' }}></div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar {
          scrollbar-color: #4f46e5 #E5E7EB;
          scrollbar-width: auto;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
          display: block;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #E5E7EB;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4C508B !important;
          border-radius: 9999px;
        }

        /* New custom scrollbar for modal */
        .hide-horizontal-scrollbar {
          overflow-x: auto;
          overflow-y: auto;
        }
        .hide-horizontal-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 0px; /* Hide horizontal scrollbar but keep vertical */
        }
        .hide-horizontal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hide-horizontal-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        .strategy-bottom-scrollbar {
           overflow-x: auto;
           overflow-y: hidden;
        }
        .strategy-bottom-scrollbar::-webkit-scrollbar {
          height: 12px;
        }
        .strategy-bottom-scrollbar::-webkit-scrollbar-track {
          background: #E5E7EB;
          border-radius: 9999px;
          margin: 0 4px;
        }
        .strategy-bottom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #6366f1, #a855f7) !important;
          border-radius: 9999px;
        }
        .strategy-bottom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #4f46e5, #9333ea) !important;
        }

        /* Premium Row Hover on Month Cells Only */
        tbody tr td.month-cell {
          transition: background-color 180ms ease-in-out !important;
        }
        tbody tr:hover td.month-cell:not(.dirty-cell) {
          background-color: #F8FAFF !important;
        }

        /* Breakdown Modal Table styling */
        .breakdown-table {
          border-collapse: collapse !important;
          border: 1px solid #E7EEF7 !important;
          table-layout: auto !important;
        }
        .breakdown-table th {
          border: 1px solid #E7EEF7 !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .breakdown-table td {
          border: 1px solid #E7EEF7 !important;
        }
        .breakdown-row {
          transition: background-color 150ms ease-in-out !important;
        }
        .breakdown-row:hover td {
          background-color: rgba(59, 130, 246, 0.03) !important;
        }

        /* Summary Cells styling */
        .summary-cell {
          border-top: 1px solid #E2E8F0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background-color: #EEF4FF !important;
          box-shadow: inset 0 1px 0 rgba(59, 130, 246, 0.05) !important;
        }
        .summary-cell-quarter {
          border-top: 1px solid #E2E8F0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
          box-shadow: inset 0 1px 0 rgba(59, 130, 246, 0.05) !important;
        }
        
        /* Month Header Subtle Separator */
        .month-header {
          border-bottom: 2px solid rgba(148, 163, 184, 0.22) !important;
        }
        
        /* Divider color override */
        tbody tr td {
          border-bottom-color: #E9EEF8 !important;
          border-right-color: #E8EEF8 !important;
        }

        /* Subtle Category Column Hover */
        tbody tr:hover td.category-cell {
          background-color: #FAFCFF !important;
        }

        /* Quarter accent borders continuous implementation */
        .q1-banner {
          box-shadow: inset 0 2px 0 #3B82F6 !important;
        }
        .q2-banner {
          box-shadow: inset 0 2px 0 #22C55E !important;
        }
        .q3-banner {
          box-shadow: inset 0 2px 0 #F59E0B !important;
        }
        .q4-banner {
          box-shadow: inset 0 2px 0 #EF4444 !important;
        }
        .annual-banner {
          background: linear-gradient(180deg, #3E74E8 0%, #2F5FDB 100%) !important;
          box-shadow: inset 0 2px 0 #2563EB !important;
          border-left: 2px solid #D7E4FF !important;
        }
        
        .main-category-header {
          background: linear-gradient(180deg, #2948C7 0%, #3456D9 100%) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-right-color: #E8EEF8 !important;
        }
        
        .annual-total-col {
          background-color: #F8FAFF !important;
          color: #1E3A8A !important;
          font-weight: 700 !important;
          border-left: 2px solid #D7E4FF !important;
        }
      `}} />
      </div>
    </CheckPermission>
  );
}

