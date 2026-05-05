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

// Decode token function
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1])); // decodes JWT
  } catch {
    return null;
  }
};

export default function Page() {

  useAuth();
  

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [companyname, setCompanyname] = useState([]);
  const [customername, setCustomername] = useState([]);
  const [contractList, setContractList] = useState([]);
  const [asignee, setAsignee] = useState([]);

  const companyRef = useRef(null);

  const router = useRouter()


  const [newFiles, setNewFiles] = useState([]);

  const IMAGE_EXT = ["jpg", "jpeg", "png"];
  const DOC_EXT = ["pdf", "txt", "doc", "xlsx", "csv", "pptx"];
  const MAX_IMG_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_DOC_SIZE = 15 * 1024 * 1024; // 15 MB

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const user = decodeToken(token);

      if (!user) {
        toast.error("User not authenticated!");
        return;
      }

      const fd = new FormData();

      // Append form fields
      Object.entries(formData).forEach(([key, value]) => {
        fd.append(key, value);
      });

      // Append new uploaded files
      newFiles.forEach(item => {
        fd.append("files", item.file);
      });

      const res = await axios.post(`${API_BASE}/api/contracts-list/insert`, fd,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 201 || res.status === 200) {
        toast.success("Contract added successfully!");
        router.push("/contracts")
        resetform();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add contract!");
    }
  };

  // For Dynamic Connected dropdown Company_name and Customer_name
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/organizations/organization-name`,
        );

        const data = res.data.data || res.data;
        setCompanyname(Array.isArray(data) ? data : []);
      } catch {
        setCompanyname([]);
      }
    };

    fetchCompanyName();
  }, []);


  useEffect(() => {
    const dropdown = companyRef.current;
    if (!dropdown) return;

    const handleCompanyChange = async () => {
      const selected = dropdown.value;

      if (!selected) {
        setCustomername([]);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/api/customers/customer-name`,
          { params: { company_name: selected } }
        );

        const data = res.data.data || res.data;
        setCustomername(Array.isArray(data) ? data : []);
      } catch {
        setCustomername([]);
      }
    };

    dropdown.addEventListener("change", handleCompanyChange);

    return () => dropdown.removeEventListener("change", handleCompanyChange);
  }, []);

  // Dynamic Dropdown for contracts types
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/contract-types/contracts`,
          { params: { status: 1 } }
        );
        const data = res.data.data || res.data;
        setContractList(Array.isArray(data) ? data : []);
      } catch { }
    };

    fetchContracts();
  }, []);

  // Dynamic Dropdown for Assignee
  useEffect(() => {
    const fetchAsignee = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/manage-user/asignee`,
          { params: { status: 1 } }
        );

        const data = res.data.data || res.data;
        const dataArr = Array.isArray(data) ? data : [];
        const cleaned = dataArr.map((item) => ({
          ...item,
          name: item.name.split(" ")[0],
        }));

        setAsignee(cleaned);
      } catch {
        setAsignee([]);
      }
    };

    fetchAsignee();
  }, []);





  // Model for Upload Files
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState([]);


  // File select
  const handleSelect = (e) => {
    const selected = Array.from(e.target.files)
      .map(file => ({ file, id: crypto.randomUUID() }))
      .filter(({ file }) => {
        const ext = file.name.split(".").pop().toLowerCase();

        if (![...IMAGE_EXT, ...DOC_EXT].includes(ext)) {
          toast.error("Unsupported file type");
          return false;
        }

        if (IMAGE_EXT.includes(ext) && file.size > MAX_IMG_SIZE) {
          toast.error("Image exceeds allowed 5 MB");
          return false;
        }

        if (DOC_EXT.includes(ext) && file.size > MAX_DOC_SIZE) {
          toast.error("Document exceeds allowed 15 MB");
          return false;
        }

        return true;
      });

    setNewFiles(prev => [...prev, ...selected]);
  };



  // Drag drop
  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).map(file => ({
      file,
      id: crypto.randomUUID(),
    }));

    setNewFiles(prev => [...prev, ...dropped]);
  };



  const resetform = () => {
    setFormData({
      company_name: "",
      customer_name: "",
      contract_name: "",
      contract_type: "",
      contract_value: "",
      start_date: "",
      end_date: "",
      description: "",
      assignee: "",
    })
  }

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
              <Link href="/contracts" className="mx-3 hover:text-indigo-600 font-semibold">
                Contract List
              </Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <span className="mx-3 font-semibold">Add Contract</span>
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
                  <select name="company_name" value={formData.company_name} onChange={handleChange} ref={companyRef} className="w-full border rounded-lg px-3 py-2">
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
                  <select name="customer_name" value={formData.customer_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2">
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
                  <input type="text" name="contract_name" value={formData.contract_name} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
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
                  <input type="text" name="contract_value" value={formData.contract_value} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block mb-1">Start Date *</label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
                </div>

                <div>
                  <label className="block mb-1">End Date *</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="mt-3">
                <label className="block mb-1">Description</label>
                <textarea name="description" rows="2" value={formData.description} onChange={handleChange} className="w-full border rounded-lg px-3 py-2">
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
                <button type="button" onClick={() => { resetform(); router.push("/contracts") }} className="px-6 py-2 rounded-lg border">
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