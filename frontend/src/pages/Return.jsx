import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useUI } from '../context/UIContext';
import { fmtDate } from '../houses';
import QRScanner from '../components/QRScanner';

export default function Return() {
  const { showToast } = useUI();
  const [active, setActive] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    client.get('/transactions/active')
      .then((res) => setActive(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function doReturn({ transactionId, bookCode }) {
    setError('');
    try {
      const res = await client.post('/transactions/return', transactionId ? { transactionId } : { bookCode });
      showToast(`🪶 "${res.data.book.title}" returned by ${res.data.member.name}.${res.data.wasOverdue ? ' (was overdue)' : ''}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleScan(text) {
    doReturn({ bookCode: text.replace('BOOK:', '').trim() });
  }

  return (
    <>
      <div className="page-title">
        <h2>Return a Book</h2>
        <span className="deco">{active.length} volumes currently out</span>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel-split">
        <div className="scan-card">
          <h4>📖 Scan the Book Being Returned</h4>
          <QRScanner label="Open Enchanted Mirror" onDecode={handleScan} />
        </div>

        <div className="scan-card" style={{ textAlign: 'left' }}>
          <h4 style={{ textAlign: 'center' }}>📋 Or Pick From Active Loans</h4>
          {loading && <div className="loading-state">Fetching active loans…</div>}
          {!loading && active.length === 0 && (
            <div className="empty-state"><div className="ee">🦉</div>No books are currently on loan.</div>
          )}
          {!loading && active.length > 0 && (
            <table className="reg">
              <thead><tr><th>Book</th><th>Reader</th><th>Due</th><th></th></tr></thead>
              <tbody>
                {active.map((t) => (
                  <tr key={t.transactionId}>
                    <td>{t.book?.icon} {t.book?.title}</td>
                    <td>{t.member?.name}</td>
                    <td><span className={`badge ${t.status === 'overdue' ? 'warn' : 'ok'}`}>{fmtDate(t.dueDate)}</span></td>
                    <td><button className="btn small green" onClick={() => doReturn({ transactionId: t.transactionId })}>Return</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
