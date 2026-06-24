"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Header from "@/app/components/header";
import axios from "redaxios";
import Swal from "sweetalert2";
import {
  Users,
  UserPlus,
  CheckSquare,
  ListTodo,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Activity,
  MoreVertical,
  Clock,
  TrendingUp,
  Trash2,
  Plus,
  Circle,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import {
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
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import useAuth from "../components/useAuth";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  colorClass,
  onClick,
  bgClass = "from-white to-orange-50/40 hover:to-orange-50/80",
  glowClass = "bg-orange-100/50",
  titleHoverClass = "group-hover:text-orange-500",
  sparklineColor = "text-orange-500",
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 p-3 sm:p-4 flex flex-col transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group relative overflow-hidden ${bgClass}`}
    >
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${glowClass}`}></div>
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div
          className={`p-2 sm:p-2.5 rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 ${colorClass}`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
        </div>
        {trend && (
          <div
            className={`flex items-center text-[10px] font-extrabold px-2 py-1 rounded-lg shadow-sm ${trend === "up" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            {trend === "up" ? (
              <ArrowUpRight size={12} className="mr-0.5" />
            ) : (
              <ArrowDownRight size={12} className="mr-0.5" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      <div className="relative z-10 mt-1">
        <h3 className={`text-gray-400 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mb-0.5 transition-colors ${titleHoverClass}`}>
          {title}
        </h3>
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight group-hover:scale-105 transform origin-left transition-transform duration-300">
          {value}
        </h2>
      </div>

      {/* Mini Trading/Sparkline Graph in Bottom-Right Corner */}
      <div className={`absolute right-0 bottom-0 w-24 h-10 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none ${sparklineColor}`}>
        <svg
          viewBox="0 0 100 40"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`sparklineGrad-${(title || 'card').replace(/[^a-zA-Z0-9]/g, '-')}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M 0 30 Q 20 15 40 25 T 80 5 L 100 0 L 100 40 L 0 40 Z"
            fill={`url(#sparklineGrad-${(title || 'card').replace(/[^a-zA-Z0-9]/g, '-')})`}
            className="fill-current"
          />
          <path
            d="M 0 30 Q 20 15 40 25 T 80 5 L 100 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-current"
            style={{
              strokeDasharray: "150",
              strokeDashoffset: "150",
              animation: "sparklineDraw 2.5s ease-out forwards",
            }}
          />
        </svg>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [role, setRole] = useState("");
  const [token, setToken] = useState("");
  const router = useRouter();

  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [pis, setPis] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [products, setProducts] = useState([]);
  const [trafficLightStats, setTrafficLightStats] = useState([]);
  const [salesTimeframe, setSalesTimeframe] = useState("monthly");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [addingTodo, setAddingTodo] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [loading, setLoading] = useState(true);

  useAuth();

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };

      const [
        leadsRes,
        customersRes,
        tasksRes,
        todosRes,
        quotationsRes,
        piRes,
        contractsRes,
        productsRes,
        trafficLightRes,
      ] = await Promise.all([
        axios
          .get(`${API_BASE}/api/lead/read`, config)
          .catch(() => ({ data: { result: [] } })),
        axios
          .get(`${API_BASE}/api/customers/get-customers?limit=100`, config)
          .catch(() => ({ data: { data: [] } })),
        axios
          .get(`${API_BASE}/api/tasks/read`, config)
          .catch(() => ({ data: { result: [] } })),
        axios
          .get(`${API_BASE}/api/todos/read`, config)
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE}/api/quotation/read`, config)
          .catch(() => ({ data: { result: [] } })),
        axios
          .get(`${API_BASE}/api/pi/list`, config)
          .catch(() => ({ data: { data: [] } })),
        axios
          .get(`${API_BASE}/api/contract-types/read`, config)
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE}/api/product-master/read`, config)
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE}/api/lead/analytics/traffic-light`, config)
          .catch(() => ({ data: { result: [] } })),
      ]);

      setLeads(
        Array.isArray(leadsRes.data?.result) ? leadsRes.data.result : [],
      );
      setCustomers(
        Array.isArray(customersRes.data?.data) ? customersRes.data.data : [],
      );

      const fetchedTasks =
        tasksRes.data?.result || tasksRes.data?.data || tasksRes.data;
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);

      const fetchedTodos =
        todosRes.data?.result || todosRes.data?.data || todosRes.data;
      setTodos(Array.isArray(fetchedTodos) ? fetchedTodos : []);

      let fetchedQuotations =
        quotationsRes.data?.result ||
        quotationsRes.data?.data ||
        quotationsRes.data;
      if (!Array.isArray(fetchedQuotations)) {
        fetchedQuotations = [];
      }
      const userRole = localStorage.getItem("role") || "";
      const userFirstName = (localStorage.getItem("username") || "").split(" ")[0].toLowerCase();
      if (userRole.toLowerCase() === "sales") {
        fetchedQuotations = fetchedQuotations.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const hasBeenAssigned =
            qAssignees.some(name => name.includes(userFirstName)) ||
            lAssignees.some(name => name.includes(userFirstName));

          let inLog = false;
          if (q.assignee_log) {
            try {
              const logs = JSON.parse(q.assignee_log);
              inLog = logs.some(
                (log) =>
                  (log.previous_assignee &&
                    log.previous_assignee.toLowerCase().includes(userFirstName)) ||
                  (log.new_assignee &&
                    log.new_assignee.toLowerCase().includes(userFirstName))
              );
            } catch { }
          }
          return hasBeenAssigned || inLog;
        });
      } else if (userRole.toLowerCase() === "estimation") {
        fetchedQuotations = fetchedQuotations.filter((q) => {
          const qAssignees = q.assignee
            ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          const lAssignees = q.lead_assignee
            ? q.lead_assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];

          const matchesQuotation = qAssignees.some(name => name.includes(userFirstName));
          const matchesLead = lAssignees.some(name => name.includes(userFirstName));

          if (qAssignees.length === 0) {
            return matchesLead;
          }
          return matchesQuotation;
        });
      }
      setQuotations(fetchedQuotations);

      let fetchedPis = piRes.data?.data || piRes.data?.result || piRes.data;
      if (!Array.isArray(fetchedPis)) {
        fetchedPis = [];
      }
      if (userRole.toLowerCase() === "proforma invoices") {
        fetchedPis = fetchedPis.filter((pi) => {
          const piAssignees = pi.assignee
            ? pi.assignee.split(",").map((name) => name.trim().toLowerCase())
            : [];
          return piAssignees.some(name => name.includes(userFirstName));
        });
      }
      setPis(fetchedPis);

      const fetchedContracts = contractsRes.data?.data || contractsRes.data;
      setContracts(Array.isArray(fetchedContracts) ? fetchedContracts : []);

      const fetchedProducts = productsRes.data?.data || productsRes.data;
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);

      const fetchedTrafficLight = trafficLightRes.data?.result || [];
      setTrafficLightStats(Array.isArray(fetchedTrafficLight) ? fetchedTrafficLight : []);

    } catch (error) {
      console.error("Dashboard Data Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    setRole(localStorage.getItem("role") || "");
  }, [fetchData]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    setAddingTodo(true);
    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };

      if (editingTodoId) {
        // Edit mode
        await axios.put(
          `${API_BASE}/api/todos/update/${editingTodoId}`,
          { title: newTodoTitle },
          config,
        );
        setTodos(
          todos.map((todo) =>
            todo.id === editingTodoId
              ? { ...todo, title: newTodoTitle, description: newTodoTitle }
              : todo,
          ),
        );
        toast.success("To-do updated!");
        setEditingTodoId(null);
      } else {
        // Add mode
        const res = await axios.post(
          `${API_BASE}/api/todos/insert`,
          { title: newTodoTitle },
          config,
        );
        if (res.data) {
          setTodos([
            { ...res.data, created_at: new Date().toISOString() },
            ...todos,
          ]);
          toast.success("To-do added successfully!");
        }
      }
      setNewTodoTitle("");
    } catch (err) {
      console.error(err);
      toast.error(
        editingTodoId ? "Failed to update to-do" : "Failed to add to-do",
      );
    } finally {
      setAddingTodo(false);
    }
  };

  const startEditTodo = (todo) => {
    setEditingTodoId(todo.id);
    setNewTodoTitle(todo.title || todo.description || "");
    // scroll to top of todo section (optional)
  };

  const handleDeleteTodo = async (id) => {
    const confirmed = await Swal.fire({
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; gap:12px; padding: 8px 0">
          <div style="width:56px; height:56px; background:#fff4ed; border-radius:50%; display:flex; align-items:center; justify-content:center;">
            <svg width="28" height="28" fill="none" stroke="#f97316" stroke-width="1.8" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <p style="font-size:17px; font-weight:600; color:#1f2937; margin:0;">Delete Task?</p>
          <p style="font-size:13px; color:#9ca3af; margin:0;">This action cannot be undone.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        popup: "swal-todo-popup",
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn",
        actions: "swal-actions",
      },
      didOpen: () => {
        const style = document.createElement("style");
        style.innerHTML = `
          .swal-todo-popup { border-radius: 20px !important; padding: 28px 24px !important; width: 340px !important; box-shadow: 0 20px 60px rgba(0,0,0,0.12) !important; }
          .swal-actions { gap: 10px !important; margin-top: 20px !important; }
          .swal-confirm-btn { background: #f97316; color: white; padding: 9px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: background 0.2s; }
          .swal-confirm-btn:hover { background: #ea6c0a; }
          .swal-cancel-btn { background: #f3f4f6; color: #6b7280; padding: 9px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: background 0.2s; }
          .swal-cancel-btn:hover { background: #e5e7eb; }
        `;
        document.head.appendChild(style);
      },
    }).then((result) => result.isConfirmed);

    if (!confirmed) return;

    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      await axios.delete(`${API_BASE}/api/todos/delete/${id}`, config);
      setTodos(todos.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch (err) {
      console.error("Error deleting todo:", err);
      toast.error("Failed to delete task");
    }
  };

  const handleToggleTodo = async (id) => {
    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      await axios.put(`${API_BASE}/api/todos/finish/${id}`, {}, config);

      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, is_finished: !todo.is_finished } : todo,
        ),
      );
      toast.success("Task updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task");
    }
  };



  // Date formatting helpers
  const formatTime = (dateString, formatStr = "medium") => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: formatStr,
    });
  };

  // Data Processing Helpers
  const processSalesData = () => {
    const dataMap = {};
    const safeQuotations = Array.isArray(quotations) ? quotations : [];

    safeQuotations.forEach((q) => {
      if (q.lead_status === "Won" || q.has_approved === 1) {
        const dateStr = q.quotation_date || q.quotation_created_at;
        if (!dateStr) return;

        const d = new Date(dateStr);
        let key = "";
        let timestamp = d.getTime();

        if (salesTimeframe === "weekly") {
          const startOfWeek = new Date(d);
          startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
          startOfWeek.setHours(0, 0, 0, 0);
          key = `Wk ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
          timestamp = startOfWeek.getTime();
        } else if (salesTimeframe === "monthly") {
          key = d.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
          timestamp = startOfMonth.getTime();
        } else {
          key = d.getFullYear().toString();
          const startOfYear = new Date(d.getFullYear(), 0, 1);
          timestamp = startOfYear.getTime();
        }

        if (!dataMap[key]) {
          dataMap[key] = { name: key, sales: 0, timestamp };
        }
        dataMap[key].sales += Math.round(Number(q.grand_total) || 0);
      }
    });

    return Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  const processEstimationTimeframeData = () => {
    const dataMap = {};
    const safeQuotations = Array.isArray(quotations) ? quotations : [];

    safeQuotations.forEach((q) => {
      const dateStr = q.created_at || q.quotation_date || q.quotation_created_at;
      if (!dateStr) return;

      const d = new Date(dateStr);
      let key = "";
      let timestamp = d.getTime();

      if (salesTimeframe === "weekly") {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        key = `Wk ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        timestamp = startOfWeek.getTime();
      } else if (salesTimeframe === "monthly") {
        key = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        timestamp = startOfMonth.getTime();
      } else {
        key = d.getFullYear().toString();
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        timestamp = startOfYear.getTime();
      }

      if (!dataMap[key]) {
        dataMap[key] = { name: key, Draft: 0, Approved: 0, timestamp };
      }

      const val = Math.round(Number(q.grand_total) || 0);
      if (q.quotation_status === "Approved") {
        dataMap[key].Approved += val;
      } else {
        dataMap[key].Draft += val;
      }
    });

    return Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  const processLeadsDonut = () => {
    let pending = 0,
      won = 0,
      lost = 0;
    const safeLeads = Array.isArray(leads) ? leads : [];

    safeLeads.forEach((lead) => {
      const st = (lead.status || "").toLowerCase();
      if (st === "won") won++;
      else if (st === "lost") lost++;
      else pending++;
    });

    return [
      { name: "Won", value: won, color: "#10B981" },
      { name: "Pending", value: pending, color: "#F59E0B" },
      { name: "Lost", value: lost, color: "#EF4444" },
    ].filter((item) => item.value > 0);
  };

  const processTasksPriority = () => {
    let high = 0,
      medium = 0,
      low = 0;
    const safeTasks = Array.isArray(tasks) ? tasks : [];

    safeTasks.forEach((task) => {
      const p = (task.priority || "").toLowerCase();
      if (p === "high") high++;
      else if (p === "medium") medium++;
      else if (p === "low") low++;
    });

    return [
      { name: "High", value: high, color: "#ef4444" },
      { name: "Medium", value: medium, color: "#f59e0b" },
      { name: "Low", value: low, color: "#3b82f6" },
    ].filter((item) => item.value > 0);
  };

  const processQuotationStatus = () => {
    let pending = 0,
      won = 0,
      lost = 0;
    const safeQuotations = Array.isArray(quotations) ? quotations : [];

    safeQuotations.forEach((q) => {
      const st = (q.quotation_status || "").toLowerCase();
      if (st === "won" || st === "approved") won++;
      else if (st === "lost") lost++;
      else pending++;
    });

    return [
      { name: "Won", value: won, color: "#10B981" },
      { name: "Pending", value: pending, color: "#F59E0B" },
      { name: "Lost", value: lost, color: "#EF4444" },
    ].filter((item) => item.value > 0);
  };

  const processPaymentProgress = () => {
    let totalPaid = 0;
    let totalProformaAmount = 0;

    const safePis = Array.isArray(pis) ? pis : [];
    safePis.forEach((pi) => {
      // Use the quotation's grand_total as the actual total invoice amount.
      // pi.total is the sum of paid follow-up amounts, NOT the grand total.
      if (pi.quotation_grand_total) {
        totalProformaAmount += Number(pi.quotation_grand_total) || 0;
      } else if (pi.follow_ups && pi.follow_ups.length > 0) {
        // Fallback: reverse-calculate grand total from first follow-up
        const f = pi.follow_ups[pi.follow_ups.length - 1];
        const pct = Number(f.proforma_percentage) || 0;
        const amt = Number(f.total) || 0;
        if (pct > 0) {
          totalProformaAmount += (amt / pct) * 100;
        } else {
          totalProformaAmount += Number(pi.total) || 0;
        }
      } else {
        totalProformaAmount += Number(pi.total) || 0;
      }

      // pi.total is already the sum of all follow-up paid amounts
      totalPaid += Number(pi.total) || 0;
    });

    const paymentDue = Math.max(0, totalProformaAmount - totalPaid);
    const progressPercentage =
      totalProformaAmount > 0
        ? Math.round((totalPaid / totalProformaAmount) * 100)
        : 0;

    return { totalProformaAmount, totalPaid, paymentDue, progressPercentage };
  };

  const getPiGrandTotal = (pi) => {
    if (pi.quotation_grand_total) {
      return Number(pi.quotation_grand_total) || 0;
    }
    if (pi.follow_ups && pi.follow_ups.length > 0) {
      const f = pi.follow_ups[pi.follow_ups.length - 1];
      const pct = Number(f.proforma_percentage) || 0;
      const amt = Number(f.total) || 0;
      if (pct > 0) {
        return (amt / pct) * 100;
      }
    }
    return Number(pi.total) || 0;
  };

  const processPiStatusData = () => {
    let draft = 0,
      sent = 0,
      partial = 0,
      paid = 0,
      cancelled = 0;
    const safePis = Array.isArray(pis) ? pis : [];

    safePis.forEach((pi) => {
      const st = (pi.status || "").toLowerCase();
      if (st === "draft") draft++;
      else if (st === "sent") sent++;
      else if (st === "partial") partial++;
      else if (st === "paid") paid++;
      else if (st === "cancelled") cancelled++;
    });

    const data = [
      { name: "Paid", value: paid, color: "#10B981" },
      { name: "Partial", value: partial, color: "#F59E0B" },
      { name: "Sent", value: sent, color: "#3B82F6" },
      { name: "Draft", value: draft, color: "#64748B" },
      { name: "Cancelled", value: cancelled, color: "#EF4444" },
    ].filter((item) => item.value > 0);

    if (data.length === 0) {
      data.push({ name: "No Invoices", value: 1, color: "#cbd5e1" });
    }
    return data;
  };

  const processProformaTrendData = () => {
    const dataMap = {};
    const safePis = Array.isArray(pis) ? pis : [];

    safePis.forEach((pi) => {
      const dateStr = pi.pi_date || pi.created_at;
      if (!dateStr) return;

      const d = new Date(dateStr);
      let key = "";
      let timestamp = d.getTime();

      if (salesTimeframe === "weekly") {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        key = `Wk ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        timestamp = startOfWeek.getTime();
      } else if (salesTimeframe === "monthly") {
        key = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        timestamp = startOfMonth.getTime();
      } else {
        key = d.getFullYear().toString();
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        timestamp = startOfYear.getTime();
      }

      if (!dataMap[key]) {
        dataMap[key] = { name: key, Total: 0, Collected: 0, timestamp };
      }

      dataMap[key].Total += Math.round(getPiGrandTotal(pi) || 0);
      dataMap[key].Collected += Math.round(Number(pi.total) || 0);
    });

    return Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  const processPendingProformaData = () => {
    const dataMap = {};
    const safePis = Array.isArray(pis) ? pis : [];

    safePis.forEach((pi) => {
      const isCompleted = (pi.status || "").toLowerCase() === "paid" || (pi.stage || "").toLowerCase() === "completed";
      if (isCompleted) return;

      const dateStr = pi.pi_date || pi.created_at;
      if (!dateStr) return;

      const d = new Date(dateStr);
      let key = "";
      let timestamp = d.getTime();

      if (salesTimeframe === "weekly") {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        key = `Wk ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        timestamp = startOfWeek.getTime();
      } else if (salesTimeframe === "monthly") {
        key = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        timestamp = startOfMonth.getTime();
      } else {
        key = d.getFullYear().toString();
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        timestamp = startOfYear.getTime();
      }

      if (!dataMap[key]) {
        dataMap[key] = { name: key, amount: 0, count: 0, timestamp };
      }

      dataMap[key].amount += Math.round(getPiGrandTotal(pi) || 0);
      dataMap[key].count += 1;
    });

    return Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  const processCompletedProformaData = () => {
    const dataMap = {};
    const safePis = Array.isArray(pis) ? pis : [];

    safePis.forEach((pi) => {
      const isCompleted = (pi.status || "").toLowerCase() === "paid" || (pi.stage || "").toLowerCase() === "completed";
      if (!isCompleted) return;

      const dateStr = pi.pi_date || pi.created_at;
      if (!dateStr) return;

      const d = new Date(dateStr);
      let key = "";
      let timestamp = d.getTime();

      if (salesTimeframe === "weekly") {
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        key = `Wk ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        timestamp = startOfWeek.getTime();
      } else if (salesTimeframe === "monthly") {
        key = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        timestamp = startOfMonth.getTime();
      } else {
        key = d.getFullYear().toString();
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        timestamp = startOfYear.getTime();
      }

      if (!dataMap[key]) {
        dataMap[key] = { name: key, amount: 0, count: 0, timestamp };
      }

      dataMap[key].amount += Math.round(getPiGrandTotal(pi) || 0);
      dataMap[key].count += 1;
    });

    return Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  const getPaddedProformaData = (isCompletedData = false) => {
    const periods = [];
    const now = new Date();

    if (salesTimeframe === "weekly") {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - (i * 7));
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const label = `Wk ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        periods.push({ name: label, amount: 0, count: 0, timestamp: startOfWeek.getTime() });
      }
    } else if (salesTimeframe === "monthly") {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        periods.push({ name: label, amount: 0, count: 0, timestamp: d.getTime() });
      }
    } else {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear() - i, 0, 1);
        const label = d.getFullYear().toString();
        periods.push({ name: label, amount: 0, count: 0, timestamp: d.getTime() });
      }
    }

    const rawData = isCompletedData ? processCompletedProformaData() : processPendingProformaData();

    periods.forEach(p => {
      const match = rawData.find(r => r.name === p.name);
      if (match) {
        p.amount = match.amount;
        p.count = match.count;
      }
    });

    return periods;
  };

  const salesData = processSalesData();
  const leadsDonutData = processLeadsDonut();
  const tasksPriorityData = processTasksPriority();
  const quotationStatusData = processQuotationStatus();
  const paymentProgressData = processPaymentProgress();

  const pendingData = getPaddedProformaData(false);
  const completedData = getPaddedProformaData(true);
  const pendingTotal = pendingData.reduce((acc, curr) => acc + curr.amount, 0);
  const completedTotal = completedData.reduce((acc, curr) => acc + curr.amount, 0);

  const getInvoiceProgressDetails = (isCompletedData = false) => {
    const safePis = Array.isArray(pis) ? pis : [];
    let totalPaid = 0;
    let totalValue = 0;

    const now = new Date();
    safePis.forEach((pi) => {
      const isCompleted = (pi.status || "").toLowerCase() === "paid" || (pi.stage || "").toLowerCase() === "completed";
      if (isCompletedData !== isCompleted) return;

      const dateStr = pi.pi_date || pi.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);

      if (salesTimeframe === "weekly") {
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(now.getDate() - 28);
        if (d < fourWeeksAgo) return;
      } else if (salesTimeframe === "monthly") {
        const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 1);
        if (d < fourMonthsAgo) return;
      } else {
        const threeYearsAgo = new Date(now.getFullYear() - 3, 0, 1);
        if (d < threeYearsAgo) return;
      }

      const grandTotal = getPiGrandTotal(pi);
      totalValue += grandTotal;
      totalPaid += Number(pi.total || 0);
    });

    const remaining = Math.max(0, totalValue - totalPaid);
    const percentage = totalValue > 0 ? Math.round((totalPaid / totalValue) * 100) : 0;
    return { totalValue, totalPaid, remaining, percentage };
  };

  const pendingProgress = getInvoiceProgressDetails(false);
  const completedProgress = getInvoiceProgressDetails(true);

  const processLeadsTrend = () => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const trendMap = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      trendMap[mName] = 0;
    }

    safeLeads.forEach((lead) => {
      try {
        const d = new Date(lead.created_at);
        const mName = months[d.getMonth()];
        if (trendMap[mName] !== undefined) {
          trendMap[mName] += 1;
        }
      } catch (e) { }
    });

    return Object.keys(trendMap).map((mName) => ({
      name: mName,
      leads: trendMap[mName],
    }));
  };

  const processLeadsBySource = () => {
    const sourceCount = {};
    const safeLeads = Array.isArray(leads) ? leads : [];
    safeLeads.forEach((lead) => {
      const src = lead.source || "Unknown";
      sourceCount[src] = (sourceCount[src] || 0) + 1;
    });

    const colors = ["#f97316", "#fbbf24", "#ea580c", "#fb923c", "#fde047", "#f97316"];
    return Object.keys(sourceCount).map((src, index) => ({
      name: src,
      value: sourceCount[src],
      color: colors[index % colors.length],
    }));
  };

  // Safety fallbacks to guarantee array variables
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeTodos = Array.isArray(todos) ? todos : [];
  const safeLeads = Array.isArray(leads) ? leads : [];

  // Sort tasks & todos logically
  const pendingTasks = safeTasks.slice(0, 5);
  const unfinishedTodos = safeTodos.filter((t) => !t.is_finished).slice(0, 5);
  const finishedTodos = safeTodos.filter((t) => t.is_finished).slice(0, 5);
  const recentLeadsList = safeLeads.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans text-gray-900 pb-12">
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        @keyframes sparklineDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <Header />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">

        {/* Top Summary Cards */}
        {loading ? (
          <div className="h-32 flex items-center justify-center bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-100 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-gray-400 font-semibold animate-pulse">
              Loading amazing metrics...
            </span>
          </div>
        ) : role === 'Estimation' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <DashboardCard
              onClick={() => router.push("/sales/quotation")}
              title="Total Estimations"
              value={quotations.length}
              icon={Activity}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/quotation")}
              title="Pending Estimations"
              value={quotations.filter((q) => { const st = (q.quotation_status || "").toLowerCase(); return st !== "won" && st !== "approved" && st !== "lost"; }).length}
              icon={Clock}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/quotation")}
              title="Approved Estimations"
              value={quotations.filter((q) => { const st = (q.quotation_status || "").toLowerCase(); return st === "won" || st === "approved"; }).length}
              icon={CheckCircle2}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/quotation")}
              title="Lost Estimations"
              value={quotations.filter((q) => (q.quotation_status || "").toLowerCase() === "lost").length}
              icon={Trash2}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
          </div>
        ) : role === 'Sales' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <DashboardCard
              onClick={() => router.push("/sales/lead")}
              title="Total Leads"
              value={leads.length}
              icon={UserPlus}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/lead")}
              title="Won Leads"
              value={leads.filter((l) => l.status === "Won").length}
              icon={CheckCircle2}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/quotation")}
              title="Total Estimations"
              value={quotations.length}
              icon={Activity}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/quotation")}
              title="Approved Estimations"
              value={quotations.filter((q) => { const st = (q.quotation_status || "").toLowerCase(); return st === "won" || st === "approved"; }).length}
              icon={TrendingUp}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
          </div>
        ) : role === 'Leads Management' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <DashboardCard
              onClick={() => router.push("/sales/lead")}
              title="Total Leads"
              value={leads.length}
              icon={UserPlus}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/lead")}
              title="Pending Leads"
              value={leads.filter((l) => l.status !== "Won" && l.status !== "Lost").length}
              icon={Clock}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/lead")}
              title="Won Leads"
              value={leads.filter((l) => l.status === "Won").length}
              icon={CheckCircle2}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/sales/lead")}
              title="Lost Leads"
              value={leads.filter((l) => l.status === "Lost").length}
              icon={Trash2}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
          </div>
        ) : role === 'Proforma invoices' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <DashboardCard
              onClick={() => router.push("/sales/proforma")}
              title="Total Proforma Invoices"
              value={pis.length}
              icon={Activity}
              bgClass="from-white to-slate-50/40 hover:to-slate-50/80"
              glowClass="bg-slate-200/50"
              titleHoverClass="group-hover:text-slate-600"
              colorClass="bg-slate-50 text-slate-600 border border-slate-200/50 group-hover:bg-slate-600 group-hover:text-white"
              sparklineColor="text-slate-400"
            />
            <DashboardCard
              onClick={() => router.push("/sales/proforma")}
              title="Fully Paid / Completed"
              value={pis.filter(pi => (pi.status || '').toLowerCase() === 'paid' || (pi.stage || '').toLowerCase() === 'completed').length}
              icon={CheckCircle2}
              bgClass="from-white to-emerald-50/40 hover:to-emerald-50/80"
              glowClass="bg-emerald-100/50"
              titleHoverClass="group-hover:text-emerald-600"
              colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100/50 group-hover:bg-emerald-600 group-hover:text-white"
              sparklineColor="text-emerald-400"
            />
            <DashboardCard
              onClick={() => router.push("/sales/proforma")}
              title="Pending / Partial Collection"
              value={pis.filter(pi => (pi.status || '').toLowerCase() !== 'paid' && (pi.stage || '').toLowerCase() !== 'completed').length}
              icon={Clock}
              bgClass="from-white to-blue-50/40 hover:to-blue-50/80"
              glowClass="bg-blue-100/50"
              titleHoverClass="group-hover:text-blue-600"
              colorClass="bg-blue-50 text-blue-600 border border-blue-100/50 group-hover:bg-blue-600 group-hover:text-white"
              sparklineColor="text-blue-400"
            />
            <DashboardCard
              onClick={() => router.push("/sales/proforma")}
              title="Total Collected"
              value={`₹${Math.round(paymentProgressData.totalPaid).toLocaleString("en-IN")}`}
              icon={TrendingUp}
              bgClass="from-white to-indigo-50/40 hover:to-indigo-50/80"
              glowClass="bg-indigo-100/50"
              titleHoverClass="group-hover:text-indigo-600"
              colorClass="bg-indigo-50 text-indigo-600 border border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white"
              sparklineColor="text-indigo-400"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <DashboardCard
              onClick={() => router.push("/sales/lead")}
              title="Total Leads"
              value={leads.length}
              icon={UserPlus}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/customer-list")}
              title="Total Customers"
              value={customers.length}
              icon={Users}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/tasks")}
              title="Total Tasks"
              value={tasks.length}
              icon={CheckSquare}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
            <DashboardCard
              onClick={() => router.push("/todolist")}
              title="Active To-Dos"
              value={todos.filter((t) => !t.is_finished).length}
              icon={ListTodo}
              colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
            />
          </div>
        )}

        {/* Dashboard Analytics & Widgets */}
        {!loading && role === 'Leads Management' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            {/* ROW 1: Charts & Recent Leads (3 Columns) */}
            {/* Leads by Source Donut Chart (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="mb-2">
                <h3 className="text-sm font-extrabold text-gray-800">
                  Leads by Source
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Lead source distribution
                </p>
              </div>
              <div className="h-[210px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={processLeadsBySource()}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={2000}
                    >
                      {processLeadsBySource().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead Status Donut Chart (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="mb-2">
                <h3 className="text-sm font-extrabold text-gray-800">
                  Lead Status
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  CRM leads distribution
                </p>
              </div>
              <div className="h-[210px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={2000}
                    >
                      {leadsDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                      itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Leads List (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">Recent Leads</h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">Your last 4 leads</p>
                </div>
                <button
                  onClick={() => router.push("/sales/lead")}
                  className="text-[10px] text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-2.5 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[145px] pr-1 custom-scrollbar">
                {safeLeads.slice(0, 4).map((lead, idx) => (
                  <div
                    key={idx}
                    className="bg-white/80 backdrop-blur-sm border border-slate-100 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group animate-fade-in"
                  >
                    <div className="truncate flex-1 mr-3">
                      <h4 className="font-bold text-gray-800 text-[11px] mb-0.5 truncate">{lead.reference || "Untitled Lead"}</h4>
                      <p className="text-blue-600 text-[9px] font-extrabold truncate">{lead.company_name}</p>
                      <div className="flex gap-2 text-[8px] text-gray-400 font-semibold mt-0.5">
                        <span className="truncate">{lead.customer_name}</span>
                        <span>•</span>
                        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${lead.status === "Won" ? "bg-green-100 text-green-700" : lead.status === "Lost" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {lead.status}
                      </span>
                      <button onClick={() => router.push(`/sales/lead?id=${lead.lead_id}`)} className="text-[9px] font-bold text-gray-400 hover:text-blue-500 transition-colors">Details →</button>
                    </div>
                  </div>
                ))}
                {safeLeads.length === 0 && (
                  <div className="py-8 text-center bg-white/40 rounded-xl border border-dashed border-gray-200 w-full">
                    <p className="text-gray-400 text-[10px] font-semibold">No leads found yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: Full Width To-Do Split View (Span 12) */}
            <div
              className="lg:col-span-12 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-md font-extrabold text-gray-800">
                    Todo List
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Productivity Checklist
                  </p>
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <form
                    onSubmit={handleAddTodo}
                    className="flex relative flex-1 md:w-56"
                  >
                    <input
                      type="text"
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      placeholder={
                        editingTodoId ? "Update task..." : "Quick add a new task..."
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg py-[7px] pl-3 pr-8 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-gray-800 font-medium placeholder-gray-400"
                      disabled={addingTodo}
                    />
                    <button
                      type="submit"
                      disabled={addingTodo || !newTodoTitle.trim()}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </form>
                  <button
                    onClick={() => router.push("/todolist")}
                    className="text-[10px] text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                <div className="bg-white/60 backdrop-blur-sm border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      Unfinished Tasks
                    </h3>
                  </div>
                  <div className="space-y-1.5 overflow-y-auto h-[120px] custom-scrollbar">
                    {unfinishedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="group flex justify-between items-center bg-indigo-50/50 rounded-md px-2.5 py-1.5 animate-fade-in"
                      >
                        <div className="flex items-center gap-2 flex-1 truncate">
                          <input
                            type="checkbox"
                            onChange={() => handleToggleTodo(todo.id)}
                            className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                          />
                          <p className="text-[12px] font-semibold text-gray-700 truncate">
                            {todo.title}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => startEditTodo(todo)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {unfinishedTodos.length === 0 && (
                      <p className="text-gray-400 text-xs text-center py-8">No unfinished tasks</p>
                    )}
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      Finished Tasks
                    </h3>
                  </div>
                  <div className="space-y-1.5 overflow-y-auto h-[120px] custom-scrollbar">
                    {finishedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="group flex justify-between items-center bg-green-50/50 rounded-md px-2.5 py-1.5 animate-fade-in"
                      >
                        <div className="flex items-center gap-2 flex-1 truncate">
                          <input
                            type="checkbox"
                            checked
                            onChange={() => handleToggleTodo(todo.id)}
                            className="w-3.5 h-3.5 accent-green-500 cursor-pointer"
                          />
                          <p className="text-[12px] font-semibold text-gray-400 line-through truncate">
                            {todo.title}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {finishedTodos.length === 0 && (
                      <p className="text-gray-400 text-xs text-center py-8">No finished tasks yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && role === 'Sales' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* ROW 1: Symmetrical 3-Column Charts & Recent List */}

              {/* Leads Status Donut Chart (Span 4) */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="mb-2">
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Lead Status Distribution
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Won vs Pending vs Lost leads
                  </p>
                </div>
                <div className="h-[210px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processLeadsDonut()}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={2000}
                      >
                        {processLeadsDonut().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                        itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quotation Status Donut Chart (Span 4) */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="mb-2">
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Estimation Distribution
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Success vs Pending status
                  </p>
                </div>
                <div className="h-[210px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processQuotationStatus()}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={2000}
                      >
                        {processQuotationStatus().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                        itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Sales Activities List (Span 4) */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="mb-3">
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Recent Sales Actions
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Combined activity logs
                  </p>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[200px] pr-1 custom-scrollbar">
                  {(() => {
                    const activities = [];
                    const safeLeads = Array.isArray(leads) ? leads : [];
                    const safeQuotations = Array.isArray(quotations) ? quotations : [];

                    safeLeads.forEach(l => {
                      activities.push({
                        id: `lead-${l.lead_id}`,
                        type: "Lead",
                        title: l.company_name || l.customer_name || "New Lead",
                        subtitle: l.reference || "No Reference",
                        date: l.created_at || l.updated_at,
                        status: l.status,
                      });
                    });

                    safeQuotations.forEach(q => {
                      activities.push({
                        id: `quote-${q.latest_quotation_id || q.id}`,
                        type: "Estimation",
                        title: q.company_name || q.customer_name || "New Quotation",
                        subtitle: q.quotation_no || "No Quote No.",
                        date: q.quotation_created_at || q.quotation_date,
                        status: q.quotation_status,
                        amount: q.grand_total || q.amount,
                      });
                    });

                    const sorted = activities
                      .filter(act => act.date)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 4);

                    if (sorted.length === 0) {
                      return <p className="text-gray-400 text-xs text-center py-10">No recent activity</p>;
                    }

                    return sorted.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 hover:bg-white border border-slate-100 hover:border-indigo-100 transition-all duration-300 shadow-sm"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${act.type === "Lead"
                              ? "bg-indigo-100 text-indigo-600 border border-indigo-200/50"
                              : "bg-emerald-100 text-emerald-600 border border-emerald-200/50"
                              }`}>
                              {act.type}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              {act.date ? new Date(act.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-700 truncate max-w-[130px] sm:max-w-[170px]">
                            {act.title}
                          </span>
                          <span className="text-[9px] text-gray-400 truncate max-w-[130px] sm:max-w-[170px] font-semibold">
                            {act.subtitle}
                          </span>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          {act.amount !== undefined && (
                            <span className="text-[11px] font-black text-gray-800">
                              ₹{Math.round(act.amount).toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight mt-1 ${act.status === "Won" || act.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : act.status === "Lost"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                            }`}>
                            {act.status}
                          </span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* ROW 2: Sales Area Chart & Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Estimation Performance Trend (Area Chart) (Span 7) */}
              <div
                className="lg:col-span-7 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800">
                      Estimation Performance Trend
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                      Approved vs Draft quotation amounts
                    </p>
                  </div>
                  <div className="flex space-x-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                    <button
                      onClick={() => setSalesTimeframe("weekly")}
                      className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "weekly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setSalesTimeframe("monthly")}
                      className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "monthly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSalesTimeframe("yearly")}
                      className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "yearly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
                <div className="h-[210px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={processEstimationTimeframeData()}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSalesApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSalesDraft" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={9}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                          if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                          return `₹${value}`;
                        }}
                      />
                      <Tooltip
                        cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                        itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                        formatter={(value) => [`₹${Math.round(value).toLocaleString("en-IN")}`]}
                      />
                      <Area
                        type="monotone"
                        dataKey="Approved"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSalesApproved)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Draft"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSalesDraft)"
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Todo split list (Span 5) */}
              <div
                className="lg:col-span-5 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                <div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">
                        Sales checklist
                      </h3>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                        Productivity Checklist
                      </p>
                    </div>
                    <form
                      onSubmit={handleAddTodo}
                      className="flex relative w-full sm:w-44"
                    >
                      <input
                        type="text"
                        value={newTodoTitle}
                        onChange={(e) => setNewTodoTitle(e.target.value)}
                        placeholder={
                          editingTodoId ? "Update task..." : "Quick add task..."
                        }
                        className="w-full bg-white border border-gray-200 rounded-lg py-[5px] pl-2 pr-7 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-gray-800 font-semibold placeholder-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={addingTodo}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600 transition-colors p-1"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Unfinished checklist */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Circle size={8} fill="#4f46e5" stroke="transparent" />
                          Pending ({unfinishedTodos.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto h-[120px] custom-scrollbar pr-1">
                        {unfinishedTodos.map((todo) => (
                          <div
                            key={todo.id}
                            className="group flex justify-between items-center bg-indigo-50/50 rounded-md px-2 py-1 border border-indigo-100/50 hover:border-indigo-200/80 transition-all animate-fade-in"
                          >
                            <div className="flex items-center gap-2 flex-1 truncate">
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                              />
                              <p className="text-[11px] font-bold text-gray-700 truncate">
                                {todo.title}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditTodo(todo)}
                                className="text-gray-400 hover:text-indigo-500 transition-colors"
                              >
                                <Pencil size={10} />
                              </button>
                              <button
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {unfinishedTodos.length === 0 && (
                          <p className="text-gray-400 text-xs text-center py-8">All caught up!</p>
                        )}
                      </div>
                    </div>

                    {/* Finished checklist */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 size={10} className="text-green-500" />
                          Completed ({finishedTodos.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto h-[120px] custom-scrollbar pr-1">
                        {finishedTodos.map((todo) => (
                          <div
                            key={todo.id}
                            className="group flex justify-between items-center bg-green-50/50 rounded-md px-2 py-1 border border-green-100/50 transition-all animate-fade-in"
                          >
                            <div className="flex items-center gap-2 flex-1 truncate">
                              <input
                                type="checkbox"
                                checked
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-3.5 h-3.5 accent-green-500 cursor-pointer"
                              />
                              <p className="text-[11px] font-bold text-gray-400 line-through truncate">
                                {todo.title}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {finishedTodos.length === 0 && (
                          <p className="text-gray-400 text-xs text-center py-8">No completed tasks yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && role !== 'Leads Management' && role !== 'Estimation' && role !== 'Sales' && role !== 'Proforma invoices' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            {/* ROW 1 */}
            {/* Sales Chart (Span 8) */}
            <div
              className="lg:col-span-8 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col relative overflow-hidden group animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50/30 to-transparent pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-500"></div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <div>
                  <h3 className="text-md font-extrabold text-gray-800">
                    Sales Overview
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Approved quotations revenue
                  </p>
                </div>
                <div className="flex space-x-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                  <button
                    onClick={() => setSalesTimeframe("weekly")}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "weekly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setSalesTimeframe("monthly")}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "monthly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSalesTimeframe("yearly")}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "yearly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div className="h-[200px] w-full mt-auto relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
                      tickFormatter={(value) =>
                        `₹${value >= 1000 ? Math.round(value / 1000) + "k" : value}`
                      }
                      width={35}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "#6366f1",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      }}
                      itemStyle={{
                        color: "#4f46e5",
                        fontWeight: 800,
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        fill: "#6366f1",
                        stroke: "#fff",
                      }}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leads Donut Chart (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-orange-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="mb-1">
                <h3 className="text-md font-extrabold text-gray-800">
                  Lead Status
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  CRM leads distribution
                </p>
              </div>
              <div className="h-[200px] flex items-center justify-center mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={2000}
                    >
                      {leadsDonutData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                      itemStyle={{ fontWeight: "bold", fontSize: "12px" }}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ROW 2: 1x3 Symmetrical Row (Todo List, Pending Invoices, Completed Invoices) */}
            {/* Task Checklist (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800">
                      Task Checklist
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                      {unfinishedTodos.length} pending • {finishedTodos.length} completed
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/todolist")}
                    className="text-[9px] text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-2 py-1 rounded-md font-bold transition-all uppercase tracking-wider"
                  >
                    View All
                  </button>
                </div>

                {/* Quick Add */}
                <form onSubmit={handleAddTodo} className="flex relative mb-3">
                  <input
                    type="text"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    placeholder={editingTodoId ? "Update task..." : "Quick add task..."}
                    className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-3 pr-8 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-gray-800 font-semibold placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={addingTodo}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600 transition-colors p-1"
                  >
                    <Plus size={13} strokeWidth={3} />
                  </button>
                </form>

                {/* Scrollable Tasks List */}
                <div className="space-y-1.5 overflow-y-auto h-[175px] custom-scrollbar pr-1">
                  {/* Unfinished Todos */}
                  {unfinishedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="group flex justify-between items-center bg-indigo-50/30 rounded-md px-2.5 py-1.5 border border-indigo-100/30 hover:border-indigo-200/50 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1 truncate">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleToggleTodo(todo.id)}
                          className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                        />
                        <p className="text-[11px] font-bold text-gray-700 truncate">
                          {todo.title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditTodo(todo)}
                          className="text-gray-400 hover:text-indigo-500 transition-colors"
                        >
                          <Pencil size={10} />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Finished Todos */}
                  {finishedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="group flex justify-between items-center bg-emerald-50/10 rounded-md px-2.5 py-1 border border-emerald-50/20 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1 truncate">
                        <input
                          type="checkbox"
                          checked
                          onChange={() => handleToggleTodo(todo.id)}
                          className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                        />
                        <p className="text-[11px] font-semibold text-gray-400 line-through truncate">
                          {todo.title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {unfinishedTodos.length === 0 && finishedTodos.length === 0 && (
                    <p className="text-gray-400 text-xs text-center py-12">No tasks available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Invoices (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-amber-50/10 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800">
                      Pending Invoices
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                      Proforma Collection
                    </p>
                  </div>
                  <div className="flex space-x-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                    <button
                      onClick={() => setSalesTimeframe("weekly")}
                      className={`px-1.5 py-0.5 text-[9px] rounded font-black transition-all duration-200 ${salesTimeframe === "weekly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      W
                    </button>
                    <button
                      onClick={() => setSalesTimeframe("monthly")}
                      className={`px-1.5 py-0.5 text-[9px] rounded font-black transition-all duration-200 ${salesTimeframe === "monthly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setSalesTimeframe("yearly")}
                      className={`px-1.5 py-0.5 text-[9px] rounded font-black transition-all duration-200 ${salesTimeframe === "yearly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Y
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 mt-auto pt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                      Total Paid
                    </p>
                    <p className="text-lg font-extrabold text-amber-600 leading-none">
                      ₹
                      {pendingProgress.totalPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                      Remaining
                    </p>
                    <p className="text-lg font-extrabold text-red-500 leading-none">
                      ₹
                      {pendingProgress.remaining.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-1.5 items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full text-amber-700 bg-amber-50">
                        {pendingProgress.percentage}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold inline-block text-gray-500">
                        Total: ₹
                        {pendingProgress.totalValue.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-red-100">
                    <div
                      style={{
                        width: `${pendingProgress.percentage}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500 transition-all duration-1000 ease-in-out"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Invoices (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-emerald-50/10 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800">
                      Completed Invoices
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                      Proforma Collection
                    </p>
                  </div>
                  <div className="flex space-x-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                    <button
                      onClick={() => setSalesTimeframe("weekly")}
                      className={`px-1.5 py-0.5 text-[9px] rounded font-black transition-all duration-200 ${salesTimeframe === "weekly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      W
                    </button>
                    <button
                      onClick={() => setSalesTimeframe("monthly")}
                      className={`px-1.5 py-0.5 text-[9px] rounded font-black transition-all duration-200 ${salesTimeframe === "monthly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setSalesTimeframe("yearly")}
                      className={`px-1.5 py-0.5 text-[9px] rounded font-black transition-all duration-200 ${salesTimeframe === "yearly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Y
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 mt-auto pt-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                      Total Paid
                    </p>
                    <p className="text-lg font-extrabold text-emerald-600 leading-none">
                      ₹
                      {completedProgress.totalPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                      Remaining
                    </p>
                    <p className="text-lg font-extrabold text-red-500 leading-none">
                      ₹
                      {completedProgress.remaining.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-1.5 items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50">
                        {completedProgress.percentage}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold inline-block text-gray-500">
                        Total: ₹
                        {completedProgress.totalValue.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-red-100">
                    <div
                      style={{
                        width: `${completedProgress.percentage}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 ease-in-out"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: Donuts & Progress Indicators */}
            {/* Tasks Priority Donut (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/30 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">
                  Tasks Priority
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Focus areas
                </p>
              </div>
              <div className="h-[200px] flex items-center justify-center mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tasksPriorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={2000}
                    >
                      {tasksPriorityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                      itemStyle={{ fontWeight: "bold", fontSize: "12px" }}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quotation Status Chart (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/30 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.7s" }}
            >
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">
                  Quotation Status
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Active vs Won vs Lost
                </p>
              </div>
              <div className="h-[200px] flex items-center justify-center mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={quotationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={2000}
                    >
                      {quotationStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                      itemStyle={{ fontWeight: "bold", fontSize: "12px" }}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Due Progress Bar (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/30 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.8s" }}
            >
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">
                  Payment Due
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Proforma Collection
                </p>
              </div>
              <div className="flex flex-col gap-5 mt-auto">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                      Total Paid
                    </p>
                    <p className="text-lg font-extrabold text-emerald-600 leading-none">
                      ₹
                      {paymentProgressData.totalPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                      Remaining
                    </p>
                    <p className="text-lg font-extrabold text-red-500 leading-none">
                      ₹
                      {paymentProgressData.paymentDue.toLocaleString("en-IN", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                <div className="relative pt-1">
                  <div className="flex mb-1.5 items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50">
                        {paymentProgressData.progressPercentage}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold inline-block text-gray-500">
                        Total: ₹
                        {paymentProgressData.totalProformaAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-red-100">
                    <div
                      style={{
                        width: `${paymentProgressData.progressPercentage}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 ease-in-out"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Leads (Last 3) */}
            <div
              className="lg:col-span-12 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-800">
                    Recent Leads
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Last 3 leads added
                  </p>
                </div>
                <button
                  onClick={() => router.push("/sales/lead")}
                  className="text-[10px] text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider"
                >
                  View All Leads
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {safeLeads.slice(0, 3).map((lead, idx) => (
                  <div
                    key={idx}
                    className="bg-white/60 backdrop-blur-sm border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <UserPlus size={40} className="text-indigo-500" />
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1 truncate pr-8">
                      {lead.lead_title || "Untitled Lead"}
                    </h4>
                    <p className="text-indigo-600 text-xs font-bold mb-3">
                      {lead.company_name}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <Users size={12} className="text-gray-400" />
                        <span className="truncate">{lead.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <Clock size={12} className="text-gray-400" />
                        <span>
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${lead.status === "Won"
                          ? "bg-green-100 text-green-700"
                          : lead.status === "Lost"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {lead.status}
                      </span>
                      <button
                        onClick={() =>
                          router.push(`/sales/lead?id=${lead.lead_id}`)
                        }
                        className="text-[10px] font-bold text-gray-400 hover:text-indigo-500 transition-colors"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                ))}
                {safeLeads.length === 0 && (
                  <div className="col-span-3 py-10 text-center bg-white/40 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm font-medium">
                      No leads found yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && role === 'Proforma invoices' && (
          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Proforma Status Distribution (Donut Chart) */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="mb-2">
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Proforma Invoice Status
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Status breakdown
                  </p>
                </div>
                <div className="h-[210px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processPiStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={2000}
                      >
                        {processPiStatusData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                        itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Collection Progress Bar/Gauge */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="mb-6">
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Payment Collection Progress
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Collection recovery progress
                  </p>
                </div>
                <div className="flex flex-col gap-5 mt-auto">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Total Collected
                      </p>
                      <p className="text-xl font-extrabold text-emerald-600 leading-none">
                        ₹
                        {paymentProgressData.totalPaid.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Remaining Due
                      </p>
                      <p className="text-xl font-extrabold text-red-500 leading-none">
                        ₹
                        {paymentProgressData.paymentDue.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="flex mb-1.5 items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50">
                          {paymentProgressData.progressPercentage}% Collected
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold inline-block text-gray-500">
                          Total PI Value: ₹
                          {paymentProgressData.totalProformaAmount.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-red-100">
                      <div
                        style={{
                          width: `${paymentProgressData.progressPercentage}%`,
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 ease-in-out"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Proforma Invoices list */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-800">
                      Recent Proforma Invoices
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                      Latest active invoices
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/sales/proforma")}
                    className="text-[10px] text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-2.5 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[165px] pr-1 custom-scrollbar">
                  {pis.slice(0, 4).map((pi) => {
                    const grandTotal = getPiGrandTotal(pi);
                    return (
                      <div
                        key={pi.pi_id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/70 hover:bg-white border border-slate-100 hover:border-indigo-100 transition-all duration-300 shadow-sm"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] text-gray-400 font-bold">
                              {pi.pi_date ? new Date(pi.pi_date).toLocaleDateString() : ""}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[9px] text-indigo-600 font-bold">
                              {pi.pi_no || `PI-${pi.pi_id}`}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-700 truncate max-w-[130px] sm:max-w-[170px]">
                            {pi.customer_name}
                          </span>
                          <span className="text-[9px] text-gray-400 truncate max-w-[130px] sm:max-w-[170px] font-semibold">
                            Quote: {pi.quotation_no || "N/A"}
                          </span>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[11px] font-black text-gray-800">
                            ₹{Math.round(grandTotal).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[8px] text-gray-400 font-bold mt-0.5">
                            Paid: {pi.proforma_percentage || 0}%
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight mt-1 ${(pi.status || "").toLowerCase() === "paid" || (pi.stage || "").toLowerCase() === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : (pi.status || "").toLowerCase() === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                            }`}>
                            {pi.status || "Draft"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {pis.length === 0 && (
                    <p className="text-gray-400 text-xs text-center py-10">No proforma invoices found</p>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: Collection Trend & Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Proforma Collection Trend (Area Chart) */}
              <div
                className="lg:col-span-7 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Collection Performance Trend
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Monthly PI Total Value vs Collected Amount
                  </p>
                </div>
                <div className="h-[210px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={processProformaTrendData()}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorPITotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPICollected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={9}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                          if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                          return `₹${value}`;
                        }}
                      />
                      <Tooltip
                        cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        }}
                        itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                        formatter={(value) => [`₹${Math.round(value).toLocaleString("en-IN")}`]}
                      />
                      <Area
                        type="monotone"
                        dataKey="Total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPITotal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Collected"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPICollected)"
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: "10px", fontWeight: 600, color: "#475569" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Todo split list */}
              <div
                className="lg:col-span-5 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                <div>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">
                        Task Checklist
                      </h3>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                        Daily productivity tasks
                      </p>
                    </div>
                    <form
                      onSubmit={handleAddTodo}
                      className="flex relative w-full sm:w-44"
                    >
                      <input
                        type="text"
                        value={newTodoTitle}
                        onChange={(e) => setNewTodoTitle(e.target.value)}
                        placeholder={
                          editingTodoId ? "Update task..." : "Quick add task..."
                        }
                        className="w-full bg-white border border-gray-200 rounded-lg py-[5px] pl-2 pr-7 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-gray-800 font-semibold placeholder-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={addingTodo}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600 transition-colors p-1 animate-pulse"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </form>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Circle size={8} fill="#3b82f6" stroke="transparent" />
                          Pending ({unfinishedTodos.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto h-[120px] custom-scrollbar pr-1">
                        {unfinishedTodos.map((todo) => (
                          <div
                            key={todo.id}
                            className="group flex justify-between items-center bg-blue-50/30 rounded-md px-2 py-1 border border-blue-100/30 hover:border-blue-200/50 transition-all animate-fade-in"
                          >
                            <div className="flex items-center gap-2 flex-1 truncate">
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer"
                              />
                              <p className="text-[11px] font-bold text-gray-700 truncate">
                                {todo.title}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditTodo(todo)}
                                className="text-gray-400 hover:text-indigo-500 transition-colors"
                              >
                                <Pencil size={10} />
                              </button>
                              <button
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {unfinishedTodos.length === 0 && (
                          <p className="text-gray-400 text-xs text-center py-8">All caught up!</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 size={10} className="text-emerald-500" />
                          Completed ({finishedTodos.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 overflow-y-auto h-[120px] custom-scrollbar pr-1">
                        {finishedTodos.map((todo) => (
                          <div
                            key={todo.id}
                            className="group flex justify-between items-center bg-emerald-50/30 rounded-md px-2 py-1 border border-emerald-100/30 transition-all animate-fade-in"
                          >
                            <div className="flex items-center gap-2 flex-1 truncate">
                              <input
                                type="checkbox"
                                checked
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                              />
                              <p className="text-[11px] font-bold text-gray-400 line-through truncate">
                                {todo.title}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {finishedTodos.length === 0 && (
                          <p className="text-gray-400 text-xs text-center py-8">No completed tasks yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && role === 'Estimation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            {/* ROW 1: Charts & Recent Estimations (3 Columns) */}
            {/* Quotation Status Distribution Donut Chart (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="mb-2">
                <h3 className="text-sm font-extrabold text-gray-800">
                  Estimation Distribution
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Success vs Draft status
                </p>
              </div>
              <div className="h-[210px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={processQuotationStatus()}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={2000}
                    >
                      {processQuotationStatus().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                      itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quotation Payment Breakdown Donut Chart (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="mb-2">
                <h3 className="text-sm font-extrabold text-gray-800">
                  Payment Status
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Paid vs Due breakdown
                </p>
              </div>
              <div className="h-[210px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {(() => {
                      const pData = [
                        { name: "Paid Value", value: paymentProgressData.totalPaid || 0, color: "#10B981" },
                        { name: "Due Value", value: paymentProgressData.paymentDue || 0, color: "#6366f1" }
                      ].filter(item => item.value > 0);
                      if (pData.length === 0) {
                        pData.push({ name: "No Payments", value: 1, color: "#cbd5e1" });
                      }
                      return (
                        <Pie
                          data={pData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={68}
                          paddingAngle={4}
                          dataKey="value"
                          animationDuration={2000}
                        >
                          {pData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="transparent"
                            />
                          ))}
                        </Pie>
                      );
                    })()}
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                      itemStyle={{ fontWeight: "bold", fontSize: "11px" }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Estimations List (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Recent Estimations
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Your last 4 active quotations
                  </p>
                </div>
                <button
                  onClick={() => router.push("/sales/quotation")}
                  className="text-[10px] text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-2.5 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[145px] pr-1 custom-scrollbar">
                {quotations.slice(0, 4).map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-white/80 backdrop-blur-sm border border-slate-100 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group animate-fade-in"
                  >
                    <div className="truncate flex-1 mr-3">
                      <h4 className="font-bold text-gray-800 text-[11px] mb-0.5 truncate">
                        {q.reference || "Untitled Quotation"}
                      </h4>
                      <p className="text-blue-600 text-[9px] font-extrabold truncate">
                        {q.company_name}
                      </p>
                      <div className="flex gap-2 text-[8px] text-gray-400 font-semibold mt-0.5">
                        <span>₹{Number(q.grand_total || 0).toLocaleString("en-IN")}</span>
                        <span>•</span>
                        <span>{new Date(q.created_at || q.quotation_created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${q.quotation_status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : q.quotation_status === "Lost"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {q.quotation_status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
                {quotations.length === 0 && (
                  <div className="py-8 text-center bg-white/40 rounded-xl border border-dashed border-gray-200 w-full">
                    <p className="text-gray-400 text-[10px] font-semibold">
                      No estimations created yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: Balanced Layout (Chart Span 7 + Todo List Span 5) */}
            {/* Estimation Performance Area Chart (Span 7) */}
            <div
              className="lg:col-span-7 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Estimation Performance Trend
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Draft vs Approved Estimation Value
                  </p>
                </div>
                <div className="flex space-x-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                  <button
                    onClick={() => setSalesTimeframe("weekly")}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "weekly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setSalesTimeframe("monthly")}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "monthly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSalesTimeframe("yearly")}
                    className={`px-2.5 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "yearly" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div className="h-[210px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={processEstimationTimeframeData()}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDraft" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: "#64748b" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      tick={{ fontSize: 10, fontWeight: 600, fill: "#64748b" }}
                    />
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Approved"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorApproved)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Draft"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorDraft)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Todo List Card (Span 5) */}
            <div
              className="lg:col-span-5 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Todo List
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Checklist
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 w-full md:w-auto">
                  <form
                    onSubmit={handleAddTodo}
                    className="flex relative flex-1 md:w-40"
                  >
                    <input
                      type="text"
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      placeholder="Add task..."
                      className="w-full bg-white border border-gray-200 rounded-lg py-[6px] pl-2 pr-6 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-800 font-medium placeholder-gray-400"
                      disabled={addingTodo}
                    />
                    <button
                      type="submit"
                      disabled={addingTodo || !newTodoTitle.trim()}
                      className="absolute right-0.5 top-1/2 transform -translate-y-1/2 p-1 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      <Plus size={10} strokeWidth={3} />
                    </button>
                  </form>
                  <button
                    onClick={() => router.push("/todolist")}
                    className="text-[9px] text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-2.5 py-1 rounded-md font-bold transition-all uppercase tracking-wider"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                <div className="bg-white/60 backdrop-blur-sm border border-gray-100 p-2.5 rounded-xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                      Unfinished
                    </h3>
                  </div>
                  <div className="space-y-1 overflow-y-auto h-[110px] custom-scrollbar">
                    {unfinishedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="group flex justify-between items-center bg-blue-50/50 rounded-md px-2 py-1 animate-fade-in"
                      >
                        <div className="flex items-center gap-1.5 flex-1 truncate">
                          <input
                            type="checkbox"
                            onChange={() => handleToggleTodo(todo.id)}
                            className="w-3 h-3 accent-blue-500 cursor-pointer"
                          />
                          <p className="text-[11px] font-semibold text-gray-700 truncate">
                            {todo.title}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => startEditTodo(todo)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {unfinishedTodos.length === 0 && (
                      <p className="text-gray-400 text-[10px] text-center py-6">No unfinished tasks</p>
                    )}
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-gray-100 p-2.5 rounded-xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <h3 className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                      Finished
                    </h3>
                  </div>
                  <div className="space-y-1 overflow-y-auto h-[110px] custom-scrollbar">
                    {finishedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="group flex justify-between items-center bg-green-50/50 rounded-md px-2 py-1 animate-fade-in"
                      >
                        <div className="flex items-center gap-1.5 flex-1 truncate">
                          <input
                            type="checkbox"
                            checked
                            onChange={() => handleToggleTodo(todo.id)}
                            className="w-3 h-3 accent-green-500 cursor-pointer"
                          />
                          <p className="text-[11px] font-semibold text-gray-400 line-through truncate">
                            {todo.title}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="text-red-500"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {finishedTodos.length === 0 && (
                      <p className="text-gray-400 text-[10px] text-center py-6">No finished tasks</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TRAFFIC LIGHT ANALYTICS SECTION (Phase 2)
        ========================================= */}
        {(role === 'Admin' || role === 'Super Admin' || role === 'Leads Management') && trafficLightStats.length > 0 && (
          <div className="mt-6 mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4 pl-1">
              <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-lg shadow-sm">
                <Activity size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-800 tracking-tight leading-tight">
                  Team Performance <span className="text-gray-400 font-medium text-sm ml-1">(Traffic Light System)</span>
                </h2>
                <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                  Analyze response times and follow-up efficiency across the sales team
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chart Card */}
              <div className="bg-white/60 backdrop-blur-xl border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col">
                <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-gray-400" /> Follow-Up Status Distribution
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trafficLightStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="assignee" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="green_count" name="On Time (< 24h)" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} barSize={32} />
                      <Bar dataKey="yellow_count" name="Late (24h-48h)" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="red_count" name="Very Late (> 48h)" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white/60 backdrop-blur-xl border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col">
                <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" /> Average Response Times
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest whitespace-nowrap">Employee</th>
                        <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest whitespace-nowrap">Avg Response</th>
                        <th className="px-4 py-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest whitespace-nowrap text-right">Total Logs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {trafficLightStats.map((stat, idx) => {
                        const avgHours = parseFloat(stat.avg_hours_elapsed || 0);
                        let timeString = "";
                        if (avgHours < 1) {
                          timeString = `${Math.round(avgHours * 60)} mins`;
                        } else {
                          timeString = `${avgHours.toFixed(1)} hours`;
                        }

                        let statusDot = "bg-green-500";
                        if (avgHours >= 48) statusDot = "bg-red-500";
                        else if (avgHours >= 24) statusDot = "bg-yellow-500";

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border border-blue-200 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-blue-700">{stat.assignee ? stat.assignee.charAt(0).toUpperCase() : '?'}</span>
                                </div>
                                <span className="text-[12px] font-semibold text-gray-800">{stat.assignee || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${statusDot} shadow-sm`}></span>
                                <span className="text-[12px] font-medium text-gray-600">{timeString}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                                {stat.total_logs}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
