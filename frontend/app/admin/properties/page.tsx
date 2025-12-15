'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/Layout/AdminLayout'
import { adminAPI, propertiesAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/currency'

interface Property {
  id: string
  name: string
  location: string
  price: number
  description: string
  totalCommissionPercent: number
  sellerPercent: number
  level1Percent: number
  level2Percent: number
  status: string
  images: string[]
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    description: '',
    totalCommissionPercent: '',
    sellerPercent: '',
    level1Percent: '',
    level2Percent: '',
    status: 'active',
    images: [] as string[],
  })
  const [commissionError, setCommissionError] = useState('')

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const response = await propertiesAPI.getAll({})
      setProperties(response.data.data.properties)
    } catch (error: any) {
      console.error('Failed to load properties:', error)
      if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection.')
      } else if (error.request) {
        toast.error('Cannot connect to server. Please check if backend is running.')
      } else {
        toast.error('Failed to load properties')
      }
    } finally {
      setLoading(false)
    }
  }

  const validateCommission = () => {
    const totalCommission = parseFloat(formData.totalCommissionPercent) || 0
    const sellerPercent = parseFloat(formData.sellerPercent) || 0
    const level1Percent = parseFloat(formData.level1Percent) || 0
    const level2Percent = parseFloat(formData.level2Percent) || 0
    
    const sum = sellerPercent + level1Percent + level2Percent
    
    if (sum > totalCommission) {
      setCommissionError('Total commission breakup cannot exceed total commission percentage')
      return false
    }
    
    setCommissionError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCommission()) {
      return
    }

    try {
      if (editingProperty) {
        // Convert string values to numbers for update
        const updatePayload = {
          name: formData.name.trim(),
          location: formData.location.trim(),
          price: parseFloat(formData.price),
          description: formData.description.trim(),
          totalCommissionPercent: parseFloat(formData.totalCommissionPercent),
          sellerPercent: parseFloat(formData.sellerPercent),
          level1Percent: parseFloat(formData.level1Percent),
          level2Percent: parseFloat(formData.level2Percent),
          status: formData.status,
        }
        await adminAPI.updateProperty(editingProperty.id, updatePayload)
        toast.success('Property updated successfully')
      } else {
        await adminAPI.createProperty(formData)
        toast.success('Property created successfully')
      }
      setShowModal(false)
      resetForm()
      fetchProperties()
    } catch (error: any) {
      console.error('Property operation error:', error)
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setFormData({
      name: property.name,
      location: property.location,
      price: property.price.toString(),
      description: property.description,
      totalCommissionPercent: property.totalCommissionPercent?.toString() || '',
      sellerPercent: property.sellerPercent.toString(),
      level1Percent: property.level1Percent.toString(),
      level2Percent: property.level2Percent.toString(),
      status: property.status,
      images: property.images,
    })
    setCommissionError('')
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return

    try {
      await adminAPI.deleteProperty(id)
      toast.success('Property deleted successfully')
      fetchProperties()
    } catch (error: any) {
      toast.error('Failed to delete property')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      price: '',
      description: '',
      totalCommissionPercent: '',
      sellerPercent: '',
      level1Percent: '',
      level2Percent: '',
      status: 'active',
      images: [],
    })
    setCommissionError('')
    setEditingProperty(null)
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

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Properties</h1>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Add Property
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{property.name}</h3>
              <p className="text-gray-600 mb-2">📍 {property.location}</p>
              <p className="text-2xl font-bold text-primary-600 mb-2">{formatCurrency(property.price)}</p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{property.description}</p>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600 mb-1">Commission Structure:</p>
                <p className="text-sm font-semibold">Total Commission: {property.totalCommissionPercent?.toFixed(1) || (property.sellerPercent + property.level1Percent + property.level2Percent).toFixed(1)}%</p>
                <p className="text-sm">Seller: {property.sellerPercent}%</p>
                <p className="text-sm">Level 1: {property.level1Percent}%</p>
                <p className="text-sm">Level 2: {property.level2Percent}%</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(property)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(property.id)}
                  className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingProperty ? 'Edit Property' : 'Add Property'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Commission %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.totalCommissionPercent}
                    onChange={(e) => {
                      setFormData({ ...formData, totalCommissionPercent: e.target.value })
                      setCommissionError('')
                    }}
                    onBlur={validateCommission}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., 10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the total commission percentage for this property</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.sellerPercent}
                      onChange={(e) => {
                        setFormData({ ...formData, sellerPercent: e.target.value })
                        setCommissionError('')
                      }}
                      onBlur={validateCommission}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level 1 %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.level1Percent}
                      onChange={(e) => {
                        setFormData({ ...formData, level1Percent: e.target.value })
                        setCommissionError('')
                      }}
                      onBlur={validateCommission}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level 2 %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.level2Percent}
                      onChange={(e) => {
                        setFormData({ ...formData, level2Percent: e.target.value })
                        setCommissionError('')
                      }}
                      onBlur={validateCommission}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                {commissionError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm font-medium">{commissionError}</p>
                  </div>
                )}
                {formData.totalCommissionPercent && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg">
                    <p className="text-xs">
                      Total Commission: {formData.totalCommissionPercent}% | 
                      Breakup Sum: {(parseFloat(formData.sellerPercent) || 0) + (parseFloat(formData.level1Percent) || 0) + (parseFloat(formData.level2Percent) || 0)}% | 
                      Remaining: {((parseFloat(formData.totalCommissionPercent) || 0) - ((parseFloat(formData.sellerPercent) || 0) + (parseFloat(formData.level1Percent) || 0) + (parseFloat(formData.level2Percent) || 0))).toFixed(1)}%
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingProperty ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
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
    </AdminLayout>
  )
}

