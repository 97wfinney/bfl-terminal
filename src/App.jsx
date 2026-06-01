import { useEffect, useState } from 'react';
import './App.css';

// Public bfl-data repo on GitHub, served raw. Swap to jsDelivr later if you
// want a proper CDN: https://cdn.jsdelivr.net/gh/97wfinney/bfl-data@main
const REPO = 'https://raw.githubusercontent.com/97wfinney/bfl-data/main';
const ME = 'Will Finney'; // highlights your own row

async function getJSON(path) {
  const res = await fetch(`${REPO}${path}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} on ${path}`);
  return res.json();
}

const fmtTime = (iso) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (isNaN(d)) return '--:--';
  return d
    .toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    .toUpperCase();
};

const fmtSeason = (s) => (s && s.length === 4 ? `${s.slice(0, 2)}/${s.slice(2)}` : s);

function Move({ m }) {
  if (!m.last_rank || m.rank_movement == null || m.rank_movement === 0) {
    return <span className="flat">■ 0</span>;
  }
  return m.rank_movement > 0
    ? <span className="up">▲ {m.rank_movement}</span>
    : <span className="dn">▼ {Math.abs(m.rank_movement)}</span>;
}

export default function App() {
  const [clock, setClock] = useState('');
  const [data, setData] = useState({ loading: true, error: null });

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const status = await getJSON('/data/status.json');
        const league = await getJSON(`/data/${status.season}/reports/league.json`);
        let feed = { items: [] };
        try {
          feed = await getJSON(`/data/${status.season}/summaries/feed.json`);
        } catch {
          /* feed is optional - empty state handles it */
        }
        setData({ loading: false, error: null, status, league, feed });
      } catch (e) {
        setData({ loading: false, error: e.message });
      }
    })();
  }, []);

  if (data.loading) return <div className="screen">CONNECTING TO BFL&lt;DATA&gt;…</div>;
  if (data.error) return <div className="screen err">FEED ERROR — {data.error}</div>;

  const { status, league, feed } = data;
  const managers = [...(league.managers || [])].sort((a, b) => (b.total || 0) - (a.total || 0));
  const items = feed?.items || [];

  return (
    <div className="term">
      {/* command bar */}
      <div className="cmd">
        <span className="tk">BFL</span>
        <span className="ix">&lt;INDEX&gt;</span>
        <span className="q">BIDDENHAM FANTASY LEAGUE</span>
        <span className="cur" />
        <span className="right">
          <span>SEASON <b>{fmtSeason(status.season)}</b></span>
          <span><b>{clock}</b></span>
        </span>
      </div>

      {/* header band */}
      <div className="band">
        <div className="name">
          {league.league?.name || 'BIDDENHAM FANTASY LEAGUE'}
          <small>CLASSIC · {managers.length} MANAGERS</small>
        </div>
        <div className="gw">GW{String(status.current_gw ?? '--').padStart(2, '0')}</div>
        <div className={`status ${status.finished ? 'final' : 'live'}`}>
          {status.finished ? '● FINAL' : <><span className="dot" /> LIVE</>}
        </div>
        <div className="right">UPDATED<b>{fmtTime(status.updated_at)}</b></div>
      </div>

      {/* main grid */}
      <div className="grid">
        {/* standings */}
        <div className="panel l">
          <div className="phead">MEMB <span className="meta">LEAGUE STANDINGS · BY TOTAL</span></div>
          <table>
            <thead>
              <tr>
                <th className="l">#</th>
                <th className="l">MANAGER</th>
                <th>GW</th>
                <th>HIT</th>
                <th>TOTAL</th>
                <th>MOV</th>
                <th className="l">CHIP</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m, i) => {
                const chip = (m.chips_used || []).slice(-1)[0];
                const cls = [i === 0 ? 'leadrow' : '', m.manager === ME ? 'me' : '']
                  .join(' ')
                  .trim();
                return (
                  <tr key={m.entry} className={cls}>
                    <td className="l rk">{i + 1}</td>
                    <td className="l">
                      <span className="mgr">{m.manager}</span> <span className="team">{m.team}</span>
                    </td>
                    <td>{m.gw_points}</td>
                    <td className={m.gw_hits ? 'hit' : 'hit0'}>{m.gw_hits ? `-${m.gw_hits}` : '·'}</td>
                    <td className="tot">{m.total}</td>
                    <td><Move m={m} /></td>
                    <td className="l">
                      <span className={`chip ${chip ? '' : 'none'}`}>{chip ? chip.toUpperCase() : '·'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* news wire */}
        <div className="panel">
          <div className="phead">NEWS <span className="meta">FPL WIRE · {items.length}</span></div>
          {items.length === 0 ? (
            <div className="empty">
              <b>AWAITING FEED</b>
              <br />
              transcript service offline — summaries resume once the feed clears
            </div>
          ) : (
            items.map((it) => (
              <a className="nrow" key={it.video_id} href={it.url} target="_blank" rel="noreferrer">
                <span className="tm">{fmtTime(it.published_at)}</span>
                <span className="src">{(it.channel || '').toUpperCase()}</span>
                <span>
                  <span className="hl">{it.title}</span>
                  <div className="sum">
                    {(it.summary || '').slice(0, 220)}
                    {(it.summary || '').length > 220 ? '…' : ''}
                  </div>
                </span>
              </a>
            ))
          )}
        </div>
      </div>

      {/* running ticker tape */}
      {managers.length > 0 && (
        <div className="tape">
          <div className="tapeInner">
            {[...managers, ...managers].map((m, i) => (
              <span className="it" key={i}>
                <b>{m.team}</b>{m.gw_points}<Move m={m} />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}