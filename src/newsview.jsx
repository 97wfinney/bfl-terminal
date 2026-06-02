import { useState } from 'react';
import { fmtTime } from './lib.jsx';

// Split the written summary into paragraphs on one-or-more blank lines.
// A single block with no blank lines becomes one paragraph.
function paragraphs(summary) {
  return (summary || '')
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function NewsView({ feed }) {
  const items = feed?.items || [];
  const [openId, setOpenId] = useState(null); // accordion: one article open at a time

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
        items.map((it, i) => {
          const id = it.video_id || it.url || String(i);
          const open = openId === id;
          const title = it.headline || it.title || 'UNTITLED';
          const paras = paragraphs(it.summary);
          const points = Array.isArray(it.key_points) ? it.key_points.filter(Boolean) : [];
          // Show the original video title as a source line only when it differs from the headline.
          const source = it.title && it.title !== title ? it.title : null;

          return (
            <div className={`narticle ${open ? 'open' : ''}`} key={id}>
              <button
                type="button"
                className="nhead"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : id)}
              >
                <span className="ntog" aria-hidden="true">{open ? '−' : '+'}</span>
                <span className="src">{(it.channel || 'WIRE').toUpperCase()}</span>
                <span className="nhl">{title}</span>
                <span className="tm">{fmtTime(it.published_at)}</span>
              </button>

              {open && (
                <div className="nbody">
                  <article className="nart">
                    {source && <div className="nsrc">SOURCE · {source}</div>}
                    {paras.length ? (
                      paras.map((p, j) => <p key={j}>{p}</p>)
                    ) : (
                      <p className="nempty">No written summary available for this item.</p>
                    )}
                    {points.length > 0 && (
                      <div className="nkp">
                        <div className="nkph">KEY POINTS</div>
                        <ul>
                          {points.map((pt, j) => <li key={j}>{pt}</li>)}
                        </ul>
                      </div>
                    )}
                    {it.url && (
                      <a className="nyt" href={it.url} target="_blank" rel="noreferrer">
                        Watch on YouTube ↗
                      </a>
                    )}
                  </article>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
