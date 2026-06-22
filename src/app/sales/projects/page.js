'use client'

import Header from '@/app/components/header'
import React, { useEffect, useState } from 'react'

// Set this in .env.local as: NEXT_PUBLIC_API_URL=http://localhost:5000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function formatCurrency(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '-'
  return num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  })
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Page() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)

        // ⚠️ Update 'token' below to match the actual key name you use
        // when saving the JWT after login (check DevTools → Application → Local Storage)
        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('You are not logged in. Please login again.')
        }

        const res = await fetch(`${API_BASE_URL}/api/project/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          throw new Error('Session expired. Please login again.')
        }

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`)
        }

        const json = await res.json()

        if (!json.success) {
          throw new Error(json.message || 'Failed to load projects')
        }

        setProjects(json.data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <div>
      <Header />

      <div className="p-4 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${projects.length} total records`}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Quotation No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Quotation Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Grand Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Architecture Net
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Expense Net
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Net Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Created At
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-gray-500">
                      Loading projects...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-red-600">
                      Error: {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && projects.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {project.quotation_no || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {project.company_name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {project.customer_name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {project.reference || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {project.source || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                        {formatDate(project.quotation_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(project.grand_total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                        {formatCurrency(project.architecture_net_amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                        {formatCurrency(project.expense_net_amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                        {formatCurrency(project.net_revenue_amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {formatDate(project.created_at)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page