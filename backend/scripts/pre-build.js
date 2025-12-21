#!/usr/bin/env node

/**
 * Pre-build script to ensure DATABASE_URL is set for Prisma
 * This is required because Prisma validates the schema during build
 */

const fs = require('fs');
const path = require('path');

// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
  console.log('⚠️  DATABASE_URL not set, using default: file:./prisma/dev.db');
} else {
  console.log(`✅ DATABASE_URL is set: ${process.env.DATABASE_URL}`);
}

// Ensure DATABASE_URL starts with file: for SQLite
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
  console.warn('⚠️  DATABASE_URL does not start with "file:", this may cause issues with SQLite');
}

// Ensure the prisma directory exists
const prismaDir = path.join(process.cwd(), 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
  console.log(`✅ Created prisma directory: ${prismaDir}`);
}

// Set environment variable for child processes
process.env.DATABASE_URL = process.env.DATABASE_URL;

