import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function Tags() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [bookId, setBookId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [bookQr, setBookQr] = useState(null);
  const [memberQr, setMemberQr] = useState(null);

  useEffect(() => {
    client.get('/books').then((res) => {
      setBooks(res.data);
      if (res.data.length) setBookId(res.data[0]._id);
    });
    client.get('/members').then((res) => {
      setMembers(res.data);
      if (res.data.length) setMemberId(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!bookId) return;
    client.get(`/books/${bookId}/qr`).then((res) => setBookQr(res.data.dataUrl)).catch(() => setBookQr(null));
  }, [bookId]);

  useEffect(() => {
    if (!memberId) return;
    client.get(`/members/${memberId}/qr`).then((res) => setMemberQr(res.data.dataUrl)).catch(() => setMemberQr(null));
  }, [memberId]);

  const selectedBook = books.find((b) => b._id === bookId);
  const selectedMember = members.find((m) => m._id === memberId);

  return (
    <>
      <div className="page-title"><h2>Library Tags</h2><span className="deco">printable QR tags for books & reader cards</span></div>
      <p style={{ color: 'var(--ink-soft)', maxWidth: '70ch', marginBottom: 18 }}>
        Generate a QR tag for any book (stick it inside the cover) or reader (their library card). Scan these from
        the Issue and Return pages using the enchanted mirror.
      </p>

      <div className="row">
        <div className="field">
          <label>Book tag</label>
          <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
            {books.map((b) => <option key={b._id} value={b._id}>{b.icon} {b.title}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Reader card</label>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="panel-split">
        <div className="scan-card">
          <h4>Book QR</h4>
          <div className="qr-box">
            {bookQr ? <img src={bookQr} alt="Book QR" /> : <span style={{ color: 'var(--ink-soft)' }}>—</span>}
          </div>
          <div style={{ fontFamily: "'Cinzel Decorative',serif", color: 'var(--gryffindor)' }}>
            {selectedBook ? `${selectedBook.icon} ${selectedBook.title}` : ''}
          </div>
        </div>
        <div className="scan-card">
          <h4>Reader Card QR</h4>
          <div className="qr-box">
            {memberQr ? <img src={memberQr} alt="Member QR" /> : <span style={{ color: 'var(--ink-soft)' }}>—</span>}
          </div>
          <div style={{ fontFamily: "'Cinzel Decorative',serif", color: 'var(--gryffindor)' }}>
            {selectedMember ? selectedMember.name : ''}
          </div>
        </div>
      </div>
    </>
  );
}
