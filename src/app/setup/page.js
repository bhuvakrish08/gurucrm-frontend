"use client";
import Link from "next/link";
import React from "react";
import Header from "../components/header";
import axios from "redaxios";
import CheckPermission from "../components/CheckPermission";
import { hasRoleAccess } from "@/utils/roleAccess";

export default function setupPage() {
  return (
    <>
      <Header />
      <CheckPermission allowedRoles={["Super Admin", "Admin"]}>
        <div className="bg-gray-100">
          <div className="bg-white w-full shadow-lg p-3 mt-1 mb-5">
            <div className="hidden sm:flex items-center text-gray-700">
              <p className="flex items-center flex-wrap">
                <Link
                  href="/dashboard"
                  className="mx-2 text-xl text-gray-400 hover:text-indigo-600"
                >
                  <i className="bi bi-house"></i>
                </Link>
                <i className="bi bi-chevron-right text-[10px]"></i>
                <Link
                  href="/setup"
                  className="mx-2 text-md text-gray-700 hover:text-orange-500 font-semibold"
                >
                  Settings
                </Link>
              </p>
            </div>
          </div>

          <div className="min-h-screen px-10 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Roles */}
              {hasRoleAccess(["Super Admin"]) && (
                <div className="bg-orange-50 rounded-sm shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-orange-500">
                    Roles
                  </h2>
                  <hr className="border-gray-300 my-3" />
                  <div className="flex flex-col space-y-2 text-gray-700">
                    <Link
                      href="/setup/roles/role-master"
                      className="hover:text-orange-600"
                    >
                      Role Master
                    </Link>
                    <Link
                      href="/setup/roles/designation-master"
                      className="hover:text-orange-600"
                    >
                      Designation Master
                    </Link>
                  </div>
                </div>
              )}

              {/* Inquiry/Leads */}
              <div className="bg-orange-50 rounded-sm shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-orange-500">
                  Inquiry/Leads
                </h2>
                <hr className="border-gray-300 my-3" />
                <div className="flex flex-col space-y-2 text-gray-700">
                  <Link
                    href="setup/inquiry-leads/inquiry-leads-category"
                    className="hover:text-orange-600"
                  >
                    Inquiry/Leads Category
                  </Link>
                  <Link
                    href="setup/inquiry-leads/inquiry-leads-source"
                    className="hover:text-orange-600"
                  >
                    Inquiry/Leads Source
                  </Link>
                  <Link
                    href="setup/inquiry-leads/inquiry-lead-activity"
                    className="hover:text-orange-600"
                  >
                    Inquiry/Lead Activity
                  </Link>
                </div>
              </div>

              {/* Ticket */}
              {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-800">Ticket</h2>
                            <hr className="border-gray-300 my-3" />
                            <div className="flex flex-col space-y-2 text-gray-700">
                                <Link href="setup/ticket/ticket-type" className="hover:text-indigo-600">Ticket Type</Link>
                                <Link href="setup/ticket/ticket-source" className="hover:text-indigo-600">Ticket Source</Link>
                                <Link href="setup/ticket/ticket-support" className="hover:text-indigo-600">Ticket Support</Link>
                            </div>
                        </div> */}

              {/* Tasks */}
              <div className="bg-orange-50 rounded-sm shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-orange-500">Tasks</h2>
                <hr className="border-gray-300 my-3" />
                <div className="flex flex-col text-gray-700">
                  <Link href="setup/tasks" className="hover:text-orange-600">
                    Task Status
                  </Link>
                </div>
              </div>

              {/* Expense */}
              {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-800">Expense</h2>
                            <hr className="border-gray-300 my-3" />
                            <div className="flex flex-col space-y-2 text-gray-700">
                                <Link href="setup/expense/expense-category" className="hover:text-indigo-600">Expense Category</Link>
                                <Link href="setup/expense/expense-sub-category" className="hover:text-indigo-600">Expense Sub Category</Link>
                            </div>
                        </div> */}

              {/* Contracts */}
              {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-800">Contracts</h2>
                            <hr className="border-gray-300 my-3" />
                            <div className="flex flex-col text-gray-700">
                                <Link href="setup/contracts" className="hover:text-indigo-600">Contract Types</Link>
                            </div>
                        </div> */}

              {/* Quotation */}
              {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-800">Quotation</h2>
                            <hr className="border-gray-300 my-3" />
                            <div className="flex flex-col text-gray-700">
                                <Link href="setup/quotation" className="hover:text-indigo-600">Quote Status</Link>
                            </div>
                        </div> */}

              {/* Product */}
              <div className="bg-orange-50 rounded-sm shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-orange-500">
                  Product
                </h2>
                <hr className="border-gray-300 my-3" />
                <div className="flex flex-col space-y-2 text-gray-700">
                  <Link
                    href="setup/product/product-master"
                    className="hover:text-orange-600"
                  >
                    Product Master
                  </Link>
                  <Link
                    href="setup/product/product-category"
                    className="hover:text-orange-600"
                  >
                    Product Category
                  </Link>
                  <Link
                    href="setup/product/product-unit"
                    className="hover:text-orange-600"
                  >
                    Product Unit
                  </Link>
                </div>
              </div>

              {/* Regions */}
              {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-800">Regions</h2>
                            <hr className="border-gray-300 my-3" />
                            <div className="flex flex-col space-y-2 text-gray-700">
                                <Link href="/country" className="hover:text-indigo-600">Country</Link>
                                <Link href="/state" className="hover:text-indigo-600">State</Link>
                                <Link href="/city" className="hover:text-indigo-600">City</Link>
                            </div>
                        </div> */}

              {/* ORG Master */}
              {hasRoleAccess(["Super Admin"]) && (
                <div className="bg-orange-50 rounded-sm shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-orange-500">
                    ORG Master
                  </h2>
                  <hr className="border-gray-300 my-3" />
                  <div className="flex flex-col space-y-2 text-gray-700">
                    <Link
                      href="/setup/org-master/read-table"
                      className="hover:text-orange-600"
                    >
                      Organization Profile
                    </Link>
                    {/* <Link href="/setup/org-master/org-notification" className="hover:text-orange-600">Organization Notification</Link> */}
                  </div>
                </div>
              )}

              {/* Email Template */}
              {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-800">Email Template</h2>
                            <hr className="border-gray-300 my-3" />
                            <div className="flex flex-col text-gray-700">
                                <Link href="/email-template" className="hover:text-indigo-600">Email Template</Link>
                            </div>
                        </div> */}

              {/* Industries */}
              <div className="bg-orange-50 rounded-sm shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-orange-500">
                  Industries
                </h2>
                <hr className="border-gray-300 my-3" />
                <div className="flex flex-col text-gray-700">
                  <Link
                    href="setup/industries"
                    className="hover:text-orange-600"
                  >
                    Industries
                  </Link>
                </div>
              </div>

              {/* Manage User */}
              <div className="bg-orange-50 rounded-sm shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-orange-500">
                  Manage User
                </h2>
                <hr className="border-gray-300 my-3" />
                <div className="flex flex-col text-gray-700">
                  <Link
                    href="/setup/manage-user"
                    className="hover:text-orange-600"
                  >
                    Manage User
                  </Link>
                </div>
              </div>

              {/* Miscellaneous Settings */}
              {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-800">Miscellaneous Settings</h2>
                            <hr className="border-gray-300 my-3" />
                            <div className="flex flex-col text-gray-700">
                                <Link href="/industries" className="hover:text-indigo-600">Miscellaneous Settings</Link>
                            </div>
                        </div> */}
            </div>
          </div>
        </div>
      </CheckPermission>
    </>
  );
}
