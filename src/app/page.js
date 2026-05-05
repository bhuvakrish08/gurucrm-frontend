"use client";
import axios from "redaxios";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Image from "next/image";

// ─── Carousel Slides Data ─────────────────────────────────────────────────────
// Replace imageSrc with your own image paths inside /public folder
const SLIDES = [
  {
    id: 1,
    imageSrc: "/Fix-Window.jpg", // ← replace with your image path
    imageAlt: "Explore with Yetti",
    // headline: "EXPLORE.",
    // subtext: "LEARN. GROW.",
  },
  {
    id: 2,
    imageSrc: "/Fix-Window.jpg", // ← replace with your image path
    imageAlt: "Learn with Yetti",
    // headline: "LEARN.",
    // subtext: "DISCOVER. GROW.",
  },
  {
    id: 3,
    imageSrc: "/hybride-scaled-1.jpg", // ← replace with your image path
    imageAlt: "Grow with Yetti",
    // headline: "GROW.",
    // subtext: "EXPLORE. SUCCEED.",
  },
];

// ─── Left Panel: Image Carousel ───────────────────────────────────────────────
function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const next = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
      setFading(false);
    }, 400);
  }, []);

  // Auto-advance every 4 seconds
  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  const goTo = (index) => {
    if (index === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 400);
  };
  
  const slide = SLIDES[current];

  return (
    // ── Carousel wrapper ──────────────────────────────────────────────────────
    <div className="relative w-full h-full overflow-hidden rounded-sm">
      {/* ── Background image ───────────────────────────────────────────────  */}
      <Image
        src={slide.imageSrc}
        alt={slide.imageAlt}
        fill
        unoptimized
        className="object-cover object-center"
        style={{ opacity: fading ? 0 : 1, transition: "opacity 0.4s ease" }}
      />
      {/* ── Gradient overlay ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300/30 via-transparent to-sky-900/70 rounded-sm" />

      {/* ── Bottom text ───────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-14 left-6 right-6"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <h2 className="text-white font-extrabold text-3xl tracking-widest leading-snug drop-shadow-lg">
          {slide.headline}
        </h2>
        <p className="text-white/80 text-base font-bold tracking-widest drop-shadow mt-0.5">
          {slide.subtext}
        </p>
      </div>

      {/* ── Dot indicators ────────────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === current ? "24px" : "8px",
              height: "8px",
              borderRadius: "9999px",
              backgroundColor:
                i === current ? "white" : "rgba(255,255,255,0.45)",
              border: "none",
              cursor: "pointer",
              transition: "width 0.3s ease, background-color 0.3s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function Page() {
  // ── All original state — untouched ──────────────────────────────────────────

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── All original handlers — untouched ──────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/login`, formData);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("id", res.data.id);
      localStorage.setItem("username", res.data.username);

      toast.success("Login Successful");
      router.push("/dashboard");
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve));
      setMessage(err.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {};

  return (
    // ── Original background — untouched ──────────────────────────────────────
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fce7f3,#f8fafc,#dcfce7,#d1fae5)]">
      {" "}
      {/* //  ── Original blob effects — untouched ───────────────────────────────  */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-pink-200 opacity-30 rounded-full blur-[120px]"></div>
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-gray-200 opacity-30 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-20 left-1/4 w-[300px] h-[300px] bg-green-200 opacity-30 rounded-full blur-[120px]"></div>
      {/* ── NEW: Outer card wrapper — holds carousel + login side by side ─── */}
      <div className="relative z-10 w-[95%] sm:w-full max-w-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-xl border border-white/30 min-h-[500px] md:h-[520px]">
        {/* ── NEW: Left side — Image Carousel (hidden on mobile) ───────────── */}
        <div className="hidden md:block md:w-[45%] flex-shrink-0 h-full">
          <div className="relative w-full h-full">
            <ImageCarousel />
          </div>
        </div>
        {/* ── RIGHT side — Original login card (bg + all content unchanged) ── */}
        <div className="flex-1 bg-white/60 backdrop-blur-2xl flex flex-col justify-center items-center px-6 sm:px-10 py-10 rounded-xl md:rounded-none md:rounded-r-xl">
          {!forgotMode ? (
            <>
              {/* ── Company Logo ─────────────────────────────────────────── */}
              <div className="mb-4 flex flex-col items-center">
                <Image
                  src="/venster_logo.png"
                  alt="Company Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
                {/* <span className="text-sm font-semibold text-gray-500 tracking-widest mt-1 uppercase">
                  Venster Aluminium
                </span> */}
              </div>
              <h1 className="text-4xl font-extrabold text-gray-800 mb-6">
                Welcome Back
              </h1>
              <p className="text-gray-500 mb-8 text-center">
                Please login to your account
              </p>

              <form
                onSubmit={handleLogin}
                className="flex flex-col gap-4 w-full max-w-sm"
              >
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-sm outline-none focus:ring-1 focus:ring-orange-200 transition"
                  required
                />

                {/* Password */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-sm w-full  outline-none focus:ring-1 focus:ring-orange-200 transition"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xl cursor-pointer text-gray-600 hover:text-gray-900 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </span>
                </div>

                <p
                  onClick={() => setForgotMode(true)}
                  className="flex justify-end text-gray-600 cursor-pointer hover:underline"
                >
                  Forgot Password
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className={`p-3 rounded-sm font-semibold text-white transition ${
                    loading
                      ? "bg-orange-400 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-xl animate-spin"></div>
                      Please wait...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Forgot Password Form Model */}
              <h1 className="text-3xl font-bold mb-6">Reset Password</h1>
              <form
                onSubmit={handleForgotPassword}
                className="flex flex-col gap-4 w-full"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="p-3 border rounded-sm"
                  required
                />
                <button
                  type="submit"
                  className="p-3 bg-orange-500 text-white rounded-sm"
                >
                  Send Reset Link
                </button>
              </form>
              <button
                onClick={() => setForgotMode(false)}
                className="mt-4 text-gray-500 hover:underline"
              >
                Back to Login
              </button>
            </>
          )}

          {message && (
            <p className="mt-6 text-red-500 font-medium">{message}</p>
          )}
        </div>
        {/* ── END right side ─────────────────────────────────────────────────── */}
      </div>
      {/* ── END outer card wrapper ─────────────────────────────────────────── */}
    </div>
  );
}
// login page with final images
