# 🚀 Quick Start - Backend Server

## The Problem
You're seeing "Cannot connect to server" because the backend server is not running.

## ✅ Solution - Start the Server

### Method 1: Double-Click (Easiest)

1. **Open File Explorer**
2. **Navigate to:** `d:\OneDrive\Desktop\REAL ESTATE\backend`
3. **Double-click:** `start.bat`
4. **A black window will open** - this is your server running
5. **Keep this window open!** Don't close it.

### Method 2: Command Prompt

1. **Press `Win + R`**
2. **Type:** `cmd` and press Enter
3. **Type these commands one by one:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   npm run dev
   ```
4. **You should see:** `Server running on port 5000`
5. **Keep this window open!**

### Method 3: PowerShell

1. **Right-click on Start button**
2. **Click:** "Windows PowerShell" or "Terminal"
3. **Type these commands:**
   ```powershell
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   npm run dev
   ```
4. **Keep the window open!**

## ✅ Verify Server is Running

1. **Open your browser**
2. **Go to:** `http://localhost:5000/api/health`
3. **You should see:**
   ```json
   {"status":"ok","message":"MLM Property API is running"}
   ```

## ✅ Then Try Registration

Once you see the health check working:
1. Go back to your registration page
2. Refresh the page
3. Try registering - it should work now!

## ⚠️ Important Notes

- **The server window MUST stay open** - closing it stops the server
- **You'll see logs** in the server window as you use the app
- **If you see errors** in the server window, share them with me

## 🔧 Common Issues

### "npm is not recognized"
- Install Node.js from: https://nodejs.org/
- Restart your computer after installing

### "Port 5000 already in use"
- Something else is using port 5000
- Change port in `backend/.env` to `PORT=5001`
- Update `frontend/.env.local` to `NEXT_PUBLIC_API_URL=http://localhost:5001/api`

### "Cannot find module"
- Run: `npm install` in the backend folder

## 📝 What You Should See

When the server starts successfully, you'll see:
```
Server running on port 5000
```

Then when you register, you'll see logs like:
```
POST /api/auth/register 201
User registered successfully: { userId: '...', email: '...' }
```

---

**Remember:** Keep the server window open while using the application!



