'use client'

import { useState, useEffect } from 'react'
import AgentLayout from '@/components/Layout/AgentLayout'
import { agentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/currency'

interface Commission {
  id: string
  saleId: string
  level: number
  percentage: number
  amount: number
  status: string
  createdAt: string
  sale: {
    id: string
    property: {
      name: string
      location: string
    }
    seller: {
      name: string
      email: string
    }
  }
}

export default function AgentCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    fetchCommissions()
  }, [filter])

  const fetchCommissions = async () => {
    try {
      const response = await agentAPI.getCommissions({ status: filter || undefined })
      setCommissions(response.data.data.commissions)
    } catch (error: any) {
      toast.error('Failed to load commissions')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AgentLayout>
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
        return 'Seller Commission'
      case 1:
        return 'Level 1 Commission'
      case 2:
        return 'Level 2 Commission'
      default:
        return `Level ${level} Commission`
    }
  }

  const totalCommissions = commissions.reduce((sum, c) => sum + (c.amount ?? 0), 0)
  const approvedCommissions = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.amount ?? 0), 0)
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount ?? 0), 0)

  return (
    <AgentLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Commissions</h1>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-600 mb-2">Total Commissions</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalCommissions)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-600 mb-2">Approved</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(approvedCommissions)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-600 mb-2">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingCommissions)}</p>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{commission.sale.property.name}</p>
                      <p className="text-sm text-gray-500">{commission.sale.property.location}</p>
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
                    {formatCurrency(commission.amount ?? 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                      {commission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(commission.createdAt), 'MMM dd, yyyy')}
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
    </AgentLayout>
  )
}

