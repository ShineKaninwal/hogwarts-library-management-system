import React, { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import { useUI } from '../context/UIContext';
import { HOUSES } from '../houses';

const HOUSE_LIST = Object.keys(HOUSES);

// Deterministic pseudo-random "look" for a book spine, derived from its id,
// so every render/reload gives the same book the same size/tilt (no flicker)
// while still producing a natural, irregular library shelf.
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h;
}
function spineVariant(id) {
  const h = hashCode(String(id));
  const width = 50 + (h % 18); // 50–67px
  const height = 172 + ((h >> 3) % 42); // 172–213px
  const rotate = (((h >> 7) % 5) - 2) * 0.8; // -1.6..1.6deg
  const lift = ((h >> 11) % 9) - 4; // -4..4px baseline stagger
  return { width, height, rotate, lift };
}

const GENRE_ICONS = {
  History: '📜', Charms: '✨', Theory: '🔮', 'Magical Creatures': '🦄',
  Potions: '🧪', Herbology: '🌿', Sport: '🧹', 'Defence Against the Dark Arts': '🛡️',
  Divination: '🌙', Arithmancy: '🔢', Transfiguration: '🐈'
};

export default function Shelves({ goTo }) {
  const { openModal, closeModal, showToast } = useUI();
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [house, setHouse] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    client.get('/books', { params: { search: query, house } })
      .then((res) => { setBooks(res.data); setError(''); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, house]);

  useEffect(() => {
    const t = setTimeout(load, 200); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  function openAddBook() {
    openModal(<BookForm mode="add" onDone={() => { closeModal(); load(); }} onCancel={closeModal} showToast={showToast} />);
  }

  function openBookDetail(book) {
    openModal(
      <BookDetail
        book={book}
        onClose={closeModal}
        onEdit={() => openModal(<BookForm mode="edit" book={book} onDone={() => { closeModal(); load(); }} onCancel={closeModal} showToast={showToast} />)}
        onDeleted={() => { closeModal(); load(); }}
        onIssue={() => { closeModal(); goTo('issue'); }}
        showToast={showToast}
      />
    );
  }

  const genres = [...new Set(books.map((b) => b.genre))];

  return (
    <>
      <div className="page-title">
        <h2>The Shelves</h2>
        <span className="deco">{books.length} titles catalogued</span>
      </div>

      <div className="page-title" style={{ border: 'none', marginBottom: 0, paddingBottom: 0 }}>
        <div style={{ flex: 1 }}></div>
        <button className="btn gold small" onClick={openAddBook}>➕ Add New Book</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search by title or author…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chip-row">
        <button className={`chip${house === 'all' ? ' active' : ''}`} data-h="all" onClick={() => setHouse('all')}>All Houses</button>
        {HOUSE_LIST.map((h) => (
          <button key={h} className={`chip${house === h ? ' active' : ''}`} data-h={h} onClick={() => setHouse(h)}>
            {HOUSES[h].name}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="loading-state">🕯️ Fetching the shelves…</div>}

      {!loading && books.length === 0 && (
        <div className="empty-state"><div className="ee">🕯️</div>No volumes match your search. Perhaps try a Summoning Charm — or a different word.</div>
      )}

      {!loading && genres.map((g) => (
        <div className="shelf" key={g}>
          <div className="shelf-label">{g}</div>
          <div className="shelf-row">
            {books.filter((b) => b.genre === g).map((b) => {
              const { width, height, rotate, lift } = spineVariant(b._id);
              const unavailable = b.availableCopies <= 0;
              const h = HOUSES[b.house];
              return (
                <button
                  key={b._id}
                  className={`spine h-${b.house}${unavailable ? ' unavailable' : ''}`}
                  style={{
                    width: `${width}px`,
                    minHeight: `${height}px`,
                    '--spine-rot': `${rotate}deg`,
                    '--spine-lift': `${lift}px`
                  }}
                  onClick={() => openBookDetail(b)}
                  aria-label={b.title}
                >
                  <span className="spine-band spine-band-top"></span>
                  <span className="spine-title">{b.title}</span>
                  <span className="spine-band spine-band-bottom"></span>
                  <span className="spine-dot"></span>
                  {unavailable && <span className="spine-out">OUT</span>}
                  <span className="spine-tooltip">
                    <span className="tt-title">{b.title}</span>
                    <span className="tt-author">by {b.author}</span>
                    <span className="badge" style={{ background: h.color, color: h.text }}>{h.name}</span>
                    <div className="tt-copies">{b.availableCopies} of {b.totalCopies} available</div>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="shelf-board"></div>
        </div>
      ))}
    </>
  );
}

function BookDetail({ book, onClose, onEdit, onDeleted, onIssue, showToast }) {
  const h = HOUSES[book.house];
  const [qr, setQr] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    client.get(`/books/${book._id}/qr`).then((res) => setQr(res.data.dataUrl)).catch(() => {});
  }, [book._id]);

  async function handleDelete() {
    if (!window.confirm(`Remove "${book.title}" from the registry?`)) return;
    try {
      await client.delete(`/books/${book._id}`);
      showToast(`🗑️ "${book.title}" removed from the registry.`);
      onDeleted();
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  return (
    <>
      <button className="close-x" onClick={onClose}>✕</button>
      <div style={{ fontSize: 34 }}>{book.icon}</div>
      <h3>{book.title}</h3>
      <div className="muted">by {book.author} · ID: {book.bookId}</div>
      <span className="badge" style={{ background: h.color, color: h.text }}>{h.name}</span>{' '}
      <span className={`badge ${book.availableCopies > 0 ? 'ok' : 'warn'}`}>
        {book.availableCopies > 0 ? `${book.availableCopies} available` : 'all copies out'}
      </span>
      <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.6 }}>
        <strong>Genre:</strong> {book.genre}<br />
        <strong>Total copies:</strong> {book.totalCopies}<br />
        <strong>Currently on loan:</strong> {book.totalCopies - book.availableCopies}
      </div>

      <div className="qr-box">
        {qr ? <img src={qr} alt="Book QR tag" /> : <span style={{ color: 'var(--ink-soft)' }}>Generating tag…</span>}
      </div>

      {deleteError && <div className="form-error">{deleteError}</div>}

      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={onIssue} disabled={book.availableCopies <= 0}>✒️ Issue this book</button>
        <button className="btn gold" onClick={onEdit}>✏️ Edit</button>
        <button className="btn ghost" onClick={handleDelete}>🗑️ Delete</button>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
    </>
  );
}

function BookForm({ mode, book, onDone, onCancel, showToast }) {
  const [form, setForm] = useState({
    title: book?.title || '',
    author: book?.author || '',
    genre: book?.genre || '',
    house: book?.house || 'gryffindor',
    totalCopies: book?.totalCopies ?? 1,
    availableCopies: book?.availableCopies ?? 1
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.title || !form.author || !form.genre) {
      setError('Title, author, and genre are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        author: form.author,
        genre: form.genre,
        house: form.house,
        totalCopies: Number(form.totalCopies),
        icon: GENRE_ICONS[form.genre] || '📖'
      };
      if (mode === 'add') {
        payload.availableCopies = Number(form.totalCopies);
        const res = await client.post('/books', payload);
        showToast(`📖 "${res.data.title}" added to the registry (${res.data.bookId}).`);
      } else {
        payload.availableCopies = Number(form.availableCopies);
        const res = await client.put(`/books/${book._id}`, payload);
        showToast(`✏️ "${res.data.title}" updated.`);
      }
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <button type="button" className="close-x" onClick={onCancel}>✕</button>
      <h3>{mode === 'add' ? 'Add a New Volume' : `Edit "${book.title}"`}</h3>
      <div className="muted">{mode === 'add' ? 'A unique Book ID and QR tag will be generated automatically.' : `Book ID: ${book.bookId}`}</div>

      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label>Title</label>
        <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="field">
        <label>Author</label>
        <input type="text" value={form.author} onChange={(e) => set('author', e.target.value)} />
      </div>
      <div className="row">
        <div className="field">
          <label>Genre</label>
          <input type="text" list="genreOptions" value={form.genre} onChange={(e) => set('genre', e.target.value)} placeholder="e.g. Charms" />
          <datalist id="genreOptions">
            {Object.keys(GENRE_ICONS).map((g) => <option key={g} value={g} />)}
          </datalist>
        </div>
        <div className="field">
          <label>House</label>
          <select value={form.house} onChange={(e) => set('house', e.target.value)}>
            {HOUSE_LIST.map((h) => <option key={h} value={h}>{HOUSES[h].name}</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label>Total Copies</label>
          <input type="number" min="1" value={form.totalCopies} onChange={(e) => set('totalCopies', e.target.value)} />
        </div>
        {mode === 'edit' && (
          <div className="field">
            <label>Available Copies</label>
            <input type="number" min="0" max={form.totalCopies} value={form.availableCopies} onChange={(e) => set('availableCopies', e.target.value)} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : (mode === 'add' ? '📖 Add Book' : '💾 Save Changes')}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
