"use client";

import React from "react";
import CommonMasterPage from "@/app/components/CommonMasterPage";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";
import CheckPermission from "@/app/components/CheckPermission";

export default function Page() {
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    useAuth();

    return (
        <CheckPermission allowedRoles={["Super Admin", "Admin"]}>
            <Header />
            <CommonMasterPage
                title="Expense Category"
                listApi={`${API_BASE}/api/expense-category/read`} // add your list API
                saveApi={`${API_BASE}/api/expense-category`}      // add your insert API without any endpoints
                breadcrumbs={["Expense", "Expense Category"]}
                showRadio={false}
                showCheckboxColumn={false}
                showDelete={true}
            />
        </CheckPermission>
    );
}
