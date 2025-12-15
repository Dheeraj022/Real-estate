/**
 * API Helper Functions
 * Provides timeout handling and error management for API calls
 */

export interface ApiError {
  message: string
  isTimeout: boolean
  isNetworkError: boolean
  status?: number
}

/**
 * Wrap API call with timeout
 * @param apiCall - The API promise
 * @param timeoutMs - Timeout in milliseconds (default: 8000)
 * @returns Promise with timeout handling
 */
export async function withTimeout<T>(
  apiCall: Promise<T>,
  timeoutMs: number = 8000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  })

  return Promise.race([apiCall, timeoutPromise])
}

/**
 * Handle API errors and return user-friendly messages
 * @param error - The error object
 * @returns Error information
 */
export function handleApiError(error: any): ApiError {
  if (error.message === 'Request timeout' || error.code === 'ECONNABORTED') {
    return {
      message: 'Request timed out. Please check your connection and try again.',
      isTimeout: true,
      isNetworkError: false,
    }
  }

  if (!error.response && error.request) {
    return {
      message: 'Cannot connect to server. Please check if backend is running.',
      isTimeout: false,
      isNetworkError: true,
    }
  }

  if (error.response) {
    return {
      message: error.response.data?.message || 'An error occurred',
      isTimeout: false,
      isNetworkError: false,
      status: error.response.status,
    }
  }

  return {
    message: error.message || 'An unexpected error occurred',
    isTimeout: false,
    isNetworkError: false,
  }
}

