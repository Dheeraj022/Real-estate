'use client'

import { useState, useEffect } from 'react'
import AgentLayout from '@/components/Layout/AgentLayout'
import { agentAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/currency'

interface Wallet {
  balance: number
  pendingBalance: number
  approvedBalance: number
}

interface Withdrawal {
  id: string
  amount: number
  status: string
  createdAt: string
}

interface BankDetails {
  id: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  email: string
}

export default function AgentWalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBankForm, setShowBankForm] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    email: '',
  })
  const [bankFormErrors, setBankFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [walletResponse, withdrawalsResponse, bankDetailsResponse] = await Promise.all([
        agentAPI.getWallet(),
        agentAPI.getWithdrawals({}),
        agentAPI.getBankDetails().catch(() => ({ data: { data: { bankDetails: null } } })),
      ])
      setWallet(walletResponse.data.data.wallet)
      setWithdrawals(withdrawalsResponse.data.data.withdrawals)
      setBankDetails(bankDetailsResponse.data.data.bankDetails)
      if (bankDetailsResponse.data.data.bankDetails) {
        setBankFormData({
          bankName: bankDetailsResponse.data.data.bankDetails.bankName,
          accountHolderName: bankDetailsResponse.data.data.bankDetails.accountHolderName,
          accountNumber: bankDetailsResponse.data.data.bankDetails.accountNumber,
          ifscCode: bankDetailsResponse.data.data.bankDetails.ifscCode,
          email: bankDetailsResponse.data.data.bankDetails.email,
        })
      }
    } catch (error: any) {
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  const validateBankForm = () => {
    const errors: Record<string, string> = {}
    
    if (!bankFormData.bankName.trim()) {
      errors.bankName = 'Bank name is required'
    }
    if (!bankFormData.accountHolderName.trim()) {
      errors.accountHolderName = 'Account holder name is required'
    }
    if (!bankFormData.accountNumber.trim()) {
      errors.accountNumber = 'Account number is required'
    } else if (!/^\d+$/.test(bankFormData.accountNumber)) {
      errors.accountNumber = 'Account number must contain only digits'
    }
    if (!bankFormData.ifscCode.trim()) {
      errors.ifscCode = 'IFSC code is required'
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankFormData.ifscCode.toUpperCase())) {
      errors.ifscCode = 'IFSC code must be in format: AAAA0XXXXX'
    }
    if (!bankFormData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bankFormData.email)) {
      errors.email = 'Please provide a valid email'
    }
    
    setBankFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateBankForm()) {
      return
    }

    try {
      const response = await agentAPI.saveBankDetails({
        bankName: bankFormData.bankName.trim(),
        accountHolderName: bankFormData.accountHolderName.trim(),
        accountNumber: bankFormData.accountNumber.trim(),
        ifscCode: bankFormData.ifscCode.toUpperCase().trim(),
        email: bankFormData.email.trim(),
      })
      setBankDetails(response.data.data.bankDetails)
      setShowBankForm(false)
      toast.success('Bank details saved successfully')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save bank details')
    }
  }

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bankDetails) {
      toast.error('Please add your bank details first')
      setShowBankForm(true)
      return
    }

    const amount = parseFloat(withdrawalAmount)
    if (!wallet || wallet.balance < amount) {
      toast.error('Insufficient balance')
      return
    }

    try {
      await agentAPI.requestWithdrawal({ amount })
      toast.success('Withdrawal request submitted. Waiting for admin approval.')
      setShowModal(false)
      setWithdrawalAmount('')
      fetchData()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit withdrawal request'
      toast.error(errorMessage)
      if (errorMessage.includes('Bank details')) {
        setShowBankForm(true)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
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
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Wallet</h1>

        {/* Wallet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-lg shadow-lg">
            <p className="text-sm opacity-90 mb-2">Total Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(wallet?.balance)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(wallet?.pendingBalance)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Approved</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(wallet?.approvedBalance)}</p>
          </div>
        </div>

        {/* Bank Details Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Bank Details</h2>
            <button
              onClick={() => setShowBankForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {bankDetails ? 'Edit Bank Details' : 'Add Bank Details'}
            </button>
          </div>
          {bankDetails ? (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Bank Name</p>
                  <p className="font-semibold text-gray-800">{bankDetails.bankName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Account Holder</p>
                  <p className="font-semibold text-gray-800">{bankDetails.accountHolderName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Account Number</p>
                  <p className="font-semibold text-gray-800">{bankDetails.accountNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">IFSC Code</p>
                  <p className="font-semibold text-gray-800">{bankDetails.ifscCode}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{bankDetails.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No bank details found. Please add your bank details to request withdrawals.
              </p>
            </div>
          )}
        </div>

        {/* Withdrawal Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Request Withdrawal</h2>
            <button
              onClick={() => setShowModal(true)}
              disabled={!wallet || wallet.balance <= 0 || !bankDetails}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request Withdrawal
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Available balance: <span className="font-semibold">{formatCurrency(wallet?.balance)}</span>
          </p>
          {!bankDetails && (
            <p className="text-xs text-yellow-600 mt-2">
              ⚠️ Bank details required to request withdrawal
            </p>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Withdrawal History</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(withdrawal.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(withdrawal.createdAt), 'MMM dd, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {withdrawals.length === 0 && (
            <div className="text-center py-12 text-gray-500">No withdrawal requests</div>
          )}
        </div>

        {/* Bank Details Form Modal */}
        {showBankForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Bank Details</h2>
              <form onSubmit={handleSaveBankDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankFormData.bankName}
                    onChange={(e) => {
                      setBankFormData({ ...bankFormData, bankName: e.target.value })
                      setBankFormErrors({ ...bankFormErrors, bankName: '' })
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter bank name"
                  />
                  {bankFormErrors.bankName && (
                    <p className="text-xs text-red-600 mt-1">{bankFormErrors.bankName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankFormData.accountHolderName}
                    onChange={(e) => {
                      setBankFormData({ ...bankFormData, accountHolderName: e.target.value })
                      setBankFormErrors({ ...bankFormErrors, accountHolderName: '' })
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter account holder name"
                  />
                  {bankFormErrors.accountHolderName && (
                    <p className="text-xs text-red-600 mt-1">{bankFormErrors.accountHolderName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={bankFormData.accountNumber}
                    onChange={(e) => {
                      setBankFormData({ ...bankFormData, accountNumber: e.target.value })
                      setBankFormErrors({ ...bankFormErrors, accountNumber: '' })
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter account number"
                  />
                  {bankFormErrors.accountNumber && (
                    <p className="text-xs text-red-600 mt-1">{bankFormErrors.accountNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={bankFormData.ifscCode}
                    onChange={(e) => {
                      setBankFormData({ ...bankFormData, ifscCode: e.target.value.toUpperCase() })
                      setBankFormErrors({ ...bankFormErrors, ifscCode: '' })
                    }}
                    required
                    maxLength={11}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="AAAA0XXXXX"
                  />
                  {bankFormErrors.ifscCode && (
                    <p className="text-xs text-red-600 mt-1">{bankFormErrors.ifscCode}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                  <input
                    type="email"
                    value={bankFormData.email}
                    onChange={(e) => {
                      setBankFormData({ ...bankFormData, email: e.target.value })
                      setBankFormErrors({ ...bankFormErrors, email: '' })
                    }}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter email address"
                  />
                  {bankFormErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{bankFormErrors.email}</p>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Save Bank Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBankForm(false)
                      setBankFormErrors({})
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Request Withdrawal</h2>
              
              {/* Bank Details Summary */}
              {bankDetails ? (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Bank Details</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setShowBankForm(true)
                      }}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Bank:</span> {bankDetails.bankName}</p>
                    <p><span className="font-medium">Account Holder:</span> {bankDetails.accountHolderName}</p>
                    <p><span className="font-medium">Account Number:</span> {bankDetails.accountNumber}</p>
                    <p><span className="font-medium">IFSC:</span> {bankDetails.ifscCode}</p>
                    <p><span className="font-medium">Email:</span> {bankDetails.email}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">Bank details are required to request withdrawal.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setShowBankForm(true)
                    }}
                    className="text-sm text-primary-600 hover:underline font-semibold"
                  >
                    Add Bank Details
                  </button>
                </div>
              )}

              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    max={wallet?.balance}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    required
                    disabled={!bankDetails}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={`Max: ${formatCurrency(wallet?.balance)}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCurrency(wallet?.balance)}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!bankDetails || !withdrawalAmount}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setWithdrawalAmount('')
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AgentLayout>
  )
}

