# Running Server in Background (No Window Needed)

## Quick Start - Run in Background

### Option 1: Use the Batch File (Easiest)
1. **Double-click:** `start-background.bat` in the backend folder
2. **First time:** It will install PM2 (may need admin rights)
3. **Server starts in background** - you can close the window!

### Option 2: Manual PM2 Setup

1. **Install PM2:**
   ```cmd
   npm install -g pm2
   ```

2. **Start server:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   pm2 start ecosystem.config.js
   ```

3. **Save configuration:**
   ```cmd
   pm2 save
   ```

## Managing the Server

### View Server Status
```cmd
pm2 status
```

### View Logs
```cmd
pm2 logs mlm-property-backend
```

### Stop Server
```cmd
pm2 stop mlm-property-backend
```
Or double-click: `stop-server.bat`

### Restart Server
```cmd
pm2 restart mlm-property-backend
```

### Start on Computer Boot
```cmd
pm2 startup
pm2 save
```

## Benefits

✅ **No window needed** - Server runs in background  
✅ **Auto-restart** - If server crashes, PM2 restarts it  
✅ **Start on boot** - Server can start automatically when computer starts  
✅ **Easy management** - Simple commands to start/stop/restart  

## Verify Server is Running

1. Open browser
2. Go to: `http://localhost:5000/api/health`
3. Should see: `{"status":"ok","message":"MLM Property API is running"}`

## Troubleshooting

### "pm2 is not recognized"
- Run: `npm install -g pm2`
- May need to run Command Prompt as Administrator

### Server not starting
- Check logs: `pm2 logs mlm-property-backend`
- Check status: `pm2 status`

### Port already in use
- Stop existing server: `pm2 stop mlm-property-backend`
- Or change port in `.env` file

