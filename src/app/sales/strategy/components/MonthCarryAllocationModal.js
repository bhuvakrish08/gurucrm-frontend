"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_MONTHS = [
  { number: 4,  name: "April",     shortName: "Apr", fyOrder: 1  },
  { number: 5,  name: "May",       shortName: "May", fyOrder: 2  },
  { number: 6,  name: "June",      shortName: "Jun", fyOrder: 3  },
  { number: 7,  name: "July",      shortName: "Jul", fyOrder: 4  },
  { number: 8,  name: "August",    shortName: "Aug", fyOrder: 5  },
  { number: 9,  name: "September", shortName: "Sep", fyOrder: 6  },
  { number: 10, name: "October",   shortName: "Oct", fyOrder: 7  },
  { number: 11, name: "November",  shortName: "Nov", fyOrder: 8  },
  { number: 12, name: "December",  shortName: "Dec", fyOrder: 9  },
  { number: 1,  name: "January",   shortName: "Jan", fyOrder: 10 },
  { number: 2,  name: "February",  shortName: "Feb", fyOrder: 11 },
  { number: 3,  name: "March",     shortName: "Mar", fyOrder: 12 },
];

const API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"
    : "http://localhost:5000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFYOrder(calendarMonth) {
  if (calendarMonth >= 4) return calendarMonth - 3;
  return calendarMonth + 9;
}

function formatCurrency(val) {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  const rounded = Math.round(num * 100) / 100;
  return rounded.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MonthCarryAllocationModal (AllocateCarryModal)
 *
 * One clean, reusable, premium Allocate Carry experience.
 *
 * Props:
 *   isOpen           {boolean}   — controls visibility
 *   onClose          {function}  — called when user cancels
 *   onSave           {function}  — called with { months, reason, categoryData }
 *   sourceMonth      {number}    — calendar month number (1-12)
 *   sourceMonthName  {string}    — display label, e.g. "June · Q1 Closing" or "April 2026"
 *   financialYear    {string}    — e.g. "2026-2027"
 *   categoryId       {number}    — strategy category ID to filter GET response
 *   categoryName     {string}    — display name (fallback before GET)
 */
export default function MonthCarryAllocationModal({
  isOpen,
  onClose,
  onSave,
  sourceMonth,
  sourceMonthName,
  financialYear,
  categoryId,
  categoryName: categoryNameProp = "",
}) {
  // ── Fetch state ─────────────────────────────────────────────────────────
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError]     = useState(null);

  // ── Save state ───────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ── Delete / Revert state ────────────────────────────────────────────────
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // ── Data state populated from GET ───────────────────────────────────────
  const [catData, setCatData] = useState(null);
  const [globalStale, setGlobalStale] = useState(false);

  // ── Input state { [monthNumber]: string } ────────────────────────────────
  const [inputs, setInputs]   = useState({});
  const [reason, setReason]   = useState("");
  const [errors, setErrors]   = useState({});

  // Track which (sourceMonth + categoryId + financialYear) is currently loaded
  const loadedKeyRef = useRef(null);

  // ── Fetch data function ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!financialYear || !sourceMonth) return;

    const key = `${financialYear}_${sourceMonth}_${categoryId}`;

    setCatData(null);
    setGlobalStale(false);
    setInputs({});
    setReason("");
    setErrors({});
    setFetchError(null);
    setSaveError(null);
    setDeleteError(null);
    setIsConfirmingDelete(false);
    loadedKeyRef.current = key;
    setFetchLoading(true);

    try {
      const token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null;
      const res = await fetch(
        `${API_BASE}/api/strategy/month/${financialYear}/${sourceMonth}/carry-allocation`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      const json = await res.json();

      if (loadedKeyRef.current !== key) return;

      if (!res.ok || json.success === false) {
        setFetchError(json.message || "Failed to load carry allocation data.");
        return;
      }

      setGlobalStale(json.isStale === true);

      const cats = json.categories || [];
      let found = categoryId
        ? cats.find((c) => Number(c.categoryId) === Number(categoryId))
        : cats[0];

      if (!found) {
        setFetchError("Category data not found in response.");
        return;
      }

      setCatData(found);

      // Pre-fill inputs from currentAllocation
      const initInputs = {};
      const validNums = Array.isArray(found.validTargetMonths)
        ? found.validTargetMonths
        : [];
      validNums.forEach((mn) => {
        const existing =
          found.currentAllocation && found.currentAllocation[mn] !== undefined
            ? Number(found.currentAllocation[mn])
            : 0;
        initInputs[mn] = existing > 0 ? String(existing) : "";
      });
      setInputs(initInputs);
    } catch (err) {
      if (loadedKeyRef.current !== key) return;
      setFetchError("Network error while loading carry allocation data.");
      console.error("MonthCarryAllocationModal fetch error:", err);
    } finally {
      if (loadedKeyRef.current === key) setFetchLoading(false);
    }
  }, [financialYear, sourceMonth, categoryId]);

  // ── Fetch on open ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    fetchData();
  }, [isOpen, fetchData]);

  // Reset loadedKeyRef on close
  useEffect(() => {
    if (!isOpen) {
      loadedKeyRef.current = null;
      setIsConfirmingDelete(false);
      setDeleteError(null);
      setSaveError(null);
    }
  }, [isOpen]);

  // ── Derived values ───────────────────────────────────────────────────────

  const targetMonths = useMemo(() => {
    const validNums =
      catData && Array.isArray(catData.validTargetMonths)
        ? catData.validTargetMonths
        : [];

    if (validNums.length > 0) {
      return validNums
        .map((mn) => ALL_MONTHS.find((m) => m.number === mn))
        .filter(Boolean);
    }
    const srcOrder = getFYOrder(sourceMonth || 4);
    return ALL_MONTHS.filter((m) => m.fyOrder > srcOrder);
  }, [catData, sourceMonth]);

  const targetQuarterGroups = useMemo(() => {
    const quarters = [
      { quarterNumber: 1, label: "Q1", subtitle: "Apr – Jun", months: [] },
      { quarterNumber: 2, label: "Q2", subtitle: "Jul – Sep", months: [] },
      { quarterNumber: 3, label: "Q3", subtitle: "Oct – Dec", months: [] },
      { quarterNumber: 4, label: "Q4", subtitle: "Jan – Mar", months: [] },
    ];

    targetMonths.forEach((m) => {
      let qNum = 1;
      if (m.number >= 4 && m.number <= 6) qNum = 1;
      else if (m.number >= 7 && m.number <= 9) qNum = 2;
      else if (m.number >= 10 && m.number <= 12) qNum = 3;
      else qNum = 4;

      const q = quarters.find((x) => x.quarterNumber === qNum);
      if (q) q.months.push(m);
    });

    return quarters.filter((q) => q.months.length > 0);
  }, [targetMonths]);

  const availableAmount = catData ? Number(catData.closingBalanceAmount || 0) : 0;
  const carryType       = catData ? (catData.closingBalanceType || "SHORTFALL") : "SHORTFALL";
  const isBalanced      = carryType === "BALANCED";
  const displayCategory = catData?.categoryName || categoryNameProp;
  const isCatStale      = catData?.isStale === true;

  const hasExistingAllocation = useMemo(() => {
    if (!catData) return false;
    if (catData.allocationStatus === "CONFIRMED" || catData.allocationStatus === "STALE") return true;
    if (Number(catData.allocatedTotal) > 0) return true;
    if (catData.currentAllocation && Object.values(catData.currentAllocation).some((v) => Number(v) > 0)) return true;
    return false;
  }, [catData]);

  const totalAllocated = useMemo(() => {
    let sum = 0;
    Object.values(inputs).forEach((v) => {
      const n = Number(v);
      if (!isNaN(n) && n > 0) sum += n;
    });
    return round2(sum);
  }, [inputs]);

  const remaining       = round2(availableAmount - totalAllocated);
  const isOverAllocated = totalAllocated > availableAmount + 0.009;
  const isFullyAllocated = Math.abs(remaining) <= 0.009 && totalAllocated > 0;
  const isPartiallyAllocated = remaining > 0.009 && totalAllocated > 0;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleInput = (monthNumber, raw) => {
    setInputs((prev) => ({ ...prev, [monthNumber]: raw }));
    if (errors[monthNumber]) setErrors((prev) => ({ ...prev, [monthNumber]: null }));
    if (saveError) setSaveError(null);
    if (deleteError) setDeleteError(null);
  };

  const handleClearAll = () => {
    const cleared = {};
    targetMonths.forEach((m) => (cleared[m.number] = ""));
    setInputs(cleared);
    setErrors({});
  };

  const handleAllocateAllToNextMonth = () => {
    if (!targetMonths || targetMonths.length === 0) return;
    if (remaining <= 0) return;

    const nextMonth = targetMonths[0];
    if (!nextMonth) return;

    const currentVal = Number(inputs[nextMonth.number] || 0);
    const newVal = round2(currentVal + remaining);

    setInputs((prev) => ({
      ...prev,
      [nextMonth.number]: String(newVal),
    }));

    if (errors[nextMonth.number]) {
      setErrors((prev) => ({ ...prev, [nextMonth.number]: null }));
    }
    if (saveError) setSaveError(null);
    if (deleteError) setDeleteError(null);
  };

  const validate = () => {
    const newErrors = {};
    let ok = true;
    targetMonths.forEach((m) => {
      const raw = inputs[m.number];
      if (raw === "" || raw === undefined) return;
      const n = Number(raw);
      if (isNaN(n) || !isFinite(n)) {
        newErrors[m.number] = "Invalid number";
        ok = false;
      } else if (n < 0) {
        newErrors[m.number] = "Cannot be negative";
        ok = false;
      }
    });
    if (isOverAllocated) ok = false;
    setErrors(newErrors);
    return ok;
  };

  const buildMonthsPayload = useCallback(() => {
    const months = {};
    targetMonths.forEach((m) => {
      const n = round2(Number(inputs[m.number] || 0));
      if (n > 0) months[m.number] = n;
    });
    return months;
  }, [inputs, targetMonths]);

  const handleSave = async () => {
    if (!validate()) return;

    const months = buildMonthsPayload();

    if (Object.keys(months).length === 0) {
      setSaveError("Please enter an allocation amount for at least one month.");
      return;
    }

    setSaveError(null);
    setDeleteError(null);
    setIsSaving(true);

    try {
      const token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null;

      const payload = {
        sourceFinancialYear: financialYear,
        sourceMonth: Number(sourceMonth),
        reason: reason.trim() || `Carry allocation from ${sourceMonthName}`,
        allocations: [
          {
            strategyCategoryId: Number(categoryId),
            months,
          },
        ],
      };

      const res = await fetch(`${API_BASE}/api/strategy/month/carry-allocate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || result.success === false) {
        setSaveError(result.message || "Failed to save allocation. Please check your inputs and try again.");
        return;
      }

      onSave({ months, reason: payload.reason, result, action: result.action || "CONFIRMED" });
    } catch (err) {
      console.error("MonthCarryAllocationModal POST error:", err);
      setSaveError("Network error. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllocation = async () => {
    setDeleteError(null);
    setSaveError(null);
    setIsDeleting(true);

    try {
      const token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null;

      const payload = {
        sourceFinancialYear: financialYear,
        sourceMonth: Number(sourceMonth),
        categoryId: Number(categoryId),
      };

      const res = await fetch(`${API_BASE}/api/strategy/month/carry-allocate`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || result.success === false) {
        setDeleteError(result.message || "Failed to clear allocation. Please try again.");
        setIsDeleting(false);
        return;
      }

      setInputs({});
      setReason("");
      setIsConfirmingDelete(false);
      setIsDeleting(false);

      await fetchData();

      if (onSave) {
        onSave({ months: {}, reason: "Cleared carry allocation", result, action: "REMOVED" });
      }
    } catch (err) {
      console.error("MonthCarryAllocationModal DELETE error:", err);
      setDeleteError("Network error while clearing allocation. Please check your connection and try again.");
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const firstTargetMonthName = targetMonths[0]?.name || "Next Month";

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop with blur and click to close */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Enterprise Side Drawer */}
      <aside
        className="relative z-10 w-full sm:w-[560px] max-w-[calc(100vw-24px)] h-screen bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Allocate Carry"
      >
        {/* ══════════════════════════════════════════════════════════════
            DRAWER HEADER (h-[68px])
        ══════════════════════════════════════════════════════════════ */}
        <div className="h-[68px] px-6 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 leading-tight">Allocate Carry</h3>
              <p className="text-xs text-slate-500 font-normal">Move available closing carry into future months.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-2 hover:bg-slate-100 transition-colors"
            aria-label="Close drawer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            DRAWER BODY (Scrollable)
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5 bg-white">

          {/* SECTION 1 — CARRY SUMMARY (Compact 3-column block) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-3 text-left">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">SOURCE MONTH</span>
                <span className="text-sm font-semibold text-slate-900 truncate block">{sourceMonthName}</span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">CATEGORY</span>
                <span className="text-sm font-semibold text-slate-900 truncate block">{displayCategory}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">AVAILABLE</span>
                {fetchLoading ? (
                  <div className="h-5 w-20 bg-slate-200 animate-pulse rounded ml-auto" />
                ) : (
                  <span className={`text-base font-semibold tabular-nums block ${
                    carryType === "EXCESS" ? "text-emerald-600" : carryType === "SHORTFALL" ? "text-rose-600" : "text-slate-900"
                  }`}>
                    ₹{formatCurrency(availableAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>


          {/* Stale warning banner */}
          {!fetchLoading && (isCatStale || globalStale) && (
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 font-medium">
              <span className="text-amber-500 text-sm leading-none mt-0.5 shrink-0">⚠️</span>
              <span>
                Closing balance has changed since last allocation. Previous snapshot was ₹{formatCurrency(catData?.previousClosingSnapshot || 0)}. Please review and re-save.
              </span>
            </div>
          )}

          {/* Loading Skeleton */}
          {fetchLoading && (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Error State */}
          {!fetchLoading && fetchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-center text-xs text-rose-700 font-semibold">
              {fetchError}
            </div>
          )}

          {/* Balanced State */}
          {!fetchLoading && !fetchError && isBalanced && catData && (
            <div className="py-8 text-center text-xs text-slate-500 font-medium">
              This category is Balanced — no closing carry to allocate.
            </div>
          )}

          {/* SECTION 3 — TARGET MONTHS */}
          {!fetchLoading && !fetchError && !isBalanced && catData && targetQuarterGroups.length > 0 && (
            <div className="space-y-4">
              {/* Header & Quick Action */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  TARGET MONTHS
                </span>
                {targetMonths.length > 0 && remaining > 0 && !isBalanced && (
                  <button
                    type="button"
                    onClick={handleAllocateAllToNextMonth}
                    disabled={isSaving || isDeleting}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
                  >
                    <span>Allocate All → {firstTargetMonthName}</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Target Quarter Groups & Month Rows */}
              {targetQuarterGroups.map((quarter) => (
                <div key={quarter.quarterNumber} className="space-y-2">
                  <div className="flex items-center gap-2 pt-1 pb-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {quarter.label} · {quarter.subtitle}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="space-y-2">
                    {quarter.months.map((m) => {
                      const err = errors[m.number];
                      const val = inputs[m.number] ?? "";

                      return (
                        <div
                          key={m.number}
                          className={`flex items-center justify-between bg-white border rounded-xl min-h-[52px] px-4 py-2.5 transition-all ${
                            err
                              ? "border-rose-300 bg-rose-50/50"
                              : "border-slate-200 hover:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-500"
                          }`}
                        >
                          <span className="text-sm font-medium text-slate-700">
                            {m.name}
                          </span>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <span className="text-slate-400 font-medium text-sm select-none mr-2">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={val}
                                onChange={(e) => handleInput(m.number, e.target.value)}
                                placeholder="0"
                                disabled={isSaving || isDeleting}
                                className="w-32 text-right font-semibold text-slate-900 text-sm bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                              />
                            </div>
                            {err && (
                              <span className="text-xs text-rose-600 font-medium">{err}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 4 — ALLOCATION SUMMARY */}
          {!fetchLoading && !fetchError && !isBalanced && catData && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ALLOCATION SUMMARY
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Available</span>
                  <span className="font-semibold text-slate-900 tabular-nums">₹{formatCurrency(availableAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Allocated</span>
                  <span className="font-semibold text-slate-900 tabular-nums">₹{formatCurrency(totalAllocated)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-2 border-t border-slate-200 font-medium">
                  <span className="flex items-center gap-1">
                    Remaining Auto-Carry
                    <svg
                      className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-help"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-label="Any amount you don't allocate manually continues as automatic carry forward."
                    >
                      <title>Any amount you don&apos;t allocate manually continues as automatic carry forward.</title>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span className={`font-bold tabular-nums ${
                    isOverAllocated ? "text-rose-600" : remaining === 0 ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    ₹{formatCurrency(Math.max(0, remaining))}
                  </span>
                </div>
              </div>

              {/* Dynamic Semantic Indicator */}
              <div className="pt-2 border-t border-slate-200 text-xs font-semibold">
                {isOverAllocated && (
                  <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
                    <span>⚠️ Allocation exceeds available carry by ₹{formatCurrency(round2(totalAllocated - availableAmount))}</span>
                  </div>
                )}
                {isFullyAllocated && (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                    <span>✓ Fully Allocated</span>
                  </div>
                )}
                {isPartiallyAllocated && (
                  <div className="flex items-center gap-1.5 text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                    <span>↻ ₹{formatCurrency(remaining)} will auto-carry forward</span>
                  </div>
                )}
                {!isOverAllocated && !isFullyAllocated && !isPartiallyAllocated && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>↻ ₹{formatCurrency(availableAmount)} will auto-carry forward</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 5 — OPTIONAL REASON */}
          {!fetchLoading && !fetchError && !isBalanced && catData && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  REASON
                </label>
                <span className="text-xs text-slate-400 font-normal">Optional</span>
              </div>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. July pipeline confirmed"
                disabled={fetchLoading || isSaving}
                className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          )}

          {/* Delete Confirmation Banner */}
          {isConfirmingDelete && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">Clear manual allocation?</p>
                  <p className="text-rose-700 mt-0.5 font-normal">
                    Full balance of ₹{formatCurrency(availableAmount)} will revert to automatic carry.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isDeleting}
                    className="text-xs px-2.5 py-1 text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllocation}
                    disabled={isDeleting}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-xs transition-colors"
                  >
                    {isDeleting ? "Clearing..." : "Yes, Clear"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error messages */}
          {deleteError && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg font-medium">
              {deleteError}
            </div>
          )}
          {saveError && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg font-medium">
              {saveError}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            STICKY ACTION FOOTER
        ══════════════════════════════════════════════════════════════ */}
        <div className="h-[68px] px-6 border-t border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {hasExistingAllocation && !isConfirmingDelete && (
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingDelete(true);
                  setDeleteError(null);
                  setSaveError(null);
                }}
                disabled={fetchLoading || !!fetchError || isBalanced || isSaving || isDeleting}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Clear Allocation
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              disabled={fetchLoading || !!fetchError || isBalanced || isSaving || isDeleting}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={fetchLoading || !!fetchError || isBalanced || isOverAllocated || isSaving || isDeleting || isConfirmingDelete}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <span>{isSaving ? "Saving..." : "Confirm & Save →"}</span>
            </button>
          </div>
        </div>

      </aside>
    </div>
  );
}

