const express  = require('express');
const router   = express.Router({ mergeParams: true }); // access :bookId from parent router
const auth     = require('../middleware/auth');
const { getAllReviews, createReview, deleteReview } = require('../controllers/reviewController');

// GET /api/v1/reviews?book=<bookId>  OR  GET /api/v1/books/:bookId/reviews
router.get('/', getAllReviews);

// POST /api/v1/reviews  OR  POST /api/v1/books/:bookId/reviews  [authenticated]
router.post('/', auth, createReview);

// DELETE /api/v1/reviews/:id  [owner or admin — checked inside controller]
router.delete('/:id', auth, deleteReview);

module.exports = router;
