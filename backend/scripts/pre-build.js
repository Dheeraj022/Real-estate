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
  
  // Log database type
  if (isPostgreSQL) {
    console.log('🐘 Database type: PostgreSQL');
    // Extract and log host (without credentials)
    try {
      const urlObj = new URL(trimmedUrl);
      console.log(`   Host: ${urlObj.hostname}:${urlObj.port || 5432}`);
      console.log(`   Database: ${urlObj.pathname.replace('/', '')}`);
    } catch (e) {
      // URL parsing failed, but format is correct, continue
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

