import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // This is a basic middleware - you can enhance it to check JWT tokens
  // For now, we'll handle authentication in the components
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/agent/:path*',
    '/dashboard',
  ],
  // Exclude admin login page from authentication checks
  // The matcher will still match, but we handle it in the component
}

