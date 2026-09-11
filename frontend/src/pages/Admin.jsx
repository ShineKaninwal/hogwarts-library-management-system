import React, { useEffect, useState } from 'react';
import client, { API_BASE } from '../api/client';
import { useUI } from '../context/UIContext';
import { HOUSES, fmtDate } from '../houses';

const HOUSE_LIST = Object.keys(HOUSES);

export default function Admin() {
  const { showToast } = useUI();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: 'all', house: 'all', from: '', to: '' });
  const [rows, setRows] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  function loadDashboard() {
    client.get('/dashboard').then((res) => setData(res.data)).catch((err) => setError(err.message));
  }

  function loadTransactions() {
    setTxLoading(true);
    const params = {};
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.house !== 'all') params.house = filters.house;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    client.get('/transactions', { params })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setTxLoading(false));
  }

  useEffect(loadDashboard, []);
  useEffect(loadTransactions, [filters]);

  async function markReturned(transactionId) {
    try {
      const res = await client.post('/transactions/return', { transactionId });
      showToast(`🪶 "${res.data.book.title}" returned by ${res.data.member.name}.`);
      loadDashboard();
      loadTransactions();
    } catch (err) {
      showToast(err.message);
    }
  }

  function resetFilters() {
    setFilters({ status: 'all', house: 'all', from: '', to: '' });
  }

  function exportUrl(kind) {
    const params = new URLSearchParams();
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.house !== 'all') params.set('house', filters.house);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    return `${API_BASE}/reports/${kind}?${params.toString()}`;
  }

  if (error) return <div className="form-error">{error}</div>;
  if (!data) return <div className="loading-state">🕯️ Unsealing the registry…</div>;

  const maxHP = Math.max(1, ...Object.values(data.housePoints));
  const maxGenre = Math.max(1, ...data.genreEntries.map(([, c]) => c));
  const { days, perDay } = data.sparkline;
  const maxDay = Math.max(1, ...perDay);
  const sparkPts = perDay.map((v, i) => `${(i / (perDay.length - 1)) * 280},${60 - (v / maxDay) * 54}`).join(' ');

  return (
    <>
      <div className="page-title"><h2>The Headmaster's Office</h2><span className="deco">registry overview & reports</span></div>

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

      <div className="subpanel" style={{ marginBottom: 22 }}>
        <h4>House Cup — Books Currently Borrowed</h4>
        <div className="house-points">
          {HOUSE_LIST.map((k) => {
            const v = data.housePoints[k];
            return (
              <div key={k} className="hp-card" style={{ background: HOUSES[k].color, color: HOUSES[k].text }}>
                <div className="hp-name">{HOUSES[k].name}</div>
                <div className="hp-num">{v}</div>
                <div className="hp-bar"><div className="hp-fill" style={{ width: `${(v / maxHP) * 100}%` }}></div></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel-2col">
        <div className="subpanel">
          <h4>Most Borrowed Subjects</h4>
          <div className="bars">
            {data.genreEntries.length === 0 && <div className="empty-state">No data yet.</div>}
            {data.genreEntries.map(([g, c]) => (
              <div className="bar-wrap" key={g}>
                <div className="bar-val">{c}</div>
                <div className="bar" style={{ height: `${(c / maxGenre) * 100}%`, background: 'linear-gradient(180deg, var(--gryffindor-gold), #8f6c17)' }}></div>
                <div className="bar-label">{g}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="subpanel">
          <h4>Issues — Last 14 Days</h4>
          <svg className="sparkline" viewBox="0 0 280 60" preserveAspectRatio="none">
            <polyline points={sparkPts} fill="none" stroke="#7f0909" strokeWidth="2.5" />
            {perDay.map((v, i) => (
              <circle key={i} cx={(i / (perDay.length - 1)) * 280} cy={60 - (v / maxDay) * 54} r="2.4" fill="#d3a625" />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
            <span>{fmtDate(days[0])}</span><span>{fmtDate(days[days.length - 1])}</span>
          </div>
        </div>
      </div>

      <div className="subpanel" style={{ marginBottom: 22 }}>
        <h4>🔥 Howlers — Overdue Alerts</h4>
        {data.overdueBorrowers.length === 0 ? (
          <div className="empty-state" style={{ padding: 16 }}><div className="ee">🦉</div>No overdue books. The library is at peace.</div>
        ) : (
          data.overdueBorrowers.map((t) => (
            <div className="howler" key={t.transactionId}>
              <span className="hb">"{t.member?.name}, RETURN '{t.book?.title}' AT ONCE!"</span>
              <span>{t.overdueDays} day{t.overdueDays === 1 ? '' : 's'} late — <button className="btn small green" style={{ padding: '3px 10px' }} onClick={() => markReturned(t.transactionId)}>Mark Returned</button></span>
            </div>
          ))
        )}
      </div>

      <div className="subpanel">
        <h4>
          Transaction Registry
          <span style={{ display: 'flex', gap: 8 }}>
            <a className="btn small gold" href={exportUrl('csv')}>⬇ Send Report by Owl (CSV)</a>
            <a className="btn small" href={exportUrl('xlsx')}>⬇ XLSX Report</a>
          </span>
        </h4>
        <div className="filters">
          <div className="field"><label>Status</label>
            <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="all">All</option><option value="issued">Issued</option><option value="overdue">Overdue</option><option value="returned">Returned</option>
            </select>
          </div>
          <div className="field"><label>House</label>
            <select value={filters.house} onChange={(e) => setFilters((f) => ({ ...f, house: e.target.value }))}>
              <option value="all">All Houses</option>
              {HOUSE_LIST.map((h) => <option key={h} value={h}>{HOUSES[h].name}</option>)}
            </select>
          </div>
          <div className="field"><label>From</label><input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></div>
          <div className="field"><label>To</label><input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></div>
          <div className="field" style={{ flex: 0 }}><button className="btn ghost small" onClick={resetFilters}>Reset</button></div>
        </div>

        {txLoading && <div className="loading-state">Fetching records…</div>}
        {!txLoading && rows.length === 0 && (
          <div className="empty-state"><div className="ee">📜</div>No records match these filters.</div>
        )}
        {!txLoading && rows.length > 0 && (
          <table className="reg">
            <thead><tr><th>Book</th><th>Reader</th><th>House</th><th>Issued</th><th>Due</th><th>Returned</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((t) => {
                const badge = t.status === 'overdue' ? 'warn' : t.status === 'returned' ? 'ok' : 'gryffindor';
                return (
                  <tr key={t.transactionId}>
                    <td>{t.book?.title || '—'}</td>
                    <td>{t.member?.name || '—'}</td>
                    <td>{t.member ? <span className="badge" style={{ background: HOUSES[t.member.house].color, color: HOUSES[t.member.house].text }}>{HOUSES[t.member.house].name}</span> : '—'}</td>
                    <td>{fmtDate(t.issueDate)}</td>
                    <td>{fmtDate(t.dueDate)}</td>
                    <td>{fmtDate(t.returnDate)}</td>
                    <td><span className={`badge ${badge}`}>{t.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
