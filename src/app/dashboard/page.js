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
}) {
  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-white to-orange-50/40 backdrop-blur-xl hover:to-orange-50/80 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 p-3 sm:p-4 flex flex-col transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-orange-100/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
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
        <h3 className="text-gray-400 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase mb-0.5 group-hover:text-orange-500 transition-colors">
          {title}
        </h3>
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight group-hover:scale-105 transform origin-left transition-transform duration-300">
          {value}
        </h2>
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

      const fetchedQuotations =
        quotationsRes.data?.result ||
        quotationsRes.data?.data ||
        quotationsRes.data;
      setQuotations(Array.isArray(fetchedQuotations) ? fetchedQuotations : []);

      const fetchedPis = piRes.data?.data || piRes.data?.result || piRes.data;
      setPis(Array.isArray(fetchedPis) ? fetchedPis : []);

      const fetchedContracts = contractsRes.data?.data || contractsRes.data;
      setContracts(Array.isArray(fetchedContracts) ? fetchedContracts : []);

      const fetchedProducts = productsRes.data?.data || productsRes.data;
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);

    } catch (error) {
      console.error("Dashboard Data Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
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

        if (salesTimeframe === "monthly") {
          key = d.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
        } else {
          key = d.getFullYear().toString();
        }

        if (!dataMap[key]) {
          dataMap[key] = { name: key, sales: 0 };
        }
        dataMap[key].sales += Math.round(Number(q.grand_total) || 0);
      }
    });

    return Object.values(dataMap).sort((a, b) => {
      if (salesTimeframe === "monthly") {
        return new Date(a.name) - new Date(b.name);
      }
      return parseInt(a.name) - parseInt(b.name);
    });
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

  const salesData = processSalesData();
  const leadsDonutData = processLeadsDonut();
  const tasksPriorityData = processTasksPriority();
  const quotationStatusData = processQuotationStatus();
  const paymentProgressData = processPaymentProgress();

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
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            {/* ROW 1 */}
            {/* Sales Chart (Span 8) */}
            <div
              className="lg:col-span-8 bg-gradient-to-br from-white to-orange-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col relative overflow-hidden group animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-orange-50/60 to-transparent pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 duration-500"></div>
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
                    onClick={() => setSalesTimeframe("monthly")}
                    className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "monthly" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSalesTimeframe("yearly")}
                    className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all duration-200 ${salesTimeframe === "yearly" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
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
                        stroke: "#f97316",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      }}
                      itemStyle={{
                        color: "#ea580c",
                        fontWeight: 800,
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#ea580c"
                      strokeWidth={3}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        fill: "#f97316",
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

            {/* ROW 2 */}
            {/* Split View To-Do List (Span 7) */}
            <div
              className="lg:col-span-7 bg-gradient-to-br from-white to-orange-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-md font-extrabold text-gray-800">
                    Todo List
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Productivity
                  </p>
                </div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <form
                    onSubmit={handleAddTodo}
                    className="flex relative flex-1 md:w-48"
                  >
                    <input
                      type="text"
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      placeholder={
                        editingTodoId ? "Update task..." : "Quick add..."
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-3 pr-8 text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-gray-800 font-medium placeholder-gray-400"
                      disabled={addingTodo}
                    />
                    <button
                      type="submit"
                      disabled={addingTodo || !newTodoTitle.trim()}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:opacity-50 transition-all"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </form>
                  <button
                    onClick={() => router.push("/todolist")}
                    className="text-[10px] text-orange-600 hover:text-white bg-orange-50 hover:bg-orange-500 px-2.5 py-1.5 rounded-lg font-bold transition-all"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                <div className="bg-white/60 backdrop-blur-sm border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      Unfinished
                    </h3>
                  </div>
                  <div className="space-y-1.5 overflow-y-auto h-[120px] custom-scrollbar">
                    {unfinishedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="group flex justify-between items-center bg-orange-50/50 rounded-md px-2.5 py-1.5"
                      >
                        <div className="flex items-center gap-2 flex-1 truncate">
                          <input
                            type="checkbox"
                            onChange={() => handleToggleTodo(todo.id)}
                            className="w-3.5 h-3.5 accent-orange-500 cursor-pointer"
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
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      Finished
                    </h3>
                  </div>
                  <div className="space-y-1.5 overflow-y-auto h-[120px] custom-scrollbar">
                    {finishedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="group flex justify-between items-center bg-green-50/50 rounded-md px-2.5 py-1.5"
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
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Due Progress Bar (Span 5) */}
            <div
              className="lg:col-span-5 bg-gradient-to-br from-white to-orange-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="mb-6">
                <h3 className="text-md font-extrabold text-gray-800">
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
                    <p className="text-xl font-extrabold text-green-600 leading-none">
                      ₹
                      {paymentProgressData.totalPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                      Remaining
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
                      <span className="text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full text-green-700 bg-green-50">
                        {paymentProgressData.progressPercentage}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold inline-block text-gray-500">
                        Total: ₹
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
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-1000 ease-in-out"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4 */}
            {/* Tasks Priority Donut (Span 6) */}
            <div
              className="lg:col-span-6 bg-gradient-to-br from-white to-orange-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="mb-1">
                <h3 className="text-lg font-extrabold text-gray-800">
                  Tasks Priority
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Focus areas
                </p>
              </div>
              <div className="h-[200px] flex items-center justify-center mt-auto">
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

            {/* Quotation Status Chart (Span 6) */}
            <div
              className="lg:col-span-6 bg-gradient-to-br from-white to-orange-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
              style={{ animationDelay: "0.7s" }}
            >
              <div className="mb-1">
                <h3 className="text-lg font-extrabold text-gray-800">
                  Quotation Status
                </h3>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                  Active vs Won vs Lost
                </p>
              </div>
              <div className="h-[200px] flex items-center justify-center mt-auto">
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

            {/* Recent Leads (Last 3) */}
            <div
              className="lg:col-span-12 bg-gradient-to-br from-white to-orange-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
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
                  className="text-[10px] text-orange-600 hover:text-white bg-orange-50 hover:bg-orange-500 px-3 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider"
                >
                  View All Leads
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {safeLeads.slice(0, 3).map((lead, idx) => (
                  <div
                    key={idx}
                    className="bg-white/60 backdrop-blur-sm border border-orange-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <UserPlus size={40} className="text-orange-500" />
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm mb-1 truncate pr-8">
                      {lead.lead_title || "Untitled Lead"}
                    </h4>
                    <p className="text-orange-600 text-xs font-bold mb-3">
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
                    <div className="mt-4 pt-3 border-t border-orange-50 flex justify-between items-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${lead.status === "Won"
                            ? "bg-green-100 text-green-700"
                            : lead.status === "Lost"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                      >
                        {lead.status}
                      </span>
                      <button
                        onClick={() =>
                          router.push(`/sales/lead?id=${lead.lead_id}`)
                        }
                        className="text-[10px] font-bold text-gray-400 hover:text-orange-500 transition-colors"
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
      </main>
    </div>
  );
}
