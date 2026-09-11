const mongoose = require('mongoose');

const HOUSES = [
  'gryffindor',
  'slytherin',
  'ravenclaw',
  'hufflepuff'
];

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },

    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true
    },

    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true
    },

    house: {
      type: String,
      required: true,
      enum: HOUSES
    },

    icon: {
      type: String,
      default: '📖'
    },

    totalCopies: {
      type: Number,
      required: true,
      min: [1, 'Total copies must be at least 1']
    },

    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Make sure available copies never exceed total copies.
bookSchema.pre('validate', function () {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
module.exports.HOUSES = HOUSES;