'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { setToken } from '@/lib/auth'

export default function ForgotPasswordResetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const otpParam = searchParams.get('otp')
    if (!emailParam || !otpParam) {
      toast.error('Please verify OTP first')
      router.replace('/forgot-password')
      return
    }
    setEmail(emailParam)
    setOtp(otpParam)
  }, [router, searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError(null)
    setSubmitting(true)

    try {
      const response = await authAPI.resetPassword({
        email,
        otp,
        password
      })
      const { success, message, data } = response.data || {}

      if (!success) {
        setError(message || 'Failed to update password')
        return
      }

      toast.success('Password updated successfully. Logging you in...')
      const token = data?.token
      if (token) {
        setToken(token)
        router.push('/agent/dashboard')
      } else {
        // Fallback: redirect to login if no token returned
        router.push('/login')
      }
    } catch (err: any) {
      const message = err.response?.data?.message
      setError(message || 'Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Update password</h1>
        <p className="text-sm text-gray-500 mb-4 text-center">
          {email && (
            <>
              Set a new password for{' '}
              <span className="font-semibold text-gray-800">{email}</span>.
            </>
          )}
          {!email && 'Set a new password for your account.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter new password"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Re-enter new password"
            />
          </div>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
          >
            {submitting ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

