require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const booksRouter = require('./routes/books');
const membersRouter = require('./routes/members');
const transactionsRouter = require('./routes/transactions');
const dashboardRouter = require('./routes/dashboard');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hogwarts_library';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbState: mongoose.connection.readyState });
});

app.use('/api/books', booksRouter);
app.use('/api/members', membersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

// Fallback error handler — ensures the app never crashes on an unexpected error.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('📚 Connected to MongoDB:', MONGODB_URI);
    app.listen(PORT, () => console.log(`🏰 Hogwarts Library backend listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Make sure MongoDB is running and MONGODB_URI is correct in backend/.env');
    process.exit(1);
  });
