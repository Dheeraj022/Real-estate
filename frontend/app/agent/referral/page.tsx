'use client'

import { useState, useEffect } from 'react'
import AgentLayout from '@/components/Layout/AgentLayout'
import { agentAPI } from '@/lib/api'
import toast from 'react-hot-toast'

interface ReferralInfo {
  referralCode: string
  referralLink: string
  upline: {
    id: string
    name: string
    email: string
    referralCode: string
  } | null
}

export default function AgentReferralPage() {
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReferralInfo()
  }, [])

  const fetchReferralInfo = async () => {
    try {
      const response = await agentAPI.getReferralInfo()
      setInfo(response.data.data)
    } catch (error: any) {
      toast.error('Failed to load referral information')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Referral Information</h1>

        {/* Referral Code */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
          <div className="flex items-center gap-4">
            <code className="text-2xl font-mono font-bold bg-white bg-opacity-20 px-4 py-2 rounded">
              {info?.referralCode}
            </code>
            <button
              onClick={() => copyToClipboard(info?.referralCode || '')}
              className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Copy Code
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Referral Link</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={info?.referralLink || ''}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(info?.referralLink || '')}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Copy Link
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Share this link with others to invite them to join under you
          </p>
        </div>

        {/* Upline Info */}
        {info?.upline && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Upline</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">{info.upline.name}</p>
              <p className="text-sm text-gray-600">{info.upline.email}</p>
              <p className="text-xs text-gray-500 mt-2">Referral Code: {info.upline.referralCode}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-blue-700">
            <li>Share your referral link with potential agents</li>
            <li>When they register using your link, they become your downline</li>
            <li>You earn commissions from their sales (Level 1)</li>
            <li>You also earn from your downline's downline (Level 2)</li>
            <li>Maximum depth is 3 levels</li>
          </ul>
        </div>
      </div>
    </AgentLayout>
  )
}

