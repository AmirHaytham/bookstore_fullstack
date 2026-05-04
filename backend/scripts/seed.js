// Seed script — drops the books/authors/reviews collections and inserts
// a small batch of demo data plus one admin and one customer account.
//
// Usage:  node scripts/seed.js
//
// Reads MONGO_URI / JWT_SECRET from the same .env the server uses.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User   = require('../models/User');
const Book   = require('../models/Book');
const Author = require('../models/Author');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore-fullstack';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('connected to', MONGO_URI);

  // wipe domain data — keep things deterministic for demos
  await Promise.all([
    Book.deleteMany({}),
    Author.deleteMany({}),
    Review.deleteMany({}),
    User.deleteMany({}),
  ]);

  // accounts
  const admin = await User.create({
    name: 'Admin Amir',
    email: 'admin@bookstore.dev',
    password: 'admin1234',
    role: 'admin',
  });
  const customer = await User.create({
    name: 'Sara the Reader',
    email: 'sara@bookstore.dev',
    password: 'sara1234',
    role: 'customer',
  });

  // authors (kept simple — Book.author is a String in this codebase)
  const authors = await Author.insertMany([
    { name: 'J.R.R. Tolkien', nationality: 'British', bio: 'Author of The Hobbit and The Lord of the Rings.' },
    { name: 'Yuval Noah Harari', nationality: 'Israeli', bio: 'Historian and author of Sapiens.' },
    { name: 'Robert C. Martin', nationality: 'American', bio: 'Software craftsman, author of Clean Code.' },
  ]);

  // books
  const books = await Book.insertMany([
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '9780547928227',
      price: 14.99,
      genre: 'Fiction',
      publishedYear: 1937,
      stock: 12,
      featured: true,
      description: 'Bilbo Baggins gets dragged into an unexpected adventure.',
    },
    {
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      isbn: '9780062316097',
      price: 19.99,
      genre: 'History',
      publishedYear: 2014,
      stock: 8,
      featured: true,
      description: 'A sweeping tour of human history.',
    },
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      price: 32.50,
      genre: 'Technology',
      publishedYear: 2008,
      stock: 15,
      featured: false,
      description: 'A handbook of agile software craftsmanship.',
    },
  ]);

  // one demo review so the UI has something to render
  await Review.create({
    book: books[0]._id,
    user: customer._id,
    rating: 5,
    comment: 'Lovely cozy adventure — read it in two sittings.',
  });

  console.log('seeded:', {
    users:   await User.countDocuments(),
    authors: authors.length,
    books:   books.length,
    reviews: await Review.countDocuments(),
  });
  console.log('\nlogin credentials:');
  console.log('  admin    -> admin@bookstore.dev / admin1234');
  console.log('  customer -> sara@bookstore.dev / sara1234');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
