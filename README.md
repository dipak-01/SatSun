# SatSun (Weekendly)

Plan delightful weekends fast. Browse activities, build a schedule, and export/share—now with offline-friendly cached reads and a small reusable UI system.

## Live & Repo
- Live: (add your Vercel/Netlify URL)
- Repo: https://github.com/dipak-01/SatSun

## Features
- Browse activities with icons, category badges, and durations
- Create weekend plans with any number of days (not just Sat/Sun)
- Add, reorder (buttons), move across days, mark complete, and delete activities
- Templates gallery + Apply Template flow for quick planning
- Export weekend as PNG
- Themes (DaisyUI) and accessibility touches (ARIA, keyboard on list items)

### Super Stretch (added)
- Persistence: IndexedDB + localStorage cache for weekends and activities
- Scale: Memoized list rows; smooth with 50+ items
- Offline-friendly: App shell via SW, cached reads render when offline
- Testing: Vitest + jsdom; unit test for storage helpers
- System thinking: Spinner and Card atoms; planner updated to use Card

## Tech Stack
- Frontend: React + Vite, TailwindCSS + DaisyUI, Axios, React Router
- Backend: Express, JWT auth, Supabase Postgres client, cookie-based sessions
- Deployment: Vercel adapters present (both apps provide vercel.json)

## Project Structure
```
Backend_SatSun/
  app.js
  index.js
  package.json
  vercel.json
  api/
    index.js
    controllers/
    routes/
  db/
  middleware/
  models/
Frontent_SatSun/
  package.json
  vite.config.js
  public/
  src/
    components/
    pages/
    lib/
    __tests__/
```

## Run locally
### Backend
1) Set env vars in `Backend_SatSun/.env`:
   - `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `PORT=3000`
2) Install & start
```bash
cd Backend_SatSun
npm i
npm run dev
```
API at http://localhost:3000/api

### Frontend
1) Install & start
```bash
cd Frontent_SatSun
npm i
npm run dev
```
App at http://localhost:5173

Optional: set `VITE_API_BASE_URL` to your backend base (e.g., http://localhost:3000).

## Key UX
- Weekend planner: left pane lists weekends; right pane shows days and activity instances
- Add Day to extend beyond Sat/Sun
- Reorder via Move up/down; Move activity across days
- Export PNG from the detail header

## Persistence & Offline
- Cached reads: weekends and activities are stored in IndexedDB (fallback to localStorage)
- First paint uses cache; then we revalidate from network
- Service worker caches static assets for offline app shell

Implementation:
- `Frontent_SatSun/src/lib/storage.js`
- `Frontent_SatSun/src/lib/api.js` (getWeekendsCached/getActivitiesCached)
- `Frontent_SatSun/src/pages/WeekendPlannar.jsx`
- `Frontent_SatSun/public/sw.js`

## Performance
- Memoized ActivityRow in planner
- `React.memo` on `ActivityCard`

## Testing
- Framework: Vitest + jsdom
- Added: `src/__tests__/storage.test.js`
- Run tests
```bash
cd Frontent_SatSun
npm test
```

## Deploy
- Vercel: `vercel.json` present in both apps
- Backend exports a default handler for serverless (`Backend_SatSun/api/index.js`)
- Frontend is a standard Vite static build

## Roadmap (nice-to-have)
- Drag-and-drop with dnd-kit for reordering and cross-day moves
- SW stale-while-revalidate on `/api` GETs
- Offline mutation queue; conflict resolution via updated_at
- More tests (ActivityRow behavior, planner interactions)

---
Built for the Atlan take-home—two days, infinite possibilities.
