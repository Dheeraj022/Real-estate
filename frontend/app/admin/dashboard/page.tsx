'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/Layout/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/currency'

interface DashboardStats {
  totalAgents: number
  totalProperties: number
  totalSales: number
  pendingSales: number
  totalCommissions: number
  pendingCommissions: number
  totalWithdrawals: number
  pendingWithdrawals: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const response = await adminAPI.getDashboard()
        setStats(response.data.data)
      } catch (error: any) {
        console.error('Failed to load dashboard:', error)
        if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
          toast.error('Request timed out. Please check your connection.')
        } else if (error.request) {
          toast.error('Cannot connect to server. Please check if backend is running.')
        } else {
          toast.error('Failed to load dashboard data')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const statCards = [
    { label: 'Total Agents', value: stats?.totalAgents || 0, color: 'blue', icon: '👥' },
    { label: 'Total Properties', value: stats?.totalProperties || 0, color: 'green', icon: '🏠' },
    { label: 'Total Sales', value: stats?.totalSales || 0, color: 'purple', icon: '💰' },
    { label: 'Pending Sales', value: stats?.pendingSales || 0, color: 'yellow', icon: '⏳' },
    { 
  label: 'Total Commissions', 
  value: formatCurrency(stats?.totalCommissions ?? 0), 
  color: 'indigo', 
  icon: '💵' 
},
    { label: 'Pending Commissions', value: stats?.pendingCommissions || 0, color: 'orange', icon: '⏳' },
    { label: 'Total Withdrawals', value: stats?.totalWithdrawals || 0, color: 'pink', icon: '💸' },
    { label: 'Pending Withdrawals', value: stats?.pendingWithdrawals || 0, color: 'red', icon: '⏳' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of your MLM property platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/properties"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-800">Manage Properties</h3>
              <p className="text-sm text-gray-600 mt-1">Add, edit, or remove properties</p>
            </a>
            <a
              href="/admin/sales"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-800">Review Sales</h3>
              <p className="text-sm text-gray-600 mt-1">Approve or reject sales</p>
            </a>
            <a
              href="/admin/commissions"
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-800">Manage Commissions</h3>
              <p className="text-sm text-gray-600 mt-1">Approve commission payments</p>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

