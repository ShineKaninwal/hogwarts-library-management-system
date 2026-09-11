const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

function isOverdue(tx) {
  if (tx.status === 'returned') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(tx.dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function overdueDays(tx) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(tx.dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86400000));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    const totalMembers = await Member.countDocuments();
    const txs = await Transaction.find().populate('book').populate('member').sort({ issueDate: -1 });

    const totalVolumes = books.reduce((s, b) => s + b.totalCopies, 0);
    const availableCopies = books.reduce((s, b) => s + b.availableCopies, 0);
    const issuedNow = txs.filter((t) => t.status === 'issued').length;
    const overdueList = txs.filter((t) => isOverdue(t));

    // House Cup: books currently borrowed per house
    const housePoints = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
    txs.filter((t) => t.status === 'issued').forEach((t) => {
      if (t.book && housePoints[t.book.house] != null) housePoints[t.book.house]++;
    });

    // Most borrowed genres (all-time)
    const genreCounts = {};
    txs.forEach((t) => {
      if (t.book) genreCounts[t.book.genre] = (genreCounts[t.book.genre] || 0) + 1;
    });
    const genreEntries = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    // Sparkline: issues per day, last 14 days
    const days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    const perDay = days.map((day) => txs.filter((t) => t.issueDate.toISOString().slice(0, 10) === day).length);

    const recent = txs.slice(0, 8).map((t) => ({
      transactionId: t.transactionId,
      book: t.book ? { title: t.book.title, icon: t.book.icon } : null,
      member: t.member ? { name: t.member.name } : null,
      status: isOverdue(t) ? 'overdue' : t.status
    }));

    const overdueBorrowers = overdueList.map((t) => ({
      transactionId: t.transactionId,
      book: t.book ? { title: t.book.title } : null,
      member: t.member ? { name: t.member.name } : null,
      dueDate: t.dueDate,
      overdueDays: overdueDays(t)
    }));

    res.json({
      totalVolumes,
      availableCopies,
      issuedNow,
      overdueCount: overdueList.length,
      totalMembers,
      totalTitles: books.length,
      housePoints,
      genreEntries,
      sparkline: { days, perDay },
      recent,
      overdueBorrowers,
      today: todayISO()
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard', error: err.message });
  }
});

module.exports = router;
