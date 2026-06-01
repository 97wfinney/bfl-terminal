import { useEffect, useState } from 'react';
import { getJSON, fmtRank } from './lib.jsx';

const CHIP_LABELS = {
  wildcard: 'WILDCARD',
  freehit: 'FREE HIT',
  bboost: 'BENCH BOOST',
  '3xc': 'TRIPLE CAPTAIN',
  manager: 'ASST MANAGER',
};
const chipLabel = (c) => CHIP_LABELS[c] || (c || '').toUpperCase();

function Chart({ rows, avg }) {
  if (!rows.length) return <div className="empty">NO HISTORY YET</div>;
  const W = 720, H = 220, padL = 30, padB = 22, padT = 14, padR = 10;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const max = Math.max(...rows.map((r) => r.points), 1);
  const maxP = Math.max(...rows.map((r) => r.points));
  const minP = Math.min(...rows.map((r) => r.points));
  const bw = plotW / rows.length;
  const meanY = padT + plotH - (avg / max) * plotH;

  return (
    <div className="chartwrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart">
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="#1b1b1b" />
        {rows.map((r, i) => {
          const h = (r.points / max) * plotH;
          const x = padL + i * bw + 1.5;
          const y = padT + plotH - h;
          const cls = r.points === maxP ? 'bar best' : r.points === minP ? 'bar worst' : 'bar';
          return (
            <rect key={i} className={cls} x={x} y={y} width={Math.max(bw - 3, 1)} height={h}>
              <title>GW{r.gw}: {r.points} pts{r.hits ? ` (-${r.hits})` : ''}</title>
            </rect>
          );
        })}
        <line className="mean" x1={padL} y1={meanY} x2={W - padR} y2={meanY} />
        <text className="meanlbl" x={W - padR} y={meanY - 4} textAnchor="end">AVG {avg.toFixed(1)}</text>
        <text className="axislbl" x={padL} y={H - 7}>GW{rows[0].gw}</text>
        <text className="axislbl" x={W - padR} y={H - 7} textAnchor="end">GW{rows[rows.length - 1].gw}</text>
      </svg>
    </div>
  );
}

export default function ManagerView({ manager, rank, status }) {
  const rows = manager.history || [];
  const pts = rows.map((r) => r.points);
  const avg = pts.length ? pts.reduce((a, b) => a + b, 0) / pts.length : 0;
  const best = rows.length ? rows.reduce((a, b) => (b.points > a.points ? b : a)) : null;
  const worst = rows.length ? rows.reduce((a, b) => (b.points < a.points ? b : a)) : null;
  const benchTotal = rows.reduce((a, r) => a + (r.bench || 0), 0);
  const ORs = rows.map((r) => r.overall_rank).filter(Boolean);
  const peakOR = ORs.length ? Math.min(...ORs) : null;
  const currOR = rows.length ? rows[rows.length - 1].overall_rank : null;

  // Richer data fetched lazily from the per-entry history file.
  const [hist, setHist] = useState(null);
  useEffect(() => {
    let alive = true;
    setHist(null);
    getJSON(`/data/${status.season}/mini_league/entries/${manager.entry}/history.json`)
      .then((d) => { if (alive) setHist(d); })
      .catch(() => { if (alive) setHist({}); });
    return () => { alive = false; };
  }, [manager.entry, status.season]);

  const loading = hist === null;
  const past = [...(hist?.past || [])].reverse();
  const chips = [...(hist?.chips || [])].sort((a, b) => (a.event || 0) - (b.event || 0));

  const stats = [
    ['INDEX (AVG)', avg.toFixed(1), 'a'],
    ['GAMEWEEKS', rows.length, ''],
    ['BEST · GW' + (best?.gw ?? '—'), best ? best.points : '—', 'g'],
    ['WORST · GW' + (worst?.gw ?? '—'), worst ? worst.points : '—', 'r'],
    ['GROSS PTS', manager.gross_points, ''],
    ['TOTAL HITS', manager.hits ? '-' + manager.hits : '0', manager.hits ? 'r' : ''],
    ['BENCH Σ (PTS)', benchTotal, ''],
    ['PEAK OVERALL', fmtRank(peakOR), 'g'],
    ['CURRENT OVERALL', fmtRank(currOR), ''],
  ];

  return (
    <>
      {/* manager band */}
      <div className="band mband">
        <a className="back" href="#/">← MEMB</a>
        <div className="name">
          {manager.manager}
          <small>{manager.team} · LEAGUE RANK {rank}</small>
        </div>
        <div className="bignum">{manager.total}<span className="u">PTS</span></div>
        <div className="right kvs">
          <div className="kv">GW{status.current_gw}<b>{manager.gw_points}</b></div>
          <div className="kv">HITS<b className="r">{manager.hits ? '-' + manager.hits : '0'}</b></div>
        </div>
      </div>

      {/* chart + stats */}
      <div className="mgrid">
        <div className="panel l">
          <div className="phead">HIST <span className="meta">POINTS BY GAMEWEEK</span></div>
          <Chart rows={rows} avg={avg} />
        </div>
        <div className="panel">
          <div className="phead">STAT <span className="meta">SEASON</span></div>
          <div className="stat">
            {stats.map(([k, v, c], i) => (
              <div className="s" key={i}><span>{k}</span><b className={c}>{v}</b></div>
            ))}
          </div>
        </div>
      </div>

      {/* chips + past seasons */}
      <div className="mgrid">
        <div className="panel l">
          <div className="phead">CHIP <span className="meta">PLAYED · BY GAMEWEEK</span></div>
          <div className="chips">
            {loading ? (
              <div className="empty">LOADING…</div>
            ) : chips.length === 0 ? (
              <div className="empty">NO CHIPS PLAYED</div>
            ) : (
              chips.map((c, i) => (
                <div className="chipline" key={i}>
                  <span className="ctag">{chipLabel(c.name)}</span>
                  <span className="cgw">GW{c.event}</span>
                  <span className="half">{c.event <= 19 ? '1ST HALF' : '2ND HALF'}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="panel">
          <div className="phead">HIST <span className="meta">PREVIOUS SEASONS</span></div>
          {loading ? (
            <div className="empty">LOADING…</div>
          ) : past.length === 0 ? (
            <div className="empty">NO PREVIOUS SEASONS ON RECORD</div>
          ) : (
            <table className="gwtable">
              <thead>
                <tr>
                  <th className="l">SEASON</th>
                  <th>POINTS</th>
                  <th>OVERALL RANK</th>
                </tr>
              </thead>
              <tbody>
                {past.map((p, i) => (
                  <tr key={i}>
                    <td className="l">{p.season_name}</td>
                    <td className="tot">{p.total_points}</td>
                    <td className="flat">{fmtRank(p.rank)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* gameweek log */}
      <div className="panel">
        <div className="phead">LOG <span className="meta">GAMEWEEK BY GAMEWEEK</span></div>
        <table className="gwtable">
          <thead>
            <tr>
              <th className="l">GW</th>
              <th>PTS</th>
              <th>HIT</th>
              <th>NET</th>
              <th>TOTAL</th>
              <th>BENCH</th>
              <th>OVERALL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.gw}>
                <td className="l rk">GW{r.gw}</td>
                <td className={best && r.gw === best.gw ? 'up' : worst && r.gw === worst.gw ? 'dn' : ''}>{r.points}</td>
                <td className={r.hits ? 'hit' : 'hit0'}>{r.hits ? `-${r.hits}` : '·'}</td>
                <td>{r.net}</td>
                <td className="tot">{r.total}</td>
                <td className={r.bench ? 'flat' : 'hit0'}>{r.bench || '·'}</td>
                <td className="flat">{fmtRank(r.overall_rank)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan="7" className="l empty">NO GAMEWEEK DATA YET</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}