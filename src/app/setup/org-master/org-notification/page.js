"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "redaxios";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";

export default function Page() {

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    useAuth();

    const [modules, setModules] = useState([]);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        const res = await axios.get(`${API_BASE}/api/notifications/read`);
        setModules(res.data);
    };

    const handleToggle = async (id, field, currentValue) => {
        const newValue = !currentValue;

        await axios.patch(`${API_BASE}/api/notifications/update/${id}`, {
            field,
            value: newValue,
        });

        // Update UI instantly
        setModules((prev) =>
            prev.map((m) =>
                m.id === id ? { ...m, [field]: newValue } : m
            )
        );
    };

    return (
        <>
            <Header />
            <div className="bg-gray-100">
                {/* Header */}
                <div className="bg-white w-full rounded-2xl shadow-lg p-3 mt-1 mb-5 flex justify-between items-center">
                    <div className="flex items-center text-gray-700">
                        <p>
                            <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                                <i className="bi bi-house"></i>
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="/setup" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                Setup
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="#" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                Org Master
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="/setup/org-master/org-notification" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                Org Notification
                            </Link>
                        </p>
                    </div>

                </div>



                {/* Table */}
                <form className="p-1 mx-4">
                    <div className="bg-white shadow-md rounded-2xl p-1 border border-gray-200">
                        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scroll">
                            <table className=" w-full text-sm text-left text-gray-700 border-collapse mt-2 mb-2 whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-900  text-xs">
                                <tr>
                                    <th className="py-3 px-4 text-start">
                                        Module Name
                                    </th>
                                    <th className="py-3 px-4 text-start">
                                        Email Notification
                                    </th>
                                    <th className="py-3 px-4 text-start">WhatsApp Notification
                                    </th>
                                    <th className="py-3 px-4 text-start">Push Notification
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {modules.map((item, index) => (
                                    <tr key={item.id} className={`hover:bg-gray-50 transition bg-white`} >
                                        <td className="py-4 px-6 font-medium text-start text-gray-800">
                                            {item.module_name}
                                        </td>

                                        {["email_notification","whatsapp_notification","push_notification",
                                        ].map((field) => (
                                            <td key={field} className="py-4 px-6 text-start">
                                                <label className="inline-flex items-center cursor-pointer">
                            
                                                    <input type="checkbox" className="sr-only" checked={item[field] === 1 || item[field] === true} onChange={() => handleToggle(item.id, field, item[field])} />

                                                    <div className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item[field] === 1 || item[field] === true ? "bg-blue-900" : "bg-gray-300"}`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-3 bg-white rounded-full shadow-md transition-all duration-300 ${item[field] === 1 || item[field] === true ? "translate-x-6" : "translate-x-0"}`}></div>
                                                    </div>
                                                </label>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>

                    </div>
                </form>

            </div>
        </>
    );
}
