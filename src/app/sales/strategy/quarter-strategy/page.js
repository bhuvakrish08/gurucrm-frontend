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
import MonthCarryAllocationModal from "../components/MonthCarryAllocationModal";
import CategoryDetailDrawer from "../components/CategoryDetailDrawer";

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
  const [drawerCategory, setDrawerCategory] = useState(null);
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
  const [selectedMonthModal, setSelectedMonthModal] = useState(null);

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

  const handleOpenCategoryDrawer = (cat) => {
    setDrawerCategory({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      categoryCode: cat.categoryCode,
      color: cat.color,
      badge_text_color: cat.badge_text_color,
      icon_color: cat.icon_color,
      baseGoal: Number(cat.quarterBaseGoal || 0),
      effectiveGoal: Number(cat.quarterEffectiveGoal || 0),
      achievement: Number(cat.quarterAchievement || 0),
      variance: Number(cat.quarterAchievement || 0) - Number(cat.quarterEffectiveGoal || 0),
      closingShortfall: Number(cat.finalClosingShortfall || 0),
      closingExcess: Number(cat.finalClosingExcess || 0),
      allocatedOut: Number(cat.allocatedOut || cat.finalAllocatedOut || (cat.monthsSequence && cat.monthsSequence[cat.monthsSequence.length - 1]?.allocatedOut) || 0),
      allocatedShortfallOut: Number(cat.allocatedShortfallOut || (cat.monthsSequence && cat.monthsSequence[cat.monthsSequence.length - 1]?.allocatedShortfallOut) || 0),
      allocatedExcessOut: Number(cat.allocatedExcessOut || (cat.monthsSequence && cat.monthsSequence[cat.monthsSequence.length - 1]?.allocatedExcessOut) || 0),
      effectiveOutgoingShortfall: Number(cat.effectiveOutgoingShortfall || (cat.monthsSequence && cat.monthsSequence[cat.monthsSequence.length - 1]?.effectiveOutgoingShortfall) || 0),
      effectiveOutgoingExcess: Number(cat.effectiveOutgoingExcess || (cat.monthsSequence && cat.monthsSequence[cat.monthsSequence.length - 1]?.effectiveOutgoingExcess) || 0),
      effectiveCarryForward: Number(cat.effectiveCarryForward || (cat.monthsSequence && cat.monthsSequence[cat.monthsSequence.length - 1]?.effectiveCarryForward) || 0),
      performanceStatus: Number(cat.quarterAchievement || 0) >= Number(cat.quarterEffectiveGoal || 0) ? "AHEAD" : "BEHIND",
      monthsSequence: cat.monthsSequence || [],
    });
  };

  const handleInputChange = (catId, monthNumber, valStr) => {
    const key = `${catId}_${monthNumber}`;
    setAllocationInputs(prev => ({ ...prev, [key]: valStr }));
  };

  // Quick action: Equal Split for one category
  const handleEqualSplitCategory = (catId, availableAmt, targetMonths) => {
    if (availableAmt <= 0 || targetMonths.length === 0) return;
    const baseShare = Math.floor((availableAmt / targetMonths.length) * 100) / 100;
    const remainder = Math.round((availableAmt - baseShare * targetMonths.length) * 100) / 100;

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
  const handleAllToFirstMonth = (catId, availableAmt, targetMonths) => {
    if (availableAmt <= 0 || targetMonths.length === 0) return;
    const newInputs = { ...allocationInputs };
    targetMonths.forEach((m, idx) => {
      const key = `${catId}_${m.monthNumber}`;
      newInputs[key] = idx === 0 ? availableAmt : 0;
    });
    setAllocationInputs(newInputs);
    setAnimatingCategoryId(catId);
    setTimeout(() => setAnimatingCategoryId(null), 400);
    toast.info(`Allocated ₹${formatSmartCurrency(availableAmt)} to ${targetMonths[0].monthName}`);
  };

  // Quick action: Equal Split All Categories
  const handleEqualSplitAll = () => {
    if (!allocationData || !allocationData.categories) return;
    const targetMonths = allocationData.targetMonths || [];
    if (targetMonths.length === 0) return;

    const newInputs = { ...allocationInputs };
    allocationData.categories.forEach(cat => {
      const availableAmt = cat.availableAmount !== undefined ? Number(cat.availableAmount) : Number(cat.closingBalanceAmount);
      if (cat.closingBalanceType !== "BALANCED" && availableAmt > 0) {
        const baseShare = Math.floor((availableAmt / targetMonths.length) * 100) / 100;
        const remainder = Math.round((availableAmt - baseShare * targetMonths.length) * 100) / 100;

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
      if (cat.closingBalanceType !== "BALANCED" && (cat.availableAmount > 0 || cat.closingBalanceAmount > 0)) {
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
      const availableAmt = cat.availableAmount !== undefined ? Number(cat.availableAmount) : Number(cat.closingBalanceAmount);
      const maxAllowed = Math.round(availableAmt * 100) / 100;

      if (totalAllocated > maxAllowed + 0.009) {
        toast.error(`Category '${cat.categoryName}' allocation (₹${formatSmartCurrency(totalAllocated)}) exceeds available balance (₹${formatSmartCurrency(maxAllowed)}).`);
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

      const availableAmt = cat.availableAmount !== undefined ? Number(cat.availableAmount) : Number(cat.closingBalanceAmount);
      const maxAllowed = Math.round(availableAmt * 100) / 100;

      if (cat.closingBalanceType !== "BALANCED") {
        if (totalCatAlloc > maxAllowed + 0.009) {
          toast.error(
            `Mismatch for '${cat.categoryName}': Total new allocated (₹${formatSmartCurrency(totalCatAlloc)}) exceeds available balance (₹${formatSmartCurrency(maxAllowed)}).`
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

        <main className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full space-y-6">
          {/* Header Controls & Quarter Summary combined in one single card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                    Quarter Reallocation Matrix
                  </h2>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    Review quarterly performance and allocate closing balances for the next quarter.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Financial Year</span>
                  <div className="w-full sm:w-[140px] shrink-0">
                    <Select
                      value={financialYear}
                      onChange={setFinancialYear}
                      options={availableYears.map(fy => ({ value: fy, label: fy }))}
                      className="w-full h-[38px] text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Quarter</span>
                  <div className="w-full sm:w-[150px] shrink-0">
                    <Select
                      value={quarterNumber}
                      onChange={(val) => setQuarterNumber(Number(val))}
                      options={QUARTERS_META.map(q => ({ value: String(q.quarterNumber), label: q.label }))}
                      className="w-full h-[38px] text-xs font-semibold bg-white border border-slate-300 rounded-lg"
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

          {/* COMPACT CARRY SUMMARY STRIP */}
          {summaryData && (() => {
            const isShortfall = summaryData.totals?.totalFinalClosingShortfall > 0;
            const isExcess    = !isShortfall && summaryData.totals?.totalFinalClosingExcess > 0;
            if (!isShortfall && !isExcess) return null;

            const closingAmt = isShortfall
              ? summaryData.totals.totalFinalClosingShortfall
              : summaryData.totals.totalFinalClosingExcess;

            // Derive totalAllocatedOut from each category's final-month allocatedOut
            const totalAllocatedOut = (summaryData.categories || []).reduce((sum, cat) => {
              const lastMonth = cat.monthsSequence?.[cat.monthsSequence.length - 1];
              return sum + Number(lastMonth?.allocatedOut || 0);
            }, 0);

            const remainingAuto = Math.max(0, closingAmt - totalAllocatedOut);
            const hasAlloc = totalAllocatedOut > 0;

            // Contributing categories for breakdown
            const contributingCats = (summaryData.categories || []).filter(c => 
              isShortfall ? Number(c.finalClosingShortfall || 0) > 0 : Number(c.finalClosingExcess || 0) > 0
            );

            const colorCls = isShortfall
              ? { bg: "bg-rose-50/80", border: "border-rose-200/80", icon: "bg-rose-200 text-rose-800", label: "text-rose-900", amt: "text-rose-700", sub: "text-rose-500", div: "border-rose-200/60" }
              : { bg: "bg-emerald-50/80", border: "border-emerald-200/80", icon: "bg-emerald-200 text-emerald-800", label: "text-emerald-900", amt: "text-emerald-700", sub: "text-emerald-500", div: "border-emerald-200/60" };

            return (
              <div className={`rounded-xl border ${colorCls.bg} ${colorCls.border} shadow-sm overflow-hidden`}>

                {/* ── Row 1: Primary summary ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">

                  {/* Left: icon + title + amount */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${colorCls.icon}`}>
                      {isShortfall ? "!" : "✓"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <p className={`text-xs font-bold uppercase tracking-wider ${colorCls.label}`}>
                          {isShortfall ? "Closing Shortfall" : "Closing Excess"}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white/90 border border-slate-200/80 px-2 py-0.5 rounded-md">
                          Q{quarterNumber} Total • All Categories
                        </span>
                      </div>
                      <p className={`text-base font-black tabular-nums leading-tight ${colorCls.amt} mt-0.5`}>
                        ₹{formatSmartCurrency(closingAmt)}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Allocation breakdown — clean key/value pairs with full labels */}
                  {hasAlloc && (
                    <div className={`flex items-center gap-6 text-xs border-l pl-5 ${colorCls.div}`}>
                      <div className="flex flex-col gap-0.5">
                        <p className={`text-[11px] font-semibold ${colorCls.sub}`}>Allocated to Q{allocationData?.targetQuarterNumber ?? quarterNumber + 1}</p>
                        <p className="text-sm font-black text-slate-800 tabular-nums">₹{formatSmartCurrency(totalAllocatedOut)}</p>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className={`text-[11px] font-semibold ${colorCls.sub}`}>Remaining Carry</p>
                        <p className="text-sm font-black text-indigo-700 tabular-nums">₹{formatSmartCurrency(remainingAuto)}</p>
                      </div>
                    </div>
                  )}

                  {/* Right: CTA */}
                  {canEdit && (
                    <div className="flex-shrink-0 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const element = document.getElementById("quarter-reallocation-matrix");
                          if (element) element.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Allocate Carry
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Row 2: Per-category breakdown ── */}
                {contributingCats.length > 0 && (
                  <div className={`border-t ${colorCls.div} px-5 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1.5`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                      Breakdown
                    </span>
                    {contributingCats.map((cat) => {
                      const amt = isShortfall ? cat.finalClosingShortfall : cat.finalClosingExcess;
                      return (
                        <div key={cat.categoryId} className="flex items-baseline gap-2">
                          <span className="text-[11px] font-medium text-slate-500">{cat.categoryName}</span>
                          <span className="text-[11px] font-bold text-slate-700 tabular-nums">₹{formatSmartCurrency(amt)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Stale Allocation Banner */}
          {allocationData?.isStale && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-sm flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-amber-500 text-lg font-bold">⚠️</div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">Stale Allocation Plan Detected</h3>
                  <p className="text-xs text-amber-700 mt-1 font-medium leading-relaxed">
                    Historical quotation achievements or base goals have changed since this quarter&apos;s closing balance was last allocated. Please review and re-save the reallocation plan below to update destination quarter adjustments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION A: QUARTER STRATEGY SUMMARY TABLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Quarter Performance Summary</h3>
                <p className="text-xs text-slate-500 mt-0.5">Review quarterly goals, achievements, and closing balances across all sales categories.</p>
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
              <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="min-w-[1000px] w-full border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-left sticky left-0 bg-slate-50 z-20">CATEGORY</th>
                      <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">BASE GOAL</th>
                      <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">EFFECTIVE GOAL</th>
                      <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">ACHIEVEMENT</th>
                      <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">VARIANCE</th>
                      <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-left">CLOSING BALANCE</th>
                      <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {(summaryData.categories || []).map((cat) => {
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
                        <tr
                          key={cat.categoryId}
                          className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100 cursor-pointer h-16"
                          onClick={() => handleOpenCategoryDrawer(cat)}
                        >
                          <td className="px-6 py-3 font-semibold text-slate-900 bg-white group-hover:bg-slate-50/80 sticky left-0 z-10">
                            <div className="flex items-center gap-3">
                              <CategoryDisplay cat={cat} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700 whitespace-nowrap">
                            ₹{formatSmartCurrency(cat.quarterBaseGoal || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-700 whitespace-nowrap">
                            ₹{formatSmartCurrency(cat.quarterEffectiveGoal || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700 whitespace-nowrap">
                            ₹{formatSmartCurrency(cat.quarterAchievement || 0)}
                          </td>
                          <td className={`px-4 py-3 text-right text-sm font-semibold whitespace-nowrap ${
                            varianceVal >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {varianceVal < 0 ? `-₹${formatSmartCurrency(Math.abs(varianceVal))}` : `+₹${formatSmartCurrency(varianceVal)}`}
                          </td>
                          <td className="px-4 py-3 text-left">
                            {/* Derive allocation context from allocationData (already in state — no new API call, no hardcoded values)
                                Formula: Original Closing = Allocated to Q{n} + Remaining Carry
                                Source:  allocCat.existingAllocatedAmount  (strategy_month_carry_allocations)
                                         allocCat.availableAmount          (= closingBalanceAmount − existingAllocatedAmount) */}
                            {(() => {
                              const allocCat = allocationData?.categories?.find(a => a.categoryId === cat.categoryId);
                              const allocatedAmt = Number(allocCat?.existingAllocatedAmount || allocCat?.allocatedTotal || cat.allocatedOut || 0);
                              const remainingCarry = Number(
                                allocCat?.remainingAmount !== undefined
                                  ? allocCat.remainingAmount
                                  : Math.max(0, closingAmt - allocatedAmt)
                              );
                              const targetQNum = allocationData?.targetQuarterNumber ?? quarterNumber + 1;

                              return (
                                <div className="flex flex-col gap-1 min-w-[180px]">

                                  {/* ── Original Q closing badge — unchanged historical value ── */}
                                  {closingType === "SHORTFALL" && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold w-fit">
                                      Shortfall: ₹{formatSmartCurrency(closingAmt)}
                                    </span>
                                  )}
                                  {closingType === "EXCESS" && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold w-fit">
                                      Excess: ₹{formatSmartCurrency(closingAmt)}
                                    </span>
                                  )}
                                  {closingType === "BALANCED" && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold w-fit">
                                      Balanced (₹0)
                                    </span>
                                  )}

                                  {/* ── Allocation flow: vertical hierarchy below the original closing badge ──
                                       Shown only when allocatedAmt > 0. Full labels, no abbreviations.
                                       Left border line visually connects the three values as a flow. */}
                                  {closingType !== "BALANCED" && allocatedAmt > 0 && (
                                    <div className="flex flex-col gap-0 mt-1.5 pl-2.5 border-l-2 border-slate-200">
                                      <div className="flex items-baseline justify-between gap-6 py-0.5">
                                        <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap leading-snug">Allocated to Q{targetQNum}</span>
                                        <span className="text-[11px] font-semibold text-slate-600 tabular-nums">₹{formatSmartCurrency(allocatedAmt)}</span>
                                      </div>
                                      <div className="flex items-baseline justify-between gap-6 py-0.5">
                                        <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap leading-snug">Remaining Carry</span>
                                        <span className="text-[11px] font-semibold text-indigo-600 tabular-nums">₹{formatSmartCurrency(remainingCarry)}</span>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCategoryDrawer(cat);
                                }}
                                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                <span>View Details</span>
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              {canEdit && closingType !== "BALANCED" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const closingMonthNumber = quarterNumber === 1 ? 6 : quarterNumber === 2 ? 9 : quarterNumber === 3 ? 12 : 3;
                                    const closingMonthName = quarterNumber === 1 ? "June" : quarterNumber === 2 ? "September" : quarterNumber === 3 ? "December" : "March";
                                    setSelectedMonthModal({
                                      monthNumber: closingMonthNumber,
                                      monthName: `${closingMonthName} (Q${quarterNumber} Closing)`,
                                      categoryId: cat.categoryId,
                                      categoryName: cat.categoryName,
                                    });
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
                                >
                                  Allocate Carry
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION B: MANUAL QUARTER REALLOCATION MATRIX */}
          <div id="quarter-reallocation-matrix" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-slate-100 bg-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Quarter Reallocation Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribute closing balances into the upcoming quarter to adjust effective goals ({allocationData ? `From Q${quarterNumber} into ${allocationData.targetFinancialYear} Q${allocationData.targetQuarterNumber}` : "Next Quarter Target Allocation"}).
                </p>
              </div>

              {canEdit && allocationData && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    Clear Allocation
                  </button>
                  <button
                    type="button"
                    onClick={handleEqualSplitAll}
                    className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    Split Equally
                  </button>
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
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-slate-700 mb-0.5">No Allocation Required</h4>
                <p className="text-xs text-slate-500 max-w-[320px]">There are no pending allocations required for the selected quarter.</p>
              </div>
            ) : (
              <div className="w-full">
                <div className="overflow-x-auto w-full custom-scrollbar">
                  <table className="min-w-[1000px] w-full border-collapse text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-left sticky left-0 bg-slate-50 z-20">CATEGORY</th>
                        <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-indigo-600 text-right">AVAILABLE TO ALLOCATE</th>
                        <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">STATUS</th>
                        {(allocationData.targetMonths || []).map(m => (
                          <th key={m.monthNumber} className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                            {m.monthName.toUpperCase()}
                          </th>
                        ))}
                        <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">EXISTING</th>
                        <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">NEW ALLOCATION</th>
                        <th className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">REMAINING</th>
                        {canEdit && <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">QUICK SPLIT</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(allocationData.categories || []).map((cat) => {
                        const targetMonths = allocationData.targetMonths || [];
                        const availableAmt = cat.availableAmount !== undefined ? Number(cat.availableAmount) : Number(cat.closingBalanceAmount);
                        const existingAllocated = Number(cat.existingAllocatedAmount || 0);
                        const qLabel = `Q${quarterNumber}`;

                        // Sum of new inputs entered by user in this session
                        let newAllocation = 0;
                        targetMonths.forEach(m => {
                          const key = `${cat.categoryId}_${m.monthNumber}`;
                          newAllocation += Number(allocationInputs[key] || 0);
                        });
                        newAllocation = Math.round(newAllocation * 100) / 100;
                        const remaining = Math.max(0, Math.round((availableAmt - newAllocation) * 100) / 100);
                        const isBalanced = cat.closingBalanceType === "BALANCED";
                        const isOverAllocated = newAllocation > availableAmt + 0.009;

                        const isActiveRow = activeRowId === cat.categoryId;
                        const baseRowBg = cat.isStale
                          ? (isActiveRow ? "bg-amber-100/60" : "bg-amber-50/40 hover:bg-amber-50/60")
                          : (isActiveRow ? "bg-indigo-50/30" : "hover:bg-slate-50/80");
                        const rowBg = recentlySaved ? "bg-emerald-50 transition-colors duration-1000" : baseRowBg;

                        return (
                          <tr key={cat.categoryId} className={`group transition-colors ${rowBg}`}>

                            {/* CATEGORY — with optional context line: Q closing · already allocated */}
                            <td className="px-6 py-4 bg-white group-hover:bg-slate-50/80 sticky left-0 z-10">
                              <div className="flex items-start gap-2.5">
                                <div className="flex-1 min-w-0">
                                  <CategoryDisplay cat={cat} size="sm" />
                                  {!isBalanced && existingAllocated > 0 && (
                                    <p className="mt-1.5 text-[11px] text-slate-400 leading-snug tabular-nums">
                                      {qLabel} Closing ₹{formatSmartCurrency(cat.closingBalanceAmount)}
                                      <span className="mx-1.5 text-slate-300">·</span>
                                      ₹{formatSmartCurrency(existingAllocated)} already allocated to Q{allocationData?.targetQuarterNumber ?? quarterNumber + 1}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* AVAILABLE TO ALLOCATE — primary emphasis column */}
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              {isBalanced ? (
                                <span className="text-slate-400 text-xs font-medium">—</span>
                              ) : availableAmt === 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-bold text-emerald-600">₹0</span>
                                  <span className="text-[10px] font-medium text-emerald-500">Fully pre-allocated</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className={`text-base font-bold ${
                                    cat.closingBalanceType === "SHORTFALL" ? "text-rose-700" : "text-emerald-700"
                                  }`}>
                                    ₹{formatSmartCurrency(availableAmt)}
                                  </span>
                                  {cat.closingBalanceType === "SHORTFALL" && (
                                    <span className="inline-flex items-center mt-0.5 px-1.5 py-0 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                                      Shortfall
                                    </span>
                                  )}
                                  {cat.closingBalanceType === "EXCESS" && (
                                    <span className="inline-flex items-center mt-0.5 px-1.5 py-0 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                      Excess
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* STATUS */}
                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              {cat.allocationStatus === "CONFIRMED" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Confirmed
                                </span>
                              )}
                              {cat.allocationStatus === "STALE" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Stale
                                </span>
                              )}
                              {cat.allocationStatus === "NOT ALLOCATED" && !isBalanced && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Pending
                                </span>
                              )}
                              {cat.allocationStatus === "NOT REQUIRED" && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                  Not Required
                                </span>
                              )}
                            </td>

                            {/* TARGET MONTH INPUT FIELDS */}
                            {targetMonths.map(m => {
                              const key = `${cat.categoryId}_${m.monthNumber}`;
                              const val = allocationInputs[key] !== undefined ? allocationInputs[key] : "";
                              const existingMonthVal = Number(cat.existingMonthAllocations?.[m.monthNumber] || 0);

                              return (
                                <td key={m.monthNumber} className="px-4 py-4 text-center">
                                  <div className="relative w-32 mx-auto flex flex-col items-center">
                                    <div className="relative w-full flex items-center">
                                      <span className="absolute left-2.5 text-slate-400 text-xs font-semibold select-none">₹</span>
                                      <input
                                        type="text"
                                        disabled={!canEdit || isBalanced || availableAmt === 0}
                                        value={val !== "" ? formatSmartCurrency(val) : ""}
                                        aria-label={`Allocation for ${m.monthName} in ${cat.categoryName}`}
                                        onFocus={() => setActiveRowId(cat.categoryId)}
                                        onBlur={() => setActiveRowId(null)}
                                        onChange={(e) => {
                                          const cleanVal = e.target.value.replace(/,/g, '');
                                          if (!isNaN(cleanVal)) handleInputChange(cat.categoryId, m.monthNumber, cleanVal);
                                        }}
                                        placeholder="0"
                                        className={`w-full h-9 pl-6 pr-2.5 text-right text-sm font-semibold rounded-lg border outline-none transition-all ${
                                          isBalanced || availableAmt === 0
                                            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                            : isOverAllocated
                                              ? "bg-rose-50 border-rose-300 text-rose-800 focus:ring-2 focus:ring-rose-100"
                                              : "bg-white border-slate-200 text-slate-900 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        }`}
                                      />
                                    </div>
                                    {existingMonthVal > 0 && (
                                      <span className="text-[10px] font-medium text-slate-400 mt-1 whitespace-nowrap">
                                        pre-alloc ₹{formatSmartCurrency(existingMonthVal)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}

                            {/* EXISTING ALLOCATED */}
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              {existingAllocated > 0 ? (
                                <span className="text-sm font-semibold text-slate-500">₹{formatSmartCurrency(existingAllocated)}</span>
                              ) : (
                                <span className="text-slate-300 text-sm">—</span>
                              )}
                            </td>

                            {/* NEW ALLOCATION */}
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <span className={`text-sm font-semibold ${
                                isOverAllocated ? "text-rose-600" : newAllocation > 0 ? "text-indigo-700" : "text-slate-400"
                              }`}>
                                ₹{formatSmartCurrency(newAllocation)}
                              </span>
                              {isOverAllocated && (
                                <span className="block text-[10px] font-medium text-rose-500">Over limit</span>
                              )}
                            </td>

                            {/* REMAINING */}
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              {isBalanced ? (
                                <span className="text-slate-300 text-sm">—</span>
                              ) : availableAmt === 0 && existingAllocated > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm font-bold text-emerald-600">₹0</span>
                                  <span className="block text-[10px] font-medium text-emerald-500">Complete</span>
                                </div>
                              ) : (
                                <span className={`text-sm font-bold ${
                                  remaining === 0 ? "text-emerald-600" : "text-rose-600"
                                }`}>
                                  ₹{formatSmartCurrency(remaining)}
                                </span>
                              )}
                            </td>

                            {/* QUICK SPLIT */}
                            {canEdit && (
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                {!isBalanced && availableAmt > 0 && (
                                  <div className="w-36 mx-auto">
                                    <Select
                                      value={""}
                                      onChange={(val) => {
                                        if (val === 'split') {
                                          handleEqualSplitCategory(cat.categoryId, availableAmt, targetMonths);
                                        } else {
                                          const month = targetMonths.find(m => String(m.monthNumber) === val);
                                          if (month) handleAllToFirstMonth(cat.categoryId, availableAmt, [month]);
                                        }
                                      }}
                                      options={[
                                        { value: 'split', label: 'Split Equally' },
                                        ...targetMonths.map(m => ({ value: String(m.monthNumber), label: `All to ${m.monthName}` }))
                                      ]}
                                      placeholder="Auto Allocate"
                                      className="text-xs h-8"
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
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={handleResetChanges}
                      className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
                    >
                      Reset Changes
                    </button>
                    <button
                      type="button"
                      onClick={handlePreviewAllocation}
                      className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Preview Allocation</span>
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReallocation}
                      disabled={savingAllocation}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <span>{savingAllocation ? "Saving..." : "Save Allocation"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
                    You have view-only access to the Quarter Strategy Reallocation matrix.
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Preview Allocation Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => setShowPreviewModal(false)} />
            <div className="relative z-10 bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Preview Quarter Allocation Plan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reallocating Q{quarterNumber} closing balances into {allocationData?.targetFinancialYear} Q{allocationData?.targetQuarterNumber}
                  </p>
                </div>
                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar bg-white space-y-5">
                <div className="bg-indigo-50 text-indigo-800 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium border border-indigo-200">
                  <svg className="w-4 h-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>New allocations are within the available balance for each category. Confirm the distribution below before saving.</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider text-left">Category</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider text-center">Type</th>
                        <th className="py-3 px-4 font-semibold text-indigo-600 uppercase tracking-wider text-right">Available</th>
                        {(allocationData?.targetMonths || []).map(m => (
                          <th key={m.monthNumber} className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider text-right">
                            {m.monthName}
                          </th>
                        ))}
                        <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider text-right">New Allocation</th>
                        <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(allocationData?.categories || []).map(cat => {
                        const targetMonths = allocationData?.targetMonths || [];
                        let catTotal = 0;
                        targetMonths.forEach(m => {
                          const key = `${cat.categoryId}_${m.monthNumber}`;
                          catTotal += Number(allocationInputs[key] || 0);
                        });
                        catTotal = Math.round(catTotal * 100) / 100;
                        const isBalanced = cat.closingBalanceType === "BALANCED";

                        return (
                          <tr key={cat.categoryId} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-[#1E293B]">
                              <CategoryDisplay cat={cat} size="sm" />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {cat.closingBalanceType === "SHORTFALL" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  Shortfall
                                </span>
                              )}
                              {cat.closingBalanceType === "EXCESS" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Excess
                                </span>
                              )}
                              {cat.closingBalanceType === "BALANCED" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  Balanced
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-bold text-[#0F172A]">₹{formatSmartCurrency(
                                cat.availableAmount !== undefined ? cat.availableAmount : cat.closingBalanceAmount
                              )}</div>
                              {Number(cat.existingAllocatedAmount || 0) > 0 && (
                                <div className="text-[10px] text-slate-400 font-medium">
                                  Orig. ₹{formatSmartCurrency(cat.closingBalanceAmount)} · ₹{formatSmartCurrency(cat.existingAllocatedAmount)} pre-alloc
                                </div>
                              )}
                            </td>
                            {targetMonths.map(m => {
                              const key = `${cat.categoryId}_${m.monthNumber}`;
                              const val = Number(allocationInputs[key] || 0);
                              return (
                                <td key={m.monthNumber} className="px-4 py-3 text-right font-semibold text-slate-700">
                                  {val > 0 ? `₹${formatSmartCurrency(val)}` : <span className="text-slate-400">₹0</span>}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right font-bold text-indigo-900">
                              {catTotal > 0 ? `₹${formatSmartCurrency(catTotal)}` : <span className="text-slate-400">₹0</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isBalanced ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                  N/A
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857]">
                                  Valid ✓
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reason / Note (Optional Audit Trail Log)
                  </label>
                  <input
                    type="text"
                    value={allocationReason}
                    onChange={(e) => setAllocationReason(e.target.value)}
                    placeholder={`e.g. Approved strategy carry from Q${quarterNumber} closing balance`}
                    className="w-full h-[40px] px-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="px-6 py-[18px] bg-[#F8FAFC] border-t border-[#E8EEF7] flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
                  <span>Back to Edit</span>
                </Button>
                <Button variant="primary" onClick={() => {
                  setShowPreviewModal(false);
                  handleSaveReallocation();
                }} disabled={savingAllocation} loading={savingAllocation}>
                  <span>Confirm & Save Allocation</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Month Carry Allocation Modal */}
        {selectedMonthModal && (
          <MonthCarryAllocationModal
            isOpen={!!selectedMonthModal}
            onClose={() => setSelectedMonthModal(null)}
            onSave={() => {
              setSelectedMonthModal(null);
              toast.success("Month carry allocation updated successfully.");
              fetchQuarterSummary(financialYear, quarterNumber);
              fetchAllocationData(financialYear, quarterNumber);
            }}
            sourceMonth={selectedMonthModal.monthNumber}
            sourceMonthName={selectedMonthModal.monthName}
            financialYear={financialYear}
            categoryId={selectedMonthModal.categoryId}
            categoryName={selectedMonthModal.categoryName}
          />
        )}
        {/* Category Detail Drawer */}
        {drawerCategory && (
          <CategoryDetailDrawer
            category={drawerCategory}
            financialYear={financialYear}
            mode="QUARTER"
            period={quarterNumber}
            apiBase={API_BASE}
            onClose={() => setDrawerCategory(null)}
            onRefresh={() => {
              fetchQuarterSummary(financialYear, quarterNumber);
              fetchAllocationData(financialYear, quarterNumber);
            }}
          />
        )}
      </div>
    </CheckPermission>
  );
}
