const Book = require('../models/Book');

// GET /api/books
const getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/featured
const getFeaturedBooks = async (req, res, next) => {
  try {
    // Prefer explicitly flagged featured books; fall back to newest 3
    let books = await Book.find({ featured: true }).limit(6);
    if (books.length === 0) {
      books = await Book.find().sort({ createdAt: -1 }).limit(3);
    }
    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:id
const getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// POST /api/books  [admin only]
const createBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// PUT /api/books/:id  [admin only]
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/books/:id  [admin only]
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllBooks, getBook, getFeaturedBooks, createBook, updateBook, deleteBook };
