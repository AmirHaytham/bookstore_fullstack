const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    genre: {
      type: String,
      enum: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Technology', 'Other'],
    },
    publishedYear: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear(),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
