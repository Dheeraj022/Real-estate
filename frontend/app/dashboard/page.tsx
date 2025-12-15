'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { isAdmin, isAgent } from '@/lib/auth'
import type { User } from '@/lib/auth'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await authAPI.getMe()
        const user: User = response.data.data.user

        if (isAdmin(user)) {
          router.push('/admin/dashboard')
        } else if (isAgent(user)) {
          router.push('/agent/dashboard')
        }
      } catch (error) {
        router.push('/login')
      }
    }

    checkUser()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}

