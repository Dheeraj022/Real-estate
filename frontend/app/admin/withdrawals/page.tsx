'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/Layout/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/currency'

interface Withdrawal {
  id: string
  userId: string
  amount: number
  status: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  bankDetails?: {
    bankName: string
    accountHolderName: string
    accountNumber: string
    ifscCode: string
    email: string
  }
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    fetchWithdrawals()
    // Mark withdrawals as viewed when page loads
    adminAPI.markWithdrawalsViewed().catch((error) => {
      console.error('Failed to mark withdrawals as viewed:', error)
    })
  }, [filter])

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getWithdrawals({ status: filter || undefined })
      setWithdrawals(response.data.data.withdrawals)
    } catch (error: any) {
      console.error('Failed to load withdrawals:', error)
      if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection.')
      } else if (error.request) {
        toast.error('Cannot connect to server. Please check if backend is running.')
      } else {
        toast.error('Failed to load withdrawals')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this withdrawal request?')) return

    try {
      await adminAPI.approveWithdrawal(id)
      toast.success('Withdrawal approved')
      fetchWithdrawals()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve withdrawal')
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this withdrawal request?')) return

    try {
      await adminAPI.rejectWithdrawal(id)
      toast.success('Withdrawal rejected')
      fetchWithdrawals()
    } catch (error: any) {
      toast.error('Failed to reject withdrawal')
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

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Withdrawal Requests</h1>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{withdrawal.user.name}</p>
                        <p className="text-sm text-gray-500">{withdrawal.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4">
                      {withdrawal.bankDetails ? (
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><span className="font-medium">Bank:</span> {withdrawal.bankDetails.bankName}</p>
                          <p><span className="font-medium">Account:</span> {withdrawal.bankDetails.accountNumber}</p>
                          <p><span className="font-medium">IFSC:</span> {withdrawal.bankDetails.ifscCode}</p>
                          <p><span className="font-medium">Holder:</span> {withdrawal.bankDetails.accountHolderName}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-red-600">No bank details</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(withdrawal.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(withdrawal.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.id)}
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
          </div>
          {withdrawals.length === 0 && (
            <div className="text-center py-12 text-gray-500">No withdrawal requests found</div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

