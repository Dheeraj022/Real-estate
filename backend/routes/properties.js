const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/properties
 * @desc    Get all active properties (accessible to all authenticated users)
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    } else {
      // By default, show active properties to agents, all to admin
      if (req.user.role === 'agent') {
        where.status = 'active';
      }
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.property.count({ where })
    ]);

    // Convert images JSON string to array
    const propertiesWithImages = properties.map(prop => ({
      ...prop,
      images: typeof prop.images === 'string' ? JSON.parse(prop.images || '[]') : (prop.images || [])
    }));

    res.json({
      success: true,
      data: {
        properties: propertiesWithImages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/properties/:id
 * @desc    Get single property by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Agents can only see active properties
    if (req.user.role === 'agent' && property.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Convert images JSON string to array
    const propertyWithImages = {
      ...property,
      images: typeof property.images === 'string' ? JSON.parse(property.images || '[]') : (property.images || [])
    };

    res.json({
      success: true,
      data: { property: propertyWithImages }
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: error.message
    });
  }
});

module.exports = router;

