const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Generate a unique 7-character alphanumeric referral code
 * Format: 3 letters + 3 numbers + 1 letter (e.g., ASC123D)
 * 
 * @returns {Promise<string>} Unique referral code
 */
async function generateReferralCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loop
  
  while (!isUnique && attempts < maxAttempts) {
    // Generate 3 random letters
    const part1 = Array.from({ length: 3 }, () => 
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
    
    // Generate 3 random numbers
    const part2 = Array.from({ length: 3 }, () => 
      numbers[Math.floor(Math.random() * numbers.length)]
    ).join('');
    
    // Generate 1 random letter
    const part3 = letters[Math.floor(Math.random() * letters.length)];
    
    // Combine: ASC123D format
    code = part1 + part2 + part3;
    
    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { referralCode: code }
    });
    
    if (!existing) {
      isUnique = true;
    }
    
    attempts++;
  }
  
  if (!isUnique) {
    // Fallback: add timestamp suffix if all attempts failed
    const timestamp = Date.now().toString().slice(-3);
    code = code.substring(0, 4) + timestamp;
  }
  
  return code;
}

module.exports = {
  generateReferralCode
};



