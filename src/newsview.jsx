import { fmtTime } from './lib.jsx';

export default function NewsView({ feed }) {
  const items = feed?.items || [];
  return (
    <div className="panel grow">
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
                {(it.summary || '').slice(0, 280)}
                {(it.summary || '').length > 280 ? '…' : ''}
              </div>
            </span>
          </a>
        ))
      )}
    </div>
  );
}