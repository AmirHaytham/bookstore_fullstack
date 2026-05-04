require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');

const authRoutes   = require('./routes/authRoutes');
const bookRoutes   = require('./routes/bookRoutes');
const authorRoutes = require('./routes/authorRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Routes (versioned under /api/v1/) ─────────────────────────────────
app.use('/api/v1/auth',    authRoutes);
app.use('/api/v1/books',   bookRoutes);
app.use('/api/v1/authors', authorRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Health-check
app.get('/', (req, res) => {
  res.json({ message: 'BookStore Auth API is running!' });
});

// ── Centralized error handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Database + Start ──────────────────────────────────────────────
connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
