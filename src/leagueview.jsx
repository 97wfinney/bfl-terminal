import { useEffect, useState } from 'react';
import { ME, Move, getBootstrap, getJSON } from './lib.jsx';
import {
  Sparkline, PulseBand, FormTable, HitsBoard, BenchWaste, ChipLog, ClosestBattles,
  GwSummary, PriceMovers, FormValue, InjuryTicker,
} from './homepanels.jsx';
import OwnerPanels from './ownerpanels.jsx';

const CHIP_SHORT = { wildcard: 'WC', freehit: 'FH', bboost: 'BB', '3xc': 'TC', manager: 'AM' };

// "Story of the week" panel — sits in the main column, directly below the
// standings table. Lazy-fetches the latest recap; degrades gracefully.
function RecapPanel({ status }) {
  const [recap, setRecap] = useState(null); // null = loading, undefined = missing/404
  useEffect(() => {
    let alive = true;
    setRecap(null);
    getJSON(`/data/${status.season}/reports/recap.json`)
      .then((d) => { if (alive) setRecap(d); })
      .catch(() => { if (alive) setRecap(undefined); });
    return () => { alive = false; };
  }, [status.season]);

  const head = (
    <div className="phead"><span className="recapdot">●</span> LEAGUE REPORT
      <span className="meta">{recap?.gw != null ? `STORY OF GW${recap.gw}` : 'STORY OF THE WEEK'}</span>
    </div>
  );

  if (recap === null) return <div className="panel recap">{head}<div className="empty">LOADING…</div></div>;
  if (!recap || !recap.headline) return <div className="panel recap">{head}<div className="empty">REPORT PENDING</div></div>;

  const f = recap.facts || {};
  const motw = f.gameweek?.manager_of_week;
  const genius = f.captaincy?.genius;
  const bench = f.bench_agony;

  return (
    <div className="panel recap">
      {head}
      <div className="recapbody">
        <h2 className="recaphl">{recap.headline}</h2>
        {recap.summary && <p className="recapsum">{recap.summary}</p>}
        {(motw || genius || bench) && (
          <div className="recapchips">
            {motw && <span className="rchip"><b>MOTW</b> {motw.manager} · {motw.net}</span>}
            {genius && <span className="rchip"><b>CAPT</b> {genius.manager} · {genius.web_name} {genius.points}{genius.multiplier ? `×${genius.multiplier}` : ''}</span>}
            {bench && <span className="rchip"><b>BENCH</b> {bench.manager} · {bench.bench_points}</span>}
          </div>
        )}
        <a className="recaplink" href="#/report">READ FULL REPORT →</a>
      </div>
    </div>
  );
}

export default function LeagueView({ status, league, managers }) {
  // Tier-2 panels fill in once the (large) bootstrap snapshot arrives; the page
  // never blocks on it.
  const [boot, setBoot] = useState(null);
  useEffect(() => {
    let alive = true;
    setBoot(null);
    getBootstrap(status.season, status.current_gw)
      .then((b) => { if (alive) setBoot(b); })
      .catch(() => { if (alive) setBoot(undefined); }); // undefined = failed, render nothing
    return () => { alive = false; };
  }, [status.season, status.current_gw]);

  const loadingBoot = boot === null;

  // Tier-3 league-ownership intelligence (insights.json), fetched lazily.
  const [insights, setInsights] = useState(null);
  useEffect(() => {
    let alive = true;
    setInsights(null);
    getJSON(`/data/${status.season}/reports/insights.json`)
      .then((d) => { if (alive) setInsights(d); })
      .catch(() => { if (alive) setInsights(undefined); }); // undefined = missing/404
    return () => { alive = false; };
  }, [status.season]);

  const loadingInsights = insights === null;
  const hasInsights = insights && Array.isArray(insights.players) && insights.players.length > 0;

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

      {/* Tier 1 — headline pulse band */}
      <PulseBand managers={managers} />

      {/* standings (main anchor) + rail of stacked mini-panels */}
      <div className="homegrid">
        <div className="maincol">
        <div className="panel">
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
                <th>TREND</th>
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
                    <td className="trend"><Sparkline values={(m.history || []).map((r) => r.total)} /></td>
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
          <RecapPanel status={status} />
          {/* HITS + BENCH live here (not the rail) so the main column's height
              balances the tall rail and no gap opens under the table. */}
          <HitsBoard managers={managers} />
          <BenchWaste managers={managers} />
        </div>

        <div className="rail">
          <FormTable managers={managers} />
          <ClosestBattles managers={managers} />
          <ChipLog managers={managers} />
        </div>
      </div>

      {/* Tier 3 — league-ownership intelligence (full width, below standings) */}
      <div className="phead t3head">OWND <span className="meta">LEAGUE OWNERSHIP · GW{status.current_gw} · {insights?.manager_count ?? managers.length} MANAGERS</span></div>
      {hasInsights ? (
        <OwnerPanels insights={insights} />
      ) : (
        <div className="panel"><div className="empty">{loadingInsights ? 'LOADING…' : 'OWNERSHIP DATA UNAVAILABLE'}</div></div>
      )}

      {/* Tier 2 — gameweek summary strip */}
      {boot ? (
        <GwSummary boot={boot} status={status} />
      ) : (
        <div className="panel">
          <div className="phead">GW{status.current_gw} <span className="meta">GAMEWEEK SUMMARY</span></div>
          <div className="empty">{loadingBoot ? 'LOADING…' : 'GW DATA UNAVAILABLE'}</div>
        </div>
      )}

      {/* Tier 2 — price movers + form & value */}
      {boot ? <PriceMovers boot={boot} /> : (
        <div className="panel"><div className="phead">PRIC <span className="meta">PRICE MOVERS</span></div><div className="empty">{loadingBoot ? 'LOADING…' : 'PRICE DATA UNAVAILABLE'}</div></div>
      )}
      {boot ? <FormValue boot={boot} /> : (
        <div className="panel"><div className="phead">FORM <span className="meta">FORM & VALUE</span></div><div className="empty">{loadingBoot ? 'LOADING…' : 'FORM DATA UNAVAILABLE'}</div></div>
      )}

      {/* Tier 2 — injury / flag ticker */}
      {boot ? <InjuryTicker boot={boot} /> : (
        <div className="panel"><div className="phead">FLAG <span className="meta">INJURY · SUSPENSION WATCH</span></div><div className="empty">{loadingBoot ? 'LOADING…' : 'FLAG DATA UNAVAILABLE'}</div></div>
      )}

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
