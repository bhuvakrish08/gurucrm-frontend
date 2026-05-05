"use client";
import Header from "@/app/components/header";
import Link from "next/link";
import axios from "redaxios";
import React, { useEffect, useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import useAuth from "@/app/components/useAuth";

export default function Page() {

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  useAuth();

  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [scrollOffsets, setScrollOffsets] = useState({}); 

  // Fetch table data
  const fetchData = async (p = 1, sort = sortConfig) => {
    try {
      const res = await axios.get(`${API_BASE}/api/organizations/read`, {
        params: {
          page: p,
          sortColumn: sort.column,
          sortDirection: sort.direction,
        },
      });
      setData(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);


  // column scroll
  const handleColumnScroll = async (columnKey, direction) => {
    const currentOffset = scrollOffsets[columnKey] || 0;

    try {
      const res = await axios.get(`${API_BASE}/api/organizations/get-column-scroll`,
        {
          params: {
            column: columnKey,
            direction,
            offset: currentOffset,
            limit: 5,
          },
        }
      );

      if (res.data.success && res.data.data) {
        setScrollOffsets((prev) => ({
          ...prev,
          [columnKey]: res.data.newOffset,
        }));

        // update only that column’s values
        setData((prevData) => {
          const updated = [...prevData];
          res.data.data.forEach((row, index) => {
            if (updated[index]) updated[index][columnKey] = row[columnKey];
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Error fetching column scroll:", err);
    }
  };

   // 🔹 Column Scroll Arrows Component
  const ColumnScroll = ({ columnKey }) => (
    <span className="ml-1 inline-flex flex-col">
      <ChevronUpIcon
        size={16}
        className="cursor-pointer text-blue-400 hover:text-blue-600"
        title="Scroll Up"
        onClick={() => handleColumnScroll(columnKey, "up")}
      />
      <ChevronDownIcon
        size={16}
        className="cursor-pointer text-blue-400 hover:text-blue-600 -mt-1"
        title="Scroll Down"
        onClick={() => handleColumnScroll(columnKey, "down")}
      />
    </span>
  );

  return (
    <>
      <Header />
      <div className="bg-gray-100">
        <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
            <p className="flex items-center flex-wrap">
              <Link href="/dashboard" className="mx-2 text-xl text-gray-400 hover:text-indigo-600"><i className="bi bi-house"></i></Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="/setup" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">Set up</Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="#" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold">ORG-Master</Link>
              <i className="bi bi-chevron-right text-[10px]"></i>
              <Link href="#" className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"> Organization-Profile</Link>
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <Link href="/setup/org-master/add-table" className="block text-center bg-blue-800 hover:bg-blue-900 text-white px-5 py-2 rounded-sm font-bold text-sm w-full sm:w-auto">
              + ADD ORGANIZATION
            </Link>
          </div>
        </div>

        {/* Table Section */}
        <form className="p-2 w-full">
          <div className="bg-white shadow rounded-2xl p-4 md:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-center">#</th>
                    <th className="px-4 py-2">
                      Organization Name <ColumnScroll columnKey="organization_name" />
                    </th>
                    <th className="px-4 py-2">
                      Email <ColumnScroll columnKey="email" />
                    </th>
                    <th className="px-4 py-2">
                      Address Line 1 <ColumnScroll columnKey="address_1" />
                    </th>
                    <th className="px-4 py-2">
                      Country <ColumnScroll columnKey="country" />
                    </th>
                    <th className="px-4 py-2">
                      State <ColumnScroll columnKey="state" />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.length > 0 ? (
                    data.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="text-center p-2">
                          {(page - 1) * 5 + (i + 1)}
                        </td>
                        <td className="p-2">{item.organization_name}</td>
                        <td className="p-2">{item.email}</td>
                        <td className="p-2">{item.address_1}</td>
                        <td className="p-2">{item.country}</td>
                        <td className="p-2">{item.state}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-500 p-3">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between mt-10">
                <button onClick={(e) => {e.preventDefault(); if (page > 1) setPage(page - 1); }}
                  disabled={page === 1} className={`px-3 py-1 rounded-md ${
                    page === 1 ? "bg-gray-300" : "bg-blue-800 text-white"}`}> Previous </button>

                <p className="text-gray-500">
                  Page {page} of {totalPages}
                </p>

                <button onClick={(e) => {e.preventDefault(); if (page < totalPages) setPage(page + 1);}}
                  disabled={page === totalPages} className={`px-3 py-1 rounded-md ${
                    page === totalPages ? "bg-gray-300" : "bg-blue-800 text-white"}`}> Next </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
