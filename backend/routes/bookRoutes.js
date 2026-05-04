const express      = require('express');
const router       = express.Router();
const auth         = require('../middleware/auth');
const authorize    = require('../middleware/authorize');
const reviewRouter = require('./reviewRoutes');
const {
  getAllBooks,
  getBook,
  getFeaturedBooks,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

// ── Public routes ────────────────────────────────────────────────────────
router.get('/', getAllBooks);

// Static named routes MUST come before /:id — otherwise Express matches
// 'featured' as an :id value and calls getBook instead
router.get('/featured', getFeaturedBooks);

router.get('/:id', getBook);

// ── Nested route: GET|POST /api/v1/books/:bookId/reviews ────────────────
// reviewRouter uses { mergeParams: true } to access :bookId from this router
router.use('/:bookId/reviews', reviewRouter);

// ── router.use(auth) — all routes defined AFTER this line require authentication
router.use(auth);

// ── Admin-only mutation routes ──────────────────────────────────────
router.post('/',      authorize('admin'), createBook);
router.put('/:id',    authorize('admin'), updateBook);
router.delete('/:id', authorize('admin'), deleteBook);

module.exports = router;
