"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import Select from "react-select";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import { X, FileImage, FileText } from "lucide-react";
import useAuth from "@/app/components/useAuth";

export default function EditContract() {
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  useAuth();

  const [showModal, setShowModal] = useState(false);

  const [editId, setEditId] = useState(null);
  const [companyname, setCompanyname] = useState([]);
  const [customername, setCustomername] = useState([]);
  const [contractList, setContractList] = useState([]);
  const [asignee, setAsignee] = useState([]);

  const companyRef = useRef(null);

  // File States
  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);

  const [fileToDelete, setFileToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Allowed Extension & Size
  const IMAGE_EXT = ["jpg", "jpeg", "png"];
  const DOC_EXT = ["pdf", "txt", "doc", "xlsx", "csv", "pptx"];
  const MAX_IMG_SIZE = 5 * 1024 * 1024;
  const MAX_DOC_SIZE = 15 * 1024 * 1024;


  const [formData, setFormData] = useState({
    company_name: "",
    customer_name: "",
    contract_name: "",
    contract_type: "",
    contract_value: "",
    start_date: "",
    end_date: "",
    description: "",
    assignee: "",
  });


  useEffect(() => {
    if (!editId) return;

    const token = localStorage.getItem("token");

    axios.get(`${API_BASE}/api/contracts-list/files/${editId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setExistingFiles(res.data.files || []))
      .catch(err => {
        console.error("Failed to load files:", err);
        setExistingFiles([]);
      });
  }, [editId]);



  // formatDate function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10); // yyyy-mm-dd
  };


  //  Load Stored Data from LocalStorage
  useEffect(() => {
    const raw = localStorage.getItem("edit_contract_data");
    if (!raw) {
      toast.error("No contract selected for editing!");
      router.push("/contracts");
      return;
    }

    const data = JSON.parse(raw);

    setEditId(data.id);

    setFormData({
      company_name: data.company_id || "",
      customer_name: data.customer_name || "",
      contract_name: data.contract_name || "",
      contract_type: data.contract_type_id || "",
      contract_value: data.contract_value || "",
      start_date: formatDate(data.start_date || ""),
      end_date: formatDate(data.end_date || ""),
      description: data.description || "",
      assignee: data.assignee || "",
    });
  }, []);

  // Fetch Company list
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/organizations/organization-name`)
      .then((res) => setCompanyname(res.data.data || []))
      .catch(() => setCompanyname([]));
  }, []);

  // Fetch customer list based on company_name
  useEffect(() => {
    if (!formData.company_name) return;

    axios
      .get(`${API_BASE}/api/customers/customer-name`, {
        params: { company_id: formData.company_name },
      })
      .then((res) => setCustomername(res.data.data || []))
      .catch(() => setCustomername([]));
  }, [formData.company_name]);

  // Fetch Contract Types
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/contract-types/contracts`, {
        params: { status: 1 },
      })
      .then((res) => setContractList(res.data.data || []));
  }, []);

  // Fetch Assignees
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/manage-user/asignee`, {
        params: { status: 1 },
      })
      .then((res) =>
        setAsignee(
          (res.data.data || []).map((i) => ({
            ...i,
            name: i.name.split(" ")[0],
          }))
        )
      )
      .catch(() => setAsignee([]));
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  // submit selected files
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();

      // normal fields
      Object.entries(formData).forEach(([key, value]) => {
        fd.append(key, value);
      });

      // existing files to keep
      existingFiles.forEach(f => {
        fd.append("existing_files[]", f.id);
      });

      // new uploaded files
      newFiles.forEach(item => {
        fd.append("files", item.file);
      });

      // removed file ids
      removedFiles.forEach(id => {
        fd.append("removed_files[]", id);
      });

      const res = await axios.put(`${API_BASE}/api/contracts-list/update/${editId}`, fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200) {
        toast.success("Contract updated successfully!");

        localStorage.removeItem("edit_contract_data");
        router.push("/contracts");
      }
    } catch (err) {
      console.log(err);
      toast.error("Update failed!");
    }
  };

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
        existingFiles.some(f => f.file_name === file.name) ||
        newFiles.some(f => f.file.name === file.name) ||
        validFiles.some(f => f.file.name === file.name);

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
      validFiles.push({ file, id: crypto.randomUUID(), });
      remainingSlots--;
    }

    if (validFiles.length) {
      setNewFiles(prev => [...prev, ...validFiles]);
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



  const confirmDelete = (id) => {
    setFileToDelete(id);
    setShowDeleteModal(true);
  };

  const handleRemoveFile = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.delete(`${API_BASE}/api/contracts-list/delete-file/${fileToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setRemovedFiles(prev => [...prev, fileToDelete]);
        setExistingFiles(prev => prev.filter(f => f.id !== fileToDelete));
        toast.success("File deleted");
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      toast.error("Error deleting file");
    }

    setShowDeleteModal(false);
  };



  return (
    <>
      <Header />
      <div className="bg-gray-100">
        <div className="bg-white w-full rounded-2xl shadow-lg p-3 mt-1 mb-5 flex justify-between items-center text-sm font-semibold">
          <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
            <p className="flex items-center flex-wrap">
              <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                <i className="bi bi-house"></i>
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <span className="mx-3 font-semibold">Contract</span>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <button onClick={() => { localStorage.removeItem("edit_user_id"); router.push("/contracts"); }} className="mx-3 hover:text-indigo-600 font-semibold">
                Contract List
              </button>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <span className="mx-3 font-semibold">Edit Contract</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-1 mx-4">
          <div className="min-h-4 bg-gray-100 p-2 flex justify-center">
            <div className="w-full max-w-4xl bg-white shadow-md rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-2">Contract Information</h2>
              <hr className="text-gray-200 mt-2 mb-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-gray-700">
                <div>
                  <label className="block mb-1">Company Name *</label>
                  <select name="company_name" value={formData.company_name ?? ""} onChange={handleChange} ref={companyRef} className="w-full border rounded-lg px-3 py-2">
                    <option value="">-- Select --</option>
                    {companyname.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.organization_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Customer Name *</label>
                  <select name="customer_name" value={formData.customer_name ?? ""} onChange={handleChange} className="w-full border rounded-lg px-3 py-2">
                    <option value="">-- Select --</option>
                    {customername.map((item) => (
                      <option key={item.id || item.customer_name} value={item.customer_name}>
                        {item.customer_name}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="md:col-span-2">
                  <label className="block mb-1">Contract Name *</label>
                  <input type="text" name="contract_name" value={formData.contract_name ?? ""} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block mb-1">Contract Type *</label>
                  <select name="contract_type" value={formData.contract_type} onChange={handleChange} className="w-full border rounded-lg px-3 py-2">
                    <option value="">-- Select --</option>
                    {contractList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Contract Value *</label>
                  <input type="text" name="contract_value" value={formData.contract_value ?? ""} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block mb-1">Start Date *</label>
                  <input type="date" name="start_date" value={formData.start_date ?? ""} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block mb-1">End Date *</label>
                  <input type="date" name="end_date" value={formData.end_date ?? ""} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="mt-3">
                <label className="block mb-1">Description</label>
                <textarea name="description" rows="2" value={formData.description ?? ""} onChange={handleChange} className="w-full border rounded-lg px-3 py-2">
                </textarea>
              </div>

              <div className="mt-3">
                <label className="block mb-1">Assignee *</label>
                <Select isMulti instanceId="assignee-select"
                  options={asignee.map((i) => ({
                    value: i.name,
                    label: i.name,
                  }))}
                  value={
                    (formData.assignee ?? "")
                      ? formData.assignee.split(",").map((n) => ({
                        label: n.trim(),
                        value: n.trim(),
                      }))
                      : []
                  }
                  onChange={(selected) => {
                    const names = selected.map((s) => s.value).join(",");
                    setFormData({ ...formData, assignee: names });
                  }} className="w-full" />
              </div>

              <div className="text-gray-600 mt-2">
                <label className="block mb-2">Select Files *</label>
                <div className="border border-dashed border-gray-400 text-center">
                  <div className="m-3">
                    <h3 className="mb-3">Upload Documents</h3>
                    <button type="button" className="bg-blue-800 text-white px-2 mb-2 py-2 rounded" onClick={() => setShowModal(true)}>
                      <i className="bi bi-cloud-arrow-up px-2"></i> Browse Files
                    </button>
                    <p className="mb-4 text-gray-400">Max size: 2MB - JPG, PNG, PDF, TXT, DOC, XLSX, CSV, PPTX file support</p>
                  </div>
                </div>
              </div>

              <div className="text-gray-600 mt-2">
                <label className="block mb-2">Existing Files</label>
                <div className="mb-3">
                  {existingFiles.map((f) => (
                    <div key={f.id} className="flex justify-between mb-1">
                      <a href={f.file_path} target="_blank">
                        {f.file_name}
                      </a>
                      <button type="button" className="text-gray-400 text-sm hover:text-red-700" onClick={() => confirmDelete(f.id)}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  ))}


                </div>
              </div>

              {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900/30 z-40">
                  <div className="bg-white p-6 rounded-xl shadow-lg w-96 text-center">
                    <h2 className="text-lg font-semibold mb-4 text-red-500">Confirm Delete</h2>
                    <p className="mb-6">Are you sure you want to delete this File?</p>
                    <div className="flex justify-center gap-4">
                      <button type="button" onClick={() => handleRemoveFile(fileToDelete)} className="bg-blue-800 text-white px-8 py-2 rounded-xl hover:bg-blue-900">
                        Yes
                      </button>
                      <button type="button" onClick={() => setShowDeleteModal(false)} className="bg-gray-300 text-gray-800 px-8 py-2 rounded-xl hover:bg-gray-400">
                        No
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* UPLOAD MODAL */}
              {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">

                  <div className="w-[650px] bg-white rounded-xl shadow-xl">

                    <div className="bg-blue-900 p-4 flex justify-between">
                      <h2 className="text-white text-lg">Upload Files</h2>
                      <X className="text-white cursor-pointer" onClick={() => setShowModal(false)} />
                    </div>

                    <div className="flex justify-between">
                      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed border-gray-400 m-6 p-8 text-center rounded-xl">
                        <p className="font-semibold mt-3">DRAG FILES HERE</p>
                        <p className="text-gray-500 mt-1">
                          OR{" "}
                          <label className="text-blue-800 underline cursor-pointer">
                            SELECT FILE
                            <input type="file" multiple className="hidden" onChange={handleSelect} />
                          </label>
                        </p>
                      </div>

                      <div className="max-h-52 overflow-y-auto px-6 pb-4 mt-4 space-y-8 custom-scroll">
                        {/* Newly Added Files */}
                        {newFiles.map((f) => (
                          <div key={f.id} className="flex items-center justify-between gap-3 border border-gray-300 p-3 mb-3 rounded-3xl">
                            <div className="flex items-center gap-3">
                              {f.file.type.includes("image") ? (
                                <FileImage size={35} className="text-blue-700" />
                              ) : (
                                <FileText size={35} className="text-blue-700" />
                              )}
                              <p className="truncate max-w-[240px]">{f.file.name}</p>
                            </div>
                            <X size={22} className="text-gray-500 hover:text-red-400 cursor-pointer" onClick={() => setNewFiles(newFiles.filter(file => file.id !== f.id))} />
                          </div>
                        ))}

                      </div>
                    </div>

                    <div className="p-6 flex justify-end">
                      <button className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg" onClick={() => setShowModal(false)}>
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-4">
                <button type="button" onClick={() => { localStorage.removeItem("view_user_id"); router.push("/contracts"); }} className="px-5 py-2 bg-gray-100 rounded-sm text-gray-700 border hover:bg-gray-200">
                  Cancel
                </button>

                <button type="submit" className="px-6 py-2 rounded-lg bg-blue-800 text-white">
                  Save
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
