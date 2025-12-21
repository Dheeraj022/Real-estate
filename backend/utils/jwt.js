const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 *
 * Includes userId and role in the payload; can optionally
 * include email as an extra claim for frontend awareness.
 * Backend auth still relies on userId + DB lookup.
 */
const generateToken = (userId, role, email) => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured. Server cannot generate tokens.');
  }

  const payload = { userId };
  if (role) payload.role = role;
  if (email) payload.email = email;

  return jwt.sign(
    payload,
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured. Server cannot verify tokens.');
  }
  
  return jwt.verify(token, jwtSecret);
};

module.exports = {
  generateToken,
  verifyToken
};

