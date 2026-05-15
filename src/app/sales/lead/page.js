"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "redaxios";
import Link from "next/link";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { checkRole } from "@/utils/checkRole";
import useAuth from "@/app/components/useAuth";

export default function Page() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  const router = useRouter();

  // Multer Required Hooks

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [showModal, setShowModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [previewFollowUp, setPreviewFollowUp] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLead, setViewLead] = useState(null);

  const [updateForm, setUpdateForm] = useState({
    follow_up_date: "",
    activity_type: "",
    follow_up_by: "",
    contact_person: "",
    description: "",
  });

  const [form, setForm] = useState({
    follow_up_date: "",
    activity_type: "",
    follow_up_by: "",
    contact_person: "",
    description: "",
  });

  useAuth();

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/lead/read`);

      const formatted = (res.data?.result || []).map((item) => {
        let finalStatus = "Pending";
        if (item.status === "Won") {
          finalStatus = "Won";
        } else if (item.status === "Lost") {
          finalStatus = "Lost";
        } else {
          finalStatus = "Pending";
        }
        return {
          ...item,
          status: finalStatus,
        };
      });

      setLeads(formatted);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

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

  // ===================================================
  // ✅ EXPORT TO EXCEL
  // ===================================================

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const exportData = filteredLeads.map((lead, index) => ({
        "No.": index + 1,
        "Company Name": lead.company_name || "",
        "Customer Name": lead.customer_name || "",
        "Lead Title": lead.lead_title || "",
        "Product Category": lead.product_category || "",
        Source: lead.source || "",
        Assignee: lead.assignee || "",
        "Next Follow Up": lead.next_follow_up_date
          ? new Date(lead.next_follow_up_date).toLocaleDateString()
          : "",
        "Created At": lead.created_at
          ? new Date(lead.created_at).toLocaleDateString()
          : "",
        Status: lead.status || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet["!cols"] = colWidths;

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5);
      const fileName = `Leads_${activeTab}_(${date})_${time}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success("Excel exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.log(err);
      toast.error("Excel export failed");
    }
  };

  // ===================================================
  // ✅ EXPORT TO PDF
  // ===================================================

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`Leads Report - ${activeTab}`, 14, 15);

      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Exported on: ${new Date().toLocaleDateString("en-GB")}   |   Total Records: ${filteredLeads.length}`,
        14,
        22,
      );

      const tableData = filteredLeads.map((lead, index) => [
        index + 1,
        lead.company_name || "",
        lead.customer_name || "",
        lead.lead_title || "",
        lead.product_category || "",
        lead.source || "",
        lead.assignee || "",
        lead.next_follow_up_date
          ? new Date(lead.next_follow_up_date).toLocaleDateString()
          : "",
        lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "",
        lead.status || "",
      ]);

      autoTable(doc, {
        startY: 27,
        head: [
          [
            "#",
            "Company",
            "Customer",
            "Lead Title",
            "Product Cat.",
            "Source",
            "Assignee",
            "Next Follow Up",
            "Created",
            "Status",
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
          fillColor: [234, 88, 12],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [255, 247, 237],
        },
        columnStyles: {
          0: { cellWidth: 8 },
          3: { cellWidth: 35 },
          9: { cellWidth: 20 },
        },
      });

      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5).replace("_", "-");
      const fileName = `Leads_${activeTab}_(${date})_${time}.pdf`;

      doc.save(fileName);
      toast.success("PDF exported successfully");
      setShowExportMenu(false);
    } catch (err) {
      console.log(err);
      toast.error("PDF export failed");
    }
  };

  // functions for multer functionality

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleSelect({ target: { files: e.dataTransfer.files, value: "" } });
  };

  const MAX_FILES = 5;
  const IMAGE_EXT = ["jpg", "jpeg", "png"];
  const DOC_EXT = ["pdf"];
  const MAX_IMG_SIZE = 2 * 1024 * 1024;
  const MAX_DOC_SIZE = 2 * 1024 * 1024;

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);
    let updatedFiles = [...selectedFiles];
    let remainingSlots = MAX_FILES - updatedFiles.length;

    if (remainingSlots <= 0) {
      toast.error("You can upload only 5 files ");
      e.target.value = "";
      return;
    }

    for (let file of files) {
      if (remainingSlots <= 0) {
        toast.error("Maximum 5 files allowed ");
        break;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      const isDuplicate = updatedFiles.some(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (isDuplicate) {
        toast.error("Duplicate file not allowed ");
        continue;
      }
      if (![...IMAGE_EXT, ...DOC_EXT].includes(ext)) {
        toast.error("Only JPG, PNG, PDF allowed ");
        continue;
      }
      if (IMAGE_EXT.includes(ext) && file.size > MAX_IMG_SIZE) {
        toast.error("Image must be under 2MB ");
        continue;
      }
      if (DOC_EXT.includes(ext) && file.size > MAX_DOC_SIZE) {
        toast.error("PDF must be under 2MB ");
        continue;
      }
      updatedFiles.push(file);
      remainingSlots--;
    }

    setSelectedFiles(updatedFiles);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    try {
      if (!form.activity_type || !form.contact_person || !form.description) {
        toast.error("Please fill all required fields");
        return;
      }

      setBtnLoading(true);

      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (key !== "files") formData.append(key, form[key]);
      });

      formData.append("lead_id", selectedLead.lead_id);
      formData.append("status", "Pending");
      formData.append("remarks", "");

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => formData.append("files", file));
      }

      await axios.post(`${API_BASE}/api/lead-follow-up/insert`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Follow-up added");

      setShowModal(false);
      setSelectedFiles([]);

      fetchLeads();
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong");
    } finally {
      setBtnLoading(false);
    }
  };

  const openUpdateModal = async (lead) => {
    setSelectedLead(lead);
    setShowUpdateModal(true);
    setFollowUpHistory([]);
    setPreviewFollowUp(null);
    setSelectedFiles([]);

    setUpdateForm({
      follow_up_date: new Date().toISOString().split("T")[0],
      activity_type: "",
      follow_up_by: "",
      contact_person: "",
      description: "",
    });

    try {
      const res = await axios.get(
        `${API_BASE}/api/lead-follow-up/history/${lead.lead_id}`,
      );
      setFollowUpHistory(res.data?.result || []);
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpdate = async () => {
    try {
      if (
        !updateForm.activity_type ||
        !updateForm.contact_person ||
        !updateForm.description
      ) {
        toast.error("Please fill all required fields ");
        return;
      }

      setUpdateLoading(true);

      const formData = new FormData();

      formData.append("lead_id", selectedLead.lead_id);
      formData.append("follow_up_date", updateForm.follow_up_date);
      formData.append("activity_type", updateForm.activity_type);
      formData.append("follow_up_by", updateForm.follow_up_by);
      formData.append("contact_person", updateForm.contact_person);
      formData.append("description", updateForm.description);
      formData.append("status", "Pending");
      formData.append("remarks", "");

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => formData.append("files", file));
      }

      await axios.post(`${API_BASE}/api/lead-follow-up/insert`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("New follow-up added ");

      const res = await axios.get(
        `${API_BASE}/api/lead-follow-up/history/${selectedLead.lead_id}`,
      );

      setFollowUpHistory(res.data?.result || []);
      setPreviewFollowUp(null);

      setUpdateForm({
        follow_up_date: new Date().toISOString().split("T")[0],
        activity_type: "",
        follow_up_by: "",
        contact_person: "",
        description: "",
      });

      setSelectedFiles([]);

      fetchLeads();
    } catch (err) {
      toast.error("Failed to add follow-up ");
      console.log(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const openDeleteModal = (lead) => {
    setLeadToDelete(lead);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!leadToDelete) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${API_BASE}/api/lead/${leadToDelete.lead_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Lead deleted successfully");
      setShowDeleteModal(false);
      setLeadToDelete(null);
      fetchLeads();
    } catch (err) {
      toast.error("Failed to delete lead");
      console.log(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = async (lead) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE}/api/lead/sales/leads/view-leads/${lead.lead_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const leadData = res.data.lead;

      sessionStorage.setItem(
        "editLead",
        JSON.stringify({
          lead_id: leadData.lead_id,
          company_name: leadData.company_name,
          customer_name: leadData.customer_name,
          lead_title: leadData.lead_title,
          source: leadData.source,
          status: leadData.status,
          product_category: leadData.product_category,
          product_name: leadData.product_name,
          priority: leadData.priority,
          assignee: leadData.assignee,
          category: leadData.category,
          description: leadData.description,
        }),
      );

      router.push("/sales/lead/update-lead");
    } catch (error) {
      console.log(error);
    }
  };

  const handleView = async (lead) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE}/api/lead/sales/leads/view-details/${lead.lead_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setViewLead(res.data.lead);
      setShowViewModal(true);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch lead details");
    }
  };

  const handleStatusChange = (lead_id, newStatus) => {
    setSelectedLead(lead_id);
    setSelectedStatus(newStatus);
    setShowPopup(true);
  };

  const confirmStatusChange = async () => {
    try {
      await axios.put(`${API_BASE}/api/lead/update-status/${selectedLead}`, {
        status: selectedStatus,
      },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

      setLeads((prev) =>
        prev.map((lead) =>
          lead.lead_id === selectedLead
            ? { ...lead, status: selectedStatus }
            : lead,
        ),
      );

      setShowPopup(false);
      toast.success("Status Updated");
    } catch (err) {
      console.log(err);
    }
  };

  // ================= FILTER LOGIC =================

  const debounceRef = useRef(null);

  const [filters, setFilters] = useState({
    company_name: "",
    customer_name: "",
    lead_title: "",
    product_category: "",
    source: "",
    assignee: "",
    status: "",
    created_by: "",
    from_created: "",
    to_created: "",
    from_followup: "",
    to_followup: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const searchLeads = async () => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== ""),
      );

      const res = await axios.get(`${API_BASE}/api/lead/sales/leads/filter`, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const formatted = (res.data?.data || []).map((item) => {
        let finalStatus = "Pending";
        if (item.status === "Won") finalStatus = "Won";
        else if (item.status === "Lost") finalStatus = "Lost";
        return {
          ...item,
          status: finalStatus,
        };
      });

      setLeads(formatted);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const hasFilter = Object.values(filters).some((v) => v !== "");

    if (!hasFilter) {
      fetchLeads();
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLeads();
    }, 200);

    return () => clearTimeout(debounceRef.current);
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      company_name: "",
      customer_name: "",
      lead_title: "",
      product_category: "",
      source: "",
      assignee: "",
      status: "",
      created_by: "",
      from_created: "",
      to_created: "",
      from_followup: "",
      to_followup: "",
    });

    fetchLeads();
  };

  // ================= TAB + FILTER MERGE =================

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const filteredLeads = hasActiveFilters
    ? leads
    : leads.filter((l) => {
      if (activeTab === "Pending") {
        return l.status !== "Won" && l.status !== "Lost";
      }
      return l.status === activeTab;
    });

  const pendingCount = leads.filter((l) => l.status === "Pending").length;
  const wonCount = leads.filter((l) => l.status === "Won").length;
  const lostCount = leads.filter((l) => l.status === "Lost").length;

  // ================= PAGINATION =================

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters, tab, or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

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


  // Dynamic Dropdowns

  const companyRef = useRef(null);

  const [assignee, setAssignee] = useState([]);
  const [leadSource, setLeadSource] = useState([]);
  const [leadCategory, setLeadCategory] = useState([]);
  const [category, setCategory] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyname, setCompanyname] = useState([]);
  const [customername, setCustomername] = useState([]);

  useEffect(() => {
    const fetchAssignee = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/manage-user/asignee`, {
          params: { status: 1 },
        });

        const cleanedData = (res.data?.data || res.data || []).map((item) => ({
          ...item,
          name: item.name ? item.name.split(" ")[0] : "",
        }));

        setAssignee(cleanedData);
      } catch (err) {
        console.error("Failed to fetch names:", err);
        setAssignee([]);
      }
    };

    fetchAssignee();
  }, []);

  useEffect(() => {
    const fetchSource = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/inquiry-lead-source/read`,
          { params: { status: 1 } },
        );
        setLeadSource(res.data);
      } catch { }
    };

    fetchSource();
  }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/inquiry-lead-category/read`,
          { params: { status: 1 } },
        );
        setLeadCategory(res.data);
      } catch { }
    };

    fetchCategory();
  }, []);

  useEffect(() => {
    const fetchProductCategory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/product-category/read`, {
          params: { status: 1 },
        });
        setCategory(res.data);
      } catch { }
    };

    fetchProductCategory();
  }, []);

  const isAdmin = checkRole(["Admin"]);

  return (
    <>
      <Header />

      <div className="bg-gray-100 ">
        {/* breadcrumb */}

        <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
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
                href="#"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Sales
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link
                href="/sales/lead"
                className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
              >
                Lead
              </Link>
            </p>
          </div>
          {/* Export Button */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="flex items-center gap-2  bg-orange-50 text-orange-500 px-4 py-2 rounded-sm text-sm font-semibold tracking-wide transition-all shadow-sm"
              >
                <i className="bi bi-download text-base"></i>
                Export
                <i
                  className={`bi bi-chevron-down text-xs transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""
                    }`}
                ></i>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={exportToExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all"
                  >
                    <div className="w-7 h-7 rounded-sm  flex items-center justify-center">
                      <i className="bi bi-file-earmark-excel text-green-600 text-sm"></i>
                    </div>
                    Export Excel
                  </button>

                  <div className="h-px bg-gray-100 mx-3"></div>

                  <button
                    onClick={exportToPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all"
                  >
                    <div className="w-7 h-7 rounded-sm  flex items-center justify-center">
                      <i className="bi bi-file-earmark-pdf text-red-600 text-sm"></i>
                    </div>
                    Export PDF
                  </button>
                </div>
              )}
            </div>

            {/* Add Lead Button */}
            <Link
              href="/sales/lead/add-lead"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-sm text-sm font-semibold shadow-md transition-all"
            >
              + ADD LEAD
            </Link>
          </div>
        </div>

        {/* FILTER SECTION */}

        <div className="mx-6 mb-2 md:hidden mt-3 relative z-40">
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
          md:mx-6 md:mb-3 md:items-center md:gap-2 md:flex-wrap md:flex md:relative md:bg-transparent md:p-0 md:shadow-none md:border-none md:z-auto
        `}
        >
          <input
            name="company_name"
            value={filters.company_name}
            onChange={handleFilterChange}
            ref={companyRef}
            placeholder="Company Name"
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  text-gray-600 text-sm outline-none"
          />

          <input
            name="customer_name"
            value={filters.customer_name}
            onChange={handleFilterChange}
            placeholder="Customer Name"
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  text-gray-600 text-sm outline-none"
          />

          <input
            name="lead_title"
            value={filters.lead_title}
            onChange={handleFilterChange}
            placeholder="Enter Lead Title"
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-600 text-sm"
          />

          <select
            name="product_category"
            value={filters.product_category}
            onChange={handleFilterChange}
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-48  outline-none  text-gray-400 text-sm"
          >
            <option value="">Select Product Category</option>
            {category.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            name="source"
            value={filters.source}
            onChange={handleFilterChange}
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Select Source</option>
            {leadSource.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            name="assignee"
            value={filters.assignee}
            onChange={handleFilterChange}
            className="border bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Select Assignee</option>
            {assignee.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              From Next
            </span>
            <input
              type="date"
              name="from_followup"
              value={filters.from_followup}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-53  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              To Next
            </span>
            <input
              type="date"
              name="to_followup"
              value={filters.to_followup}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="border p-1 bg-white border-orange-300 rounded-sm px-2 py-2 w-full md:w-45  outline-none  text-gray-400 text-sm"
          >
            <option value="">Pending</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-60  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              From Create
            </span>
            <input
              type="date"
              name="from_created"
              value={filters.from_created}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <div className="flex p-1 items-center px-2 border bg-white border-orange-300 rounded-sm w-full md:w-58  outline-none  text-gray-400 text-sm col-span-2 md:col-span-1">
            <span className="mx-1 p-1 text-gray-400 whitespace-nowrap">
              To Create
            </span>
            <input
              type="date"
              name="to_created"
              value={filters.to_created}
              onChange={handleFilterChange}
              className="p-1 w-full md:w-35 outline-none bg-transparent"
            />
          </div>

          <div className="flex gap-2 col-span-2 md:col-span-1">
            <button
              onClick={() => {
                resetFilters();
                setShowMobileFilters(false);
              }}
              className="border border-gray-300 w-full md:w-auto cursor-pointer rounded-sm p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm text-center font-semibold"
            >
              Clear
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden border border-orange-300 w-full cursor-pointer rounded-sm p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm text-center font-semibold"
            >
              Apply
            </button>
          </div>
        </div>

        {/* tabs */}

        <div className="bg-white rounded-sm border border-gray-100  py-2 mx-7">
          <div className="flex items-center gap-8 px-6 pt-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("Pending")}
              className={`pb-3 px-3 text-sm font-medium relative cursor-pointer transition-all ${activeTab === "Pending"
                ? "text-blue-600"
                : "text-gray-400 hover:text-gray-600"
                }`}
            >
              Pending
              <span className="ml-2 bg-blue-100 text-blue-600 cursor-pointer text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
              {activeTab === "Pending" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab("Won")}
              className={`pb-3 text-sm font-medium cursor-pointer relative ${activeTab === "Won" ? "text-green-600" : "text-gray-500"
                }`}
            >
              Won
              <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                {wonCount}
              </span>
              {activeTab === "Won" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab("Lost")}
              className={`pb-3 text-sm font-medium relative ${activeTab === "Lost" ? "text-red-600" : "text-gray-500"
                }`}
            >
              Lost
              <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                {lostCount}
              </span>
              {activeTab === "Lost" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>
              )}
            </button>
          </div>

          {/* table */}

          <div className="p-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : (
              <div
                className="overflow-x-auto overflow-y-scroll max-h-[600px] custom-scroll "
                style={{ overflowX: "scroll" }}
              >
                <table className="w-full text-sm ">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ">
                        Lead Title
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Product Category
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Next Follow Up
                      </th>
                      <th className="py-3 px-3 text-left  text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLeads.length > 0 ? (
                      paginatedLeads.map((lead, index) => (
                        <tr
                          key={lead.lead_id}
                          className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="py-3 px-2">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>

                          <td className="font-medium px-2">
                            {lead.company_name}
                          </td>

                          <td className="text-orange-500 cursor-pointer px-3">
                            {lead.customer_name}
                          </td>

                          <td className="py-3 px-2 w-46 max-w-46 truncate">
                            {lead.lead_title}
                          </td>

                          <td className="text-gray-500 px-3">
                            {lead.product_category || "-"}
                          </td>

                          <td className="px-3">{lead.source}</td>

                          <td
                            style={{
                              display: "flex",
                              gap: "1px",
                              alignItems: "center",
                            }}
                            className="py-2 px-4"
                          >
                            {lead.assignee
                              ? String(lead.assignee)
                                .split(",")
                                .map((name, index) => {
                                  const letter = name
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase();

                                  return (
                                    <div
                                      key={index}
                                      title={name.trim()}
                                      className="px-3 py-1.5 bg-blue-800 text-white rounded-full font-semibold text-sm flex justify-center items-center min-w-[28px] text-center select-none"
                                    >
                                      {letter}
                                    </div>
                                  );
                                })
                              : "-"}
                          </td>

                          <td className=" text-center">
                            {lead.next_follow_up_date ? (
                              <span
                                onClick={() => {
                                  if (lead.status === "Pending") {
                                    openUpdateModal(lead);
                                  }
                                }}
                                className={`${lead.status === "Pending"
                                  ? "cursor-pointer text-blue-800"
                                  : "text-gray-400 cursor-not-allowed"
                                  }`}
                              >
                                {new Date(
                                  lead.next_follow_up_date,
                                ).toLocaleDateString()}
                              </span>
                            ) : (
                              <button
                                disabled={lead.status !== "Pending"}
                                onClick={() => {
                                  if (lead.status !== "Pending") return;
                                  setSelectedLead(lead);
                                  setSelectedFiles([]);
                                  setForm({
                                    follow_up_date: new Date()
                                      .toISOString()
                                      .split("T")[0],
                                    activity_type: "",
                                    follow_up_by: "",
                                    contact_person: "",
                                    description: "",
                                  });
                                  setShowModal(true);
                                }}
                                className={`w-9 h-9 rounded-full border flex items-center justify-center mx-auto
                                  ${lead.status === "Pending"
                                    ? "hover:bg-gray-100 cursor-pointer"
                                    : "bg-gray-100 cursor-not-allowed opacity-60"
                                  }`}
                              >
                                <i className="bi bi-plus text-lg"></i>
                              </button>
                            )}
                          </td>

                          <td className="text-gray-500 px-2">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>

                          <td>
                            <select
                              value={lead.status}
                              onMouseDown={(e) => {
                                if (
                                  !isAdmin &&
                                  (lead.status === "Won" ||
                                    lead.status === "Lost")
                                ) {
                                  e.preventDefault();
                                  toast.error("Only Admin can change Status");
                                }
                              }}
                              onChange={(e) => {
                                handleStatusChange(
                                  lead.lead_id,
                                  e.target.value,
                                );
                              }}
                              className={`border rounded-sm px-3 py-1 text-xs font-semibold outline-none cursor-pointer
                                ${lead.status === "Pending" ? "border-gray-200 bg-gray-50 text-gray-700 cursor-pointer" : ""}
                                ${lead.status === "Won" ? "border-green-200 bg-green-50 text-green-700 cursor-pointer" : ""}
                                ${lead.status === "Lost" ? "border-red-200 bg-red-50 text-red-700 cursor-pointer" : ""}
                              `}
                            >
                              <option value="Pending"> Pending </option>
                              <option value="Won"> Won </option>
                              <option value="Lost"> Lost </option>
                            </select>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-4">
                              {lead.status === "Pending" ? (
                                <>
                                  <button
                                    onClick={() => handleView(lead)}
                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                    title="View Details"
                                  >
                                    <i className="bi bi-eye text-xl"></i>
                                  </button>

                                  <button
                                    onClick={() => handleEdit(lead)}
                                    className="text-gray-400 hover:text-orange-600 transition-colors"
                                    title="Edit Lead"
                                  >
                                    <i className="bi bi-pencil-square text-lg"></i>
                                  </button>

                                  <button
                                    onClick={() => openDeleteModal(lead)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete Lead"
                                  >
                                    <i className="bi bi-trash3 text-lg"></i>
                                  </button>
                                </>
                              ) : (
                                <div className="w-full flex justify-center">
                                  <span className="text-gray-300 cursor-not-allowed bg-gray-50 p-1.5 rounded-full border border-gray-100" title="Lead locked">
                                    <i className="bi bi-lock text-sm"></i>
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="11"
                          className="text-center py-10 text-gray-400"
                        >
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
                  {/* Left side: Rows per page selector */}
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


                  {/* Right side: Navigation buttons (only if totalPages > 1) */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-left text-sm"></i>
                      </button>

                      {/* Page Buttons */}
                      <div className="flex items-center gap-1.5">
                        {getSlidingPages().map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${currentPage === page
                              ? "bg-[#212121] text-white shadow-md shadow-black/10"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <i className="bi bi-chevron-right text-sm"></i>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-xl overflow-hidden">
            {/* HEADER */}
            <div
              className="flex justify-between items-center px-6 py-4"
              style={{ background: "#f5e6d8" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#f07400" }}
                ></span>
                <h2 className="text-[13px] font-bold text-gray-600 tracking-widest uppercase">
                  Delete Lead
                </h2>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#f07400] hover:text-orange-600"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line
                    x1="2"
                    y1="2"
                    x2="16"
                    y2="16"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="16"
                    y1="2"
                    x2="2"
                    y2="16"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* BODY */}
            <div className="px-7 pt-9 pb-5 text-center">
              <div
                className="w-[78px] h-[78px] mx-auto rounded-full flex items-center justify-center mb-5"
                style={{ background: "#f5e0c6" }}
              >
                <svg width="32" height="34" viewBox="0 0 32 34" fill="none">
                  <path
                    d="M3 8H29"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 8V5C12 4.448 12.448 4 13 4H19C19.552 4 20 4.448 20 5V8"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 8L6.5 29C6.5 29.552 6.948 30 7.5 30H24.5C25.052 30 25.5 29.552 25.5 29L27 8"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 14V24"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 14V24"
                    stroke="#f07400"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="text-[17px] font-bold text-gray-800 tracking-widest uppercase mb-2">
                {leadToDelete?.customer_name || "DELETE LEAD"}
              </h3>
              <p className="text-[13px] text-gray-400">
                This action cannot be undone. Are you sure?
              </p>
            </div>

            {/* FOOTER */}
            <div className="flex gap-3.5 px-7 pb-8 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 border border-gray-200 py-3 rounded-sm text-gray-500 bg-gray-50 hover:bg-gray-100 transition text-[15px] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl text-white text-[15px] font-semibold hover:opacity-90 transition"
                style={{ background: "#f07400" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ADD FOLLOW-UP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 ">
          <div className="bg-white w-[480px] rounded-sm shadow-xl  overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Add Lead Activities
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-orange-500 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Follow-Up Date
                </label>
                <input
                  type="date"
                  name="follow_up_date"
                  value={form.follow_up_date}
                  onChange={handleChange}
                  className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50 transition-all"
                />
              </div>
              <div className="col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Activity Type <span className="text-orange-500">*</span>
                </label>
                <select
                  name="activity_type"
                  value={form.activity_type}
                  onChange={handleChange}
                  className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50 transition-all"
                >
                  <option value="">-- Select --</option>
                  <option>Call</option>
                  <option>Meeting</option>
                  <option>Email</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Follow-Up By
                </label>
                <select
                  name="follow_up_by"
                  value={form.follow_up_by}
                  onChange={handleChange}
                  className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50 transition-all"
                >
                  <option value="">Select User</option>
                  {assignee.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Contact Person <span className="text-orange-500">*</span>
                </label>
                <div className="flex mt-1.5">
                  <input
                    name="contact_person"
                    value={form.contact_person}
                    onChange={handleChange}
                    className="w-full border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50 transition-all"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Description <span className="text-orange-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50 h-20 resize-none transition-all"
                />
              </div>
              <div className="col-span-2 border-2 border-dashed border-orange-300 rounded-xl p-3 text-center bg-orange-50/40">
                <button
                  onClick={() => setShowFileModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all shadow-md shadow-orange-200"
                >
                  <i className="bi bi-cloud-upload"></i> Browse Files
                </button>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1 text-left">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white px-3 py-1 text-xs rounded-lg border border-gray-100 shadow-sm"
                      >
                        <span className="text-gray-600 truncate">
                          {file.name}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedFiles(
                              selectedFiles.filter((_, i) => i !== index),
                            )
                          }
                          className="text-orange-500 hover:text-orange-600 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1.5">
                  Max 2MB · JPG, PNG, PDF
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-sm font-medium border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={btnLoading}
                className={`px-6 py-2 text-sm font-semibold text-white rounded-sm transition-all shadow-md shadow-orange-200 flex items-center gap-2
  ${btnLoading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                {btnLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="4"
                        opacity="0.25"
                      />
                      <path
                        fill="white"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE FOLLOW-UP MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 ">
          <div className="bg-white w-full max-w-[800px] rounded-sm shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4  bg-gradient-to-r from-orange-100 to-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Update Lead Activities
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedFiles([]);
                  setPreviewFollowUp(null);
                }}
                className="w-7 h-7 flex items-center justify-center  text-orange-500 text-md"
              >
                ✕
              </button>
            </div>

            <div className="flex">
              {/* LEFT - Form */}
              <div className="w-1/2 px-6 py-5 border-r border-gray-100">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
                  Add New Follow-Up
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Follow-Up Date
                    </label>
                    <input
                      type="date"
                      value={updateForm.follow_up_date}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          follow_up_date: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Activity Type *
                    </label>
                    <select
                      value={updateForm.activity_type}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          activity_type: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
                    >
                      <option value="">-- Select --</option>
                      <option>Call</option>
                      <option>Meeting</option>
                      <option>Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Follow-Up By
                    </label>
                    <select
                      value={updateForm.follow_up_by}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          follow_up_by: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
                    >
                      <option value="">Select User</option>
                      {assignee.map((item) => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Contact Person *
                    </label>
                    <input
                      value={updateForm.contact_person}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          contact_person: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Description *
                    </label>
                    <textarea
                      value={updateForm.description}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full mt-1.5 border border-orange-300 rounded-sm px-3 py-2 text-sm  outline-none bg-gray-50 h-20 resize-none"
                    />
                  </div>
                  <div className="col-span-2 border-2 border-dashed border-orange-300 rounded-xl p-3 text-center bg-orange-50/40">
                    <button
                      onClick={() => setShowFileModal(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 mx-auto transition-all shadow-md shadow-orange-200"
                    >
                      <i className="bi bi-cloud-upload"></i> Browse Files
                    </button>
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-1 text-left">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center bg-white px-3 py-1 text-xs rounded-lg border border-gray-100 shadow-sm"
                          >
                            <span className="text-gray-600 truncate">
                              {file.name}
                            </span>
                            <button
                              onClick={() =>
                                setSelectedFiles(
                                  selectedFiles.filter((_, i) => i !== index),
                                )
                              }
                              className="text-orange-400 hover:text-orange-600 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
                      Max 2MB · JPG, PNG, PDF
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT - History */}
              <div className="w-1/2 px-6 py-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Follow-Up History
                  </p>
                  <span className="text-xs bg-orange-50 text-orange-500 px-2.5 py-1 rounded-full font-semibold border border-orange-100">
                    {followUpHistory.length} record(s)
                  </span>
                </div>
                <div className="space-y-2">
                  {followUpHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                      <i className="bi bi-clock-history text-3xl mb-2"></i>
                      <p className="text-sm">No history found</p>
                    </div>
                  ) : (
                    followUpHistory.map((item, idx) => (
                      <div
                        key={item.follow_up_id}
                        onClick={() =>
                          setPreviewFollowUp(
                            previewFollowUp?.follow_up_id === item.follow_up_id
                              ? null
                              : item,
                          )
                        }
                        className={`border rounded-xl p-3 cursor-pointer transition-all select-none ${previewFollowUp?.follow_up_id === item.follow_up_id ? "border-orange-400 bg-orange-50 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
                                Latest
                              </span>
                            )}
                            <p className="font-semibold text-sm text-gray-700">
                              {item.activity_type}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">
                              {item.follow_up_date
                                ? new Date(
                                  item.follow_up_date,
                                ).toLocaleDateString()
                                : "—"}
                            </span>
                            <i
                              className={`bi ${previewFollowUp?.follow_up_id === item.follow_up_id ? "bi-chevron-up" : "bi-chevron-down"} text-gray-400 text-xs`}
                            ></i>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {item.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                {previewFollowUp && (
                  <div className="mt-4 border border-orange-200 rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 text-sm shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-bold text-orange-500 text-xs uppercase tracking-wide">
                        Details
                      </p>
                      <button
                        onClick={() => setPreviewFollowUp(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      {[
                        {
                          label: "Activity Type",
                          value: previewFollowUp.activity_type,
                        },
                        {
                          label: "Follow-Up Date",
                          value: previewFollowUp.follow_up_date
                            ? new Date(
                              previewFollowUp.follow_up_date,
                            ).toLocaleDateString()
                            : "—",
                        },
                        {
                          label: "Contact Person",
                          value: previewFollowUp.contact_person,
                        },
                        {
                          label: "Follow-Up By",
                          value: previewFollowUp.follow_up_by,
                        },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-gray-400 font-medium">
                            {label}
                          </p>
                          <p className="font-semibold text-gray-700 text-sm mt-0.5">
                            {value || "—"}
                          </p>
                        </div>
                      ))}
                      <div>
                        <p className="text-xs text-gray-400 font-medium">
                          Status
                        </p>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-0.5 inline-block ${previewFollowUp.status === "Completed" ? "bg-green-100 text-green-600" : previewFollowUp.status === "Cancelled" ? "bg-orange-100 text-orange-500" : "bg-orange-100 text-orange-600"}`}
                        >
                          {previewFollowUp.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <p className="text-xs text-gray-400 font-medium">
                        Description
                      </p>
                      <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">
                        {previewFollowUp.description || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedFiles([]);
                  setPreviewFollowUp(null);
                }}
                className="px-5 py-2 rounded-sm text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateLoading}
                className={`px-6 py-2 rounded-sm text-sm font-semibold text-white transition-all shadow-md shadow-orange-200 flex items-center gap-2
                ${updateLoading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                {updateLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="4"
                        opacity="0.25"
                      />
                      <path
                        fill="white"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Add Follow-Up
                  </>
                ) : (
                  "Add Follow-Up"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE POPUP */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-900/30  flex items-center justify-center backdrop-blur-sm  z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-3 text-center">
              Confirm Status Change
            </h2>

            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to change status?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-orange-200"
              >
                Yes Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
          <div className="bg-white w-[400px] rounded-sm shadow-2xl  overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 from-orange-100 to-white border-b border-gray-100 bg-gradient-to-r">
              <div className="flex items-center gap-2">
                <i className="bi bi-cloud-upload text-orange-500 text-base"></i>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Upload Files
                </h2>
              </div>
              <button
                onClick={() => setShowFileModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full  text-orange-500 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex gap-5 p-6">
              <div
                className="w-1/2 border-2 border-dashed border-orange-200 rounded-sm flex flex-col items-center justify-center p-8 text-center bg-orange-50/50  transition-all cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("fileInput").click()}
              >
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <i className="bi bi-cloud-arrow-up text-orange-500 text-2xl"></i>
                </div>
                <p className="font-bold text-gray-700 text-sm">
                  Drag files here
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or{" "}
                  <span className="text-orange-500 font-semibold underline">
                    browse
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-3 bg-white border border-gray-100 rounded-lg px-3 py-1">
                  JPG · PNG · PDF · Max 2MB
                </p>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleSelect}
                />
              </div>

              <div className="w-1/2 flex flex-col justify-center">
                {selectedFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300 py-8">
                    <i className="bi bi-file-earmark text-4xl mb-2"></i>
                    <p className="text-sm">No files selected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Selected Files ({selectedFiles.length})
                    </p>
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center border border-gray-100 rounded-sm px-3 py-2.5 bg-gray-50 hover:bg-white shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <i className="bi bi-file-earmark text-orange-500 text-xs"></i>
                          </div>
                          <span className="text-sm text-gray-700 truncate">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedFiles(
                              selectedFiles.filter((_, index) => index !== i),
                            )
                          }
                          className="text-gray-300 hover:text-red-500 ml-2 flex-shrink-0 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowFileModal(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-sm text-sm font-semibold transition-all shadow-md shadow-orange-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW LEAD MODAL */}
      {showViewModal && viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
          <div className="bg-white w-full max-w-2xl border border-gray-100 rounded-sm shadow-2xl overflow-hidden ">
            {/* Orange Header */}
            <div className="from-orange-100 to-white  px-6 py-3 flex items-center justify-between bg-gradient-to-r">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center">
                  <i className="bi bi-person  text-md text-orange-500"></i>
                </div>
                <div>
                  <p className="text-sm  font-semibold text-gray-700 uppercase tracking-wide">
                    {viewLead.customer_name || "—"}
                  </p>
                  <p className="text-gray-400 text-md">
                    {viewLead.status || "—"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-7 h-7  flex items-center justify-center text-orange-500 text-md"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>

            {/* Cards Grid */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-building text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider ">
                    Company
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {viewLead.company_name || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-person-circle text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Customer Name
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {viewLead.customer_name || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-flag text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Source
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {viewLead.source || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-layers text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Product Category
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {viewLead.product_category || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-box-seam text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Product Name
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {viewLead.product_name || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-tag text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Category
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {viewLead.category || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-person-check text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Assignee
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {viewLead.assignee || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-center gap-3">
                <i className="bi bi-calendar3 text-orange-400 text-lg"></i>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Created
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {viewLead.created_at
                      ? new Date(viewLead.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
                <i className="bi bi-pencil text-orange-400 text-lg"></i>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Lead Title
                  </p>
                  <p className="text-sm font-semibold text-gray-700 break-words whitespace-normal">
                    {viewLead.lead_title || "—"}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-sm px-4 py-3 flex items-start gap-3">
                <i className="bi bi-chat-left-text text-orange-400 text-lg"></i>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Description
                  </p>
                  <p className="text-sm font-semibold text-gray-700 break-words whitespace-normal">
                    {viewLead.description || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
