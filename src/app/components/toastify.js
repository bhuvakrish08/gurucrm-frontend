"use client";

import React from "react";
import { toast, ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* custom animation using inline keyframes */

const FadeSlide = cssTransition({
  enter: "fadeSlideIn",
  exit: "fadeSlideOut",
  duration: [350, 350],
});

/* Custom Close Button component pinned to Top-Right */
const CustomCloseButton = ({ closeToast }) => (
  <button
    type="button"
    onClick={closeToast}
    aria-label="Close notification"
    className="toast-custom-close-btn"
    style={{
      position: "absolute",
      top: "7px",
      right: "8px",
      zIndex: 9999,
      background: "transparent",
      border: "none",
      outline: "none",
      cursor: "pointer",
      opacity: 0.6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3px",
      borderRadius: "50%",
      color: "inherit",
      transition: "opacity 0.2s ease, transform 0.2s ease",
    }}
  >
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
);

/* inject keyframes and styles dynamically */
if (typeof document !== "undefined") {
  const styleId = "glass-water-toast-styles";
  let style = document.getElementById(styleId);
  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.innerHTML = `
  @keyframes fadeSlideIn {
    0% {
      opacity: 0;
      transform: translateX(40px) scale(0.94);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @keyframes fadeSlideOut {
    0% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateX(40px) scale(0.90);
    }
  }

  .fadeSlideIn {
    animation: fadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .fadeSlideOut {
    animation: fadeSlideOut 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
  }

  /* Target ReactToastify container overrides with Frosted Glass Effect */
  .Toastify__toast-container .Toastify__toast.glass-water-toast,
  .Toastify__toast.glass-water-toast {
    position: relative !important;
    overflow: hidden !important;
    border-radius: 14px !important;
    padding: 12px 34px 12px 14px !important;
    font-size: 14px !important;
    font-weight: 550 !important;
    letter-spacing: -0.01em !important;
    min-width: 260px !important;
    max-width: 440px !important;

    /* Frosted Glassmorphism Blur & Saturation */
    -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
    backdrop-filter: blur(12px) saturate(180%) !important;

    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  }

  /* Specular Top Glass Reflection Sheen */
  .Toastify__toast.glass-water-toast::before {
    content: "" !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 45% !important;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.55) 0%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0) 100%
    ) !important;
    pointer-events: none !important;
    z-index: 1 !important;
  }

  /* Toast body padding and layout */
  .Toastify__toast-container .Toastify__toast.glass-water-toast .Toastify__toast-body,
  .Toastify__toast.glass-water-toast .Toastify__toast-body {
    position: relative !important;
    z-index: 2 !important;
    padding: 0 !important;
    margin: 0 !important;
    display: flex !important;
    align-items: center !important;
  }

  .toast-custom-close-btn:hover {
    opacity: 1 !important;
    transform: scale(1.15) !important;
  }

  /* Hover effect */
  .Toastify__toast.glass-water-toast:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 14px 34px -4px rgba(0, 0, 0, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9) !important;
  }

  /* Success Theme (Translucent Glass Light Green) */
  .Toastify__toast-container .Toastify__toast.glass-water-toast-success,
  .Toastify__toast.glass-water-toast-success {
    background: rgba(240, 253, 244, 0.82) !important;
    color: #14532d !important;
    border: 1px solid rgba(187, 247, 208, 0.8) !important;
    box-shadow: 0 10px 25px -4px rgba(34, 197, 94, 0.18), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.85) !important;
  }

  /* Error Theme (Translucent Glass Light Red) */
  .Toastify__toast-container .Toastify__toast.glass-water-toast-error,
  .Toastify__toast.glass-water-toast-error {
    background: rgba(254, 242, 242, 0.82) !important;
    color: #7f1d1d !important;
    border: 1px solid rgba(254, 202, 202, 0.8) !important;
    box-shadow: 0 10px 25px -4px rgba(239, 68, 68, 0.18), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.85) !important;
  }

  /* Info Theme (Translucent Glass Light Blue) */
  .Toastify__toast-container .Toastify__toast.glass-water-toast-info,
  .Toastify__toast.glass-water-toast-info {
    background: rgba(239, 246, 255, 0.82) !important;
    color: #1e3a8a !important;
    border: 1px solid rgba(191, 219, 254, 0.8) !important;
    box-shadow: 0 10px 25px -4px rgba(59, 130, 246, 0.18), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.85) !important;
  }

  /* Warning Theme (Translucent Glass Light Yellow) */
  .Toastify__toast-container .Toastify__toast.glass-water-toast-warning,
  .Toastify__toast.glass-water-toast-warning {
    background: rgba(255, 251, 235, 0.84) !important;
    color: #78350f !important;
    border: 1px solid rgba(253, 230, 138, 0.8) !important;
    box-shadow: 0 10px 25px -4px rgba(245, 158, 11, 0.18), inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.85) !important;
  }
  `;
}

/* theme configurations */

const toastIcons = {
  success: "🌿",
  error: "🍓",
  info: "💎",
  warning: "🌤",
};

/* override toast methods */

["success", "error", "info", "warning"].forEach((type) => {
  const original = toast[type];

  toast[type] = (message, options = {}) =>
    original(message, {
      icon: toastIcons[type],
      className: `glass-water-toast glass-water-toast-${type} ${options.className || ""}`,
      ...options,
    });
});

/* provider */

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={2500}
      hideProgressBar
      transition={FadeSlide}
      closeOnClick
      pauseOnHover
      draggable
      closeButton={CustomCloseButton}
      toastStyle={{
        marginBottom: "14px",
        background: "transparent",
        boxShadow: "none",
      }}
    />
  );
}