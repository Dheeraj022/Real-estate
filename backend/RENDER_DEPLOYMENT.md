# Render Deployment Guide

## Required Environment Variables

Set these in your Render dashboard (Settings → Environment):

### 1. JWT_SECRET (REQUIRED)
```
JWT_SECRET=myRealEstateAppJWT@2025
```
**Important:** Server will crash on startup if this is missing.

### 2. DATABASE_URL (REQUIRED for Build)
```
DATABASE_URL=file:./prisma/dev.db
```
**Important:** This must be set for Prisma to validate the schema during build.

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

