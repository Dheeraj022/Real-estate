import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      console.error('Request timeout or network error:', error);
      if (typeof window !== 'undefined') {
        // Show user-friendly error
        const errorMessage = error.message || 'Request timed out. Please check your connection.';
        if (error.config?.showError !== false) {
          // Only show error if not explicitly disabled
        }
      }
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    // Handle connection errors
    if (!error.response && error.request) {
      console.error('No response from server. Is backend running?');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; referralCode?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Properties API
export const propertiesAPI = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/properties', { params }),
  getById: (id: string) => api.get(`/properties/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  // Properties
  createProperty: (data: any) => api.post('/admin/properties', data),
  updateProperty: (id: string, data: any) => api.put(`/admin/properties/${id}`, data),
  deleteProperty: (id: string) => api.delete(`/admin/properties/${id}`),
  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  getMLMTree: () => api.get('/admin/mlm-tree'),
  // Sales
  getSales: (params?: { status?: string; page?: number; limit?: number; propertyId?: string; buyer?: string }) =>
    api.get('/admin/sales', { params }),
  approveSale: (id: string) => api.put(`/admin/sales/${id}/approve`),
  rejectSale: (id: string) => api.put(`/admin/sales/${id}/reject`),
  // Commissions
  getCommissions: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/commissions', { params }),
  approveCommission: (id: string) => api.put(`/admin/commissions/${id}/approve`),
  rejectCommission: (id: string) => api.put(`/admin/commissions/${id}/reject`),
  // Withdrawals
  getWithdrawals: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/withdrawals', { params }),
  approveWithdrawal: (id: string) => api.put(`/admin/withdrawals/${id}/approve`),
  rejectWithdrawal: (id: string) => api.put(`/admin/withdrawals/${id}/reject`),
  // Notifications
  getNotificationCounts: () => api.get('/admin/notifications/counts'),
  markSalesViewed: () => api.post('/admin/notifications/mark-sales-viewed'),
  markCommissionsViewed: () => api.post('/admin/notifications/mark-commissions-viewed'),
  markWithdrawalsViewed: () => api.post('/admin/notifications/mark-withdrawals-viewed'),
};

// Agent API
export const agentAPI = {
  getDashboard: () => api.get('/agent/dashboard'),
  // Sales
  submitSale: (data: { propertyId: string; buyerName: string; buyerContact: string; saleAmount: number }) =>
    api.post('/agent/sales', data),
  getSales: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/agent/sales', { params }),
  // Commissions
  getCommissions: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/agent/commissions', { params }),
  // Wallet
  getWallet: () => api.get('/agent/wallet'),
  // Bank Details
  getBankDetails: () => api.get('/agent/bank-details'),
  saveBankDetails: (data: { bankName: string; accountHolderName: string; accountNumber: string; ifscCode: string; email: string }) =>
    api.post('/agent/bank-details', data),
  // Withdrawals
  requestWithdrawal: (data: { amount: number }) => api.post('/agent/withdrawals', data),
  getWithdrawals: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/agent/withdrawals', { params }),
  // Downline
  getDownline: () => api.get('/agent/downline'),
  getReferralInfo: () => api.get('/agent/referral-info'),
};

export default api;

