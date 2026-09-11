import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useUI } from '../context/UIContext';
import { HOUSES, fmtDate } from '../houses';
import QRScanner from '../components/QRScanner';

export default function Issue() {
  const { showToast } = useUI();
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [selBook, setSelBook] = useState(null); // { bookId, title, icon, availableCopies, totalCopies }
  const [selMember, setSelMember] = useState(null); // { memberId, name, house }
  const [loanDays, setLoanDays] = useState('14');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function loadLists() {
    client.get('/books').then((res) => setBooks(res.data)).catch(() => {});
    client.get('/members').then((res) => setMembers(res.data)).catch(() => {});
  }

  useEffect(loadLists, []);

  function pickBookById(bookId) {
    const b = books.find((x) => x.bookId === bookId.toUpperCase());
    if (!b) { showToast('That tag does not match any book in the registry.'); return; }
    if (b.availableCopies <= 0) { showToast(`All copies of "${b.title}" are currently out.`); return; }
    setSelBook(b);
  }

  function pickMemberById(memberId) {
    const m = members.find((x) => x.memberId === memberId.toUpperCase());
    if (!m) { showToast('That card does not match any reader in the registry.'); return; }
    setSelMember(m);
  }

  function handleBookScan(text) {
    pickBookById(text.replace('BOOK:', '').trim());
  }
  function handleMemberScan(text) {
    pickMemberById(text.replace('MEMBER:', '').trim());
  }

  async function confirmIssue() {
    setError('');
    setSubmitting(true);
    try {
      const res = await client.post('/transactions/issue', {
        bookCode: selBook.bookId,
        memberCode: selMember.memberId,
        loanDays
      });
      showToast(`📜 "${res.data.book.title}" issued to ${res.data.member.name}. Due ${fmtDate(res.data.dueDate)}.`);
      setSelBook(null);
      setSelMember(null);
      loadLists();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <h2>Issue a Book</h2>
        <span className="deco">scan the book, then the reader's card</span>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel-split">
        <div className="scan-card">
          <h4>📕 Step 1 — Scan the Book</h4>
          <QRScanner label="Open Enchanted Mirror" onDecode={handleBookScan} />
          <div className="divider-or">— or select manually —</div>
          <select value={selBook?.bookId || ''} onChange={(e) => e.target.value && pickBookById(e.target.value)}>
            <option value="">Choose a book…</option>
            {books.map((b) => (
              <option key={b._id} value={b.bookId} disabled={b.availableCopies <= 0}>
                {b.icon} {b.title}{b.availableCopies <= 0 ? ' (out)' : ''}
              </option>
            ))}
          </select>
          {selBook && (
            <div className="selected-card">
              <span className="sc-icon">{selBook.icon}</span>
              <div>
                <div className="sc-name">{selBook.title}</div>
                <div className="sc-sub">{selBook.availableCopies} of {selBook.totalCopies} available</div>
              </div>
            </div>
          )}
        </div>

        <div className="scan-card">
          <h4>🪪 Step 2 — Scan the Reader's Card</h4>
          <QRScanner label="Open Enchanted Mirror" onDecode={handleMemberScan} />
          <div className="divider-or">— or select manually —</div>
          <select value={selMember?.memberId || ''} onChange={(e) => e.target.value && pickMemberById(e.target.value)}>
            <option value="">Choose a reader…</option>
            {members.map((m) => (
              <option key={m._id} value={m.memberId}>{m.name} ({HOUSES[m.house].name})</option>
            ))}
          </select>
          {selMember && (
            <div className="selected-card">
              <span className="sc-icon">🪄</span>
              <div>
                <div className="sc-name">{selMember.name}</div>
                <div className="sc-sub">{HOUSES[selMember.house].name}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="row" style={{ marginTop: 20 }}>
        <div className="field">
          <label>Loan period</label>
          <select value={loanDays} onChange={(e) => setLoanDays(e.target.value)}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
      </div>

      <button
        className="btn"
        style={{ marginTop: 6 }}
        disabled={!selBook || !selMember || submitting}
        onClick={confirmIssue}
      >
        {submitting ? 'Issuing…' : '✒️ Confirm & Issue Book'}
      </button>
    </>
  );
}
