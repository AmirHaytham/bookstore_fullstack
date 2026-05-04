const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Helper: sign a JWT containing only the user id
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Block self-registration as admin -- admins are provisioned manually
    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot register as admin' });
    }

    // Duplicate email is handled by mongoose unique index + errorHandler (11000)
    const user = await User.create({ name, email, password, role: role || 'customer' });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // select: false means password is excluded by default -- +password re-includes it
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user._id);

    // Return token in JSON body -- client stores it (e.g. localStorage or memory)
    res.json({
      success: true,
      token,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/logout -- Bearer tokens are stateless; client just discards the token
const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/v1/auth/me  -- requires auth middleware; returns the user attached to req
const me = (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { register, login, logout, me };
