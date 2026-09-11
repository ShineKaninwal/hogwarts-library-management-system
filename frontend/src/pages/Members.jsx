import React, { useCallback, useEffect, useState } from 'react';
import client from '../api/client';
import { useUI } from '../context/UIContext';
import { HOUSES } from '../houses';

const HOUSE_LIST = Object.keys(HOUSES);

export default function Members() {
  const { openModal, closeModal, showToast } = useUI();
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [house, setHouse] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    client.get('/members', { params: { search: query, house } })
      .then((res) => { setMembers(res.data); setError(''); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, house]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  function openAdd() {
    openModal(<MemberForm mode="add" onDone={() => { closeModal(); load(); }} onCancel={closeModal} showToast={showToast} />);
  }

  function openDetail(member) {
    openModal(
      <MemberDetail
        member={member}
        onClose={closeModal}
        onEdit={() => openModal(<MemberForm mode="edit" member={member} onDone={() => { closeModal(); load(); }} onCancel={closeModal} showToast={showToast} />)}
        onDeleted={() => { closeModal(); load(); }}
        showToast={showToast}
      />
    );
  }

  return (
    <>
      <div className="page-title">
        <h2>Reader Registry</h2>
        <span className="deco">{members.length} readers enrolled</span>
      </div>

      <div className="page-title" style={{ border: 'none', marginBottom: 0, paddingBottom: 0 }}>
        <div style={{ flex: 1 }}></div>
        <button className="btn gold small" onClick={openAdd}>➕ Add New Reader</button>
      </div>

      <div className="search-bar">
        <input type="text" placeholder="🔍 Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="chip-row">
        <button className={`chip${house === 'all' ? ' active' : ''}`} data-h="all" onClick={() => setHouse('all')}>All Houses</button>
        {HOUSE_LIST.map((h) => (
          <button key={h} className={`chip${house === h ? ' active' : ''}`} data-h={h} onClick={() => setHouse(h)}>{HOUSES[h].name}</button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="loading-state">🕯️ Fetching the registry…</div>}
      {!loading && members.length === 0 && (
        <div className="empty-state"><div className="ee">🦉</div>No readers match your search.</div>
      )}

      {!loading && members.map((m) => (
        <div className="member-card" key={m._id}>
          <div className="mc-left">
            <span className="mc-avatar">🪄</span>
            <div>
              <div className="mc-name">{m.name}</div>
              <div className="mc-sub">{m.memberId} · <span className="badge" style={{ background: HOUSES[m.house].color, color: HOUSES[m.house].text }}>{HOUSES[m.house].name}</span></div>
            </div>
          </div>
          <button className="link-btn" onClick={() => openDetail(m)}>View / Manage →</button>
        </div>
      ))}
    </>
  );
}

function MemberDetail({ member, onClose, onEdit, onDeleted, showToast }) {
  const [qr, setQr] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const h = HOUSES[member.house];

  useEffect(() => {
    client.get(`/members/${member._id}/qr`).then((res) => setQr(res.data.dataUrl)).catch(() => {});
  }, [member._id]);

  async function handleDelete() {
    if (!window.confirm(`Remove ${member.name} from the registry?`)) return;
    try {
      await client.delete(`/members/${member._id}`);
      showToast(`🗑️ ${member.name} removed from the registry.`);
      onDeleted();
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  return (
    <>
      <button className="close-x" onClick={onClose}>✕</button>
      <div style={{ fontSize: 34 }}>🪄</div>
      <h3>{member.name}</h3>
      <div className="muted">Reader ID: {member.memberId}{member.email ? ` · ${member.email}` : ''}</div>
      <span className="badge" style={{ background: h.color, color: h.text }}>{h.name}</span>

      <div className="qr-box">
        {qr ? <img src={qr} alt="Reader card QR" /> : <span style={{ color: 'var(--ink-soft)' }}>Generating card…</span>}
      </div>

      {deleteError && <div className="form-error">{deleteError}</div>}

      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn gold" onClick={onEdit}>✏️ Edit</button>
        <button className="btn ghost" onClick={handleDelete}>🗑️ Delete</button>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
    </>
  );
}

function MemberForm({ mode, member, onDone, onCancel, showToast }) {
  const [form, setForm] = useState({
    name: member?.name || '',
    house: member?.house || 'gryffindor',
    email: member?.email || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      if (mode === 'add') {
        const res = await client.post('/members', form);
        showToast(`🪄 ${res.data.name} enrolled (${res.data.memberId}).`);
      } else {
        const res = await client.put(`/members/${member._id}`, form);
        showToast(`✏️ ${res.data.name} updated.`);
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
      <h3>{mode === 'add' ? 'Enroll a New Reader' : `Edit ${member.name}`}</h3>
      <div className="muted">{mode === 'add' ? 'A unique Reader ID and QR card will be generated automatically.' : `Reader ID: ${member.memberId}`}</div>

      {error && <div className="form-error">{error}</div>}

      <div className="field">
        <label>Name</label>
        <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="row">
        <div className="field">
          <label>House</label>
          <select value={form.house} onChange={(e) => set('house', e.target.value)}>
            {HOUSE_LIST.map((h) => <option key={h} value={h}>{HOUSES[h].name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Email (optional)</label>
          <input type="text" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : (mode === 'add' ? '🪄 Add Reader' : '💾 Save Changes')}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
