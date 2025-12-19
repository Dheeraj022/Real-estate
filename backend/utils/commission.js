const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Calculate and create commission records for a sale
 * 
 * IMPORTANT: Commission is limited to Level 6 (Seller + Levels 1–6) regardless of actual tree depth.
 * The referral tree can have unlimited depth, but commissions are only paid up to Level 6.
 * 
 * Commission levels:
 * - Level 0: Seller (the agent who made the sale)
 * - Level 1: Seller's direct upline
 * - Level 2: Seller's upline's upline
 * - Level 3–6: Higher uplines (up to 6th level)
 * - Level 7+: No commission (but referral connection still exists in database)
 * 
 * @param {string} saleId - The ID of the approved sale
 * @param {string} sellerId - The ID of the agent who made the sale
 * @param {string} propertyId - The ID of the property sold
 * @param {number} saleAmount - The total sale amount
 */
async function calculateCommissions(saleId, sellerId, propertyId, saleAmount) {
  try {
    // Fetch property with commission percentages
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Validate commission percentages sum against property's totalCommissionPercent
    const sellerPercent = property.sellerPercent || 0;
    const level1Percent = property.level1Percent || 0;
    const level2Percent = property.level2Percent || 0;
    const level3Percent = property.level3Percent || 0;
    const level4Percent = property.level4Percent || 0;
    const level5Percent = property.level5Percent || 0;
    const level6Percent = property.level6Percent || 0;

    const breakupSum =
      sellerPercent +
      level1Percent +
      level2Percent +
      level3Percent +
      level4Percent +
      level5Percent +
      level6Percent;

    const maxCommissionPercent = property.totalCommissionPercent || 100;

    if (breakupSum > maxCommissionPercent) {
      throw new Error('Total commission breakup cannot exceed total commission percentage');
    }

    // Fetch seller with upline chain
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        uplineId: true
      }
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    const commissions = [];

    // Level 0: Seller commission (always created if seller exists)
    if (property.sellerPercent > 0) {
      const sellerCommission = (saleAmount * property.sellerPercent) / 100;
      commissions.push({
        saleId,
        userId: sellerId,
        level: 0,
        percentage: property.sellerPercent,
        amount: sellerCommission,
        status: 'pending',
        isViewedByAdmin: false
      });
    }

    // Traverse upline chain recursively, but stop at Level 6 for commissions
    // 
    // IMPORTANT MLM RULES:
    // - Referral tree can have UNLIMITED depth (stored in database)
    // - Commission is LIMITED to 7 levels only (Seller + Levels 1–6)
    // - Any agent at any level can refer unlimited agents (unlimited width)
    // - Commission calculation stops here, but referral connections continue deeper
    //
    let currentUserId = seller.uplineId;
    let commissionLevel = 1; // Start at Level 1 (seller's direct upline)

    // Traverse upline chain, but only calculate commissions up to Level 6
    // Levels beyond 6 exist in the tree but receive no commission
    while (currentUserId && commissionLevel <= 6) {
      const upline = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          uplineId: true
        }
      });

      if (!upline) {
        break; // Upline not found, stop traversal
      }

      // Calculate commission based on commission level (1–6)
      // Level 7+ uplines exist but get no commission
      let percentage = 0;
      if (commissionLevel === 1 && property.level1Percent > 0) {
        percentage = property.level1Percent;
      } else if (commissionLevel === 2 && property.level2Percent > 0) {
        percentage = property.level2Percent;
      } else if (commissionLevel === 3 && property.level3Percent > 0) {
        percentage = property.level3Percent;
      } else if (commissionLevel === 4 && property.level4Percent > 0) {
        percentage = property.level4Percent;
      } else if (commissionLevel === 5 && property.level5Percent > 0) {
        percentage = property.level5Percent;
      } else if (commissionLevel === 6 && property.level6Percent > 0) {
        percentage = property.level6Percent;
      }

      if (percentage > 0) {
        const commissionAmount = (saleAmount * percentage) / 100;
        commissions.push({
          saleId,
          userId: upline.id,
          level: commissionLevel,
          percentage: percentage,
          amount: commissionAmount,
          status: 'pending',
          isViewedByAdmin: false
        });
      }

      // Move to next upline level
      // Note: Even if we stop calculating commissions, the upline chain continues deeper
      currentUserId = upline.uplineId;
      commissionLevel++;
    }
    
    // At this point, if commissionLevel > 6, there are more uplines in the chain
    // but they don't receive commissions (as per MLM rules)

    // Create all commission records
    const createdCommissions = await prisma.commission.createMany({
      data: commissions
    });

    // Update wallets with pending balance
    for (const commission of commissions) {
      await prisma.wallet.upsert({
        where: { userId: commission.userId },
        create: {
          userId: commission.userId,
          pendingBalance: commission.amount,
          balance: 0,
          approvedBalance: 0
        },
        update: {
          pendingBalance: {
            increment: commission.amount
          }
        }
      });
    }

    return {
      success: true,
      commissionsCreated: createdCommissions.count,
      commissions
    };
  } catch (error) {
    console.error('Commission calculation error:', error);
    throw error;
  }
}

/**
 * Approve a commission and update wallet
 */
async function approveCommission(commissionId) {
  try {
    const commission = await prisma.commission.findUnique({
      where: { id: commissionId }
    });

    if (!commission) {
      throw new Error('Commission not found');
    }

    if (commission.status === 'approved') {
      throw new Error('Commission already approved');
    }

    // Update commission status
    await prisma.commission.update({
      where: { id: commissionId },
      data: { status: 'approved' }
    });

    // Update wallet: move from pending to approved and balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: commission.userId }
    });

    if (wallet) {
      await prisma.wallet.update({
        where: { userId: commission.userId },
        data: {
          pendingBalance: {
            decrement: commission.amount
          },
          approvedBalance: {
            increment: commission.amount
          },
          balance: {
            increment: commission.amount
          }
        }
      });
    } else {
      // Create wallet if it doesn't exist
      await prisma.wallet.create({
        data: {
          userId: commission.userId,
          balance: commission.amount,
          approvedBalance: commission.amount,
          pendingBalance: 0
        }
      });
    }

    return { success: true, commission };
  } catch (error) {
    console.error('Commission approval error:', error);
    throw error;
  }
}

/**
 * Reject a commission
 */
async function rejectCommission(commissionId) {
  try {
    const commission = await prisma.commission.findUnique({
      where: { id: commissionId }
    });

    if (!commission) {
      throw new Error('Commission not found');
    }

    // Update commission status
    await prisma.commission.update({
      where: { id: commissionId },
      data: { status: 'rejected' }
    });

    // Remove from pending balance if it was pending
    if (commission.status === 'pending') {
      await prisma.wallet.update({
        where: { userId: commission.userId },
        data: {
          pendingBalance: {
            decrement: commission.amount
          }
        }
      });
    }

    return { success: true, commission };
  } catch (error) {
    console.error('Commission rejection error:', error);
    throw error;
  }
}

module.exports = {
  calculateCommissions,
  approveCommission,
  rejectCommission
};

