"use client";

import React from "react";
import CommonMasterPage from "@/app/components/CommonMasterPage";
import Header from "@/app/components/header";
import useAuth from "@/app/components/useAuth";

export default function Page() {

    useAuth();

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    return (
        <>
            <Header />
            <CommonMasterPage
                title="Inquiry / Lead Activity"
                listApi={`${API_BASE}/api/inquiry-lead-activity/read`}
                saveApi={`${API_BASE}/api/inquiry-lead-activity`}
                breadcrumbs={["Inquiry / Lead", "Inquiry / Lead Activity"]}
                showRadio={false}
                showCheckboxColumn={false}
            />
        </>
    );
}
