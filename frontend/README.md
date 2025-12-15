# MLM Property Commission System - Frontend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update `NEXT_PUBLIC_API_URL` to point to your backend API.

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

## Features

### Admin Panel
- Dashboard with KPIs
- Property management (CRUD)
- User/Agent management
- MLM tree visualization
- Sale approval/rejection
- Commission approval/rejection
- Withdrawal management

### Agent Panel
- Dashboard with stats
- Property browsing (read-only)
- Sale submission
- Commission history
- Wallet management
- Withdrawal requests
- Downline view (3 levels)
- Referral link sharing

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages
│   ├── agent/             # Agent pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── layout.tsx          # Root layout
├── components/             # React components
│   └── Layout/            # Layout components
├── lib/                    # Utilities
│   ├── api.ts             # API client
│   └── auth.ts            # Auth utilities
└── middleware.ts          # Next.js middleware
```

## Authentication

The app uses JWT tokens stored in cookies. The token is automatically included in API requests via axios interceptors.

## API Integration

All API calls are centralized in `lib/api.ts` using axios. The API client automatically:
- Adds JWT token to requests
- Handles 401 errors (redirects to login)
- Provides typed responses

