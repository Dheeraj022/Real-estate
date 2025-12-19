'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import AgentLayout from '@/components/Layout/AgentLayout'
import { agentAPI, propertiesAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/currency'

interface Sale {
  id: string
  propertyId: string
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
}

interface Property {
  id: string
  name: string
}

export default function AgentSalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const searchParams = useSearchParams()
  const propertyIdParam = searchParams.get('propertyId')

  const [formData, setFormData] = useState({
    propertyId: propertyIdParam || '',
    buyerName: '',
    buyerContact: '',
    saleAmount: '',
  })

  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null)
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null)

  useEffect(() => {
    fetchSales()
    fetchProperties()
    if (propertyIdParam) {
      setShowModal(true)
    }
  }, [])

  const fetchSales = async () => {
    try {
      const response = await agentAPI.getSales({})
      setSales(response.data.data.sales)
    } catch (error: any) {
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const saleGroups = useMemo(() => {
    const groups = new Map<string, {
      key: string
      propertyId: string
      propertyName: string
      propertyLocation: string
      propertyPrice: number
      buyerName: string
      buyerContact: string
      sales: Sale[]
      totalPaid: number
      remaining: number
      paymentStatus: 'Partial Payment' | 'Fully Paid' | 'Pending'
    }>()

    for (const sale of sales) {
      const key = `${sale.propertyId}|${sale.buyerName}|${sale.buyerContact}`
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          propertyId: sale.propertyId,
          propertyName: sale.property.name,
          propertyLocation: sale.property.location,
          propertyPrice: sale.property.price,
          buyerName: sale.buyerName,
          buyerContact: sale.buyerContact,
          sales: [],
          totalPaid: 0,
          remaining: 0,
          paymentStatus: 'Pending'
        })
      }
      const group = groups.get(key)!
      group.sales.push(sale)
    }

    for (const group of groups.values()) {
      // Sum only non-rejected sales for payment calculation
      const totalPaid = group.sales
        .filter((s) => s.status !== 'rejected')
        .reduce((sum, s) => sum + s.saleAmount, 0)
      group.totalPaid = totalPaid
      const remaining = Math.max(0, group.propertyPrice - totalPaid)
      group.remaining = remaining
      if (totalPaid >= group.propertyPrice && group.propertyPrice > 0) {
        group.paymentStatus = 'Fully Paid'
      } else if (totalPaid > 0) {
        group.paymentStatus = 'Partial Payment'
      } else {
        group.paymentStatus = 'Pending'
      }
    }

    // Sort groups by latest sale date desc
    return Array.from(groups.values()).sort((a, b) => {
      const latestA = a.sales[0]?.createdAt || ''
      const latestB = b.sales[0]?.createdAt || ''
      return latestB.localeCompare(latestA)
    })
  }, [sales])

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll({})
      setProperties(response.data.data.properties)
    } catch (error: any) {
      // Handle error silently
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const amount = parseFloat(formData.saleAmount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid sale amount')
        return
      }

      await agentAPI.submitSale({
        propertyId: formData.propertyId,
        buyerName: formData.buyerName,
        buyerContact: formData.buyerContact,
        saleAmount: amount,
      })
      toast.success('Sale submitted successfully. Waiting for admin approval.')
      setShowModal(false)
      setFormData({
        propertyId: '',
        buyerName: '',
        buyerContact: '',
        saleAmount: '',
      })
      fetchSales()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit sale')
    }
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Sales</h1>
          <button
            onClick={() => {
              setActiveGroupKey(null)
              setFormData({
                propertyId: propertyIdParam || '',
                buyerName: '',
                buyerContact: '',
                saleAmount: '',
              })
              setShowModal(true)
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Submit Sale
          </button>
        </div>

        <div className="space-y-4">
          {saleGroups.map((group) => {
            const isFullyPaid = group.paymentStatus === 'Fully Paid'
            const paymentBadgeClass =
              group.paymentStatus === 'Fully Paid'
                ? 'bg-green-100 text-green-800'
                : group.paymentStatus === 'Partial Payment'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'

            const groupSalesSorted = [...group.sales].sort((a, b) =>
              a.createdAt.localeCompare(b.createdAt),
            )

            let runningTotal = 0

            return (
              <div
                key={group.key}
                className="bg-white rounded-lg shadow-md border border-gray-100 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {group.propertyName}
                    </p>
                    <p className="text-xs text-gray-500">{group.propertyLocation}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Buyer:{' '}
                      <span className="text-sm font-semibold text-black">
                        {group.buyerName}
                      </span>{' '}
                      <span className="text-gray-400">({group.buyerContact})</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span
                      className={`px-3 py-1 text-[11px] font-semibold rounded-full ${paymentBadgeClass}`}
                    >
                      {group.paymentStatus === 'Fully Paid'
                        ? 'Fully Paid'
                        : group.paymentStatus === 'Partial Payment'
                        ? 'Partial Payment'
                        : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div className="bg-gray-50 rounded-md p-2">
                    <p className="text-gray-500">Property Price</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(group.propertyPrice)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2">
                    <p className="text-gray-500">Total Paid</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(group.totalPaid)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2">
                    <p className="text-gray-500">Remaining Amount</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(group.remaining)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    disabled={isFullyPaid}
                    onClick={() => {
                      setActiveGroupKey(group.key)
                      setFormData({
                        propertyId: group.propertyId,
                        buyerName: group.buyerName,
                        buyerContact: group.buyerContact,
                        saleAmount: group.remaining > 0 ? String(group.remaining) : '',
                      })
                      setShowModal(true)
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isFullyPaid
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {isFullyPaid ? 'Fully Paid' : '+ Add New Sale (Partial Payment)'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroupKey((prev) =>
                        prev === group.key ? null : group.key,
                      )
                    }
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {expandedGroupKey === group.key ? 'Hide Previous Sales' : 'View Previous Sales'}
                  </button>
                </div>

                {expandedGroupKey === group.key && (
                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">
                      Previous Sales
                    </p>
                    {groupSalesSorted.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">
                        No previous sales for this property and buyer.
                      </p>
                    ) : (
                      groupSalesSorted.map((sale, idx) => {
                        if (sale.status !== 'rejected') {
                          runningTotal += sale.saleAmount
                        }
                        return (
                          <div
                            key={sale.id}
                            className="flex items-center justify-between text-xs bg-gray-50 rounded-md px-3 py-2"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                Sale {idx + 1} • {format(new Date(sale.createdAt), 'dd MMM yyyy')}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Status: {sale.status}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(sale.saleAmount)}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Running total:{' '}
                                <span className="font-semibold">
                                  {formatCurrency(runningTotal)}
                                </span>
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {saleGroups.length === 0 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-8 text-center text-gray-500">
              No sales found
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Submit Sale</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                  <input
                    type="text"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Contact</label>
                  <input
                    type="text"
                    value={formData.buyerContact}
                    onChange={(e) => setFormData({ ...formData, buyerContact: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.saleAmount}
                    onChange={(e) => setFormData({ ...formData, saleAmount: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({
                        propertyId: propertyIdParam || '',
                        buyerName: '',
                        buyerContact: '',
                        saleAmount: '',
                      })
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AgentLayout>
  )
}

