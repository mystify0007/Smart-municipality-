const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = decoded; // { id, role, email }
    next();
  });
}

// Usage: authorize('Admin', 'Officer')  -- role strings must match the DB enum exactly (capitalized)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied for this role' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
