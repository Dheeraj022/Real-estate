# Setup Guide - MLM Property Commission System

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- PostgreSQL database installed and running
- npm or yarn package manager

## Step-by-Step Setup

### 1. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE mlm_property_db;
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/mlm_property_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRE="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Create admin user
node scripts/create-admin.js
```

Follow the prompts to create your admin account.

```bash
# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
# Start frontend development server
npm run dev
```

Frontend should now be running on `http://localhost:3000`

## First Steps

1. **Login as Admin**
   - Go to `http://localhost:3000/login`
   - Use the admin credentials you created

2. **Create Properties**
   - Navigate to Properties in admin panel
   - Click "Add Property"
   - Fill in property details and commission percentages
   - Ensure total commission % doesn't exceed 100%

3. **Register as Agent**
   - Logout from admin
   - Go to Register page
   - Create an agent account (with or without referral code)

4. **Test the Flow**
   - Login as agent
   - Browse properties
   - Submit a sale
   - Login as admin
   - Approve the sale
   - Approve commissions
   - Check agent wallet

## Common Issues

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in backend `.env`
- Update FRONTEND_URL if backend port changes
- Update NEXT_PUBLIC_API_URL in frontend `.env.local`

### CORS Errors
- Verify FRONTEND_URL in backend `.env` matches frontend URL
- Check NEXT_PUBLIC_API_URL in frontend `.env.local`

### Prisma Errors
- Run `npm run prisma:generate` again
- Check database connection
- Verify schema.prisma is correct

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Update `DATABASE_URL` to production database
4. Use process manager (PM2) or containerization
5. Enable HTTPS

### Frontend
1. Build: `npm run build`
2. Start: `npm start`
3. Or deploy to Vercel/Netlify
4. Update `NEXT_PUBLIC_API_URL` to production API

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Set up backup strategy
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Regular security updates

## Support

For issues:
1. Check logs in terminal
2. Verify environment variables
3. Check database connection
4. Review API responses in browser console
5. Check Prisma Studio: `npm run prisma:studio` (backend)

