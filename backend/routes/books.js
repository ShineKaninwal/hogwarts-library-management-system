const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const { nextSequence } = require('../models/Counter');
const { generateQrDataUrl } = require('../utils/qr');

const ICONS_BY_GENRE = {
  History: '📜',
  Charms: '✨',
  Theory: '🔮',
  'Magical Creatures': '🦄',
  Potions: '🧪',
  Herbology: '🌿',
  Sport: '🧹',
  'Defence Against the Dark Arts': '🛡️',
  Divination: '🌙',
  Arithmancy: '🔢',
  Transfiguration: '🐈'
};

// GET /api/books?search=&house=
router.get('/', async (req, res) => {
  try {
    const { search = '', house = 'all' } = req.query;

    const filter = {};

    if (house && house !== 'all') {
      filter.house = house;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(filter).sort({
      genre: 1,
      title: 1
    });

    res.json(books);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch books',
      error: err.message
    });
  }
});

// GET /api/books/code/:bookId
// Lookup book by human-readable ID
router.get('/code/:bookId', async (req, res) => {
  try {
    const book = await Book.findOne({
      bookId: req.params.bookId.toUpperCase()
    });

    if (!book) {
      return res.status(404).json({
        message: 'No book found with that ID.'
      });
    }

    res.json(book);
  } catch (err) {
    res.status(500).json({
      message: 'Lookup failed',
      error: err.message
    });
  }
});

// GET /api/books/:id/qr
router.get('/:id/qr', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    const dataUrl = await generateQrDataUrl(`BOOK:${book.bookId}`);

    res.json({
      dataUrl,
      payload: `BOOK:${book.bookId}`
    });
  } catch (err) {
    res.status(500).json({
      message: 'QR generation failed',
      error: err.message
    });
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    res.json(book);
  } catch (err) {
    res.status(400).json({
      message: 'Invalid book id',
      error: err.message
    });
  }
});

// POST /api/books
router.post('/', async (req, res) => {
  try {
    const {
      title,
      author,
      genre,
      house,
      totalCopies,
      availableCopies,
      icon
    } = req.body;

    // Check required fields
    if (
      !title ||
      !author ||
      !genre ||
      !house ||
      totalCopies == null
    ) {
      return res.status(400).json({
        message:
          'title, author, genre, house and totalCopies are required.'
      });
    }

    // Generate next Book ID
    const seq = await nextSequence('bookId');

    const bookId = 'B' + String(seq).padStart(4, '0');

    // Create book
    const book = await Book.create({
      bookId,
      title,
      author,
      genre,
      house,
      totalCopies,
      availableCopies:
        availableCopies != null
          ? Math.min(availableCopies, totalCopies)
          : totalCopies,
      icon: icon || ICONS_BY_GENRE[genre] || '📖'
    });

    res.status(201).json(book);

  } catch (err) {

    // Print the COMPLETE error in Render logs
    console.error('❌ CREATE BOOK ERROR:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      });
    }

    // Other errors
    res.status(500).json({
      message: 'Failed to create book',
      error: err.message
    });
  }
});

// PUT /api/books/:id
router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    const {
      title,
      author,
      genre,
      house,
      totalCopies,
      availableCopies,
      icon
    } = req.body;

    // Don't allow total copies to be less than
    // the number of copies currently on loan.
    const onLoan = book.totalCopies - book.availableCopies;

    if (totalCopies != null && totalCopies < onLoan) {
      return res.status(400).json({
        message: `Cannot set total copies below ${onLoan} — that many are currently on loan.`
      });
    }

    if (title != null) {
      book.title = title;
    }

    if (author != null) {
      book.author = author;
    }

    if (genre != null) {
      book.genre = genre;
    }

    if (house != null) {
      book.house = house;
    }

    if (icon != null) {
      book.icon = icon;
    }

    if (totalCopies != null) {
      const diff = totalCopies - book.totalCopies;

      book.totalCopies = totalCopies;

      book.availableCopies = Math.max(
        0,
        Math.min(
          totalCopies,
          book.availableCopies + diff
        )
      );
    }

    if (availableCopies != null) {
      book.availableCopies = Math.max(
        0,
        Math.min(
          book.totalCopies,
          availableCopies
        )
      );
    }

    await book.save();

    res.json(book);

  } catch (err) {

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(', ')
      });
    }

    res.status(500).json({
      message: 'Failed to update book',
      error: err.message
    });
  }
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    const activeLoans = await Transaction.countDocuments({
      book: book._id,
      status: 'issued'
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        message: `Cannot delete "${book.title}" — ${activeLoans} copy(ies) are currently on loan.`
      });
    }

    await book.deleteOne();

    res.json({
      message: 'Book deleted',
      bookId: book.bookId
    });

  } catch (err) {
    res.status(500).json({
      message: 'Failed to delete book',
      error: err.message
    });
  }
});

module.exports = router;