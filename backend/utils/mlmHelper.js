const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * MLM Helper Functions
 * 
 * IMPORTANT MLM STRUCTURE RULES:
 * 1. Unlimited Downline Width: Any agent can refer unlimited agents directly
 * 2. Unlimited Referral Depth: Referral tree can be unlimited depth in database
 * 3. Limited Commission Depth: Commission calculated only up to 3 levels (0, 1, 2)
 * 4. Display Rules: Agents see 3 levels, Admin sees full hierarchy
 */

/**
 * Traverse upline chain recursively
 * Used for commission calculation - stops at level 2
 * 
 * @param {string} userId - Starting user ID
 * @param {number} maxLevel - Maximum level to traverse (default: 2 for commissions)
 * @returns {Promise<Array>} Array of upline users up to maxLevel
 */
async function getUplineChain(userId, maxLevel = 2) {
  const uplineChain = [];
  let currentUserId = userId;
  let level = 0;

  while (currentUserId && level < maxLevel) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        email: true,
        uplineId: true,
        level: true
      }
    });

    if (!user || !user.uplineId) {
      break; // No more uplines
    }

    const upline = await prisma.user.findUnique({
      where: { id: user.uplineId },
      select: {
        id: true,
        name: true,
        email: true,
        uplineId: true,
        level: true
      }
    });

    if (upline) {
      uplineChain.push({
        ...upline,
        commissionLevel: level + 1 // Commission level (1 or 2)
      });
      currentUserId = upline.uplineId;
      level++;
    } else {
      break;
    }
  }

  return uplineChain;
}

/**
 * Get downline count at a specific level
 * Used for statistics - can count unlimited depth
 * 
 * @param {string} userId - User ID to count downlines for
 * @param {number} targetLevel - Target level to count (1, 2, 3, etc.)
 * @returns {Promise<number>} Count of downlines at target level
 */
async function getDownlineCountAtLevel(userId, targetLevel) {
  if (targetLevel <= 0) return 0;

  let currentLevelUsers = [userId];
  let currentLevel = 0;

  while (currentLevel < targetLevel) {
    const nextLevelUsers = await prisma.user.findMany({
      where: { uplineId: { in: currentLevelUsers } },
      select: { id: true }
    });

    if (nextLevelUsers.length === 0) {
      break; // No more downlines
    }

    currentLevelUsers = nextLevelUsers.map(u => u.id);
    currentLevel++;

    if (currentLevel === targetLevel) {
      return currentLevelUsers.length;
    }
  }

  return 0;
}

/**
 * Get total downline count (unlimited depth)
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total count of all downlines at any level
 */
async function getTotalDownlineCount(userId) {
  const visited = new Set();
  const queue = [userId];
  let total = 0;

  while (queue.length > 0) {
    const currentUserId = queue.shift();
    
    if (visited.has(currentUserId)) continue;
    visited.add(currentUserId);

    const downlines = await prisma.user.findMany({
      where: { uplineId: currentUserId },
      select: { id: true }
    });

    total += downlines.length;
    queue.push(...downlines.map(d => d.id));
  }

  return total;
}

module.exports = {
  getUplineChain,
  getDownlineCountAtLevel,
  getTotalDownlineCount
};

