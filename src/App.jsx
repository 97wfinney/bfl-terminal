import { useEffect, useState } from 'react';
import './App.css';
import { getJSON, CommandBar } from './lib.jsx';
import LeagueView from './LeagueView.jsx';
import ManagerView from './ManagerView.jsx';

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function App() {
  const [clock, setClock] = useState('');
  const [data, setData] = useState({ loading: true, error: null });
  const hash = useHashRoute();

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
          /* feed is optional */
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

  const match = hash.match(/^#\/manager\/(\d+)/);
  const selected = match ? managers.find((m) => String(m.entry) === match[1]) : null;

  return (
    <div className="term">
      <CommandBar
        season={status.season}
        clock={clock}
        sub={selected ? `${selected.manager.toUpperCase()} <EQUITY>` : undefined}
      />
      {selected ? (
        <ManagerView manager={selected} rank={managers.indexOf(selected) + 1} status={status} />
      ) : (
        <LeagueView status={status} league={league} managers={managers} feed={feed} />
      )}
    </div>
  );
}