'use client'

import { useState, useEffect } from 'react'
import AgentLayout from '@/components/Layout/AgentLayout'
import { agentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface DownlineUser {
  id: string
  name: string
  email: string
  referralCode: string
  level: number
  createdAt: string
  downlines?: DownlineUser[]
}

interface UplineUser {
  id: string
  name: string
  email: string
  referralCode: string
  level: number
  createdAt: string
}

interface DownlineData {
  upline: UplineUser | null
  downline: DownlineUser[]
  stats: {
    level1: number
    level2: number
    level3: number
    total: number
  }
}

export default function AgentDownlinePage() {
  const [data, setData] = useState<DownlineData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDownline()
  }, [])

  const fetchDownline = async () => {
    try {
      const response = await agentAPI.getDownline()
      console.log('Downline data received:', response.data.data)
      setData(response.data.data)
    } catch (error: any) {
      console.error('Downline fetch error:', error)
      toast.error(error.response?.data?.message || 'Failed to load downline')
    } finally {
      setLoading(false)
    }
  }

  const renderDownlineTree = (users: DownlineUser[], level: number = 1): JSX.Element[] => {
    if (!users || users.length === 0) return []

    return users.map((user) => (
      <div key={user.id} className="ml-8 mt-4 border-l-2 border-gray-300 pl-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Level {level} • Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
              Level {level}
            </span>
          </div>
          {user.downlines && user.downlines.length > 0 && (
            <div className="mt-4">
              {renderDownlineTree(user.downlines, level + 1)}
            </div>
          )}
        </div>
      </div>
    ))
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">My Downline</h1>

        {/* Upline Information */}
        {data && (
          data.upline ? (
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Your Upline</h2>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <p className="font-semibold text-lg">{data.upline.name}</p>
                <p className="text-sm opacity-90">{data.upline.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                    Level {data.upline.level}
                  </span>
                  <span className="text-xs opacity-75">
                    Referral Code: {data.upline.referralCode}
                  </span>
                  <span className="text-xs opacity-75">
                    Joined: {format(new Date(data.upline.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                <strong>No Upline:</strong> You registered without a referral code. You are at the top level of your network.
              </p>
            </div>
          )
        )}

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Level 1</p>
              <p className="text-2xl font-bold text-gray-800">{data.stats.level1}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Level 2</p>
              <p className="text-2xl font-bold text-gray-800">{data.stats.level2}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Level 3</p>
              <p className="text-2xl font-bold text-gray-800">{data.stats.level3}</p>
            </div>
            <div className="bg-primary-500 text-white p-4 rounded-lg shadow-md">
              <p className="text-sm opacity-90">Total</p>
              <p className="text-2xl font-bold">{data.stats.total}</p>
            </div>
          </div>
        )}

        {/* Downline Tree */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Downline Structure</h2>
          {data && data.downline.length > 0 ? (
            <div>{renderDownlineTree(data.downline, 1)}</div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No downline members yet</p>
              <p className="text-sm">Share your referral link to start building your network!</p>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  )
}

