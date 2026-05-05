"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "redaxios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import Header from "../components/header";
import { toast } from "react-toastify";
import Link from "next/link";
import useAuth from "../components/useAuth";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

const API_base = `${API_BASE}/api/todos`;

export default function Page() {
  const [todos, setTodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodo, setCurrentTodo] = useState({ id: null, title: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useAuth();

  const router = useRouter();

  // Helper to get axios config with JWT
  const getConfig = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); // Redirect if no token
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch all todos
  const fetchTodos = useCallback(async () => {
    try {
      const config = getConfig();
      if (!config) return;

      const res = await axios.get(`${API_base}/read`, config);
      setTodos(res.data);
    } catch (err) {
      console.error("Error fetching todos:", err);
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        localStorage.removeItem("token");
        router.push("/");
      }
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Open modal for add/edit
  const openModal = (todo = null) => {
    if (todo) {
      setIsEditing(true);
      setCurrentTodo({ id: todo.id, title: todo.title });
    } else {
      setIsEditing(false);
      setCurrentTodo({ id: null, title: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // Add or update todo
  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentTodo.title.trim()) return;

    try {
      setIsSubmitting(true); // ✅ START

      const config = getConfig();
      if (!config) return;

      if (isEditing) {
        await axios.put(
          `${API_base}/update/${currentTodo.id}`,
          { title: currentTodo.title },
          config,
        );
      } else {
        await axios.post(
          `${API_base}/insert`,
          { title: currentTodo.title },
          config,
        );
      }

      closeModal();
      fetchTodos();
    } catch (err) {
      console.error("Error saving todo:", err);
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        localStorage.removeItem("token");
        router.push("/");
      }
    } finally {
      setIsSubmitting(false); // ✅ STOP
    }
  };

  // Toggle finish/unfinish
  const handleToggle = async (id) => {
    try {
      const config = getConfig();
      if (!config) return;

      await axios.put(`${API_base}/finish/${id}`, {}, config);
      fetchTodos();
    } catch (err) {
      console.error("Error toggling todo:", err);
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        localStorage.removeItem("token");
        router.push("/");
      }
    }
  };

  // Delete todo
  const handleDelete = async (id) => {
    // const confirmed = await Swal.fire({
    //   title: "Are you sure you want to delete this task?",
    //   showCancelButton: true,
    //   confirmButtonText: "Yes",
    //   cancelButtonText: "No",
    // }).then((result) => result.isConfirmed);

    const confirmed = await Swal.fire({
      html: `
    <div style="display:flex; flex-direction:column; align-items:center; gap:12px; padding: 8px 0">
      <div style="width:56px; height:56px; background:#fff4ed; border-radius:50%; display:flex; align-items:center; justify-content:center;">
        <svg width="28" height="28" fill="none" stroke="#f97316" stroke-width="1.8" viewBox="0 0 24 24">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
      </div>
      <p style="font-size:17px; font-weight:600; color:#1f2937; margin:0;">Delete Task?</p>
      <p style="font-size:13px; color:#9ca3af; margin:0;">This action cannot be undone.</p>
    </div>
  `,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        popup: "swal-todo-popup",
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn",
        actions: "swal-actions",
      },
      didOpen: () => {
        const style = document.createElement("style");
        style.innerHTML = `
      .swal-todo-popup { border-radius: 20px !important; padding: 28px 24px !important; width: 340px !important; box-shadow: 0 20px 60px rgba(0,0,0,0.12) !important; }
      .swal-actions { gap: 10px !important; margin-top: 20px !important; }
      .swal-confirm-btn { background: #f97316; color: white; padding: 9px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: background 0.2s; }
      .swal-confirm-btn:hover { background: #ea6c0a; }
      .swal-cancel-btn { background: #f3f4f6; color: #6b7280; padding: 9px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: background 0.2s; }
      .swal-cancel-btn:hover { background: #e5e7eb; }
    `;
        document.head.appendChild(style);
      },
    }).then((result) => result.isConfirmed);

    if (!confirmed) return;

    try {
      const config = getConfig();
      if (!config) return;

      await axios.delete(`${API_base}/delete/${id}`, config);
      fetchTodos();
    } catch (err) {
      console.error("Error deleting todo:", err);
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        localStorage.removeItem("token");
        router.push("/");
      }
    }
  };

  const unfinished = todos.filter((t) => !t.is_finished);
  const finished = todos.filter((t) => t.is_finished);

  const formatTime = (dateString) => {
    const localDate = new Date(dateString);
    return localDate.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className=" bg-gray-100 ">
      <Header />
      {/* bredcrumb */}
      {/* <div className="bg-white w-full  shadow-lg p-3 mt-1 mb-5 top-10 sticky z-10"> */}
      <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div className="hidden sm:flex items-center text-gray-700 w-full sm:w-auto">
          <p className="flex items-center flex-wrap">
            <Link
              href="/dashboard"
              className="mx-2 text-xl text-gray-400 hover:text-indigo-600"
            >
              <i className="bi bi-house"></i>
            </Link>
            <i className="bi bi-chevron-right text-[10px]"></i>
            <Link
              href="/todolist"
              className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
            >
              Todo List
            </Link>
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-sm text-sm font-bold tracking-wide transition-all shadow-sm"
        >
          + ADD TODO
        </button>
      </div>

      {/* Todos Grid */}
      <div className="bg-white w-full max-w-5xl rounded-sm shadow-lg p-6 mt-5 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Unfinished */}
          <div className="bg-white border border-gray-100 p-5 rounded-sm shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-lg bg-orange-500 inline-block"></span>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 ">
                Unfinished Tasks
              </h3>
              <span className="ml-auto text-xs font-medium bg-orange-50 text-orange-500 px-2.5 py-0.5 rounded-sm ">
                {unfinished.length}
              </span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {unfinished.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <svg
                    className="w-10 h-10 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-sm">All caught up!</p>
                </div>
              )}
              {unfinished.map((t) => (
                <div
                  key={t.id}
                  className="group flex justify-between items-center bg-orange-50  border border-transparent hover:border-orange-200 rounded-sm px-3 py-3 transition-all  hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.is_finished}
                      onChange={() => handleToggle(t.id)}
                      className="w-4 h-4 accent-green-500 mt-1.5 cursor-pointer flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium text-gray-800 text-sm leading-snug">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Created: {formatTime(t.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(t)}
                      className="p-1.5  text-gray-300 hover:text-blue-600  transition-all "
                    >
                      <i className="bi bi-pencil-square text-md"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5  text-gray-300 hover:text-red-600  transition-all "
                    >
                      <i className="bi bi-trash3 text-md"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finished */}
          <div className="bg-white border border-gray-100 p-5 rounded-sm shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-lg bg-green-500 inline-block"></span>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 ">
                Finished Tasks
              </h3>
              <span className="ml-auto text-xs font-medium bg-green-50 text-green-600 px-2.5 py-0.5 rounded-sm ">
                {finished.length}
              </span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {finished.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <svg
                    className="w-10 h-10 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm">Nothing completed yet</p>
                </div>
              )}
              {finished.map((t) => (
                <div
                  key={t.id}
                  className="group flex justify-between items-center bg-green-50/50 hover:bg-green-50 border border-transparent hover:border-green-100 rounded-xl px-3 py-3 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={t.is_finished}
                      onChange={() => handleToggle(t.id)}
                      className="w-4 h-4 accent-green-500 mt-1.5 cursor-pointer flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium text-gray-400 line-through text-sm leading-snug">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Finished: {formatTime(t.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5  text-gray-300 hover:text-red-600  transition-all "
                  >
                    <i className="bi bi-trash3 text-md"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-md shadow-xl p-6 ">
            <h3 className="text-xl font-semibold mb-4 text-gray-700 flex items-center justify-between">
              {isEditing ? "Edit ToDo" : "Add New ToDo"}
              <button
                onClick={() => setShowModal(false)}
                className=" flex items-center justify-center text-md  text-gray-400 hover:text-orange-500 transition-all"
              >
                ✕
              </button>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                placeholder="Enter title..."
                value={currentTodo.title}
                onChange={(e) =>
                  setCurrentTodo({ ...currentTodo, title: e.target.value })
                }
                className="w-full border border-gray-300 rounded-sm p-2 focus:ring-1 focus:ring-orange-200 outline-none focus:border-transparent mb-3"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded-sm border-gray-200 text-gray-600 hover:bg-gray-100 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-24 px-4 py-2 bg-orange-500 text-white rounded-sm hover:bg-orange-600 font-medium flex items-center justify-center
    ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
  `}
                >
                  {isSubmitting ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="4"
                        opacity="0.25"
                      />
                      <path
                        fill="white"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  ) : isEditing ? (
                    "Update"
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
