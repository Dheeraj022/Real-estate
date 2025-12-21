# Render Deployment Guide

## Required Environment Variables

Set these in your Render dashboard (Settings → Environment):

### 1. JWT_SECRET (REQUIRED)
```
JWT_SECRET=myRealEstateAppJWT@2025
```
**Important:** Server will crash on startup if this is missing.

### 2. DATABASE_URL (REQUIRED for Build)

**For PostgreSQL (Production - Neon/Render/etc):**
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**IMPORTANT - Fix Your Current DATABASE_URL:**

Your current DATABASE_URL looks like this (WRONG):
```
psql 'postgresql://neondb_owner:password@host/database?sslmode=require'
```

It should be this (CORRECT):
```
postgresql://neondb_owner:password@host/database?sslmode=require
```

**Steps to Fix:**
1. Go to Render Dashboard → Your Service → Environment
2. Find `DATABASE_URL`
3. Remove the `psql '` at the start and `'` at the end
4. Keep only the connection string: `postgresql://...`
5. Save and redeploy

**For SQLite (Local Development):**
```
DATABASE_URL=file:./prisma/dev.db
```

### 3. PORT (Optional)
```
PORT=5000
```
Defaults to 5000 if not set.

---

## Build Command

Update your Render build command to:

```bash
npm install && DATABASE_URL=file:./prisma/dev.db npx prisma generate && DATABASE_URL=file:./prisma/dev.db npx prisma migrate deploy
```

**OR** if DATABASE_URL is already set in environment variables:

```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

---

## Start Command

```bash
npm start
```

---

## Troubleshooting

### Error: "the URL must start with the protocol `file:`"

**Solution:** Set `DATABASE_URL=file:./prisma/dev.db` in Render's environment variables.

### Error: "JWT_SECRET is not configured"

**Solution:** Set `JWT_SECRET` in Render's environment variables.

### CORS Errors

The backend is configured to allow:
- `http://localhost:3000` (local development)
- `https://real-estate-frontend-13q0.onrender.com` (production)

If you change your frontend URL, update `allowedOrigins` in `server.js`.

---

## Database Notes

- SQLite database file will be created at: `./prisma/dev.db`
- On Render, the database persists in the service's filesystem
- For production, consider using Render's PostgreSQL service for better reliability

