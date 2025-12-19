'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/Layout/AdminLayout'
import { adminAPI, propertiesAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface Visit {
  id: string
  customerName: string
  customerContact: string
  photoUrl: string
  visitMode: string
  meetingBy: string
  meetingByName?: string
  numberOfPeople: number
  status: string
  createdAt: string
  agent: {
    id: string
    name: string
    email: string
  }
  property: {
    id: string
    name: string
    location: string
  }
}

interface AgentOption {
  id: string
  name: string
  email: string
}

interface PropertyOption {
  id: string
  name: string
  location: string
}

export default function AdminVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [loading, setLoading] = useState(true)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imagePreviewAlt, setImagePreviewAlt] = useState<string>('')

  const [agentFilter, setAgentFilter] = useState<string>('')
  const [propertyFilter, setPropertyFilter] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchVisits(), fetchAgents(), fetchProperties()])
        // Mark all visits as viewed when admin opens the page
        adminAPI.markVisitsViewed().catch((error) => {
          console.error('Failed to mark visits as viewed:', error)
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    fetchVisits()
  }, [agentFilter, propertyFilter, customerSearch])

  const fetchVisits = async () => {
    try {
      const params: any = { page: 1, limit: 20 }
      if (agentFilter) params.agentId = agentFilter
      if (propertyFilter) params.propertyId = propertyFilter
      if (customerSearch.trim()) params.customer = customerSearch.trim()

      const response = await adminAPI.getVisits(params)
      setVisits(response.data.data.visits || [])
    } catch (error: any) {
      console.error('Failed to load visits:', error)
      if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection.')
      } else if (error.request) {
        toast.error('Cannot connect to server. Please check if backend is running.')
      } else {
        toast.error('Failed to load visits')
      }
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await adminAPI.getUsers({ limit: 500 })
      setAgents(response.data.data.users || [])
    } catch (error: any) {
      console.error('Failed to load agents for visit filters:', error)
    }
  }

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll({ limit: 500 })
      const props = (response.data.data.properties || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        location: p.location,
      }))
      setProperties(props)
    } catch (error: any) {
      console.error('Failed to load properties for visit filters:', error)
    }
  }

  const resetFilters = () => {
    setAgentFilter('')
    setPropertyFilter('')
    setCustomerSearch('')
  }

  const openImagePreview = (url: string, alt: string) => {
    setImagePreviewUrl(url)
    setImagePreviewAlt(alt)
  }

  const closeImagePreview = () => {
    setImagePreviewUrl(null)
    setImagePreviewAlt('')
  }

  // Close on ESC key
  useEffect(() => {
    if (!imagePreviewUrl) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeImagePreview()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imagePreviewUrl])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Visits Management</h1>
            <p className="text-sm text-gray-500">Review all property visits submitted by agents</p>
          </div>
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Agent</label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} — {agent.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Property</label>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.location}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by customer name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Visits Table */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Property
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Visit Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Company Staff Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    People
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Photo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{visit.agent.name}</p>
                        <p className="text-xs text-gray-500">{visit.agent.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{visit.customerName}</p>
                        <p className="text-xs text-gray-500">{visit.customerContact}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{visit.property.name}</p>
                        <p className="text-xs text-gray-500">{visit.property.location}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900">
                      {visit.visitMode === 'company' ? 'Company' : 'Self'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900">
                      {visit.meetingByName || visit.meetingBy}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 text-center">
                      {visit.numberOfPeople}
                    </td>
                    <td className="px-4 py-3">
                      {visit.photoUrl && (
                        <button
                          type="button"
                          onClick={() => openImagePreview(visit.photoUrl, visit.customerName)}
                          className="inline-block focus:outline-none"
                          aria-label="View visit image"
                        >
                          <img
                            src={visit.photoUrl}
                            alt={visit.customerName}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 cursor-zoom-in"
                          />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(visit.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {visits.map((visit) => (
              <div key={visit.id} className="p-4 flex gap-3">
                {visit.photoUrl && (
                  <button
                    type="button"
                    onClick={() => openImagePreview(visit.photoUrl, visit.customerName)}
                    className="flex-shrink-0 focus:outline-none"
                    aria-label="View visit image"
                  >
                    <img
                      src={visit.photoUrl}
                      alt={visit.customerName}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 cursor-zoom-in"
                    />
                  </button>
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{visit.customerName}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                      {visit.visitMode === 'company' ? 'Company' : 'Self'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{visit.customerContact}</p>
                  <p className="text-xs text-gray-500">
                    {visit.property.name} — {visit.property.location}
                  </p>
                  <p className="text-xs text-gray-400">
                    Agent: {visit.agent.name} • People: {visit.numberOfPeople}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(visit.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {visits.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">No visits found</div>
            )}
          </div>
        </div>

        {/* Image Preview Modal */}
        {imagePreviewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={closeImagePreview}
          >
            <div
              className="relative max-w-3xl w-full max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeImagePreview}
                className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-gray-600 hover:text-gray-900"
                aria-label="Close image preview"
              >
                ✕
              </button>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-black flex items-center justify-center max-h-[80vh]">
                  <img
                    src={imagePreviewUrl}
                    alt={imagePreviewAlt}
                    className="max-h-[80vh] w-auto max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}




