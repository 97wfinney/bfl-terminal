import { useEffect, useState } from 'react';
import { getBootstrap } from './lib.jsx';

const POSITIONS = ['ALL', 'GKP', 'DEF', 'MID', 'FWD'];

const COLS = [
  ['name', 'PLAYER', 'l'],
  ['team', 'TEAM', 'l'],
  ['pos', 'POS', 'l'],
  ['price', '£', 'n'],
  ['pts', 'PTS', 'n'],
  ['gw', 'GW', 'n'],
  ['form', 'FORM', 'n'],
  ['xg', 'xG', 'n'],
  ['xa', 'xA', 'n'],
  ['xgi', 'xGI', 'n'],
  ['own', 'OWN%', 'n'],
];

function buildPlayers(boot) {
  const teams = Object.fromEntries(boot.teams.map((t) => [t.id, t.short_name]));
  const types = Object.fromEntries(boot.element_types.map((t) => [t.id, t.singular_name_short]));
  const num = (v) => parseFloat(v) || 0;
  return boot.elements.map((e) => ({
    id: e.id,
    name: e.web_name,
    team: teams[e.team] || '',
    pos: types[e.element_type] || '',
    price: e.now_cost / 10,
    pts: e.total_points,
    gw: e.event_points,
    form: num(e.form),
    xg: num(e.expected_goals),
    xa: num(e.expected_assists),
    xgi: num(e.expected_goal_involvements),
    own: num(e.selected_by_percent),
  }));
}

export default function PlayersView({ season, gw }) {
  const [state, setState] = useState({ loading: true });
  const [sort, setSort] = useState({ key: 'pts', dir: -1 });
  const [pos, setPos] = useState('ALL');

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    getBootstrap(season, gw)
      .then((b) => { if (alive) setState({ loading: false, players: buildPlayers(b) }); })
      .catch((e) => { if (alive) setState({ loading: false, error: e.message }); });
    return () => { alive = false; };
  }, [season, gw]);

  if (state.loading) return <div className="empty">LOADING PLAYER DATA…</div>;
  if (state.error) return <div className="empty"><b>FEED ERROR</b><br />{state.error}</div>;

  const setSortKey = (k) =>
    setSort((s) => (s.key === k ? { key: k, dir: -s.dir } : { key: k, dir: ['name', 'team', 'pos'].includes(k) ? 1 : -1 }));

  let rows = pos === 'ALL' ? state.players : state.players.filter((p) => p.pos === pos);
  rows = [...rows]
    .sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      return typeof va === 'string' ? sort.dir * va.localeCompare(vb) : sort.dir * (va - vb);
    })
    .slice(0, 60);

  return (
    <div className="panel grow">
      <div className="phead">PLAY <span className="meta">FPL PLAYER DATA · GW{gw} · TOP 60</span></div>
      <div className="posbar">
        {POSITIONS.map((p) => (
          <button key={p} className={`posbtn ${pos === p ? 'on' : ''}`} onClick={() => setPos(p)}>{p}</button>
        ))}
      </div>
      <table className="ptable">
        <thead>
          <tr>
            {COLS.map(([k, label, al]) => (
              <th key={k} className={al === 'l' ? 'l' : ''} onClick={() => setSortKey(k)}>
                {label}{sort.key === k ? (sort.dir < 0 ? ' ▾' : ' ▴') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="l mgr">{p.name}</td>
              <td className="l tkr">{p.team}</td>
              <td className="l flat">{p.pos}</td>
              <td>{p.price.toFixed(1)}</td>
              <td className="tot">{p.pts}</td>
              <td>{p.gw}</td>
              <td>{p.form.toFixed(1)}</td>
              <td>{p.xg.toFixed(2)}</td>
              <td>{p.xa.toFixed(2)}</td>
              <td>{p.xgi.toFixed(2)}</td>
              <td className="flat">{p.own.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}