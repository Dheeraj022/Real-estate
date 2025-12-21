#!/usr/bin/env node

/**
 * Pre-build script to validate DATABASE_URL for Prisma
 * This is required because Prisma validates the schema during build
 * 
 * CRITICAL: DATABASE_URL must be a pure connection string, NOT a psql command
 */

const fs = require('fs');
const path = require('path');

// Validate DATABASE_URL format
function validateDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    // Only set default for local development (SQLite)
    if (process.env.NODE_ENV !== 'production') {
      process.env.DATABASE_URL = 'file:./prisma/dev.db';
      console.log('⚠️  DATABASE_URL not set, using default SQLite: file:./prisma/dev.db');
      return true;
    } else {
      console.error('❌ ERROR: DATABASE_URL is required in production!');
      console.error('Please set DATABASE_URL in your environment variables.');
      process.exit(1);
    }
  }
  
  // CRITICAL: Fail if DATABASE_URL starts with 'psql' (common mistake)
  if (dbUrl.trim().startsWith('psql')) {
    console.error('❌ ERROR: Invalid DATABASE_URL format!');
    console.error('');
    console.error('DATABASE_URL contains a psql command, but Prisma requires a pure connection string.');
    console.error('');
    console.error('Current (WRONG):');
    console.error(`  ${dbUrl}`);
    console.error('');
    console.error('Expected (CORRECT):');
    console.error('  postgresql://user:password@host:port/database?sslmode=require');
    console.error('');
    console.error('Fix: Remove "psql \'" from the start and "\'" from the end.');
    console.error('Keep only the connection string part.');
    process.exit(1);
  }
  
  // Validate PostgreSQL connection string format
  const trimmedUrl = dbUrl.trim();
  const isPostgreSQL = trimmedUrl.startsWith('postgresql://') || trimmedUrl.startsWith('postgres://');
  const isSQLite = trimmedUrl.startsWith('file:');
  
  if (!isPostgreSQL && !isSQLite) {
    console.error('❌ ERROR: Invalid DATABASE_URL format!');
    console.error('');
    console.error('DATABASE_URL must start with one of:');
    console.error('  - postgresql:// (for PostgreSQL)');
    console.error('  - postgres:// (for PostgreSQL)');
    console.error('  - file: (for SQLite, local dev only)');
    console.error('');
    console.error(`Current value: ${dbUrl.substring(0, 50)}...`);
    process.exit(1);
  }
  
  // Handle PostgreSQL connections
  if (isPostgreSQL) {
    console.log('🐘 Database type: PostgreSQL');
    
    try {
      const urlObj = new URL(trimmedUrl);
      const hostname = urlObj.hostname;
      
      // CRITICAL: Check for Neon pooler connection
      // Prisma migrations require direct connection, not pooler
      if (hostname.includes('-pooler')) {
        console.error('❌ ERROR: DATABASE_URL uses Neon pooler connection!');
        console.error('');
        console.error('Prisma migrations require a DIRECT connection, not a pooler.');
        console.error('');
        console.error('Current (WRONG - Pooler):');
        console.error(`  ${hostname}`);
        console.error('');
        console.error('Required (CORRECT - Direct):');
        const directHost = hostname.replace('-pooler', '');
        console.error(`  ${directHost}`);
        console.error('');
        console.error('How to fix:');
        console.error('1. Go to Neon Dashboard → Your Project → Connection Details');
        console.error('2. Select "Direct connection" (NOT "Connection pooling")');
        console.error('3. Copy the connection string');
        console.error('4. Update DATABASE_URL in Render with the direct connection string');
        console.error('');
        console.error('Note: Direct connection format:');
        console.error('  postgresql://user:pass@ep-xxx-xxx.ap-southeast-1.aws.neon.tech/db?sslmode=require');
        console.error('');
        console.error('Pooler format (DO NOT USE for migrations):');
        console.error('  postgresql://user:pass@ep-xxx-xxx-pooler.ap-southeast-1.aws.neon.tech/db?sslmode=require');
        process.exit(1);
      }
      
      // Ensure sslmode=require is present for Neon
      const searchParams = urlObj.searchParams;
      if (!searchParams.has('sslmode')) {
        console.warn('⚠️  Warning: sslmode not specified. Adding sslmode=require for Neon compatibility.');
        searchParams.set('sslmode', 'require');
        // Update process.env with corrected URL
        process.env.DATABASE_URL = urlObj.toString();
      } else if (searchParams.get('sslmode') !== 'require') {
        console.warn('⚠️  Warning: sslmode is not "require". Neon requires sslmode=require.');
        searchParams.set('sslmode', 'require');
        process.env.DATABASE_URL = urlObj.toString();
      }
      
      // Log connection details (without credentials)
      console.log(`   Host: ${hostname}:${urlObj.port || 5432}`);
      console.log(`   Database: ${urlObj.pathname.replace('/', '')}`);
      console.log(`   SSL Mode: ${searchParams.get('sslmode') || 'not set'}`);
      console.log('✅ Using direct connection (required for Prisma migrations)');
      
    } catch (e) {
      console.warn('⚠️  Could not parse DATABASE_URL, but format appears correct');
    }
  } else if (isSQLite) {
    console.log('📦 Database type: SQLite');
    // Ensure the prisma directory exists for SQLite
    const prismaDir = path.join(process.cwd(), 'prisma');
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
      console.log(`   Created directory: ${prismaDir}`);
    }
  }
  
  console.log('✅ DATABASE_URL format is valid');
  return true;
}

// Run validation
try {
  validateDatabaseUrl();
} catch (error) {
  console.error('❌ Fatal error during DATABASE_URL validation:', error.message);
  process.exit(1);
}

