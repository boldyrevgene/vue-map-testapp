# UI

Vue.js 3 SPA built with Vite. Composition API, Pinia, MapLibre GL JS, Element Plus.

## Running

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build (includes type-check)
npm run type-check  # type-check only, no build
```

## Environment Variables

Create a `.env.local` file in the `ui/` directory:

```
VITE_API_BASE=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## `src/` Structure

### `components/`

| File | Purpose |
|------|---------|
| `AppHeader.vue` | App top bar: place filters by type, add-new-place button, button to re-open the panel when collapsed. |
| `AppLayout.vue` | Root layout: positions the map and side panel, controls panel visibility. |
| `MapView.vue` | Initializes MapLibre GL JS, subscribes to map events (marker clicks), syncs store state with map rendering via `MapService`. |
| `PlaceDetails.vue` | Selected place card: shows place details, list of three closest users, edit/delete buttons, and the create/edit form component. |
| `PlaceForm.vue` | Place create/edit form with validation (Element Plus). |
| `SidePanel.vue` | Side panel shell: collapse/close buttons, adaptive behavior (desktop — right overlay panel, mobile — bottom sheet). |
| `SidePanelContainer.vue` | Decides which content to render in the panel: `PlaceDetails` or `UserDetails` — based on the selected map marker. |
| `UserDetails.vue` | Selected user card: name and coordinates. |

### `constants/`

| File | Purpose |
|------|---------|
| `map.ts` | Initial map center and zoom (Kyiv), number of closest users to display (`CLOSEST_USERS_DISPLAY_COUNT = 3`). |
| `styles.ts` | Mobile breakpoint (`MOBILE_BREAKPOINT`), desktop panel width, mobile panel height in `dvh`, panel show/hide animation duration. |

### `services/`

| File | Purpose |
|------|---------|
| `api-service.ts` | HTTP client (`ApiService`): `fetchPlaces`, `createPlace`, `updatePlace`, `deletePlace`, `fetchUsers` methods. Centralized HTTP error handling via `ApiError`. Singleton `apiService` instantiated from `config`. |
| `map-icon-service.ts` | Loads SVG marker icons, colorizes them by state (`default` / `selected` / `closest`), rasterizes to `HTMLImageElement` at the required size. Caches SVG text in memory. |
| `map-service.ts` | All MapLibre GL JS logic: map initialization, GeoJSON sources and layers for places and users, marker updates, filtering, selection display, map center offset. Returns `MapPublicApi` for use in components. |

### `stores/`

| File | Purpose |
|------|---------|
| `places-store.ts` | Place state: list, index by `id`, `isLoading`, `error`. CRUD operations calling `apiService` with synchronous local array updates (no re-fetch). Manages place selection and draft state during creation. |
| `users-store.ts` | User state: list, index by `id`, `isLoading`, `error`. Loaded via `apiService.fetchUsers()`. Manages user selection. |
| `map-store.ts` | Derived store: computes `closestUsers` list (Haversine) relative to the selected place, stores active filter types, enforces mutual exclusivity of place and user selection. |
| `app-store.ts` | UI store: manages side panel state (expanded / collapsed / closed), tracks errors and shows `ElNotification`, auto-expands the panel when a new selection appears. |

### `utils/`

| File | Purpose |
|------|---------|
| `geo.ts` | Geo utilities: `haversineDistance(a, b)` for distance in kilometers, and `SpatialGridIndex` / `defineSpatialGridIndex` — a spatial index for finding N closest items. Details in the section below. |

## Finding N Closest Items (`utils/geo.ts`)

The task requires showing the 3 closest users to a selected place. My initial approach was to iterate the full user list, compute `haversineDistance` to each, sort, and take the top three — O(n) per click. `SpatialGridIndex` can significantly improve performance when there are large numbers of frequently-updating moving points on the map.

**Spatial grid index** — a 2D hash over grid cells into which items are bucketed by coordinates. Search expands outward in "rings" from the query cell until enough candidates are collected.

### How it works

The index is a `Map<cellId, Map<itemId, item>>`. `cellId` is derived from a point's coordinates by multiplying by `GRID_RESOLUTION` and flooring: `"3051_5044"`. Each item belongs to exactly one cell.

`findClosestTo(query)` starts at the cell containing the query point and expands in square rings: radius 0 — center cell only, radius 1 — perimeter of 8 neighbors, radius 2 — next layer of 16 cells, and so on. Once `limit` candidates are found, the algorithm does one extra ring (because a square perimeter can contain a point closer than those in the center cell), sorts everything by `haversineDistance`, and trims to `limit`.

Average complexity is close to O(k), where k is the number of items in the visited cells, not O(n) over the full dataset.

### Tuning — `GRID_RESOLUTION`

This is a **correctness and performance parameter**. In `constants/map.ts` it is exposed as the `GRID_INDEX_CONFIG` preset with several ready-made options (from ~100 m to ~10 km per cell side for Ukrainian latitudes). Current value — `CELL_1KM` (~1.1 km × 740 m).

Cell shape depends on latitude, so algorithm accuracy and efficiency can also vary significantly depending on the geographic area being searched.

### Why a custom implementation instead of a library

There are ready-made spatial index implementations — for example [RBush](https://github.com/mourner/rbush) (R-tree), [KDBush](https://github.com/mourner/kdbush) (k-d tree), [Supercluster](https://github.com/mourner/supercluster). All of them outperform this on large datasets and cover more edge cases, but I implemented my own out of curiosity and uncertainty about whether using extra libraries would be appropriate for a take-home assignment.
