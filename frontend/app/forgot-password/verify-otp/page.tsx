'use client'

import { useEffect, useRef, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'

export default function ForgotPasswordVerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (!emailParam) {
      toast.error('Please enter your email first')
      router.replace('/forgot-password')
      return
    }
    setEmail(emailParam)
    // Focus first input
    setTimeout(() => otpInputsRef.current[0]?.focus(), 100)
  }, [router, searchParams])

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    if (!digit && value !== '') return

    setOtpDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })

    if (digit && index < otpInputsRef.current.length - 1) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const otp = otpDigits.join('')

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP')
      toast.error('Please enter the 6-digit OTP')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const response = await authAPI.verifyPasswordResetOtp({ email, otp })
      const { success, message, canResetPassword } = response.data || {}

      if (success && canResetPassword) {
        toast.success('OTP verified')
        const params = new URLSearchParams({ email, otp })
        router.push(`/forgot-password/reset-password?${params.toString()}`)
        return
      }

      setError(message || 'Invalid or expired OTP')
    } finally {
      setSubmitting(false)
    }
  }

  const isOtpComplete = otpDigits.join('').length === 6

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Verify OTP</h1>
        <p className="text-sm text-gray-500 mb-4 text-center">
          We have sent a 6-digit OTP to{' '}
          <span className="font-semibold text-gray-800">{email}</span>. Enter it below to verify
          your email.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between gap-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputsRef.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-10 h-10 text-center text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ))}
          </div>
          {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !isOtpComplete}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
          >
            {submitting ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  )
}

