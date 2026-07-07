"use client";

import Header from "@/app/components/header";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Coins,
  Percent,
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingDown,
  Layers,
  CheckCircle,
  Building,
  Users,
  Calendar,
  RefreshCw,
  TrendingUp as TrendUpIcon,
  BarChart as BarChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Set this in .env.local as: NEXT_PUBLIC_BACKEND_URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

function formatCurrency(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const containerRef = React.useRef(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setSearchTerm("");
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={index}
              className="bg-amber-200 font-semibold text-slate-900 p-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={
          className ||
          "w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 cursor-pointer flex justify-between items-center"
        }
      >
        <span className={selectedOption ? "text-slate-800" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i
          className={`bi bi-chevron-down transition-transform duration-200 ${isOpen ? "rotate-180" : ""} text-slate-400 ml-2`}
        ></i>
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto flex flex-col p-2 gap-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-slate-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 mb-1 text-slate-800"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          {filteredOptions.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-2">
              No matches found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option);
                }}
                className={`p-2 hover:bg-orange-50 rounded-lg text-xs cursor-pointer text-slate-700 hover:text-orange-950 transition-colors ${value === option.value ? "bg-orange-50 font-bold text-orange-950" : ""}`}
              >
                {highlightMatch(option.label, searchTerm)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Page() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state variables for Architecture Commission management
  const [allArchitects, setAllArchitects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showArchModal, setShowArchModal] = useState(false);
  const [assignedArchitects, setAssignedArchitects] = useState([]);
  const [loadingArch, setLoadingArch] = useState(false);
  const [savingArch, setSavingArch] = useState(false);
  const [modalError, setModalError] = useState(null);

  // New state variables for Project Expense management
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [projectExpenses, setProjectExpenses] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [loadingExpense, setLoadingExpense] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseModalError, setExpenseModalError] = useState(null);
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newExpenseDescription, setNewExpenseDescription] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTab, setViewTab] = useState("details");
  const [loadingView, setLoadingView] = useState(false);
  const [viewArchitectures, setViewArchitectures] = useState([]);
  const [viewExpenses, setViewExpenses] = useState([]);
  const [viewModalTimeframe, setViewModalTimeframe] = useState("monthly"); // 'weekly', 'monthly', 'yearly'

  // ========================
  // PAGINATION STATES
  // ========================
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getProjectExpenseTimeSeries = () => {
    const items = [...viewExpenses];

    // Add architecture commissions as expenses for the time series
    viewArchitectures.forEach((arch) => {
      items.push({
        expense_category: "Architecture Commission",
        expense_amount: Number(arch.architecture_amount) || 0,
        created_at: arch.created_at,
      });
    });

    // Sort items chronologically by date
    items.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateA - dateB;
    });

    if (items.length === 0) return [];

    const groups = {};
    const orderedLabels = [];

    items.forEach((item) => {
      const date = new Date(item.created_at || new Date());
      if (isNaN(date.getTime())) return;

      let label = "";
      if (viewModalTimeframe === "weekly") {
        const day = date.getDay();
        const diff = date.getDate() - day;
        const sunday = new Date(date.setDate(diff));
        label = sunday.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
      } else if (viewModalTimeframe === "monthly") {
        label = date.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        });
      } else {
        // yearly
        label = date.getFullYear().toString();
      }

      if (groups[label] === undefined) {
        groups[label] = 0;
        orderedLabels.push(label);
      }
      groups[label] += Number(item.expense_amount) || 0;
    });

    return orderedLabels.map((label) => ({
      label,
      amount: groups[label],
    }));
  };

  const getProjectExpenseCategories = () => {
    const categories = {};

    viewExpenses.forEach((exp) => {
      const cat = exp.expense_category || "Uncategorized";
      categories[cat] =
        (categories[cat] || 0) + (Number(exp.expense_amount) || 0);
    });

    const totalArch = viewArchitectures.reduce(
      (sum, arch) => sum + (Number(arch.architecture_amount) || 0),
      0,
    );
    if (totalArch > 0) {
      categories["Architecture Commission"] = totalArch;
    }

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editGrandTotal, setEditGrandTotal] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editModalError, setEditModalError] = useState(null);

  // Analytics state
  const [viewMode, setViewMode] = useState("analytics"); // 'list' or 'analytics'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [expenseTimeframe, setExpenseTimeframe] = useState("monthly"); // 'weekly', 'monthly', 'yearly'

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${API_BASE_URL}/api/project/analytics/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setAnalyticsData(json.data);
      } else {
        throw new Error(json.message || "Failed to load analytics");
      }
    } catch (err) {
      setAnalyticsError(err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (viewMode === "analytics" && !analyticsData) {
      fetchAnalytics();
    }
  }, [viewMode]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        // ⚠️ Update 'token' below to match the actual key name you use
        // when saving the JWT after login (check DevTools → Application → Local Storage)
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("You are not logged in. Please login again.");
        }

        const res = await fetch(`${API_BASE_URL}/api/project/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.message || "Failed to load projects");
        }

        setProjects(json.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchArchitects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/architect`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setAllArchitects(json.data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching architects:", err);
      }
    };

    fetchProjects();
    fetchArchitects();
  }, []);

  // Manage Architecture assignment modal logic
  const handleManageArchitecture = async (project) => {
    setSelectedProject(project);
    setAssignedArchitects([]);
    setModalError(null);
    setLoadingArch(true);
    setShowArchModal(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/project/${project.id}/architectures`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(
          `Failed to load project architectures (Status ${res.status})`,
        );
      }

      const json = await res.json();
      if (json.success) {
        setAssignedArchitects(json.data || []);
      } else {
        throw new Error(json.message || "Failed to load project architectures");
      }
    } catch (err) {
      setModalError(err.message);
    } finally {
      setLoadingArch(false);
    }
  };

  const addArchitect = (architectId) => {
    if (!architectId) return;
    const arch = allArchitects.find(
      (a) => String(a.id) === String(architectId),
    );
    if (!arch) return;

    // Check if already assigned
    if (
      assignedArchitects.some(
        (a) =>
          String(a.id) === String(arch.id) || a.architecture_name === arch.name,
      )
    ) {
      return;
    }

    setAssignedArchitects((prev) => [
      ...prev,
      {
        id: arch.id,
        architecture_name: arch.name,
        name: arch.name,
        email: arch.email,
        mobile_no: arch.mobile_no,
        address: arch.address,
        percentage: 0,
        architecture_amount: 0,
      },
    ]);
  };

  const updatePercentage = (index, value) => {
    const val = parseFloat(value);
    const pct = isNaN(val) ? 0 : val;
    const baseAmount = Number(selectedProject?.amount || 0);
    const amount = baseAmount * (pct / 100);

    setAssignedArchitects((prev) => {
      const copy = [...prev];
      copy[index].percentage = value; // Keep raw value to allow decimal typing
      copy[index].architecture_amount = amount.toFixed(2);
      return copy;
    });
  };

  const updateAmount = (index, value) => {
    const val = parseFloat(value);
    const amount = isNaN(val) ? 0 : val;
    const baseAmount = Number(selectedProject?.amount || 0);
    const pct = baseAmount > 0 ? (amount / baseAmount) * 100 : 0;

    setAssignedArchitects((prev) => {
      const copy = [...prev];
      copy[index].architecture_amount = value; // Keep raw value to allow decimal typing
      copy[index].percentage = pct.toFixed(2);
      return copy;
    });
  };

  const removeArchitect = (index) => {
    setAssignedArchitects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveArchitectures = async () => {
    setSavingArch(true);
    setModalError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/project/${selectedProject.id}/architectures`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ architectures: assignedArchitects }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update architectures");
      }

      // Update the projects list locally to show new totals
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === selectedProject.id) {
            return {
              ...p,
              architecture_net_amount: json.data.architecture_net_amount,
              expense_net_amount: json.data.expense_net_amount,
              net_revenue_amount: json.data.net_revenue_amount,
            };
          }
          return p;
        }),
      );

      setShowArchModal(false);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSavingArch(false);
    }
  };

  const handleManageExpenses = async (project) => {
    setSelectedProject(project);
    setProjectExpenses([]);
    setExpenseModalError(null);
    setLoadingExpense(true);
    setShowExpenseModal(true);

    // Reset inputs
    setNewExpenseCategory("");
    setNewExpenseDescription("");
    setNewExpenseAmount("");

    try {
      const token = localStorage.getItem("token");

      // 1. Fetch active categories
      const catRes = await fetch(
        `${API_BASE_URL}/api/expense-category/read?status=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (catRes.ok) {
        const catJson = await catRes.json();
        setActiveCategories(Array.isArray(catJson) ? catJson : []);
      }

      // 2. Fetch project expenses
      const expRes = await fetch(
        `${API_BASE_URL}/api/project/${project.id}/expenses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!expRes.ok) {
        throw new Error(
          `Failed to load project expenses (Status ${expRes.status})`,
        );
      }
      const expJson = await expRes.json();
      if (expJson.success) {
        setProjectExpenses(expJson.data || []);
      } else {
        throw new Error(expJson.message || "Failed to load project expenses");
      }
    } catch (err) {
      setExpenseModalError(err.message);
    } finally {
      setLoadingExpense(false);
    }
  };

  const addExpense = () => {
    if (!newExpenseCategory) {
      setExpenseModalError("Please select an expense category");
      return;
    }
    const amt = parseFloat(newExpenseAmount);
    if (isNaN(amt) || amt <= 0) {
      setExpenseModalError("Please enter a valid expense cost");
      return;
    }

    setExpenseModalError(null);
    setProjectExpenses((prev) => [
      ...prev,
      {
        expense_category: newExpenseCategory,
        description: newExpenseDescription,
        expense_amount: amt,
      },
    ]);

    setNewExpenseCategory("");
    setNewExpenseDescription("");
    setNewExpenseAmount("");
  };

  const handleExpenseKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addExpense();
    }
  };

  const removeExpense = (index) => {
    setProjectExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveExpenses = async () => {
    setSavingExpense(true);
    setExpenseModalError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/project/${selectedProject.id}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ expenses: projectExpenses }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update project expenses");
      }

      // Update the projects list locally to show new totals
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === selectedProject.id) {
            return {
              ...p,
              architecture_net_amount: json.data.architecture_net_amount,
              expense_net_amount: json.data.expense_net_amount,
              net_revenue_amount: json.data.net_revenue_amount,
            };
          }
          return p;
        }),
      );

      setShowExpenseModal(false);
    } catch (err) {
      setExpenseModalError(err.message);
    } finally {
      setSavingExpense(false);
    }
  };

  const handleViewProject = async (project) => {
    setSelectedProject(project);
    setViewTab("analytics");
    setLoadingView(true);
    setShowViewModal(true);
    setViewArchitectures([]);
    setViewExpenses([]);

    try {
      const token = localStorage.getItem("token");

      // 1. Fetch architectures
      const archRes = await fetch(
        `${API_BASE_URL}/api/project/${project.id}/architectures`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (archRes.ok) {
        const archJson = await archRes.json();
        if (archJson.success) {
          setViewArchitectures(archJson.data || []);
        }
      }

      // 2. Fetch expenses
      const expRes = await fetch(
        `${API_BASE_URL}/api/project/${project.id}/expenses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (expRes.ok) {
        const expJson = await expRes.json();
        if (expJson.success) {
          setViewExpenses(expJson.data || []);
        }
      }
    } catch (err) {
      console.error("Error loading view details:", err);
    } finally {
      setLoadingView(false);
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditCompanyName(project.company_name || "");
    setEditCustomerName(project.customer_name || "");
    setEditReference(project.reference || "");
    setEditSource(project.source || "");
    setEditGrandTotal(
      project.grand_total === 0 ||
        project.grand_total === "0" ||
        project.grand_total === "0.00"
        ? ""
        : project.grand_total,
    );
    setEditAmount(
      project.amount === 0 ||
        project.amount === "0" ||
        project.amount === "0.00"
        ? ""
        : project.amount,
    );
    setEditModalError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    setEditModalError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/project/update/${selectedProject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            company_name: editCompanyName,
            customer_name: editCustomerName,
            reference: editReference,
            source: editSource,
            grand_total: parseFloat(editGrandTotal) || 0,
            amount: parseFloat(editAmount) || 0,
          }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update project");
      }

      // Update local state
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === selectedProject.id) {
            return {
              ...p,
              company_name: json.data.company_name,
              customer_name: json.data.customer_name,
              reference: json.data.reference,
              source: json.data.source,
              grand_total: json.data.grand_total,
              amount: json.data.amount,
              net_revenue_amount: json.data.net_revenue_amount,
            };
          }
          return p;
        }),
      );

      setShowEditModal(false);
    } catch (err) {
      setEditModalError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This will permanently remove the project along with all assigned architecture commissions and expenses.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/project/delete/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to delete project");
      }

      // Remove from state list
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ========================
  // PAGINATION LOGIC (matches Quotation page)
  // ========================
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, viewMode, projects.length]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedProjects = projects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(projects.length / itemsPerPage);

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
        <div className="bg-white w-full shadow-lg p-3 mt-1 mb-2 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
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
                href="/sales/projects"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Projects
              </Link>
            </p>
          </div>
        </div>

        <div className="px-4 pb-4 pt-2 md:px-8 md:pb-8 md:pt-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                Project Workspace
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {viewMode === "list"
                  ? loading
                    ? "Loading projects..."
                    : `${projects.length} active project records`
                  : "Interactive financial performance & cost analytics dashboard"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {viewMode === "analytics" && (
                <button
                  onClick={fetchAnalytics}
                  disabled={loadingAnalytics}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
                  title="Refresh Analytics"
                >
                  <RefreshCw
                    size={14}
                    className={loadingAnalytics ? "animate-spin" : ""}
                  />
                  <span>Refresh</span>
                </button>
              )}

              <div className="bg-slate-100/85 p-1 rounded-xl flex items-center shadow-inner border border-slate-200/50">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-slate-800 shadow-md scale-100"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Briefcase size={13} />
                  <span>Project List</span>
                </button>
                <button
                  onClick={() => setViewMode("analytics")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "analytics"
                      ? "bg-white text-orange-600 shadow-md scale-100"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <BarChart2 size={13} />
                  <span>Analytics Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {viewMode === "analytics" ? (
            <div className="space-y-6">
              {loadingAnalytics && !analyticsData ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                  <p className="text-sm font-semibold text-slate-500 animate-pulse">
                    Assembling financial dashboard...
                  </p>
                </div>
              ) : analyticsError ? (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                  <i className="bi bi-exclamation-octagon-fill text-rose-500 text-3xl mb-2 block"></i>
                  <h3 className="text-sm font-bold text-rose-800">
                    Failed to load analytics dashboard
                  </h3>
                  <p className="text-xs text-rose-600 mt-1">{analyticsError}</p>
                  <button
                    onClick={fetchAnalytics}
                    className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : analyticsData ? (
                <>
                  {/* 1. Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Projects */}
                    <div className="bg-gradient-to-br from-white to-indigo-50/40 hover:to-indigo-50/80 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                          <Building size={20} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Projects
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-800 mt-0.5">
                          {analyticsData.stats.total_projects}
                        </h2>
                      </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="bg-gradient-to-br from-white to-orange-50/40 hover:to-orange-50/80 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600 group-hover:scale-110 transition-transform duration-300">
                          <Coins size={20} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Revenue
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-800 mt-0.5">
                          {formatCurrency(analyticsData.stats.total_revenue)}
                        </h2>
                      </div>
                    </div>

                    {/* Architecture Net */}
                    <div className="bg-gradient-to-br from-white to-amber-50/40 hover:to-amber-50/80 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform duration-300">
                          <Percent size={20} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Architecture Net
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-800 mt-0.5">
                          {formatCurrency(
                            analyticsData.stats.total_architecture_net,
                          )}
                        </h2>
                      </div>
                    </div>

                    {/* Total Expenses */}
                    <div className="bg-gradient-to-br from-white to-rose-50/40 hover:to-rose-50/80 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:scale-110 transition-transform duration-300">
                          <TrendingDown size={20} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Total Expenses
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-800 mt-0.5">
                          {formatCurrency(
                            analyticsData.stats.total_expense_net,
                          )}
                        </h2>
                      </div>
                    </div>

                    {/* Net Revenue */}
                    <div className="bg-gradient-to-br from-white to-emerald-50/40 hover:to-emerald-50/80 rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                          <TrendingUp size={20} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Net Revenue
                        </span>
                        <h2 className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                          {formatCurrency(
                            analyticsData.stats.total_net_revenue,
                          )}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Parse numeric values for Recharts to render correctly (not as strings) */}
                  {(() => {
                    const monthlyFinancialsParsed = (
                      analyticsData.monthlyFinancials || []
                    ).map((m) => ({
                      ...m,
                      revenue: Number(m.revenue) || 0,
                      expenses: Number(m.expenses) || 0,
                      net_revenue: Number(m.net_revenue) || 0,
                    }));

                    const expenseByCategoryParsed = (
                      analyticsData.expenseByCategory || []
                    ).map((e) => ({
                      ...e,
                      total_amount: Number(e.total_amount) || 0,
                    }));

                    const totalExpensesSum = expenseByCategoryParsed.reduce(
                      (sum, item) => sum + item.total_amount,
                      0,
                    );

                    const expensesOverTimeParsed = (
                      analyticsData.expensesOverTime[expenseTimeframe] || []
                    ).map((item) => ({
                      ...item,
                      amount: Number(item.amount) || 0,
                    }));

                    const architectureByArchitectParsed = (
                      analyticsData.architectureByArchitect || []
                    ).map((item) => ({
                      ...item,
                      total_amount: Number(item.total_amount) || 0,
                    }));

                    return (
                      <>
                        {/* 2. Charts Row 1: Monthly Financial Trend & Expense Category breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Monthly Financial Trend Chart */}
                          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <BarChart2
                                  size={16}
                                  className="text-orange-500"
                                />
                                Monthly Financial Performance Trend
                              </h3>
                            </div>
                            <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={monthlyFinancialsParsed}
                                  margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f1f5f9"
                                  />
                                  <XAxis
                                    dataKey="month_name"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      background: "#fff",
                                      borderRadius: "12px",
                                      border: "1px solid #f1f5f9",
                                      boxShadow:
                                        "0 10px 15px -3px rgb(0 0 0 / 0.05)",
                                    }}
                                    formatter={(value) => formatCurrency(value)}
                                  />
                                  <Legend
                                    wrapperStyle={{
                                      fontSize: 11,
                                      paddingTop: 10,
                                    }}
                                  />
                                  <Bar
                                    dataKey="revenue"
                                    name="Grand Total"
                                    fill="#4f46e5"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={20}
                                  />
                                  <Bar
                                    dataKey="expenses"
                                    name="Expenses"
                                    fill="#f43f5e"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={20}
                                  />
                                  <Bar
                                    dataKey="net_revenue"
                                    name="Net Revenue"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={20}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Expense Category distribution */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-2">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <PieChartIcon
                                  size={16}
                                  className="text-rose-500"
                                />
                                Expense Category Distribution
                              </h3>
                            </div>
                            <div className="h-60 w-full relative flex items-center justify-center">
                              {expenseByCategoryParsed.length === 0 ? (
                                <p className="text-xs text-slate-400 font-medium">
                                  No expenses data available.
                                </p>
                              ) : (
                                <>
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <PieChart>
                                      <Pie
                                        data={expenseByCategoryParsed}
                                        dataKey="total_amount"
                                        nameKey="expense_category"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={3}
                                      >
                                        {expenseByCategoryParsed.map(
                                          (entry, index) => {
                                            const COLORS = [
                                              "#f43f5e",
                                              "#3b82f6",
                                              "#10b981",
                                              "#f59e0b",
                                              "#8b5cf6",
                                              "#06b6d4",
                                              "#64748b",
                                            ];
                                            return (
                                              <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                  COLORS[index % COLORS.length]
                                                }
                                              />
                                            );
                                          },
                                        )}
                                      </Pie>
                                      <Tooltip
                                        formatter={(value) =>
                                          formatCurrency(value)
                                        }
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  {/* Center text */}
                                  <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Total
                                    </span>
                                    <span className="text-sm font-extrabold text-slate-800">
                                      {formatCurrency(totalExpensesSum)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                            {/* Tiny Legend */}
                            <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 custom-scroll mt-2">
                              {expenseByCategoryParsed.map((cat, idx) => {
                                const COLORS = [
                                  "#f43f5e",
                                  "#3b82f6",
                                  "#10b981",
                                  "#f59e0b",
                                  "#8b5cf6",
                                  "#06b6d4",
                                  "#64748b",
                                ];
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-[11px] font-semibold text-slate-600"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{
                                          backgroundColor:
                                            COLORS[idx % COLORS.length],
                                        }}
                                      ></span>
                                      <span className="truncate max-w-[120px]">
                                        {cat.expense_category}
                                      </span>
                                    </div>
                                    <span className="text-slate-800">
                                      {formatCurrency(cat.total_amount)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 3. Charts Row 2: Expense timeframe & Architect breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                          {/* Expense timeframe analysis */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Calendar
                                  size={16}
                                  className="text-orange-500"
                                />
                                Expenses Over Time
                              </h3>
                              {/* Timeframe selector */}
                              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                                {["weekly", "monthly", "yearly"].map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => setExpenseTimeframe(t)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold capitalize transition-all cursor-pointer ${
                                      expenseTimeframe === t
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="h-64 w-full">
                              {expensesOverTimeParsed.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                  <p className="text-xs text-slate-400 font-medium">
                                    No expense entries found in this range.
                                  </p>
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={expensesOverTimeParsed}
                                    margin={{
                                      top: 10,
                                      right: 10,
                                      left: -20,
                                      bottom: 0,
                                    }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#f1f5f9"
                                    />
                                    <XAxis
                                      dataKey={
                                        expenseTimeframe === "weekly"
                                          ? "week_start"
                                          : expenseTimeframe === "monthly"
                                            ? "month_name"
                                            : "year_key"
                                      }
                                      stroke="#94a3b8"
                                      fontSize={10}
                                      tickLine={false}
                                    />
                                    <YAxis
                                      stroke="#94a3b8"
                                      fontSize={10}
                                      tickLine={false}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        background: "#fff",
                                        borderRadius: "12px",
                                        border: "1px solid #f1f5f9",
                                      }}
                                      formatter={(value) =>
                                        formatCurrency(value)
                                      }
                                    />
                                    <Bar
                                      dataKey="amount"
                                      name="Expense Cost"
                                      fill="#f43f5e"
                                      radius={[4, 4, 0, 0]}
                                      maxBarSize={30}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          </div>

                          {/* Architecture Commission by Architect */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Users size={16} className="text-amber-500" />
                                Architect Commission Rankings
                              </h3>
                            </div>
                            <div className="h-64 w-full">
                              {architectureByArchitectParsed.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                  <p className="text-xs text-slate-400 font-medium">
                                    No architecture commissions assigned.
                                  </p>
                                </div>
                              ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={architectureByArchitectParsed}
                                    layout="vertical"
                                    margin={{
                                      top: 10,
                                      right: 10,
                                      left: 10,
                                      bottom: 0,
                                    }}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#f1f5f9"
                                      horizontal={true}
                                      vertical={false}
                                    />
                                    <XAxis
                                      type="number"
                                      stroke="#94a3b8"
                                      fontSize={10}
                                      tickLine={false}
                                    />
                                    <YAxis
                                      dataKey="architecture_name"
                                      type="category"
                                      stroke="#94a3b8"
                                      fontSize={10}
                                      tickLine={false}
                                      width={100}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        background: "#fff",
                                        borderRadius: "12px",
                                        border: "1px solid #f1f5f9",
                                      }}
                                      formatter={(value) =>
                                        formatCurrency(value)
                                      }
                                    />
                                    <Bar
                                      dataKey="total_amount"
                                      name="Total Commission"
                                      fill="#f59e0b"
                                      radius={[0, 4, 4, 0]}
                                      maxBarSize={20}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* 4. Top Projects Leaderboard */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Layers size={16} className="text-indigo-500" />
                        Top Performing Projects (by Net Revenue)
                      </h3>
                    </div>
                    {analyticsData.topProjects.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-4 text-center">
                        No projects found.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                          <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                            <tr>
                              <th className="py-2.5 px-4">Company Name</th>
                              <th className="py-2.5 px-4">Customer Name</th>
                              <th className="py-2.5 px-4 text-right">Amount</th>
                              <th className="py-2.5 px-4 text-right">
                                Net Revenue
                              </th>
                              <th className="py-2.5 px-4 w-48">
                                Profit Margin %
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                            {analyticsData.topProjects.map((p, idx) => {
                              const marginPct =
                                p.amount > 0
                                  ? Math.round(
                                      (p.net_revenue_amount / p.amount) * 100,
                                    )
                                  : 0;
                              return (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                                    {p.company_name || "-"}
                                  </td>
                                  <td className="py-2.5 px-4 text-xs text-slate-500">
                                    {p.customer_name || "-"}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-medium">
                                    {formatCurrency(p.amount)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                                    {formatCurrency(p.net_revenue_amount)}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                          style={{
                                            width: `${Math.min(100, Math.max(0, marginPct))}%`,
                                          }}
                                        ></div>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-500 w-8">
                                        {marginPct}%
                                      </span>
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
                </>
              ) : null}
            </div>
          ) : (
            /* ======================================================
             PROJECT LIST TABLE — styled to match Quotation page
             ====================================================== */
            <div className="bg-white rounded-sm border border-gray-100 py-2">
              <div className="p-4">
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
                          Quotation No
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Quotation Date
                        </th>
                        <th className="py-3 px-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Grand Total
                        </th>
                        <th className="py-3 px-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="py-3 px-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Architecture Net
                        </th>
                        <th className="py-3 px-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Expense Net
                        </th>
                        <th className="py-3 px-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Net Revenue
                        </th>
                        <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="py-3 px-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading && (
                        <tr>
                          <td
                            colSpan={14}
                            className="text-center py-10 text-gray-400"
                          >
                            Loading projects...
                          </td>
                        </tr>
                      )}

                      {!loading && error && (
                        <tr>
                          <td
                            colSpan={14}
                            className="text-center py-10 text-red-500"
                          >
                            Error: {error}
                          </td>
                        </tr>
                      )}

                      {!loading && !error && projects.length === 0 && (
                        <tr>
                          <td
                            colSpan={14}
                            className="text-center py-10 text-gray-400"
                          >
                            No Projects Found
                          </td>
                        </tr>
                      )}

                      {!loading &&
                        !error &&
                        paginatedProjects.map((project, index) => (
                          <tr
                            key={project.id}
                            className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                          >
                            <td className="py-3 px-3">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="font-medium px-3 text-gray-700">
                              {project.quotation_no || "-"}
                            </td>
                            <td className="px-3 text-gray-700">
                              {project.company_name || "-"}
                            </td>
                            <td className="text-orange-500 px-3">
                              {project.customer_name || "-"}
                            </td>
                            <td className="px-3 text-gray-600">
                              {project.reference || "-"}
                            </td>
                            <td className="px-3 text-gray-600">
                              {project.source || "-"}
                            </td>
                            <td className="px-3 text-gray-500">
                              {formatDate(project.quotation_date)}
                            </td>
                            <td className="px-3 text-right font-semibold text-gray-700">
                              {formatCurrency(project.grand_total)}
                            </td>
                            <td className="px-3 text-right font-semibold text-gray-700">
                              {formatCurrency(project.amount)}
                            </td>
                            <td className="px-3 text-right text-gray-600">
                              <div className="flex items-center justify-end gap-1.5">
                                <span>
                                  {formatCurrency(
                                    project.architecture_net_amount,
                                  )}
                                </span>
                                <button
                                  onClick={() =>
                                    handleManageArchitecture(project)
                                  }
                                  className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
                                  title="Edit Architecture Commissions"
                                >
                                  <i className="bi bi-pencil-square text-sm"></i>
                                </button>
                              </div>
                            </td>
                            <td className="px-3 text-right text-gray-600">
                              <div className="flex items-center justify-end gap-1.5">
                                <span>
                                  {formatCurrency(project.expense_net_amount)}
                                </span>
                                <button
                                  onClick={() => handleManageExpenses(project)}
                                  className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
                                  title="Edit Project Expenses"
                                >
                                  <i className="bi bi-pencil-square text-sm"></i>
                                </button>
                              </div>
                            </td>
                            <td className="px-3 text-right font-bold text-green-600">
                              {formatCurrency(project.net_revenue_amount)}
                            </td>
                            <td className="px-3 text-gray-500">
                              {formatDate(project.created_at)}
                            </td>
                            <td className="px-3 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={() => handleViewProject(project)}
                                  className="text-slate-500 hover:text-blue-600 transition-all"
                                  title="View Project Details"
                                >
                                  <i className="bi bi-eye text-lg"></i>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProject(project.id)
                                  }
                                  className="text-gray-400 hover:text-red-600 cursor-pointer transition-all"
                                  title="Delete Project"
                                >
                                  <i className="bi bi-trash3 text-lg"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {/* PAGINATION — matches Quotation page style */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg">
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

                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-left text-sm"></i>
                      </button>

                      {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                          {getSlidingPages().map((page) => (
                            <button
                              type="button"
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page ? "bg-[#212121] text-white shadow-md shadow-black/10" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages || 1),
                          )
                        }
                        disabled={
                          currentPage === totalPages || totalPages === 0
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-right text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Architecture Commission Modal */}
        {showArchModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all duration-300 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] transform scale-100 transition-all duration-300 ease-out">
              {/* Header: Gradient background */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-center justify-between text-white shadow-md">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Assign Architecture Commission
                  </h2>
                  <p className="text-xs text-orange-50 opacity-90 mt-0.5">
                    Project: {selectedProject?.company_name || "-"} | Customer:{" "}
                    {selectedProject?.customer_name || "-"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowArchModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-200"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scroll">
                {modalError && (
                  <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
                    <i className="bi bi-exclamation-triangle-fill text-rose-500 mt-0.5"></i>
                    <div>
                      <h4 className="text-sm font-semibold text-rose-900">
                        Error Occurred
                      </h4>
                      <p className="text-xs text-rose-700 mt-0.5">
                        {modalError}
                      </p>
                    </div>
                  </div>
                )}

                {loadingArch ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
                    <p className="text-sm text-slate-500 font-medium">
                      Fetching assigned architectures...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Financial Overview Card */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-4 gap-4">
                      <div className="text-center p-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Grand Total
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-1">
                          {formatCurrency(selectedProject?.grand_total || 0)}
                        </p>
                      </div>
                      <div className="text-center p-2 border-l border-slate-200">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Base Amount
                        </span>
                        <p className="text-sm font-bold text-slate-900 mt-1">
                          {formatCurrency(selectedProject?.amount || 0)}
                        </p>
                      </div>
                      <div className="text-center p-2 border-l border-slate-200">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Commission Net
                        </span>
                        <p className="text-sm font-bold text-orange-600 mt-1">
                          {formatCurrency(
                            assignedArchitects.reduce((sum, arch) => {
                              const pct = Number(arch.percentage) || 0;
                              return (
                                sum +
                                (Number(selectedProject?.amount || 0) * pct) /
                                  100
                              );
                            }, 0),
                          )}
                        </p>
                      </div>
                      <div className="text-center p-2 border-l border-slate-200">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Net Balance
                        </span>
                        <p className="text-sm font-bold text-emerald-600 mt-1">
                          {formatCurrency(
                            Number(selectedProject?.amount || 0) -
                              assignedArchitects.reduce((sum, arch) => {
                                const pct = Number(arch.percentage) || 0;
                                return (
                                  sum +
                                  (Number(selectedProject?.amount || 0) * pct) /
                                    100
                                );
                              }, 0),
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Dropdown to add architect */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-800">
                        Add Architect to Project
                      </label>
                      <SearchableSelect
                        value=""
                        onChange={(val) => {
                          if (val) addArchitect(val);
                        }}
                        options={allArchitects
                          .filter(
                            (a) =>
                              Number(a.status) === 1 &&
                              !assignedArchitects.some(
                                (assigned) =>
                                  String(assigned.id) === String(a.id) ||
                                  assigned.architecture_name === a.name,
                              ),
                          )
                          .map((a) => ({
                            value: a.id,
                            label: `${a.name} (${a.email || "No Email"})`,
                          }))}
                        placeholder="-- Select Architect to Assign --"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-slate-700 bg-white shadow-sm cursor-pointer flex justify-between items-center"
                      />
                    </div>

                    {/* Assigned Architectures Table */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-people-fill text-orange-500"></i>{" "}
                        Assigned Architectures ({assignedArchitects.length})
                      </h3>

                      {assignedArchitects.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <i className="bi bi-person-dash text-3xl text-slate-300 block mb-2"></i>
                          <p className="text-xs text-slate-400 font-medium">
                            No architects assigned to this project yet.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-100">
                              <tr>
                                <th className="py-2.5 px-4">Name</th>
                                <th className="py-2.5 px-4 w-36">
                                  Commission %
                                </th>
                                <th className="py-2.5 px-4 w-40">
                                  Commission Amount
                                </th>
                                <th className="py-2.5 px-4 text-center w-16">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {assignedArchitects.map((arch, idx) => {
                                return (
                                  <tr
                                    key={idx}
                                    className="hover:bg-slate-50/80 transition-colors duration-150"
                                  >
                                    <td className="py-3 px-4">
                                      <div className="font-semibold text-slate-800">
                                        {arch.architecture_name || arch.name}
                                      </div>
                                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-col gap-0.5">
                                        {arch.email && <div>{arch.email}</div>}
                                        {arch.mobile_no && (
                                          <div>{arch.mobile_no}</div>
                                        )}
                                        {!arch.email && !arch.mobile_no && (
                                          <div>No Contact Info</div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="relative flex items-center">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.01"
                                          value={
                                            arch.percentage === 0 ||
                                            arch.percentage === "0" ||
                                            arch.percentage === "0.00"
                                              ? ""
                                              : arch.percentage
                                          }
                                          placeholder="0"
                                          onChange={(e) =>
                                            updatePercentage(
                                              idx,
                                              e.target.value,
                                            )
                                          }
                                          className="w-full p-1.5 pr-6 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 no-spinner"
                                        />
                                        <span className="absolute right-2 text-slate-400 text-xs font-semibold">
                                          %
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="relative flex items-center">
                                        <span className="absolute left-2 text-slate-400 text-xs font-semibold">
                                          ₹
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={
                                            arch.architecture_amount === 0 ||
                                            arch.architecture_amount === "0" ||
                                            arch.architecture_amount === "0.00"
                                              ? ""
                                              : arch.architecture_amount
                                          }
                                          placeholder="0"
                                          onChange={(e) =>
                                            updateAmount(idx, e.target.value)
                                          }
                                          className="w-full p-1.5 pl-6 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 no-spinner"
                                        />
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removeArchitect(idx)}
                                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors duration-200"
                                        title="Remove architect"
                                      >
                                        <i className="bi bi-trash-fill text-sm"></i>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowArchModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveArchitectures}
                  disabled={savingArch || loadingArch}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-60 transition-all"
                >
                  {savingArch ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
                      Saving...
                    </span>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Premium Manage Project Expenses Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 text-white relative">
                <h2 className="text-xl font-bold tracking-tight">
                  Manage Project Expenses
                </h2>
                <p className="text-xs text-orange-50/90 font-medium mt-1">
                  Project: {selectedProject?.company_name || "-"} | Customer:{" "}
                  {selectedProject?.customer_name || "-"}
                </p>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {expenseModalError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 font-semibold">
                    <i className="bi bi-exclamation-triangle-fill text-sm mt-0.5"></i>
                    <span>{expenseModalError}</span>
                  </div>
                )}

                {loadingExpense ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <span className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></span>
                    <p className="text-sm text-slate-500 font-medium">
                      Loading project expenses...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Financial Stats Summary */}
                    <div className="grid grid-cols-5 divide-x divide-slate-100 border border-slate-100 rounded-2xl bg-slate-50/50 p-4 shadow-inner">
                      <div className="text-center p-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Grand Total
                        </span>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {formatCurrency(selectedProject?.grand_total)}
                        </p>
                      </div>
                      <div className="text-center p-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Base Amount
                        </span>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          {formatCurrency(selectedProject?.amount)}
                        </p>
                      </div>
                      <div className="text-center p-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Architecture Net
                        </span>
                        <p className="text-sm font-bold text-slate-600 mt-1">
                          {formatCurrency(
                            selectedProject?.architecture_net_amount,
                          )}
                        </p>
                      </div>
                      <div className="text-center p-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Expense Net
                        </span>
                        <p className="text-sm font-bold text-orange-600 mt-1">
                          {formatCurrency(
                            projectExpenses.reduce(
                              (sum, exp) =>
                                sum + Number(exp.expense_amount || 0),
                              0,
                            ),
                          )}
                        </p>
                      </div>
                      <div className="text-center p-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Net Revenue
                        </span>
                        <p className="text-sm font-bold text-emerald-600 mt-1">
                          {formatCurrency(
                            Number(selectedProject?.amount || 0) -
                              Number(
                                selectedProject?.architecture_net_amount || 0,
                              ) -
                              projectExpenses.reduce(
                                (sum, exp) =>
                                  sum + Number(exp.expense_amount || 0),
                                0,
                              ),
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Add New Expense Form */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Add New Expense Item
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Category <span className="text-rose-500">*</span>
                          </label>
                          <SearchableSelect
                            value={newExpenseCategory}
                            onChange={(val) => setNewExpenseCategory(val)}
                            options={activeCategories.map((cat) => ({
                              value: cat.name,
                              label: cat.name,
                            }))}
                            placeholder="-- Category --"
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 cursor-pointer flex justify-between items-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={newExpenseDescription}
                            onChange={(e) =>
                              setNewExpenseDescription(e.target.value)
                            }
                            onKeyDown={handleExpenseKeyDown}
                            placeholder="e.g. Site visits, snacks"
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Cost (₹) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={
                              newExpenseAmount === 0 ||
                              newExpenseAmount === "0" ||
                              newExpenseAmount === ""
                                ? ""
                                : newExpenseAmount
                            }
                            placeholder="0"
                            onChange={(e) =>
                              setNewExpenseAmount(e.target.value)
                            }
                            onKeyDown={handleExpenseKeyDown}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 no-spinner"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expenses List */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <i className="bi bi-receipt-cutoff text-orange-500"></i>{" "}
                        Project Expense List ({projectExpenses.length})
                      </h3>

                      {projectExpenses.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <i className="bi bi-wallet2 text-3xl text-slate-300 block mb-2"></i>
                          <p className="text-xs text-slate-400 font-medium">
                            No expenses added to this project yet.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-100">
                              <tr>
                                <th className="py-2.5 px-4">Category</th>
                                <th className="py-2.5 px-4">Description</th>
                                <th className="py-2.5 px-4 w-32 text-right">
                                  Amount
                                </th>
                                <th className="py-2.5 px-4 text-center w-16">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {projectExpenses.map((exp, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-50/80 transition-colors duration-150"
                                >
                                  <td className="py-2.5 px-4 font-semibold text-slate-800">
                                    {exp.expense_category}
                                  </td>
                                  <td className="py-2.5 px-4 text-xs text-slate-500">
                                    {exp.description || "-"}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-medium text-slate-800">
                                    {formatCurrency(exp.expense_amount)}
                                  </td>
                                  <td className="py-2.5 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeExpense(idx)}
                                      className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors duration-200"
                                      title="Delete Expense"
                                    >
                                      <i className="bi bi-trash-fill text-xs"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveExpenses}
                  disabled={savingExpense || loadingExpense}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-60 transition-all"
                >
                  {savingExpense ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
                      Saving...
                    </span>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Project Details Modal */}
        {showViewModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-100 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Project Workspace
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quotation No: {selectedProject.quotation_no || "-"} |{" "}
                    {selectedProject.company_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              {/* Tabs navigation */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
                <button
                  onClick={() => setViewTab("analytics")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    viewTab === "analytics"
                      ? "border-orange-500 text-orange-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Analytics Dashboard
                </button>
                <button
                  onClick={() => setViewTab("details")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    viewTab === "details"
                      ? "border-orange-500 text-orange-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setViewTab("architectures")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    viewTab === "architectures"
                      ? "border-orange-500 text-orange-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Architecture Commissions
                </button>
                <button
                  onClick={() => setViewTab("expenses")}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    viewTab === "expenses"
                      ? "border-orange-500 text-orange-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Project Expenses
                </button>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                {loadingView ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                    <span className="text-sm text-slate-500 font-medium">
                      Loading details...
                    </span>
                  </div>
                ) : (
                  <>
                    {viewTab === "analytics" &&
                      (() => {
                        const totalArchCom = viewArchitectures.reduce(
                          (sum, arch) =>
                            sum + (Number(arch.architecture_amount) || 0),
                          0,
                        );
                        const totalExpenses = viewExpenses.reduce(
                          (sum, exp) => sum + (Number(exp.expense_amount) || 0),
                          0,
                        );
                        const netRev =
                          Number(selectedProject.amount || 0) -
                          totalArchCom -
                          totalExpenses;
                        const margin =
                          selectedProject.amount > 0
                            ? ((netRev / selectedProject.amount) * 100).toFixed(
                                1,
                              )
                            : 0;
                        return (
                          <div className="space-y-6">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Grand Total */}
                              <div className="bg-gradient-to-br from-white to-orange-50/20 hover:to-orange-50/40 rounded-xl border border-slate-100 p-4 flex flex-col justify-between shadow-sm transition-all duration-200">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Project Value
                                  </span>
                                  <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                                    <Coins size={14} />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-base font-extrabold text-slate-800">
                                    {formatCurrency(selectedProject.amount)}
                                  </h3>
                                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    Initial contract value
                                  </p>
                                </div>
                              </div>

                              {/* Architecture Net */}
                              <div className="bg-gradient-to-br from-white to-amber-50/20 hover:to-amber-50/40 rounded-xl border border-slate-100 p-4 flex flex-col justify-between shadow-sm transition-all duration-200">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Architect Commissions
                                  </span>
                                  <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                                    <Percent size={14} />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-base font-extrabold text-slate-800">
                                    {formatCurrency(totalArchCom)}
                                  </h3>
                                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                                    {selectedProject.amount > 0
                                      ? (
                                          (totalArchCom /
                                            selectedProject.amount) *
                                          100
                                        ).toFixed(1)
                                      : 0}
                                    % of project value
                                  </p>
                                </div>
                              </div>

                              {/* Expense Net */}
                              <div className="bg-gradient-to-br from-white to-rose-50/20 hover:to-rose-50/40 rounded-xl border border-slate-100 p-4 flex flex-col justify-between shadow-sm transition-all duration-200">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Project Expenses
                                  </span>
                                  <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                                    <TrendingDown size={14} />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-base font-extrabold text-slate-800">
                                    {formatCurrency(totalExpenses)}
                                  </h3>
                                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                                    {selectedProject.amount > 0
                                      ? (
                                          (totalExpenses /
                                            selectedProject.amount) *
                                          100
                                        ).toFixed(1)
                                      : 0}
                                    % of project value
                                  </p>
                                </div>
                              </div>

                              {/* Net Revenue */}
                              <div className="bg-gradient-to-br from-white to-emerald-50/20 hover:to-emerald-50/40 rounded-xl border border-slate-100 p-4 flex flex-col justify-between shadow-sm transition-all duration-200">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                    Net Revenue
                                  </span>
                                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                                    <TrendingUp size={14} />
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-base font-extrabold text-emerald-600">
                                    {formatCurrency(netRev)}
                                  </h3>
                                  <p className="text-[9px] text-emerald-700 font-bold mt-0.5">
                                    {margin}% profit margin
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Expense Timeline Chart */}
                              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Calendar
                                      size={14}
                                      className="text-orange-500"
                                    />
                                    Expense Timeline
                                  </h4>
                                  {/* Timeframe Selector */}
                                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                                    {["weekly", "monthly", "yearly"].map(
                                      (t) => (
                                        <button
                                          key={t}
                                          onClick={() =>
                                            setViewModalTimeframe(t)
                                          }
                                          className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold capitalize transition-all cursor-pointer ${
                                            viewModalTimeframe === t
                                              ? "bg-white text-slate-800 shadow-sm"
                                              : "text-slate-500 hover:text-slate-700"
                                          }`}
                                        >
                                          {t}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                </div>
                                <div className="h-48 w-full">
                                  {getProjectExpenseTimeSeries().length ===
                                  0 ? (
                                    <div className="flex items-center justify-center h-full">
                                      <p className="text-[10px] text-slate-400 font-medium">
                                        No expense items found.
                                      </p>
                                    </div>
                                  ) : (
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <BarChart
                                        data={getProjectExpenseTimeSeries()}
                                        margin={{
                                          top: 5,
                                          right: 5,
                                          left: -25,
                                          bottom: 0,
                                        }}
                                      >
                                        <CartesianGrid
                                          strokeDasharray="3 3"
                                          stroke="#f8fafc"
                                        />
                                        <XAxis
                                          dataKey="label"
                                          stroke="#94a3b8"
                                          fontSize={9}
                                          tickLine={false}
                                        />
                                        <YAxis
                                          stroke="#94a3b8"
                                          fontSize={9}
                                          tickLine={false}
                                        />
                                        <Tooltip
                                          contentStyle={{
                                            background: "#fff",
                                            borderRadius: "8px",
                                            border: "1px solid #f1f5f9",
                                            fontSize: 10,
                                          }}
                                          formatter={(value) =>
                                            formatCurrency(value)
                                          }
                                        />
                                        <Bar
                                          dataKey="amount"
                                          name="Cost"
                                          fill="#f43f5e"
                                          radius={[4, 4, 0, 0]}
                                          maxBarSize={20}
                                        />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  )}
                                </div>
                              </div>

                              {/* Cost Distribution Chart */}
                              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <PieChartIcon
                                      size={14}
                                      className="text-rose-500"
                                    />
                                    Cost Distribution
                                  </h4>
                                </div>
                                <div className="flex items-center justify-between h-48">
                                  {getProjectExpenseCategories().length ===
                                  0 ? (
                                    <div className="flex items-center justify-center w-full h-full">
                                      <p className="text-[10px] text-slate-400 font-medium">
                                        No expenses/commissions assigned.
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="h-full w-1/2 flex items-center justify-center relative">
                                        <ResponsiveContainer
                                          width="100%"
                                          height="100%"
                                        >
                                          <PieChart>
                                            <Pie
                                              data={getProjectExpenseCategories()}
                                              dataKey="value"
                                              nameKey="name"
                                              cx="50%"
                                              cy="50%"
                                              innerRadius={35}
                                              outerRadius={50}
                                              paddingAngle={2}
                                            >
                                              {getProjectExpenseCategories().map(
                                                (entry, index) => {
                                                  const COLORS = [
                                                    "#f59e0b",
                                                    "#f43f5e",
                                                    "#3b82f6",
                                                    "#10b981",
                                                    "#8b5cf6",
                                                    "#06b6d4",
                                                    "#64748b",
                                                  ];
                                                  return (
                                                    <Cell
                                                      key={`cell-${index}`}
                                                      fill={
                                                        COLORS[
                                                          index % COLORS.length
                                                        ]
                                                      }
                                                    />
                                                  );
                                                },
                                              )}
                                            </Pie>
                                            <Tooltip
                                              formatter={(value) =>
                                                formatCurrency(value)
                                              }
                                            />
                                          </PieChart>
                                        </ResponsiveContainer>
                                        {/* Centered text in Donut */}
                                        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                            Total
                                          </span>
                                          <span className="text-[10px] font-extrabold text-slate-800">
                                            {formatCurrency(
                                              getProjectExpenseCategories().reduce(
                                                (sum, item) => sum + item.value,
                                                0,
                                              ),
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="w-1/2 max-h-40 overflow-y-auto space-y-1.5 pl-2 custom-scroll">
                                        {getProjectExpenseCategories().map(
                                          (cat, idx) => {
                                            const COLORS = [
                                              "#f59e0b",
                                              "#f43f5e",
                                              "#3b82f6",
                                              "#10b981",
                                              "#8b5cf6",
                                              "#06b6d4",
                                              "#64748b",
                                            ];
                                            return (
                                              <div
                                                key={idx}
                                                className="flex flex-col text-[10px] text-slate-600"
                                              >
                                                <div className="flex items-center gap-1">
                                                  <span
                                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                                    style={{
                                                      backgroundColor:
                                                        COLORS[
                                                          idx % COLORS.length
                                                        ],
                                                    }}
                                                  ></span>
                                                  <span className="truncate font-semibold max-w-[100px]">
                                                    {cat.name}
                                                  </span>
                                                </div>
                                                <span className="pl-3 font-bold text-slate-800">
                                                  {formatCurrency(cat.value)}
                                                </span>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Architects Commission breakdown */}
                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <Users size={14} className="text-amber-500" />
                                  Architects Commission Breakdown
                                </h4>
                              </div>
                              {viewArchitectures.length === 0 ? (
                                <p className="text-[10px] text-slate-400 font-medium py-3 text-center">
                                  No architectures assigned.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left text-slate-600 border-collapse">
                                    <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                                      <tr>
                                        <th className="py-2 px-3 border-b border-slate-100">
                                          Architect
                                        </th>
                                        <th className="py-2 px-3 border-b border-slate-100">
                                          Email / Contact
                                        </th>
                                        <th className="py-2 px-3 text-center border-b border-slate-100">
                                          Commission %
                                        </th>
                                        <th className="py-2 px-3 text-right border-b border-slate-100">
                                          Commission Amount
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                                      {viewArchitectures.map((arch, idx) => (
                                        <tr
                                          key={idx}
                                          className="hover:bg-slate-50/50 transition-colors"
                                        >
                                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                                            {arch.architecture_name}
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-400">
                                            <div className="flex flex-col gap-0.5">
                                              {arch.email && (
                                                <div>{arch.email}</div>
                                              )}
                                              {arch.mobile_no && (
                                                <div>{arch.mobile_no}</div>
                                              )}
                                              {!arch.email &&
                                                !arch.mobile_no && <div>-</div>}
                                            </div>
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                            {arch.percentage}%
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-bold text-amber-600">
                                            {formatCurrency(
                                              arch.architecture_amount,
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                    {viewTab === "details" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Company
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {selectedProject.company_name || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Customer
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {selectedProject.customer_name || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Reference
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {selectedProject.reference || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Source
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {selectedProject.source || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Quotation Date
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {formatDate(selectedProject.quotation_date)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Created At
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {formatDate(selectedProject.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                            Financial Breakdown
                          </h4>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Base Amount</span>
                            <span className="font-semibold text-slate-800">
                              {formatCurrency(selectedProject.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-rose-600">
                            <span>(-) Architecture Net</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                selectedProject.architecture_net_amount,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-rose-600">
                            <span>(-) Expense Net</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                selectedProject.expense_net_amount,
                              )}
                            </span>
                          </div>
                          <div className="border-t border-slate-200/80 pt-3 flex justify-between items-center text-base font-bold text-slate-900">
                            <span>Net Revenue</span>
                            <span className="text-emerald-600">
                              {formatCurrency(
                                selectedProject.net_revenue_amount,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {viewTab === "architectures" && (
                      <div>
                        {viewArchitectures.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-sm">
                            <i className="bi bi-people text-3xl block mb-2"></i>
                            No architectures assigned to this project.
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                            <table className="min-w-full divide-y divide-slate-100">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Architect Name
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Commission %
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Commission Amount
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-sm">
                                {viewArchitectures.map((arch) => (
                                  <tr
                                    key={arch.id}
                                    className="hover:bg-slate-50/50"
                                  >
                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                      {arch.architecture_name}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-500">
                                      {arch.percentage}%
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                                      {formatCurrency(arch.architecture_amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {viewTab === "expenses" && (
                      <div>
                        {viewExpenses.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-sm">
                            <i className="bi bi-wallet2 text-3xl block mb-2"></i>
                            No expenses recorded for this project.
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                            <table className="min-w-full divide-y divide-slate-100">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Category
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Description
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Amount
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-sm">
                                {viewExpenses.map((exp) => (
                                  <tr
                                    key={exp.id}
                                    className="hover:bg-slate-50/50"
                                  >
                                    <td className="px-4 py-3 font-semibold text-slate-700">
                                      {exp.expense_category}
                                    </td>
                                    <td
                                      className="px-4 py-3 text-slate-500 max-w-[200px] truncate"
                                      title={exp.description}
                                    >
                                      {exp.description || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                                      {formatCurrency(exp.expense_amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

<<<<<<< Updated upstream
              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-5 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  Close
                </button>
=======
            {/* Form body */}
            <div className="p-6 space-y-4">

              {editModalError && (
                <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-xs rounded-xl font-medium">
                  {editModalError}
                </div>
              )}
              00

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Customer Name</label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reference</label>
                  <input
                    type="text"
                    value={editReference}
                    onChange={(e) => setEditReference(e.target.value)}
                    placeholder="e.g. Manthan"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Source</label>
                  <input
                    type="text"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    placeholder="e.g. Advertisement"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grand Total</label>
                  <input
                    type="number"
                    value={editGrandTotal}
                    onChange={(e) => setEditGrandTotal(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors no-spinner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Base Amount</label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors no-spinner"
                  />
                </div>
>>>>>>> Stashed changes
              </div>
            </div>
          </div>
        )}

        {/* Edit Project Details Modal */}
        {showEditModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-100 flex flex-col">
              {/* Header */}
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Edit Project
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quotation No: {selectedProject.quotation_no || "-"}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              {/* Form body */}
              <div className="p-6 space-y-4">
                {editModalError && (
                  <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-xs rounded-xl font-medium">
                    {editModalError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={editReference}
                      onChange={(e) => setEditReference(e.target.value)}
                      placeholder="e.g. Manthan"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Source
                    </label>
                    <input
                      type="text"
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      placeholder="e.g. Advertisement"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Grand Total
                    </label>
                    <input
                      type="number"
                      value={editGrandTotal}
                      onChange={(e) => setEditGrandTotal(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors no-spinner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Base Amount
                    </label>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-colors no-spinner"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-60 transition-all"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
export default Page;
