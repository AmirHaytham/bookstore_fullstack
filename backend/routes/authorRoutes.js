const express = require('express');
const router  = express.Router();
const Author  = require('../models/Author');
const auth    = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Public routes
router.get('/', async (req, res, next) => {
  try {
    const authors = await Author.find();
    res.json({ success: true, count: authors.length, data: authors });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ success: false, message: 'Author not found' });
    res.json({ success: true, data: author });
  } catch (err) { next(err); }
});

// Admin-only routes
router.post('/', auth, authorize('admin'), async (req, res, next) => {
  try {
    const author = await Author.create(req.body);
    res.status(201).json({ success: true, data: author });
  } catch (err) { next(err); }
});

router.put('/:id', auth, authorize('admin'), async (req, res, next) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!author) return res.status(404).json({ success: false, message: 'Author not found' });
    res.json({ success: true, data: author });
  } catch (err) { next(err); }
});

router.delete('/:id', auth, authorize('admin'), async (req, res, next) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).json({ success: false, message: 'Author not found' });
    res.json({ success: true, message: 'Author deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
