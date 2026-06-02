// Tier 3 — league-ownership intelligence panels for the homepage.
// Built entirely from data/<season>/reports/insights.json (see leagueview.jsx
// for the lazy fetch). Each player row:
//   { element, web_name, team, pos, owned, owned_pct, started, captained,
//     captained_pct, benched, owners }
// `owners` is populated only for differentials (owned <= 2), null otherwise.

const FORMATION = [
  ['FWD', 2],
  ['MID', 4],
  ['DEF', 4],
  ['GKP', 1],
];

// ---------- 1. OWNERSHIP — the spine of what the league holds ----------
function Ownership({ players }) {
  const rows = players.slice(0, 20);
  return (
    <div className="panel t3own">
      <div className="phead">OWND <span className="meta">MOST-OWNED · LEAGUE</span></div>
      <table>
        <thead>
          <tr>
            <th className="l">PLAYER</th>
            <th className="l">TM</th>
            <th className="l">POS</th>
            <th>OWN%</th>
            <th>ST</th>
            <th>C</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.element}>
              <td className="l mgr">{p.web_name}</td>
              <td className="l tkr">{p.team}</td>
              <td className="l flat">{p.pos}</td>
              <td className="tot">{p.owned_pct?.toFixed(1)}</td>
              <td>{p.started}</td>
              <td className={p.captained ? 'up' : 'hit0'}>{p.captained || '·'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- 2. CAPTAINCY — this gameweek's captains ----------
function Captaincy({ players }) {
  const rows = [...players]
    .filter((p) => p.captained > 0)
    .sort((a, b) => b.captained - a.captained)
    .slice(0, 8);
  const max = rows.length ? rows[0].captained_pct || 1 : 1;
  return (
    <div className="panel t3cap">
      <div className="phead">CAPT <span className="meta">ARMBAND · THIS GW</span></div>
      {rows.length ? (
        <div className="mini">
          {rows.map((p) => (
            <div className="caprow" key={p.element}>
              <span className="who">{p.web_name}<small>{p.team}</small></span>
              <span className="cbar"><span className="cbarfill" style={{ width: `${Math.round(((p.captained_pct || 0) / max) * 100)}%` }} /></span>
              <span className="val up">{p.captained_pct?.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">NO CAPTAINCY DATA</div>
      )}
    </div>
  );
}

// ---------- 3. TEMPLATE XI — the league's common XI ----------
const clip = (s) => (s.length > 9 ? `${s.slice(0, 8)}…` : s);

function PitchDot({ p, x, y }) {
  return (
    <g className="pdot">
      <circle cx={x} cy={y} r={5} />
      <text x={x} y={y - 8} textAnchor="middle" className="pname">{clip(p.web_name)}</text>
      <text x={x} y={y + 14} textAnchor="middle" className="pstart">{p.started}</text>
    </g>
  );
}

function TemplateXI({ players }) {
  const pick = (pos, n) =>
    players.filter((p) => p.pos === pos).sort((a, b) => b.started - a.started).slice(0, n);
  const lines = FORMATION.map(([pos, n], i) => ({ pos, ys: 38 + i * 56, players: pick(pos, n) }));
  const W = 300, H = 250;
  const hasData = lines.some((l) => l.players.length);

  return (
    <div className="panel t3xi">
      <div className="phead">TMPL <span className="meta">MOST-STARTED XI</span></div>
      {hasData ? (
        <div className="pitchwrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="pitch">
            <rect x={6} y={6} width={W - 12} height={H - 12} className="pborder" />
            <line x1={6} y1={H / 2} x2={W - 6} y2={H / 2} className="pline" />
            <circle cx={W / 2} cy={H / 2} r={22} className="pline" fill="none" />
            {lines.map((l) =>
              l.players.map((p, j) => {
                const span = l.players.length;
                const x = (W / (span + 1)) * (j + 1);
                return <PitchDot key={p.element} p={p} x={x} y={l.ys} />;
              })
            )}
          </svg>
        </div>
      ) : (
        <div className="empty">NO XI DATA</div>
      )}
    </div>
  );
}

// ---------- 4. DIFFERENTIALS — the league's bold picks ----------
function Differentials({ players }) {
  const rows = players
    .filter((p) => p.owned <= 2 && Array.isArray(p.owners) && p.owners.length)
    .sort((a, b) => a.owned - b.owned || b.captained - a.captained)
    .slice(0, 14);
  return (
    <div className="panel t3diff">
      <div className="phead">DIFF <span className="meta">OWNED ≤ 2 · UNIQUE PICKS</span></div>
      {rows.length ? (
        <div className="mini">
          {rows.map((p) => (
            <div className="drow" key={p.element}>
              <span className="who">{p.web_name}<small>{p.team} · {p.pos}</small></span>
              <span className="owners">{p.owners.join(', ')}</span>
              <span className="cnt">{p.owned}×</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">NO DIFFERENTIALS</div>
      )}
    </div>
  );
}

export default function OwnerPanels({ insights }) {
  const players = insights?.players || [];
  if (!players.length) return null;
  return (
    <div className="t3grid">
      <Ownership players={players} />
      <Captaincy players={players} />
      <TemplateXI players={players} />
      <Differentials players={players} />
    </div>
  );
}
