# MLM Property Commission System - Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

Update the following in `.env`:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A strong secret key for JWT tokens
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend application URL

### 3. Setup Database
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 4. Create Admin User
You can create an admin user using Prisma Studio or by running a script. For now, you can use Prisma Studio:
1. Run `npm run prisma:studio`
2. Navigate to User table
3. Create a new user with:
   - `role`: `admin`
   - `email`: your admin email
   - `password`: (hashed with bcrypt - use a script or API endpoint)

Or create a seed script to initialize admin user.

### 5. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new agent
- `POST /api/auth/login` - Login (admin or agent)
- `GET /api/auth/me` - Get current user

### Properties (Public to authenticated users)
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get single property

### Admin Routes (Admin only)
- `GET /api/admin/dashboard` - Dashboard statistics
- `POST /api/admin/properties` - Create property
- `PUT /api/admin/properties/:id` - Update property
- `DELETE /api/admin/properties/:id` - Delete property
- `GET /api/admin/users` - Get all agents
- `GET /api/admin/users/:id` - Get agent details
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

### Agent Routes (Agent only)
- `GET /api/agent/dashboard` - Agent dashboard
- `POST /api/agent/sales` - Submit sale
- `GET /api/agent/sales` - Get agent's sales
- `GET /api/agent/commissions` - Get agent's commissions
- `GET /api/agent/wallet` - Get wallet
- `POST /api/agent/withdrawals` - Request withdrawal
- `GET /api/agent/withdrawals` - Get withdrawal requests
- `GET /api/agent/downline` - Get downline (3 levels)
- `GET /api/agent/referral-info` - Get referral code and link

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

## Commission Calculation

When a sale is approved:
1. Commission records are created for:
   - Level 0 (Seller): Based on `sellerPercent`
   - Level 1 (Direct upline): Based on `level1Percent`
   - Level 2 (Upline's upline): Based on `level2Percent`
2. Commissions are created with `pending` status
3. Wallet `pendingBalance` is updated
4. Admin must approve each commission individually
5. On approval, balance moves from `pendingBalance` to `approvedBalance` and `balance`

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Role-based access control (RBAC)
- Input validation with express-validator
- SQL injection protection via Prisma ORM

