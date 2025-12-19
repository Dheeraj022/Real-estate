'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
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
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setNewPassword('')
    setConfirmPassword('')
  }

  const closeEditModal = () => {
    setEditingUser(null)
    setEditName('')
    setEditEmail('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const payload = {
        name: editName.trim(),
        email: editEmail.trim(),
      }
      if (!payload.name || !payload.email) {
        toast.error('Name and email are required')
        return
      }

      // Validate password fields if admin provided a new password
      const passwordProvided = newPassword.trim().length > 0 || confirmPassword.trim().length > 0
      if (passwordProvided) {
        if (newPassword.trim().length < 6) {
          toast.error('Password must be at least 6 characters')
          return
        }
        if (newPassword.trim() !== confirmPassword.trim()) {
          toast.error('Passwords do not match')
          return
        }
      }

      const response = await adminAPI.updateUser(editingUser.id, payload)
      const updatedUser: User = response.data.data.user

      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
      )

      // If password was provided, update it as well
      if (passwordProvided) {
        await adminAPI.resetUserPassword(editingUser.id, {
          password: newPassword.trim(),
        })
        toast.success('Agent password updated successfully')
      } else {
        toast.success('Agent updated successfully')
      }

      closeEditModal()
    } catch (error: any) {
      console.error('Failed to update agent:', error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to update agent')
      }
    }
  }

  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this agent? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      await adminAPI.deleteUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      toast.success('Agent deleted successfully')
      if (editingUser?.id === user.id) {
        closeEditModal()
      }
    } catch (error: any) {
      console.error('Failed to delete agent:', error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to delete agent')
      }
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

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                    <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
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
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">No agents found</div>
          )}
        </div>

        {/* Edit Agent Modal */}
        {editingUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={closeEditModal}
          >
            <div
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Edit Agent</h2>
                  <p className="text-xs text-gray-500">
                    Update basic profile details. MLM hierarchy and commissions are not affected.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">Password Reset</span>
                    <span className="text-xs text-gray-500">Admin only</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Admin-defined password will be used for agent login.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                  >
                    Save Changes
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

