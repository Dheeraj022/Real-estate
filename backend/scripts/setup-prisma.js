#!/usr/bin/env node

/**
 * Setup script that ensures DATABASE_URL is set before running Prisma commands
 * This script sets DATABASE_URL and then executes the provided command
 */

const { spawn } = require('child_process');
const path = require('path');

// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
  console.log('⚠️  DATABASE_URL not set, using default: file:./prisma/dev.db');
} else {
  console.log(`✅ DATABASE_URL is set: ${process.env.DATABASE_URL}`);
}

// Get the command to run (everything after the script name)
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: No command provided');
  console.log('Usage: node scripts/setup-prisma.js <command> [args...]');
  console.log('Example: node scripts/setup-prisma.js prisma generate');
  process.exit(1);
}

// Execute the command with DATABASE_URL set
const command = args[0];
const commandArgs = args.slice(1);

console.log(`🚀 Running: ${command} ${commandArgs.join(' ')}`);

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL
  }
});

child.on('error', (error) => {
  console.error(`❌ Error executing command: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});


