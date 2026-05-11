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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
  const [scrollOffsets, setScrollOffsets] = useState({}); 

  // Fetch table data (fetching all for client-side pagination)
  const fetchData = async (sort = sortConfig) => {
    try {
      const res = await axios.get(`${API_BASE}/api/organizations/read`, {
        params: {
          limit: 1000, // Fetch all for client-side pagination
          sortColumn: sort.column,
          sortDirection: sort.direction,
        },
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);



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

  // Standardized Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

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
                  {currentItems.length > 0 ? (
                    currentItems.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition border-b border-gray-100">
                        <td className="text-center p-3 text-gray-600">
                          {indexOfFirstItem + i + 1}
                        </td>
                        <td className="p-3 font-medium text-gray-800">{item.organization_name}</td>
                        <td className="p-3 text-gray-600">{item.email}</td>
                        <td className="p-3 text-gray-600">{item.address_1}</td>
                        <td className="p-3 text-gray-600">{item.country}</td>
                        <td className="p-3 text-gray-600">{item.state}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-400 py-10">
                        No records found
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            {/* ✅ STANDARDIZED MICARA IMS PAGINATION */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-lg mt-4">
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
                    type="button"
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
                        type="button"
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                          currentPage === page
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
                    type="button"
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
        </form>
      </div>
    </>
  );
}
