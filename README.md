# vue-map-testapp

An interactive map SPA built with Vue.js 3, MapLibre GL JS and a Node.js/Express backend.

## Structure

- [`ui/`](ui/README.md) — Vue.js 3 SPA (Composition API, Pinia, MapLibre GL JS)
- [`server/`](server/README.md) — Node.js + Express REST API + WebSocket server

## Running

### Server

```bash
cd server
npm install
npm run dev
```

Starts the API server at `http://localhost:3000`.

### UI

```bash
cd ui
npm install
npm run dev
```

Starts the Vite dev server at `http://localhost:5173`.
