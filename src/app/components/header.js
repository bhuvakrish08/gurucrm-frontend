"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import axios from "redaxios";
import { toast } from "react-toastify";
import { Bell, Activity, Clock, Calendar } from "lucide-react";

export default function Header() {
  const [activities, setActivities] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const router = useRouter();
  const pathname = usePathname();
  const [salesOpen, setSalesOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [mobileSalesOpen, setMobileSalesOpen] = useState(false);
  const [mobileCustomerOpen, setMobileCustomerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");

  const [reminders, setReminders] = useState({ today: [], overdue: [] });
  const alertedRef = useRef(new Set());

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "";
    setUsername(storedUsername);
    const storedRole = localStorage.getItem("role") || "";
    setUserRole(storedRole);
  }, []);

  const userLetter = username?.charAt(0)?.toUpperCase() || "U";

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
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (salesRef.current && !salesRef.current.contains(event.target)) {
        setSalesOpen(false);
      }

      if (customerRef.current && !customerRef.current.contains(event.target)) {
        setCustomerOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        profileRef.current &&
        event.target instanceof Node &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlelogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    router.push("/");
  };

  // Lead Notification

  const handleMarkAsRead = async (id) => {
    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      await axios.patch(
        `${API_BASE}/api/activities/mark-as-read/${id}`,
        {},
        config,
      );
      setActivities(
        activities.map((a) => (a.id === id ? { ...a, is_read: 1 } : a)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      await axios.patch(`${API_BASE}/api/activities/mark-all-read`, {}, config);
      setActivities(activities.map((a) => ({ ...a, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const currentToken = localStorage.getItem("token");

        if (!currentToken) return;

        const config = {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        };

        const res = await axios.get(`${API_BASE}/api/activities/read`, config);

        setActivities(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchActivities();
  }, []);

  // ============================================================
  // ✅ NEW: TODAY'S TASK REMINDER SYSTEM
  // Backend endpoint required: GET /api/calendar/reminders/today
  // (returns { success, today: [...], overdue: [...] } for the
  // logged-in user based on their assignee id from the token)
  // ============================================================

  const fetchReminders = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) return;

      const config = { headers: { Authorization: `Bearer ${currentToken}` } };
      const res = await axios.get(
        `${API_BASE}/api/calendar/reminders/today`,
        config,
      );

      setReminders({
        today: res.data.today || [],
        overdue: res.data.overdue || [],
      });
    } catch (err) {
      // Silently ignore auth errors (token expired / not logged in)
      // and network errors — they are expected during page load or logout.
      // User will be redirected to login by the auth guard. No need to log noise here.
      const status = err?.status || err?.response?.status;
      if (status === 401 || status === 403 || status === 0) {
        setReminders({ today: [], overdue: [] });
        return;
      }
      // For any other unexpected error, log a minimal warning only.
      console.warn("Reminder fetch failed:", err?.message || err);
    }
  };

  // Initial fetch + re-fetch every 5 min, jethi navi add thayeli task pan dekhay
  useEffect(() => {
    fetchReminders();
    const poll = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(poll);
  }, []);

  // Din ma ek j vaar "Aaje X task che" digest toast batave
  useEffect(() => {
    const total = reminders.today.length + reminders.overdue.length;
    if (total === 0) return;

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const lastShown = localStorage.getItem("reminderDigestShown");

    if (lastShown !== todayKey) {
      const parts = [];
      if (reminders.today.length > 0)
        parts.push(`${reminders.today.length} aaje`);
      if (reminders.overdue.length > 0)
        parts.push(`${reminders.overdue.length} overdue`);

      toast.info(`📋 You have ${parts.join(", ")} task(s) pending!`, {
        autoClose: 6000,
      });
      localStorage.setItem("reminderDigestShown", todayKey);
    }
  }, [reminders]);

  // Har 30 second e check kare — task no exact time ave tyare live alert
  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;

      reminders.today.forEach((r) => {
        const taskTime = (r.activity_time || "").slice(0, 5);
        if (taskTime === hhmm && !alertedRef.current.has(r.id)) {
          alertedRef.current.add(r.id);

          toast.warning(`⏰ Reminder: "${r.title}" is due now!`, {
            autoClose: 8000,
          });

          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("Task Reminder", { body: r.title });
          }
        }
      });
    }, 30000);

    return () => clearInterval(tick);
  }, [reminders]);

  // Browser notification permission ek j vaar magi le
  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  const reminderCount = reminders.today.length + reminders.overdue.length;

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
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Calendar Icon */}
          <Link
            href="/calendar"
            className="relative p-2 text-gray-700 hover:text-orange-500 transition-colors"
            title="Calendar"
          >
            <Calendar className="w-6 h-6" />
            {/* ✅ NEW: today's-task indicator dot */}
            {reminderCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
            )}
          </Link>

          {/* Mobile Notification */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-700"
            >
              <Bell className="w-6 h-6" />

              {activities.some((a) => !a.is_read) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activities.filter((a) => !a.is_read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[95%] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">
                <div className="p-4 bg-orange-500 flex justify-between items-center">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Bell size={18} />
                    Notifications
                  </h3>

                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-white font-semibold"
                  >
                    Mark all
                  </button>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2 bg-gray-50">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-xl mb-2 ${
                        activity.is_read
                          ? "bg-white opacity-70"
                          : "bg-orange-50 border border-orange-100"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-700">
                        {activity.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-800 focus:outline-none p-2"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Links (Desktop) */}
      <nav className="hidden md:flex space-x-10 text-gray-800 font-medium">
        <Link
          href="/dashboard"
          className="hover:text-orange-500 transition-colors"
        >
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
              <Link
                href="/customer-list"
                className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Customers
              </Link>
              <Link
                href="/contacts"
                className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Contact Details
              </Link>
              <Link
                href="/contactDesignation"
                className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors"
              >
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
              {userRole !== "Estimation" &&
                userRole !== "Proforma invoices" && (
                  <Link
                    href="/sales/lead"
                    className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    Lead
                  </Link>
                )}
              {userRole !== "Leads Management" &&
                userRole !== "Proforma invoices" && (
                  <Link
                    href="/sales/quotation"
                    className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    Quotation
                  </Link>
                )}
              {userRole !== "Leads Management" &&
                userRole !== "Estimation" &&
                userRole !== "Sales" && (
                  <Link
                    href="/sales/proforma"
                    className="hover:text-orange-500 block px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    Proforma Invoice
                  </Link>
                )}
            </div>
          )}
        </div>

        {userRole !== "Leads Management" &&
          userRole !== "Estimation" &&
          userRole !== "Sales" &&
          userRole !== "Proforma invoices" && (
            <Link
              href="/tasks"
              className="hover:text-orange-500 transition-colors"
            >
              Task List
            </Link>
          )}

        {["Admin", "Super Admin"].includes(userRole) && (
          <Link
            href="/sales/projects"
            className="hover:text-orange-500 transition-colors"
          >
            Projects
          </Link>
        )}
        {[
          "Admin",
          "Super Admin",
          "Sales",
          "Estimation",
          "Leads Management",
        ].includes(userRole) && (
          <Link
            href="/sales/strategy"
            className="hover:text-orange-500 transition-colors"
          >
            Sales Strategy
          </Link>
        )}
        {["Admin", "Super Admin"].includes(userRole) && (
          <Link
            href="/sales/Genexpence"
            className="hover:text-orange-500 transition-colors"
          >
            General Expense
          </Link>
        )}

        {["Admin", "Super Admin"].includes(userRole) && (
          <Link
            href="/setup"
            className="hover:text-orange-500 transition-colors"
          >
            Settings
          </Link>
        )}
      </nav>

      {/* Desktop Right Side Icons */}
      <div className="hidden md:flex items-center gap-6">
        {/* ✅ Calendar Icon Button (Desktop) */}
        <Link
          href="/calendar"
          className={`relative p-2.5 rounded-xl border transition-all ${
            pathname === "/calendar"
              ? "bg-orange-50 border-orange-300 shadow-md"
              : "bg-white border-gray-200 hover:shadow-md"
          }`}
          title={
            reminderCount > 0
              ? `${reminderCount} task(s) need attention today`
              : "Calendar"
          }
        >
          <Calendar
            className={`w-5 h-5 ${
              pathname === "/calendar"
                ? "text-orange-500"
                : "text-gray-500 hover:text-orange-500"
            }`}
          />
          {/* ✅ NEW: today's-task indicator dot */}
          {reminderCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </Link>

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 bg-white rounded-xl border cursor-pointer border-gray-200 hover:shadow-md transition-all"
          >
            <Bell
              className={`w-5 h-5 ${
                activities.some((a) => !a.is_read)
                  ? "text-orange-500"
                  : "text-gray-500"
              }`}
            />

            {activities.some((a) => !a.is_read) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activities.filter((a) => !a.is_read).length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-[135%] w-[360px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 z-[999] overflow-visible animate-in fade-in zoom-in-95 duration-200">
              {/* Arrow */}
              <div className="absolute top-2 right-5 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45"></div>

              {/* Header */}
              <div className="p-4 bg-orange-500 rounded-t-2xl flex justify-between items-center relative z-10">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Bell size={18} />
                  Notifications
                </h3>

                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-white font-semibold cursor-pointer"
                >
                  Mark all read
                </button>
              </div>

              {/* Notifications */}
              <div className="max-h-[400px] overflow-y-auto p-2 bg-gray-50">
                {activities.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    No notifications found
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-xl mb-2 ${
                        activity.is_read
                          ? "bg-white opacity-70"
                          : "bg-orange-50 border border-orange-100"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.is_read
                              ? "bg-gray-100 text-gray-400"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          <Activity size={14} />
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            {activity.message}
                          </p>

                          <div className="flex justify-between items-center mt-2">
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(activity.created_at).toLocaleString()}
                            </span>

                            {!activity.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(activity.id)}
                                className="text-xs text-orange-600 font-semibold cursor-pointer"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center leading-none cursor-pointer shadow-sm hover:scale-105 transition-all" 
          >
            {userLetter}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-[120%] w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[999]">
              {/* User Info */}
              <div className="px-4 py-4 border-b bg-gray-50">
                <p className="text-sm text-gray-500">Signed in as</p>

                <p className="font-semibold text-gray-800 mt-1">{username}</p>
              </div>

              {/* Logout */}
              <button
                onClick={handlelogout}
                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-500 font-medium transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl flex flex-col items-start px-6 space-y-4 text-gray-800 font-medium pb-8 pt-4 border-t border-gray-100 z-[100] animate-in slide-in-from-top duration-300">
          <Link
            onClick={() => setMobileMenuOpen(false)}
            href="/dashboard"
            className="hover:text-orange-500 w-full py-1"
          >
            Dashboard
          </Link>

          {/* Mobile Calendar Link inside menu */}
          <Link
            onClick={() => setMobileMenuOpen(false)}
            href="/calendar"
            className="hover:text-orange-500 w-full py-1 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Calendar
            {/* ✅ NEW: today's-task indicator dot */}
            {reminderCount > 0 && (
              <span className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>

          <div className="w-full">
            <button
              onClick={() => setMobileCustomerOpen(!mobileCustomerOpen)}
              className="flex justify-between w-full hover:text-orange-500 py-1"
            >
              Customer{" "}
              <span className="ml-1 text-gray-400">
                {mobileCustomerOpen ? "▴" : "▾"}
              </span>
            </button>
            {mobileCustomerOpen && (
              <div className="flex flex-col pl-4 mt-2 space-y-3 border-l-2 border-orange-100">
                <Link
                  href="/customer-list"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-orange-500 text-sm"
                >
                  Customers
                </Link>
                <Link
                  href="/contacts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-orange-500 text-sm"
                >
                  Contact Details
                </Link>
                <Link
                  href="/contactDesignation"
                  onClick={() => setMobileMenuOpen(false)}
                  className="hover:text-orange-500 text-sm"
                >
                  Contact Designation
                </Link>
              </div>
            )}
          </div>

          <div className="w-full">
            <button
              onClick={() => setMobileSalesOpen(!mobileSalesOpen)}
              className="flex justify-between w-full hover:text-orange-500 py-1"
            >
              Sales{" "}
              <span className="ml-1 text-gray-400">
                {mobileSalesOpen ? "▴" : "▾"}
              </span>
            </button>
            {mobileSalesOpen && (
              <div className="flex flex-col pl-4 mt-2 space-y-3 border-l-2 border-orange-100">
                {userRole !== "Estimation" &&
                  userRole !== "Proforma invoices" && (
                    <Link
                      href="/sales/lead"
                      onClick={() => setMobileMenuOpen(false)}
                      className="hover:text-orange-500 text-sm"
                    >
                      Lead
                    </Link>
                  )}
                {userRole !== "Leads Management" &&
                  userRole !== "Proforma invoices" && (
                    <Link
                      href="/sales/quotation"
                      onClick={() => setMobileMenuOpen(false)}
                      className="hover:text-orange-500 text-sm"
                    >
                      Quotation
                    </Link>
                  )}
                {userRole !== "Leads Management" &&
                  userRole !== "Estimation" &&
                  userRole !== "Sales" && (
                    <Link
                      href="/sales/proforma"
                      onClick={() => setMobileMenuOpen(false)}
                      className="hover:text-orange-500 text-sm"
                    >
                      Proforma Invoice
                    </Link>
                  )}
              </div>
            )}
          </div>

          {userRole !== "Leads Management" &&
            userRole !== "Estimation" &&
            userRole !== "Sales" &&
            userRole !== "Proforma invoices" && (
              <Link
                onClick={() => setMobileMenuOpen(false)}
                href="/tasks"
                className="hover:text-orange-500 w-full py-1"
              >
                Task List
              </Link>
            )}
          {["Admin", "Super Admin"].includes(userRole) && (
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href="/sales/projects"
              className="hover:text-orange-500 w-full py-1"
            >
              Projects
            </Link>
          )}

          {[
            "Admin",
            "Super Admin",
            "Sales",
            "Estimation",
            "Leads Management",
          ].includes(userRole) && (
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href="/sales/strategy"
              className="hover:text-orange-500 w-full py-1"
            >
              Sales Strategy
            </Link>
          )}

          {["Admin", "Super Admin"].includes(userRole) && (
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href="/sales/net-profit"
              className="hover:text-orange-500 w-full py-1"
            >
              General Expense
            </Link>
          )}
          {["Admin", "Super Admin"].includes(userRole) && (
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href="/setup"
              className="hover:text-orange-500 w-full py-1"
            >
              Settings
            </Link>
          )}

          {/* Logout Option Inside Menu (Mobile Only) */}
          <div className="w-full pt-4 border-t border-gray-100 mt-2">
            <button
              onClick={handlelogout}
              className="flex items-center text-red-500 hover:text-red-600 cursor-pointer transition-colors w-full font-bold text-lg"
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
