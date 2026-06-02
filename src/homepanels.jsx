// Home (standings) dashboard panels. Tier 1 panels render from the `managers`
// prop (no fetch); Tier 2 panels render from an already-fetched FPL bootstrap
// snapshot (`boot`). Kept presentational + season-agnostic — all gameweek/season
// values come in via props.
import { useEffect, useState } from 'react';
import { Move } from './lib.jsx';

const CHIP_SHORT = { wildcard: 'WC', freehit: 'FH', bboost: 'BB', '3xc': 'TC', manager: 'AM' };
const chipShort = (c) => CHIP_SHORT[c] || (c || '').toUpperCase();
const num = (v) => parseFloat(v) || 0;
const sumLast = (m, n) => (m.history || []).slice(-n).reduce((a, r) => a + (r.points || 0), 0);
const benchTotal = (m) => (m.history || []).reduce((a, r) => a + (r.bench || 0), 0);

// ---------- small inline sparkline of a manager's cumulative total ----------
export function Sparkline({ values }) {
  if (!values || values.length < 2) return <span className="flat">—</span>;
  const w = 64, h = 16;
  const min = Math.min(...values), max = Math.max(...values);
  const span = (max - min) || 1;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - 1 - ((v - min) / span) * (h - 2)).toFixed(1)}`)
    .join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} />
    </svg>
  );
}

// ---------- Tier 1: pulse band of headline stats ----------
export function PulseBand({ managers }) {
  if (!managers.length) return null;
  const lead = managers[0];
  const second = managers[1];
  const third = managers[2];
  const margin = second ? lead.total - second.total : 0;
  const gap23 = second && third ? second.total - third.total : 0;

  const motw = managers.reduce((a, b) => ((b.gw_points || 0) > (a.gw_points || 0) ? b : a));
  const climber = managers.reduce((a, b) => ((b.rank_movement || 0) > (a.rank_movement || 0) ? b : a));
  const faller = managers.reduce((a, b) => ((b.rank_movement || 0) < (a.rank_movement || 0) ? b : a));

  // season extremes + this week's league average
  let high = null, low = null;
  managers.forEach((m) => (m.history || []).forEach((r) => {
    if (!high || r.points > high.points) high = { ...r, m };
    if (!low || r.points < low.points) low = { ...r, m };
  }));
  const gwVals = managers.map((m) => m.gw_points || 0);
  const gwAvg = gwVals.length ? gwVals.reduce((a, b) => a + b, 0) / gwVals.length : 0;

  return (
    <div className="pulse">
      <div className="pcard lead">
        <div className="lbl">▲ TITLE RACE</div>
        <div className="big">{lead.manager}</div>
        <div className="sub"><b>{lead.total}</b> PTS · {lead.team}{second ? ` · +${margin} vs ${second.manager}` : ''}</div>
      </div>
      <div className="pcard">
        <div className="lbl">MANAGER OF WEEK</div>
        <div className="big">{motw.manager}</div>
        <div className="sub"><b className="up">{motw.gw_points}</b> PTS · {motw.team}</div>
      </div>
      <div className="pcard">
        <div className="lbl">TOP CLIMBER</div>
        <div className="big">{climber.manager}</div>
        <div className="sub"><Move m={climber} /> · {climber.team}</div>
      </div>
      <div className="pcard">
        <div className="lbl">TOP FALLER</div>
        <div className="big">{faller.manager}</div>
        <div className="sub"><Move m={faller} /> · {faller.team}</div>
      </div>
      <div className="pcard">
        <div className="lbl">GW AVERAGE</div>
        <div className="big">{gwAvg.toFixed(1)}</div>
        <div className="sub">LEAGUE · {managers.length} MGRS</div>
      </div>
      <div className="pcard">
        <div className="lbl">SEASON HIGH</div>
        <div className="big up">{high ? high.points : '—'}</div>
        <div className="sub">{high ? `${high.m.manager} · GW${high.gw}` : '—'}</div>
      </div>
      <div className="pcard">
        <div className="lbl">SEASON LOW</div>
        <div className="big dn">{low ? low.points : '—'}</div>
        <div className="sub">{low ? `${low.m.manager} · GW${low.gw}` : '—'}</div>
      </div>
      {second && third && (
        <div className="pcard">
          <div className="lbl">2ND → 3RD GAP</div>
          <div className="big">{gap23}</div>
          <div className="sub">{second.manager} / {third.manager}</div>
        </div>
      )}
    </div>
  );
}

// ---------- Tier 1: a stacked rank list (form / hits / bench) ----------
function RankList({ rows, fmt, cls }) {
  if (!rows.length) return <div className="empty">NO DATA</div>;
  return (
    <div className="mini">
      {rows.map((r, i) => (
        <div className="mrow" key={r.m.entry}>
          <span className="pos">{i + 1}</span>
          <span className="who"><a className="mlink" href={`#/manager/${r.m.entry}`}>{r.m.manager}</a><small>{r.m.team}</small></span>
          <span className={`val ${cls || ''}`}>{fmt(r)}</span>
        </div>
      ))}
    </div>
  );
}

export function FormTable({ managers }) {
  const rows = managers
    .map((m) => ({ m, v: sumLast(m, 4), n: Math.min((m.history || []).length, 4) }))
    .sort((a, b) => b.v - a.v);
  return (
    <div className="panel">
      <div className="phead">FORM <span className="meta">PTS · LAST 4 GW</span></div>
      <RankList rows={rows} cls="up" fmt={(r) => r.v} />
    </div>
  );
}

export function HitsBoard({ managers }) {
  const rows = managers
    .map((m) => ({ m, v: m.hits || 0 }))
    .filter((r) => r.v > 0)
    .sort((a, b) => b.v - a.v);
  return (
    <div className="panel">
      <div className="phead">HITS <span className="meta">TRANSFER COST · SEASON</span></div>
      {rows.length ? <RankList rows={rows} cls="dn" fmt={(r) => `-${r.v}`} /> : <div className="empty">NO HITS TAKEN</div>}
    </div>
  );
}

export function BenchWaste({ managers }) {
  const rows = managers
    .map((m) => ({ m, v: benchTotal(m) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 8);
  return (
    <div className="panel">
      <div className="phead">BNCH <span className="meta">POINTS LEFT ON BENCH</span></div>
      <RankList rows={rows} cls="flat" fmt={(r) => r.v} />
    </div>
  );
}

// ---------- Tier 1: chip log ----------
export function ChipLog({ managers }) {
  const rows = managers.filter((m) => (m.chips_used || []).length > 0);
  return (
    <div className="panel">
      <div className="phead">CHIP <span className="meta">PLAYED THIS SEASON</span></div>
      {rows.length ? (
        rows.map((m) => (
          <div className="cl" key={m.entry}>
            <span className="who">{m.manager}</span>
            {m.chips_used.map((c, i) => <span className="badge" key={i}>{chipShort(c)}</span>)}
          </div>
        ))
      ) : (
        <div className="empty">NO CHIPS PLAYED YET</div>
      )}
    </div>
  );
}

// ---------- Tier 1: closest battles ----------
export function ClosestBattles({ managers }) {
  const pairs = [];
  for (let i = 0; i < managers.length - 1; i++) {
    const gap = (managers[i].total || 0) - (managers[i + 1].total || 0);
    if (gap <= 10) pairs.push({ a: managers[i], b: managers[i + 1], gap, i });
  }
  pairs.sort((x, y) => x.gap - y.gap);
  return (
    <div className="panel">
      <div className="phead">DUEL <span className="meta">ADJACENT · WITHIN 10 PTS</span></div>
      {pairs.length ? (
        pairs.map((p) => (
          <div className="battle" key={p.i}>
            <span className="a">{p.i + 1}. {p.a.manager}</span>
            <span className="gapv">{p.gap === 0 ? 'LEVEL' : `${p.gap} PT`}</span>
            <span className="b">{p.b.manager} {p.i + 2}.</span>
          </div>
        ))
      ) : (
        <div className="empty">NO TIGHT BATTLES</div>
      )}
    </div>
  );
}

// ===================================================================
// Tier 2 — built from the FPL bootstrap snapshot
// ===================================================================
function bootMaps(boot) {
  const teams = Object.fromEntries(boot.teams.map((t) => [t.id, t.short_name]));
  const byId = Object.fromEntries(boot.elements.map((e) => [e.id, e]));
  const name = (id) => byId[id]?.web_name || '—';
  return { teams, byId, name };
}

// ---------- Tier 2: deadline countdown ----------
function fmtRemaining(ms) {
  if (ms <= 0) return '00D 00:00:00';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d)}D ${p(h)}:${p(m)}:${p(sec)}`;
}

export function DeadlineCard({ boot }) {
  const next = boot.events.find((e) => e.is_next);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!next) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [next]);

  if (!next) {
    return (
      <div className="g">
        <div className="lbl">DEADLINE</div>
        <div className="v">SEASON COMPLETE</div>
      </div>
    );
  }
  const remaining = new Date(next.deadline_time).getTime() - now;
  return (
    <div className="g dl">
      <div className="lbl">{next.name?.toUpperCase()} DEADLINE</div>
      <div className="v">{fmtRemaining(remaining)}</div>
    </div>
  );
}

// ---------- Tier 2: gameweek summary strip ----------
export function GwSummary({ boot, status }) {
  const { name } = bootMaps(boot);
  const ev = boot.events.find((e) => e.id === status.current_gw);
  const tei = ev?.top_element_info;
  const cells = ev
    ? [
        ['AVG SCORE', ev.average_entry_score, ''],
        ['HIGHEST', ev.highest_score, 'up'],
        ['MOST CAPTAINED', name(ev.most_captained), ''],
        ['MOST TRANSFERRED IN', name(ev.most_transferred_in), ''],
        ['TOP SCORER', tei ? name(tei.id) : '—', tei ? `${tei.points} PTS` : ''],
      ]
    : [];
  const chips = ev?.chip_plays || [];
  return (
    <div className="panel">
      <div className="phead">GW{status.current_gw} <span className="meta">GAMEWEEK SUMMARY</span></div>
      <div className="gwstrip">
        <DeadlineCard boot={boot} />
        {cells.map(([lbl, v, sub], i) => (
          <div className="g" key={i}>
            <div className="lbl">{lbl}</div>
            <div className="v">{v}{sub ? <small>{sub}</small> : null}</div>
          </div>
        ))}
        {chips.length > 0 && (
          <div className="g">
            <div className="lbl">CHIPS PLAYED</div>
            <div className="v chipline2">
              {chips.map((c, i) => (
                <span key={i}>{chipShort(c.chip_name)} <small>{c.num_played?.toLocaleString('en-GB')}</small></span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Tier 2: price movers ----------
export function PriceMovers({ boot }) {
  const { teams } = bootMaps(boot);
  const sorted = [...boot.elements].sort((a, b) => b.cost_change_event - a.cost_change_event);
  const risers = sorted.filter((e) => e.cost_change_event > 0).slice(0, 8);
  const fallers = sorted.filter((e) => e.cost_change_event < 0).reverse().slice(0, 8);
  const Row = (e) => (
    <div className="mrow" key={e.id}>
      <span className="who">{e.web_name}<small>{teams[e.team]}</small></span>
      <span className="val flat">£{(e.now_cost / 10).toFixed(1)}</span>
      <span className={`val ${e.cost_change_event > 0 ? 'up' : 'dn'}`}>
        {e.cost_change_event > 0 ? '+' : ''}{(e.cost_change_event / 10).toFixed(1)}
      </span>
    </div>
  );
  return (
    <div className="twocol">
      <div className="panel l">
        <div className="phead up">RISE <span className="meta">PRICE UP · THIS GW</span></div>
        <div className="mini price">{risers.length ? risers.map(Row) : <div className="empty">NO RISERS</div>}</div>
      </div>
      <div className="panel">
        <div className="phead dn">FALL <span className="meta">PRICE DOWN · THIS GW</span></div>
        <div className="mini price">{fallers.length ? fallers.map(Row) : <div className="empty">NO FALLERS</div>}</div>
      </div>
    </div>
  );
}

// ---------- Tier 2: form & value teaser ----------
export function FormValue({ boot }) {
  const { teams } = bootMaps(boot);
  const topForm = [...boot.elements].sort((a, b) => num(b.form) - num(a.form)).slice(0, 5);
  const ppm = [...boot.elements]
    .filter((e) => e.now_cost > 0)
    .map((e) => ({ e, v: e.total_points / (e.now_cost / 10) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);
  return (
    <div className="twocol">
      <div className="panel l">
        <div className="phead">FORM <span className="meta">TOP 5 BY FORM</span></div>
        <div className="mini">
          {topForm.map((e, i) => (
            <div className="mrow" key={e.id}>
              <span className="pos">{i + 1}</span>
              <span className="who">{e.web_name}<small>{teams[e.team]}</small></span>
              <span className="val up">{num(e.form).toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="phead">VALU <span className="meta">TOP 5 · PTS PER £M</span></div>
        <div className="mini">
          {ppm.map(({ e, v }, i) => (
            <div className="mrow" key={e.id}>
              <span className="pos">{i + 1}</span>
              <span className="who">{e.web_name}<small>{teams[e.team]} £{(e.now_cost / 10).toFixed(1)}</small></span>
              <span className="val">{v.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Tier 2: injury / flag ticker ----------
const STATUS_LABEL = { i: 'INJ', d: 'DBT', s: 'SUS', u: 'UNAV', n: 'N/A' };
export function InjuryTicker({ boot }) {
  const { teams } = bootMaps(boot);
  const rows = boot.elements
    .filter((e) => e.status && e.status !== 'a')
    .sort((a, b) => num(b.selected_by_percent) - num(a.selected_by_percent))
    .slice(0, 15);
  return (
    <div className="panel">
      <div className="phead">FLAG <span className="meta">INJURY · SUSPENSION WATCH</span></div>
      {rows.length ? (
        <div className="inj">
          {rows.map((e) => {
            const chance = e.chance_of_playing_next_round;
            return (
              <div className="injrow" key={e.id}>
                <span className="pn">{e.web_name}</span>
                <span className="pt">{teams[e.team]}</span>
                <span className={`st ${e.status === 'd' ? 'd' : 'x'}`}>{STATUS_LABEL[e.status] || e.status.toUpperCase()}</span>
                <span className="nw">{e.news || '—'}</span>
                <span className="ch">{chance == null ? '—' : `${chance}%`}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">NO FLAGGED PLAYERS</div>
      )}
    </div>
  );
}
