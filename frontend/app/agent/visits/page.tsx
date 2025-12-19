'use client'

import { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react'
import AgentLayout from '@/components/Layout/AgentLayout'
import { agentAPI, propertiesAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface PropertyOption {
  id: string
  name: string
  location: string
}

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
  property: {
    id: string
    name: string
    location: string
  }
}

export default function AgentVisitsPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pendingImagePreview, setPendingImagePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [formData, setFormData] = useState({
    customerName: '',
    customerContact: '',
    photoFile: null as File | null,
    photoPreview: '',
    visitMode: 'company',
    propertyId: '',
    meetingByName: '',
    numberOfPeople: 1,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchProperties(), fetchVisits()])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll({ status: 'active', limit: 100 })
      const props = (response.data.data.properties || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        location: p.location,
      }))
      setProperties(props)
    } catch (error: any) {
      console.error('Failed to load properties for visits:', error)
      toast.error('Failed to load properties')
    }
  }

  const fetchVisits = async () => {
    try {
      const response = await agentAPI.getVisits({ page: 1, limit: 20 })
      setVisits(response.data.data.visits || [])
    } catch (error: any) {
      console.error('Failed to load visits:', error)
      toast.error('Failed to load visits')
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setPendingImagePreview('')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error('Please upload a JPG or PNG image')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) {
        toast.error('Failed to read image file')
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      // Store as pending preview until agent confirms
      setPendingImagePreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!formData.photoPreview) {
      toast.error('Please upload a visit photo')
      return
    }
    if (!formData.propertyId) {
      toast.error('Please select a property')
      return
    }
    if (!formData.meetingByName || formData.meetingByName.trim().length < 2) {
      toast.error('Please enter a valid company staff name (at least 2 characters)')
      return
    }

    setSubmitting(true)
    try {
      await agentAPI.submitVisit({
        customerName: formData.customerName.trim(),
        customerContact: formData.customerContact.trim(),
        photoUrl: formData.photoPreview,
        visitMode: formData.visitMode as 'company' | 'self',
        propertyId: formData.propertyId,
        meetingByName: formData.meetingByName.trim(),
        numberOfPeople: formData.numberOfPeople,
      })

      toast.success('Visit submitted successfully')
      setFormData({
        customerName: '',
        customerContact: '',
        photoFile: null,
        photoPreview: '',
        visitMode: 'company',
        propertyId: '',
        meetingByName: '',
        numberOfPeople: 1,
      })
      setPendingImagePreview('')
      fetchVisits()
    } catch (error: any) {
      console.error('Visit submission error:', error)
      toast.error(error.response?.data?.message || 'Failed to submit visit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </AgentLayout>
    )
  }

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Customer Visits</h1>
          <p className="text-sm text-gray-500">Submit and track your property visit details</p>
        </div>

        {/* Visit Form */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Visit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Contact Number</label>
                <input
                  type="tel"
                  value={formData.customerContact}
                  onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter contact number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Mode</label>
                <select
                  value={formData.visitMode}
                  onChange={(e) => setFormData({ ...formData, visitMode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="company">Company</option>
                  <option value="self">Self</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting By (Company Staff Name)
                </label>
                <input
                  type="text"
                  value={formData.meetingByName}
                  onChange={(e) => setFormData({ ...formData, meetingByName: e.target.value })}
                  required
                  minLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter company staff name (e.g. Rahul Sharma)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.location}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                <input
                  type="number"
                  min={1}
                  value={formData.numberOfPeople}
                  onChange={(e) =>
                    setFormData({ ...formData, numberOfPeople: Number(e.target.value) || 1 })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo (Agent with Customer)</label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0 file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  required={!formData.photoPreview}
                />
                {pendingImagePreview && (
                  <div className="flex flex-col gap-2">
                    <img
                      src={pendingImagePreview}
                      alt="Pending visit preview"
                      className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          // Confirm selected image
                          setFormData((prev) => ({
                            ...prev,
                            photoPreview: pendingImagePreview,
                          }))
                          setPendingImagePreview('')
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="px-3 py-1 rounded-md bg-primary-600 text-white text-xs font-medium hover:bg-primary-700"
                      >
                        Yes, Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Cancel selection
                          setPendingImagePreview('')
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="px-3 py-1 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {!pendingImagePreview && formData.photoPreview && (
                  <img
                    src={formData.photoPreview}
                    alt="Visit preview"
                    className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Please upload a clear photo of you with the customer during the visit.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Visit'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Visits */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Visits</h2>
          {visits.length === 0 ? (
            <p className="text-sm text-gray-500">No visits submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-start gap-4">
                    {visit.photoUrl && (
                      <img
                        src={visit.photoUrl}
                        alt={visit.customerName}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {visit.customerName}{' '}
                        <span className="text-xs text-gray-500">({visit.customerContact})</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {visit.property.name} — {visit.property.location}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Mode: {visit.visitMode === 'company' ? 'Company' : 'Self'} • Meeting by:{' '}
                        {visit.meetingByName || visit.meetingBy} • People: {visit.numberOfPeople}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {visit.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(visit.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  )
}




