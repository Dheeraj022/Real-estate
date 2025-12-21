const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET environment variable is required!');
  console.error('Please set JWT_SECRET in your environment variables.');
  process.exit(1);
}

// Set default DATABASE_URL for SQLite if not provided (local development)
// Note: In production (Render), DATABASE_URL should be set to PostgreSQL connection string
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
  console.warn('⚠️  DATABASE_URL not set, using default SQLite: file:./prisma/dev.db');
}

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

// Database connection test and logging
async function initializeDatabase() {
  try {
    await prisma.$connect();
    const dbUrl = process.env.DATABASE_URL || '';
    let dbProvider = 'Unknown';
    
    if (dbUrl.includes('file:')) {
      dbProvider = 'SQLite';
    } else if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
      dbProvider = 'PostgreSQL';
    } else if (dbUrl.startsWith('psql')) {
      dbProvider = 'PostgreSQL (Neon)';
    }
    
    console.log(`✅ Database connected (${dbProvider})`);
    console.log(`✅ JWT_SECRET configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
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

