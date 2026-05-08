"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

export default function useAuth(allowedRoles = []) {
  const router = useRouter();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const logoutUser = (message = "Please Login Again") => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      toast.error(message);

      router.replace("/");
    };

    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      // No token
      if (!token) {
        logoutUser("Please Login First");
        return;
      }

      try {
        const decoded = jwtDecode(token);

        // Token Expired
        if (decoded.exp * 1000 < Date.now()) {
          logoutUser("Session Expired, Please Login Again");
          return;
        }

        // Role Check
        if (
          allowedRoles.length > 0 &&
          !allowedRoles.includes(role)
        ) {
          toast.error("Access Denied");
          router.replace("/");
          return;
        }
      } catch (error) {
        logoutUser("Invalid Token, Please Login Again");
      }
    };

    // Initial check
    checkAuth();

    // Detect token removal/change from localStorage
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        logoutUser("Session Ended");
      }
    };

    // Listen for localStorage changes
    window.addEventListener("storage", handleStorageChange);

    // Also continuously check token every 1 second
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");

      if (!token) {
        logoutUser("Session Ended");
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [router, allowedRoles]);
}