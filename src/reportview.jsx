import { useEffect, useState } from 'react';
import { getJSON, Move } from './lib.jsx';

const CHIP_LABEL = { wildcard: 'WILDCARD', freehit: 'FREE HIT', bboost: 'BENCH BOOST', '3xc': 'TRIPLE CAPT', manager: 'ASST MGR' };
const chipLabel = (c) => CHIP_LABEL[c] || (c || '').toUpperCase();

// Split the full write-up into paragraphs on one-or-more blank lines.
function paragraphs(report) {
  return (report || '').split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);
}

// A compact award/stat card — renders nothing when `show` is false.
function Card({ tag, title, show = true, children }) {
  if (!show) return null;
  return (
    <div className="rcard">
      <div className="rch"><span className="rtag">{tag}</span><span className="rtitle">{title}</span></div>
      <div className="rcbody">{children}</div>
    </div>
  );
}

export default function ReportView({ status }) {
  const [index, setIndex] = useState(null);
  const [gw, setGw] = useState('latest'); // 'latest' (recap.json) or a gw number
  const [recap, setRecap] = useState(null); // null = loading, undefined = error/404

  // List of available recaps for the switcher.
  useEffect(() => {
    let alive = true;
    getJSON(`/data/${status.season}/reports/recaps/index.json`)
      .then((d) => { if (alive) setIndex(d); })
      .catch(() => { if (alive) setIndex(undefined); });
    return () => { alive = false; };
  }, [status.season]);

  // The recap payload for the current selection.
  useEffect(() => {
    let alive = true;
    setRecap(null);
    const path = gw === 'latest'
      ? `/data/${status.season}/reports/recap.json`
      : `/data/${status.season}/reports/recaps/gw${gw}.json`;
    getJSON(path)
      .then((d) => { if (alive) setRecap(d); })
      .catch(() => { if (alive) setRecap(undefined); });
    return () => { alive = false; };
  }, [status.season, gw]);

  const recaps = index?.recaps || [];
  const gwList = [...recaps].map((r) => r.gw).sort((a, b) => a - b); // ascending
  const latestGw = gwList.length ? gwList[gwList.length - 1] : recap?.gw;
  const currentGw = recap?.gw ?? (gw === 'latest' ? latestGw : gw);
  const idx = gwList.indexOf(currentGw);
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < gwList.length - 1;

  const loading = recap === null;
  const f = (recap && recap.facts) || {};
  const tr = f.title_race;
  const gwk = f.gameweek;
  const motw = gwk?.manager_of_week;
  const spoon = gwk?.wooden_spoon;
  const cap = f.captaincy;
  const diffs = Array.isArray(f.differentials) ? f.differentials : [];
  const bench = f.bench_agony;
  const biggestHit = f.hits?.biggest;
  const chipsPlayed = Array.isArray(f.chips?.played) ? f.chips.played : [];
  const chipsRem = f.chips?.remaining;
  const form = f.form;
  const rec = f.season_record;

  return (
    <>
      {/* report header + gameweek switcher */}
      <div className="band mband">
        <a className="back" href="#/">← MEMB</a>
        <div className="name rptname">
          {recap?.headline || 'LEAGUE REPORT'}
          <small>
            {(recap?.league || 'BIDDENHAM FANTASY LEAGUE')}
            {currentGw != null ? ` · GW${currentGw}` : ''}
            {recap?.manager_count != null ? ` · ${recap.manager_count} MANAGERS` : ''}
            {recap?.gws_remaining != null ? ` · ${recap.gws_remaining} GW LEFT` : ''}
          </small>
        </div>
        <div className="right gwswitch">
          <button className="gwbtn" disabled={!hasPrev} onClick={() => hasPrev && setGw(gwList[idx - 1])} aria-label="Previous gameweek">◀</button>
          <select
            className="gwsel"
            value={gw}
            onChange={(e) => setGw(e.target.value === 'latest' ? 'latest' : Number(e.target.value))}
          >
            <option value="latest">LATEST{latestGw != null ? ` · GW${latestGw}` : ''}</option>
            {recaps.map((r) => <option key={r.gw} value={r.gw}>GW{r.gw}</option>)}
          </select>
          <button className="gwbtn" disabled={!hasNext} onClick={() => hasNext && setGw(gwList[idx + 1])} aria-label="Next gameweek">▶</button>
        </div>
      </div>

      {loading ? (
        <div className="panel grow"><div className="empty">LOADING REPORT…</div></div>
      ) : !recap || !recap.headline ? (
        <div className="panel grow"><div className="empty"><b>REPORT UNAVAILABLE</b><br />no recap on record for this gameweek</div></div>
      ) : (
        <>
          {/* full write-up + (desktop-only) at-a-glance facts filling the right */}
          <div className="panel rptprose">
            <div className="phead">RPRT <span className="meta">THE FULL REPORT · GW{recap.gw}</span></div>
            <div className="rptgrid">
              <article className="rptbody">
                {paragraphs(recap.report).length
                  ? paragraphs(recap.report).map((p, i) => <p key={i}>{p}</p>)
                  : <p className="rptempty">No written report available for this gameweek.</p>}
              </article>
              <aside className="rptside">
                <div className="rsh">AT A GLANCE</div>
                {tr?.leader && <div className="gline"><span>LEADER</span><b>{tr.leader.manager}<i className="tot">{tr.leader.total}</i></b></div>}
                {motw && <div className="gline"><span>MOTW</span><b>{motw.manager}<i className="up">{motw.net}</i></b></div>}
                {spoon && <div className="gline"><span>SPOON</span><b>{spoon.manager}<i className="dn">{spoon.net}</i></b></div>}
                {gwk?.top_scores?.[0] && <div className="gline"><span>TOP GW</span><b>{gwk.top_scores[0].manager}<i>{gwk.top_scores[0].net}</i></b></div>}
                {form?.hottest && <div className="gline"><span>HOTTEST</span><b>{form.hottest.manager}<i className="up">{form.hottest.last3_net}</i></b></div>}
                {rec && <div className="gline"><span>RECORD</span><b>{rec.manager}<i>{rec.net} · GW{rec.gw}</i></b></div>}
              </aside>
            </div>
          </div>

          {/* award / stat cards */}
          <div className="phead t3head">AWRD <span className="meta">GAMEWEEK AWARDS · GW{recap.gw}</span></div>
          <div className="rcards">
            <Card tag="01" title="TITLE RACE" show={!!tr?.leader}>
              <div className="rlead">
                <b>{tr.leader.manager}</b> <span className="team">{tr.leader.team}</span>
                <span className="tot"> {tr.leader.total}</span>
                {tr.lead_changed && <span className="rflag">LEAD CHANGED</span>}
              </div>
              {tr.second && <div className="rsub">+{tr.second.gap} to {tr.second.manager}</div>}
              {Array.isArray(tr.top5) && tr.top5.length > 0 && (
                <div className="rlist">
                  {tr.top5.map((t) => (
                    <div className="rrow" key={t.rank}>
                      <span className="rrk">{t.rank}</span>
                      <span className="rwho">{t.manager} <small>{t.team}</small></span>
                      <span className="rmv"><Move m={{ rank_movement: t.movement, last_rank: 1 }} /></span>
                      <span className="tot">{t.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card tag="02" title="MANAGER OF THE WEEK" show={!!motw}>
              <div className="rlead"><b>{motw.manager}</b> <span className="team">{motw.team}</span></div>
              <div className="rbig up">{motw.net}<span className="ru">NET</span></div>
              {motw.hits > 0 && <div className="rsub">{motw.gross} gross · <span className="dn">-{motw.hits}</span> hits</div>}
            </Card>

            <Card tag="03" title="WOODEN SPOON" show={!!spoon}>
              <div className="rlead"><b>{spoon.manager}</b> <span className="team">{spoon.team}</span></div>
              <div className="rbig dn">{spoon.net}<span className="ru">NET</span></div>
              {spoon.gross != null && spoon.gross !== spoon.net && <div className="rsub">{spoon.gross} gross</div>}
            </Card>

            <Card tag="04" title="CAPTAINCY" show={!!cap}>
              {cap.genius && (
                <div className="rkv"><span className="rk g">GENIUS</span><span className="rv">{cap.genius.manager} · {cap.genius.web_name} <b className="up">{cap.genius.points}</b>{cap.genius.multiplier ? `×${cap.genius.multiplier}` : ''}</span></div>
              )}
              {cap.howler && (
                <div className="rkv"><span className="rk r">HOWLER</span><span className="rv">{cap.howler.manager} · {cap.howler.web_name} <b className="dn">{cap.howler.points}</b></span></div>
              )}
              {cap.most_popular && (
                <div className="rkv"><span className="rk">POPULAR</span><span className="rv">{cap.most_popular.web_name} ×{cap.most_popular.count} · {cap.most_popular.points} pts</span></div>
              )}
            </Card>

            <Card tag="05" title="DIFFERENTIAL OF THE WEEK" show={diffs.length > 0}>
              <div className="rlist">
                {diffs.slice(0, 3).map((d) => (
                  <div className="drowr" key={d.web_name}>
                    <span className="rwho">{d.web_name} <small>{d.team}</small></span>
                    <span className="tot up">{d.points}</span>
                    <span className="rowners">{Array.isArray(d.owners) ? d.owners.join(', ') : ''}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card tag="06" title="BENCH MARE" show={!!bench}>
              <div className="rlead"><b>{bench.manager}</b></div>
              <div className="rbig">{bench.bench_points}<span className="ru">ON BENCH</span></div>
            </Card>

            <Card tag="07" title="BIGGEST HIT" show={!!biggestHit}>
              <div className="rlead"><b>{biggestHit.manager}</b></div>
              <div className="rbig dn">-{biggestHit.cost}<span className="ru">COST</span></div>
              <div className="rsub">{biggestHit.gw_net} net · {biggestHit.gw_gross} gross</div>
            </Card>

            <Card tag="08" title="CHIPS" show={chipsPlayed.length > 0 || !!chipsRem}>
              {chipsPlayed.length > 0 && (
                <div className="rlist">
                  {chipsPlayed.map((c, i) => (
                    <div className="rkv" key={i}><span className="rk a">{chipLabel(c.chip)}</span><span className="rv">{c.manager} · {c.gw_net} net</span></div>
                  ))}
                </div>
              )}
              {chipsRem && (
                <div className="rrem">
                  <span>TC <b>{chipsRem.triple_captain ?? '—'}</b></span>
                  <span>BB <b>{chipsRem.bench_boost ?? '—'}</b></span>
                  <span>FH <b>{chipsRem.free_hit ?? '—'}</b></span>
                  <span className="rremlbl">REMAINING</span>
                </div>
              )}
            </Card>

            <Card tag="09" title="FORM · LAST 3" show={!!(form?.hottest || form?.coldest)}>
              {form.hottest && <div className="rkv"><span className="rk g">HOTTEST</span><span className="rv">{form.hottest.manager} <b className="up">{form.hottest.last3_net}</b></span></div>}
              {form.coldest && <div className="rkv"><span className="rk r">COLDEST</span><span className="rv">{form.coldest.manager} <b className="dn">{form.coldest.last3_net}</b></span></div>}
            </Card>

            <Card tag="10" title="GW vs AVERAGE" show={!!gwk}>
              <div className="rkv"><span className="rk">LEAGUE AVG</span><span className="rv tot">{gwk.league_avg}</span></div>
              <div className="rkv"><span className="rk">GLOBAL AVG</span><span className="rv">{gwk.global_avg}</span></div>
              <div className="rkv"><span className="rk">GLOBAL HIGH</span><span className="rv up">{gwk.global_highest}</span></div>
            </Card>

            <Card tag="11" title="SEASON RECORD" show={!!rec}>
              <div className="rlead"><b>{rec.manager}</b></div>
              <div className="rbig up">{rec.net}<span className="ru">GW{rec.gw}</span></div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
