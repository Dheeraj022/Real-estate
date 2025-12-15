# Database Setup Guide

## The Error
```
Can't reach database server at `localhost:5432`
```

This means PostgreSQL is either:
- Not installed
- Not running
- Using a different port
- Using different credentials

## Solution Options

### Option 1: Install and Start PostgreSQL (Recommended)

#### Windows:
1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the installer
   - Run the installer
   - Remember the password you set for the `postgres` user

2. **Start PostgreSQL Service:**
   - Press `Win + R`, type `services.msc`, press Enter
   - Find "postgresql-x64-XX" service
   - Right-click → Start (if not running)

3. **Update .env file:**
   Open `backend/.env` and update:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/mlm_property_db?schema=public"
   ```
   Replace `YOUR_PASSWORD` with the password you set during installation.

4. **Create the database:**
   - Open "pgAdmin" (comes with PostgreSQL)
   - Or use Command Prompt:
     ```cmd
     psql -U postgres
     ```
   - Then run:
     ```sql
     CREATE DATABASE mlm_property_db;
     \q
     ```

5. **Run migrations:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   npm run prisma:migrate
   ```

### Option 2: Use SQLite (Easier, No Installation Needed)

If you don't want to install PostgreSQL, we can switch to SQLite which doesn't require a separate server.

1. **Update Prisma Schema:**
   Change `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. **Update .env:**
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Install SQLite support:**
   ```cmd
   cd backend
   npm install --save-dev prisma
   ```

4. **Run migrations:**
   ```cmd
   npm run prisma:generate
   npm run prisma:migrate
   ```

### Option 3: Use Online Database (Supabase/Neon)

1. **Create free account at:**
   - Supabase: https://supabase.com
   - Neon: https://neon.tech

2. **Get connection string** from your dashboard

3. **Update .env:**
   ```env
   DATABASE_URL="your_connection_string_here"
   ```

4. **Run migrations:**
   ```cmd
   cd backend
   npm run prisma:migrate
   ```

## Quick Check: Is PostgreSQL Running?

### Windows:
```cmd
# Check if PostgreSQL service is running
sc query postgresql-x64-14
```

### Or check in Services:
1. Press `Win + R`
2. Type `services.msc`
3. Look for "postgresql" service
4. Check if status is "Running"

## Test Database Connection

Once PostgreSQL is running, test the connection:

```cmd
psql -U postgres -h localhost -p 5432
```

If it asks for password and connects, PostgreSQL is working!

## After Database is Set Up

1. **Run migrations:**
   ```cmd
   cd "d:\OneDrive\Desktop\REAL ESTATE\backend"
   npm run prisma:migrate
   ```

2. **Restart backend server:**
   - Stop the current server (Ctrl+C)
   - Start again: `npm run dev`

3. **Try registration again!**



