# Quick Fix: Backend Server Not Running

## The Problem
You're seeing "Cannot connect to server" because the backend API server is not running.

## Solution - Start the Backend Server

### Step 1: Open a Terminal/Command Prompt

### Step 2: Navigate to Backend Folder
```bash
cd backend
```

### Step 3: Start the Server
```bash
npm run dev
```

You should see:
```
Server running on port 5000
```

### Step 4: Keep This Terminal Open
The server needs to keep running. Don't close this terminal window.

### Step 5: Try Registration Again
Go back to your browser and try registering again.

## Verify Backend is Running

Open a new browser tab and visit:
```
http://localhost:5000/api/health
```

You should see:
```json
{"status":"ok","message":"MLM Property API is running"}
```

## If You Get Errors Starting the Backend

### Error: "Cannot find module"
```bash
cd backend
npm install
```

### Error: "Database connection failed"
1. Make sure PostgreSQL is running
2. Check `backend/.env` file exists
3. Verify `DATABASE_URL` is correct

### Error: "Port 5000 already in use"
Change the port in `backend/.env`:
```env
PORT=5001
```

Then update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Complete Setup Checklist

- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] Database configured (PostgreSQL running, `.env` file set up)
- [ ] Database migrations run (`npm run prisma:migrate` in backend folder)
- [ ] Backend server running (`npm run dev` in backend folder)
- [ ] Frontend server running (`npm run dev` in frontend folder)
- [ ] Backend accessible at `http://localhost:5000/api/health`

## Two Terminal Windows Needed

You need TWO terminal windows open:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Both should be running simultaneously!

