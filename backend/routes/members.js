const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const { nextSequence } = require('../models/Counter');
const { generateQrDataUrl } = require('../utils/qr');

// GET /api/members?search=&house=
router.get('/', async (req, res) => {
  try {
    const { search = '', house = 'all' } = req.query;
    const filter = {};
    if (house && house !== 'all') filter.house = house;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const members = await Member.find(filter).sort({ name: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch members', error: err.message });
  }
});

// GET /api/members/code/:memberId
router.get('/code/:memberId', async (req, res) => {
  try {
    const member = await Member.findOne({ memberId: req.params.memberId.toUpperCase() });
    if (!member) return res.status(404).json({ message: 'No reader found with that ID.' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Lookup failed', error: err.message });
  }
});

// GET /api/members/:id/qr
router.get('/:id/qr', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    const dataUrl = await generateQrDataUrl(`MEMBER:${member.memberId}`);
    res.json({ dataUrl, payload: `MEMBER:${member.memberId}` });
  } catch (err) {
    res.status(500).json({ message: 'QR generation failed', error: err.message });
  }
});

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(400).json({ message: 'Invalid member id', error: err.message });
  }
});

// POST /api/members
router.post('/', async (req, res) => {
  try {
    const { name, house, email } = req.body;
    if (!name || !house) return res.status(400).json({ message: 'name and house are required.' });
    const seq = await nextSequence('memberId');
    const memberId = 'M' + String(seq).padStart(4, '0');
    const member = await Member.create({ memberId, name, house, email: email || '' });
    res.status(201).json(member);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Failed to create member', error: err.message });
  }
});

// PUT /api/members/:id
router.put('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    const { name, house, email } = req.body;
    if (name != null) member.name = name;
    if (house != null) member.house = house;
    if (email != null) member.email = email;
    await member.save();
    res.json(member);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Failed to update member', error: err.message });
  }
});

// DELETE /api/members/:id  (only when safe — no active loans)
router.delete('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const activeLoans = await Transaction.countDocuments({ member: member._id, status: 'issued' });
    if (activeLoans > 0) {
      return res.status(400).json({
        message: `Cannot delete ${member.name} — they currently have ${activeLoans} book(s) on loan.`
      });
    }

    await member.deleteOne();
    res.json({ message: 'Member deleted', memberId: member.memberId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete member', error: err.message });
  }
});

module.exports = router;
