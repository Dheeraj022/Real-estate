# Install PM2 to Run Server in Background

## What is PM2?
PM2 is a process manager that lets you run Node.js applications in the background without keeping a window open.

## Installation Steps

### Step 1: Install PM2 Globally
Open Command Prompt or PowerShell as Administrator and run:
```cmd
npm install -g pm2
```

### Step 2: Navigate to Backend Folder
```cmd
cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
```

### Step 3: Start Server with PM2
```cmd
pm2 start ecosystem.config.js
```

### Step 4: Save PM2 Configuration
```cmd
pm2 save
pm2 startup
```

## PM2 Commands

- **Start server:** `pm2 start ecosystem.config.js`
- **Stop server:** `pm2 stop mlm-property-backend`
- **Restart server:** `pm2 restart mlm-property-backend`
- **View status:** `pm2 status`
- **View logs:** `pm2 logs mlm-property-backend`
- **Delete from PM2:** `pm2 delete mlm-property-backend`

## Benefits
- ✅ Server runs in background
- ✅ Auto-restarts if it crashes
- ✅ No need to keep window open
- ✅ Starts automatically on computer boot (after `pm2 startup`)

