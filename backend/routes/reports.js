const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
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

async function buildRows(query) {
  const { status = 'all', house = 'all', from = '', to = '' } = query;
  const filter = {};
  if (from || to) {
    filter.issueDate = {};
    if (from) filter.issueDate.$gte = new Date(from);
    if (to) filter.issueDate.$lte = new Date(to);
  }
  let txs = await Transaction.find(filter).populate('book').populate('member').sort({ issueDate: -1 });

  if (house !== 'all') txs = txs.filter((t) => t.book && t.book.house === house);

  return txs
    .map((t) => {
      const derivedStatus = isOverdue(t) ? 'overdue' : t.status;
      return {
        'Transaction ID': t.transactionId,
        'Book ID': t.book ? t.book.bookId : '',
        'Book Title': t.book ? t.book.title : '',
        Author: t.book ? t.book.author : '',
        Borrower: t.member ? t.member.name : '',
        'Issue Date': t.issueDate ? t.issueDate.toISOString().slice(0, 10) : '',
        'Due Date': t.dueDate ? t.dueDate.toISOString().slice(0, 10) : '',
        'Return Date': t.returnDate ? t.returnDate.toISOString().slice(0, 10) : '',
        Status: derivedStatus,
        'Overdue Days': derivedStatus === 'overdue' ? overdueDays(t) : 0
      };
    })
    .filter((row) => (status === 'all' ? true : row.Status === status));
}

// GET /api/reports/csv
router.get('/csv', async (req, res) => {
  try {
    const rows = await buildRows(req.query);
    const fields = [
      'Transaction ID', 'Book ID', 'Book Title', 'Author', 'Borrower',
      'Issue Date', 'Due Date', 'Return Date', 'Status', 'Overdue Days'
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment(`hogwarts-library-report-${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate CSV report', error: err.message });
  }
});

// GET /api/reports/xlsx
router.get('/xlsx', async (req, res) => {
  try {
    const rows = await buildRows(req.query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transactions');

    sheet.columns = [
      { header: 'Transaction ID', key: 'Transaction ID', width: 16 },
      { header: 'Book ID', key: 'Book ID', width: 12 },
      { header: 'Book Title', key: 'Book Title', width: 32 },
      { header: 'Author', key: 'Author', width: 24 },
      { header: 'Borrower', key: 'Borrower', width: 22 },
      { header: 'Issue Date', key: 'Issue Date', width: 14 },
      { header: 'Due Date', key: 'Due Date', width: 14 },
      { header: 'Return Date', key: 'Return Date', width: 14 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Overdue Days', key: 'Overdue Days', width: 14 }
    ];
    sheet.getRow(1).font = { bold: true };
    rows.forEach((r) => sheet.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=hogwarts-library-report-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate XLSX report', error: err.message });
  }
});

module.exports = router;
