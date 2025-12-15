# Troubleshooting Registration Issues

## Common Registration Errors and Solutions

### 1. "Registration failed" (Generic Error)

**Possible Causes:**
- Backend server not running
- Database connection issues
- CORS configuration problems
- Network connectivity issues

**Solutions:**

#### Check Backend Server
```bash
# In backend directory
cd backend
npm run dev
```

Verify the server is running on `http://localhost:5000` (or your configured PORT).

#### Check Database Connection
```bash
# Verify PostgreSQL is running
# Windows: Check Services
# Mac/Linux: 
sudo service postgresql status

# Test database connection
psql -U your_username -d mlm_property_db
```

Update `backend/.env` with correct database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/mlm_property_db?schema=public"
```

#### Check Environment Variables
Ensure both backend and frontend have correct environment files:
- `backend/.env` exists and has correct values
- `frontend/.env.local` exists and points to backend URL

#### Check Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: Look for JavaScript errors
- **Network tab**: Check if the API request is being made and what response you get

### 2. "Validation failed"

**Possible Causes:**
- Missing required fields
- Invalid email format
- Password too short
- Empty referral code when one is expected

**Solutions:**
- Ensure all required fields are filled
- Use a valid email format (e.g., `user@example.com`)
- Password must be at least 6 characters
- Leave referral code empty if you don't have one

### 3. "User with this email already exists"

**Solution:**
- Use a different email address
- Or login with existing account

### 4. "Invalid referral code"

**Solution:**
- Verify the referral code is correct
- Leave it empty if you don't have a referral code
- Referral codes are case-sensitive

### 5. "Database connection error"

**Solutions:**
```bash
# Check if PostgreSQL is running
# Windows: Services > PostgreSQL
# Mac: 
brew services list
# Linux:
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l

# Create database if it doesn't exist
createdb mlm_property_db

# Run migrations
cd backend
npm run prisma:migrate
```

### 6. "Cannot connect to server"

**Possible Causes:**
- Backend server not running
- Wrong API URL in frontend
- Port conflict

**Solutions:**
1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Check frontend `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. Verify backend port matches frontend configuration

4. Check if port 5000 is already in use:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

### 7. CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Network tab shows preflight request failures

**Solutions:**
1. Check `backend/.env`:
   ```env
   FRONTEND_URL=http://localhost:3000
   ```

2. Restart backend server after changing `.env`

3. Clear browser cache and try again

### 8. Network Request Failed

**Possible Causes:**
- Backend server not accessible
- Firewall blocking connection
- Wrong API URL

**Solutions:**
1. Test backend health endpoint:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"ok","message":"MLM Property API is running"}`

2. Check firewall settings

3. Verify API URL in frontend matches backend

## Debugging Steps

### Step 1: Check Backend Logs
Look at the terminal where backend is running. You should see:
- Server startup message
- Request logs
- Error messages

### Step 2: Check Frontend Console
Open browser DevTools (F12):
- **Console tab**: Check for JavaScript errors
- **Network tab**: 
  - Find the `/api/auth/register` request
  - Check the request payload
  - Check the response status and body

### Step 3: Test API Directly
Use curl or Postman to test the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Step 4: Verify Database
```bash
# Connect to database
psql -U your_username -d mlm_property_db

# Check if tables exist
\dt

# Check if User table exists
SELECT * FROM "User" LIMIT 1;
```

### Step 5: Check Prisma Connection
```bash
cd backend
npm run prisma:studio
```

This opens Prisma Studio where you can view database tables.

## Quick Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] PostgreSQL is running
- [ ] Database exists and migrations are run
- [ ] `backend/.env` file exists with correct values
- [ ] `frontend/.env.local` file exists with correct API URL
- [ ] No port conflicts (5000 for backend, 3000 for frontend)
- [ ] Browser console shows no errors
- [ ] Network tab shows API request being made

## Getting More Detailed Errors

The updated code now provides more detailed error messages. Check:

1. **Browser Console**: Full error details
2. **Backend Terminal**: Server-side error logs
3. **Network Tab**: Response body with error details

If you see a specific error message, it will help identify the exact issue.

## Still Having Issues?

1. Check the exact error message in browser console
2. Check backend terminal for error logs
3. Verify all environment variables are set correctly
4. Ensure database is accessible and migrations are run
5. Try registering with a different email address

