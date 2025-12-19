'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address')
      toast.error('Please enter your email address')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await authAPI.requestPasswordReset({ email: trimmedEmail })
      const { success, error: apiError } = response.data || {}

      if (success) {
        toast.success('OTP sent to your email')
        const params = new URLSearchParams({ email: trimmedEmail })
        router.push(`/forgot-password/verify-otp?${params.toString()}`)
        return
      }

      if (apiError === 'USER_NOT_FOUND') {
        setError('User not found. Please check your email.')
      } else if (apiError === 'OTP_SEND_FAILED') {
        setError('Failed to send OTP. Please try again.')
      } else {
        setError('Something went wrong. Try again later.')
      }
    } catch (err: any) {
      const apiError = err.response?.data?.error
      if (apiError === 'USER_NOT_FOUND') {
        setError('User not found. Please check your email.')
      } else if (apiError === 'OTP_SEND_FAILED') {
        setError('Failed to send OTP. Please try again.')
      } else {
        // Hide low-level messages like "Route not found" and show a friendly generic error instead
        setError('Something went wrong. Try again later.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-3 text-center">
          Enter the email associated with your account and we&apos;ll send you a verification code.
        </p>
        {error && <p className="text-xs text-red-500 mb-2 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
          >
            {submitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      </div>
    </div>
  )
}

