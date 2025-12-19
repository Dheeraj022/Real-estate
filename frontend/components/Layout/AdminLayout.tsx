'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { authAPI, adminAPI } from '@/lib/api'
import { removeToken, isAdmin, type User } from '@/lib/auth'
import toast from 'react-hot-toast'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Home,
  Users,
  GitBranch,
  TrendingUp,
  Percent,
  CreditCard,
  Wallet as WalletIcon,
  MapPin,
  LogOut
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface NotificationCounts {
  sales: number
  commissions: number
  withdrawals: number
  visits: number
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    sales: 0,
    commissions: 0,
    withdrawals: 0,
    visits: 0
  })
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe()
        const userData = response.data.data.user
        setUser(userData)

        if (!isAdmin(userData)) {
          // Non-admin users cannot access /admin routes
          removeToken()
          router.push('/admin/login')
        }
      } catch (error: any) {
        console.error('Failed to fetch user:', error)
        if (error.response?.status === 401) {
          removeToken()
          router.push('/admin/login')
        }
      }
    }

    fetchUser()
  }, [router])

  useEffect(() => {
    const fetchNotificationCounts = async () => {
      try {
        const response = await adminAPI.getNotificationCounts()
        setNotificationCounts(response.data.data)
      } catch (error: any) {
        console.error('Failed to fetch notification counts:', error)
        // Don't show error toast, just log it
      }
    }

    fetchNotificationCounts()
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchNotificationCounts, 30000)

    return () => clearInterval(interval)
  }, [])

  // Refresh counts when pathname changes (user navigates)
  useEffect(() => {
    const fetchNotificationCounts = async () => {
      try {
        const response = await adminAPI.getNotificationCounts()
        setNotificationCounts(response.data.data)
      } catch (error: any) {
        console.error('Failed to fetch notification counts:', error)
      }
    }

    fetchNotificationCounts()
  }, [pathname])

  const handleLogout = () => {
    removeToken()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const navItems: {
    href: string
    label: string
    icon: LucideIcon
    badgeKey: keyof NotificationCounts | null
  }[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badgeKey: null },
    { href: '/admin/properties', label: 'Properties', icon: Home, badgeKey: null },
    { href: '/admin/users', label: 'Agents', icon: Users, badgeKey: null },
    { href: '/admin/mlm-tree', label: 'MLM Tree', icon: GitBranch, badgeKey: null },
    { href: '/admin/sales', label: 'Sales', icon: TrendingUp, badgeKey: 'sales' },
    { href: '/admin/commissions', label: 'Commissions', icon: Percent, badgeKey: 'commissions' },
    { href: '/admin/withdrawals', label: 'Withdrawals', icon: CreditCard, badgeKey: 'withdrawals' },
    { href: '/admin/visits', label: 'Visits', icon: MapPin, badgeKey: 'visits' }
  ]

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarOpen ? 'w-64' : 'w-20'} 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r border-gray-200/80
          shadow-sm lg:shadow-none
          transition-all duration-300 ease-in-out
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">MLM Property</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-900"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const badgeCount = item.badgeKey ? notificationCounts[item.badgeKey] : 0
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-2xl
                  transition-all duration-200 ease-in-out
                  relative
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  className={`flex-shrink-0 h-[18px] w-[18px] lg:h-5 lg:w-5 ${
                    isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                  aria-hidden="true"
                />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-sm">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && badgeCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          {user && sidebarOpen && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-700">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-200 font-medium text-sm"
          >
            <LogOut
              className="flex-shrink-0 h-[18px] w-[18px] lg:h-5 lg:w-5 text-red-500"
              aria-hidden="true"
            />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">MLM Property</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

