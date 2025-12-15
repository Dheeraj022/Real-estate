const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, isAgent } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All agent routes require authentication and agent role
router.use(authenticate);
router.use(isAgent);

/**
 * @route   GET /api/agent/dashboard
 * @desc    Get agent dashboard data
 * @access  Private (Agent only)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalSales,
      pendingSales,
      approvedSales,
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      wallet
    ] = await Promise.all([
      prisma.sale.count({ where: { sellerId: userId } }),
      prisma.sale.count({ where: { sellerId: userId, status: 'pending' } }),
      prisma.sale.count({ where: { sellerId: userId, status: 'approved' } }),
      prisma.commission.aggregate({
        where: { userId },
        _sum: { amount: true }
      }),
      prisma.commission.count({ where: { userId, status: 'pending' } }),
      prisma.commission.count({ where: { userId, status: 'approved' } }),
      prisma.wallet.findUnique({ where: { userId } })
    ]);

    res.json({
      success: true,
      data: {
        sales: {
          total: totalSales,
          pending: pendingSales,
          approved: approvedSales
        },
        commissions: {
          total: totalCommissions._sum.amount || 0,
          pending: pendingCommissions,
          approved: approvedCommissions
        },
        wallet: wallet || {
          balance: 0,
          pendingBalance: 0,
          approvedBalance: 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/agent/sales
 * @desc    Submit a new property sale
 * @access  Private (Agent only)
 */
router.post('/sales', [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('buyerName').trim().notEmpty().withMessage('Buyer name is required'),
  body('buyerContact').trim().notEmpty().withMessage('Buyer contact is required'),
  body('saleAmount').isFloat({ min: 0 }).withMessage('Sale amount must be a positive number')
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

    const { propertyId, buyerName, buyerContact, saleAmount } = req.body;
    const sellerId = req.user.id;

    // Verify property exists and is active
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Property is not active for sale'
      });
    }

    // Create sale
    const sale = await prisma.sale.create({
      data: {
        propertyId,
        sellerId,
        buyerName,
        buyerContact,
        saleAmount: parseFloat(saleAmount),
        status: 'pending',
        isViewedByAdmin: false
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Sale submitted successfully. Waiting for admin approval.',
      data: { sale }
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit sale',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/agent/sales
 * @desc    Get agent's sales
 * @access  Private (Agent only)
 */
router.get('/sales', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { sellerId: req.user.id };
    if (status) {
      where.status = status;
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          property: {
            select: {
              id: true,
              name: true,
              location: true,
              price: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/agent/commissions
 * @desc    Get agent's commissions
 * @access  Private (Agent only)
 */
router.get('/commissions', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          sale: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  location: true
                }
              },
              seller: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.commission.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        commissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commissions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/agent/wallet
 * @desc    Get agent's wallet
 * @access  Private (Agent only)
 */
router.get('/wallet', async (req, res) => {
  try {
    let wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.id }
    });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: req.user.id,
          balance: 0,
          pendingBalance: 0,
          approvedBalance: 0
        }
      });
    }

    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/agent/bank-details
 * @desc    Get agent's bank details
 * @access  Private (Agent only)
 */
router.get('/bank-details', async (req, res) => {
  try {
    const userId = req.user.id;

    const bankDetails = await prisma.bankDetails.findUnique({
      where: { userId }
    });

    res.json({
      success: true,
      data: { bankDetails }
    });
  } catch (error) {
    console.error('Get bank details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank details',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/agent/bank-details
 * @desc    Create or update agent's bank details
 * @access  Private (Agent only)
 */
router.post('/bank-details', [
  body('bankName').trim().notEmpty().withMessage('Bank name is required'),
  body('accountHolderName').trim().notEmpty().withMessage('Account holder name is required'),
  body('accountNumber').trim().notEmpty().withMessage('Account number is required'),
  body('accountNumber').matches(/^\d+$/).withMessage('Account number must contain only digits'),
  body('ifscCode').trim().notEmpty().withMessage('IFSC code is required'),
  body('ifscCode').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('IFSC code must be in format: AAAA0XXXXX'),
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

    const userId = req.user.id;
    const { bankName, accountHolderName, accountNumber, ifscCode, email } = req.body;

    // Use upsert to create or update bank details
    const bankDetails = await prisma.bankDetails.upsert({
      where: { userId },
      update: {
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        email
      },
      create: {
        userId,
        bankName,
        accountHolderName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        email
      }
    });

    res.status(201).json({
      success: true,
      message: 'Bank details saved successfully',
      data: { bankDetails }
    });
  } catch (error) {
    console.error('Save bank details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save bank details',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/agent/withdrawals
 * @desc    Request withdrawal
 * @access  Private (Agent only)
 */
router.post('/withdrawals', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
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

    const { amount } = req.body;
    const userId = req.user.id;

    // Check if bank details exist
    const bankDetails = await prisma.bankDetails.findUnique({
      where: { userId }
    });

    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        message: 'Bank details are required. Please add your bank details first.'
      });
    }

    // Get wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          pendingBalance: 0,
          approvedBalance: 0
        }
      });
    }

    // Check balance
    if (wallet.balance < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        bankDetailsId: bankDetails.id,
        amount: parseFloat(amount),
        status: 'pending',
        isViewedByAdmin: false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted. Waiting for admin approval.',
      data: { withdrawal }
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit withdrawal request',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/agent/withdrawals
 * @desc    Get agent's withdrawal requests
 * @access  Private (Agent only)
 */
router.get('/withdrawals', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          bankDetails: {
            select: {
              bankName: true,
              accountHolderName: true,
              accountNumber: true,
              ifscCode: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.withdrawal.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawals',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/agent/downline
 * @desc    Get agent's downline (display limited to 3 levels for agents)
 * @access  Private (Agent only)
 * 
 * NOTE: Database stores unlimited depth, but agents can only see 3 levels.
 * This is for display purposes only - the full hierarchy exists in the database.
 */
router.get('/downline', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user's upline information
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        uplineId: true,
        upline: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
            level: true,
            createdAt: true
          }
        }
      }
    });

    // Get direct downlines (Level 1) - unlimited width allowed
    const level1Downlines = await prisma.user.findMany({
      where: { uplineId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        level: true,
        createdAt: true,
        uplineId: true
      }
    });

    // Get Level 2 downlines (downlines of downlines) - unlimited width
    const level1Ids = level1Downlines.map(d => d.id);
    const level2Downlines = level1Ids.length > 0 ? await prisma.user.findMany({
      where: { uplineId: { in: level1Ids } },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        level: true,
        createdAt: true,
        uplineId: true
      }
    }) : [];

    // Get Level 3 downlines - unlimited width, but display stops here for agents
    const level2Ids = level2Downlines.map(d => d.id);
    const level3Downlines = level2Ids.length > 0 ? await prisma.user.findMany({
      where: { uplineId: { in: level2Ids } },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        level: true,
        createdAt: true,
        uplineId: true
      }
    }) : [];

    // Build tree structure recursively (limited to 3 levels for display)
    // Note: Full hierarchy exists in database, but we only show 3 levels to agents
    const buildDownlineTree = (downlines, parentId, currentLevel = 1, maxLevel = 3) => {
      // Stop recursion at max level (3 for agents)
      if (currentLevel > maxLevel) {
        return [];
      }

      const children = downlines.filter(d => d.uplineId === parentId);
      return children.map(downline => ({
        ...downline,
        // Recursively build children, but stop at level 3
        downlines: buildDownlineTree(downlines, downline.id, currentLevel + 1, maxLevel)
      }));
    };

    // Combine all downlines up to level 3 for display
    // Note: Database may have deeper levels, but agents only see 3
    const allDownlines = [
      ...level1Downlines,
      ...level2Downlines,
      ...level3Downlines
    ];
    
    // Build tree starting from current user (limited to 3 levels display)
    const downlineTree = buildDownlineTree(allDownlines, userId, 1, 3);

    // Debug logging (remove in production)
    console.log('Downline query results:', {
      userId,
      uplineId: currentUser?.uplineId,
      hasUpline: !!currentUser?.upline,
      level1Count: level1Downlines.length,
      level2Count: level2Downlines.length,
      level3Count: level3Downlines.length,
      treeLength: downlineTree.length,
      level1Sample: level1Downlines[0],
      allDownlinesCount: allDownlines.length,
      note: 'Display limited to 3 levels for agents. Full hierarchy exists in database.'
    });

    res.json({
      success: true,
      data: {
        upline: currentUser?.upline || null,
        downline: downlineTree,
        stats: {
          level1: level1Downlines.length,
          level2: level2Downlines.length,
          level3: level3Downlines.length,
          total: allDownlines.length
        }
      }
    });
  } catch (error) {
    console.error('Get downline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch downline',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/agent/referral-info
 * @desc    Get agent's referral information
 * @access  Private (Agent only)
 */
router.get('/referral-info', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        referralCode: true,
        upline: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true
          }
        }
      }
    });

    const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        upline: user.upline
      }
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral information',
      error: error.message
    });
  }
});

module.exports = router;

