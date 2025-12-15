'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/Layout/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/currency'

interface Commission {
  id: string
  saleId: string
  userId: string
  level: number
  percentage: number
  amount: number
  status: string
  createdAt: string
  sale: {
    id: string
    property: {
      name: string
    }
  }
  user: {
    id: string
    name: string
    email: string
  }
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    fetchCommissions()
    // Mark commissions as viewed when page loads
    adminAPI.markCommissionsViewed().catch((error) => {
      console.error('Failed to mark commissions as viewed:', error)
    })
  }, [filter])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getCommissions({ status: filter || undefined })
      setCommissions(response.data.data.commissions)
    } catch (error: any) {
      console.error('Failed to load commissions:', error)
      if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection.')
      } else if (error.request) {
        toast.error('Cannot connect to server. Please check if backend is running.')
      } else {
        toast.error('Failed to load commissions')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this commission? This will credit the agent\'s wallet.')) return

    try {
      await adminAPI.approveCommission(id)
      toast.success('Commission approved')
      fetchCommissions()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve commission')
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this commission?')) return

    try {
      await adminAPI.rejectCommission(id)
      toast.success('Commission rejected')
      fetchCommissions()
    } catch (error: any) {
      toast.error('Failed to reject commission')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 0:
        return 'Seller'
      case 1:
        return 'Level 1'
      case 2:
        return 'Level 2'
      default:
        return `Level ${level}`
    }
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Commissions Management</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {commission.sale.property.name}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{commission.user.name}</p>
                      <p className="text-xs text-gray-500">{commission.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                      {getLevelLabel(commission.level)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {commission.percentage}%
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(commission.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                      {commission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(commission.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    {commission.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(commission.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(commission.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {commissions.length === 0 && (
            <div className="text-center py-12 text-gray-500">No commissions found</div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

