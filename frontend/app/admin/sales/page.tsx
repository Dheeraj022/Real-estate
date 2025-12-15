'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/Layout/AdminLayout'
import { adminAPI, propertiesAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/currency'

interface Sale {
  id: string
  propertyId: string
  sellerId: string
  buyerName: string
  buyerContact: string
  saleAmount: number
  status: string
  createdAt: string
  property: {
    id: string
    name: string
    location: string
    price: number
  }
  seller: {
    id: string
    name: string
    email: string
  }
}

interface Property {
  id: string
  name: string
  location: string
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [propertyFilter, setPropertyFilter] = useState<string>('')
  const [buyerFilter, setBuyerFilter] = useState<string>('')
  const [buyerFilterDebounce, setBuyerFilterDebounce] = useState<string>('')

  // Debounce buyer name filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuyerFilterDebounce(buyerFilter)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [buyerFilter])

  useEffect(() => {
    fetchProperties()
    // Mark sales as viewed when page loads
    adminAPI.markSalesViewed().catch((error) => {
      console.error('Failed to mark sales as viewed:', error)
    })
  }, [])

  useEffect(() => {
    fetchSales()
  }, [statusFilter, propertyFilter, buyerFilterDebounce])

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll({})
      setProperties(response.data.data.properties || [])
    } catch (error: any) {
      console.error('Failed to load properties:', error)
      // Don't show error toast for properties, just log it
    }
  }

  const fetchSales = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      if (propertyFilter) params.propertyId = propertyFilter
      if (buyerFilterDebounce.trim()) params.buyer = buyerFilterDebounce.trim()

      const response = await adminAPI.getSales(params)
      setSales(response.data.data.sales || [])
    } catch (error: any) {
      console.error('Failed to load sales:', error)
      if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection.')
      } else if (error.request) {
        toast.error('Cannot connect to server. Please check if backend is running.')
      } else {
        toast.error('Failed to load sales')
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, propertyFilter, buyerFilterDebounce])

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this sale? This will trigger commission calculation.')) return

    try {
      await adminAPI.approveSale(id)
      toast.success('Sale approved and commissions calculated')
      fetchSales() // This will use the current filters
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve sale')
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this sale?')) return

    try {
      await adminAPI.rejectSale(id)
      toast.success('Sale rejected')
      fetchSales() // This will use the current filters
    } catch (error: any) {
      toast.error('Failed to reject sale')
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

  const handleResetFilters = () => {
    setStatusFilter('')
    setPropertyFilter('')
    setBuyerFilter('')
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Sales Management</h1>
          <p className="text-gray-500 text-sm">Review and manage property sales</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Property</label>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
              >
                <option value="">All Properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.location}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Buyer Name</label>
              <input
                type="text"
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                placeholder="Search buyer name..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 font-medium text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{sale.property.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sale.property.location}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.seller.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sale.seller.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sale.buyerName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{sale.buyerContact}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(sale.saleAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(sale.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      {sale.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(sale.id)}
                            className="px-4 py-1.5 bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 text-xs font-medium transition-all duration-200 shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(sale.id)}
                            className="px-4 py-1.5 bg-red-600 text-white rounded-xl hover:bg-red-700 active:bg-red-800 text-xs font-medium transition-all duration-200 shadow-sm"
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

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {sales.map((sale) => (
              <div key={sale.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Property</p>
                    <p className="font-medium text-gray-900">{sale.property.name}</p>
                    <p className="text-sm text-gray-500">{sale.property.location}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Seller</p>
                      <p className="text-sm font-medium text-gray-900">{sale.seller.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Buyer</p>
                      <p className="text-sm font-medium text-gray-900">{sale.buyerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Amount</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.saleAmount)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </div>
                  {sale.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleApprove(sale.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 text-xs font-medium transition-all duration-200 shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(sale.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 active:bg-red-800 text-xs font-medium transition-all duration-200 shadow-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {sales.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">No sales found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

