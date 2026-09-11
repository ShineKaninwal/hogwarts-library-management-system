const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true }, // e.g. T000001
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: { type: String, enum: ['issued', 'returned'], default: 'issued', index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
