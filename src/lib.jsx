// Shared helpers, constants, and small UI pieces used across views.

export const REPO = 'https://raw.githubusercontent.com/97wfinney/bfl-data/main';
export const ME = 'Will Finney'; // highlights your own row

export async function getJSON(path) {
  const res = await fetch(`${REPO}${path}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} on ${path}`);
  return res.json();
}

// Bootstrap snapshots are large, so fetch lazily and cache (shared across the homepage Tier-2 panels).
const _bootCache = {};
export function getBootstrap(season, gw) {
  const key = `${season}/${gw}`;
  if (!_bootCache[key]) {
    _bootCache[key] = getJSON(`/data/${season}/bootstrap/Gameweek_${gw}.json`);
  }
  return _bootCache[key];
}

export const fmtTime = (iso) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (isNaN(d)) return '--:--';
  return d
    .toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    .toUpperCase();
};

export const fmtSeason = (s) => (s && s.length === 4 ? `${s.slice(0, 2)}/${s.slice(2)}` : s);
export const fmtRank = (n) => (n == null ? '—' : n.toLocaleString('en-GB'));

export function Move({ m }) {
  if (!m.last_rank || m.rank_movement == null || m.rank_movement === 0) {
    return <span className="flat">■ 0</span>;
  }
  return m.rank_movement > 0
    ? <span className="up">▲ {m.rank_movement}</span>
    : <span className="dn">▼ {Math.abs(m.rank_movement)}</span>;
}

export function CommandBar({ season, clock, sub }) {
  return (
    <div className="cmd">
      <span className="tk">BFL</span>
      <span className="ix">&lt;INDEX&gt;</span>
      <span className="q">{sub || 'BIDDENHAM FANTASY LEAGUE'}</span>
      <span className="cur" />
      <span className="right">
        <span>SEASON <b>{fmtSeason(season)}</b></span>
        <span><b>{clock}</b></span>
      </span>
    </div>
  );
}

const TABS = [
  ['', 'MEMB'],
  ['news', 'NEWS'],
];

export function Nav({ active }) {
  return (
    <div className="tabs">
      {TABS.map(([h, label], i) => (
        <a key={h} className={`tab ${active === h ? 'on' : ''}`} href={`#/${h}`}>
          <span className="n">{i + 1}</span>{label}
        </a>
      ))}
    </div>
  );
}