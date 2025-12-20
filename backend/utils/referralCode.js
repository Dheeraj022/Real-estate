const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Characters used to generate referral codes (similar to standard MLM/referral codes)
const REFERRAL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const REFERRAL_CODE_LENGTH = 7;

function generateRandomCode(length = REFERRAL_CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * REFERRAL_CHARS.length);
    code += REFERRAL_CHARS.charAt(index);
  }
  return code;
}

/**
 * Generate a unique referral code for a new user.
 * 
 * - Uses A–Z and 0–9 characters.
 * - Ensures uniqueness by checking existing users in the database.
 * - Retries a few times before failing.
 */
async function generateReferralCode(maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRandomCode();

    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { referralCode: code }
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error('Failed to generate a unique referral code after multiple attempts');
}

module.exports = {
  generateReferralCode
};







