const mongoose = require('mongoose');
const { HOUSES } = require('./Book');

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, unique: true, index: true }, // e.g. M0001
    name: { type: String, required: [true, 'Name is required'], trim: true },
    house: { type: String, required: true, enum: HOUSES },
    email: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);
