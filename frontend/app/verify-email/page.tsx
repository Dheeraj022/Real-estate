'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { setToken } from '@/lib/auth'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (!emailParam) {
      // If no email is provided, redirect back to register
      router.replace('/register')
      return
    }
    setEmail(emailParam)
  }, [searchParams, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return

    if (otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.verifyOtp({ email, otp: otp.trim() })
      const { token } = response.data

      if (!token) {
        toast.error('Verification succeeded but no token was returned.')
        setLoading(false)
        return
      }

      // Save auth token and redirect directly to agent dashboard
      setToken(token)
      toast.success('Email verified successfully. Redirecting to dashboard...')
      router.push('/agent/dashboard')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to verify OTP'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-4 text-primary-600">
          Verify Your Email
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          We have sent a verification code to{' '}
          <span className="font-semibold text-gray-800">{email}</span>. <br />
          Please enter the 6-digit code below to complete your registration.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code (OTP)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                // Allow only digits
                const value = e.target.value.replace(/\D/g, '')
                setOtp(value)
              }}
              required
              className="w-full tracking-[0.4em] text-center px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          OTP is valid for 10 minutes. If it expires, please register again.
        </p>
      </div>
    </div>
  )
}


