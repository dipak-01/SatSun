# Weekendly – Persistence, Performance, Offline, Testing, and UI Primitives

This document summarizes the minimal, low-risk improvements added to the frontend to cover:

- Persistence: Save and load weekend plans and activities from IndexedDB with a localStorage fallback.
- Scale: Keep UI smooth with 50+ activities via memoization.
- Offline-friendly: Load last-known data when the network is off.
- Testing: Add automated unit tests.
- System thinking: Introduce small reusable UI atoms.

## What changed (at a glance)

- Persistence/cache

  - `src/lib/storage.js`: IndexedDB-backed helpers with localStorage fallback.
  - `src/lib/api.js`: Cached fetch helpers `getWeekendsCached()` and `getActivitiesCached()`.
  - `src/pages/WeekendPlannar.jsx`: Uses cached helpers to show data instantly, then revalidate.

- Performance

  - `src/pages/WeekendPlannar.jsx`: Memoized `ActivityRow` list items.
  - `src/components/ActivityCard.jsx`: Wrapped in `React.memo` to avoid unnecessary re-renders.

- Offline-friendly

  - Read path fetches from cache first, so planner/activity lists appear even if offline.
  - Existing service worker continues to cache static assets (`public/sw.js`).

- Testing

  - `src/__tests__/storage.test.js`: Tests JSON storage helpers.

- UI primitives (mini design system)
  - `src/components/ui/Spinner.jsx`: Consistent loading indicator.
  - `src/components/ui/Card.jsx`: Simple card wrapper for consistent layout.
  - `WeekendPlannar.jsx` updated to use Card without changing visuals.

## Persistence details

- File: `src/lib/storage.js`

  - IndexedDB database: `satsun-cache-v1`
  - Single object store (key-value); specific keys used:
    - `weekends:list:v1` – array of weekend objects (optionally with days)
    - `activities:list:v1:<limit>:<offset>` – activities list payload `{ items, total, limit, offset }`
  - Public helpers:
    - `getCachedWeekends()` / `setCachedWeekends(data)`
    - `getCachedActivities(params)` / `setCachedActivities(params, data)`
    - `lsGetJSON(key)` / `lsSetJSON(key, value)` for localStorage JSON
  - Behavior: best-effort caching; no TTL enforced. Server data always revalidates in the background after initial render.

- File: `src/lib/api.js`

  - `getWeekendsCached({ includeDays })`
  - `getActivitiesCached({ limit, offset })`
  - Both return an object with `{ initial, refresh }`:
    - `initial`: a Promise resolving to cached data (or null)
    - `refresh`: a Promise resolving to fresh network data and updating the cache

- File: `src/pages/WeekendPlannar.jsx`
  - On mount: awaits cached weekends and activities, updates UI immediately; then awaits both refresh Promises and updates again with fresh data.

Limitations (by design for minimal changes):

- No background sync or offline mutation queue.
- No cache invalidation beyond “refresh after load”.

## Performance improvements (50+ activities)

- Memoized row component for activity instances inside the day list:
  - `ActivityRow` defined via `useMemo(() => memo(function ActivityRow(...) {...}), [])`.
  - Cuts re-renders when unrelated list items update (e.g., toggling one checkbox).
- `ActivityCard.jsx` wrapped with `React.memo` (prop equality by reference) to avoid unnecessary re-renders in grids/lists.

If you need more scale:

- Consider windowing/virtualization (e.g., `react-virtual` or `react-window`).
- Keep props stable (memoize handlers) when possible to maximize memo gains.

## Offline-friendly behavior

- Static assets are handled by the existing service worker (`public/sw.js`).
- Weekend and activity lists are served from cache first. If offline, the last-known data renders.
- When the network returns, revalidation updates the UI automatically.

## Testing

- File: `src/__tests__/storage.test.js`
  - Verifies localStorage JSON helpers read/write behavior and bad JSON handling.
- Config: `vite.config.js` sets Vitest environment to `jsdom` with `vitest.setup.js` importing `@testing-library/jest-dom`.

Run tests (fish shell):

```fish
cd "Frontent_SatSun"; and npm test --silent
```

## Mini design system (UI primitives)

- `src/components/ui/Spinner.jsx`
  - Usage: `<Spinner size="lg" />` (sizes: `sm|md|lg` via DaisyUI’s loading classes)
- `src/components/ui/Card.jsx`
  - Props: `{ title, actions, className, children }`
  - Keeps DaisyUI `.card` and `.card-body` semantics; style remains unchanged where introduced.

Example:

```jsx
import Card from "../components/ui/Card";

<Card
  className="bg-base-100"
  title="My Card"
  actions={<button className="btn btn-sm">Action</button>}
>
  <p>Content</p>
</Card>;
```

## Try it

1. Start the frontend

```fish
cd "Frontent_SatSun"; and npm run dev
```

2. Load the Weekend Planner; your last weekends/activities will appear instantly from cache.
3. Simulate offline (DevTools → Network → Offline): UI renders from cache; static shell is served by the service worker.

## Next steps (optional)

- Add stale-while-revalidate in the service worker for `/api` GETs.
- Add an offline mutation queue for POST/PUT/DELETE using IndexedDB + Background Sync.
- Add cache TTLs or ETag-based validation per endpoint.
- Virtualize long lists if activities grow to hundreds/thousands.

---

Minimal changes, immediate gains: cached reads, smoother lists, consistent atoms, and tests to guard the new storage.
