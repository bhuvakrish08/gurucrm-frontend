"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Header from "@/app/components/header";
import axios from "redaxios";
import { getCache, setCache, fetchWithRetry } from "@/utils/slowNetworkHelper";
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
  CalendarClock,
  PhoneCall,
  FileText,
  AlertCircle,
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

// ===================================================
// Lightweight count-up animation for stat numbers.
// Purely presentational — renders the same value the
// caller passes in, just eases it in visually.
// ===================================================
function AnimatedNumber({ value, duration = 900, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const numeric =
      typeof value === "number"
        ? value
        : parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;

    let startTime = null;
    let frameId;

    const step = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(numeric * eased);
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplay(numeric);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  const rounded = Math.round(display);
  return (
    <>
      {prefix}
      {rounded.toLocaleString("en-IN")}
      {suffix}
    </>
  );
}
function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendLabel = "this month",
  colorClass,
  onClick,
  bgClass = "",
  glowClass = "",
  titleHoverClass = "",
  sparklineColor = "text-blue-500",
  sparklineId = "card",
  animationDelay = "0s",
}) {
  const uid = String(sparklineId).replace(/[^a-zA-Z0-9]/g, "-");

  return (
    <div
      onClick={onClick}
      style={{ "--card-delay": animationDelay }}
      className="dcard bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.14)] hover:border-slate-300/80 hover:-translate-y-1 flex flex-col transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] cursor-pointer group relative overflow-hidden"
    >
      {/* soft radial glow on hover */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-current opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-[0.07] ${sparklineColor}" />

      {/* shine sweep */}
      <div className="dcard-shine pointer-events-none absolute inset-0 z-20" />

      {/* Top: icon + title + value */}
      <div className="flex items-start gap-3 p-4 pb-2 relative z-10">
        <div
          className={`dcard-icon shrink-0 p-2.5 rounded-xl shadow-sm transition-all duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-lg ${colorClass}`}
        >
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3
            className={`text-slate-400 text-[9px] font-bold tracking-widest uppercase mb-1 truncate transition-colors duration-300 group-hover:text-slate-600 ${titleHoverClass}`}
          >
            {title}
          </h3>
          <h2 className="dcard-value text-2xl font-extrabold text-slate-900 tracking-tight leading-none transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.06] origin-left">
            {value}
          </h2>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 pb-4 relative z-10"></div>

      {/* Full-width sparkline at the bottom */}
      <div className={`w-full h-[52px] mt-auto ${sparklineColor}`}>
        <svg
          viewBox="0 0 200 52"
          className="w-full h-full block overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`sparkFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.30" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`sparkMask-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="45%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </linearGradient>

            <mask id={`sparkHalf-${uid}`}>
              <rect
                x="0"
                y="0"
                width="200"
                height="52"
                fill={`url(#sparkMask-${uid})`}
              />
            </mask>
          </defs>

          {/* filled area under the curve */}
          <path
            className="dcard-area"
            d="M 90 42 L 98 38 L 106 40 L 114 32 L 122 36 
               L 130 26 L 138 30 L 146 20 L 154 24 L 160 14 
               L 168 18 L 176 10 L 182 12 L 188 4 
               L 188 52 L 90 52 Z"
            fill={`url(#sparkFill-${uid})`}
            mask={`url(#sparkHalf-${uid})`}
            stroke="none"
          />

          {/* the line itself */}
          <path
            className="dcard-line"
            d="M 90 42 L 98 38 L 106 40 L 114 32 L 122 36 
               L 130 26 L 138 30 L 146 20 L 154 24 L 160 14 
               L 168 18 L 176 10 L 182 12 L 188 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />

          {/* end dot + pulse */}
          <circle
            className="dcard-dot-pulse"
            cx="188"
            cy="4"
            r="3"
            fill="currentColor"
          />
          <circle
            className="dcard-dot"
            cx="188"
            cy="4"
            r="2.5"
            fill="currentColor"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}

// ===================================================
// FOLLOW-UPS WIDGET (Leads + Quotations, next 2 days)
// ===================================================
function FollowUpsWidget({ followUps, loadingFollowUps, router }) {
  const [activeTab, setActiveTab] = useState("today");

  const tabs = [
    { key: "today", label: "Today", count: followUps.today.length },
    { key: "tomorrow", label: "Tomorrow", count: followUps.tomorrow.length },
    { key: "day_after", label: "Day After", count: followUps.day_after.length },
  ];

  const activeList = followUps[activeTab] || [];

  const getStatusBadge = (item) => {
    const status = item.type === "lead" ? item.status : item.quotation_status;
    const st = (status || "Pending").toString();
    const stLower = st.toLowerCase();
    const cls =
      stLower === "won" || stLower === "approved"
        ? "bg-green-100 text-green-700"
        : stLower === "lost" || stLower === "declined"
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700";
    return (
      <span
        className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${cls}`}
      >
        {st}
      </span>
    );
  };

  const handleItemClick = (item) => {
    if (item.type === "lead") {
      router.push(`/sales/lead?id=${item.lead_id}`);
    } else {
      router.push(`/sales/quotation?id=${item.quotation_id}`);
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-white to-orange-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 border border-slate-100 p-4 mb-5 animate-fade-in-up h-full"
      style={{ animationDelay: "0.05s" }}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-500 border border-orange-100/50 shadow-sm">
            <CalendarClock className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[13px] font-extrabold text-gray-800 leading-tight">
              Upcoming Follow-Ups
            </h3>
            <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">
              Leads &amp; Estimations — next 2 days
            </p>
          </div>
        </div>
        <div className="flex space-x-1 bg-gray-50 p-0.5 rounded-lg border border-gray-100 self-start sm:self-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-2.5 py-1 p1-1 text-[12px] rounded-md font-bold transition-all duration-200 flex items-center gap-1 ${
                activeTab === tab.key
                  ? "bg-blue-100 text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full text-[8px] font-black ${
                    activeTab === tab.key
                      ? "bg-blue-200 text-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loadingFollowUps ? (
        <div className="py-8 text-center">
          <span className="text-gray-400 text-xs font-semibold animate-pulse">
            Loading follow-ups...
          </span>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto max-h-[204px] pr-1 custom-scrollbar">
          {activeList.map((item, idx) => (
            <div
              key={`${item.type}-${item.type === "lead" ? item.lead_id : item.quotation_id}-${idx}`}
              onClick={() => handleItemClick(item)}
              className="bg-white/80 backdrop-blur-sm border border-slate-100 px-2.5 py-2 rounded-lg shadow-sm hover:shadow-md hover:border-orange-100 transition-all cursor-pointer group flex items-center justify-between gap-2 animate-fade-in"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={`shrink-0 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${
                    item.type === "lead"
                      ? "bg-indigo-100 text-indigo-600 border border-indigo-200/50"
                      : "bg-emerald-100 text-emerald-600 border border-emerald-200/50"
                  }`}
                >
                  {item.type === "lead" ? (
                    <PhoneCall size={8} />
                  ) : (
                    <FileText size={8} />
                  )}
                  {item.type === "lead" ? "Lead" : "Quot."}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-800 text-[11px] truncate group-hover:text-orange-600 transition-colors leading-tight">
                    {item.company_name || "Untitled"}
                  </h4>
                  <p className="text-gray-400 text-[9px] font-semibold truncate leading-tight">
                    {item.customer_name}
                    {item.type === "quotation" && item.quotation_no
                      ? ` • ${item.quotation_no}`
                      : ""}
                    {item.assignee ? ` • ${item.assignee}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-1 text-[9px] font-bold text-blue-500">
                  <Clock size={9} />
                  {item.follow_up_date
                    ? new Date(item.follow_up_date).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )
                    : ""}
                </span>
                {getStatusBadge(item)}
              </div>
            </div>
          ))}
          {activeList.length === 0 && (
            <div className="py-8 text-center bg-white/40 rounded-xl border border-dashed border-gray-200">
              <AlertCircle className="mx-auto mb-1.5 text-gray-300" size={18} />
              <p className="text-gray-400 text-[10px] font-semibold">
                No follow-ups scheduled for this day
              </p>
            </div>
          )}
        </div>
      )}
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
  const [followUps, setFollowUps] = useState({
    today: [],
    tomorrow: [],
    day_after: [],
  });
  const [loadingFollowUps, setLoadingFollowUps] = useState(true);

  useAuth();

  // Fetch dashboard data with retries, timeouts, and progressive caching for extreme slow networks
  const fetchData = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };

      const fetchLeadsTask = fetchWithRetry(`${API_BASE}/api/lead/read?limit=50`, config)
        .then((res) => {
          const resData = Array.isArray(res.data?.result) ? res.data.result : [];
          setLeads(resData);
          setCache("leads", resData);
        })
        .catch(() => {});

      const fetchCustomersTask = fetchWithRetry(
        `${API_BASE}/api/customers/get-customers?limit=50`,
        config
      )
        .then((res) => {
          const resData = Array.isArray(res.data?.data) ? res.data.data : [];
          setCustomers(resData);
          setCache("customers", resData);
        })
        .catch(() => {});

      const fetchTasksTask = fetchWithRetry(`${API_BASE}/api/tasks/read?limit=50`, config)
        .then((res) => {
          const raw = res.data?.result || res.data?.data || res.data;
          const resData = Array.isArray(raw) ? raw : [];
          setTasks(resData);
          setCache("tasks", resData);
        })
        .catch(() => {});

      const fetchTodosTask = fetchWithRetry(`${API_BASE}/api/todos/read`, config)
        .then((res) => {
          const raw = res.data?.result || res.data?.data || res.data;
          const resData = Array.isArray(raw) ? raw : [];
          setTodos(resData);
          setCache("todos", resData);
        })
        .catch(() => {});

      const fetchQuotationsTask = fetchWithRetry(
        `${API_BASE}/api/quotation/read?limit=50`,
        config
      )
        .then((res) => {
          let fetchedQuotations =
            res.data?.result || res.data?.data || res.data;
          if (!Array.isArray(fetchedQuotations)) {
            fetchedQuotations = [];
          }
          const userRole = localStorage.getItem("role") || "";
          const userFirstName = (localStorage.getItem("username") || "")
            .split(" ")[0]
            .toLowerCase();
          if (userRole.toLowerCase() === "sales") {
            fetchedQuotations = fetchedQuotations.filter((q) => {
              const qAssignees = q.assignee
                ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
                : [];
              const lAssignees = q.lead_assignee
                ? q.lead_assignee
                    .split(",")
                    .map((name) => name.trim().toLowerCase())
                : [];
              const hasBeenAssigned =
                qAssignees.some((name) => name.includes(userFirstName)) ||
                lAssignees.some((name) => name.includes(userFirstName));

              let inLog = false;
              if (q.assignee_log) {
                try {
                  const logs = JSON.parse(q.assignee_log);
                  inLog = logs.some(
                    (log) =>
                      (log.previous_assignee &&
                        log.previous_assignee
                          .toLowerCase()
                          .includes(userFirstName)) ||
                      (log.new_assignee &&
                        log.new_assignee.toLowerCase().includes(userFirstName)),
                  );
                } catch {}
              }
              return hasBeenAssigned || inLog;
            });
          } else if (userRole.toLowerCase() === "estimation") {
            fetchedQuotations = fetchedQuotations.filter((q) => {
              const qAssignees = q.assignee
                ? q.assignee.split(",").map((name) => name.trim().toLowerCase())
                : [];
              const lAssignees = q.lead_assignee
                ? q.lead_assignee
                    .split(",")
                    .map((name) => name.trim().toLowerCase())
                : [];

              const matchesQuotation = qAssignees.some((name) =>
                name.includes(userFirstName),
              );
              const matchesLead = lAssignees.some((name) =>
                name.includes(userFirstName),
              );

              if (qAssignees.length === 0) {
                return matchesLead;
              }
              return matchesQuotation;
            });
          }
          setQuotations(fetchedQuotations);
          setCache("quotations", fetchedQuotations);
        })
        .catch(() => {});

      const fetchPiTask = fetchWithRetry(`${API_BASE}/api/pi/list`, config)
        .then((res) => {
          let fetchedPis = res.data?.data || res.data?.result || res.data;
          if (!Array.isArray(fetchedPis)) {
            fetchedPis = [];
          }
          const userRole = localStorage.getItem("role") || "";
          const userFirstName = (localStorage.getItem("username") || "")
            .split(" ")[0]
            .toLowerCase();
          if (userRole.toLowerCase() === "proforma invoices") {
            fetchedPis = fetchedPis.filter((pi) => {
              const piAssignees = pi.assignee
                ? pi.assignee.split(",").map((name) => name.trim().toLowerCase())
                : [];
              return piAssignees.some((name) => name.includes(userFirstName));
            });
          }
          setPis(fetchedPis);
          setCache("pis", fetchedPis);
        })
        .catch(() => {});

      const fetchContractsTask = fetchWithRetry(
        `${API_BASE}/api/contract-types/read`,
        config
      )
        .then((res) => {
          const raw = res.data?.data || res.data;
          const resData = Array.isArray(raw) ? raw : [];
          setContracts(resData);
          setCache("contracts", resData);
        })
        .catch(() => {});

      const fetchProductsTask = fetchWithRetry(
        `${API_BASE}/api/product-master/read`,
        config
      )
        .then((res) => {
          const raw = res.data?.data || res.data;
          const resData = Array.isArray(raw) ? raw : [];
          setProducts(resData);
          setCache("products", resData);
        })
        .catch(() => {});

      const fetchTrafficLightTask = fetchWithRetry(
        `${API_BASE}/api/lead/analytics/traffic-light`,
        config
      )
        .then((res) => {
          const raw = res.data?.result || [];
          const resData = Array.isArray(raw) ? raw : [];
          setTrafficLightStats(resData);
          setCache("trafficLightStats", resData);
        })
        .catch(() => {});

      const fetchFollowUpsTask = Promise.allSettled([
        fetchWithRetry(`${API_BASE}/api/followup/lead-follow-up/upcoming`, config).catch(() => ({ data: { today: [], tomorrow: [], day_after: [] } })),
        fetchWithRetry(`${API_BASE}/api/followup/quotation/upcoming-followups`, config).catch(() => ({ data: { today: [], tomorrow: [], day_after: [] } })),
      ]).then(([leadRes, quoteRes]) => {
        const leadFU = (leadRes.status === "fulfilled" && leadRes.value?.data) || {};
        const quoteFU = (quoteRes.status === "fulfilled" && quoteRes.value?.data) || {};

        const mergeBucket = (leadArr = [], quoteArr = []) => {
          const leadItems = (Array.isArray(leadArr) ? leadArr : []).map(
            (item) => ({
              ...item,
              type: "lead",
            }),
          );
          const quoteItems = (Array.isArray(quoteArr) ? quoteArr : []).map(
            (item) => ({
              ...item,
              type: "quotation",
            }),
          );
          return [...leadItems, ...quoteItems].sort(
            (a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date),
          );
        };

        const updatedFollowups = {
          today: mergeBucket(leadFU.today, quoteFU.today),
          tomorrow: mergeBucket(leadFU.tomorrow, quoteFU.tomorrow),
          day_after: mergeBucket(leadFU.day_after, quoteFU.day_after),
        };
        setFollowUps(updatedFollowups);
        setCache("followUps", updatedFollowups);
        setLoadingFollowUps(false);
      });

      await Promise.allSettled([
        fetchLeadsTask,
        fetchCustomersTask,
        fetchTasksTask,
        fetchTodosTask,
        fetchQuotationsTask,
        fetchPiTask,
        fetchContractsTask,
        fetchProductsTask,
        fetchTrafficLightTask,
        fetchFollowUpsTask,
      ]);
    } catch (error) {
      console.error("Dashboard Data Fetch Error:", error);
    } finally {
      setLoading(false);
      setLoadingFollowUps(false);
    }
  }, []);

  useEffect(() => {
    // 1. Instant hydration from LocalStorage cache (0ms render on slow internet)
    const cachedLeads = getCache("leads");
    const cachedCustomers = getCache("customers");
    const cachedTasks = getCache("tasks");
    const cachedTodos = getCache("todos");
    const cachedQuotations = getCache("quotations");
    const cachedPis = getCache("pis");
    const cachedContracts = getCache("contracts");
    const cachedProducts = getCache("products");
    const cachedTrafficLight = getCache("trafficLightStats");
    const cachedFollowUps = getCache("followUps");

    let hasCached = false;
    if (cachedLeads) { setLeads(cachedLeads); hasCached = true; }
    if (cachedCustomers) { setCustomers(cachedCustomers); hasCached = true; }
    if (cachedTasks) { setTasks(cachedTasks); hasCached = true; }
    if (cachedTodos) { setTodos(cachedTodos); hasCached = true; }
    if (cachedQuotations) { setQuotations(cachedQuotations); hasCached = true; }
    if (cachedPis) { setPis(cachedPis); hasCached = true; }
    if (cachedContracts) { setContracts(cachedContracts); hasCached = true; }
    if (cachedProducts) { setProducts(cachedProducts); hasCached = true; }
    if (cachedTrafficLight) { setTrafficLightStats(cachedTrafficLight); hasCached = true; }
    if (cachedFollowUps) { setFollowUps(cachedFollowUps); setLoadingFollowUps(false); }

    if (hasCached) {
      setLoading(false);
    }

    // 2. Background revalidation
    fetchData();
    setRole(localStorage.getItem("role") || "");

    // Refresh every 5 minutes if online and tab is active
    const interval = setInterval(() => {
      if (!document.hidden && navigator.onLine !== false) {
        fetchData();
      }
    }, 5 * 60 * 1000);

    const handleOnline = () => {
      fetchData();
    };

    window.addEventListener("online", handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchData]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    const titleToSave = newTodoTitle;
    setNewTodoTitle("");
    setAddingTodo(true);

    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };

      if (editingTodoId) {
        // Optimistic Edit
        const previousTodos = [...todos];
        const updatedTodos = todos.map((todo) =>
          todo.id === editingTodoId
            ? { ...todo, title: titleToSave, description: titleToSave }
            : todo
        );
        setTodos(updatedTodos);
        setCache("todos", updatedTodos);
        setEditingTodoId(null);
        toast.success("To-do updated!");

        try {
          await axios.put(
            `${API_BASE}/api/todos/update/${editingTodoId}`,
            { title: titleToSave },
            config,
          );
        } catch (err) {
          console.error(err);
          setTodos(previousTodos);
          setCache("todos", previousTodos);
          toast.error("Failed to update to-do");
        }
      } else {
        // Optimistic Add
        const tempId = `temp_${Date.now()}`;
        const newTodoObj = {
          id: tempId,
          title: titleToSave,
          description: titleToSave,
          is_finished: 0,
          created_at: new Date().toISOString(),
        };
        const previousTodos = [...todos];
        const updatedTodos = [newTodoObj, ...todos];
        setTodos(updatedTodos);
        setCache("todos", updatedTodos);
        toast.success("To-do added successfully!");

        try {
          const res = await axios.post(
            `${API_BASE}/api/todos/insert`,
            { title: titleToSave },
            config,
          );
          if (res.data) {
            const finalTodos = updatedTodos.map((todo) =>
              todo.id === tempId
                ? { ...res.data, created_at: new Date().toISOString() }
                : todo
            );
            setTodos(finalTodos);
            setCache("todos", finalTodos);
          }
        } catch (err) {
          console.error(err);
          setTodos(previousTodos);
          setCache("todos", previousTodos);
          toast.error("Failed to add to-do");
        }
      }
    } finally {
      setAddingTodo(false);
    }
  };

  const startEditTodo = (todo) => {
    setEditingTodoId(todo.id);
    setNewTodoTitle(todo.title || todo.description || "");
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

    // Optimistic Delete
    const previousTodos = [...todos];
    const updatedTodos = todos.filter((t) => t.id !== id);
    setTodos(updatedTodos);
    setCache("todos", updatedTodos);
    toast.success("Task deleted");

    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      await axios.delete(`${API_BASE}/api/todos/delete/${id}`, config);
    } catch (err) {
      console.error("Error deleting todo:", err);
      setTodos(previousTodos);
      setCache("todos", previousTodos);
      toast.error("Failed to delete task");
    }
  };

  const handleToggleTodo = async (id) => {
    // Optimistic Toggle
    const previousTodos = [...todos];
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, is_finished: !todo.is_finished } : todo,
    );
    setTodos(updatedTodos);
    setCache("todos", updatedTodos);
    toast.success("Task updated!");

    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      await axios.put(`${API_BASE}/api/todos/finish/${id}`, {}, config);
    } catch (err) {
      console.error(err);
      setTodos(previousTodos);
      setCache("todos", previousTodos);
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
      const dateStr =
        q.created_at || q.quotation_date || q.quotation_created_at;
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
      const isCompleted =
        (pi.status || "").toLowerCase() === "paid" ||
        (pi.stage || "").toLowerCase() === "completed";
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
      const isCompleted =
        (pi.status || "").toLowerCase() === "paid" ||
        (pi.stage || "").toLowerCase() === "completed";
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
        d.setDate(now.getDate() - i * 7);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const label = `Wk ${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        periods.push({
          name: label,
          amount: 0,
          count: 0,
          timestamp: startOfWeek.getTime(),
        });
      }
    } else if (salesTimeframe === "monthly") {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        periods.push({
          name: label,
          amount: 0,
          count: 0,
          timestamp: d.getTime(),
        });
      }
    } else {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear() - i, 0, 1);
        const label = d.getFullYear().toString();
        periods.push({
          name: label,
          amount: 0,
          count: 0,
          timestamp: d.getTime(),
        });
      }
    }

    const rawData = isCompletedData
      ? processCompletedProformaData()
      : processPendingProformaData();

    periods.forEach((p) => {
      const match = rawData.find((r) => r.name === p.name);
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
  const completedTotal = completedData.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  const getInvoiceProgressDetails = (isCompletedData = false) => {
    const safePis = Array.isArray(pis) ? pis : [];
    let totalPaid = 0;
    let totalValue = 0;
    let count = 0;

    safePis.forEach((pi) => {
      const status = (pi.status || "").toLowerCase();
      const stage = (pi.stage || "").toLowerCase();

      const grandTotal = getPiGrandTotal(pi);
      const paid = Number(pi.total || 0);
      const isFullyPaid = grandTotal > 0 && paid >= grandTotal;

      // Completed = explicitly moved to "completed" stage, marked paid,
      // OR fully paid via follow-ups (100% collected) — covers drafts too,
      // since a draft with 0% paid is simply "not completed" -> falls into Pending.
      const isCompleted =
        stage === "completed" || status === "paid" || isFullyPaid;

      if (isCompletedData !== isCompleted) return;

      totalValue += grandTotal;
      totalPaid += paid;
      count += 1;
    });

    const remaining = Math.max(0, totalValue - totalPaid);
    const percentage =
      totalValue > 0 ? Math.round((totalPaid / totalValue) * 100) : 0;

    return { totalValue, totalPaid, remaining, percentage, count };
  };

  const pendingProgress = getInvoiceProgressDetails(false);
  const completedProgress = getInvoiceProgressDetails(true);

  const processLeadsTrend = () => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const trendMap = {};
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

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
      } catch (e) {}
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

    const colors = [
      "#f97316",
      "#fbbf24",
      "#ea580c",
      "#fb923c",
      "#fde047",
      "#f97316",
    ];
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
        /* ── Card entrance ───────────────────────────── */
        @keyframes dcardIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .dcard {
          opacity: 0;
          animation: dcardIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--card-delay, 0s);
        }
        /* keep hover lift working after entrance */
        .dcard:hover {
          animation: none;
          opacity: 1;
        }

        /* ── Shine sweep on hover ────────────────────── */
        .dcard-shine {
          background: linear-gradient(
            110deg,
            transparent 25%,
            rgba(255, 255, 255, 0.55) 48%,
            transparent 62%
          );
          transform: translateX(-120%);
          opacity: 0;
        }
        .group:hover .dcard-shine {
          animation: dcardShine 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes dcardShine {
          0% {
            transform: translateX(-120%);
            opacity: 1;
          }
          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }

        /* ── Sparkline draw-in ───────────────────────── */
        @keyframes dcardDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
        .dcard-line {
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          animation: dcardDraw 1.4s cubic-bezier(0.65, 0, 0.35, 1) forwards;
          animation-delay: calc(var(--card-delay, 0s) + 0.25s);
        }

        @keyframes dcardAreaIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dcard-area {
          opacity: 0;
          transform-origin: bottom;
          animation: dcardAreaIn 0.8s ease-out forwards;
          animation-delay: calc(var(--card-delay, 0s) + 0.9s);
        }

        /* ── End dot ─────────────────────────────────── */
        @keyframes dcardDotIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .dcard-dot {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: dcardDotIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: calc(var(--card-delay, 0s) + 1.5s);
        }

        @keyframes dcardPulse {
          0% {
            opacity: 0.5;
            transform: scale(1);
          }
          70%,
          100% {
            opacity: 0;
            transform: scale(2.6);
          }
        }
        .dcard-dot-pulse {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: dcardPulse 2s ease-out infinite;
          animation-delay: calc(var(--card-delay, 0s) + 1.7s);
        }

        /* ── Accessibility ───────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .dcard,
          .dcard-line,
          .dcard-area,
          .dcard-dot,
          .dcard-dot-pulse,
          .dcard-shine {
            animation: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
            transform: none !important;
          }
          .dcard:hover {
            transform: none !important;
          }
        }

        /* line + area soft reveal */
        @keyframes salesReveal {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        :global(.sales-line) {
          animation: salesReveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
        }

        /* active dot gentle pop */
        @keyframes dotPop {
          from {
            transform: scale(0.6);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        :global(.sales-active-dot) {
          transform-box: fill-box;
          transform-origin: center;
          animation: dotPop 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.sales-line),
          :global(.sales-active-dot) {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        /* ── Stat rows stagger in ───────────────────── */
        @keyframes statIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .stat-row {
          opacity: 0;
          animation: statIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--stat-delay, 0s);
        }

        /* ── Mini bar fills left → right ────────────── */
        @keyframes barFill {
          from {
            width: 0%;
          }
          to {
            width: var(--stat-w, 0%);
          }
        }
        .stat-bar {
          width: 0%;
          animation: barFill 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: calc(var(--stat-delay, 0s) + 0.25s);
        }

        @media (prefers-reduced-motion: reduce) {
          .stat-row,
          .stat-bar {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            width: var(--stat-w, 0%) !important;
          }
        }

        /* ── Center total ───────────────────────────── */
        @keyframes eTotalIn {
          from {
            opacity: 0;
            transform: scale(0.82);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .edonut-total {
          opacity: 0;
          animation: eTotalIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards;
        }
        .edonut-total-label {
          opacity: 0;
          animation: eTotalIn 0.5s ease-out 1.15s forwards;
        }

        /* ── Donut fade + scale in ──────────────────── */
        @keyframes eDonutIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        :global(.edonut-pie) {
          transform-box: fill-box;
          transform-origin: center;
          animation: eDonutIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
        }

        /* ── Segment hover ──────────────────────────── */
        :global(.edonut-cell) {
          transform-box: fill-box;
          transform-origin: center;
          transition:
            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.25s ease;
          cursor: pointer;
        }
        :global(.edonut-cell:hover) {
          transform: scale(1.06);
        }
        .estimation-dist-card
          :global(.recharts-pie:hover .edonut-cell:not(:hover)) {
          opacity: 0.45;
        }

        /* ── Whole donut breathes on card hover ─────── */
        .estimation-dist-card :global(.recharts-pie) {
          transform-box: fill-box;
          transform-origin: center;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .estimation-dist-card:hover :global(.recharts-pie) {
          transform: scale(1.03);
        }

        /* ── Stat rows stagger in ───────────────────── */
        @keyframes eStatIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .estat-row {
          opacity: 0;
          animation: eStatIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--estat-delay, 0s);
        }

        /* ── Mini bar fill ──────────────────────────── */
        @keyframes eBarFill {
          from {
            width: 0%;
          }
          to {
            width: var(--estat-w, 0%);
          }
        }
        .estat-bar {
          width: 0%;
          animation: eBarFill 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: calc(var(--estat-delay, 0s) + 0.25s);
        }

        /* ── Accessibility ──────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .edonut-total,
          .edonut-total-label,
          .estat-row,
          .estat-bar,
          :global(.edonut-pie),
          :global(.edonut-cell),
          .estimation-dist-card :global(.recharts-pie) {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .estat-bar {
            width: var(--estat-w, 0%) !important;
          }
        }

        /* ── Center total ───────────────────────────── */
        @keyframes qTotalIn {
          from {
            opacity: 0;
            transform: scale(0.82);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .qdonut-total {
          opacity: 0;
          animation: qTotalIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards;
        }
        .qdonut-total-label {
          opacity: 0;
          animation: qTotalIn 0.5s ease-out 1.15s forwards;
        }

        /* ── Donut fade + scale in ──────────────────── */
        @keyframes qDonutIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        :global(.qdonut-pie) {
          transform-box: fill-box;
          transform-origin: center;
          animation: qDonutIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
        }

        /* ── Segment hover ──────────────────────────── */
        :global(.qdonut-cell) {
          transform-box: fill-box;
          transform-origin: center;
          transition:
            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.25s ease;
          cursor: pointer;
        }
        :global(.qdonut-cell:hover) {
          transform: scale(1.06);
        }
        .quotation-status-card
          :global(.recharts-pie:hover .qdonut-cell:not(:hover)) {
          opacity: 0.45;
        }

        /* ── Whole donut breathes on card hover ─────── */
        .quotation-status-card :global(.recharts-pie) {
          transform-box: fill-box;
          transform-origin: center;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .quotation-status-card:hover :global(.recharts-pie) {
          transform: scale(1.03);
        }

        /* ── Stat rows stagger in ───────────────────── */
        @keyframes qStatIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .qstat-row {
          opacity: 0;
          animation: qStatIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: var(--qstat-delay, 0s);
        }

        /* ── Mini bar fill ──────────────────────────── */
        @keyframes qBarFill {
          from {
            width: 0%;
          }
          to {
            width: var(--qstat-w, 0%);
          }
        }
        .qstat-bar {
          width: 0%;
          animation: qBarFill 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: calc(var(--qstat-delay, 0s) + 0.25s);
        }

        /* ── Accessibility ──────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .qdonut-total,
          .qdonut-total-label,
          .qstat-row,
          .qstat-bar,
          :global(.qdonut-pie),
          :global(.qdonut-cell),
          .quotation-status-card :global(.recharts-pie) {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .qstat-bar {
            width: var(--qstat-w, 0%) !important;
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
        ) : role === "Estimation" ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="dc-wrap" style={{ "--dc-delay": "0s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/quotation")}
                title="Total Estimations"
                value={quotations.length}
                icon={Activity}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.05s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/quotation")}
                title="Pending Estimations"
                value={
                  quotations.filter((q) => {
                    const st = (q.quotation_status || "").toLowerCase();
                    return st !== "won" && st !== "approved" && st !== "lost";
                  }).length
                }
                icon={Clock}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.05s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.1s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/quotation")}
                title="Approved Estimations"
                value={
                  quotations.filter((q) => {
                    const st = (q.quotation_status || "").toLowerCase();
                    return st === "won" || st === "approved";
                  }).length
                }
                icon={CheckCircle2}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.1s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.15s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/quotation")}
                title="Lost Estimations"
                value={
                  quotations.filter(
                    (q) => (q.quotation_status || "").toLowerCase() === "lost",
                  ).length
                }
                icon={Trash2}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.15s"
              />
            </div>
          </div>
        ) : role === "Sales" ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="dc-wrap" style={{ "--dc-delay": "0s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/lead")}
                title="Total Leads"
                value={leads.length}
                icon={UserPlus}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.05s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/lead")}
                title="Won Leads"
                value={leads.filter((l) => l.status === "Won").length}
                icon={CheckCircle2}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.05s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.1s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/quotation")}
                title="Total Estimations"
                value={quotations.length}
                icon={Activity}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.1s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.15s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/quotation")}
                title="Approved Estimations"
                value={
                  quotations.filter((q) => {
                    const st = (q.quotation_status || "").toLowerCase();
                    return st === "won" || st === "approved";
                  }).length
                }
                icon={TrendingUp}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.15s"
              />
            </div>
          </div>
        ) : role === "Leads Management" ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="dc-wrap" style={{ "--dc-delay": "0s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/lead")}
                title="Total Leads"
                value={leads.length}
                icon={UserPlus}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.05s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/lead")}
                title="Pending Leads"
                value={
                  leads.filter((l) => l.status !== "Won" && l.status !== "Lost")
                    .length
                }
                icon={Clock}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.05s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.1s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/lead")}
                title="Won Leads"
                value={leads.filter((l) => l.status === "Won").length}
                icon={CheckCircle2}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.1s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.15s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/lead")}
                title="Lost Leads"
                value={leads.filter((l) => l.status === "Lost").length}
                icon={Trash2}
                colorClass="bg-orange-50 text-orange-500 border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white"
                animationDelay="0.15s"
              />
            </div>
          </div>
        ) : role === "Proforma invoices" ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="dc-wrap" style={{ "--dc-delay": "0s" }}>
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
                animationDelay="0s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.05s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/proforma")}
                title="Fully Paid / Completed"
                value={
                  pis.filter(
                    (pi) =>
                      (pi.status || "").toLowerCase() === "paid" ||
                      (pi.stage || "").toLowerCase() === "completed",
                  ).length
                }
                icon={CheckCircle2}
                bgClass="from-white to-emerald-50/40 hover:to-emerald-50/80"
                glowClass="bg-emerald-100/50"
                titleHoverClass="group-hover:text-emerald-600"
                colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100/50 group-hover:bg-emerald-600 group-hover:text-white"
                sparklineColor="text-emerald-400"
                animationDelay="0.05s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.1s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/proforma")}
                title="Pending / Partial Collection"
                value={
                  pis.filter(
                    (pi) =>
                      (pi.status || "").toLowerCase() !== "paid" &&
                      (pi.stage || "").toLowerCase() !== "completed",
                  ).length
                }
                icon={Clock}
                bgClass="from-white to-blue-50/40 hover:to-blue-50/80"
                glowClass="bg-blue-100/50"
                titleHoverClass="group-hover:text-blue-600"
                colorClass="bg-blue-50 text-blue-600 border border-blue-100/50 group-hover:bg-blue-600 group-hover:text-white"
                sparklineColor="text-blue-400"
                animationDelay="0.1s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.15s" }}>
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
                animationDelay="0.15s"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="dc-wrap" style={{ "--dc-delay": "0s" }}>
              <DashboardCard
                onClick={() => router.push("/sales/lead")}
                title="Total Leads"
                value={<AnimatedNumber value={leads.length} />}
                icon={UserPlus}
                trend="up"
                trendValue="12.5%"
                colorClass="bg-blue-600 text-white"
                sparklineColor="text-blue-500"
                sparklineId="leads"
                animationDelay="0s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.05s" }}>
              <DashboardCard
                onClick={() => router.push("/customer-list")}
                title="Total Customers"
                value={<AnimatedNumber value={customers.length} />}
                icon={Users}
                trend="up"
                trendValue="5.2%"
                colorClass="bg-violet-600 text-white"
                sparklineColor="text-violet-500"
                sparklineId="customers"
                animationDelay="0.05s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.1s" }}>
              <DashboardCard
                onClick={() => router.push("/tasks")}
                title="Total Tasks"
                value={<AnimatedNumber value={tasks.length} />}
                icon={CheckSquare}
                colorClass="bg-emerald-600 text-white"
                sparklineColor="text-emerald-500"
                sparklineId="tasks"
                animationDelay="0.1s"
              />
            </div>
            <div className="dc-wrap" style={{ "--dc-delay": "0.15s" }}>
              <DashboardCard
                onClick={() => router.push("/todolist")}
                title="Active To-Dos"
                value={
                  <AnimatedNumber
                    value={todos.filter((t) => !t.is_finished).length}
                  />
                }
                icon={ListTodo}
                colorClass="bg-rose-500 text-white"
                sparklineColor="text-rose-500"
                sparklineId="todos"
                animationDelay="0.15s"
              />
            </div>
          </div>
        )}
        {/* Upcoming Follow-Ups (Leads + Estimations) — visible for every role except the default view, where it's merged into the Sales Overview row below */}
        {!loading &&
          (role === "Leads Management" ||
            role === "Estimation" ||
            role === "Sales" ||
            role === "Proforma invoices") && (
            <FollowUpsWidget
              followUps={followUps}
              loadingFollowUps={loadingFollowUps}
              router={router}
            />
          )}

        {/* Dashboard Analytics & Widgets */}
        {!loading && role === "Leads Management" && (
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

            {/* Lead Status Donut Chart (Span 4) */}
            <div
              className="quotation-status-card lg:col-span-4 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] border border-slate-200/70 p-5 flex flex-col relative overflow-hidden group animate-fade-in-up"
              style={{ animationDelay: "0.25s" }}
            >
              {/* subtle radial glow on hover */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-400/[0.07] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Header */}
              <div className="mb-1 relative z-10">
                <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                  Quotation Status
                </h3>
                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-[0.12em]">
                  Active vs Won vs Lost
                </p>
              </div>

              {/* Donut + Stats side-by-side */}
              {(() => {
                const qData = quotationStatusData;
                const qTotal = qData.reduce((s, d) => s + (d.value || 0), 0);

                return (
                  <div className="flex items-center gap-4 mt-auto relative z-10">
                    {/* LEFT: Donut */}
                    <div className="h-[220px] flex-1 min-w-0 relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-5">
                        <span className="qdonut-total text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">
                          {qTotal}
                        </span>
                        <span className="qdonut-total-label text-[8px] font-bold text-slate-400 uppercase tracking-[0.14em] mt-1.5">
                          Total Quotes
                        </span>
                      </div>

                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            {qData.map((entry, i) => (
                              <filter
                                key={i}
                                id={`qDonutShadow-${i}`}
                                x="-50%"
                                y="-50%"
                                width="200%"
                                height="200%"
                              >
                                <feDropShadow
                                  dx="0"
                                  dy="3"
                                  stdDeviation="4"
                                  floodColor={entry.color}
                                  floodOpacity="0.28"
                                />
                              </filter>
                            ))}
                          </defs>

                          <Pie
                            className="qdonut-pie"
                            data={qData}
                            cx="50%"
                            cy="45%"
                            innerRadius={52}
                            outerRadius={78}
                            cornerRadius={6}
                            paddingAngle={3}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            animationDuration={1400}
                            animationEasing="ease-out"
                          >
                            {qData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="transparent"
                                filter={`url(#qDonutShadow-${index})`}
                                className="qdonut-cell"
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            contentStyle={{
                              borderRadius: "10px",
                              border: "1px solid #eef2f7",
                              boxShadow: "0 10px 30px -8px rgba(0,0,0,0.12)",
                              padding: "8px 10px",
                            }}
                            itemStyle={{ fontWeight: 800, fontSize: "12px" }}
                            labelStyle={{ display: "none" }}
                            animationDuration={200}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* RIGHT: Stats breakdown */}
                    <div className="w-[128px] shrink-0 flex flex-col gap-2 pr-1">
                      {qData.map((entry, i) => {
                        const pct = Math.round(
                          ((entry.value || 0) / (qTotal || 1)) * 100,
                        );
                        return (
                          <div
                            key={entry.name}
                            className="qstat-row group/stat rounded-lg px-2.5 py-2 border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] cursor-default"
                            style={{ "--qstat-delay": `${0.9 + i * 0.12}s` }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover/stat:scale-125"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.1em] truncate">
                                {entry.name}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between gap-1">
                              <span className="text-[17px] font-extrabold text-slate-900 leading-none tracking-tight">
                                {entry.value || 0}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {pct}%
                              </span>
                            </div>

                            <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="qstat-bar h-full rounded-full"
                                style={{
                                  backgroundColor: entry.color,
                                  "--qstat-w": `${pct}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Recent Leads List (Span 4) */}
            <div
              className="lg:col-span-4 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Recent Leads
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Your last 4 leads
                  </p>
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
                      <h4 className="font-bold text-gray-800 text-[11px] mb-0.5 truncate">
                        {lead.reference || "Untitled Lead"}
                      </h4>
                      <p className="text-blue-600 text-[9px] font-extrabold truncate">
                        {lead.company_name}
                      </p>
                      <div className="flex gap-2 text-[8px] text-gray-400 font-semibold mt-0.5">
                        <span className="truncate">{lead.customer_name}</span>
                        <span>•</span>
                        <span>
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${lead.status === "Won" ? "bg-green-100 text-green-700" : lead.status === "Lost" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {lead.status}
                      </span>
                      <button
                        onClick={() =>
                          router.push(`/sales/lead?id=${lead.lead_id}`)
                        }
                        className="text-[9px] font-bold text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        Details →
                      </button>
                    </div>
                  </div>
                ))}
                {safeLeads.length === 0 && (
                  <div className="py-8 text-center bg-white/40 rounded-xl border border-dashed border-gray-200 w-full">
                    <p className="text-gray-400 text-[10px] font-semibold">
                      No leads found yet
                    </p>
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
                        editingTodoId
                          ? "Update task..."
                          : "Quick add a new task..."
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
                      <p className="text-gray-400 text-xs text-center py-8">
                        No unfinished tasks
                      </p>
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
                      <p className="text-gray-400 text-xs text-center py-8">
                        No finished tasks yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && role === "Sales" && (
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
                className="estimation-dist-card lg:col-span-4 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] border border-slate-200/70 p-5 flex flex-col relative overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                {/* subtle radial glow on hover */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-amber-400/[0.07] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Header */}
                <div className="mb-1 relative z-10">
                  <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                    Estimation Distribution
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-[0.12em]">
                    Success vs Pending status
                  </p>
                </div>

                {/* Donut + Stats side-by-side */}
                {(() => {
                  const estData = processQuotationStatus();
                  const estTotal = estData.reduce(
                    (s, d) => s + (d.value || 0),
                    0,
                  );

                  return (
                    <div className="flex items-center gap-4 mt-auto relative z-10">
                      {/* LEFT: Donut */}
                      <div className="h-[220px] flex-1 min-w-0 relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-5">
                          <span className="edonut-total text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">
                            {estTotal}
                          </span>
                          <span className="edonut-total-label text-[8px] font-bold text-slate-400 uppercase tracking-[0.14em] mt-1.5">
                            Total Quotes
                          </span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              {estData.map((entry, i) => (
                                <filter
                                  key={i}
                                  id={`eDonutShadow-${i}`}
                                  x="-50%"
                                  y="-50%"
                                  width="200%"
                                  height="200%"
                                >
                                  <feDropShadow
                                    dx="0"
                                    dy="3"
                                    stdDeviation="4"
                                    floodColor={entry.color}
                                    floodOpacity="0.28"
                                  />
                                </filter>
                              ))}
                            </defs>

                            <Pie
                              className="edonut-pie"
                              data={estData}
                              cx="50%"
                              cy="45%"
                              innerRadius={52}
                              outerRadius={78}
                              cornerRadius={6}
                              paddingAngle={3}
                              startAngle={90}
                              endAngle={-270}
                              dataKey="value"
                              animationDuration={1400}
                              animationEasing="ease-out"
                            >
                              {estData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  stroke="transparent"
                                  filter={`url(#eDonutShadow-${index})`}
                                  className="edonut-cell"
                                />
                              ))}
                            </Pie>

                            <Tooltip
                              contentStyle={{
                                borderRadius: "10px",
                                border: "1px solid #eef2f7",
                                boxShadow: "0 10px 30px -8px rgba(0,0,0,0.12)",
                                padding: "8px 10px",
                              }}
                              itemStyle={{ fontWeight: 800, fontSize: "12px" }}
                              labelStyle={{ display: "none" }}
                              animationDuration={200}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* RIGHT: Stats breakdown */}
                      <div className="w-[128px] shrink-0 flex flex-col gap-2 pr-1">
                        {estData.map((entry, i) => {
                          const pct = Math.round(
                            ((entry.value || 0) / (estTotal || 1)) * 100,
                          );
                          return (
                            <div
                              key={entry.name}
                              className="estat-row group/stat rounded-lg px-2.5 py-2 border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] cursor-default"
                              style={{ "--estat-delay": `${0.9 + i * 0.12}s` }}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover/stat:scale-125"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.1em] truncate">
                                  {entry.name}
                                </span>
                              </div>

                              <div className="flex items-baseline justify-between gap-1">
                                <span className="text-[17px] font-extrabold text-slate-900 leading-none tracking-tight">
                                  {entry.value || 0}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {pct}%
                                </span>
                              </div>

                              <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className="estat-bar h-full rounded-full"
                                  style={{
                                    backgroundColor: entry.color,
                                    "--estat-w": `${pct}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
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
                    const safeQuotations = Array.isArray(quotations)
                      ? quotations
                      : [];

                    safeLeads.forEach((l) => {
                      activities.push({
                        id: `lead-${l.lead_id}`,
                        type: "Lead",
                        title: l.company_name || l.customer_name || "New Lead",
                        subtitle: l.reference || "No Reference",
                        date: l.created_at || l.updated_at,
                        status: l.status,
                      });
                    });

                    safeQuotations.forEach((q) => {
                      activities.push({
                        id: `quote-${q.latest_quotation_id || q.id}`,
                        type: "Estimation",
                        title:
                          q.company_name || q.customer_name || "New Quotation",
                        subtitle: q.quotation_no || "No Quote No.",
                        date: q.quotation_created_at || q.quotation_date,
                        status: q.quotation_status,
                        amount: q.grand_total || q.amount,
                      });
                    });

                    const sorted = activities
                      .filter((act) => act.date)
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 4);

                    if (sorted.length === 0) {
                      return (
                        <p className="text-gray-400 text-xs text-center py-10">
                          No recent activity
                        </p>
                      );
                    }

                    return sorted.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 hover:bg-white border border-slate-100 hover:border-indigo-100 transition-all duration-300 shadow-sm"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${
                                act.type === "Lead"
                                  ? "bg-indigo-100 text-indigo-600 border border-indigo-200/50"
                                  : "bg-emerald-100 text-emerald-600 border border-emerald-200/50"
                              }`}
                            >
                              {act.type}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              {act.date
                                ? new Date(act.date).toLocaleDateString(
                                    undefined,
                                    { month: "short", day: "numeric" },
                                  )
                                : ""}
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
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight mt-1 ${
                              act.status === "Won" || act.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : act.status === "Lost"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Estimation Performance Trend (Area Chart) (Span 7) */}
              <div
                className="lg:col-span-6 bg-gradient-to-br from-white to-indigo-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
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
                        <linearGradient
                          id="colorSalesApproved"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorSalesDraft"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f59e0b"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f59e0b"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
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
                          if (value >= 100000)
                            return `₹${(value / 100000).toFixed(1)}L`;
                          if (value >= 1000)
                            return `₹${(value / 1000).toFixed(0)}k`;
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
                        formatter={(value) => [
                          `₹${Math.round(value).toLocaleString("en-IN")}`,
                        ]}
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
                        wrapperStyle={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Todo split list (Span 5) */}
              <div
                className="lg:col-span-6 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
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
                          <Circle
                            size={8}
                            fill="#4f46e5"
                            stroke="transparent"
                          />
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
                          <p className="text-gray-400 text-xs text-center py-8">
                            All caught up!
                          </p>
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
                          <p className="text-gray-400 text-xs text-center py-8">
                            No completed tasks yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading &&
          role !== "Leads Management" &&
          role !== "Estimation" &&
          role !== "Sales" &&
          role !== "Proforma invoices" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-stretch">
              {" "}
              {/* ROW 1: Sales Overview + Upcoming Follow-Ups (8 / 4 split) */}
              {/* Sales Chart (Span 6) */}
              <div
                className="lg:col-span-6 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.10)] transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] border border-slate-200/70 p-5 flex flex-col relative overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: "0.1s" }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-5 relative z-10 gap-3">
                  <div>
                    <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                      Sales Overview
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-[0.12em]">
                      Approved quotations revenue
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Pill toggle */}
                    <div className="flex items-center gap-0.5 bg-slate-100/80 p-1 rounded-lg">
                      {["weekly", "monthly", "yearly"].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setSalesTimeframe(tf)}
                          className={`relative px-3.5 py-1.5 text-[10px] rounded-lg font-bold capitalize transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
                            salesTimeframe === tf
                              ? "bg-indigo-600 text-white shadow-[0_2px_8px_-2px_rgba(79,70,229,0.5)] scale-[1.02]"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    {/* Kebab menu */}
                    <button className="p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200">
                      <MoreVertical size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[220px] w-full mt-auto relative z-10 -ml-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={salesData}
                      margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="salesArea"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#4f46e5"
                            stopOpacity={0.16}
                          />
                          <stop
                            offset="100%"
                            stopColor="#4f46e5"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="0"
                        vertical={false}
                        stroke="#f1f5f9"
                        strokeWidth={1}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "#94a3b8",
                          fontWeight: 600,
                        }}
                        dy={12}
                        interval={0}
                      />
{/* 
                      <XAxis
  dataKey="month"
  angle={-45}
  textAnchor="end"
  interval={0}
  height={60}
/> */}
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "#94a3b8",
                          fontWeight: 600,
                        }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${Math.round(v / 1000)}K` : v
                        }
                        width={40}
                      />
                      <Tooltip
                        cursor={{
                          stroke: "#c7d2fe",
                          strokeWidth: 1.5,
                          strokeDasharray: "4 4",
                        }}
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #eef2f7",
                          boxShadow: "0 10px 30px -8px rgba(0,0,0,0.12)",
                          padding: "8px 10px",
                        }}
                        labelStyle={{
                          color: "#94a3b8",
                          fontWeight: 700,
                          fontSize: "9px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: "3px",
                        }}
                        itemStyle={{
                          color: "#4f46e5",
                          fontWeight: 800,
                          fontSize: "12px",
                        }}
                        formatter={(v) => [
                          `₹ ${Number(v).toLocaleString("en-IN")}`,
                          "",
                        ]}
                        separator=""
                        animationDuration={220}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#4f46e5"
                        strokeWidth={2.5}
                        fill="url(#salesArea)"
                        dot={{
                          r: 3.5,
                          strokeWidth: 2,
                          fill: "#fff",
                          stroke: "#4f46e5",
                        }}
                        activeDot={{
                          r: 6,
                          strokeWidth: 2.5,
                          fill: "#4f46e5",
                          stroke: "#fff",
                          className: "sales-active-dot",
                        }}
                        animationDuration={1600}
                        animationEasing="ease-out"
                        className="sales-line"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Upcoming Follow-Ups (Span 4) — row 1, beside Sales Overview, matches reference layout */}
              <div
                className="lg:col-span-6 animate-fade-in-up"
                style={{ animationDelay: "0.15s" }}
              >
                <FollowUpsWidget
                  followUps={followUps}
                  loadingFollowUps={loadingFollowUps}
                  router={router}
                />
              </div>
              {/* ROW 2: Lead Status + Quotation Status + Task Checklist (4 / 4 / 4 split) */}
              {/* Lead Status Donut Chart (Span 4) */}
              {/* Lead Status Donut Chart (Span 4) */}
              <div
                className="lead-status-card lg:col-span-4 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] border border-slate-200/70 p-5 flex flex-col relative overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: "0.2s" }}
              >
                {/* subtle radial glow on hover */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-400/[0.07] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Header */}
                <div className="mb-1 relative z-10">
                  <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                    Lead Status
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-[0.12em]">
                    CRM leads distribution
                  </p>
                </div>

                {/* Donut */}
                {/* Donut + Stats side-by-side */}
                <div className="flex items-center gap-4 mt-auto relative z-10">
                  {/* LEFT: Donut */}
                  <div className="h-[220px] flex-1 min-w-0 relative">
                    {/* Center total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-5">
                      <span className="donut-total text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">
                        {leadsDonutData.reduce((s, d) => s + (d.value || 0), 0)}
                      </span>
                      <span className="donut-total-label text-[8px] font-bold text-slate-400 uppercase tracking-[0.14em] mt-1.5">
                        Total Leads
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {leadsDonutData.map((entry, i) => (
                            <filter
                              key={i}
                              id={`donutShadow-${i}`}
                              x="-50%"
                              y="-50%"
                              width="200%"
                              height="200%"
                            >
                              <feDropShadow
                                dx="0"
                                dy="3"
                                stdDeviation="4"
                                floodColor={entry.color}
                                floodOpacity="0.28"
                              />
                            </filter>
                          ))}
                        </defs>

                        <Pie
                          className="donut-pie"
                          data={leadsDonutData}
                          cx="50%"
                          cy="45%"
                          innerRadius={52}
                          outerRadius={78}
                          cornerRadius={6}
                          paddingAngle={3}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          animationDuration={1400}
                          animationEasing="ease-out"
                        >
                          {leadsDonutData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="transparent"
                              filter={`url(#donutShadow-${index})`}
                              className="donut-cell"
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid #eef2f7",
                            boxShadow: "0 10px 30px -8px rgba(0,0,0,0.12)",
                            padding: "8px 10px",
                          }}
                          itemStyle={{ fontWeight: 800, fontSize: "12px" }}
                          labelStyle={{ display: "none" }}
                          animationDuration={200}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* RIGHT: Stats breakdown */}
                  <div className="w-[128px] shrink-0 flex flex-col gap-2 pr-1">
                    {(() => {
                      const total =
                        leadsDonutData.reduce(
                          (s, d) => s + (d.value || 0),
                          0,
                        ) || 1;
                      return leadsDonutData.map((entry, i) => {
                        const pct = Math.round(
                          ((entry.value || 0) / total) * 100,
                        );
                        return (
                          <div
                            key={entry.name}
                            className="stat-row group/stat rounded-lg px-2.5 py-2 border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] cursor-default"
                            style={{ "--stat-delay": `${0.9 + i * 0.12}s` }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover/stat:scale-125"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.1em] truncate">
                                {entry.name}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between gap-1">
                              <span className="text-[17px] font-extrabold text-slate-900 leading-none tracking-tight">
                                {entry.value || 0}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {pct}%
                              </span>
                            </div>

                            {/* mini progress bar */}
                            <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="stat-bar h-full rounded-full"
                                style={{
                                  backgroundColor: entry.color,
                                  "--stat-w": `${pct}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              {/* Quotation Status Chart (Span 4) — row 2 */}
              <div
                className="lead-status-card lg:col-span-4 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] border border-slate-200/70 p-5 flex flex-col relative overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: "0.25s" }}
              >
                {/* subtle radial glow on hover */}
                <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-400/[0.07] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Header */}
                <div className="mb-1 relative z-10">
                  <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
                    Quotation Status
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-[0.12em]">
                    Active vs Won vs Lost
                  </p>
                </div>

                {/* Donut + Stats side-by-side */}
                <div className="flex items-center gap-4 mt-auto relative z-10">
                  {/* LEFT: Donut */}
                  <div className="h-[220px] flex-1 min-w-0 relative">
                    {/* Center total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-5">
                      <span className="donut-total text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">
                        {quotationStatusData.reduce(
                          (s, d) => s + (d.value || 0),
                          0,
                        )}
                      </span>
                      <span className="donut-total-label text-[8px] font-bold text-slate-400 uppercase tracking-[0.14em] mt-1.5">
                        Total Quotations
                      </span>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {quotationStatusData.map((entry, i) => (
                            <filter
                              key={i}
                              id={`quotationShadow-${i}`}
                              x="-50%"
                              y="-50%"
                              width="200%"
                              height="200%"
                            >
                              <feDropShadow
                                dx="0"
                                dy="3"
                                stdDeviation="4"
                                floodColor={entry.color}
                                floodOpacity="0.28"
                              />
                            </filter>
                          ))}
                        </defs>

                        <Pie
                          className="donut-pie"
                          data={quotationStatusData}
                          cx="50%"
                          cy="45%"
                          innerRadius={52}
                          outerRadius={78}
                          cornerRadius={6}
                          paddingAngle={3}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          animationDuration={1400}
                          animationEasing="ease-out"
                        >
                          {quotationStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="transparent"
                              filter={`url(#quotationShadow-${index})`}
                              className="donut-cell"
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid #eef2f7",
                            boxShadow: "0 10px 30px -8px rgba(0,0,0,0.12)",
                            padding: "8px 10px",
                          }}
                          itemStyle={{ fontWeight: 800, fontSize: "12px" }}
                          labelStyle={{ display: "none" }}
                          animationDuration={200}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* RIGHT: Stats breakdown */}
                  <div className="w-[128px] shrink-0 flex flex-col gap-2 pr-1">
                    {(() => {
                      const total =
                        quotationStatusData.reduce(
                          (s, d) => s + (d.value || 0),
                          0,
                        ) || 1;
                      return quotationStatusData.map((entry, i) => {
                        const pct = Math.round(
                          ((entry.value || 0) / total) * 100,
                        );
                        return (
                          <div
                            key={entry.name}
                            className="stat-row group/stat rounded-lg px-2.5 py-2 border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] cursor-default"
                            style={{ "--stat-delay": `${0.9 + i * 0.12}s` }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 transition-transform duration-300 group-hover/stat:scale-125"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.1em] truncate">
                                {entry.name}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between gap-1">
                              <span className="text-[17px] font-extrabold text-slate-900 leading-none tracking-tight">
                                {entry.value || 0}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {pct}%
                              </span>
                            </div>

                            {/* mini progress bar */}
                            <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="stat-bar h-full rounded-full"
                                style={{
                                  backgroundColor: entry.color,
                                  "--stat-w": `${pct}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
              {/* Task Checklist (Span 4) — completes row 2 */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">
                        Task Checklist
                      </h3>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                        {unfinishedTodos.length} pending •{" "}
                        {finishedTodos.length} completed
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
                      placeholder={
                        editingTodoId ? "Update task..." : "Quick add task..."
                      }
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
                  <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar pr-1">
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

                    {unfinishedTodos.length === 0 &&
                      finishedTodos.length === 0 && (
                        <p className="text-gray-400 text-xs text-center py-12">
                          No tasks available
                        </p>
                      )}
                  </div>
                </div>
              </div>
              {/* ROW 3: Pending / Completed / Payment Due invoice cards (4 / 4 / 4 split), matches reference photo */}
              {/* Pending Invoices (Span 4) */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-blue-50/20 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.35s" }}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">
                        Running Project Invoices
                      </h3>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                        Proforma Collection
                      </p>
                    </div>
                    <span className="text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full text-blue-700 bg-blue-50">
                      {pendingProgress.percentage}% paid
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-auto pt-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Total Amount
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-gray-800 leading-none">
                        ₹
                        {pendingProgress.totalValue.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Paid
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-blue-600 leading-none">
                        ₹
                        {pendingProgress.totalPaid.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Remaining
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-red-500 leading-none">
                        ₹
                        {pendingProgress.remaining.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-blue-100">
                      <div
                        style={{
                          width: `${pendingProgress.percentage}%`,
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000 ease-in-out"
                      ></div>
                    </div>
                    <p className="text-[9px] text-gray-400 font-semibold text-right">
                      {pendingProgress.count} invoice
                      {pendingProgress.count === 1 ? "" : "s"} pending
                    </p>
                  </div>
                </div>
              </div>
              {/* Completed Invoices (Span 4) */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-emerald-50/10 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">
                        Completed Project Invoices
                      </h3>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                        Proforma Collection
                      </p>
                    </div>
                    <span className="text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50">
                      {completedProgress.percentage}% paid
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-auto pt-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Total Amount
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-gray-800 leading-none">
                        ₹
                        {completedProgress.totalValue.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Paid
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-emerald-600 leading-none">
                        ₹
                        {completedProgress.totalPaid.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Remaining
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-red-500 leading-none">
                        ₹
                        {completedProgress.remaining.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-red-100">
                      <div
                        style={{
                          width: `${completedProgress.percentage}%`,
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 ease-in-out"
                      ></div>
                    </div>
                    <p className="text-[9px] text-gray-400 font-semibold text-right">
                      {completedProgress.count} invoice
                      {completedProgress.count === 1 ? "" : "s"} completed
                    </p>
                  </div>
                </div>
              </div>
              {/* Payment Due (Span 4) — violet accent to close out row 3 */}
              <div
                className="lg:col-span-4 bg-gradient-to-br from-white to-violet-50/30 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col justify-between animate-fade-in-up"
                style={{ animationDelay: "0.45s" }}
              >
                <div>
                  <h3 className="text-sm font-extrabold text-gray-800">
                    Payment Due
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                    Proforma Collection
                  </p>
                </div>
                <div className="flex flex-col gap-4 mt-auto">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Total Amount
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-gray-800 leading-none">
                        ₹
                        {paymentProgressData.totalProformaAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Paid
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-violet-600 leading-none">
                        ₹
                        {paymentProgressData.totalPaid.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Remaining
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-red-500 leading-none">
                        ₹
                        {paymentProgressData.paymentDue.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <div className="flex mb-1.5 items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold inline-block py-0.5 px-2 uppercase rounded-full text-violet-700 bg-violet-50">
                          {paymentProgressData.progressPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-violet-100">
                      <div
                        style={{
                          width: `${paymentProgressData.progressPercentage}%`,
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-violet-500 transition-all duration-1000 ease-in-out"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* ROW 4: Recent Leads — full width closing row */}
           <div
                className="lg:col-span-12 bg-gradient-to-br from-white to-slate-50/40 backdrop-blur-xl rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 p-5 flex flex-col animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                {/* ===== Section-scoped animation styles (UI only) ===== */}
                <style>{`
                  @keyframes rlCardIn {
                    from { opacity: 0; transform: translateY(18px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                  }
                  @keyframes rlBadgePop {
                    0% { opacity: 0; transform: scale(0.6); }
                    70% { transform: scale(1.12); }
                    100% { opacity: 1; transform: scale(1); }
                  }
                  .rl-card { animation: rlCardIn 0.55s ease-out both; }
                  .rl-badge { animation: rlBadgePop 0.5s ease-out both; }
                  @media (prefers-reduced-motion: reduce) {
                    .rl-card, .rl-badge { animation: none; }
                  }
                `}</style>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      Recent Leads
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wider">
                      Last 3 leads added
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/sales/lead")}
                    className="text-[10px] text-white bg-indigo-600 px-2 py-1.5 rounded-lg font-bold transition-all uppercase tracking-wider"
                  >
                    View All Leads
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {safeLeads.slice(0, 3).map((lead, idx) => {
                    // Rotating accent palette per card (UI only)
                    const accents = [
                      {
                        icon: "text-indigo-500",
                        iconBg: "from-indigo-50 to-blue-50",
                        company: "text-indigo-600",
                        hoverShadow: "hover:shadow-indigo-100",
                        hoverBorder: "border-indigo-200",
                        detail: "hover:text-indigo-500",
                      },
                      {
                        icon: "text-emerald-500",
                        iconBg: "from-emerald-50 to-teal-50",
                        company: "text-emerald-600",
                        hoverShadow: "hover:shadow-emerald-100",
                        hoverBorder: "border-emerald-200",
                        detail: "hover:text-emerald-500",
                      },
                      {
                        icon: "text-fuchsia-500",
                        iconBg: "from-fuchsia-50 to-pink-50",
                        company: "text-fuchsia-600",
                        hoverShadow: "hover:shadow-fuchsia-100",
                        hoverBorder: "border-fuchsia-200",
                        detail: "hover:text-fuchsia-500",
                      },
                    ];
                    const accent = accents[idx % accents.length];

                    return (
                      <div
                        key={idx}
                        className={`rl-card bg-white/60 backdrop-blur-sm border  ${accent.hoverBorder} p-4 rounded-xl shadow-sm hover:shadow-lg ${accent.hoverShadow} hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden`}
                        style={{ animationDelay: `${0.6 + idx * 0.12}s` }}
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                          <UserPlus size={40} className={accent.icon} />
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-1 truncate pr-8">
                          {lead.lead_title || "Untitled Lead"}
                        </h4>
                        <p className={`${accent.company} text-xs font-bold mb-3`}>
                          {lead.company_name}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                            <span
                              className={`p-1 rounded-md bg-gradient-to-br ${accent.iconBg}`}
                            >
                              <Users size={11} className={accent.icon} />
                            </span>
                            <span className="truncate">
                              {lead.customer_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                            <span
                              className={`p-1 rounded-md bg-gradient-to-br ${accent.iconBg}`}
                            >
                              <Clock size={11} className={accent.icon} />
                            </span>
                            <span>
                              {new Date(lead.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span
                            className={`rl-badge px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                              lead.status === "Won"
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                                : lead.status === "Lost"
                                  ? "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                                  : "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200"
                            }`}
                            style={{
                              animationDelay: `${0.85 + idx * 0.12}s`,
                            }}
                          >
                            {lead.status}
                          </span>
                          <button
                            onClick={() =>
                              router.push(`/sales/lead?id=${lead.lead_id}`)
                            }
                            className={`text-[10px] font-bold text-gray-400 ${accent.detail} transition-all group/btn flex items-center gap-0.5`}
                          >
                            Details{" "}
                            <span className="inline-block transition-transform duration-200 group-hover/btn:translate-x-1">
                              →
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
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

        {!loading && role === "Proforma invoices" && (
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
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Total PI Value
                      </p>
                      <p className="text-base sm:text-lg font-extrabold text-gray-800 leading-none">
                        ₹
                        {paymentProgressData.totalProformaAmount.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Total Collected
                      </p>
                      <p className="text-base sm:text-lg font-extrabold text-emerald-600 leading-none">
                        ₹
                        {paymentProgressData.totalPaid.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                        Remaining Due
                      </p>
                      <p className="text-base sm:text-lg font-extrabold text-red-500 leading-none">
                        ₹
                        {paymentProgressData.paymentDue.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
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
                              {pi.pi_date
                                ? new Date(pi.pi_date).toLocaleDateString()
                                : ""}
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
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight mt-1 ${
                              (pi.status || "").toLowerCase() === "paid" ||
                              (pi.stage || "").toLowerCase() === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : (pi.status || "").toLowerCase() ===
                                    "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {pi.status || "Draft"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {pis.length === 0 && (
                    <p className="text-gray-400 text-xs text-center py-10">
                      No proforma invoices found
                    </p>
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
                        <linearGradient
                          id="colorPITotal"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorPICollected"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
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
                          if (value >= 100000)
                            return `₹${(value / 100000).toFixed(1)}L`;
                          if (value >= 1000)
                            return `₹${(value / 1000).toFixed(0)}k`;
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
                        formatter={(value) => [
                          `₹${Math.round(value).toLocaleString("en-IN")}`,
                        ]}
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
                        wrapperStyle={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#475569",
                        }}
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
                          <Circle
                            size={8}
                            fill="#3b82f6"
                            stroke="transparent"
                          />
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
                          <p className="text-gray-400 text-xs text-center py-8">
                            All caught up!
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2
                            size={10}
                            className="text-emerald-500"
                          />
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
                          <p className="text-gray-400 text-xs text-center py-8">
                            No completed tasks yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && role === "Estimation" && (
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
                        {
                          name: "Paid Value",
                          value: paymentProgressData.totalPaid || 0,
                          color: "#10B981",
                        },
                        {
                          name: "Due Value",
                          value: paymentProgressData.paymentDue || 0,
                          color: "#6366f1",
                        },
                      ].filter((item) => item.value > 0);
                      if (pData.length === 0) {
                        pData.push({
                          name: "No Payments",
                          value: 1,
                          color: "#cbd5e1",
                        });
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
                        <span>
                          ₹{Number(q.grand_total || 0).toLocaleString("en-IN")}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(
                            q.created_at || q.quotation_created_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                          q.quotation_status === "Approved"
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
                      <linearGradient
                        id="colorApproved"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorDraft"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: "#64748b" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) =>
                        `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                      }
                      tick={{ fontSize: 10, fontWeight: 600, fill: "#64748b" }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toLocaleString("en-IN")}`,
                      ]}
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
                      <p className="text-gray-400 text-[10px] text-center py-6">
                        No unfinished tasks
                      </p>
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
                      <p className="text-gray-400 text-[10px] text-center py-6">
                        No finished tasks
                      </p>
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
        {(role === "Admin" ||
          role === "Super Admin" ||
          role === "Leads Management") &&
          trafficLightStats.length > 0 && (
            <div className="mt-6 mb-8 animate-fade-in">
              {/* ===== Section-scoped animation styles (UI only) ===== */}
              <style>{`
                @keyframes tpFadeUp {
                  from { opacity: 0; transform: translateY(16px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes tpSlideIn {
                  from { opacity: 0; transform: translateX(-12px); }
                  to { opacity: 1; transform: translateX(0); }
                }
                @keyframes tpGlow {
0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35); }
                  50% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
                }
                @keyframes tpPulseDot {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
                  70% { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
                }
                @keyframes tpPulseDotYellow {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.5); }
                  70% { box-shadow: 0 0 0 5px rgba(245, 158, 11, 0); }
                }
                @keyframes tpShimmer {
                  0% { background-position: -200% center; }
                  100% { background-position: 200% center; }
                }
                .tp-card { animation: tpFadeUp 0.6s ease-out both; }
                .tp-row { animation: tpSlideIn 0.45s ease-out both; }
                .tp-glow-icon { animation: tpGlow 2.5s ease-in-out infinite; }
                .tp-dot-red { animation: tpPulseDot 1.8s ease-out infinite; }
                .tp-dot-yellow { animation: tpPulseDotYellow 2.2s ease-out infinite; }
  
                @media (prefers-reduced-motion: reduce) {
                  .tp-card, .tp-row, .tp-glow-icon, .tp-dot-red, .tp-dot-yellow, .tp-gradient-text {
                    animation: none;
                  }
                }
              `}</style>

              {/* ===== Section Header ===== */}
              <div className="flex items-center gap-3 mb-4 pl-1">
<div className=" p-2  to-red-500 rounded-lg shadow-md">
                  <Activity size={18} className="text-indigo-500  " />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight leading-tight">
                    <span className="text-black">Team Performance</span>{" "}
                    {/* <span className="text-gray-400 font-medium text-sm ml-1">
                      (Traffic Light System)
                    </span> */}
                  </h2>
                  {/* <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                    Analyze response times and follow-up efficiency across the
                    sales team
                  </p> */}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ===== Chart Card ===== */}
                <div
                  className="tp-card bg-white/70 backdrop-blur-xl border border-indigo-100/60 p-4 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                  style={{ animationDelay: "0.1s" }}
                >
                  <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="p-1 rounded-md bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                      <Activity size={13} className="text-emerald-500" />
                    </span>
                    Follow-Up Status Distribution
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={trafficLightStats}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="tpGreenGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#34D399" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient
                            id="tpYellowGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#FBBF24" />
                            <stop offset="100%" stopColor="#D97706" />
                          </linearGradient>
                          <linearGradient
                            id="tpRedGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#F87171" />
                            <stop offset="100%" stopColor="#DC2626" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#eef2ff"
                        />
                        <XAxis
                          dataKey="assignee"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 10,
                            fill: "#64748b",
                            fontWeight: 600,
                          }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
                          contentStyle={{
                            borderRadius: "14px",
                            border: "1px solid #e0e7ff",
                            boxShadow:
                              "0 15px 35px -5px rgba(79, 70, 229, 0.15)",
                            padding: "12px",
                            backdropFilter: "blur(8px)",
                          }}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "11px",
                            paddingTop: "10px",
                            fontWeight: 600,
                          }}
                        />
                        <Bar
                          dataKey="green_count"
                          name="On Time (< 24h)"
                          stackId="a"
                          fill="url(#tpGreenGrad)"
                          radius={[0, 0, 4, 4]}
                          barSize={32}
                          animationDuration={900}
                          animationBegin={200}
                          animationEasing="ease-out"
                        />
                        <Bar
                          dataKey="yellow_count"
                          name="Late (24h-48h)"
                          stackId="a"
                          fill="url(#tpYellowGrad)"
                          animationDuration={900}
                          animationBegin={500}
                          animationEasing="ease-out"
                        />
                        <Bar
                          dataKey="red_count"
                          name="Very Late (> 48h)"
                          stackId="a"
                          fill="url(#tpRedGrad)"
                          radius={[4, 4, 0, 0]}
                          animationDuration={900}
                          animationBegin={800}
                          animationEasing="ease-out"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ===== Table Card ===== */}
                <div
                  className="tp-card bg-white/70 backdrop-blur-xl border border-violet-100/60 p-4 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                  style={{ animationDelay: "0.25s" }}
                >
                  <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="p-1 rounded-md bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100">
                      <Clock size={13} className="text-violet-500" />
                    </span>
                    Average Response Times
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-violet-100/60 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-indigo-50/80 via-violet-50/80 to-fuchsia-50/80 border-b border-violet-100">
                          <th className="px-4 py-3 text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">
                            Employee
                          </th>
                          <th className="px-4 py-3 text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap">
                            Avg Response
                          </th>
                          <th className="px-4 py-3 text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest whitespace-nowrap text-right">
                            Total Logs
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {trafficLightStats.map((stat, idx) => {
                          const avgHours = parseFloat(
                            stat.avg_hours_elapsed || 0,
                          );
                          let timeString = "";
                          if (avgHours < 1) {
                            timeString = `${Math.round(avgHours * 60)} mins`;
                          } else {
                            timeString = `${avgHours.toFixed(1)} hours`;
                          }

                          let statusDot = "bg-green-500";
                          let dotAnim = "";
                          if (avgHours >= 48) {
                            statusDot = "bg-red-500";
                            dotAnim = "tp-dot-red";
                          } else if (avgHours >= 24) {
                            statusDot = "bg-yellow-500";
                            dotAnim = "tp-dot-yellow";
                          }

                          // Colorful avatar palette — rotates per row (UI only)
                          const avatarPalettes = [
                            "from-indigo-400 to-blue-500",
                            "from-emerald-400 to-teal-500",
                            "from-amber-400 to-orange-500",
                            "from-rose-400 to-pink-500",
                            "from-violet-400 to-purple-500",
                            "from-cyan-400 to-sky-500",
                          ];
                          const avatarGrad =
                            avatarPalettes[idx % avatarPalettes.length];

                          return (
                            <tr
                              key={idx}
                              className="tp-row hover:bg-gradient-to-r hover:from-indigo-50/50 hover:via-violet-50/40 hover:to-transparent transition-all duration-200 group"
                              style={{
                                animationDelay: `${0.35 + idx * 0.08}s`,
                              }}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarGrad} shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                                  >
                                    <span className="text-[10px] font-bold text-white">
                                      {stat.assignee
                                        ? stat.assignee.charAt(0).toUpperCase()
                                        : "?"}
                                    </span>
                                  </div>
                                  <span className="text-[12px] font-semibold text-gray-800">
                                    {stat.assignee || "Unknown"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${statusDot} ${dotAnim} shadow-sm`}
                                  ></span>
                                  <span className="text-[12px] font-medium text-gray-600">
                                    {timeString}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span
                                  className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold group-hover:scale-110 transition-transform duration-200 ${
                                    avgHours >= 48
                                      ? "bg-red-50 text-red-600 border border-red-100"
                                      : avgHours >= 24
                                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  }`}
                                >
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
