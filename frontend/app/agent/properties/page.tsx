'use client'

import { useState, useEffect } from 'react'
import AgentLayout from '@/components/Layout/AgentLayout'
import { propertiesAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { formatCurrency } from '@/lib/currency'

interface Property {
  id: string
  name: string
  location: string
  price: number
  description: string
  totalCommissionPercent?: number
  sellerPercent: number
  level1Percent: number
  level2Percent: number
  level3Percent?: number
  level4Percent?: number
  level5Percent?: number
  level6Percent?: number
  images: string[]
}

export default function AgentPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll({})
      setProperties(response.data.data.properties)
    } catch (error: any) {
      toast.error('Failed to load properties')
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

  return (
    <AgentLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Available Properties</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{property.name}</h3>
              <p className="text-gray-600 mb-2">📍 {property.location}</p>
              <p className="text-2xl font-bold text-primary-600 mb-2">{formatCurrency(property.price)}</p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{property.description}</p>
              
              <div className="mb-4 p-3 bg-gray-50 rounded" style={{ color: '#111111' }}>
                <p className="text-xs text-gray-600 mb-2 font-semibold">Commission Structure (Read-only):</p>
                {property.totalCommissionPercent && (
                  <p className="text-sm font-semibold mb-2">Total Commission: {property.totalCommissionPercent.toFixed(1)}%</p>
                )}
                <div className="space-y-1">
                  <p className="text-sm">Seller: {property.sellerPercent}%</p>
                  <p className="text-sm">Level 1: {property.level1Percent}%</p>
                  <p className="text-sm">Level 2: {property.level2Percent}%</p>
                  {property.level3Percent !== undefined && property.level3Percent > 0 && (
                    <p className="text-sm">Level 3: {property.level3Percent}%</p>
                  )}
                  {property.level4Percent !== undefined && property.level4Percent > 0 && (
                    <p className="text-sm">Level 4: {property.level4Percent}%</p>
                  )}
                  {property.level5Percent !== undefined && property.level5Percent > 0 && (
                    <p className="text-sm">Level 5: {property.level5Percent}%</p>
                  )}
                  {property.level6Percent !== undefined && property.level6Percent > 0 && (
                    <p className="text-sm">Level 6: {property.level6Percent}%</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  Breakup Total:{' '}
                  {(
                    property.sellerPercent +
                    property.level1Percent +
                    property.level2Percent +
                    (property.level3Percent || 0) +
                    (property.level4Percent || 0) +
                    (property.level5Percent || 0) +
                    (property.level6Percent || 0)
                  ).toFixed(1)}
                  %
                </p>
              </div>

              <Link
                href={`/agent/sales?propertyId=${property.id}`}
                className="block w-full bg-primary-600 text-white text-center px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Submit Sale
              </Link>
            </div>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12 text-gray-500">No properties available</div>
        )}
      </div>
    </AgentLayout>
  )
}

