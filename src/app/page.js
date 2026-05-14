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
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("login"); // login | forgot | otp | reset
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(120);
  const [userId, setUserId] = useState("");
  useEffect(() => {
    if (step === "otp" && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer, step]);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_BASE}/api/send-otp`, {
        identifier: formData.email,
      });

      setOtp("");              // 🔥 CLEAR OLD OTP
      setIdentifier(formData.email);
      setStep("otp");
      setTimer(120);

      toast.success("OTP sent");
    } catch (err) {
      toast.error(err.data?.message || "Error");
    }
  };

  //verify otp
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_BASE}/api/verify-otp`, {
        identifier,
        otp,
      });

      setUserId(res.data.userId);
      setStep("reset");

      toast.success("OTP verified");
    } catch {
      toast.error("Invalid OTP");
    }
  };

  //resetpassword
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      await axios.post(`${API_BASE}/api/reset-password`, {
        userId,
        password: formData.password,
      });

      toast.success("Password updated");
      setStep("login");
    } catch {
      toast.error("Error resetting password");
    }
  };

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
        {/* NOTE: removed max-w-md (handled by outer wrapper now),
                  removed z-10 (handled by outer wrapper),
                  changed rounded-3xl → rounded-r-3xl on md, rounded-3xl on mobile
                  everything else is identical to original */}
        <div className="flex-1 bg-white/60 backdrop-blur-2xl flex flex-col justify-center items-center px-10 py-12 rounded-r-xl">
          {/* ───── STEP आधारित UI ───── */}

          {step === "login" && (
            <>
              {/* Logo */}
              <div className="mb-4 flex flex-col items-center">
                <Image
                  src="/venster_logo.png"
                  alt="Company Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>

              <h1 className="text-4xl font-extrabold text-gray-800 mb-6">
                Welcome Back
              </h1>

              <p className="text-gray-500 mb-8 text-center">
                Please login to your account
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm">
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="p-3 border border-gray-300 rounded-sm"
                  required
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="p-3 border border-gray-300 rounded-sm w-full"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                  </span>
                </div>

                <p
                  onClick={() => setStep("forgot")}
                  className="text-right text-gray-600 cursor-pointer hover:underline"
                >
                  Forgot Password
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className={`p-3 rounded-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer duration-300 ${loading
                      ? "bg-orange-400 cursor-not-allowed opacity-80"
                      : "bg-orange-500 hover:bg-orange-600"
                    }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ───── FORGOT ───── */}
          {step === "forgot" && (
            <>
              <h1 className="text-3xl font-bold mb-6">Reset Password</h1>

              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4 w-full">
                <input
                  type="text"
                  placeholder="Enter email or mobile"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="p-3 border rounded-sm"
                  required
                />

                <button className="p-3 bg-orange-500 text-white rounded-sm">
                  Send OTP
                </button>
              </form>

              <button
                onClick={() => setStep("login")}
                className="mt-4 text-gray-500 hover:underline"
              >
                Back to Login
              </button>
            </>
          )}

          {/* ───── OTP ───── */}
          {step === "otp" && (
            <>
              <h1 className="text-3xl font-bold mb-4">Verify OTP</h1>

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 w-full">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  name="otp"
                  maxLength={6}
                  className="p-3 border rounded-sm text-center text-lg tracking-widest"
                />

                <button className="p-3 bg-orange-500 text-white rounded-sm">
                  Verify OTP
                </button>
              </form>

              <div className="mt-3">
                {timer > 0 ? (
                  <p>Resend in {timer}s</p>
                ) : (
                  <button
                    onClick={handleForgotPassword}
                    className="text-orange-500 hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {/* ───── RESET PASSWORD ───── */}
          {step === "reset" && (
            <>
              <h1 className="text-3xl font-bold mb-4">New Password</h1>

              <form onSubmit={handleResetPassword} className="flex flex-col gap-4 w-full">
                <input
                  type="password"
                  name="password"
                  placeholder="New Password"
                  onChange={handleChange}
                  className="p-3 border rounded-sm"
                />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  onChange={handleChange}
                  className="p-3 border rounded-sm"
                />

                <button className="p-3 bg-orange-500 text-white rounded-sm">
                  Update Password
                </button>
              </form>
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
