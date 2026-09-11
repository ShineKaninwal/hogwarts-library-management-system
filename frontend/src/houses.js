export const HOUSES = {
  gryffindor: { name: 'Gryffindor', color: '#7f0909', text: '#f4e9cf' },
  slytherin: { name: 'Slytherin', color: '#1a472a', text: '#f4e9cf' },
  ravenclaw: { name: 'Ravenclaw', color: '#222f5b', text: '#f4e9cf' },
  hufflepuff: { name: 'Hufflepuff', color: '#ecb939', text: '#372e29' }
};

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
