# Run Server in Background - No Window Needed!

## ✅ Solution: Use PM2 (Recommended)

PM2 lets the server run in the background without any window.

### Quick Start:

1. **Double-click:** `start-background.bat` in the backend folder
2. **First time only:** It will install PM2 (may ask for admin)
3. **Done!** Server runs in background - close the window!

### After Setup:

- **Server runs automatically** - no window needed
- **Stays running** even if you close all windows
- **Auto-restarts** if it crashes

### To Stop Server:

Double-click: `stop-server.bat`

Or run:
```cmd
pm2 stop mlm-property-backend
```

### To Check if Running:

Open browser: `http://localhost:5000/api/health`

---

## Alternative: Minimized Window

If you don't want to install PM2:

1. **Double-click:** `start-minimized.bat`
2. **Window minimizes** to taskbar
3. **Server keeps running** in background
4. **You can restore** the window anytime to see logs

---

## Why This Happens

**This is normal!** Node.js servers need to keep running to handle requests. 

- **Development:** Usually keep window open to see logs
- **Production:** Use PM2 or similar to run in background

---

## Choose Your Method:

1. **PM2 (Best):** `start-background.bat` - No window at all
2. **Minimized:** `start-minimized.bat` - Window minimized to taskbar  
3. **Normal:** `START_SERVER_NOW.bat` - Keep window open (for debugging)

