import { ME, Move } from './lib.jsx';

const CHIP_SHORT = { wildcard: 'WC', freehit: 'FH', bboost: 'BB', '3xc': 'TC', manager: 'AM' };

export default function LeagueView({ status, league, managers }) {
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
        <div className="right">UPDATED<b>{new Date(status.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}</b></div>
      </div>

      {/* standings (full width) */}
      <div className="panel grow">
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
              const cls = [i === 0 ? 'leadrow' : '', m.manager === ME ? 'me' : ''].join(' ').trim();
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
                    <span className={`chip ${m.gw_chip ? '' : 'none'}`}>
                      {m.gw_chip ? (CHIP_SHORT[m.gw_chip] || m.gw_chip.toUpperCase()) : '·'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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