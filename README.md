# MLM Property Commission System

A production-ready full-stack web application for a property-based MLM (Multi-Level Marketing) commission platform with role-based access control.

## 🏗️ Architecture

- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Authentication**: JWT-based authentication
- **Database**: PostgreSQL with Prisma ORM

## ✨ Features

### Admin Panel
- ✅ Dashboard with KPIs and statistics
- ✅ Property management (Create, Read, Update, Delete)
- ✅ Agent/user management
- ✅ MLM tree visualization (3 levels)
- ✅ Sale approval/rejection workflow
- ✅ Commission approval/rejection
- ✅ Withdrawal request management
- ✅ Commission percentage setup per property

### Agent Panel
- ✅ Dashboard with personal stats
- ✅ Property browsing (read-only)
- ✅ Sale submission
- ✅ Commission history
- ✅ Wallet management
- ✅ Withdrawal requests
- ✅ Downline view (3 levels max)
- ✅ Referral link sharing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A strong secret key
- `PORT`: Backend server port (default: 5000)
- `FRONTEND_URL`: Frontend URL (default: http://localhost:3000)

4. Setup database:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

5. Create admin user:
```bash
node scripts/create-admin.js
```

6. Start backend server:
```bash
# Development
npm run dev

# Production
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:5000/api)

4. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📁 Project Structure

```
.
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── routes/
│   │   ├── auth.js                 # Authentication routes
│   │   ├── admin.js                # Admin routes
│   │   ├── agent.js                # Agent routes
│   │   └── properties.js           # Property routes
│   ├── middleware/
│   │   └── auth.js                 # Auth middleware
│   ├── utils/
│   │   ├── jwt.js                  # JWT utilities
│   │   └── commission.js           # Commission calculation
│   ├── scripts/
│   │   └── create-admin.js         # Admin user creation script
│   └── server.js                   # Express server
│
└── frontend/
    ├── app/
    │   ├── admin/                  # Admin pages
    │   ├── agent/                  # Agent pages
    │   ├── login/                  # Login page
    │   └── register/               # Registration page
    ├── components/
    │   └── Layout/                 # Layout components
    ├── lib/
    │   ├── api.ts                  # API client
    │   └── auth.ts                 # Auth utilities
    └── middleware.ts               # Next.js middleware
```

## 🔐 Authentication

- JWT tokens stored in HTTP-only cookies
- Role-based access control (Admin/Agent)
- Protected routes with middleware
- Automatic token refresh handling

## 💰 Commission System

### MLM Structure
- **Level 0**: Seller (the agent who made the sale)
- **Level 1**: Direct upline of the seller
- **Level 2**: Upline of the upline
- Maximum depth: 3 levels

### Commission Flow
1. Agent submits a property sale
2. Admin approves the sale
3. System calculates commissions for all eligible levels
4. Commissions are created with `pending` status
5. Admin approves each commission individually
6. Wallet is credited upon approval

### Commission Calculation
- Each property has configurable commission percentages:
  - Seller % (Level 0)
  - Level 1 %
  - Level 2 %
- Total commission % cannot exceed 100%
- Commissions are calculated as: `saleAmount × percentage / 100`

## 🗄️ Database Schema

### Key Models
- **User**: Admin and Agent users with MLM hierarchy
- **Property**: Property listings with commission structure
- **Sale**: Property sales with approval workflow
- **Commission**: Commission records per level
- **Wallet**: Agent wallet balances
- **Withdrawal**: Withdrawal requests

See `backend/prisma/schema.prisma` for complete schema.

## 🔒 Security Features

- Password hashing with bcrypt
- JWT authentication
- Role-based access control
- Input validation
- SQL injection protection (Prisma ORM)
- CORS configuration

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new agent
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin Routes
- `GET /api/admin/dashboard` - Dashboard stats
- `POST /api/admin/properties` - Create property
- `PUT /api/admin/properties/:id` - Update property
- `DELETE /api/admin/properties/:id` - Delete property
- `GET /api/admin/users` - Get all agents
- `GET /api/admin/mlm-tree` - Get MLM hierarchy
- `GET /api/admin/sales` - Get all sales
- `PUT /api/admin/sales/:id/approve` - Approve sale
- `PUT /api/admin/sales/:id/reject` - Reject sale
- `GET /api/admin/commissions` - Get all commissions
- `PUT /api/admin/commissions/:id/approve` - Approve commission
- `PUT /api/admin/commissions/:id/reject` - Reject commission
- `GET /api/admin/withdrawals` - Get all withdrawals
- `PUT /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `PUT /api/admin/withdrawals/:id/reject` - Reject withdrawal

### Agent Routes
- `GET /api/agent/dashboard` - Agent dashboard
- `POST /api/agent/sales` - Submit sale
- `GET /api/agent/sales` - Get agent's sales
- `GET /api/agent/commissions` - Get commissions
- `GET /api/agent/wallet` - Get wallet
- `POST /api/agent/withdrawals` - Request withdrawal
- `GET /api/agent/withdrawals` - Get withdrawals
- `GET /api/agent/downline` - Get downline (3 levels)
- `GET /api/agent/referral-info` - Get referral info

## 🧪 Testing

To test the system:

1. Create an admin user using the script
2. Register as an agent (or create via admin panel)
3. Login as admin and create properties
4. Login as agent and submit sales
5. Approve sales and commissions as admin
6. Request withdrawals as agent
7. Approve withdrawals as admin

## 📄 License

This project is built for production use. Customize as needed for your business requirements.

## 🤝 Support

For issues or questions, refer to the documentation in each module's README:
- Backend: `backend/README.md`
- Frontend: `frontend/README.md`

## 🎯 Next Steps

- Add image upload functionality for properties
- Implement email notifications
- Add reporting and analytics
- Enhance UI/UX
- Add unit and integration tests
- Implement rate limiting
- Add audit logging

