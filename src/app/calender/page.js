"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import Header from "../components/header";
import { hasRoleAccess } from "@/utils/roleAccess";
import { toast } from "react-toastify";


const API_BASE =
  (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000") + "/api";

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

const PRIORITIES = ["Low", "Medium", "High"];

// ✅ FIX: "In Progress" kadhi nakhyu, have sirf 3 status
const STATUSES = ["Pending", "Completed", "Cancelled"];

// ✅ Status cycle order: Pending -> Completed -> Cancelled -> Pending...
const STATUS_CYCLE = ["Pending", "Completed", "Cancelled"];
function nextStatus(current) {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

const PRIORITY_STYLE = {
  High: "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low: "bg-green-100 text-green-700 border border-green-200",
};
const STATUS_STYLE = {
  Pending: "bg-gray-100 text-gray-600",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-red-100 text-red-600",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ✅ FIX: default status have hammesha "Pending" j rahese (navo event banta j)
const emptyForm = {
  title: "",
  description: "",
  activity_date: "",
  activity_time: "",
  assignee: [],
  priority: "Medium",
  status: "Pending",
};

// ============================================================
// Timezone-safe date helpers
// ============================================================
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocalDateStr(dateVal) {
  if (!dateVal) return "";
  return String(dateVal).split("T")[0];
}

function fmt12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

// ✅ Multiple assignees ek j field ma comma-separated string tarike store/send thay che
// (e.g. "3,7,12"). Aa helper e kaik pan format ma aave (array, string, null) — clean list
// of strings ma convert kare che, jethi UI ma vaprvu sahelu rahe.
function assigneeList(value) {
  if (!value) return [];
  if (Array.isArray(value))
    return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

// ✅ FIX: Assignee filter check — event na raw assignee IDs ("3,7,12") ma
// selected assigneeId hoy to j true. assigneeId khali hoy ("All Assignees")
// to badha events match thay.
function hasAssignee(ev, assigneeId) {
  if (!assigneeId) return true; // "All" selected
  return assigneeList(ev.assignee).some(
    (id) => String(id) === String(assigneeId),
  );
}

// ============================================================
// STATUS CHECKBOX (click thi cycle thay: Pending -> Completed -> Cancelled)
// ============================================================
function StatusCheckbox({ status, onClick, size = "md" }) {
  const dims = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const iconDims = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  const base =
    `${dims} rounded-md border-2 flex items-center justify-center transition-colors duration-150 cursor-pointer ` +
    `hover:border-orange-500 hover:text-orange-500`;

  if (status === "Completed") {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Completed — click for Cancelled"
        className={`${base} bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-500`}
      >
        <svg
          className={iconDims}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    );
  }

  if (status === "Cancelled") {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Cancelled — click for Pending"
        className={`${base} bg-red-500 border-red-500 text-white hover:bg-red-500`}
      >
        <svg
          className={iconDims}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    );
  }

  // Pending = empty box
  return (
    <button
      type="button"
      onClick={onClick}
      title="Pending — click for Completed"
      className={`${base} bg-white border-gray-300 text-transparent`}
    />
  );
}

// ============================================================
// MULTI-ASSIGNEE DROPDOWN (checkbox list, multiple users select thai sake)
// ============================================================
function MultiAssigneeSelect({ users, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id) => {
    const idStr = String(id);
    onChange(
      selected.includes(idStr)
        ? selected.filter((s) => s !== idStr)
        : [...selected, idStr],
    );
  };

  const selectedUsers = users.filter((u) => selected.includes(String(u.id)));

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-orange-400 flex items-center justify-between gap-2 bg-white"
      >
        <span className="flex flex-wrap gap-1 flex-1">
          {selectedUsers.length === 0 ? (
            <span className="text-gray-400">Select assignee(s)</span>
          ) : (
            selectedUsers.map((u) => (
              <span
                key={u.id}
                className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full"
              >
                {u.name}
              </span>
            ))
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">No users found</p>
          ) : (
            users.map((u) => {
              const checked = selected.includes(String(u.id));
              return (
                <label
                  key={u.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-orange-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(u.id)}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                  />
                  {u.name}
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MODAL COMPONENT
// ============================================================
function Modal({ open, onClose, children }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

// ============================================================
// ACTIVITY FORM MODAL
// ============================================================
function ActivityModal({ open, onClose, editData, users, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData && !editData._prefillDate) {
      setForm({
        title: editData.title || "",
        description: editData.description || "",
        activity_date: toLocalDateStr(editData.activity_date),
        activity_time: editData.activity_time?.slice(0, 5) || "",
        assignee: assigneeList(editData.assignee),
        priority: editData.priority || "Medium",
        // jo koi juno event "In Progress" status sathe save thayelo hoy,
        // have e valid status nathi, etle Pending par fallback thase
        status: STATUSES.includes(editData.status)
          ? editData.status
          : "Pending",
      });
    } else {
      // ✅ FIX 1: Navo event banta j status hammesha "Pending"
      setForm({
        ...emptyForm,
        activity_date: editData?._prefillDate || todayStr(),
        status: "Pending",
      });
    }
    setError("");
  }, [editData, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.activity_date || !form.activity_time) {
      setError("Title, Date and Time are required.");
      return;
    }
    setLoading(true);
    setError("");
    // ✅ Multiple assignee ids ne backend mate "3,7,12" jevi comma-separated string ma convert kari e
    const payload = { ...form, assignee: form.assignee.join(",") };
    try {
      if (editData && !editData._prefillDate) {
        await api.put(`/calendar/${editData.id}`, payload);
      } else {
        // ✅ navo event banti vakhte status force "Pending" mokli e
        await api.post("/calendar/insert-event", {
          ...payload,
          status: "Pending",
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isEdit = editData && !editData._prefillDate;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 bg-white">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Activity" : "New Activity"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-orange-500 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Meeting with client..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.activity_date}
                onChange={(e) => set("activity_date", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={form.activity_time}
                onChange={(e) => set("activity_time", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignee
            </label>
            {users.length > 0 ? (
              <MultiAssigneeSelect
                users={users}
                selected={form.assignee}
                onChange={(vals) => set("assignee", vals)}
              />
            ) : (
              <input
                type="text"
                value={form.assignee.join(", ")}
                onChange={(e) =>
                  set(
                    "assignee",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Assignee names or IDs, comma separated"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* ✅ FIX: Status have dropdown nathi — checkbox che, ane navo event banta status hammesha Pending hoy etle edit vakhte j enable thay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              {isEdit ? (
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                  <StatusCheckbox
                    status={form.status}
                    onClick={() => set("status", nextStatus(form.status))}
                  />
                  <span className="text-sm text-gray-700">{form.status}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                  <StatusCheckbox status="Pending" onClick={() => {}} />
                  <span className="text-sm text-gray-500">
                    Pending (default)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 hover:text-orange-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ============================================================
// DELETE CONFIRM MODAL
// ============================================================
function DeleteModal({ open, onClose, onConfirm, title }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 text-center bg-white">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Delete Activity?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          <span className="font-medium text-gray-700">"{title}"</span>{" "}
          permanently delete thase. Aa action undo nahi thay.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 hover:text-orange-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// DETAIL MODAL
// ============================================================
function DetailModal({
  open,
  onClose,
  event,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  if (!event) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {event.title}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(
                toLocalDateStr(event.activity_date) + "T00:00:00",
              ).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {" · "}
              {fmt12(event.activity_time)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-orange-500 text-2xl leading-none mt-0.5 transition-colors"
          >
            &times;
          </button>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-4">
            {event.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLE[event.priority] || "bg-gray-100 text-gray-600"}`}
            >
              {event.priority || "—"}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Assignee</p>
            <p className="text-sm font-medium text-gray-700">
              {(() => {
                const names = assigneeList(
                  event.assignee_name || event.assignee,
                );
                if (names.length === 0) return "—";
                return (
                  <span className="flex flex-wrap gap-1">
                    {names.map((n, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5"
                      >
                        {n}
                      </span>
                    ))}
                  </span>
                );
              })()}
            </p>
          </div>
        </div>

        {/* ✅ FIX: Status dropdown/pills hatavi, checkbox sathe replace karyu. Click karta cycle thay: Pending -> Completed -> Cancelled */}
        <div className="mb-5">
          <p className="text-xs text-gray-500 mb-2">
            Status — click box to change
          </p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <StatusCheckbox
              status={event.status}
              onClick={() => onStatusChange(event.id, nextStatus(event.status))}
            />
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[event.status] || "bg-gray-100 text-gray-600"}`}
            >
              {event.status}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              onDelete(event);
            }}
            className="flex items-center gap-1.5 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>

          {hasRoleAccess(["Admin", "Super Admin"]) && (
            <button
              onClick={() => {
                onClose();
                onEdit(event);
              }}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Activity
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
// ============================================================
// MAIN CALENDAR PAGE
// ============================================================
export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const [viewMode, setViewMode] = useState("calendar");

  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  // ✅ FIX: Assignee filter — single-select dropdown. Khali string "" = "All Assignees".
  const [filterAssignee, setFilterAssignee] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await api.get("/calendar/list");
      setEvents(res.data.data || []);
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? "Your session has expired. Please log in again."
  : "Unable to load events. Please check the backend server.";
      toast.error(msg);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // ✅ FIX: "/manage-user/list" route backend ma navi hati etle dropdown empty rehtu hatu.
  // Lead form ma j working route che ("/manage-user/asignee") e j use karyu, ane error have
  // console ma dekhase (silent fail nahi thase).
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/manage-user/asignee", {
        params: { status: 1 },
      });
      const data = res.data.data || res.data || [];
      setUsers(data);
    } catch (err) {
      console.error(
        "Assignee fetch failed:",
        err.response?.status,
        err.response?.data || err.message,
      );
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, [fetchEvents, fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/calendar/${deleteTarget.id}`);
      toast.success("Activity delete ");
      setDeleteTarget(null);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    }
  };

  // ✅ Optimistic update + checkbox cycle thi status change
  const handleStatusChange = async (id, status) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    setDetailEvent((prev) =>
      prev && prev.id === id ? { ...prev, status } : prev,
    );
    try {
      await api.put(`/calendar/status/${id}`, { status });
      toast.success(`Status "${status}".`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed.");
      fetchEvents(); // revert on failure
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  // ✅ FIX: eventsOnDate have filterAssignee pan apply kare che. Aa j function
  // calendar grid cells ane "Selected date" side panel banne ma vapraay che,
  // etle ek j jagya e filter lagavathi banne automatically update thay jay.
  const eventsOnDate = (dateStr) =>
    events
      .filter((e) => toLocalDateStr(e.activity_date) === dateStr)
      .filter((e) => hasAssignee(e, filterAssignee));

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };
  const goToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    setSelectedDate(todayStr());
  };

  const selectedEvents = eventsOnDate(selectedDate).sort((a, b) =>
    (a.activity_time || "").localeCompare(b.activity_time || ""),
  );

  // ✅ FIX: List view ma pan filterAssignee apply karyu (hasAssignee helper)
  const listEvents = events
    .filter((e) => filterStatus === "All" || e.status === filterStatus)
    .filter((e) => filterPriority === "All" || e.priority === filterPriority)
    .filter((e) => hasAssignee(e, filterAssignee))
    .filter(
      (e) => !searchQ || e.title.toLowerCase().includes(searchQ.toLowerCase()),
    )
    .sort((a, b) => {
      const da = `${toLocalDateStr(a.activity_date)}T${a.activity_time}`;
      const db = `${toLocalDateStr(b.activity_date)}T${b.activity_time}`;
      return da.localeCompare(db);
    });

  // ✅ "In Progress" stat box kadhi nakhi, have 3 stats che (grid-cols-3)
  const stats = {
    total: events.length,
    pending: events.filter((e) => e.status === "Pending").length,
    completed: events.filter((e) => e.status === "Completed").length,
  };

  const handleDateCellClick = (dateStr) => {
    setSelectedDate(dateStr);

    if (hasRoleAccess(["Admin", "Super Admin"])) {
      setEditData({ _prefillDate: dateStr });
      setShowForm(true);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <span className="font-semibold text-gray-900">Calendar</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${viewMode === "calendar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-orange-500"}`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-orange-500"}`}
              >
                List
              </button>
            </div>
            {hasRoleAccess(["Admin", "Super Admin"]) && (
              <button
                onClick={() => {
                  setEditData(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>

                <span className="hidden sm:inline">Add Activity</span>

                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </header>

        {/* STATS BAR — 3 stats have (In Progress kadhi nakhyu) */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-3 gap-4">
            {[
              { label: "Total", val: stats.total, color: "text-gray-900" },
              { label: "Pending", val: stats.pending, color: "text-gray-500" },
              {
                label: "Completed",
                val: stats.completed,
                color: "text-emerald-600",
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* CALENDAR VIEW */}
          {viewMode === "calendar" && (
            <div>
              {/* ✅ FIX: Assignee filter dropdown — Calendar view ma upar, right-aligned */}
              <div className="mb-4 flex justify-end">
                {hasRoleAccess(["Admin","Super Admin"]) && (
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="">All Assignees</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar grid */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Month nav */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <button
                      onClick={prevMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-orange-500 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold text-gray-900">
                        {MONTHS[viewMonth]} {viewYear}
                      </h2>
                      <button
                        onClick={goToday}
                        className="text-xs text-orange-500 hover:text-orange-600 hover:underline"
                      >
                        Today
                      </button>
                    </div>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-orange-500 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {DAYS.map((d) => (
                      <div
                        key={d}
                        className="text-center text-xs font-medium text-gray-400 py-3"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div
                        key={`e-${i}`}
                        className="min-h-[80px] border-b border-r border-gray-50"
                      />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dayEvts = eventsOnDate(dateStr);
                      const isToday = dateStr === todayStr();
                      const isSel = dateStr === selectedDate;

                      return (
                        <div
                          key={day}
                          onClick={() => handleDateCellClick(dateStr)}
                          className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors
                          ${isSel ? "bg-orange-50" : "hover:bg-gray-50"}`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 mx-auto
                            ${isToday ? "bg-orange-500 text-white" : isSel ? "text-orange-600 font-bold" : "text-gray-700"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(dateStr);
                            }}
                          >
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvts.slice(0, 2).map((ev) => (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailEvent(ev);
                                }}
                                className="flex items-center gap-1 text-[10px] bg-blue-500 text-white rounded px-1 py-0.5 truncate cursor-pointer hover:bg-orange-600"
                              >
                                <span
                                  onClick={(ev2) => {
                                    ev2.stopPropagation();
                                    handleStatusChange(
                                      ev.id,
                                      nextStatus(ev.status),
                                    );
                                  }}
                                  className="flex-shrink-0"
                                >
                                  <StatusCheckbox
                                    status={ev.status}
                                    onClick={() => {}}
                                    size="sm"
                                  />
                                </span>
                                <span className="truncate">{ev.title}</span>
                              </div>
                            ))}
                            {dayEvts.length > 2 && (
                              <div
                                className="text-[10px] text-gray-400 hover:text-orange-500 text-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDate(dateStr);
                                }}
                              >
                                +{dayEvts.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected date panel */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Selected</p>
                      <h3 className="font-semibold text-gray-900">
                        {new Date(
                          selectedDate + "T00:00:00",
                        ).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </h3>
                    </div>

                    {hasRoleAccess(["Admin", "Super Admin"]) && (
                      <button
                        onClick={() => {
                          setEditData({ _prefillDate: selectedDate });
                          setShowForm(true);
                        }}
                        className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="p-4 overflow-y-auto max-h-[500px]">
                    {loadingData ? (
                      <div className="text-center py-8 text-sm text-gray-400">
                        Loading...
                      </div>
                    ) : selectedEvents.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400">No activities</p>
                        <p className="text-xs text-gray-300 mt-1">
                          Click + to add one
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="border border-gray-100 rounded-xl p-3 cursor-pointer hover:border-orange-200 hover:bg-orange-50/50 transition-all group"
                          >
                            <div className="flex items-start gap-2.5">
                              {/* ✅ Checkbox: click thi status cycle thay, baki div click thi detail khule */}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(
                                    ev.id,
                                    nextStatus(ev.status),
                                  );
                                }}
                                className="mt-0.5"
                              >
                                <StatusCheckbox
                                  status={ev.status}
                                  onClick={() => {}}
                                />
                              </span>
                              <div
                                className="flex-1"
                                onClick={() => setDetailEvent(ev)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-gray-800 group-hover:text-orange-600 leading-snug">
                                    {ev.title}
                                  </p>
                                  <span
                                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[ev.status] || "bg-gray-100 text-gray-600"}`}
                                  >
                                    {ev.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-xs text-gray-500">
                                    {fmt12(ev.activity_time)}
                                  </span>
                                  {ev.priority && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_STYLE[ev.priority] || ""}`}
                                    >
                                      {ev.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === "list" && (
            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="All">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="All">All Priorities</option>
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                {/* ✅ FIX: Assignee filter dropdown — List view ma baki filters ni baju ma */}
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">All Assignees</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {loadingData ? (
                <div className="text-center py-16 text-gray-400">
                  Loading activities...
                </div>
              ) : listEvents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <p className="text-gray-400 text-sm">No activities found.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <div className="col-span-1">Done</div>
                    <div className="col-span-3">Title</div>
                    <div className="col-span-2">Date & Time</div>
                    <div className="col-span-2">Assignee</div>
                    <div className="col-span-1">Priority</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                  {listEvents.map((ev, idx) => (
                    <div
                      key={ev.id}
                      className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors
                      ${idx !== listEvents.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      {/* ✅ Checkbox column: click thi status cycle thay */}
                      <div className="col-span-1">
                        <StatusCheckbox
                          status={ev.status}
                          onClick={() =>
                            handleStatusChange(ev.id, nextStatus(ev.status))
                          }
                        />
                      </div>
                      <div className="col-span-3">
                        <p
                          className="text-sm font-medium text-gray-800 cursor-pointer hover:text-orange-500 transition-colors truncate"
                          onClick={() => setDetailEvent(ev)}
                        >
                          {ev.title}
                        </p>
                        {ev.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-700">
                          {new Date(
                            toLocalDateStr(ev.activity_date) + "T00:00:00",
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {fmt12(ev.activity_time)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 truncate">
                          {assigneeList(ev.assignee_name || ev.assignee).join(
                            ", ",
                          ) || "—"}
                        </p>
                      </div>
                      <div className="col-span-1">
                        {ev.priority ? (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_STYLE[ev.priority] || ""}`}
                          >
                            {ev.priority}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-lg font-medium ${STATUS_STYLE[ev.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {ev.status}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center gap-1.5">
                        {hasRoleAccess(["Admin", "Super Admin"]) && (
                          <button
                            onClick={() => {
                              setEditData(ev);
                              setShowForm(true);
                            }}
                            className="p-1.5 hover:bg-orange-50 rounded-lg text-gray-400 hover:text-orange-500 transition-colors"
                            title="Edit"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(ev)}
                          className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODALS */}
        <ActivityModal
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditData(null);
          }}
          editData={editData}
          users={users}
          onSaved={() => {
            fetchEvents();
            toast.success(
              editData && !editData._prefillDate
                ? "Activity updated !"
                : "Activity created !",
            );
          }}
        />

        <DeleteModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={deleteTarget?.title || ""}
        />


        <DetailModal
          open={!!detailEvent}
          onClose={() => setDetailEvent(null)}
          event={detailEvent}
          onEdit={(ev) => {
            setEditData(ev);
            setShowForm(true);
          }}
          onDelete={(ev) => setDeleteTarget(ev)}
          onStatusChange={handleStatusChange}
        />
      </div>
    </>
  );
}