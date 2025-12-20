# Render Deployment Guide

## Issue: "Publish directory build does not exist!"

This error occurs because Render is configured to look for a `build` directory, but Next.js outputs to `.next` by default.

## Solution Options

### Option 1: Configure Render Dashboard (Recommended)

1. Go to your Render dashboard
2. Select your frontend service
3. Go to **Settings** → **Build & Deploy**
4. Change **Publish Directory** from `build` to `.next`
5. Save and redeploy

### Option 2: Use Custom Build Script (Current Implementation)

The project now includes a post-build script that copies `.next` to `build` directory. This happens automatically after `npm run build`.

**Note:** If you still see permission errors, use Option 1 instead.

### Option 3: Use render.yaml Configuration

If you're using `render.yaml` for infrastructure as code:

```yaml
services:
  - type: web
    name: mlm-property-frontend
    env: node
    buildCommand: cd frontend && npm install && npm run build
    startCommand: cd frontend && npm start
    # Publish directory: .next (not build)
```

## Build Commands for Render

- **Build Command:** `cd frontend && npm install && npm run build`
- **Start Command:** `cd frontend && npm start`
- **Publish Directory:** `.next` (or `build` if using the post-build script)

## Environment Variables

Make sure to set these in Render dashboard:
- `NEXT_PUBLIC_API_URL` - Your backend API URL

## Troubleshooting

1. **Build fails with "build directory not found"**
   - Change Render's publish directory to `.next` in dashboard settings

2. **Permission errors during build**
   - This is often due to OneDrive syncing. Use Option 1 (change publish directory to `.next`)

3. **Build succeeds but deployment fails**
   - Check that `NEXT_PUBLIC_API_URL` is set correctly
   - Verify the start command is `cd frontend && npm start`




