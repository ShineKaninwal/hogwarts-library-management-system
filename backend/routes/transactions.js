const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const Member = require('../models/Member');
const { nextSequence } = require('../models/Counter');

// NOTE: Deliberately not using Mongoose multi-document sessions/transactions here —
// those require MongoDB to be running as a replica set, which most local/standalone
// installs are not. Instead we re-check availability atomically at the DB level
// using findOneAndUpdate guards, which is safe for a single-instance MongoDB.

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeStatus(tx) {
  if (tx.status === 'returned') return 'returned';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(tx.dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime() ? 'overdue' : 'issued';
}

function overdueDays(tx) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(tx.dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

function serializeTx(tx) {
  const status = computeStatus(tx);
  return {
    _id: tx._id,
    transactionId: tx.transactionId,
    book: tx.book,
    member: tx.member,
    issueDate: tx.issueDate,
    dueDate: tx.dueDate,
    returnDate: tx.returnDate,
    status,
    overdueDays: status === 'overdue' ? overdueDays(tx) : 0
  };
}

// GET /api/transactions?status=&house=&from=&to=
router.get('/', async (req, res) => {
  try {
    const { status = 'all', house = 'all', from = '', to = '' } = req.query;
    const filter = {};
    if (from || to) {
      filter.issueDate = {};
      if (from) filter.issueDate.$gte = new Date(from);
      if (to) filter.issueDate.$lte = new Date(to);
    }
    let txs = await Transaction.find(filter)
      .populate('book')
      .populate('member')
      .sort({ issueDate: -1 });

    if (house !== 'all') {
      txs = txs.filter((t) => t.book && t.book.house === house);
    }

    let serialized = txs.map(serializeTx);
    if (status !== 'all') {
      serialized = serialized.filter((t) => t.status === status);
    }
    res.json(serialized);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
});

// GET /api/transactions/active
router.get('/active', async (req, res) => {
  try {
    const txs = await Transaction.find({ status: 'issued' })
      .populate('book')
      .populate('member')
      .sort({ dueDate: 1 });
    res.json(txs.map(serializeTx));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch active loans', error: err.message });
  }
});

// POST /api/transactions/issue { bookCode, memberCode, loanDays }
router.post('/issue', async (req, res) => {
  try {
    const { bookCode, memberCode, loanDays } = req.body;
    if (!bookCode || !memberCode) {
      return res.status(400).json({ message: 'Both a book and a reader must be selected.' });
    }
    const days = parseInt(loanDays, 10) || 14;

    const book = await Book.findOne({ bookId: String(bookCode).toUpperCase() });
    if (!book) return res.status(404).json({ message: 'That tag does not match any book in the registry.' });

    const member = await Member.findOne({ memberId: String(memberCode).toUpperCase() });
    if (!member) return res.status(404).json({ message: 'That card does not match any reader in the registry.' });

    const duplicate = await Transaction.findOne({ book: book._id, member: member._id, status: 'issued' });
    if (duplicate) {
      return res.status(400).json({ message: `${member.name} already has an active loan for "${book.title}".` });
    }

    // Atomic guard: only decrement if a copy is actually available right now.
    const updatedBook = await Book.findOneAndUpdate(
      { _id: book._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
    if (!updatedBook) {
      return res.status(400).json({ message: `All copies of "${book.title}" are currently out.` });
    }

    const seq = await nextSequence('transactionId');
    const transactionId = 'T' + String(seq).padStart(6, '0');
    const issueDate = new Date();
    const dueDate = addDays(issueDate, days);

    let tx;
    try {
      tx = await Transaction.create({
        transactionId,
        book: book._id,
        member: member._id,
        issueDate,
        dueDate,
        status: 'issued'
      });
    } catch (createErr) {
      // Roll back the copy decrement if transaction creation failed.
      await Book.findByIdAndUpdate(book._id, { $inc: { availableCopies: 1 } });
      throw createErr;
    }

    const populated = await Transaction.findById(tx._id).populate('book').populate('member');
    res.status(201).json(serializeTx(populated));
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to issue book' });
  }
});

// POST /api/transactions/return { bookCode }  OR  { transactionId }
router.post('/return', async (req, res) => {
  try {
    const { bookCode, transactionId } = req.body;
    let tx;

    if (transactionId) {
      tx = await Transaction.findOne({ transactionId, status: 'issued' });
    } else if (bookCode) {
      const book = await Book.findOne({ bookId: String(bookCode).toUpperCase() });
      if (!book) return res.status(404).json({ message: 'That tag does not match any book in the registry.' });
      tx = await Transaction.findOne({ book: book._id, status: 'issued' });
    } else {
      return res.status(400).json({ message: 'A book or transaction must be specified.' });
    }

    if (!tx) return res.status(404).json({ message: 'No active loan found for that book.' });

    const wasOverdue = computeStatus(tx) === 'overdue';

    // Atomic guard against double-return.
    const updatedTx = await Transaction.findOneAndUpdate(
      { _id: tx._id, status: 'issued' },
      { status: 'returned', returnDate: new Date() },
      { new: true }
    );
    if (!updatedTx) return res.status(400).json({ message: 'This book has already been returned.' });

    await Book.findByIdAndUpdate(tx.book, { $inc: { availableCopies: 1 } });

    const populated = await Transaction.findById(updatedTx._id).populate('book').populate('member');
    res.json({ ...serializeTx(populated), wasOverdue });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to return book' });
  }
});

module.exports = router;
