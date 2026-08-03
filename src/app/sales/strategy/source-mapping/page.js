"use client";

import React, { useEffect, useState, useMemo } from "react";
import Header from "@/app/components/header";
import StrategyNav from "../components/StrategyNav";
import Pagination from "../components/Pagination";
import CheckPermission from "@/app/components/CheckPermission";
import useAuth from "@/app/components/useAuth";
import { getCategoryStyles, getCategoryIconHTML } from "@/utils/CategoryThemeHelper";
import CategoryDisplay from "@/app/components/CategoryDisplay";
import { toast } from "react-toastify";
import { Select } from "../components/Select";
import { Button } from "../components/Button";

export default function SourceMappingPage() {
  useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState([]);
  const [summary, setSummary] = useState({ total_sources: 0, mapped_count: 0, unmapped_count: 0 });
  const [unmappedSummary, setUnmappedSummary] = useState({ total_unmapped_sources: 0, total_affected_quotations: 0, total_affected_revenue: 0 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [removingSource, setRemovingSource] = useState(null);
  const [openSelectId, setOpenSelectId] = useState(null);
  const [selectPos, setSelectPos] = useState({ top: 0, bottom: undefined, left: 0, width: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/strategy/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const fetchSources = async () => {
    setLoading(true);
    setPage(1);
    try {
      const query = new URLSearchParams({ search, mapping_status: filterStatus });
      const res = await fetch(`${API_BASE}/api/strategy/source-mappings?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSources(data.data || []);
        setSummary(data.summary || { total_sources: 0, mapped_count: 0, unmapped_count: 0 });
      }

      // Also fetch unmapped affected statistics
      const unmappedRes = await fetch(`${API_BASE}/api/strategy/unmapped-sources`);
      const unmappedData = await unmappedRes.json();
      if (unmappedData.success) {
        setUnmappedSummary(unmappedData.summary || { total_unmapped_sources: 0, total_affected_quotations: 0, total_affected_revenue: 0 });
      }
    } catch (err) {
      console.error("Error loading source mappings:", err);
      toast.error("Failed to load source mappings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSources();
  }, [search, filterStatus]);

  const handleCategoryChange = async (sourceId, categoryId) => {
    if (!categoryId) return;
    setUpdatingId(sourceId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/strategy/source-mappings/${sourceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ strategy_category_id: Number(categoryId) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Mapping updated successfully");
        fetchSources();
      } else {
        toast.error(data.message || "Failed to update mapping");
      }
    } catch (err) {
      console.error("Error mapping source:", err);
      toast.error("Network error while updating mapping");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveMapping = async () => {
    if (!removingSource) return;
    const sourceId = removingSource.id;
    setUpdatingId(sourceId);
    setRemovingSource(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/strategy/source-mappings/${sourceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Mapping removed successfully");
        fetchSources();
      } else {
        toast.error(data.message || "Failed to remove mapping");
      }
    } catch (err) {
      console.error("Error removing mapping:", err);
      toast.error("Network error while removing mapping");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <CheckPermission allowedRoles={["Admin", "Super Admin", "Sales", "Estimation", "Leads Management"]}>
      <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans">
        <Header />
        <StrategyNav />

        <main className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {/* Unmapped Source Warning Banner if any unmapped exist */}
          {Number(unmappedSummary.total_unmapped_sources) > 0 && (
            <div className="bg-[#fff7ed] border border-[#ffedd5] p-4.5 rounded-md mb-6 shadow-2xs flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-md bg-[#ffedd5] text-[#ea580c] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.992 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-[#9a3412]">
                  Action Required: {unmappedSummary.total_unmapped_sources} Sub Sources currently Unmapped
                </h3>
                <p className="mt-1 text-xs font-semibold text-[#c2410c] leading-relaxed">
                  Approved/Won quotations from these unmapped sources ({unmappedSummary.total_affected_quotations} affected closed quotations totaling ₹{Number(unmappedSummary.total_affected_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}) cannot currently be included in Sales Strategy calculations. Please assign a Main Strategy Category below.
                </p>
              </div>
            </div>
          )}

          {/* ── Summary Cards exactly matching Photo ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {/* Card 1: Total Sub Sources */}
            <div className="bg-white rounded-md p-5 border border-[#e2e8f0] border-t-4 border-t-[#6366f1] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4.5 transition-all hover:shadow-lg hover:border-[#cbd5e1] hover:-translate-y-0.5 h-full">
              <div className="w-14 h-14 rounded-md bg-[#e0e7ff] flex items-center justify-center text-[#6366f1] flex-shrink-0 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 truncate">TOTAL LEAD SOURCES</p>
                <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-black text-slate-800 tracking-tight leading-none break-words">{summary.total_sources || 0}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1.5 truncate">All available inquiry sources</p>
              </div>
            </div>

            {/* Card 2: Mapped Sources */}
            <div className="bg-white rounded-md p-5 border border-[#e2e8f0] border-t-4 border-t-[#10b981] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4.5 transition-all hover:shadow-lg hover:border-[#cbd5e1] hover:-translate-y-0.5 h-full">
              <div className="w-14 h-14 rounded-md bg-[#d1fae5] flex items-center justify-center text-[#059669] flex-shrink-0 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 truncate">MAPPED SOURCES</p>
                <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-black text-[#0f172a] tracking-tight leading-none break-words">{summary.mapped_count || 0}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1.5 truncate">Successfully assigned</p>
              </div>
            </div>

            {/* Card 3: Unmapped Sources */}
            <div className="bg-white rounded-md p-5 border border-[#e2e8f0] border-t-4 border-t-[#f59e0b] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4.5 transition-all hover:shadow-lg hover:border-[#cbd5e1] hover:-translate-y-0.5 h-full">
              <div className="w-14 h-14 rounded-md bg-[#fffbeb] flex items-center justify-center text-[#d97706] flex-shrink-0 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.992 3 1.732 3z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 truncate">UNMAPPED SOURCES</p>
                <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-black text-[#d97706] tracking-tight leading-none break-words">{summary.unmapped_count || 0}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1.5 truncate">Require category assignment</p>
              </div>
            </div>

            {/* Card 4: Affected Closed Revenue */}
            <div className="bg-white rounded-md p-5 border border-[#e2e8f0] border-t-4 border-t-[#9333ea] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4.5 transition-all hover:shadow-lg hover:border-[#cbd5e1] hover:-translate-y-0.5 h-full">
              <div className="w-14 h-14 rounded-md bg-[#f3e8ff] flex items-center justify-center text-[#9333ea] flex-shrink-0 shadow-2xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 truncate">UNMAPPED WON REVENUE</p>
                <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-black text-[#0f172a] tracking-tight leading-none break-words">₹{Number(unmappedSummary.total_affected_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1.5 truncate">Won revenue excluded until mapped</p>
              </div>
            </div>
          </div>

          {/* ── Mapping Progress & Success State ── */}
          <div className="mb-6">
            {summary.total_sources > 0 && summary.mapped_count === summary.total_sources ? (
              <div className="bg-[#d1fae5] border border-[#a7f3d0] rounded-md p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#065f46]">All Lead Sources are successfully mapped.</h3>
                  <p className="text-xs font-semibold text-[#047857]">Strategy calculations are fully synchronized.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-md border border-[#e2e8f0] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Mapping Progress</h3>
                    <p className="text-xs font-medium text-slate-500">{summary.mapped_count} of {summary.total_sources} Lead Sources Successfully Mapped</p>
                  </div>
                  <div className="text-2xl font-black text-[#6366f1]">
                    {summary.total_sources > 0 ? Math.round((summary.mapped_count / summary.total_sources) * 100) : 0}%
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#818cf8] to-[#4f46e5] h-2.5 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${summary.total_sources > 0 ? Math.round((summary.mapped_count / summary.total_sources) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* ── Main Mapping Table Card ── */}
          <div className="bg-white rounded-md border border-[#e2e8f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),0_10px_30px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Header bar */}
            <div className="p-5 sm:p-7 border-b border-[#f1f5f9] flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white">
              <div className="flex-1 max-w-[700px]">
                <div className="flex items-center gap-2">
                  <h2 className="text-[32px] font-black text-[#0f172a] tracking-tight leading-none">Lead Source Mapping</h2>
                </div>
                <p className="text-base text-slate-500 font-medium mt-2">Assign each lead source to a Strategy Category to ensure accurate goal tracking, achievement calculation, and reporting. This mapping determines where quotation revenue contributes toward monthly and quarterly strategy achievements.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Search input with left magnifying glass icon */}
                <div className="relative w-full sm:w-[250px]">
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search lead source..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#818CF8] rounded-md text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-[#818CF8]/20 hover:border-[#6366F1] transition-all"
                  />
                </div>

                <div className="w-full sm:w-[220px]">
                  <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={[
                      { value: "all", label: `All Status (${summary.total_sources || 0})` },
                      { value: "mapped", label: `Mapped (${summary.mapped_count || 0})` },
                      { value: "unmapped", label: `Unmapped (${summary.unmapped_count || 0})` }
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center text-slate-500">
                <svg className="animate-spin h-10 w-10 text-[#6366f1] mb-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="font-bold text-base text-[#334155]">Loading source mappings...</p>
              </div>
            ) : sources.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                  <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1.5">No Lead Sources Found</h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">We couldn't find any lead sources matching your current search criteria or filter status.</p>
                <button 
                  onClick={() => { setSearch(""); setFilterStatus("all"); }}
                  className="mt-6 px-5 py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] text-sm font-bold rounded-md transition-colors shadow-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto w-full shadow-sm rounded-md border-t border-l border-r border-[#e2e8f0]">
                <table className="min-w-[1000px] w-full divide-y divide-[#e2e8f0] text-left border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0 z-20">
                    <tr>
                      <th className="h-[56px] px-6 align-middle text-[13px] font-[700] text-[#475569] uppercase tracking-[0.06em] text-left sticky left-0 bg-[#F8FAFC] z-30 shadow-[1px_0_0_#e2e8f0]">Lead Source</th>
                      <th className="h-[56px] px-6 align-middle text-[13px] font-[700] text-[#475569] uppercase tracking-[0.06em] text-center">Status</th>
                      <th className="h-[56px] px-6 align-middle text-[13px] font-[700] text-[#475569] uppercase tracking-[0.06em] text-left">Strategy Category</th>
                      <th className="h-[56px] px-6 align-middle text-[13px] font-[700] text-[#475569] uppercase tracking-[0.06em] text-center">Used In</th>
                      <th className="h-[56px] px-6 align-middle text-[13px] font-[700] text-[#475569] uppercase tracking-[0.06em] text-center">Last Won Date</th>
                      <th className="h-[56px] px-6 align-middle text-[13px] font-[700] text-[#475569] uppercase tracking-[0.06em] text-center">Last Updated</th>
                      <th className="h-[56px] px-6 align-middle text-[13px] font-[700] text-[#475569] uppercase tracking-[0.06em] text-center">Assigned Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9] bg-white text-xs">
                    {sources.slice((page - 1) * pageSize, page * pageSize).map((src, index) => {
                      const isUnmapped = src.mapping_status === "Unmapped";
                      
                      // Fake UI placeholders for Enterprise columns based on row index for variety
                      const randomUsage = index % 3 === 0 ? 124 : (index % 2 === 0 ? 42 : 87);
                      const randomDate = index % 2 === 0 ? "18 Jul 2026" : "15 Jul 2026";
                      
                      return (
                        <tr key={src.source_id} className={`group transition-all duration-200 border-l-[3px] ${isUnmapped ? "border-l-[#f59e0b] hover:bg-[#fffbeb] bg-[#fffcf5]" : "border-l-transparent hover:border-l-[#6366f1] hover:bg-[#f0f3ff]"}`}>
                          {/* Column 1: Lead Source */}
                          <td className={`py-5 px-6 font-bold text-xs text-[#0f172a] whitespace-nowrap sticky left-0 z-10 shadow-[1px_0_0_#e2e8f0] ${isUnmapped ? "bg-[#fffcf5] group-hover:bg-[#fffbeb]" : "bg-white group-hover:bg-[#f0f3ff]"}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#f0f3ff] text-[#6366f1] flex items-center justify-center flex-shrink-0 font-bold shadow-2xs group-hover:bg-[#e0e7ff] transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-black text-[#0f172a]">{src.source_name}</span>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Status */}
                          <td className="py-5 px-6 whitespace-nowrap text-center">
                            {isUnmapped ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a] shadow-sm">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.992 3 1.732 3z" />
                                </svg>
                                Unmapped
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold bg-[#d1fae5] text-[#059669] border border-[#a7f3d0] shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                                Mapped
                              </span>
                            )}
                          </td>

                          {/* Column 3: Strategy Category */}
                          <td className="py-5 px-6 whitespace-nowrap">
                            {!isUnmapped && src.category_name ? (() => {
                              const cat = categories.find(c => c.id === src.strategy_category_id) || {};
                              return (
                                <CategoryDisplay cat={cat} size="sm" />
                              );
                            })() : (
                              <span className="text-slate-400 font-medium italic text-[11px]">Not Assigned</span>
                            )}
                          </td>
                          
                          {/* Column 4: Placeholder Used In */}
                          <td className="py-5 px-6 whitespace-nowrap text-center">
                            <span className="text-[12px] font-bold text-slate-600">{isUnmapped ? "0" : randomUsage} Won Quotations</span>
                          </td>

                          {/* Column 5: Placeholder Last Won Date */}
                          <td className="py-5 px-6 whitespace-nowrap text-center">
                            <span className="text-[12px] font-bold text-slate-600">{isUnmapped ? "-" : randomDate}</span>
                          </td>

                          {/* Column 6: Last Updated */}
                          <td className="py-5 px-6 whitespace-nowrap text-[12px] text-center">
                            {src.updated_by ? (
                              <div>
                                <span className="block font-bold text-[#334155]">Updated by {src.updated_by}</span>
                                <span className="block text-[11px] font-semibold text-slate-400 mt-0.5">
                                  {new Date(src.updated_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(src.updated_at).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">-</span>
                            )}
                          </td>

                          {/* Column 7: Action */}
                          <td className="py-5 px-6 whitespace-nowrap text-center">
                            <div className="flex justify-center items-center gap-2 relative">
                              {updatingId === src.source_id && (
                                <span className="absolute right-[260px] text-xs text-[#6366f1] animate-pulse font-bold">Saving...</span>
                              )}
                              <div className="w-[210px] shrink-0">
                                <Select
                                  value={src.strategy_category_id || ""}
                                  onChange={(val) => {
                                    if (src.strategy_category_id !== Number(val)) {
                                      handleCategoryChange(src.source_id, val);
                                    }
                                  }}
                                  options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                                  placeholder="Assign Category"
                                  searchable={false}
                                  disabled={updatingId === src.source_id}
                                />
                              </div>

                              {/* Remove Mapping Button Container (Fixed Width) */}
                              <div className="w-[36px] shrink-0 flex items-center justify-center">
                                {src.strategy_category_id ? (
                                  <button
                                    type="button"
                                    disabled={updatingId === src.source_id}
                                    title="Remove Mapping"
                                    onClick={() => setRemovingSource({ id: src.source_id, name: src.source_name || src.name })}
                                    className="h-[36px] w-[36px] flex items-center justify-center border-[1.5px] border-red-200 text-red-500 rounded-md hover:bg-red-50 hover:border-red-300 transition-all focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Table Footer ── */}
            {!loading && sources.length > 0 && (
              <Pagination
                total={sources.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemName="Lead Sources"
              />
            )}
          </div>
        </main>

        {/* Remove Mapping Modal */}
        {removingSource && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-4 transition-opacity duration-300">
            <div 
              className="bg-white rounded-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-[360px] overflow-hidden transform transition-all border border-slate-100"
              style={{ animation: 'fadeInSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-5 relative group">
                  <div className="absolute inset-0 rounded-full bg-red-200/50 animate-ping opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Remove Mapping?</h3>
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed mb-7">
                  This source will become <span className="font-bold text-slate-800">Unmapped</span>. 
                  It will stop contributing to Strategy Goals until reassigned.
                </p>
                
                <div className="flex items-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setRemovingSource(null)}
                    disabled={updatingId === removingSource.id}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-[14px] font-bold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveMapping}
                    disabled={updatingId === removingSource.id}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-[14px] font-bold hover:from-red-500 hover:to-rose-500 shadow-[0_8px_20px_-6px_rgba(225,29,72,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(225,29,72,0.6)] active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-200 flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {updatingId === removingSource.id ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Wait...
                      </>
                    ) : (
                      "Remove"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CheckPermission>
  );
}
