"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "../components/Button";
import Header from "@/app/components/header";
import StrategyNav from "../components/StrategyNav";
import { KPICard } from "@/app/components/KPICard";
import CheckPermission from "@/app/components/CheckPermission";
import useAuth from "@/app/components/useAuth";
import { checkRole } from "@/utils/checkRole";
import { getCategoryStyles, getCategoryIconHTML } from "@/utils/CategoryThemeHelper";
import CategoryDisplay from "@/app/components/CategoryDisplay";
import { toast } from "react-toastify";
import { Select } from "../components/Select";

const QUARTERS_META = [
  { quarterNumber: 1, label: "Q1 (Apr - Jun)", months: ["April", "May", "June"] },
  { quarterNumber: 2, label: "Q2 (Jul - Sep)", months: ["July", "August", "September"] },
  { quarterNumber: 3, label: "Q3 (Oct - Dec)", months: ["October", "November", "December"] },
  { quarterNumber: 4, label: "Q4 (Jan - Mar)", months: ["January", "February", "March"] }
];

// Category themes are now dynamically fetched from the database


const formatSmartCurrency = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const num = Number(val);
  if (isNaN(num)) return "";
  return num % 1 === 0 ? num.toLocaleString('en-IN') : num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export default function QuarterStrategyPage() {
  useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // Role permissions: Management / Admin only for editing reallocation
  const canEdit = checkRole(["admin", "super admin", "leads management", "sales"]);

  // FY & Quarter Selector state
  const [financialYear, setFinancialYear] = useState("2026-2027");
  const [quarterNumber, setQuarterNumber] = useState(1);
  const availableYears = ["2025-2026", "2026-2027", "2027-2028", "2028-2029", "2029-2030"];

  // Loading and data states
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAllocation, setLoadingAllocation] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [allocationData, setAllocationData] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null); // categoryId or null
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 }); // pixel position for fixed dropdown

  // Reallocation inputs state: map key `${categoryId}_${monthNumber}` -> string/number
  const [allocationInputs, setAllocationInputs] = useState({});
  const [originalAllocationInputs, setOriginalAllocationInputs] = useState({});
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [allocationReason, setAllocationReason] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [originalAllocationReason, setOriginalAllocationReason] = useState("");

  // UX & Micro-interactions state
  const [activeRowId, setActiveRowId] = useState(null);
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [animatingCategoryId, setAnimatingCategoryId] = useState(null);

  // Fetch Quarter Summary Data (Section A)
  const fetchQuarterSummary = async (fy = financialYear, q = quarterNumber) => {
    setLoadingSummary(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/strategy/quarter/${fy}/${q}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSummaryData(json.data);
      } else {
        toast.error(json.message || "Failed to fetch Quarter Summary");
      }
    } catch (err) {
      console.error("Error fetching quarter summary:", err);
      toast.error("Network error while loading quarter summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch Quarter Allocation Data (Section B)
  const fetchAllocationData = async (fy = financialYear, q = quarterNumber) => {
    setLoadingAllocation(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/strategy/quarter/${fy}/${q}/allocation`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      const json = await res.json();
      if (json.success) {
        setAllocationData(json);

        // Populate initial allocation inputs
        const initialInputs = {};
        const targetMonths = json.targetMonths || [];
        (json.categories || []).forEach(cat => {
          targetMonths.forEach(m => {
            const key = `${cat.categoryId}_${m.monthNumber}`;
            const val = cat.currentAllocation && cat.currentAllocation[m.monthNumber] !== undefined
              ? Number(cat.currentAllocation[m.monthNumber])
              : 0;
            initialInputs[key] = val;
          });
        });
        setAllocationInputs(initialInputs);
        setOriginalAllocationInputs(initialInputs);
        setAllocationReason(json.note || "");
        setOriginalAllocationReason(json.note || "");
      } else {
        toast.error(json.message || "Failed to fetch Quarter Allocation data");
      }
    } catch (err) {
      console.error("Error fetching allocation data:", err);
      toast.error("Network error while loading allocation data");
    } finally {
      setLoadingAllocation(false);
    }
  };

  useEffect(() => {
    fetchQuarterSummary(financialYear, quarterNumber);
    fetchAllocationData(financialYear, quarterNumber);
  }, [financialYear, quarterNumber]);

  const toggleExpand = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleInputChange = (catId, monthNumber, valStr) => {
    const key = `${catId}_${monthNumber}`;
    setAllocationInputs(prev => ({ ...prev, [key]: valStr }));
  };

  // Quick action: Equal Split for one category
  const handleEqualSplitCategory = (catId, closingAmt, targetMonths) => {
    if (closingAmt <= 0 || targetMonths.length === 0) return;
    const baseShare = Math.floor((closingAmt / targetMonths.length) * 100) / 100;
    const remainder = Math.round((closingAmt - baseShare * targetMonths.length) * 100) / 100;

    const newInputs = { ...allocationInputs };
    targetMonths.forEach((m, idx) => {
      const key = `${catId}_${m.monthNumber}`;
      newInputs[key] = idx === 0 ? Math.round((baseShare + remainder) * 100) / 100 : baseShare;
    });
    setAllocationInputs(newInputs);
    setAnimatingCategoryId(catId);
    setTimeout(() => setAnimatingCategoryId(null), 400);
    toast.info("Split equally across target months");
  };

  // Quick action: All to Month 1
  const handleAllToFirstMonth = (catId, closingAmt, targetMonths) => {
    if (closingAmt <= 0 || targetMonths.length === 0) return;
    const newInputs = { ...allocationInputs };
    targetMonths.forEach((m, idx) => {
      const key = `${catId}_${m.monthNumber}`;
      newInputs[key] = idx === 0 ? closingAmt : 0;
    });
    setAllocationInputs(newInputs);
    setAnimatingCategoryId(catId);
    setTimeout(() => setAnimatingCategoryId(null), 400);
    toast.info(`Allocated ₹${formatSmartCurrency(closingAmt)} to ${targetMonths[0].monthName}`);
  };

  // Quick action: Equal Split All Categories
  const handleEqualSplitAll = () => {
    if (!allocationData || !allocationData.categories) return;
    const targetMonths = allocationData.targetMonths || [];
    if (targetMonths.length === 0) return;

    const newInputs = { ...allocationInputs };
    allocationData.categories.forEach(cat => {
      if (cat.closingBalanceType !== "BALANCED" && cat.closingBalanceAmount > 0) {
        const closingAmt = Number(cat.closingBalanceAmount);
        const baseShare = Math.floor((closingAmt / targetMonths.length) * 100) / 100;
        const remainder = Math.round((closingAmt - baseShare * targetMonths.length) * 100) / 100;

        targetMonths.forEach((m, idx) => {
          const key = `${cat.categoryId}_${m.monthNumber}`;
          newInputs[key] = idx === 0 ? Math.round((baseShare + remainder) * 100) / 100 : baseShare;
        });
      }
    });
    setAllocationInputs(newInputs);
    setAnimatingCategoryId("ALL");
    setTimeout(() => setAnimatingCategoryId(null), 400);
    toast.success("Applied equal split across all active categories");
  };

  // Reset Changes to last saved allocation plan
  const handleResetChanges = () => {
    setAllocationInputs({ ...originalAllocationInputs });
    setAllocationReason(originalAllocationReason || "");
    toast.info("Changes discarded — reset to last saved allocation plan.");
  };

  // Quick action: Clear All to ₹0
  const handleClearAll = () => {
    if (!allocationData || !allocationData.categories) return;
    const targetMonths = allocationData.targetMonths || [];
    if (targetMonths.length === 0) return;

    const newInputs = { ...allocationInputs };
    allocationData.categories.forEach(cat => {
      if (cat.closingBalanceType !== "BALANCED" && cat.closingBalanceAmount > 0) {
        targetMonths.forEach(m => {
          const key = `${cat.categoryId}_${m.monthNumber}`;
          newInputs[key] = 0;
        });
      }
    });
    setAllocationInputs(newInputs);
    toast.info("Cleared all allocation inputs to ₹0");
  };

  // Validate Reallocation Plan for Preview
  const handlePreviewAllocation = () => {
    if (!canEdit) return;
    if (!allocationData || !allocationData.categories) return;

    const targetMonths = allocationData.targetMonths || [];
    for (const cat of allocationData.categories) {
      if (cat.closingBalanceType === "BALANCED") continue;

      let totalAllocated = 0;
      targetMonths.forEach(m => {
        const key = `${cat.categoryId}_${m.monthNumber}`;
        totalAllocated += Number(allocationInputs[key] || 0);
      });

      totalAllocated = Math.round(totalAllocated * 100) / 100;
      const required = Math.round(cat.closingBalanceAmount * 100) / 100;

      if (Math.abs(totalAllocated - required) > 0.01) {
        toast.error(`Category ${cat.categoryName} must equal its closing balance exactly. Currently off by ₹${formatSmartCurrency(Math.abs(required - totalAllocated))}`);
        return;
      }
    }
    
    setShowPreviewModal(true);
  };

  // Submit Reallocation Plan
  const handleSaveReallocation = async () => {
    if (!canEdit) {
      toast.error("You do not have permission to modify quarter allocations.");
      return;
    }
    if (!allocationData || !allocationData.categories) return;

    const targetMonths = allocationData.targetMonths || [];
    const payloadAllocations = [];

    for (const cat of allocationData.categories) {
      const monthsPayload = {};
      let totalCatAlloc = 0;

      targetMonths.forEach(m => {
        const key = `${cat.categoryId}_${m.monthNumber}`;
        const rawVal = allocationInputs[key];
        const numVal = Number(rawVal || 0);
        monthsPayload[m.monthNumber] = isNaN(numVal) || numVal < 0 ? 0 : Math.round(numVal * 100) / 100;
        totalCatAlloc = Math.round((totalCatAlloc + monthsPayload[m.monthNumber]) * 100) / 100;
      });

      if (cat.closingBalanceType !== "BALANCED") {
        if (Math.abs(totalCatAlloc - cat.closingBalanceAmount) > 0.009) {
          toast.error(
            `Mismatch for '${cat.categoryName}': Total allocated (₹${formatSmartCurrency(totalCatAlloc)}) must equal the closing ${cat.closingBalanceType.toLowerCase()} balance (₹${formatSmartCurrency(cat.closingBalanceAmount)}).`
          );
          return;
        }
      }

      payloadAllocations.push({
        strategyCategoryId: cat.categoryId,
        months: monthsPayload
      });
    }

    setSavingAllocation(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/strategy/quarter/allocate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          sourceFinancialYear: financialYear,
          sourceQuarterNumber: quarterNumber,
          reason: allocationReason.trim() || `Reallocation from Q${quarterNumber} closing balance`,
          allocations: payloadAllocations
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(`Quarter allocation ${result.action.toLowerCase()} successfully! (${result.created} created, ${result.replaced} replaced)`);
        setAllocationReason("");
        setRecentlySaved(true);
        setTimeout(() => setRecentlySaved(false), 2000);
        await fetchQuarterSummary(financialYear, quarterNumber);
        await fetchAllocationData(financialYear, quarterNumber);
      } else {
        toast.error(result.message || "Failed to save quarter reallocation plan");
      }
    } catch (err) {
      console.error("Error saving quarter reallocation:", err);
      toast.error("Network error while submitting reallocation");
    } finally {
      setSavingAllocation(false);
    }
  };

  return (
    <CheckPermission allowedRoles={["Admin", "Super Admin", "Sales", "Estimation", "Leads Management", "Proforma invoices"]}>
      <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
        <Header />
        <StrategyNav />

        <main className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
          {/* Header Controls & Quarter Summary combined in one single card */}
          <div className="bg-white rounded-md p-7 mb-6 border border-slate-200/80 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-md bg-[linear-gradient(135deg,#5B6BFF_0%,#6B5CFF_45%,#7C3AED_100%)] shadow-[0_4px_14px_0_rgba(91,107,255,0.39)] flex items-center justify-center text-white flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[22px] font-bold text-[#0F172A] tracking-tight leading-tight">
                    Quarter Reallocation Matrix
                  </h2>
                  <p className="text-sm text-slate-500 font-normal leading-relaxed">
                    Review quarterly performance and allocate closing balances for the next quarter.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-5 shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Financial Year</span>
                  <div className="w-full sm:w-[140px] shrink-0">
                    <Select
                      value={financialYear}
                      onChange={setFinancialYear}
                      options={availableYears.map(fy => ({ value: fy, label: fy }))}
                      className="w-full h-[40px]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Quarter</span>
                  <div className="w-full sm:w-[140px] shrink-0">
                    <Select
                      value={quarterNumber}
                      onChange={(val) => setQuarterNumber(Number(val))}
                      options={QUARTERS_META.map(q => ({ value: String(q.quarterNumber), label: q.label }))}
                      className="w-full h-[40px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quarter Overview Metric Cards */}
            {summaryData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">

                {/* Card 1: Quarter Base Goal */}
                <KPICard
                  theme="neutralBlue"
                  label="Base Goal"
                  amount={`₹${formatSmartCurrency(summaryData.totals?.totalBaseGoal || 0)}`}
                  subtitle="Total target for this quarter"
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" />
                    </svg>
                  }
                />

                {/* Card 2: Quarter Effective Goal */}
                <KPICard
                  theme="blue"
                  label="Effective Goal"
                  amount={`₹${formatSmartCurrency(summaryData.totals?.totalEffectiveGoal || 0)}`}
                  subtitle="Target after adjustments"
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                />

                {/* Card 3: Quarter Won Revenue */}
                <KPICard
                  theme="green"
                  label="Won Revenue"
                  amount={`₹${formatSmartCurrency(summaryData.totals?.totalAchievement || 0)}`}
                  subtitle="Revenue achieved"
                  icon={
                    <span className="text-[20px] font-bold leading-none">₹</span>
                  }
                />

                {/* Card 4: Total Closing Shortfall */}
                <KPICard
                  theme="red"
                  label="Closing Shortfall"
                  amount={`₹${formatSmartCurrency(summaryData.totals?.totalFinalClosingShortfall || 0)}`}
                  subtitle="Pending reallocation"
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  }
                />

                {/* Card 5: Total Closing Excess */}
                <KPICard
                  theme="green"
                  label="Closing Excess"
                  amount={`₹${formatSmartCurrency(summaryData.totals?.totalFinalClosingExcess || 0)}`}
                  subtitle="Available carry-forward"
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  }
                />

              </div>
            )}
          </div>

          {/* Stale Allocation Banner */}
          {allocationData?.isStale && (
            <div className="bg-amber-50 border border-amber-200 p-5 mb-8 rounded-md shadow-sm flex items-start justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0 text-amber-500 text-xl font-bold mr-3">⚠️</div>
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Stale Allocation Plan Detected</h3>
                  <p className="text-xs text-amber-700 mt-1 font-medium leading-relaxed">
                    Historical quotation achievements or base goals have changed since this quarter's closing balance was last allocated. Please review and re-save the reallocation plan below to update destination quarter adjustments (`is_active=1`).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION A: QUARTER STRATEGY SUMMARY TABLE */}
          <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden mb-6 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <div className="px-6 py-5 border-b border-[#E8EEF7] bg-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Quarter Performance Summary</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">Review quarterly goals, achievements, and closing balances across all sales categories.</p>
              </div>
            </div>

            {loadingSummary ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
                      <div className="flex-1 space-y-2.5">
                        <div className="h-4 bg-slate-100 rounded-md animate-pulse w-1/3"></div>
                        <div className="h-3 bg-slate-100 rounded-md animate-pulse w-1/4"></div>
                      </div>
                      <div className="h-5 bg-slate-100 rounded-md animate-pulse w-[12%]"></div>
                      <div className="h-5 bg-slate-100 rounded-md animate-pulse w-[12%]"></div>
                      <div className="h-5 bg-slate-100 rounded-md animate-pulse w-[12%]"></div>
                      <div className="h-5 bg-slate-100 rounded-md animate-pulse w-[15%]"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !summaryData ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-slate-700 mb-1">No Summary Data</h4>
                <p className="text-sm text-slate-500 max-w-[300px]">There is no summary data available for the selected quarter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full custom-scrollbar shadow-sm rounded-md border border-[#E0E7FF]">
                <table className="min-w-[1000px] w-full border-collapse text-sm table-auto">
                  <thead className="bg-[#EEF2FF] border-b border-[#E0E7FF] sticky top-0 z-20">
                    <tr>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-left align-middle sticky left-0 bg-[#EEF2FF] z-30 shadow-[1px_0_0_#E0E7FF]">CATEGORY</th>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">BASE GOAL</th>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">
                        EFFECTIVE GOAL
                      </th>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">ACHIEVEMENT</th>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">
                        VARIANCE
                      </th>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">
                        CLOSING BALANCE
                      </th>
                      <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">BREAKDOWN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF7] bg-white">
                    {(summaryData.categories || []).map((cat) => {
                      const isExpanded = expandedCategories[cat.categoryId];
                      const closingAmt = cat.finalClosingShortfall > 0
                        ? cat.finalClosingShortfall
                        : cat.finalClosingExcess > 0
                        ? cat.finalClosingExcess
                        : 0;
                      const closingType = cat.finalClosingShortfall > 0
                        ? "SHORTFALL"
                        : cat.finalClosingExcess > 0
                        ? "EXCESS"
                        : "BALANCED";

                      const varianceVal = Number(cat.quarterAchievement || 0) - Number(cat.quarterEffectiveGoal || 0);

                      return (
                        <React.Fragment key={cat.categoryId}>
                          <tr className="group hover:bg-[#F8FBFF] relative transition-all duration-200 border-b border-[#E8EEF7] cursor-pointer h-[62px]" onClick={() => toggleExpand(cat.categoryId)}>
                            <td className="px-6 py-2.5 font-semibold text-[#0F172A] relative bg-white group-hover:bg-[#F8FBFF] sticky left-0 z-10 shadow-[1px_0_0_#E0E7FF] before:absolute before:left-0 before:top-0 before:h-full before:w-[4px] before:bg-[#2563EB] before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-200">
                              <div className="flex items-center gap-4">
                                <CategoryDisplay cat={cat} />
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-center text-[17px] font-bold leading-[24px] text-slate-700 whitespace-nowrap">
                              ₹{formatSmartCurrency(cat.quarterBaseGoal || 0)}
                            </td>
                            <td className="px-4 py-2.5 text-center text-[17px] font-bold leading-[24px] text-blue-800 whitespace-nowrap">
                              ₹{formatSmartCurrency(cat.quarterEffectiveGoal || 0)}
                            </td>
                            <td className="px-4 py-2.5 text-center text-[17px] font-bold leading-[24px] text-green-700 whitespace-nowrap">
                              ₹{formatSmartCurrency(cat.quarterAchievement || 0)}
                            </td>
                            <td className={`px-4 py-2.5 text-center text-[17px] font-bold leading-[24px] whitespace-nowrap ${
                              varianceVal >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {varianceVal < 0 ? `₹-${formatSmartCurrency(Math.abs(varianceVal))}` : `₹${formatSmartCurrency(varianceVal)}`}
                            </td>
                            <td className="px-6 py-2.5 text-center">
                              {closingType === "SHORTFALL" && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-red-100 text-red-800 whitespace-nowrap">
                                  <span className="text-[13px] font-semibold">Shortfall:</span>
                                  <span className="text-[15px] font-bold">₹{formatSmartCurrency(closingAmt)}</span>
                                </span>
                              )}
                              {closingType === "EXCESS" && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                                  <span className="text-[13px] font-semibold">Excess:</span>
                                  <span className="text-[15px] font-bold">₹{formatSmartCurrency(closingAmt)}</span>
                                </span>
                              )}
                              {closingType === "BALANCED" && (
                                <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-slate-100 text-slate-600 whitespace-nowrap">
                                  <span className="text-[13px] font-semibold">Balanced</span>
                                  <span className="text-[15px] font-bold">(₹0)</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <Button
    variant="secondary"
    onClick={(e) => { e.stopPropagation(); toggleExpand(cat.categoryId); }}
  >
    <span>{isExpanded ? "Hide Details" : "View Details"}</span>
    <svg className={`w-4 h-4 text-current transition-transform duration-200 ${isExpanded ? 'group-hover:-translate-y-0.5' : 'group-hover:translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      {isExpanded ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      )}
    </svg>
  </Button>
                            </td>
                          </tr>

                          {/* Expanded Drawer for Monthly Rolling Sequence */}
                          {isExpanded && (
                            <tr className="bg-slate-50/30 border-t border-b border-[#E8EEF7]">
                              <td colSpan={7} className="px-6 py-5">
                                <div className="bg-white rounded-md border border-[#E8EEF7] p-5 shadow-sm">
                                  <h4 className="text-sm font-bold text-slate-700 tracking-wide mb-5">
                                    {cat.categoryName} · Monthly Breakdown (Q{quarterNumber})
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(cat.monthsSequence || []).map((m) => (
                                      <div key={m.monthNumber} className="group border border-[#E8EEF7] rounded-md p-4 text-xs bg-white shadow-sm hover:bg-[#F8FBFF] hover:shadow-[0_4px_12px_-2px_rgba(37,99,235,0.08)] hover:border-[#2563EB]/20 transition-all duration-200 relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-[4px] before:bg-[#2563EB] before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-200">
                                        <div className="font-bold text-slate-800 border-b border-slate-100 pb-2.5 mb-3 flex justify-between items-center">
                                          <span className="text-sm font-bold text-[#0F172A]">{m.monthName}</span>
                                        </div>
                                        <div className="space-y-2 text-slate-600">
                                          <div className="flex justify-between items-center px-2 py-1">
                                            <span className="font-medium text-slate-500">Base Goal</span>
                                            <span className="font-bold text-slate-800">₹{formatSmartCurrency(m.baseGoal || 0)}</span>
                                          </div>
                                          {(m.incomingShortfall > 0 || m.incomingExcessCredit > 0) && (
                                            <div className="flex justify-between items-center px-2 py-1">
                                              <span className="font-medium text-slate-500">Carry Forward</span>
                                              <span className={`font-bold ${m.incomingShortfall > 0 ? 'text-red-600' : m.incomingExcessCredit > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                {m.incomingShortfall > 0 ? `+₹${formatSmartCurrency(m.incomingShortfall)}` : `-₹${formatSmartCurrency(m.incomingExcessCredit)}`}
                                              </span>
                                            </div>
                                          )}
                                          {(m.quarterShortfallAddition > 0 || m.quarterExcessReduction > 0) && (
                                            <div className="flex justify-between items-center px-2 py-1">
                                              <span className="font-medium text-slate-500">Carry Forward</span>
                                              <span className={`font-bold ${m.quarterShortfallAddition > 0 ? 'text-red-600' : m.quarterExcessReduction > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                {m.quarterShortfallAddition > 0 ? `+₹${formatSmartCurrency(m.quarterShortfallAddition)}` : `-₹${formatSmartCurrency(m.quarterExcessReduction)}`}
                                              </span>
                                            </div>
                                          )}
                                          
                                          <div className="my-2 border-t border-slate-100"></div>
                                          
                                          <div className="flex justify-between items-center bg-blue-50/60 rounded-md px-2 py-1.5">
                                            <span className="font-medium text-blue-800">Effective Goal</span>
                                            <span className="font-bold text-blue-900">₹{formatSmartCurrency(m.effectiveGoal || 0)}</span>
                                          </div>
                                          
                                          <div className="flex justify-between items-center bg-emerald-50/60 rounded-md px-2 py-1.5">
                                            <span className="font-medium text-emerald-800">Achievement</span>
                                            <div className="flex items-center gap-2">
                                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                                {m.contributionCount} {m.contributionCount === 1 ? 'Quote' : 'Quotes'}
                                              </span>
                                              <span className="font-bold text-emerald-900">₹{formatSmartCurrency(m.achievement || 0)}</span>
                                            </div>
                                          </div>
                                          
                                          <div className="my-2 border-t border-slate-100"></div>
                                          
                                          <div className={`flex justify-between items-center rounded-md px-2 py-2 ${
                                            m.closingShortfall > 0 ? "bg-red-50/60" : m.closingExcess > 0 ? "bg-emerald-50/60" : "bg-slate-50"
                                          }`}>
                                            <span className={`font-medium ${m.closingShortfall > 0 ? "text-red-800" : m.closingExcess > 0 ? "text-emerald-800" : "text-slate-700"}`}>Closing Balance</span>
                                            <div className="flex flex-col items-end gap-1">
                                              {m.closingShortfall > 0 ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Shortfall</span>
                                              ) : m.closingExcess > 0 ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Excess</span>
                                              ) : (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">Balanced</span>
                                              )}
                                              <span className={`font-bold ${m.closingShortfall > 0 ? "text-red-900" : m.closingExcess > 0 ? "text-emerald-900" : "text-slate-800"}`}>
                                                ₹{formatSmartCurrency(m.closingShortfall > 0 ? m.closingShortfall : m.closingExcess > 0 ? m.closingExcess : 0)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION B: MANUAL QUARTER REALLOCATION MATRIX */}
          <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden mb-8 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
            <div className="px-6 py-5 border-b border-[#E8EEF7] bg-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Quarter Reallocation Matrix</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Distribute closing balances into the upcoming quarter to adjust effective goals ({allocationData ? `From Q${quarterNumber} into ${allocationData.targetFinancialYear} Q${allocationData.targetQuarterNumber}` : "Next Quarter Target Allocation"}).
                </p>
              </div>

              {canEdit && allocationData && (
                <div className="flex items-center gap-3">
                  <Button variant="danger" onClick={handleClearAll}>
    <span>Clear Allocation</span>
  </Button>
                  <Button variant="secondary" onClick={handleEqualSplitAll}>
    <span>Split Equally</span>
  </Button>
                </div>
              )}
            </div>

            {loadingAllocation ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
                      <div className="flex-1 space-y-2.5">
                        <div className="h-4 bg-slate-100 rounded-md animate-pulse w-1/3"></div>
                        <div className="h-3 bg-slate-100 rounded-md animate-pulse w-1/4"></div>
                      </div>
                      <div className="h-5 bg-slate-100 rounded-md animate-pulse w-[15%]"></div>
                      <div className="h-5 bg-slate-100 rounded-md animate-pulse w-[10%]"></div>
                      <div className="h-10 bg-slate-100 rounded-md animate-pulse w-[12%]"></div>
                      <div className="h-10 bg-slate-100 rounded-md animate-pulse w-[12%]"></div>
                      <div className="h-10 bg-slate-100 rounded-md animate-pulse w-[12%]"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !allocationData ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-slate-700 mb-1">No Allocation Required</h4>
                <p className="text-sm text-slate-500 max-w-[320px]">There are no pending allocations or strategies required for the selected quarter.</p>
              </div>
            ) : (
              <div className="pb-6 w-full">
                <div className="overflow-x-auto w-full custom-scrollbar shadow-sm rounded-md border border-[#E0E7FF]">
                  <table className="min-w-[1000px] w-full border-collapse text-sm table-auto">
                    <thead className="bg-[#EEF2FF] border-b border-[#E0E7FF] sticky top-0 z-20">
                      <tr>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-left align-middle sticky left-0 bg-[#EEF2FF] z-30 shadow-[1px_0_0_#E0E7FF]">CATEGORY</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">CLOSING BALANCE</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">STATUS</th>
                        {(allocationData.targetMonths || []).map(m => (
                          <th key={m.monthNumber} className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">
                            {m.monthName.toUpperCase()} ({m.shortName.toUpperCase()})
                          </th>
                        ))}
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">TOTAL ALLOCATED</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">REMAINING</th>
                        {canEdit && <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center align-middle">QUICK SPLIT</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EEF7] bg-white">
                      {(allocationData.categories || []).map((cat) => {
                        const targetMonths = allocationData.targetMonths || [];
                        let totalAllocated = 0;
                        targetMonths.forEach(m => {
                          const key = `${cat.categoryId}_${m.monthNumber}`;
                          totalAllocated += Number(allocationInputs[key] || 0);
                        });
                        totalAllocated = Math.round(totalAllocated * 100) / 100;
                        const remaining = Math.round((cat.closingBalanceAmount - totalAllocated) * 100) / 100;
                        const isBalanced = cat.closingBalanceType === "BALANCED";

                        const isActiveRow = activeRowId === cat.categoryId;
                        const isAnimating = animatingCategoryId === cat.categoryId || animatingCategoryId === "ALL";
                        const baseRowBg = cat.isStale 
                          ? (isActiveRow ? "bg-amber-100/60" : "bg-amber-50/40 hover:bg-amber-50/60") 
                          : (isActiveRow ? "bg-[#F0F5FF]" : "hover:bg-[#F8FBFF]");
                        const rowBg = recentlySaved ? "bg-emerald-50 transition-colors duration-[1500ms]" : baseRowBg;

                        return (
                          <tr key={cat.categoryId} className={`h-[72px] group relative transition-all duration-200 ${rowBg} hover:shadow-[0_4px_12px_-2px_rgba(37,99,235,0.06)]`}>
                            <td className={`px-[16px] py-2.5 font-semibold text-[#0F172A] align-middle relative sticky left-0 z-10 shadow-[1px_0_0_#E0E7FF] bg-white group-hover:bg-[#F8FBFF] before:absolute before:left-0 before:top-0 before:h-full before:w-[4px] before:bg-[#2563EB] before:transition-opacity before:duration-200 ${isActiveRow ? 'before:opacity-100' : 'before:opacity-0 group-hover:before:opacity-100'}`}>
                              <div className="flex items-center gap-2">
                                <CategoryDisplay cat={cat} size="sm" />
                              </div>
                            </td>

                            <td className="px-[16px] py-2.5 text-center align-middle">
                              {cat.closingBalanceType === "SHORTFALL" && (
                                <div className="flex flex-col items-center gap-[4px]">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-semibold tracking-normal bg-red-50 text-red-700 border border-red-100">
                                    Shortfall
                                  </span>
                                  <span className="text-red-600 font-bold text-[17px] leading-[24px]">₹{formatSmartCurrency(cat.closingBalanceAmount)}</span>
                                </div>
                              )}
                              {cat.closingBalanceType === "EXCESS" && (
                                <div className="flex flex-col items-center gap-[4px]">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-semibold tracking-normal bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    Excess
                                  </span>
                                  <span className="text-emerald-600 font-bold text-[17px] leading-[24px]">₹{formatSmartCurrency(cat.closingBalanceAmount)}</span>
                                </div>
                              )}
                              {cat.closingBalanceType === "BALANCED" && (
                                <div className="flex flex-col items-center gap-[4px]">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-semibold tracking-normal bg-slate-100 text-slate-500 border border-slate-200">
                                    Balanced
                                  </span>
                                  <span className="text-slate-400 font-bold text-[17px] leading-[24px]">₹0</span>
                                </div>
                              )}
                            </td>

                            <td className="px-[16px] py-2.5 text-center align-middle">
                              {cat.allocationStatus === "CONFIRMED" && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[13px] font-medium bg-[#ECFDF5] text-[#047857] transition-all duration-200 group-hover:brightness-105">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                                  Confirmed
                                </span>
                              )}
                              {cat.allocationStatus === "STALE" && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[13px] font-medium bg-amber-100 text-amber-800 animate-pulse transition-all duration-200 group-hover:brightness-105">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Stale
                                </span>
                              )}
                              {cat.allocationStatus === "NOT ALLOCATED" && !isBalanced && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[13px] font-medium bg-yellow-100 text-yellow-800 transition-all duration-200 group-hover:brightness-105">
                                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                  Pending
                                </span>
                              )}
                              {cat.allocationStatus === "NOT REQUIRED" && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 transition-all duration-200 group-hover:brightness-105">
                                  Not Required
                                </span>
                              )}
                            </td>

                            {/* Target Month Input Fields */}
                            {targetMonths.map(m => {
                              const key = `${cat.categoryId}_${m.monthNumber}`;
                              const val = allocationInputs[key] !== undefined ? allocationInputs[key] : "";
                              return (
                                <td key={m.monthNumber} className="px-[16px] py-2.5 text-center align-middle">
                                  <div className="relative w-[135px] mx-auto flex items-center">
                                    <input
                                      type="text"
                                      disabled={!canEdit || isBalanced}
                                      value={val !== "" ? formatSmartCurrency(val) : ""}
                                      aria-label={`Allocation amount for ${m.monthName} in ${cat.categoryName}`}
                                      onFocus={() => setActiveRowId(cat.categoryId)}
                                      onBlur={() => setActiveRowId(null)}
                                      onChange={(e) => {
                                        const cleanVal = e.target.value.replace(/,/g, '');
                                        if (!isNaN(cleanVal)) {
                                          handleInputChange(cat.categoryId, m.monthNumber, cleanVal);
                                        }
                                      }}
                                      placeholder="0"
                                      className={`w-full h-[40px] px-[12px] text-center text-[17px] font-semibold leading-[24px] rounded-md border transition-all duration-200 outline-none ${
                                        isBalanced
                                          ? "bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                                          : "bg-white border-[#818CF8] text-[#0F172A] hover:border-[#6366F1] focus:ring-2 focus:ring-[#818CF8]/20 focus:border-[#818CF8]"
                                      } ${isAnimating ? 'animate-pulse scale-[1.02] bg-indigo-50' : ''}`}
                                    />
                                  </div>
                                </td>
                              );
                            })}

                            <td className="px-[16px] py-2.5 text-center font-bold text-[#0F172A] text-[17px] leading-[24px] whitespace-nowrap align-middle">
                              ₹{formatSmartCurrency(totalAllocated)}
                            </td>

                            <td className={`px-[16px] py-2.5 text-center font-bold text-[17px] leading-[24px] whitespace-nowrap align-middle ${
                              remaining === 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              ₹{formatSmartCurrency(remaining)}
                            </td>

                            {canEdit && (
                              <td className="px-[16px] py-2.5 text-center align-middle">
                                {!isBalanced && (
                                  <div className="w-[150px] mx-auto">
                                    <Select
                                      value={""}
                                      onChange={(val) => {
                                        if (val === 'split') {
                                          handleEqualSplitCategory(cat.categoryId, cat.closingBalanceAmount, targetMonths);
                                        } else {
                                          const month = targetMonths.find(m => String(m.monthNumber) === val);
                                          if (month) {
                                            handleAllToFirstMonth(cat.categoryId, cat.closingBalanceAmount, [month]);
                                          }
                                        }
                                      }}
                                      options={[
                                        { value: 'split', label: 'Split Equally' },
                                        ...targetMonths.map(m => ({ value: String(m.monthNumber), label: `Move All to ${m.monthName}` }))
                                      ]}
                                      placeholder="Auto Allocate"
                                    />
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                        </tbody>
                      </table>
                    </div>

                    {canEdit ? (
                      <div className="flex items-center justify-end gap-4 mt-8 pr-8 pb-2">
                        <Button variant="secondary" onClick={handleResetChanges}>
                        <span>Reset Changes</span>
                      </Button>
                        <Button
                          variant="secondary"
                          onClick={handlePreviewAllocation}
                        >
                          <span>Preview Allocation</span>
                          <svg className="w-4 h-4 text-current transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Button>
                      <Button
                        variant="primary"
                        onClick={handleSaveReallocation}
                        loading={savingAllocation}
                      >
                        <span>Save Allocation</span>
                      </Button>
                    </div>
                ) : (
                  <div className="mt-8 p-5 bg-slate-50 border border-[#E8EEF7] rounded-md text-center text-sm text-slate-500 font-medium">
                    You have view-only access to the Quarter Strategy Reallocation matrix. Contact an Administrator or Sales Manager to confirm changes.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Summary Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-[18px] border-b border-[#E8EEF7] flex items-center justify-between bg-white">
                <h3 className="text-[16px] font-bold text-[#0F172A]">Preview Allocation</h3>
                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-white">
                <div className="bg-[#ECFDF5] text-[#047857] p-4 rounded-md mb-6 text-[14px] flex items-center gap-3 font-medium">
                  <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>All category reallocations exactly match their closing balances. You are ready to save.</span>
                </div>

                <div className="text-[12px] font-semibold text-[#64748B] mb-4 uppercase tracking-[0.05em]">Allocation Summary</div>
                <div className="border border-[#E8EEF7] rounded-md overflow-x-auto">
                  <table className="min-w-max w-full text-[14px] text-left">
                    <thead className="bg-[#EEF2FF] border-b border-[#E0E7FF]">
                      <tr>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-left">Category</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-right">Closing Balance</th>
                        <th className="py-3 px-5 text-[13px] font-semibold text-[#4B6485] uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EEF7] bg-white">
                      {(allocationData?.categories || []).filter(c => c.closingBalanceType !== "BALANCED").map(cat => (
                        <tr key={cat.categoryId}>
                          <td className="px-5 py-[14px] font-semibold text-[#334155]">
                            {cat.categoryName}
                          </td>
                          <td className="px-5 py-[14px] text-right font-bold text-[#0F172A]">₹{formatSmartCurrency(cat.closingBalanceAmount)}</td>
                          <td className="px-5 py-[14px] text-center">
                            <span className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857]">
                              Matched
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-6 py-[18px] bg-[#F8FAFC] border-t border-[#E8EEF7] flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
                  <span>Cancel</span>
                </Button>
                <Button variant="primary" onClick={() => {
                  setShowPreviewModal(false);
                  handleSaveReallocation();
                }} disabled={savingAllocation}>
                  <span>{savingAllocation ? "Saving..." : "Confirm & Save"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CheckPermission>
  );
}
