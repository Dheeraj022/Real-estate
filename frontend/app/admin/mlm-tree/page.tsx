'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '@/components/Layout/AdminLayout'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface MLMUser {
  id: string
  name: string
  email: string
  referralCode: string
  level: number
  uplineId?: string | null
  upline?: {
    id: string
    name: string
    email: string
    referralCode: string
  } | null
  downlines?: MLMUser[]
}

interface HierarchyLevel {
  level: number
  label: string
  color: string
  bgColor: string
  borderColor: string
}

const LEVEL_CONFIG: Record<number, HierarchyLevel> = {
  0: { level: 0, label: 'Seller (Level 0)', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
  1: { level: 1, label: 'Level 1', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
  2: { level: 2, label: 'Level 2', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-500' },
  3: { level: 3, label: 'Level 3', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-500' },
  4: { level: 4, label: 'Level 4', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-500' },
  5: { level: 5, label: 'Level 5', color: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-500' },
  6: { level: 6, label: 'Level 6', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-400' },
}

export default function AdminMLMTreePage() {
  const [allUsers, setAllUsers] = useState<MLMUser[]>([])
  const [selectedRoot, setSelectedRoot] = useState<MLMUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    setLoading(true)
    try {
      // Fetch users with pagination to get all users
      const response = await adminAPI.getUsers({ limit: 1000 })
      const users = (response.data.data.users || []).map((u: any) => ({
        ...u,
        uplineId: u.upline?.id || null
      }))
      setAllUsers(users)
      
      // Set first root agent as default if available
      if (users.length > 0 && !selectedRoot) {
        const rootAgents = users.filter((u: MLMUser) => !u.uplineId || u.level === 0)
        if (rootAgents.length > 0) {
          setSelectedRoot(rootAgents[0])
        } else if (users.length > 0) {
          // If no root agents, select first user
          setSelectedRoot(users[0])
        }
      }
    } catch (error: any) {
      console.error('Failed to load users:', error)
      if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please check your connection.')
      } else if (error.request) {
        toast.error('Cannot connect to server. Please check if backend is running.')
      } else {
        toast.error('Failed to load MLM tree')
      }
    } finally {
      setLoading(false)
    }
  }

  // Build hierarchy for selected root (up to 6 downline levels: Seller (0) + Levels 1–6)
  const buildHierarchy = (rootUser: MLMUser | null, maxLevel: number = 7): MLMUser | null => {
    if (!rootUser) return null

    const buildDownlines = (user: MLMUser, currentLevel: number): MLMUser => {
      if (currentLevel >= maxLevel) {
        return { ...user, downlines: [] }
      }

      const directDownlines = allUsers.filter(u => u.uplineId === user.id)
      const downlinesWithChildren = directDownlines.map(downline => 
        buildDownlines(downline, currentLevel + 1)
      )

      return {
        ...user,
        downlines: downlinesWithChildren
      }
    }

    return buildDownlines(rootUser, 0)
  }

  const hierarchy = useMemo(() => {
    if (!selectedRoot) return null
    return buildHierarchy(selectedRoot, 7)
  }, [selectedRoot, allUsers])

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase().trim()
    return allUsers.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.referralCode.toUpperCase().includes(query.toUpperCase())
    ).slice(0, 10) // Limit to 10 results
  }, [searchQuery, allUsers])

  const handleSearchSelect = (user: MLMUser) => {
    setSelectedRoot(user)
    setSearchQuery('')
  }

  // Filter hierarchy by level
  const filteredHierarchy = useMemo(() => {
    if (!hierarchy) return null
    if (!levelFilter) return hierarchy

    const filterLevel = parseInt(levelFilter)
    const filterNode = (node: MLMUser, currentLevel: number): MLMUser | null => {
      if (currentLevel === filterLevel) {
        return { ...node, downlines: [] }
      }
      if (currentLevel > filterLevel) return null

      const filteredDownlines = (node.downlines || [])
        .map(downline => filterNode(downline, currentLevel + 1))
        .filter(Boolean) as MLMUser[]

      return {
        ...node,
        downlines: filteredDownlines
      }
    }

    return filterNode(hierarchy, 0)
  }, [hierarchy, levelFilter])

  const renderLevel = (users: MLMUser[], level: number) => {
    if (!users || users.length === 0) return null

    const levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[6]
    const displayUsers = levelFilter ? (level === parseInt(levelFilter) ? users : []) : users

    if (displayUsers.length === 0 && levelFilter) return null

    return (
      <div key={level} className="mb-8">
        {/* Level Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-0.5 flex-1 ${levelConfig.bgColor}`}></div>
          <div className={`px-4 py-1.5 rounded-full ${levelConfig.bgColor} ${levelConfig.color} border-2 ${levelConfig.borderColor} font-semibold text-sm`}>
            {levelConfig.label}
          </div>
          <div className={`h-0.5 flex-1 ${levelConfig.bgColor}`}></div>
        </div>

        {/* Cards Grid - Responsive with horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-max sm:min-w-0">
            {displayUsers.map((user) => {
              const isSelected = selectedRoot?.id === user.id && level === 0
              return (
                <div
                  key={user.id}
                  className={`
                    bg-white rounded-2xl shadow-sm border-l-4 ${levelConfig.borderColor} border border-gray-100 p-5 
                    hover:shadow-md transition-all duration-200 cursor-pointer min-w-[280px] sm:min-w-0
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  `}
                  onClick={() => setSelectedRoot(user)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                        {isSelected && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            Root
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2 truncate">{user.email}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {user.referralCode}
                        </span>
                      </div>
                    </div>
                  </div>
                  {user.downlines && user.downlines.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">{user.downlines.length}</span> direct downline{user.downlines.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  const displayHierarchy = filteredHierarchy || hierarchy
  const level0Users = displayHierarchy ? [displayHierarchy] : []
  const level1Users = displayHierarchy?.downlines || []
  const level2Users = level1Users.flatMap(l1 => l1.downlines || [])
  const level3Users = level2Users.flatMap(l2 => l2.downlines || [])
  const level4Users = level3Users.flatMap(l3 => l3.downlines || [])
  const level5Users = level4Users.flatMap(l4 => l4.downlines || [])
  const level6Users = level5Users.flatMap(l5 => l5.downlines || [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">MLM Hierarchy</h1>
          <p className="text-gray-500 text-sm">View agent hierarchy and downline structure</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or referral code..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            />
            {/* Search Results Dropdown */}
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSearchSelect(user)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Code: {user.referralCode}</p>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">No agents found</p>
              </div>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by Level:</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
            >
              <option value="">All Levels</option>
              <option value="0">Seller (Level 0)</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
              <option value="6">Level 6</option>
            </select>
            {levelFilter && (
              <button
                onClick={() => setLevelFilter('')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Hierarchy Display */}
        {displayHierarchy ? (
          <div className="space-y-8">
            {/* Level 0 - Seller/Root */}
            {renderLevel(level0Users, 0)}

            {/* Connector */}
            {level1Users.length > 0 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-blue-200 to-green-200 rounded-full"></div>
              </div>
            )}

            {/* Level 1 */}
            {renderLevel(level1Users, 1)}

            {/* Connector */}
            {level2Users.length > 0 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-green-200 to-orange-200 rounded-full"></div>
              </div>
            )}

            {/* Level 2 */}
            {renderLevel(level2Users, 2)}

            {/* Connector */}
            {level3Users.length > 0 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-orange-200 to-purple-200 rounded-full"></div>
              </div>
            )}

            {/* Level 3 */}
            {renderLevel(level3Users, 3)}

            {/* Connector */}
            {level4Users.length > 0 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-purple-200 to-indigo-200 rounded-full"></div>
              </div>
            )}

            {/* Level 4 */}
            {renderLevel(level4Users, 4)}

            {/* Connector */}
            {level5Users.length > 0 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-200 to-pink-200 rounded-full"></div>
              </div>
            )}

            {/* Level 5 */}
            {renderLevel(level5Users, 5)}

            {/* Connector */}
            {level6Users.length > 0 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-8 bg-gradient-to-b from-pink-200 to-gray-200 rounded-full"></div>
              </div>
            )}

            {/* Level 6 */}
            {renderLevel(level6Users, 6)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-sm mb-2">No hierarchy to display</p>
            <p className="text-gray-400 text-xs">Search for an agent to view their hierarchy</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">How it works</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Click on any agent card to view their hierarchy. The view shows up to 7 levels:{' '}
                <span className="font-semibold">Seller (Level 0)</span> and{' '}
                <span className="font-semibold">Levels 1 through 6</span>. The referral tree itself can extend to unlimited depth in the database, but the admin view (and MLM tree UI) is capped at Level 6 for clarity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

