'use client'

import { useState, useEffect } from 'react'
import AgentLayout from '@/components/Layout/AgentLayout'
import { agentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { formatCurrency } from '@/lib/currency'

interface DashboardData {
  sales: {
    total: number
    pending: number
    approved: number
  }
  commissions: {
    total: number
    pending: number
    approved: number
  }
  wallet: {
    balance: number
    pendingBalance: number
    approvedBalance: number
  }
}

export default function AgentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await agentAPI.getDashboard()
        setData(response.data.data)
      } catch (error: any) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AgentLayout>
    )
  }

  return (
    <AgentLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Agent Dashboard</h1>

        {/* Wallet Summary */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm opacity-90">Total Balance</p>
              <p className="text-3xl font-bold">
  {formatCurrency(data?.wallet?.balance ?? 0)}
</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Pending</p>
              <p className="text-3xl font-bold">{formatCurrency(data?.wallet.pendingBalance)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Approved</p>
              <p className="text-3xl font-bold">{formatCurrency(data?.wallet.approvedBalance)}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800">{data?.sales.total || 0}</p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Sales</p>
                <p className="text-2xl font-bold text-yellow-600">{data?.sales.pending || 0}</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(data?.commissions.total)}</p>
              </div>
              <span className="text-3xl">💵</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Commissions</p>
                <p className="text-2xl font-bold text-orange-600">{data?.commissions.pending || 0}</p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/agent/properties"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-800">Browse Properties</h3>
              <p className="text-sm text-gray-600 mt-1">View available properties</p>
            </Link>
            <Link
              href="/agent/sales"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-800">Submit Sale</h3>
              <p className="text-sm text-gray-600 mt-1">Submit a new property sale</p>
            </Link>
            <Link
              href="/agent/wallet"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-800">Request Withdrawal</h3>
              <p className="text-sm text-gray-600 mt-1">Withdraw your earnings</p>
            </Link>
          </div>
        </div>
      </div>
    </AgentLayout>
  )
}

