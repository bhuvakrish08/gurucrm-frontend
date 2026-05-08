"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "redaxios";
import Header from "@/app/components/header";
import { toast } from "react-toastify";
import useAuth from "@/app/components/useAuth";

export default function AddUserForm() {

    useAuth(["Super Admin"]);

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    const [organizations, setOrganizations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [emailExists, setEmailExists] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        mobile: "",
        date_of_birth: "",
        date_of_joining: "",
        role: "",
        organization: "",
        designation: "",
        country: "",
        state: "",
        city: "",
        pincode: "",
        password: "",
        confirm_password: "",
        address: "",
    });

    const checkEmailExists = async (email) => {
        if (!email) return;
        try {
            const res = await axios.get(`${API_BASE}/api/manage-user/read-email`, {
                params: { email },
            });

            if (res.data.exists) {
                setEmailExists(true);
            } else {
                setEmailExists(false);
            }
        } catch (err) {
            console.error("Email check failed:", err);
            setEmailExists(false);
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === "email") {
            clearTimeout(window.emailCheckTimeout);
            window.emailCheckTimeout = setTimeout(() => checkEmailExists(value), 600);
        }
    };


    const convertDateFormat = (dateStr) => {
        if (!dateStr) return "";
        const [yyyy, mm, dd] = dateStr.split("-");
        return `${yyyy}-${mm}-${dd}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (emailExists) {
            toast.error("Email already exists. Please use a different one.");
            return;
        }

        // Password Match Check
        if (formData.password !== formData.confirm_password) {
            toast.error("Passwords do not match!");
            return;
        }

        try {
            const payload = {
                first_name: formData.first_name,
                middle_name: formData.middle_name,
                last_name: formData.last_name,
                email: formData.email,
                mobile: formData.mobile,
                date_of_birth: formData.date_of_birth,
                date_of_joining: formData.date_of_joining,
                role: formData.role,
                organization: formData.organization,
                designation: formData.designation,
                country: formData.country,
                state: formData.state,
                city: formData.city,
                pincode: formData.pincode,
                password: formData.password,
                address: formData.address,
            };

            const res = await axios.post(`${API_BASE}/api/manage-user/insert`, payload);

            if (res.status === 201 || res.status === 200) {
                toast.success("User added successfully!");
                setFormData({
                    first_name: "",
                    middle_name: "",
                    last_name: "",
                    email: "",
                    mobile: "",
                    date_of_birth: "",
                    date_of_joining: "",
                    role: "",
                    organization: "",
                    designation: "",
                    country: "",
                    state: "",
                    city: "",
                    pincode: "",
                    password: "",
                    confirm_password: "",
                    address: "",
                });
            } else {
                toast.error("Something went wrong. Try again!");
            }
        } catch (err) {
            toast.error("Failed to add user. Something went wrong!");
        }
    };

    // to fetch active organizations
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/organizations/organization-name`, {
                    params: { status: 1 }
                });
                setOrganizations(res.data.data);
            } catch (err) {
                console.error("Failed to fetch designations:", err);
            }
        };

        fetchOrganizations();
    }, []);

    // to fetch active roles name
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/role-master/role-name`, {
                    params: { status: 1 }
                });
                setRoles(res.data.data);
            } catch (err) {
                console.error("Failed to fetch designations:", err);
            }
        };

        fetchRoles();
    }, []);


    // to fetch active contact designation
    useEffect(() => {
        const fetchDesignations = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/contact/read`, {
                    params: { status: 1 }
                });
                setDesignations(res.data || res.data.data);
            } catch (err) {
                console.error("Failed to fetch designations:", err);
            }
        };

        fetchDesignations();
    }, []);

    const handleReset = () => {
        // Reset form fields
        setFormData({
            first_name: "",
            middle_name: "",
            last_name: "",
            email: "",
            mobile: "",
            date_of_birth: "",
            date_of_joining: "",
            role: "",
            organization: "",
            designation: "",
            country: "",
            state: "",
            city: "",
            pincode: "",
            password: "",
            confirm_password: "",
            address: "",
        });
        setEmailExists(false);
    };

    return (
        <>
            <Header />
            <div className="bg-gray-100">
                {/* Breadcrumb */}
                <div className="bg-white w-full rounded-2xl shadow-lg p-2 mt-1 mb-5 flex justify-between items-center">
                    <div className="flex items-center text-gray-700">
                        <p>
                            <Link href="/dashboard" className="mx-3 text-xl text-gray-400 hover:text-indigo-600">
                                <i className="bi bi-house"></i>
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="/setup" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                Setup
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="/setup/manage-user" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                Manage User
                            </Link>
                            <i className="bi bi-chevron-right"></i>
                            <Link href="/setup/manage-user/add-user" className="mx-3 text-md text-gray-700 hover:text-indigo-600">
                                Add User
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="bg-white p-3 mt-1 rounded-2xl shadow-sm border text-gray-500 border-gray-200 mx-5">
                    <h2 className="text-xl text-black">Add User</h2>
                    <hr className="text-gray-300 mb-2 mt-2" />
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            {/* Row 1 */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    First Name *
                                </label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full border rounded-sm px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Middle Name
                                </label>
                                <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Last Name *
                                </label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            {/* Row 2 */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">Email *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full border rounded-sm px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200 ${emailExists ? "border-red-500" : ""}`} required />

                                {/* Smooth error message */}
                                <p className={`text-red-500 text-xs transition-all duration-300 ease-in-out ${emailExists
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 -translate-y-1 pointer-events-none"
                                    }`}>
                                    Email already exists
                                </p>
                            </div>

                            <div className="mb-2">
                                <label className="block text-sm text-gray-500 mb-1">
                                    Mobile Number *
                                </label>
                                <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Date of Birth *
                                </label>
                                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            {/* Row 3 */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Date of Joining *
                                </label>
                                <input type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>

                                <label className="block text-sm text-gray-500 mb-1">
                                    Role *
                                </label>

                                <select name="role" value={formData.role} onChange={handleChange} className="w-full border rounded-sm px-3 py-2 bg-white">
                                    <option value="">
                                        Select Role
                                    </option>

                                    {roles.map((item) => (

                                        <option key={item.id} value={item.name}                                         >
                                            {item.name}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            <div className="mb-2">
                                <label className="block text-sm text-gray-500 mb-1">
                                    Organization
                                </label>
                                <select name="organization" value={formData.organization} onChange={handleChange} className="w-full border rounded-sm px-3 py-2 bg-white">
                                    <option value="">Select Organization</option>
                                    {organizations.map((item) => (
                                        <option key={item.id || item.organization_name} value={item.organization_name}>
                                            {item.organization_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 4 */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Designation *
                                </label>
                                <select name="designation" value={formData.designation} onChange={handleChange} className="w-full border rounded-sm px-3 py-2">
                                    <option value="">Select Contact Designation</option>
                                    {designations.map((item) => (
                                        <option key={item.id || item.name} value={item.name}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Country
                                </label>
                                <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    State
                                </label>
                                <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />

                            </div>

                            {/* Row 5 */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    City
                                </label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Pin Code
                                </label>
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Password *
                                </label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            {/* Row 6 */}
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Confirm Password *
                                </label>
                                <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="w-full border rounded-sm px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    Address
                                </label>
                                <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full border rounded-sm px-3 py-2">

                                </textarea>
                            </div>
                        </div>
                        {/* Buttons */}
                        <div className="flex justify-end gap-3">
                            <button type="submit" className="px-5 py-2 bg-blue-800 text-white rounded-sm hover:bg-blue-900">
                                Save
                            </button>
                            <button type="button" onClick={handleReset} className="px-5 py-2 bg-gray-100 rounded-sm text-gray-700 border hover:bg-gray-200">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
