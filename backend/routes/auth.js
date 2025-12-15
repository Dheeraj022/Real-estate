const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const { generateReferralCode } = require('../utils/referralCode');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new agent
 * @access  Public
 */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('referralCode').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, referralCode } = req.body;
    
    // Normalize referralCode - convert empty string to null
    const normalizedReferralCode = referralCode && referralCode.trim() !== '' ? referralCode.trim() : null;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code for the new user
    const userReferralCode = await generateReferralCode();

    let uplineId = null;
    let level = 0;

    // If referral code provided, find upline
    if (normalizedReferralCode) {
      const upline = await prisma.user.findUnique({
        where: { referralCode: normalizedReferralCode }
      });

      if (upline) {
        uplineId = upline.id;
        // Calculate level by traversing up the upline chain
        // This allows unlimited depth in the referral tree
        level = upline.level + 1;
        // Note: Commission is limited to 3 levels, but referral depth is unlimited
      } else {
        // Referral code provided but not found
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code. Please check and try again.'
        });
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'agent',
        referralCode: userReferralCode,
        uplineId,
        level
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
        level: true,
        createdAt: true
      }
    });

    // Create wallet for agent
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        pendingBalance: 0,
        approvedBalance: 0
      }
    });
    
    console.log('User registered successfully:', { userId: user.id, email: user.email });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email.'
      });
    }
    
    // Handle database connection errors
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please contact administrator.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.stack })
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (admin or agent)
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode,
      level: user.level
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
        level: true,
        uplineId: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

module.exports = router;

