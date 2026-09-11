// Seeds the database with sample Hogwarts-themed data.
// Run with: npm run seed   (from the backend/ folder)
require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');
const Member = require('./models/Member');
const Transaction = require('./models/Transaction');
const { Counter } = require('./models/Counter');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hogwarts_library';

const booksSeed = [
  { n: 1, title: 'Hogwarts: A History', author: 'Bathilda Bagshot', genre: 'History', house: 'ravenclaw', total: 3, available: 1, icon: '📖' },
  { n: 2, title: 'The Standard Book of Spells, Grade 1', author: 'Miranda Goshawk', genre: 'Charms', house: 'gryffindor', total: 5, available: 5, icon: '✨' },
  { n: 3, title: 'Magical Theory', author: 'Adalbert Waffling', genre: 'Theory', house: 'ravenclaw', total: 2, available: 0, icon: '🔮' },
  { n: 4, title: 'A History of Magic', author: 'Bathilda Bagshot', genre: 'History', house: 'ravenclaw', total: 4, available: 3, icon: '📜' },
  { n: 5, title: 'Fantastic Beasts and Where to Find Them', author: 'Newt Scamander', genre: 'Magical Creatures', house: 'hufflepuff', total: 4, available: 2, icon: '🦄' },
  { n: 6, title: 'Advanced Potion-Making', author: 'Libatius Borage', genre: 'Potions', house: 'slytherin', total: 3, available: 1, icon: '🧪' },
  { n: 7, title: 'One Thousand Magical Herbs and Fungi', author: 'Phyllida Spore', genre: 'Herbology', house: 'hufflepuff', total: 3, available: 3, icon: '🌿' },
  { n: 8, title: 'Quidditch Through the Ages', author: 'Kennilworthy Whisp', genre: 'Sport', house: 'gryffindor', total: 4, available: 4, icon: '🧹' },
  { n: 9, title: 'The Dark Forces: A Guide to Self-Protection', author: 'Quentin Trimble', genre: 'Defence Against the Dark Arts', house: 'gryffindor', total: 2, available: 0, icon: '🛡️' },
  { n: 10, title: 'Unfogging the Future', author: 'Cassandra Vablatsky', genre: 'Divination', house: 'ravenclaw', total: 2, available: 2, icon: '🌙' },
  { n: 11, title: 'Numerology and Grammatica', author: 'Unknown', genre: 'Arithmancy', house: 'ravenclaw', total: 2, available: 1, icon: '🔢' },
  { n: 12, title: 'Moste Potente Potions', author: 'Unknown (Restricted)', genre: 'Potions', house: 'slytherin', total: 1, available: 0, icon: '☠️' },
  { n: 13, title: 'The Monster Book of Monsters', author: 'Newt Scamander', genre: 'Magical Creatures', house: 'hufflepuff', total: 3, available: 2, icon: '📕' },
  { n: 14, title: 'Intermediate Transfiguration', author: 'Emeric Switch', genre: 'Transfiguration', house: 'gryffindor', total: 3, available: 2, icon: '🐈' }
];

const membersSeed = [
  { n: 1, name: 'Hermione Granger', house: 'gryffindor' },
  { n: 2, name: 'Harry Potter', house: 'gryffindor' },
  { n: 3, name: 'Ron Weasley', house: 'gryffindor' },
  { n: 4, name: 'Draco Malfoy', house: 'slytherin' },
  { n: 5, name: 'Luna Lovegood', house: 'ravenclaw' },
  { n: 6, name: 'Cedric Diggory', house: 'hufflepuff' },
  { n: 7, name: 'Padma Patil', house: 'ravenclaw' },
  { n: 8, name: 'Blaise Zabini', house: 'slytherin' }
];

function d(offset) {
  const t = new Date();
  t.setDate(t.getDate() + offset);
  return t;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Clearing existing data...');
  await Promise.all([Book.deleteMany({}), Member.deleteMany({}), Transaction.deleteMany({}), Counter.deleteMany({})]);

  const bookDocs = await Book.insertMany(
    booksSeed.map((b) => ({
      bookId: 'B' + String(b.n).padStart(4, '0'),
      title: b.title,
      author: b.author,
      genre: b.genre,
      house: b.house,
      totalCopies: b.total,
      availableCopies: b.available,
      icon: b.icon
    }))
  );
  await Counter.findByIdAndUpdate('bookId', { seq: booksSeed.length }, { upsert: true });

  const memberDocs = await Member.insertMany(
    membersSeed.map((m) => ({
      memberId: 'M' + String(m.n).padStart(4, '0'),
      name: m.name,
      house: m.house
    }))
  );
  await Counter.findByIdAndUpdate('memberId', { seq: membersSeed.length }, { upsert: true });

  const findBook = (n) => bookDocs.find((b) => b.bookId === 'B' + String(n).padStart(4, '0'));
  const findMember = (n) => memberDocs.find((m) => m.memberId === 'M' + String(n).padStart(4, '0'));

  const txSeed = [
    { bn: 1, mn: 1, issue: -20, due: -6, ret: null },
    { bn: 3, mn: 4, issue: -18, due: -4, ret: null },
    { bn: 6, mn: 6, issue: -10, due: 4, ret: null },
    { bn: 9, mn: 2, issue: -16, due: -2, ret: null },
    { bn: 12, mn: 4, issue: -3, due: 11, ret: null },
    { bn: 5, mn: 5, issue: -5, due: 9, ret: null },
    { bn: 5, mn: 7, issue: -30, due: -16, ret: -15 },
    { bn: 2, mn: 8, issue: -25, due: -11, ret: -12 },
    { bn: 14, mn: 3, issue: -8, due: 6, ret: null },
    { bn: 14, mn: 6, issue: -40, due: -26, ret: -24 },
    { bn: 11, mn: 5, issue: -2, due: 12, ret: null },
    { bn: 4, mn: 1, issue: -45, due: -31, ret: -33 }
  ];

  const txDocs = txSeed.map((t, i) => ({
    transactionId: 'T' + String(i + 1).padStart(6, '0'),
    book: findBook(t.bn)._id,
    member: findMember(t.mn)._id,
    issueDate: d(t.issue),
    dueDate: d(t.due),
    returnDate: t.ret != null ? d(t.ret) : null,
    status: t.ret != null ? 'returned' : 'issued'
  }));
  await Transaction.insertMany(txDocs);
  await Counter.findByIdAndUpdate('transactionId', { seq: txSeed.length }, { upsert: true });

  console.log(`Seeded ${bookDocs.length} books, ${memberDocs.length} members, ${txDocs.length} transactions.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
