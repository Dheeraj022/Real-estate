# How to Start the Backend Server

## Quick Start

1. **Open a new Command Prompt or PowerShell window**

2. **Navigate to backend folder:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   ```

3. **Start the server:**
   ```cmd
   npm run dev
   ```

4. **You should see:**
   ```
   Server running on port 5000
   ```

5. **Keep this window open!** The server must keep running.

## Verify It's Working

Open your browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{"status":"ok","message":"MLM Property API is running"}
```

## If You Get Errors

### "Cannot find module"
Run:
```cmd
cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
npm install
```

### "Port 5000 already in use"
1. Find what's using port 5000:
   ```cmd
   netstat -ano | findstr :5000
   ```
2. Kill the process or change port in `.env`:
   ```env
   PORT=5001
   ```

### "Database connection error"
1. Make sure the database file exists: `backend/dev.db`
2. If not, run migrations:
   ```cmd
   npm run prisma:migrate
   ```

## Important

- **Keep the terminal window open** - closing it stops the server
- The server must be running for the frontend to work
- You'll see request logs in the terminal as you use the app



