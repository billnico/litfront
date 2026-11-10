# lit (frontend)

React + Vite frontend for a dating site for Malawian universities and colleges.
Every user must choose a university or college at sign-up (or **None**).

Palette: blue `#1558ff`, white, black `#0a0b10`. Styling is Tailwind.

Subscribe is **MWK 500** for 30 days, paid through [PayChangu standard checkout](https://developer.paychangu.com/docs/standard-checkout). The secret key stays on the backend (see [`API_CONTRACT.md`](./API_CONTRACT.md) §3.7). In demo mode, Subscribe opens a local stand-in instead of `checkout.paychangu.com`.

## Run

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

By default `VITE_USE_MOCK=true`: a built-in demo backend and fake realtime bus, so you can click around without any server.
Log in as `demo@lit.mw` (any password) or register. Matching with Chimwemwe, Thoko or Kondwani produces a match and a live reply.

## Using your real backend

1. Implement the endpoints in [`API_CONTRACT.md`](./API_CONTRACT.md).
2. In `.env`: `VITE_USE_MOCK=false`, set `VITE_API_BASE_URL`, `VITE_CENTRIFUGO_URL`.
3. `npm run build` → deploy `dist/`.

## How messaging works

- The UI only calls the REST API (`src/api/real.js`). Sending a message = `POST /matches/{id}/messages`.
- The backend validates, stores, then publishes to Centrifugo. The UI receives it on its personal channel `user:{id}` (`src/realtime/connect.js`).
- Sent messages appear instantly as "Sending…", then merge with the server copy and the realtime echo by `client_id`.

## Structure

```
src/
  api/        http.js (fetch + token refresh), real.js (endpoints), mock.js (demo backend)
  realtime/   connect.js (centrifuge-js, token callbacks)
  context/    Auth, Realtime (event bus + status), Inbox (matches + unread)
  pages/      Login, Register, Discover, Matches, Chat, Profile, Subscribe (+ PayChangu return pages)
  components/ Layout, UniversitySelect, Field, Modal, Avatar, ...
  universities.js  fallback list + the reserved "none" value
```
