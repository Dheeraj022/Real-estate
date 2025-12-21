# Render Deployment Guide

## Required Environment Variables

Set these in your Render dashboard (Settings → Environment):

### 1. JWT_SECRET (REQUIRED)
```
JWT_SECRET=myRealEstateAppJWT@2025
```
**Important:** Server will crash on startup if this is missing.

### 2. DATABASE_URL (REQUIRED for Build)

**CRITICAL for Neon PostgreSQL:**

Prisma migrations require a **DIRECT connection**, NOT a pooler connection.

**✅ CORRECT - Direct Connection (Use This):**
```
postgresql://neondb_owner:password@ep-late-grass-a1hskoby.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**❌ WRONG - Pooler Connection (Do NOT Use for Migrations):**
```
postgresql://neondb_owner:password@ep-late-grass-a1hskoby-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**How to Get Direct Connection String:**

1. Go to **Neon Dashboard** → Your Project
2. Click **"Connection Details"**
3. Select **"Direct connection"** tab (NOT "Connection pooling")
4. Copy the connection string
5. It should look like: `postgresql://user:pass@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/db?sslmode=require`
6. Notice: Host does NOT contain `-pooler`

**Common Mistakes:**

1. **Using psql command format (WRONG):**
   ```
   psql 'postgresql://user:pass@host/db'
   ```
   **Fix:** Remove `psql '` and trailing `'`

2. **Using pooler connection (WRONG):**
   ```
   postgresql://user:pass@ep-xxx-xxx-pooler.ap-southeast-1.aws.neon.tech/db
   ```
   **Fix:** Use direct connection (remove `-pooler` from hostname)

3. **Missing sslmode (WRONG):**
   ```
   postgresql://user:pass@host/db
   ```
   **Fix:** Add `?sslmode=require` at the end

**Steps to Fix in Render:**
1. Go to Render Dashboard → Your Service → Environment
2. Find `DATABASE_URL`
3. Ensure it's a direct connection (no `-pooler` in hostname)
4. Ensure it includes `?sslmode=require`
5. Ensure it's a pure connection string (no `psql` command)
6. Save and redeploy

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

### Error: P1001 - Can't reach database server

**Cause:** Using Neon pooler connection instead of direct connection.

**Solution:**
1. Go to Neon Dashboard → Connection Details → Direct connection
2. Copy the direct connection string (hostname should NOT contain `-pooler`)
3. Update `DATABASE_URL` in Render with the direct connection string
4. Ensure `?sslmode=require` is included

### Error: "the URL must start with the protocol `file:`"

**Solution:** Set `DATABASE_URL=file:./prisma/dev.db` in Render's environment variables (local dev only).

### Error: "DATABASE_URL uses Neon pooler connection!"

**Cause:** Prisma migrations require direct connection, not pooler.

**Solution:**
- Use direct connection string from Neon (no `-pooler` in hostname)
- Pooler connections work for runtime queries but NOT for migrations

### Error: "JWT_SECRET is not configured"

**Solution:** Set `JWT_SECRET` in Render's environment variables.

### Error: "Invalid DATABASE_URL format!"

**Causes:**
1. DATABASE_URL contains `psql` command → Remove `psql '` and trailing `'`
2. Missing `sslmode=require` → Add `?sslmode=require` to connection string
3. Using pooler connection → Use direct connection for migrations

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

