import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function GreatHall({ goTo }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <div className="page-title">
        <h2>Welcome to the Great Hall</h2>
        <span className="deco">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      <p style={{ margin: '10px 0 22px', color: 'var(--ink-soft)', maxWidth: '70ch' }}>
        A quick look at the state of the library today — how many volumes rest on the shelves, how many are out in
        the hands of witches and wizards, and which are overdue for the Restricted Section's ire.
      </p>

      {error && <div className="form-error">{error}</div>}
      {!data && !error && <div className="loading-state">🕯️ Unsealing the registry…</div>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat-card"><span className="stat-ic">📚</span><div className="stat-num">{data.totalVolumes}</div><div className="stat-label">Total Volumes</div></div>
            <div className="stat-card"><span className="stat-ic">✅</span><div className="stat-num">{data.availableCopies}</div><div className="stat-label">On the Shelf</div></div>
            <div className="stat-card"><span className="stat-ic">✒️</span><div className="stat-num">{data.issuedNow}</div><div className="stat-label">Currently Issued</div></div>
            <div className="stat-card">
              <span className="stat-ic">🔥</span>
              <div className="stat-num" style={{ color: data.overdueCount ? 'var(--warn)' : 'var(--ok)' }}>{data.overdueCount}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>

          <div className="panel-2col">
            <div className="subpanel">
              <h4>Recent Registry Entries</h4>
              <table className="reg">
                <thead><tr><th>Book</th><th>Reader</th><th>Status</th></tr></thead>
                <tbody>
                  {data.recent.map((t) => {
                    const badge = t.status === 'overdue' ? 'warn' : t.status === 'returned' ? 'ok' : 'gryffindor';
                    return (
                      <tr key={t.transactionId}>
                        <td>{t.book ? `${t.book.icon} ${t.book.title}` : '—'}</td>
                        <td>{t.member ? t.member.name : '—'}</td>
                        <td><span className={`badge ${badge}`}>{t.status}</span></td>
                      </tr>
                    );
                  })}
                  {data.recent.length === 0 && (
                    <tr><td colSpan={3} className="empty-state">No transactions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="subpanel">
              <h4>Quick Spellwork</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn" onClick={() => goTo('issue')}>✒️ Issue a Book</button>
                <button className="btn green" onClick={() => goTo('return')}>🪶 Return a Book</button>
                <button className="btn gold" onClick={() => goTo('admin')}>🗺️ Open Headmaster's Office</button>
              </div>
              <p style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-soft)' }}>
                Tip: use the Library Tags page to generate a scannable QR for any book or reader's card.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
