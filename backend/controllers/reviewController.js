const Review = require('../models/Review');

// Works for both:
//   GET /api/v1/reviews?book=<id>        (standalone route)
//   GET /api/v1/books/:bookId/reviews    (nested route — bookId via mergeParams)
const getAllReviews = async (req, res, next) => {
  try {
    const bookId = req.params.bookId || req.query.book;
    const filter = bookId ? { book: bookId } : {};
    const reviews = await Review.find(filter)
      .populate('book', 'title author')
      .populate('user', 'name email');
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/reviews  OR  POST /api/v1/books/:bookId/reviews  [authenticated]
const createReview = async (req, res, next) => {
  try {
    // When called via nested route, bookId comes from mergeParams
    const book = req.params.bookId || req.body.book;
    const review = await Review.create({ ...req.body, book, user: req.user.id });
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/reviews/:id  [admin or review owner]
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Two-layer authorization: role check + ownership check
    const isOwner = review.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllReviews, createReview, deleteReview };
