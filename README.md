# The Hogwarts Library Registry

A full-stack Hogwarts-themed library management system.

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose

The visual design (parchment/wood theme, house colors, candles, book spines, the
"enchanted mirror" QR scanner, etc.) is ported directly from the original
`hogwarts-library.html` reference and preserved as closely as possible.

## Project structure

```
Hogwarts/
  backend/     Express API + Mongoose models
  frontend/    React (Vite) app
```

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongod`, Docker, or MongoDB Atlas)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env if your MongoDB URI is different from the default:
# MONGODB_URI=mongodb://127.0.0.1:27017/hogwarts_library

npm run seed     # populates sample Hogwarts books/members/transactions
npm run dev      # starts the API on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api  (default is already correct)

npm run dev      # starts the app on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Features

- **The Shelves** — book catalog: search, filter by house, add/edit/delete books,
  automatic Book IDs (B0001, B0002…), QR tag per book.
- **Reader Registry (Members)** — search, filter, add/edit/delete readers
  (delete is blocked while they have an active loan), automatic Reader IDs
  (M0001…), QR card per reader.
- **Issue a Book** — scan or manually select a book, then a reader, choose a
  loan period, and issue. Prevents issuing unavailable books, duplicate active
  loans for the same book/reader, and copies going negative.
- **Return a Book** — scan or pick from the active-loans table. Increments
  available copies and records the return date/time.
- **Headmaster's Office (Dashboard)** — total volumes, available copies,
  currently issued, overdue count, overdue "Howlers" list with correct
  overdue-day counts, House Cup, genre stats, a 14-day issues sparkline, a
  filterable transaction registry, and CSV/XLSX export.
- **Library Tags** — generate a scannable QR for any book or reader on demand.

QR scanning uses the device camera via `html5-qrcode`; if the camera is
unavailable or permission is denied, the UI shows a clear message and manual
selection remains fully functional — scanning failures never break the app.

## Known limitations / things to double-check on your machine

1. **I could not test against a live MongoDB in the sandbox that built this
   project** — the sandbox's network is locked to a small domain allowlist
   that excludes MongoDB's binary/download servers, so no `mongod` could be
   started there. Every backend file was syntax-checked, all modules load
   cleanly, and the Express app boots and mounts every route — but the actual
   database read/write paths have **not** been exercised end-to-end. Run
   `npm run seed` and click through each tab first thing to confirm.
2. Issue/return logic deliberately avoids Mongoose multi-document
   **transactions** (`session.withTransaction`) because those require MongoDB
   to run as a replica set, which a plain local `mongod` is not. Instead it
   uses atomic `findOneAndUpdate` guards (won't double-issue a book, won't go
   negative, won't double-return) — safe for a standalone MongoDB, but not
   full ACID across the book+transaction write pair. For a single-library app
   this is a reasonable and common trade-off.
3. No authentication/login was added, per your instructions — anyone with
   access to the frontend can manage the full registry.
4. The production JS bundle is ~680KB (Vite warns above 500KB); harmless for
   this app's scope, but could be code-split later if it matters.
