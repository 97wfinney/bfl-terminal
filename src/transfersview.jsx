import { useEffect, useState } from 'react';
import { getBootstrap } from './lib.jsx';

const fmtK = (n) => (Math.abs(n) >= 1000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k' : String(n));

function build(boot) {
  const teams = Object.fromEntries(boot.teams.map((t) => [t.id, t.short_name]));
  const types = Object.fromEntries(boot.element_types.map((t) => [t.id, t.singular_name_short]));
  return boot.elements.map((e) => ({
    id: e.id,
    name: e.web_name,
    team: teams[e.team] || '',
    pos: types[e.element_type] || '',
    price: e.now_cost / 10,
    inE: e.transfers_in_event || 0,
    outE: e.transfers_out_event || 0,
  }));
}

function Table({ title, meta, rows, valueKey, valueClass }) {
  return (
    <div className="panel l">
      <div className="phead">{title} <span className="meta">{meta}</span></div>
      <table className="ptable">
        <thead>
          <tr>
            <th className="l">PLAYER</th>
            <th className="l">TEAM</th>
            <th>£</th>
            <th>COUNT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="l mgr">{p.name}</td>
              <td className="l tkr">{p.team}</td>
              <td>{p.price.toFixed(1)}</td>
              <td className={valueClass}>{fmtK(p[valueKey])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TransfersView({ season, gw }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    getBootstrap(season, gw)
      .then((b) => { if (alive) setState({ loading: false, players: build(b) }); })
      .catch((e) => { if (alive) setState({ loading: false, error: e.message }); });
    return () => { alive = false; };
  }, [season, gw]);

  if (state.loading) return <div className="empty">LOADING TRANSFER DATA…</div>;
  if (state.error) return <div className="empty"><b>FEED ERROR</b><br />{state.error}</div>;

  const topIn = [...state.players].sort((a, b) => b.inE - a.inE).slice(0, 15);
  const topOut = [...state.players].sort((a, b) => b.outE - a.outE).slice(0, 15);

  return (
    <div className="mgrid">
      <Table title="XFER IN" meta={`MOST IN · GW${gw}`} rows={topIn} valueKey="inE" valueClass="up" />
      <Table title="XFER OUT" meta={`MOST OUT · GW${gw}`} rows={topOut} valueKey="outE" valueClass="dn" />
    </div>
  );
}