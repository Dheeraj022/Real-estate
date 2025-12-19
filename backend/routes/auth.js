const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const { generateReferralCode } = require('../utils/referralCode');
const { sendMail } = require('../utils/mailer');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/auth/register
 * @desc    Start registration for a new agent (send OTP)
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

    let uplineId = null;
    let level = 0;

    // If referral code provided, find upline and compute level
    if (normalizedReferralCode) {
      const upline = await prisma.user.findUnique({
        where: { referralCode: normalizedReferralCode }
      });

      if (upline) {
        uplineId = upline.id;
        // Calculate level by traversing up the upline chain
        // This allows unlimited depth in the referral tree
        level = upline.level + 1;
      } else {
        // Referral code provided but not found
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code. Please check and try again.'
        });
      }
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert pending email verification record
    await prisma.emailVerification.upsert({
      where: { email },
      update: {
        name,
        password: hashedPassword,
        referralCodeInput: normalizedReferralCode,
        uplineId,
        level,
        otp,
        otpExpiresAt,
        createdAt: new Date()
      },
      create: {
        name,
        email,
        password: hashedPassword,
        referralCodeInput: normalizedReferralCode,
        uplineId,
        level,
        otp,
        otpExpiresAt
      }
    });

    // Send OTP email
    const subject = 'Your MLM Property System verification code';
    const text = `Dear ${name},

Your verification code for MLM Property System is: ${otp}

This code is valid for 10 minutes. If you did not request this, please ignore this email.

Thank you,
MLM Property System`;

    await sendMail({
      to: email,
      subject,
      text
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email'
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
  body('password').notEmpty().withMessage('Password is required'),
  body('loginType').optional().isIn(['admin', 'agent']).withMessage('Invalid login type')
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

    const { email, password, loginType } = req.body;

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

    // Enforce role-based login based on loginType (if provided)
    if (loginType === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized admin access.'
      });
    }

    if (loginType === 'agent' && user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Please use Admin Login.'
      });
    }

    // Generate token (include role so frontend can route correctly)
    const token = generateToken(user.id, user.role, user.email);

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
 * @route   POST /api/auth/forgot-password
 * @desc    Start forgot password flow - send OTP to user's email
 * @access  Public
 */
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
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

    const { email } = req.body;

    // 1) Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // 2) Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP for this email (upsert so latest OTP wins)
    await prisma.passwordReset.upsert({
      where: { email },
      update: {
        otp,
        otpExpiresAt,
        createdAt: new Date()
      },
      create: {
        email,
        otp,
        otpExpiresAt
      }
    });

    // 3) Attempt to send OTP email
    try {
      const subject = 'Your MLM Property System password reset code';
      const text = `Dear ${user.name},

Your password reset code for MLM Property System is: ${otp}

This code is valid for 10 minutes. If you did not request this, please ignore this email.

Thank you,
MLM Property System`;

      await sendMail({
        to: email,
        subject,
        text
      });
    } catch (mailError) {
      console.error('Forgot password mail error:', mailError);
      // Email send failed - report clean error to client
      return res.status(200).json({
        success: false,
        error: 'OTP_SEND_FAILED',
        message: 'Failed to send OTP. Please try again.'
      });
    }

    // 4) Success only when email was actually sent
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Try again later.'
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password/verify-otp
 * @desc    Verify forgot-password OTP
 * @access  Public
 */
router.post('/forgot-password/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { email, otp } = req.body;

    const record = await prisma.passwordReset.findUnique({
      where: { email }
    });

    if (!record || record.otp !== otp || record.otpExpiresAt < new Date()) {
      return res.status(200).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified',
      canResetPassword: true
    });
  } catch (error) {
    console.error('Forgot password verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Try again later.'
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password/reset
 * @desc    Reset password after OTP verification
 * @access  Public
 */
router.post('/forgot-password/reset', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { email, otp, password } = req.body;

    const record = await prisma.passwordReset.findUnique({
      where: { email }
    });

    if (!record || record.otp !== otp || record.otpExpiresAt < new Date()) {
      return res.status(200).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: 'User not found'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // OTP can be used only once - delete password reset record
    await prisma.passwordReset.delete({
      where: { email }
    });

    const token = generateToken(user.id, user.role, user.email);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Forgot password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Try again later.'
    });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify email OTP and create agent account
 * @access  Public
 */
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { email, otp } = req.body;

    const record = await prisma.emailVerification.findUnique({
      where: { email }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please register again.'
      });
    }

    // Check expiry
    if (record.otpExpiresAt < new Date()) {
      await prisma.emailVerification.delete({ where: { email } });
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please register again.'
      });
    }

    // Check OTP
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Please enter correct OTP'
      });
    }

    // Ensure user still does not exist
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Cleanup pending record
      await prisma.emailVerification.delete({ where: { email } });
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate unique referral code for the new user
    const userReferralCode = await generateReferralCode();

    // Create user with stored data
    const user = await prisma.user.create({
      data: {
        name: record.name,
        email: record.email,
        password: record.password,
        role: 'agent',
        referralCode: userReferralCode,
        uplineId: record.uplineId,
        level: record.level,
        emailVerified: true
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

    // OTP can only be used once - delete the record
    await prisma.emailVerification.delete({
      where: { email }
    });

    // Generate auth token immediately so agent is auto-logged in
    const token = generateToken(user.id, user.role, user.email);

    res.json({
      success: true,
      token,
      agent: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
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

