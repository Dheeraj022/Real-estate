# How to Start the Backend Server

## Quick Start (Windows)

### Option 1: Using the Batch File
1. Open File Explorer
2. Navigate to: `d:\OneDrive\Desktop\REAL ESTATE\backend`
3. Double-click `start-server.bat`
4. The server will start automatically

### Option 2: Using Command Prompt/PowerShell

1. **Open Command Prompt or PowerShell**

2. **Navigate to backend folder:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   ```

3. **Check if .env file exists:**
   If you don't have a `.env` file, create it with this content:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/mlm_property_db?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
   JWT_EXPIRE="7d"
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL="http://localhost:3000"
   ```

4. **IMPORTANT: Edit .env file**
   - Open `backend/.env` in a text editor
   - Update `DATABASE_URL` with your PostgreSQL username and password:
     ```
     DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/mlm_property_db?schema=public"
     ```

5. **Start the server:**
   ```cmd
   npm run dev
   ```

6. **You should see:**
   ```
   Server running on port 5000
   ```

7. **Keep this window open!** The server must keep running.

## Verify It's Working

Open your browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{"status":"ok","message":"MLM Property API is running"}
```

## If You Get Database Errors

If you see database connection errors, you need to:

1. **Make sure PostgreSQL is installed and running**
2. **Create the database:**
   ```sql
   CREATE DATABASE mlm_property_db;
   ```
3. **Run migrations:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   npm run prisma:migrate
   ```

## Common Issues

### "Cannot find module"
Run: `npm install` in the backend folder

### "Port 5000 already in use"
Change PORT in `.env` to 5001, then update frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### "Database connection failed"
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Make sure database `mlm_property_db` exists

## Next Steps

Once the backend is running:
1. Keep that terminal window open
2. Go back to your browser
3. Try registering again - it should work now!

