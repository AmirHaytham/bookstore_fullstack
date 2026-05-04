const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const { register, login, logout, me } = require('../controllers/authController');

// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// GET /api/v1/auth/me  -- protected
router.get('/me', auth, me);

module.exports = router;
