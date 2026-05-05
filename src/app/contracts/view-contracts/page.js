"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "redaxios";
import Link from "next/link";
import { toast } from "react-toastify";
import Select from "react-select";
import Header from "@/app/components/header";
import { useRouter } from "next/navigation";
import useAuth from "@/app/components/useAuth";

export default function EditContract() {
    const router = useRouter();

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
    useAuth();

    const [editId, setEditId] = useState(null);

    const companyRef = useRef(null);

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

    //  Load Stored Data from LocalStorage
    useEffect(() => {
        const raw = localStorage.getItem("view_contract_data");
        if (!raw) {
            toast.error("No contract selected for editing!");
            router.push("/contracts");
            return;
        }

        const data = JSON.parse(raw);

        setEditId(data.id);

        setFormData({
            company_name: data.company_name || "",
            customer_name: data.customer_name || "",
            contract_name: data.contract_name || "",
            contract_type: data.contract_type || "",
            contract_value: data.contract_value || "",
            start_date: formatDate(data.start_date || ""),
            end_date: formatDate(data.end_date || ""),
            description: data.description || "",
            assignee: data.assignee || "",
        });
    }, []);


    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };


    return (
        <>
            <Header />
            <div className="bg-gray-100">
                <div className="bg-white w-full rounded-2xl shadow-lg p-3 mt-1 mb-5 flex justify-between items-center">
                    <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
                        <p className="flex items-center flex-wrap">
                            <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                                <i className="bi bi-house"></i>
                            </Link>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                            <span className="mx-3 font-semibold">Contract</span>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                            <button onClick={() => { localStorage.removeItem("view_user_id"); router.push("/contracts"); }} className="mx-3 hover:text-indigo-600 font-semibold">
                                Contract List
                            </button>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                            <span className="mx-3 font-semibold">View Contract</span>
                        </p>
                    </div>
                </div>

                <form className="p-1 w-full max-w-6xl mx-auto">
                    <div className="bg-white rounded-xl border p-4 md:p-6 mt-2">
                        {/* Tabs */}
                        <div className="flex gap-8 border-b pb-2 mb-4 text-gray-700">
                            <p className="font-medium pb-1 text-xl">
                                Contract
                            </p>

                        </div>

                        {/* 3 Column Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-10 px-4 md:mx-10 mb-8">

                            {/* Column 1 */}
                            <div>
                                <p className="text-sm text-gray-600">Company Name</p>
                                <p className="text-lg font-semibold">{formData.company_name}</p>

                                <p className="text-sm text-gray-600 mt-6">Contract Type</p>
                                <p className="text-lg font-semibold">{formData.contract_type}</p>

                                <p className="text-sm text-gray-600 mt-6">End Date</p>
                                <p className="text-lg font-semibold">{formData.end_date}</p>
                            </div>

                            {/* Column 2 */}
                            <div>
                                <p className="text-sm text-gray-600">Customer</p>
                                <p className="text-lg font-semibold">{formData.customer_name}</p>

                                <p className="text-sm text-gray-600 mt-6">Contract Value</p>
                                <p className="text-lg font-semibold">{formData.contract_value}</p>
                            </div>

                            {/* Column 3 */}
                            <div>
                                <p className="text-sm text-gray-600">Contract Name</p>
                                <p className="text-lg font-semibold">{formData.contract_name}</p>

                                <p className="text-sm text-gray-600 mt-6">Start Date</p>
                                <p className="text-lg font-semibold">{formData.start_date}</p>
                            </div>

                        </div>

                        <div className="flex justify-end mt-5">
                            <button type="button" onClick={() => { localStorage.removeItem("view_user_id"); router.push("/contracts"); }} className="px-5 py-2 bg-gray-100 rounded-sm text-gray-700 border hover:bg-gray-200">
                                Cancel
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </>
    );
}
