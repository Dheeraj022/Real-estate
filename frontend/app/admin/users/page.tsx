'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/Layout/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface User {
  id: string
  name: string
  email: string
  referralCode: string
  level: number
  createdAt: string
  upline: {
    id: string
    name: string
    email: string
  } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchDebounce, setSearchDebounce] = useState('')

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [searchDebounce])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      // Only send search if it's not empty
      const searchParam = searchDebounce.trim() || undefined
      const response = await adminAPI.getUsers({ search: searchParam })
      setUsers(response.data.data.users || [])
    } catch (error: any) {
      console.error('Failed to load users:', error)
      
      // Only show error toast for real API failures, not empty search
      if (error.response) {
        // Server responded with error status
        const status = error.response.status
        if (status >= 500) {
          toast.error('Server error. Please try again later.')
        } else if (status === 404) {
          // Not found is not a critical error for search
          setUsers([])
        } else {
          toast.error(error.response.data?.message || 'Failed to load users')
        }
      } else if (error.request) {
        // Network error - no response received
        toast.error('Cannot connect to server. Please check if backend is running.')
      } else if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection and try again.')
      } else {
        // Other errors - only show if it's a real error, not just empty results
        if (searchDebounce.trim()) {
          toast.error('Failed to search users')
        }
      }
    } finally {
      setLoading(false)
    }
  }, [searchDebounce])

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
          <h1 className="text-3xl font-bold text-gray-800">Agents</h1>
          <input
            type="text"
            placeholder="Search by name or referral code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 w-64"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{user.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.referralCode}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                      Level {user.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.upline ? (
                      <div>
                        <p className="font-medium">{user.upline.name}</p>
                        <p className="text-xs text-gray-500">{user.upline.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">No upline</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">No agents found</div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

