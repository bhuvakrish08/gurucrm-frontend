
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function Header() {
  // Remove search
  const router = useRouter();
  const pathname = usePathname();
  const [salesOpen, setSalesOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [mobileSalesOpen, setMobileSalesOpen] = useState(false);
  const [mobileCustomerOpen, setMobileCustomerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close all menus when navigation occurs
  useEffect(() => {
    setMobileMenuOpen(false);
    setCustomerOpen(false);
    setSalesOpen(false);
    setMobileCustomerOpen(false);
    setMobileSalesOpen(false);
  }, [pathname]);

  const salesRef = useRef(null);
  const customerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (salesRef.current && !salesRef.current.contains(event.target)) {
        setSalesOpen(false);
      }
      if (customerRef.current && !customerRef.current.contains(event.target)) {
        setCustomerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlelogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };



  return (
    <header className="sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 py-4 shadow-sm bg-white">
      <div className="flex w-full md:w-auto items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image
            src="/venster_logo.png"
            alt="Company Logo"
            width={70}
            height={70}
            className="object-contain"
          />
        </div>

        {/* Hamburger Icon (Mobile) */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-800 focus:outline-none p-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Links (Desktop) */}
      <nav className="hidden md:flex space-x-10 text-gray-800 font-medium">
        <Link href="/dashboard" className="hover:text-orange-500 transition-colors">
          Dashboard
        </Link>

        <div className="relative" ref={customerRef}>
          <button
            onClick={() => setCustomerOpen(!customerOpen)}
            className="hover:text-orange-500 transition-colors cursor-pointer"
          >
            Customer ▾
          </button>

          {customerOpen && (
            <div className="absolute left-0 mt-2 w-52 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-100">
              <Link href="/customer-list" className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors">
                Customers
              </Link>
              <Link href="/contacts" className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors">
                Contact Details
              </Link>
              <Link href="/contactDesignation" className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors">
                Contact Designation
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={salesRef}>
          <button
            onClick={() => setSalesOpen(!salesOpen)}
            className="hover:text-orange-500 transition-colors cursor-pointer"
          >
            Sales ▾
          </button>

          {salesOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-100">
              <Link href="/sales/lead" className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors">
                Lead
              </Link>
              <Link href="/sales/quotation" className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors">
                Quotation
              </Link>
              <Link href="/sales/proforma" className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors">
                Proforma Invoice
              </Link>
            </div>
          )}
        </div>

        <Link href="/tasks" className="hover:text-orange-500 transition-colors">
          Task List
        </Link>
        <Link href="/setup" className="hover:text-orange-500 transition-colors">
          Settings
        </Link>
      </nav>

      {/* Logout Button (Desktop) */}
      <button
        onClick={handlelogout}
        className="hidden md:flex items-center text-3xl text-gray-600 font-semibold hover:text-orange-500 transition-colors"
      >
        <i className="bi bi-box-arrow-right"></i>
      </button>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl flex flex-col items-start px-6 space-y-4 text-gray-800 font-medium pb-8 pt-4 border-t border-gray-100 z-[100] animate-in slide-in-from-top duration-300">
          <Link onClick={() => setMobileMenuOpen(false)} href="/dashboard" className="hover:text-orange-500 w-full py-1">
            Dashboard
          </Link>

          <div className="w-full">
            <button onClick={() => setMobileCustomerOpen(!mobileCustomerOpen)} className="flex justify-between w-full hover:text-orange-500 py-1">
              Customer <span className="ml-1 text-gray-400">{mobileCustomerOpen ? '▴' : '▾'}</span>
            </button>
            {mobileCustomerOpen && (
              <div className="flex flex-col pl-4 mt-2 space-y-3 border-l-2 border-orange-100">
                <Link href="/customer-list" onClick={() => setMobileMenuOpen(false)} className="hover:text-orange-500 text-sm">Customers</Link>
                <Link href="/contacts" onClick={() => setMobileMenuOpen(false)} className="hover:text-orange-500 text-sm">Contact Details</Link>
                <Link href="/contactDesignation" onClick={() => setMobileMenuOpen(false)} className="hover:text-orange-500 text-sm">Contact Designation</Link>
              </div>
            )}
          </div>

          <div className="w-full">
            <button onClick={() => setMobileSalesOpen(!mobileSalesOpen)} className="flex justify-between w-full hover:text-orange-500 py-1">
              Sales <span className="ml-1 text-gray-400">{mobileSalesOpen ? '▴' : '▾'}</span>
            </button>
            {mobileSalesOpen && (
              <div className="flex flex-col pl-4 mt-2 space-y-3 border-l-2 border-orange-100">
                <Link href="/sales/lead" onClick={() => setMobileMenuOpen(false)} className="hover:text-orange-500 text-sm">Lead</Link>
                <Link href="/sales/quotation" onClick={() => setMobileMenuOpen(false)} className="hover:text-orange-500 text-sm">Quotation</Link>
                <Link href="/sales/proforma" onClick={() => setMobileMenuOpen(false)} className="hover:text-orange-500 text-sm">Proforma Invoice</Link>
              </div>
            )}
          </div>

          <Link onClick={() => setMobileMenuOpen(false)} href="/tasks" className="hover:text-orange-500 w-full py-1">
            Task List
          </Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/setup" className="hover:text-orange-500 w-full py-1">
            Settings
          </Link>

          {/* Logout Option Inside Menu (Mobile Only) */}
          <div className="w-full pt-4 border-t border-gray-100 mt-2">
            <button
              onClick={handlelogout}
              className="flex items-center text-red-500 hover:text-red-600 transition-colors w-full font-bold text-lg"
            >
              <i className="bi bi-box-arrow-right mr-3 text-2xl"></i>
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

// header in logo
