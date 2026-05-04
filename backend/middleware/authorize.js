// Role-based authorization middleware
// Usage: authorize('admin')  or  authorize('admin', 'customer')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not allowed here`,
    });
  }

  next();
};

module.exports = authorize;
