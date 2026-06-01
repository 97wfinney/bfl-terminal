import { ME, Move, fmtTime } from './lib.jsx';

export default function LeagueView({ status, league, managers, feed }) {
  const items = feed?.items || [];

  return (
    <>
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
                      <a className="mlink" href={`#/manager/${m.entry}`}>{m.manager}</a>{' '}
                      <span className="team">{m.team}</span>
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
    </>
  );
}