# BFL Terminal — Agent Context

A Bloomberg-terminal-style dashboard for the Biddenham Fantasy League (an FPL
classic mini-league). Vite + React (plain JS), deployed on Vercel, auto-deploys
on push to `main`.

Read this before changing anything. It is a contract, not background reading.

## Architecture — two repos (important)

- **bfl-terminal** (THIS repo): the front-end only. Code, no data.
- **bfl-data** (separate, public): the data, populated nightly by a Raspberry Pi
  pipeline. It is **READ-ONLY from this app's perspective.** This app fetches
  JSON from it at runtime and never writes to it. Do not modify, restructure, or
  assume control of bfl-data, and do not propose changes that require it.

## Data contract — do NOT break

The app fetches from the `REPO` base URL in `src/lib.jsx`
(`https://raw.githubusercontent.com/97wfinney/bfl-data/main`):

- `/data/status.json` → `{ season, current_gw, finished, updated_at }`.
  The entry point: it tells the app which season is live.
- `/data/<season>/reports/league.json` →
  `{ season, current_gw, finished, updated_at, league:{id,name}, managers:[...] }`.
  Each manager: `{ entry, manager, team, rank, last_rank, rank_movement,
  official_total, gross_points, hits, total, gw_points, gw_hits, chips_used,
  history:[{gw, points, hits, net, total, bench, overall_rank}] }`.
- `/data/<season>/summaries/feed.json` →
  `{ updated_at, items:[{channel, title, url, video_id, published_at, summary}] }`
  (may be empty — handle gracefully).
- `/data/<season>/mini_league/entries/<entry>/history.json` → raw FPL history:
  `{ current:[...], past:[{season_name, total_points, rank}], chips:[{name, event, time}] }`
  (fetched lazily on manager pages).

These field names and paths are produced by the Pi pipeline and are a **fixed
contract**. If a feature needs a field that isn't here, that's a change in the
*other* repo — flag it, do not rename, fabricate, or guess fields.

## Conventions — keep

- **Season-agnostic.** Never hardcode a season. Always read `status.json` →
  `season`, then build paths from it. (This is what lets the site roll to the
  next season automatically each August. Do not break it.)
- **Routing.** Lightweight hash routing in `App.jsx` (`#/manager/:entry`). No
  react-router, no server-side routing, no Vercel rewrite config.
- **No new dependencies** unless genuinely necessary. No backend, no state
  library, no CSS framework. Plain React + plain CSS.
- **No browser storage** (localStorage / sessionStorage).
- **Aesthetic.** IBM Plex Mono; palette defined in `:root` in `src/index.css`
  (amber `#ff9e1b` on black, green `#33e06a` for up, red `#ff4b45` for down).
  Dense, monospace, terminal styling. Keep this look — do not introduce generic
  component-library styling.

## File map

- `src/main.jsx` — Vite entry. Don't touch.
- `src/index.css` — global reset, font import, CSS variables (the palette).
- `src/App.jsx` — fetches data once, hash-routes between views, renders the shared CommandBar.
- `src/lib.jsx` — shared: `REPO`, `getJSON`, formatters, `Move`, `CommandBar`.
- `src/LeagueView.jsx` — standings table + news wire + scrolling ticker tape.
- `src/ManagerView.jsx` — manager detail: points chart, season stats, chip timeline, previous seasons, GW log.
- `src/App.css` — all component styles.

## Guardrails

- This is a working, deployed app. Make minimal, targeted changes.
- Preserve the data contract, the season-agnostic design, and the aesthetic.
- Don't swap the framework, add SSR, or restructure the fetch flow.
- Check the live data shapes before changing how anything is read.