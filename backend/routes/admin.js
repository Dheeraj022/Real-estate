const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, isAdmin } = require('../middleware/auth');
const { calculateCommissions, approveCommission, rejectCommission } = require('../utils/commission');

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalAgents,
      totalProperties,
      totalSales,
      pendingSales,
      totalCommissions,
      pendingCommissions,
      totalWithdrawals,
      pendingWithdrawals
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'agent' } }),
      prisma.property.count(),
      prisma.sale.count(),
      prisma.sale.count({ where: { status: 'pending' } }),
      prisma.commission.aggregate({
        _sum: { amount: true }
      }),
      prisma.commission.count({ where: { status: 'pending' } }),
      prisma.withdrawal.count(),
      prisma.withdrawal.count({ where: { status: 'pending' } })
    ]);

    res.json({
      success: true,
      data: {
        totalAgents,
        totalProperties,
        totalSales,
        pendingSales,
        totalCommissions: totalCommissions._sum.amount || 0,
        pendingCommissions,
        totalWithdrawals,
        pendingWithdrawals
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

// ==================== PROPERTY MANAGEMENT ====================

/**
 * @route   POST /api/admin/properties
 * @desc    Create a new property
 * @access  Private (Admin only)
 */
router.post('/properties', [
  body('name').trim().notEmpty().withMessage('Property name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('totalCommissionPercent').isFloat({ min: 0, max: 100 }).withMessage('Total commission percent must be between 0 and 100'),
  body('sellerPercent').isFloat({ min: 0, max: 100 }).withMessage('Seller percent must be between 0 and 100'),
  body('level1Percent').isFloat({ min: 0, max: 100 }).withMessage('Level 1 percent must be between 0 and 100'),
  body('level2Percent').isFloat({ min: 0, max: 100 }).withMessage('Level 2 percent must be between 0 and 100'),
  body('level3Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 3 percent must be between 0 and 100'),
  body('level4Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 4 percent must be between 0 and 100'),
  body('level5Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 5 percent must be between 0 and 100'),
  body('level6Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 6 percent must be between 0 and 100'),
  body('images').optional().isArray().withMessage('Images must be an array')
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

    const {
      name,
      location,
      price,
      description,
      totalCommissionPercent,
      sellerPercent,
      level1Percent,
      level2Percent,
      level3Percent = 0,
      level4Percent = 0,
      level5Percent = 0,
      level6Percent = 0,
      images = []
    } = req.body;
    
    // Convert images array to JSON string for SQLite
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : (images || '[]');

    // Validate commission percentages sum against total commission
    const breakupSum =
      (parseFloat(sellerPercent) || 0) +
      (parseFloat(level1Percent) || 0) +
      (parseFloat(level2Percent) || 0) +
      (parseFloat(level3Percent || 0)) +
      (parseFloat(level4Percent || 0)) +
      (parseFloat(level5Percent || 0)) +
      (parseFloat(level6Percent || 0));
    const totalCommission = parseFloat(totalCommissionPercent);
    
    if (breakupSum > totalCommission) {
      return res.status(400).json({
        success: false,
        message: 'Total commission breakup cannot exceed total commission percentage'
      });
    }

    const property = await prisma.property.create({
      data: {
        name,
        location,
        price: parseFloat(price),
        description,
        totalCommissionPercent: totalCommission,
        sellerPercent: parseFloat(sellerPercent),
        level1Percent: parseFloat(level1Percent),
        level2Percent: parseFloat(level2Percent),
        level3Percent: parseFloat(level3Percent || 0),
        level4Percent: parseFloat(level4Percent || 0),
        level5Percent: parseFloat(level5Percent || 0),
        level6Percent: parseFloat(level6Percent || 0),
        images: imagesJson,
        status: 'active'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: { property }
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/properties/:id
 * @desc    Update a property
 * @access  Private (Admin only)
 */
router.put('/properties/:id', [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('totalCommissionPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Total commission must be between 0 and 100'),
  body('sellerPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Seller percent must be between 0 and 100'),
  body('level1Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 1 percent must be between 0 and 100'),
  body('level2Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 2 percent must be between 0 and 100'),
  body('level3Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 3 percent must be between 0 and 100'),
  body('level4Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 4 percent must be between 0 and 100'),
  body('level5Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 5 percent must be between 0 and 100'),
  body('level6Percent').optional().isFloat({ min: 0, max: 100 }).withMessage('Level 6 percent must be between 0 and 100'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
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

    const { id } = req.params;
    
    // Check if property exists first
    const existingProperty = await prisma.property.findUnique({ where: { id } });
    if (!existingProperty) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Build update data object - only include fields that are provided
    const updateData = {};
    
    // Handle string fields
    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.location !== undefined) updateData.location = req.body.location.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description.trim();
    if (req.body.status !== undefined) updateData.status = req.body.status;

    // Handle numeric fields - convert to numbers
    if (req.body.price !== undefined) {
      updateData.price = parseFloat(req.body.price);
      if (isNaN(updateData.price)) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid number'
        });
      }
    }

    // Handle commission fields
    let totalCommissionPercent = existingProperty.totalCommissionPercent;
    let sellerPercent = existingProperty.sellerPercent;
    let level1Percent = existingProperty.level1Percent;
    let level2Percent = existingProperty.level2Percent;
    let level3Percent = existingProperty.level3Percent || 0;
    let level4Percent = existingProperty.level4Percent || 0;
    let level5Percent = existingProperty.level5Percent || 0;
    let level6Percent = existingProperty.level6Percent || 0;

    if (req.body.totalCommissionPercent !== undefined) {
      totalCommissionPercent = parseFloat(req.body.totalCommissionPercent);
      if (isNaN(totalCommissionPercent)) {
        return res.status(400).json({
          success: false,
          message: 'Total commission percent must be a valid number'
        });
      }
      updateData.totalCommissionPercent = totalCommissionPercent;
    }

    if (req.body.sellerPercent !== undefined) {
      sellerPercent = parseFloat(req.body.sellerPercent);
      if (isNaN(sellerPercent)) {
        return res.status(400).json({
          success: false,
          message: 'Seller percent must be a valid number'
        });
      }
      updateData.sellerPercent = sellerPercent;
    }

    if (req.body.level1Percent !== undefined) {
      level1Percent = parseFloat(req.body.level1Percent);
      if (isNaN(level1Percent)) {
        return res.status(400).json({
          success: false,
          message: 'Level 1 percent must be a valid number'
        });
      }
      updateData.level1Percent = level1Percent;
    }

    if (req.body.level2Percent !== undefined) {
      level2Percent = parseFloat(req.body.level2Percent);
      if (isNaN(level2Percent)) {
        return res.status(400).json({
          success: false,
          message: 'Level 2 percent must be a valid number'
        });
      }
      updateData.level2Percent = level2Percent;
    }

    if (req.body.level3Percent !== undefined) {
      level3Percent = parseFloat(req.body.level3Percent);
      if (isNaN(level3Percent)) {
        return res.status(400).json({
          success: false,
          message: 'Level 3 percent must be a valid number'
        });
      }
      updateData.level3Percent = level3Percent;
    }

    if (req.body.level4Percent !== undefined) {
      level4Percent = parseFloat(req.body.level4Percent);
      if (isNaN(level4Percent)) {
        return res.status(400).json({
          success: false,
          message: 'Level 4 percent must be a valid number'
        });
      }
      updateData.level4Percent = level4Percent;
    }

    if (req.body.level5Percent !== undefined) {
      level5Percent = parseFloat(req.body.level5Percent);
      if (isNaN(level5Percent)) {
        return res.status(400).json({
          success: false,
          message: 'Level 5 percent must be a valid number'
        });
      }
      updateData.level5Percent = level5Percent;
    }

    if (req.body.level6Percent !== undefined) {
      level6Percent = parseFloat(req.body.level6Percent);
      if (isNaN(level6Percent)) {
        return res.status(400).json({
          success: false,
          message: 'Level 6 percent must be a valid number'
        });
      }
      updateData.level6Percent = level6Percent;
    }

    // Validate commission breakup (only if commission fields are being updated)
    if (req.body.totalCommissionPercent !== undefined || req.body.sellerPercent !== undefined || 
        req.body.level1Percent !== undefined || req.body.level2Percent !== undefined ||
        req.body.level3Percent !== undefined || req.body.level4Percent !== undefined ||
        req.body.level5Percent !== undefined || req.body.level6Percent !== undefined) {
      const breakupSum =
        sellerPercent +
        level1Percent +
        level2Percent +
        level3Percent +
        level4Percent +
        level5Percent +
        level6Percent;
      if (breakupSum > totalCommissionPercent) {
        return res.status(400).json({
          success: false,
          message: 'Total commission breakup cannot exceed total commission percentage'
        });
      }
    }

    // Update property
    const property = await prisma.property.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: { property }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    console.error('Update property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/properties/:id
 * @desc    Delete a property
 * @access  Private (Admin only)
 */
router.delete('/properties/:id', async (req, res) => {
  try {
    await prisma.property.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error.message
    });
  }
});

// ==================== USER MANAGEMENT ====================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (agents)
 * @access  Private (Admin only)
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 100, search } = req.query; // Increased limit for search to work properly
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { role: 'agent' };
    
    // Search by name, email, or referral code
    // SQLite's contains is case-insensitive for ASCII characters by default
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { referralCode: { contains: searchTerm.toUpperCase() } } // Referral codes are stored in uppercase
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          email: true,
          referralCode: true,
          level: true,
          uplineId: true,
          createdAt: true,
          upline: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 * @access  Private (Admin only)
 */
router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        upline: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true
          }
        },
        downlines: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
            level: true
          }
        },
        wallet: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update basic agent profile details (name, email)
 * @access  Private (Admin only)
 */
router.put('/users/:id', [
  body('name').trim().notEmpty().withMessage('Name is required'),
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

    const { name, email } = req.body;

    // Ensure user exists and is an agent
    const existing = await prisma.user.findUnique({
      where: { id: req.params.id }
    });

    if (!existing || existing.role !== 'agent') {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name,
        email
      },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        level: true,
        createdAt: true,
        upline: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update agent error:', error);

    // Handle unique email constraint
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update agent',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete agent profile (blocked if agent has activity)
 * @access  Private (Admin only)
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user || user.role !== 'agent') {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Check for related activity to avoid breaking MLM / commissions
    const [
      salesCount,
      commissionsCount,
      withdrawalsCount,
      downlinesCount,
      visitsCount
    ] = await Promise.all([
      prisma.sale.count({ where: { sellerId: id } }),
      prisma.commission.count({ where: { userId: id } }),
      prisma.withdrawal.count({ where: { userId: id } }),
      prisma.user.count({ where: { uplineId: id } }),
      prisma.visit.count({ where: { agentId: id } })
    ]);

    if (
      salesCount > 0 ||
      commissionsCount > 0 ||
      withdrawalsCount > 0 ||
      downlinesCount > 0 ||
      visitsCount > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete this agent because they have existing sales, commissions, withdrawals, downline, or visit records. Deletion is blocked to protect MLM and commission history.'
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agent',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/users/:id/reset-password
 * @desc    Set a new password for an agent (admin-provided)
 * @access  Private (Admin only)
 */
router.post('/users/:id/reset-password', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.length === 0 && !errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const id = req.params.id;
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user || user.role !== 'agent') {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    console.log('Admin updated agent password', {
      adminId: req.user.id,
      agentId: id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Agent password updated successfully'
    });
  } catch (error) {
    console.error('Reset agent password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent password',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/mlm-tree
 * @desc    Get full MLM hierarchy tree (unlimited depth for admin view)
 * @access  Private (Admin only)
 * 
 * NOTE: Admin can see the FULL hierarchy with unlimited depth.
 * Agents can only see 3 levels, but admin sees everything.
 * Commission is still limited to 3 levels regardless of tree depth.
 */
router.get('/mlm-tree', async (req, res) => {
  try {
    // Get all agents with their upline and downline info
    // This fetches the complete hierarchy - unlimited depth
    const users = await prisma.user.findMany({
      where: { role: 'agent' },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        level: true,
        uplineId: true,
        upline: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true
          }
        },
        downlines: {
          select: {
            id: true,
            name: true,
            email: true,
            referralCode: true,
            level: true
          }
        }
      }
    });

    // Build tree structure recursively - unlimited depth for admin
    // Root level users are those with no upline (level 0 or uplineId is null)
    const tree = users.filter(user => !user.uplineId || user.level === 0);

    // Recursive function to build full tree - no depth limit for admin
    const buildTree = (user) => {
      if (!user) return null;
      
      return {
        ...user,
        // Recursively build all downlines - unlimited depth
        downlines: user.downlines
          .map(downline => {
            const fullDownline = users.find(u => u.id === downline.id);
            return fullDownline ? buildTree(fullDownline) : null;
          })
          .filter(Boolean) // Remove null entries
      };
    };

    const mlmTree = tree.map(user => buildTree(user)).filter(Boolean);

    res.json({
      success: true,
      data: { mlmTree }
    });
  } catch (error) {
    console.error('Get MLM tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MLM tree',
      error: error.message
    });
  }
});

// ==================== SALE MANAGEMENT ====================

/**
 * @route   GET /api/admin/sales
 * @desc    Get all sales
 * @access  Private (Admin only)
 */
router.get('/sales', async (req, res) => {
  try {
    const { status, page = 1, limit = 10, propertyId, buyer } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    // Property filter
    if (propertyId) {
      where.propertyId = propertyId;
    }
    
    // Buyer name filter (case-insensitive partial match)
    if (buyer && buyer.trim()) {
      where.buyerName = {
        contains: buyer.trim()
      };
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
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true
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
 * @route   PUT /api/admin/sales/:id/approve
 * @desc    Approve a sale and trigger commission calculation
 * @access  Private (Admin only)
 */
router.put('/sales/:id/approve', async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        property: true
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    if (sale.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Sale already approved'
      });
    }

    // Update sale status
    await prisma.sale.update({
      where: { id: req.params.id },
      data: { status: 'approved' }
    });

    // Calculate commissions
    const commissionResult = await calculateCommissions(
      sale.id,
      sale.sellerId,
      sale.propertyId,
      sale.saleAmount
    );

    res.json({
      success: true,
      message: 'Sale approved and commissions calculated',
      data: {
        sale,
        commissions: commissionResult
      }
    });
  } catch (error) {
    console.error('Approve sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve sale',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/sales/:id/reject
 * @desc    Reject a sale
 * @access  Private (Admin only)
 */
router.put('/sales/:id/reject', async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    await prisma.sale.update({
      where: { id: req.params.id },
      data: { status: 'rejected' }
    });

    res.json({
      success: true,
      message: 'Sale rejected'
    });
  } catch (error) {
    console.error('Reject sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject sale',
      error: error.message
    });
  }
});

// ==================== VISIT MANAGEMENT ====================

/**
 * @route   GET /api/admin/visits
 * @desc    Get all visits (with optional filters)
 * @access  Private (Admin only)
 */
router.get('/visits', async (req, res) => {
  try {
    const { page = 1, limit = 10, agentId, propertyId, customer } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (agentId) {
      where.agentId = agentId;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (customer && customer.trim()) {
      where.customerName = {
        contains: customer.trim()
      };
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.visit.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        visits,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visits',
      error: error.message
    });
  }
});

// ==================== COMMISSION MANAGEMENT ====================

/**
 * @route   GET /api/admin/commissions
 * @desc    Get all commissions
 * @access  Private (Admin only)
 */
router.get('/commissions', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
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
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
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
 * @route   PUT /api/admin/commissions/:id/approve
 * @desc    Approve a commission
 * @access  Private (Admin only)
 */
router.put('/commissions/:id/approve', async (req, res) => {
  try {
    const result = await approveCommission(req.params.id);
    res.json({
      success: true,
      message: 'Commission approved',
      data: result
    });
  } catch (error) {
    console.error('Approve commission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve commission',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/commissions/:id/reject
 * @desc    Reject a commission
 * @access  Private (Admin only)
 */
router.put('/commissions/:id/reject', async (req, res) => {
  try {
    const result = await rejectCommission(req.params.id);
    res.json({
      success: true,
      message: 'Commission rejected',
      data: result
    });
  } catch (error) {
    console.error('Reject commission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject commission',
      error: error.message
    });
  }
});

// ==================== WITHDRAWAL MANAGEMENT ====================

/**
 * @route   GET /api/admin/withdrawals
 * @desc    Get all withdrawal requests
 * @access  Private (Admin only)
 */
router.get('/withdrawals', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
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
 * @route   PUT /api/admin/withdrawals/:id/approve
 * @desc    Approve a withdrawal request
 * @access  Private (Admin only)
 */
router.put('/withdrawals/:id/approve', async (req, res) => {
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    if (withdrawal.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal already approved'
      });
    }

    if (!withdrawal.user.wallet || withdrawal.user.wallet.balance < withdrawal.amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Update withdrawal status
    await prisma.withdrawal.update({
      where: { id: req.params.id },
      data: { status: 'approved' }
    });

    // Deduct from wallet
    await prisma.wallet.update({
      where: { userId: withdrawal.userId },
      data: {
        balance: {
          decrement: withdrawal.amount
        },
        approvedBalance: {
          decrement: withdrawal.amount
        }
      }
    });

    res.json({
      success: true,
      message: 'Withdrawal approved'
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/withdrawals/:id/reject
 * @desc    Reject a withdrawal request
 * @access  Private (Admin only)
 */
router.put('/withdrawals/:id/reject', async (req, res) => {
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: req.params.id }
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    await prisma.withdrawal.update({
      where: { id: req.params.id },
      data: { status: 'rejected' }
    });

    res.json({
      success: true,
      message: 'Withdrawal rejected'
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal',
      error: error.message
    });
  }
});

// ==================== NOTIFICATIONS ====================

/**
 * @route   GET /api/admin/notifications/counts
 * @desc    Get unviewed counts for sales, commissions, and withdrawals
 * @access  Private (Admin only)
 */
router.get('/notifications/counts', async (req, res) => {
  try {
    const [salesCount, commissionsCount, withdrawalsCount, visitsCount] = await Promise.all([
      prisma.sale.count({
        where: { isViewedByAdmin: false }
      }),
      prisma.commission.count({
        where: { isViewedByAdmin: false }
      }),
      prisma.withdrawal.count({
        where: { isViewedByAdmin: false }
      }),
      prisma.visit.count({
        where: { isViewedByAdmin: false }
      })
    ]);

    res.json({
      success: true,
      data: {
        sales: salesCount,
        commissions: commissionsCount,
        withdrawals: withdrawalsCount,
        visits: visitsCount
      }
    });
  } catch (error) {
    console.error('Get notification counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification counts',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/notifications/mark-sales-viewed
 * @desc    Mark all sales as viewed by admin
 * @access  Private (Admin only)
 */
router.post('/notifications/mark-sales-viewed', async (req, res) => {
  try {
    await prisma.sale.updateMany({
      where: { isViewedByAdmin: false },
      data: { isViewedByAdmin: true }
    });

    res.json({
      success: true,
      message: 'Sales marked as viewed'
    });
  } catch (error) {
    console.error('Mark sales viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark sales as viewed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/notifications/mark-commissions-viewed
 * @desc    Mark all commissions as viewed by admin
 * @access  Private (Admin only)
 */
router.post('/notifications/mark-commissions-viewed', async (req, res) => {
  try {
    await prisma.commission.updateMany({
      where: { isViewedByAdmin: false },
      data: { isViewedByAdmin: true }
    });

    res.json({
      success: true,
      message: 'Commissions marked as viewed'
    });
  } catch (error) {
    console.error('Mark commissions viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark commissions as viewed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/notifications/mark-withdrawals-viewed
 * @desc    Mark all withdrawals as viewed by admin
 * @access  Private (Admin only)
 */
router.post('/notifications/mark-withdrawals-viewed', async (req, res) => {
  try {
    await prisma.withdrawal.updateMany({
      where: { isViewedByAdmin: false },
      data: { isViewedByAdmin: true }
    });

    res.json({
      success: true,
      message: 'Withdrawals marked as viewed'
    });
  } catch (error) {
    console.error('Mark withdrawals viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark withdrawals as viewed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/notifications/mark-visits-viewed
 * @desc    Mark all visits as viewed by admin
 * @access  Private (Admin only)
 */
router.post('/notifications/mark-visits-viewed', async (req, res) => {
  try {
    await prisma.visit.updateMany({
      where: { isViewedByAdmin: false },
      data: { isViewedByAdmin: true }
    });

    res.json({
      success: true,
      message: 'Visits marked as viewed'
    });
  } catch (error) {
    console.error('Mark visits viewed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark visits as viewed',
      error: error.message
    });
  }
});

module.exports = router;

