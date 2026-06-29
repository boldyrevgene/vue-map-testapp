# Server

Node.js + Express REST API server. Data is stored locally in JSON files (`data/places.json`, `data/users.json`).

## Running

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3000`. The `dev` command runs Node.js with the `--watch` flag, so the server automatically restarts on file changes.

## REST API

### Places — `/api/places`

| Method   | Path               | Description                                                                          |
|----------|--------------------|--------------------------------------------------------------------------------------|
| `GET`    | `/api/places`      | Returns all places from `data/places.json`. |
| `POST`   | `/api/places`      | Creates a new place. Required fields: `name`, `type`, `coordinates`. Generates `id` via `randomUUID()`, persists to file, returns the created place with status `201`. |
| `PUT`    | `/api/places/:id`  | Fully updates a place by `id`. Required fields: `name`, `type`, `coordinates`. Returns the updated place or `404` if not found. |
| `DELETE` | `/api/places/:id`  | Deletes a place by `id`. Returns `{ id, status: 'Ok' }` or `404` if not found. |

`Place` object shape:

```json
{
  "id": "uuid",
  "name": "string",
  "type": "string",
  "coordinates": [lng, lat],
  "description": "string"
}
```

### Users — `/api/users`

| Method | Path          | Description                              |
|--------|---------------|------------------------------------------|
| `GET`  | `/api/users`  | Returns all users from `data/users.json`. |

`User` object shape:

```json
{
  "id": "uuid",
  "name": "string",
  "coordinates": [lng, lat]
}
```

## WebSocket

Every **500 ms** a message with user movement simulation updates is broadcast to all connected clients. On new connection the client receives a snapshot of the current state as the first message.

### Message Format

```json
{
  "removed": ["id1", "id2"],
  "added":   [{ "id": "...", "name": "...", "coordinates": [lng, lat] }],
  "updated": [{ "id": "...", "coordinates": [lng, lat] }]
}
```

The same contract is used for both snapshots and ticks:

- `removed` — ids of users that no longer exist (always empty in the snapshot).
- `added` — full user objects. On the first message after connecting, contains **all** current users (snapshot).
- `updated` — id + new coordinates for users that changed position.

The snapshot on connect arrives as `added` — no separate REST API fetch is needed.

### Simulation Logic (`simulation.js`)

Each user in the server's internal state has fields `{ id, name, lat, lng, speed, angle }`, where `speed` and `angle` are hidden from the client.

**Movement** is implemented via the wander algorithm:

1. Each tick, angle receives a small random turn within ±30° (`MAX_TURN`).
2. Coordinates update as `lat += speed * cos(angle)`, `lng += speed * sin(angle)`.
3. If a user approaches the Kyiv bbox boundary (within ~1 km — `BBOX_MARGIN`), their angle is gently pulled toward Kyiv's center with coefficient 0.15 (`BIAS_STRENGTH`). No sharp U-turns — a soft "repulsion".

**Speed** is generated randomly per user at creation time from the `MIN_SPEED..MAX_SPEED` range (in degrees per tick). At Kyiv's latitude this yields approximately **2.5–200 km/h** depending on direction (lat and lng have different km-per-degree scales).

**User count** is not fixed — every 10 ticks (`ADD_REMOVE_N_TICKS`) the server adds 1–10 new users and removes the same number, biased toward `initialCount` (the starting count from `users.json`). If population is above the target, more are removed than added; if below, the opposite.

**Kyiv bbox:** lat 50.36–50.56, lng 30.34–30.70 — covers all 10 districts. Both spawning new users and keeping existing ones are constrained to these bounds.
