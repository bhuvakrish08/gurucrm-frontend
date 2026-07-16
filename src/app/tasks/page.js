"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import Header from "../components/header";
import Select from "react-select";
import { X, FileImage, FileText } from "lucide-react";
import useAuth from "../components/useAuth";

/* ================================================================
   SlideOverModal — reusable right-side slide-in panel
   ================================================================ */
function SlideOverModal({ isOpen, onClose, children, widthClass = "w-[800px]" }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateIn, setAnimateIn] = useState(false);
  const ANIMATION_DURATION = 300;

  useEffect(() => {
    let timer;
    if (isOpen) {
      setShouldRender(true);
      timer = setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
      timer = setTimeout(() => setShouldRender(false), ANIMATION_DURATION);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-gray-900/30 transition-opacity duration-300 ease-in-out ${
        animateIn ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white shadow-lg h-full ${widthClass} relative overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          animateIn ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function Page() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  useAuth(["Admin", "Super Admin", "Sales", "Estimation", "Leads Management"]);

  const exportRef = useRef(null);
  const [formData, setFormData] = useState({
    task_name: "",
    status: "",
    priority: "",
    recurring_type: "",
    repeat_every: "",
    description: "",
    assignee: "",
    template: "",
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [relatedTo, setRelatedTo] = useState("");
  const [secondValue, setSecondValue] = useState("");
  const [secondOptions, setSecondOptions] = useState([]);
  const [asignee, setAsignee] = useState([]);
  const [status, setStatus] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [token, setToken] = useState("");
  const [task, setTask] = useState([]);
  const [filters, setFilters] = useState({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showTaskDeleteModal, setShowTaskDeleteModal] = useState(false);
  const [taskDeleteId, setTaskDeleteId] = useState(null);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const [scrollOffsets, setScrollOffsets] = useState({});
  const [loadingColumns, setLoadingColumns] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const APIBase = `${API_BASE}/api/tasks`;

  // Standardized Micara IMS Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${APIBase}/read`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      });
      setTasks(res.data.result || []);
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || "Failed to load tasks");
    }
  };

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, filters]);

  // Reset page when filters or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // ✅ Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ========================
  // ✅ EXPORT TO EXCEL
  // ========================
  const exportToExcel = async () => {
    try {
      if (tasks.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const XLSX = await import("xlsx");

      const exportData = tasks.map((item, index) => ({
        "#": index + 1,
        "Task Name": item.task_name || "",
        "Start Date": item.start_date
          ? new Date(item.start_date)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "",
        "Due Date": item.due_date
          ? new Date(item.due_date)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "",
        Priority: item.priority || "",
        Assignee: item.assignee || "",
        Status: item.status_name || "",
        "Created By": item.created_by_name || "",
        "Created At": item.created_at
          ? new Date(item.created_at)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");

      const colWidths = Object.keys(exportData[0]).map((key) => ({
        wch: Math.max(key.length, 18),
      }));

      worksheet["!cols"] = colWidths;

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5).replace(":", "-");

      const fileName = `Tasks_(${date})_${time}.xlsx`;

      XLSX.writeFile(workbook, fileName);

      toast.success("Excel exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.error("Excel Export Error:", err);
      toast.error("Excel export failed");
    }
  };

  // ✅ EXPORT TO PDF

  const exportToPDF = async () => {
    try {
      if (tasks.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Tasks Report", 14, 15);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Exported on: ${new Date().toLocaleDateString("en-GB")} | Total Records: ${
          tasks.length
        }`,
        14,
        22,
      );

      const tableData = tasks.map((item, index) => [
        index + 1,
        item.task_name || "",
        item.start_date
          ? new Date(item.start_date)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "-",
        item.due_date
          ? new Date(item.due_date)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "-",
        item.priority || "-",
        item.assignee || "-",
        item.status_name || "-",
        item.created_by_name || "-",
        item.created_at
          ? new Date(item.created_at)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "-",
      ]);

      autoTable(doc, {
        startY: 27,
        head: [
          [
            "#",
            "Task Name",
            "Start Date",
            "Due Date",
            "Priority",
            "Assignee",
            "Status",
            "Created By",
            "Created At",
          ],
        ],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [40, 40, 40],
        },
        headStyles: {
          fillColor: [249, 115, 22],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [255, 247, 237],
        },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 40 },
        },
      });

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5).replace(":", "-");

      const fileName = `Tasks_(${date})_${time}.pdf`;

      doc.save(fileName);

      toast.success("PDF exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("PDF export failed");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const formatForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";

    const d = new Date(dateString);

    const date = d.toLocaleDateString("en-GB").replace(/\//g, "-");
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${date}  ${time}`;
  };

  const handleEdit = async (item) => {
    setEditId(item.id);
    // Fetch existing files for the task
    try {
      const res = await axios.get(`${API_BASE}/api/tasks/files/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingFiles(res.data.files || []); // each file: {id, file_name, file_path
    } catch (err) {
      console.error("Failed to load existing files:", err);
      setExistingFiles([]);
    }

    setFormData({
      task_name: item.task_name,
      status: item.status,
      priority: item.priority,
      recurring_type: item.recurring_type,
      repeat_every: item.repeat_every,
      description: item.description,
      assignee: item.assignee,
      template: item.template,
    });
    setStartDate(formatForInput(item.start_date));
    setDueDate(formatForInput(item.due_date));
    setRelatedTo(item.related_to);
    setSecondValue(item.related_value);

    setShowForm(true);
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      task_name: "",
      status: "",
      priority: "",
      recurring_type: "",
      repeat_every: "",
      description: "",
      assignee: "",
      template: "",
    });

    setStartDate("");
    setDueDate("");
    setRelatedTo("");
    setSecondValue("");
    setSecondOptions([]);

    setShowForm(false);
    fetchData();
  };
  const handleDelete = (id) => {
    setTaskDeleteId(id);
    setShowTaskDeleteModal(true);
  };

  const confirmTaskDelete = async () => {
    try {
      await axios.delete(`${APIBase}/delete-task/${taskDeleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Task deleted successfully");
      // ✅ Remove from UI instantly
      setTasks((prev) => prev.filter((t) => t.id !== taskDeleteId));
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete task");
    } finally {
      setShowTaskDeleteModal(false);
      setTaskDeleteId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();

    fd.append("task_name", formData.task_name);
    fd.append("status", formData.status);
    fd.append("priority", formData.priority);
    fd.append("recurring_type", formData.recurring_type);
    fd.append("repeat_every", formData.repeat_every);
    fd.append("description", formData.description);
    fd.append("assignee", formData.assignee);
    fd.append("template", formData.template);
    fd.append("start_date", startDate);
    fd.append("due_date", dueDate);
    fd.append("related_to", relatedTo);
    fd.append("related_value", secondValue);
    fd.append("created_by_id", localStorage.getItem("id"));
    fd.append("created_by_name", localStorage.getItem("username"));

    existingFiles.forEach((file) => fd.append("existing_files[]", file.id));
    removedFiles.forEach((id) => fd.append("removed_files[]", id));
    newFiles.forEach((item) => fd.append("files", item.file));

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      setIsSubmitting(true); // ✅ START

      if (editId) {
        await axios.put(`${APIBase}/update/${editId}`, fd, config);
        toast.success("Task updated successfully!");
      } else {
        await axios.post(`${APIBase}/insert`, fd, config);
        toast.success("Task added successfully!");
      }

      resetForm();
      setNewFiles([]);
      fetchData();
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsSubmitting(false); // ✅ STOP
    }
  };

  // Standardized Pagination Calculations
  const filteredByTab = activeTab === "All" ? tasks : tasks.filter((t) => t.status_name === activeTab);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredByTab.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredByTab.length / itemsPerPage);

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

  // Asignee dropdown api calling
  useEffect(() => {
    const fetchAsignee = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
          params: { status: 1 },
        });

        const cleanedData = (res.data.data || []).map((item) => ({
          ...item,
          name: item.name.split(" ")[0], // Only first name
        }));

        setAsignee(cleanedData);
      } catch (err) {
        console.error("Failed to fetch names:", err);
        setAsignee([]); // fallback
      }
    };

    fetchAsignee();
  }, []);

  // Asignee dropdown api calling
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
          params: { status: 1 },
        });

        setUsers(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch names:", err);
        setAsignee([]); // fallback
      }
    };

    fetchUsers();
  }, []);

  // Related Option Maping
  const RELATED_API_MAP = {
    Contract: `${API_BASE}/api/contract-types/contracts`,
    Quotation: "",
    Lead: "",
    Inquiry: "",
    Customer: `${API_BASE}/api/customers/customer-name`,
  };

  // Fetch Api's For related_to
  useEffect(() => {
    if (!relatedTo) {
      setSecondOptions([]);
      return;
    }

    const apiUrl = RELATED_API_MAP[relatedTo];

    // If no endpoint configured for this option yet, show empty
    if (!apiUrl) {
      setSecondOptions([]);
      return;
    }

    const fetchOptions = async () => {
      try {
        const res = await axios.get(apiUrl, { params: { status: 1 } });

        // Safely extract an array from whatever shape the API returns
        const raw =
          res.data?.data ||   // { data: [...] }
          res.data?.result || // { result: [...] }
          res.data;           // bare array

        // Always store an array — never an object or string
        setSecondOptions(Array.isArray(raw) ? raw : []);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
        setSecondOptions([]);
      }
    };

    fetchOptions();
  }, [relatedTo]);

  // Model for Upload Files
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState([]);

  const MAX_FILES = 5;

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);

    const totalAlreadySelected = existingFiles.length + newFiles.length;

    let remainingSlots = MAX_FILES - totalAlreadySelected;

    if (remainingSlots <= 0) {
      toast.error("You cannot upload more than 5 files");
      e.target.value = "";
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (remainingSlots <= 0) {
        toast.error("You cannot select more than 5 files");
        break;
      }

      const ext = file.name.split(".").pop().toLowerCase();

      //  Duplicate check
      const isDuplicate =
        existingFiles.some((f) => f.file_name === file.name) ||
        newFiles.some((f) => f.file.name === file.name) ||
        validFiles.some((f) => f.file.name === file.name);

      if (isDuplicate) {
        toast.error(`File is already uploaded`);
        continue;
      }

      //  Unsupported type
      if (![...IMAGE_EXT, ...DOC_EXT].includes(ext)) {
        toast.error("Unsupported file type");
        continue;
      }

      //  Image size
      if (IMAGE_EXT.includes(ext) && file.size > MAX_IMG_SIZE) {
        toast.error("Image exceeds allowed 5 MB");
        continue;
      }

      //  Document size
      if (DOC_EXT.includes(ext) && file.size > MAX_DOC_SIZE) {
        toast.error("Document exceeds allowed 15 MB");
        continue;
      }

      // Valid file
      validFiles.push({ file, id: crypto.randomUUID() });
      remainingSlots--;
    }

    if (validFiles.length) {
      setNewFiles((prev) => [...prev, ...validFiles]);
    }

    e.target.value = "";
  };

  // Drag drop
  const handleDrop = (e) => {
    e.preventDefault();

    handleSelect({
      target: {
        files: e.dataTransfer.files,
        value: "",
      },
    });
  };

  // Remove specific file
  const handleRemoveFile = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/tasks/delete/${id}`);

      if (response.data.success) {
        setExistingFiles((prev) => prev.filter((f) => f.id !== id));

        toast.success("File deleted");
        setShowDeleteModal(false);
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Something went wrong while deleting");
    }
  };

  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const IMAGE_EXT = ["jpg", "jpeg", "png"];
  const DOC_EXT = ["pdf", "txt", "doc", "xlsx", "csv", "pptx"];
  const MAX_IMG_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15 MB

  // delete functionality

  const confirmDelete = (id) => {
    setFileToDelete(id);
    setShowDeleteModal(true);
  };

  // API for Dynamic Status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/task-status/read`, {
          params: { status: 1 },
        });

        setStatus(res.data.data || res.data);
      } catch (err) {
        console.error("Failed to fetch Status:", err);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="bg-gray-100">
      <Header />
      {/* Breadcrumb */}
      <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0">
        <div className="hidden sm:flex items-center text-gray-700 w-full lg:w-auto">
          <p className="flex items-center flex-wrap">
            <Link
              href="/dashboard"
              className="mx-2 text-xl text-gray-400 hover:text-indigo-600"
            >
              <i className="bi bi-house"></i>
            </Link>
            <i className="bi bi-chevron-right text-[10px]"></i>
            <Link
              href="#"
              className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
            >
              Tasks
            </Link>
            <i className="bi bi-chevron-right text-[10px]"></i>
            <Link
              href="#"
              className="mx-2 text-md text-gray-700 hover:text-indigo-600 "
            >
              Tasks List
            </Link>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <input
            type="text"
            placeholder="🔍 Search..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border w-full sm:w-64 p-2 px-3 border-gray-300 text-gray-700 placeholder-gray-400 rounded-sm  outline-none  transition-all text-sm   focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Export Button */}
            <div className="relative flex-1 sm:flex-none" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-orange-50 text-orange-500 text-sm font-bold tracking-wide transition-all shadow-sm border border-orange-100"
              >
                <i className="bi bi-download text-base"></i>
                Export
                <i
                  className={`bi bi-chevron-down text-xs transition-transform duration-200 ${
                    showExportMenu ? "rotate-180" : ""
                  }`}
                ></i>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-excel text-green-600 text-base"></i>
                    Export Excel
                  </button>

                  <div className="h-px bg-gray-100"></div>

                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all text-left"
                  >
                    <i className="bi bi-file-earmark-pdf text-red-600 text-base"></i>
                    Export PDF
                  </button>
                </div>
              )}
            </div>

            {/* Add Task Button */}
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all text-center cursor-pointer"
            >
              + ADD TASK
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-6 md:hidden mt-3 relative z-40">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full flex items-center justify-between text-orange-500 font-semibold bg-orange-50 px-4 py-2 rounded-sm border border-orange-200 shadow-sm transition-all"
        >
          <span className="flex items-center gap-2">
            <i className="bi bi-funnel"></i> Filters
          </span>
          <i
            className={`bi bi-chevron-down transition-transform ${showMobileFilters ? "rotate-180" : ""}`}
          ></i>
        </button>
      </div>

      <div
        className={`
        ${showMobileFilters ? "absolute left-6 right-6 top-50 bg-white p-5 shadow-2xl border border-gray-100 z-50 rounded-lg grid grid-cols-2 gap-3 mt-1" : "hidden"} 
        md:mx-6 md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2 md:mt-3 md:mb-5 md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
      `}
      >
        <input
          type="text"
          name="task_name"
          placeholder="Task Name"
          value={filters.task_name || ""}
          onChange={(e) =>
            setFilters({ ...filters, task_name: e.target.value })
          }
          className="p-2 w-full md:w-52 border border-indigo-400 md:border text-gray-600 bg-white rounded-sm  transition-all outline-none text-sm"
        />

        {/* Status */}
        <select
          name="status"
          value={filters.status || ""}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="p-2 w-full md:w-52 border border-indigo-400 md:border text-gray-400 bg-white rounded-sm  transition-all outline-none text-sm"
        >
          <option value="">Status</option>

          {status.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        {/* Priority */}
        <select
          name="priority"
          value={filters.priority || ""}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="p-2 w-full md:w-52 border border-indigo-400 md:border text-gray-400 bg-white rounded-sm  transition-all outline-none text-sm"
        >
          <option value="">Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Assignee - dynamic API */}
        <select
          name="assignee"
          value={filters.assignee || "-"}
          onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
          className="p-2 w-full md:w-52 border border-indigo-400 md:border text-gray-400 bg-white rounded-sm  transition-all outline-none text-sm"
        >
          <option value="">Assignee</option>

          {asignee.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        {/* Start Date Range */}
        <div className="p-1 w-full md:w-54 border border-indigo-400 md:border  text-gray-400 bg-white rounded-sm  transition-all outline-none">
          <span className="text-[10px] text-gray-400 uppercase font-bold pt-1 mx-2">
            Start Date
          </span>
          <input
            type="date"
            value={filters.start_date || ""}
            onChange={(e) =>
              setFilters({ ...filters, start_date: e.target.value })
            }
            className="p-1 w-full md:w-32 outline-none text-sm"
          />
        </div>
        {/* Due Date Range */}
        <div className="p-1 w-full md:w-54 border border-indigo-400 md:border  text-gray-400 bg-white rounded-sm  transition-all outline-none">
          <span className="text-[10px] text-gray-400 uppercase font-bold pt-1 mx-2">
            Due Date
          </span>
          <input
            type="date"
            value={filters.end_date || ""}
            onChange={(e) =>
              setFilters({ ...filters, end_date: e.target.value })
            }
            className="p-1 w-full md:w-32 outline-none text-sm"
          />
        </div>

        {/* Created By - dynamic API */}
        <select
          name="created_by_name"
          value={filters.created_by_name || ""}
          onChange={(e) =>
            setFilters({ ...filters, created_by_name: e.target.value })
          }
          className="p-2 w-full md:w-52 border border-indigo-400 md:border text-gray-400 bg-white rounded-sm  transition-all outline-none text-sm"
        >
          <option value="">Select Created By</option>

          {users.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>

        {/* created Date Range */}
        <div className="p-1 w-full md:w-62 border border-indigo-400 md:border  text-gray-400 bg-white rounded-sm  transition-all outline-none">
          <span className="text-[10px] text-gray-400 uppercase font-bold pt-1 mx-2">
            Created Date
          </span>
          <input
            type="date"
            value={filters.created_at || ""}
            onChange={(e) =>
              setFilters({ ...filters, created_at: e.target.value })
            }
            className="p-1 w-full md:w-32 outline-none text-sm"
          />
        </div>

        {/* CLEAR BUTTON */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFilters({
                task_name: "",
                status: "",
                priority: "",
                start_date: "",
                end_date: "",
                assignee: "",
                created_by_name: "",
                created_at: "",
              });
              setShowMobileFilters(false);
            }}
            className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300 text-md text-center px-6"
          >
            Clear
          </button>
          <button
            onClick={() => setShowMobileFilters(false)}
            className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 text-md text-center px-6"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Tabs + Table */}
      <form className="px-7 pb-4">
        <div className="bg-white rounded-sm border border-gray-100 py-2">

          {/* Tab Bar */}
          <div className="flex items-center gap-8 px-6 pt-4 border-b border-gray-100 flex-wrap">
            {[
              { label: "All Tasks", key: "All", color: "blue", count: tasks.length },
              ...Array.from(new Set(tasks.map((t) => t.status_name).filter(Boolean))).map((s) => ({
                label: s,
                key: s,
                color: s === "Won" || s === "Completed" || s === "Done" ? "green"
                  : s === "Lost" || s === "Cancelled" ? "red"
                  : s === "Pending" ? "blue"
                  : "blue",
                count: tasks.filter((t) => t.status_name === s).length,
              })),
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                className={`pb-3 px-3 text-sm font-medium relative cursor-pointer transition-all
                  ${activeTab === tab.key
                    ? tab.color === "green" ? "text-green-600"
                    : tab.color === "red" ? "text-red-600"
                    : "text-blue-600"
                    : "text-gray-400 hover:text-gray-600"}`}
              >
                {tab.label}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full
                  ${activeTab === tab.key
                    ? tab.color === "green" ? "bg-green-100 text-green-600"
                    : tab.color === "red" ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400"}`}>
                  {tab.count}
                </span>
                {activeTab === tab.key && (
                  <div className={`absolute bottom-0 left-0 w-full h-0.5
                    ${tab.color === "green" ? "bg-green-600"
                    : tab.color === "red" ? "bg-red-600"
                    : "bg-blue-600"}`}></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            <div
              className="overflow-x-auto overflow-y-scroll max-h-[500px] custom-scroll"
              style={{ overflowX: "scroll" }}
            >
          <table className="w-full text-sm text-left text-gray-700 border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">#</th>
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">
                  Task Name <span className="text-gray-300 ml-0.5">↑↓</span>
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">
                  Start Date <span className="text-gray-300 ml-0.5">↑↓</span>
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">
                  Due Date <span className="text-gray-300 ml-0.5">↑↓</span>
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">
                  Priority <span className="text-gray-300 ml-0.5">↑↓</span>
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">
                  Assignee <span className="text-gray-300 ml-0.5">↑↓</span>
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">
                  Status <span className="text-gray-300 ml-0.5">↑↓</span>
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">
                  Created <span className="text-gray-300 ml-0.5">↑↓</span>
                </th>
                <th className="py-3 px-3 text-left text-xs font-semibold text-gray-500">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                currentData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-indigo-50/30 transition-all"
                  >
                    <td className="py-3 px-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="font-medium px-2">
                      <div className="flex items-center gap-2">
                        {item.task_name}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      {item.start_date
                        ? new Date(item.start_date)
                            .toLocaleDateString("en-GB")
                            .replace(/\//g, "-")
                        : "-"}
                    </td>

                    <td className="py-3 px-3 text-gray-500">
                      {item.due_date
                        ? new Date(item.due_date)
                            .toLocaleDateString("en-GB")
                            .replace(/\//g, "-")
                        : "-"}
                    </td>

                    <td className="py-3 px-4 text-lg">
                      {[
                        ...Array(
                          item.priority === "High"
                            ? 3
                            : item.priority === "Medium"
                              ? 2
                              : item.priority === "Low"
                                ? 1
                                : 0,
                        ),
                      ].map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}

                      {[
                        ...Array(
                          3 -
                            (item.priority === "High"
                              ? 3
                              : item.priority === "Medium"
                                ? 2
                                : item.priority === "Low"
                                  ? 1
                                  : 0),
                        ),
                      ].map((_, i) => (
                        <span key={i} style={{ opacity: 0.3 }}>
                          ⭐
                        </span>
                      ))}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 flex-wrap">
                      {String(item.assignee)
                        .split(",")
                        .map((name, i) => {
                          const letter = name.trim().charAt(0).toUpperCase();
                          return (
                            <div
                              key={i}
                              title={name.trim()}
                              className="px-3 py-1.5 bg-blue-800 text-white rounded-full font-semibold text-sm flex justify-center items-center min-w-[28px] text-center select-none"
                            >
                              {letter}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`border rounded-sm px-3 py-1 text-xs font-semibold outline-none
                        ${item.status_name === "Pending" ? "border-gray-200 bg-gray-50 text-gray-700" : ""}
                        ${item.status_name === "Won" || item.status_name === "Completed" || item.status_name === "Done" ? "border-green-200 bg-green-50 text-green-700" : ""}
                        ${item.status_name === "Lost" || item.status_name === "Cancelled" ? "border-red-200 bg-red-50 text-red-700" : ""}
                        ${!["Pending","Won","Completed","Done","Lost","Cancelled"].includes(item.status_name) ? "border-blue-200 bg-blue-50 text-blue-700" : ""}
                      `}>
                        {item.status_name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-500 w-50">
                      {item.created_by_name} | {formatDateTime(item.created_at)}
                    </td>

                    <td className="text-lg">
                      <div className="flex items-center gap-2 flex-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-gray-400 hover:text-green-600 cursor-pointer"
                          title="View"
                        >
                          <i className="bi bi-eye text-xl"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-gray-400 hover:text-blue-800 cursor-pointer"
                          title="Edit"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                          title="Delete"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-gray-500 py-3">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION — matches leads page layout */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-white">

            {/* Left: Showing entries info */}
            <p className="text-sm text-blue-600 font-medium whitespace-nowrap">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredByTab.length)} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredByTab.length)} of{" "}
              {filteredByTab.length} entries
            </p>

            {/* Center: Page navigation */}
            <div className="flex items-center gap-1.5">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <i className="bi bi-chevron-left text-xs"></i>
              </button>

              {/* Page Buttons */}
              {getSlidingPages().map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-semibold transition-all ${
                    currentPage === page
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <i className="bi bi-chevron-right text-xs"></i>
              </button>
            </div>

            {/* Right: Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
              >
                {[10, 20, 100, 200].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

          </div>
            </div>
          </div>
        </div>
      </form>

      {/* Add / Edit Task — SlideOver Panel */}
      <SlideOverModal
        isOpen={showForm}
        onClose={() => {
          resetForm();
          setExistingFiles([]);
        }}
        widthClass="w-[800px]"
      >
        {/* ── HEADER ── */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start gap-3">
              {/* Icon badge */}
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-200">
                <i className="bi bi-plus-lg text-white text-xl font-bold"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-gray-900 leading-tight">
                  {editId ? "Edit" : "Add"} Task
                </h3>
                <p className="text-[11px] text-gray-8 00 mt-0.5">
                  {editId ? "Update the task details below" : "Fill in the details to create a new task"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setExistingFiles([]);
                }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all flex-shrink-0"
              >
                <i className="bi bi-x text-base leading-none"></i>
              </button>
            </div>
            {/* Blue underline accent */}
            
          </div>
        </div>

        {/* ── FORM CONTENT ── */}
        <div className="p-6 pt-4">
          <form onSubmit={handleSubmit}>

            {/* Task Name */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Task Name <span className="text-red-500">*</span>
              </label>
              <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <span className="flex items-center justify-center w-10 shrink-0 bg-indigo-50 border-r border-gray-100">
                  <i className="bi bi-pencil-square text-indigo-500 text-sm"></i>
                </span>
                <input
                  type="text"
                  name="task_name"
                  value={formData.task_name}
                  onChange={handleChange}
                  placeholder="Enter task name"
                  className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            {/* Start Date & Due Date */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-center justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100">
                    <i className="bi bi-calendar3 text-blue-500 text-sm"></i>
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDueDate("");
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                    <i className="bi bi-calendar-check text-violet-500 text-sm"></i>
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    min={startDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-center justify-center w-10 shrink-0 bg-green-50 border-r border-gray-100">
                    <i className="bi bi-shield-check text-green-500 text-sm"></i>
                  </span>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    required
                  >
                    {status.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-center justify-center w-10 shrink-0 bg-red-50 border-r border-gray-100">
                    <i className="bi bi-flag-fill text-red-400 text-sm"></i>
                  </span>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    required
                  >
                    <option value=""> --Select-- </option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recurring Type & Repeat Every */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Recurring Type <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-center justify-center w-10 shrink-0 bg-cyan-50 border-r border-gray-100">
                    <i className="bi bi-arrow-repeat text-cyan-500 text-sm"></i>
                  </span>
                  <select
                    name="recurring_type"
                    value={formData.recurring_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    required
                  >
                    <option value="">-- Select --</option>
                    <option>Day</option>
                    <option>Week</option>
                    <option>Month</option>
                    <option>Year</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Repeat Every <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-center justify-center w-10 shrink-0 bg-orange-50 border-r border-gray-100">
                    <i className="bi bi-hash text-orange-400 text-sm"></i>
                  </span>
                  <select
                    name="repeat_every"
                    value={formData.repeat_every}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    required
                  >
                    <option value="">-- Select --</option>
                    {[6, 5, 4, 3, 2, 1].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Related To & Second Dropdown */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Related To <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-center justify-center w-10 shrink-0 bg-yellow-50 border-r border-gray-100">
                    <i className="bi bi-link-45deg text-yellow-500 text-sm"></i>
                  </span>
                  <select
                    value={relatedTo}
                    onChange={(e) => {
                      setRelatedTo(e.target.value);
                      setSecondValue("");
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    required
                  >
                    <option value="">-- Select --</option>
                    <option>Contract</option>
                    <option>Quotation</option>
                    <option>Lead</option>
                    <option>Inquiry</option>
                    <option>Customer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  {relatedTo || "Select"} <span className="text-red-500">*</span>
                </label>
                {relatedTo ? (
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-teal-50 border-r border-gray-100">
                      <i className="bi bi-database text-teal-500 text-sm"></i>
                    </span>
                    <select
                      className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                      value={secondValue}
                      onChange={(e) => setSecondValue(e.target.value)}
                      required
                    >
                      <option value="">-- Select --</option>
                      {secondOptions.length > 0 ? (
                        secondOptions.map((item) => (
                          <option
                            key={item.id}
                            value={item.name || item.customer_name}
                          >
                            {item.name || item.customer_name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No data found</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-stretch border border-dashed border-indigo-200 rounded-lg overflow-hidden bg-indigo-50">
                    <span className="flex items-center justify-center w-10 shrink-0 bg-indigo-100 border-r border-indigo-100">
                      <i className="bi bi-database text-indigo-300 text-sm"></i>
                    </span>
                    <span className="px-3 py-2 text-sm text-indigo-300">Select Related To first</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignee & Template */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Assignee <span className="text-red-500">*</span>
                </label>
                <Select
                  isMulti
                  options={asignee.map((item) => ({
                    value: item.name,
                    label: item.name,
                  }))}
                  value={
                    formData.assignee
                      ? formData.assignee.split(",").map((n) => ({
                          label: n.trim(),
                          value: n.trim(),
                        }))
                      : []
                  }
                  onChange={(selected) => {
                    const names = selected.map((s) => s.value).join(",");
                    setFormData({ ...formData, assignee: names });
                  }}
                  placeholder="Select Assignee"
                  className="w-full"
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
                      boxShadow: state.isFocused ? "0 0 0 2px rgba(99,102,241,0.1)" : "none",
                      "&:hover": { borderColor: "#6366f1" },
                      minHeight: "42px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: "white",
                      borderRadius: "8px",
                      overflow: "hidden",
                      padding: "4px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                      border: "1px solid #e5e7eb",
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      fontSize: "14px",
                      backgroundColor: state.isSelected
                        ? "#6366f1"
                        : state.isFocused
                          ? "#eef2ff"
                          : "#ffffff",
                      color: state.isSelected ? "#ffffff" : "#374151",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      ":active": {
                        ...provided[":active"],
                        backgroundColor: "#6366f1",
                      },
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: "#9ca3af",
                      fontSize: "14px",
                    }),
                    multiValue: (provided) => ({
                      ...provided,
                      backgroundColor: "#eef2ff",
                      borderRadius: "4px",
                    }),
                    multiValueLabel: (provided) => ({
                      ...provided,
                      color: "#6366f1",
                      fontWeight: "600",
                      fontSize: "12px",
                    }),
                    multiValueRemove: (provided) => ({
                      ...provided,
                      color: "#6366f1",
                      "&:hover": {
                        backgroundColor: "#6366f1",
                        color: "#fff",
                      },
                    }),
                  }}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Template
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <span className="flex items-center justify-center w-10 shrink-0 bg-violet-50 border-r border-gray-100">
                    <i className="bi bi-file-earmark-text text-violet-500 text-sm"></i>
                  </span>
                  <select
                    name="template"
                    value={formData.template}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent"
                    required
                  >
                    <option value="">-- Select --</option>
                    <option>N/A</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-600">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <span className="flex items-start justify-center w-10 shrink-0 bg-blue-50 border-r border-gray-100 pt-2.5">
                  <i className="bi bi-card-text text-blue-500 text-sm"></i>
                </span>
                <textarea
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter description of the task..."
                  className="w-full px-3 py-2 text-sm text-gray-700 focus:outline-none bg-transparent resize-none"
                  required
                ></textarea>
              </div>
            </div>

            {/* Select Files */}
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                <i className="bi bi-paperclip text-indigo-500 text-xs"></i>
                Select Files <span className="text-red-400">*</span>
              </label>
              <div
                className="border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/40 text-center py-6 px-4 cursor-pointer hover:bg-indigo-50 transition-all"
                onClick={() => setShowModal(true)}
              >
                <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-2 shadow-md shadow-indigo-200">
                  <i className="bi bi-cloud-arrow-up text-white text-lg"></i>
                </span>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Drag &amp; drop files here or click to browse
                </p>
                <p className="text-xs text-gray-800 mb-2">
                  Upload supporting documents or images (Max 2MB)
                </p>
                <div className="flex justify-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">JPG</span>
                  <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">PNG</span>
                  <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">PDF</span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-500 text-[10px] font-bold">TXT</span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 text-[10px] font-bold">DOC</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold">XLSX</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">CSV</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-[10px] font-bold">PPTX</span>
                </div>
                <button
                  type="button"
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 mx-auto transition-all shadow-md shadow-indigo-200"
                  onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                >
                  <i className="bi bi-folder2-open"></i> Browse Files
                </button>
              </div>
            </div>

            {/* Existing Files */}
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                <i className="bi bi-folder text-indigo-500 text-xs"></i>
                Existing Files
              </label>
              <div className="space-y-1">
                {existingFiles.map((f) => (
                  <div key={f.id} className="flex justify-between items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                    <a href={f.file_path} target="_blank" className="text-sm text-indigo-600 hover:underline truncate">
                      <i className="bi bi-file-earmark mr-1.5"></i>
                      {f.file_name}
                    </a>
                    <button
                      type="button"
                      className="text-gray-400 text-sm hover:text-red-500 ml-2 flex-shrink-0"
                      onClick={() => confirmDelete(f.id)}
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* File Delete Confirm Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-900/30 z-50">
                <div className="bg-white p-6 rounded-xl shadow-lg w-80 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <i className="bi bi-trash3 text-red-500 text-lg"></i>
                  </div>
                  <h2 className="text-base font-bold mb-1 text-gray-800">Confirm Delete</h2>
                  <p className="text-sm text-gray-500 mb-5">Are you sure you want to delete this file?</p>
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(fileToDelete)}
                      className="px-5 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD MODAL */}
            {showModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                <div className="w-[650px] bg-white rounded-xl shadow-xl overflow-hidden">
                  <div className="p-4 flex justify-between items-center border-b border-gray-100">
                    <h2 className="text-indigo-600 text-base font-bold flex items-center gap-2">
                      <i className="bi bi-cloud-arrow-up text-lg"></i> Upload Files
                    </h2>
                    <X
                      className="text-gray-400 hover:text-gray-700 cursor-pointer transition-all"
                      size={20}
                      onClick={() => setShowModal(false)}
                    />
                  </div>

                  <div className="flex justify-between">
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-indigo-200 m-6 p-8 text-center rounded-xl bg-indigo-50/40 hover:bg-indigo-50 transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="bi bi-cloud-arrow-up text-indigo-500 text-lg"></i>
                      </div>
                      <p className="font-semibold text-gray-700 mt-1">DRAG FILES HERE</p>
                      <p className="text-gray-500 mt-1 text-sm">
                        OR{" "}
                        <label className="text-indigo-600 underline cursor-pointer font-medium">
                          SELECT FILE
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleSelect}
                          />
                        </label>
                      </p>
                    </div>

                    <div className="max-h-52 overflow-y-auto px-6 pb-4 mt-4 space-y-8 custom-scroll">
                      {/* Newly Added Files */}
                      {newFiles.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-3 border border-gray-200 p-3 mb-3 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {f.file.type.includes("image") ? (
                              <FileImage size={35} className="text-indigo-500" />
                            ) : (
                              <FileText size={35} className="text-indigo-500 text-sm" />
                            )}
                            <p className="truncate max-w-[240px] text-sm text-gray-700">
                              {f.file.name}
                            </p>
                          </div>
                          <X
                            size={22}
                            className="text-gray-400 hover:text-red-400 cursor-pointer"
                            onClick={() =>
                              setNewFiles(
                                newFiles.filter((file) => file.id !== f.id),
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 flex justify-end border-t border-gray-100">
                    <button
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md shadow-indigo-200"
                      onClick={() => setShowModal(false)}
                    >
                      <i className="bi bi-check2"></i> Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer note */}
            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 mb-4">
              <i className="bi bi-info-circle text-indigo-400"></i>
              All fields marked with <span className="text-red-400 font-bold">*</span> are required
            </p>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setExistingFiles([]);
                    }}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5"
                  >
                    <i className="bi bi-x-lg text-xs"></i> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-200 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
                        <path fill="white" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <i className="bi bi-check2-circle text-sm"></i>
                    )}
                    {editId ? "Update Task" : "Add Task"}
                  </button>
                </div>
          </form>
        </div>
      </SlideOverModal>

      {/* Task Delete Confirmation Modal */}
      {showTaskDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex justify-center items-center">
          <div className="bg-white rounded-2xl shadow-2xl w-[420px] relative overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <i className="bi bi-trash3 text-red-500 text-sm"></i>
                </div>
                <span className="text-sm font-bold tracking-widest text-gray-800 uppercase">
                  Delete Task
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTaskDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-8 flex flex-col items-center">
              {/* Large trash icon */}
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
                <i className="bi bi-trash3 text-red-500 text-3xl"></i>
              </div>

              {/* Task name */}
              <h3 className="text-center text-lg font-extrabold text-gray-900 uppercase tracking-wide mb-2">
                {tasks.find((t) => t.id === taskDeleteId)?.task_name || "This Task"}
              </h3>

              {/* Red underline divider */}
              <div className="w-10 h-0.5 bg-red-500 rounded-full mb-3"></div>

              {/* Warning text */}
              <p className="text-center text-sm text-gray-900 leading-relaxed mb-7">
                This action cannot be undone.<br />
                Are you sure you want to delete this task?
              </p>

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowTaskDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <i className="bi bi-x-lg text-xs"></i> Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmTaskDelete}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-red-200"
                >
                  <i className="bi bi-trash3"></i> Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
