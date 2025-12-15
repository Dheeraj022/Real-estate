# Fix: "The system cannot find the path specified"

## The Problem
Command Prompt can't find the path. This is usually because:
- OneDrive path might be different
- Spaces in folder names need special handling
- Path might need to be typed differently

## ✅ Solution 1: Use the Batch File (EASIEST)

1. **Open File Explorer** (Win + E)
2. **Navigate to:** `d:\OneDrive\Desktop\REAL ESTATE\backend`
3. **Look for:** `START_HERE.bat` file
4. **Double-click it**
5. **A black window will open** - that's your server!
6. **Keep it open!**

## ✅ Solution 2: Try Different Path Format

In Command Prompt, try these commands **one at a time**:

### Option A: Without quotes (if no spaces)
```cmd
cd d:\OneDrive\Desktop\REAL ESTATE\backend
```

### Option B: With quotes and /d flag
```cmd
cd /d "d:\OneDrive\Desktop\REAL ESTATE\backend"
```

### Option C: Navigate step by step
```cmd
d:
cd OneDrive\Desktop
cd "REAL ESTATE"
cd backend
```

### Then start server:
```cmd
npm run dev
```

## ✅ Solution 3: Find the Exact Path

1. **Open File Explorer**
2. **Navigate to the backend folder**
3. **Click in the address bar** (at the top)
4. **Copy the exact path** shown there
5. **Use that exact path** in Command Prompt

## ✅ Solution 4: Use PowerShell Instead

1. **Right-click on Start button**
2. **Click:** "Windows PowerShell" or "Terminal"
3. **Type:**
   ```powershell
   Set-Location "d:\OneDrive\Desktop\REAL ESTATE\backend"
   npm run dev
   ```

## ✅ Solution 5: Check if OneDrive Path is Different

OneDrive might use a different path. Try:

```cmd
cd %USERPROFILE%\OneDrive\Desktop\REAL ESTATE\backend
```

Or:

```cmd
cd %USERPROFILE%\Desktop\REAL ESTATE\backend
```

## 🔍 Verify You're in the Right Folder

After changing directory, verify:
```cmd
dir
```

You should see:
- `package.json`
- `server.js`
- `node_modules` folder
- `prisma` folder

## ✅ Once You're in the Right Folder

Run:
```cmd
npm run dev
```

You should see:
```
Server running on port 5000
```

## 💡 Pro Tip

**Easiest way:** Just double-click `START_HERE.bat` in the backend folder!
No need to type any commands!



