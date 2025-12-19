const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 *
 * Includes userId and role in the payload; can optionally
 * include email as an extra claim for frontend awareness.
 * Backend auth still relies on userId + DB lookup.
 */
const generateToken = (userId, role, email) => {
  const payload = { userId };
  if (role) payload.role = role;
  if (email) payload.email = email;

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};

