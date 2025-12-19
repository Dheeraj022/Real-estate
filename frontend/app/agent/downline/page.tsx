'use client'

import { useState, useEffect, useMemo } from 'react'
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
    level4?: number
    level5?: number
    level6?: number
    total: number
  }
}

export default function AgentDownlinePage() {
  const [data, setData] = useState<DownlineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false
  })

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

  const groupedByLevel = useMemo(() => {
    const levels: Record<number, DownlineUser[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: []
    }

    if (!data?.downline || data.downline.length === 0) {
      return levels
    }

    const traverse = (users: DownlineUser[], level: number) => {
      if (level > 6) return
      for (const user of users) {
        levels[level].push(user)
        if (user.downlines && user.downlines.length > 0) {
          traverse(user.downlines, level + 1)
        }
      }
    }

    traverse(data.downline, 1)
    return levels
  }, [data])

  const toggleLevel = (level: number) => {
    setExpandedLevels((prev) => ({ ...prev, [level]: !prev[level] }))
  }

  const getLevelBadgeClasses = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-blue-100 text-blue-800'
      case 2:
        return 'bg-green-100 text-green-800'
      case 3:
        return 'bg-yellow-100 text-yellow-800'
      case 4:
        return 'bg-orange-100 text-orange-800'
      case 5:
        return 'bg-purple-100 text-purple-800'
      case 6:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
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
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Level 4</p>
              <p className="text-2xl font-bold text-gray-800">{data.stats.level4 ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Level 5</p>
              <p className="text-2xl font-bold text-gray-800">{data.stats.level5 ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Level 6</p>
              <p className="text-2xl font-bold text-gray-800">{data.stats.level6 ?? 0}</p>
            </div>
            <div className="bg-primary-500 text-white p-4 rounded-lg shadow-md">
              <p className="text-sm opacity-90">Total</p>
              <p className="text-2xl font-bold">{data.stats.total}</p>
            </div>
          </div>
        )}

        {/* Downline Tree - grouped by level up to Level 6 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Downline Structure</h2>
          {data && data.downline.length > 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((level) => {
                const usersAtLevel = groupedByLevel[level] || []
                const indentClass =
                  level === 1
                    ? ''
                    : level === 2
                    ? 'ml-2 sm:ml-4'
                    : level === 3
                    ? 'ml-4 sm:ml-6'
                    : level === 4
                    ? 'ml-6 sm:ml-8'
                    : level === 5
                    ? 'ml-8 sm:ml-10'
                    : 'ml-10 sm:ml-12'

                const badgeClasses = getLevelBadgeClasses(level)

                return (
                  <div key={level} className={indentClass}>
                    <button
                      type="button"
                      onClick={() => toggleLevel(level)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${badgeClasses}`}
                        >
                          Level {level}
                        </span>
                        <span className="text-xs text-gray-600">
                          {usersAtLevel.length} member{usersAtLevel.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {expandedLevels[level] ? 'Hide' : 'Show'}
                      </span>
                    </button>

                    {expandedLevels[level] && (
                      <div className="mt-3 space-y-3">
                        {usersAtLevel.length === 0 ? (
                          <div className="text-xs text-gray-500 italic px-2">
                            No members at this level
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {usersAtLevel.map((user) => (
                              <div
                                key={user.id}
                                className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {user.name}
                                    </p>
                                    <p className="text-xs text-gray-600">{user.email}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Referral Code:{' '}
                                      <span className="font-mono">{user.referralCode}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap ${badgeClasses}`}
                                  >
                                    Level {level}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
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

