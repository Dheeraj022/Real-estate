const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET environment variable is required!');
  console.error('Please set JWT_SECRET in your environment variables.');
  process.exit(1);
}

// Validate DATABASE_URL format
function validateDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    // Only set default for local development (SQLite)
    if (process.env.NODE_ENV !== 'production') {
      process.env.DATABASE_URL = 'file:./prisma/dev.db';
      console.warn('⚠️  DATABASE_URL not set, using default SQLite: file:./prisma/dev.db');
      return;
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
    console.error(`  ${dbUrl.substring(0, 100)}...`);
    console.error('');
    console.error('Expected (CORRECT):');
    console.error('  postgresql://user:password@host:port/database?sslmode=require');
    console.error('');
    console.error('Fix: Remove "psql \'" from the start and "\'" from the end.');
    process.exit(1);
  }
  
  // Validate format
  const trimmedUrl = dbUrl.trim();
  const isPostgreSQL = trimmedUrl.startsWith('postgresql://') || trimmedUrl.startsWith('postgres://');
  const isSQLite = trimmedUrl.startsWith('file:');
  
  if (!isPostgreSQL && !isSQLite) {
    console.error('❌ ERROR: Invalid DATABASE_URL format!');
    console.error('DATABASE_URL must start with: postgresql://, postgres://, or file:');
    process.exit(1);
  }
  
  // Check for Neon pooler connection (migrations require direct connection)
  if (isPostgreSQL) {
    try {
      const urlObj = new URL(trimmedUrl);
      if (urlObj.hostname.includes('-pooler')) {
        console.error('❌ ERROR: DATABASE_URL uses Neon pooler connection!');
        console.error('Prisma migrations require a DIRECT connection, not a pooler.');
        console.error('Please use the direct connection string from Neon dashboard.');
        process.exit(1);
      }
      
      // Ensure sslmode=require for Neon
      const searchParams = urlObj.searchParams;
      if (!searchParams.has('sslmode')) {
        searchParams.set('sslmode', 'require');
        process.env.DATABASE_URL = urlObj.toString();
        console.warn('⚠️  Added sslmode=require to DATABASE_URL');
      }
    } catch (e) {
      // URL parsing failed, but format is correct, continue
    }
  }
}

// Validate DATABASE_URL before initializing Prisma
validateDatabaseUrl();

const app = express();
const prisma = new PrismaClient();

// Middleware
// CORS configuration - explicitly allow frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://real-estate-frontend-13q0.onrender.com'
];

// CORS middleware - must be before all routes
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log the attempted origin for debugging
      console.warn(`CORS: Blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/properties', require('./routes/properties'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MLM Property API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    console.warn(`CORS Error: ${err.message}`);
    return res.status(403).json({
      success: false,
      message: err.message || 'CORS policy violation'
    });
  }
  
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - log the requested path for debugging
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

/**
 * Ensure SUPER_ADMIN user exists
 * Creates permanent SUPER_ADMIN user if it doesn't exist
 */
async function ensureSuperAdmin() {
  const SUPER_ADMIN_EMAIL = 'dheerajadmin@gmail.com';
  const SUPER_ADMIN_NAME = 'Super Admin';
  const DEFAULT_PASSWORD = 'SuperAdmin@2025'; // Change this password after first login!
  
  try {
    // Check if SUPER_ADMIN already exists
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL }
    });
    
    if (existingSuperAdmin) {
      // Ensure existing user has correct role and isSystemUser flag
      if (existingSuperAdmin.role !== 'SUPER_ADMIN' || !existingSuperAdmin.isSystemUser) {
        await prisma.user.update({
          where: { email: SUPER_ADMIN_EMAIL },
          data: {
            role: 'SUPER_ADMIN',
            isSystemUser: true
          }
        });
        console.log(`✅ SUPER_ADMIN user updated: ${SUPER_ADMIN_EMAIL}`);
      } else {
        console.log(`✅ SUPER_ADMIN user already exists: ${SUPER_ADMIN_EMAIL}`);
      }
      return;
    }
    
    // Check if any other SUPER_ADMIN exists (should only be one)
    const otherSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (otherSuperAdmin) {
      console.warn(`⚠️  Another SUPER_ADMIN exists (${otherSuperAdmin.email}). Only one SUPER_ADMIN should exist.`);
      // Update the existing one to ensure it's marked as system user
      await prisma.user.update({
        where: { id: otherSuperAdmin.id },
        data: { isSystemUser: true }
      });
      return;
    }
    
    // Generate unique referral code
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const referralCode = `SUPER${Date.now().toString().slice(-6)}`;
    
    // Create SUPER_ADMIN user
    await prisma.user.create({
      data: {
        name: SUPER_ADMIN_NAME,
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isSystemUser: true,
        referralCode: referralCode,
        emailVerified: true,
        level: 0
      }
    });
    
    console.log(`✅ SUPER_ADMIN user created: ${SUPER_ADMIN_EMAIL}`);
    console.log(`   Default password: ${DEFAULT_PASSWORD}`);
    console.log(`   ⚠️  IMPORTANT: Change this password after first login!`);
  } catch (error) {
    console.error('❌ Failed to ensure SUPER_ADMIN user:', error.message);
    // Don't exit - allow server to start even if SUPER_ADMIN creation fails
    // This prevents deployment issues if there's a temporary database problem
  }
}

// Database connection test and logging
async function initializeDatabase() {
  try {
    await prisma.$connect();
    const dbUrl = process.env.DATABASE_URL || '';
    let dbProvider = 'Unknown';
    let dbDetails = '';
    
    if (dbUrl.includes('file:')) {
      dbProvider = 'SQLite';
      dbDetails = dbUrl.replace('file:', '');
    } else if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
      dbProvider = 'PostgreSQL';
      try {
        const urlObj = new URL(dbUrl);
        dbDetails = `${urlObj.hostname}:${urlObj.port || 5432}/${urlObj.pathname.replace('/', '')}`;
      } catch (e) {
        dbDetails = 'connection established';
      }
    }
    
    console.log(`✅ Database connected`);
    console.log(`   Type: ${dbProvider}`);
    if (dbDetails) {
      console.log(`   ${dbDetails}`);
    }
    console.log(`✅ JWT_SECRET configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
    
    // Ensure SUPER_ADMIN user exists
    await ensureSuperAdmin();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify DATABASE_URL is correct');
    console.error('2. Check database server is accessible');
    console.error('3. Verify credentials are correct');
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

// Initialize database before starting server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = app;

