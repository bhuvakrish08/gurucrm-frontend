"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { checkRole } from "@/utils/checkRole";

export default function CheckPermission({
  allowedRoles = [],
  children,
}) {
  const router = useRouter();
  const shown = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAllowed = checkRole(allowedRoles);

  useEffect(() => {
    if (mounted && !isAllowed && !shown.current) {
      toast.error("Permission Denied");
      shown.current = true;
      router.back();
    }
  }, [mounted, isAllowed]);

  if (!mounted || !isAllowed) return null;

  return children;
}