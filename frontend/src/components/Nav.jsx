import React from 'react';

const TABS = [
  { key: 'hall', icon: '🏰', label: 'Great Hall' },
  { key: 'shelves', icon: '📚', label: 'The Shelves' },
  { key: 'members', icon: '🪄', label: 'Members' },
  { key: 'issue', icon: '✒️', label: 'Issue a Book' },
  { key: 'return', icon: '🪶', label: 'Return a Book' },
  { key: 'admin', icon: '🗺️', label: "Headmaster's Office" },
  { key: 'tags', icon: '🏷️', label: 'Library Tags' }
];

export default function Nav({ current, onChange }) {
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={`tab-btn${current === t.key ? ' active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          <span className="ic">{t.icon}</span>{t.label}
        </button>
      ))}
    </nav>
  );
}
