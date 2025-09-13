# SatSun (Weekendly) ✨

Plan delightful weekends fast. Browse activities, build a schedule, and export/share — now offline-friendly and snappy.

## 🔗 Live & Repo
- Live: https://sat-sun.vercel.com
- Repo: https://github.com/dipak-01/SatSun

## 🌟 Frontend Features
- 🗂️ Activity Library: icons, categories, durations
- 🗓️ Weekend Planner: any number of days (not just Sat/Sun)
- ➕ Add Activities: per-day modal with ordering
- 🔁 Reorder & Move: move up/down and between days
- ✅ Complete & Delete: quick toggles and actions
- 🧩 Templates: gallery + apply to auto-build weekends
- 🖼️ Export: one-click PNG export of your plan
- 🎨 Themes: DaisyUI themes (incl. custom), theme switcher
- 🧭 Onboarding: friendly tips for first-time users
- 📅 Holiday Aware: calendar page with holidays support
- 📲 PWA-Ready: install prompt, manifest, service worker
- 🧠 Cached Reads: IndexedDB + localStorage for weekends & activities
- ⚡ Performance: memoized list rows, smooth with 50+ items
- ♿ Accessibility: roles/ARIA, keyboard support on lists

## 🛠️ Frontend Stack
- React + Vite
- Tailwind CSS + DaisyUI
- React Router
- Axios
- Vitest (+ jsdom)

## 📁 Project Structure (Frontend)
```
Frontent_SatSun/
  package.json
  vite.config.js
  public/
    sw.js
    manifest.webmanifest
  src/
    components/
    pages/
    lib/
    __tests__/
```

## 🚀 Getting Started (Frontend)
1) Install deps
```bash
cd Frontent_SatSun
npm i
```
2) Run dev server
```bash
npm run dev
```
App: http://localhost:5173

Optional: set `VITE_API_BASE_URL` to your backend base (e.g., http://localhost:3000).

## 🧳 Persistence & Offline
- 🗃️ IndexedDB (fallback: localStorage) for cached weekends and activities
- ⚡ Instant first paint from cache, then background revalidate
- 🛰️ Service worker caches static assets for offline app shell

Key files:
- `Frontent_SatSun/src/lib/storage.js`
- `Frontent_SatSun/src/lib/api.js` (getWeekendsCached / getActivitiesCached)
- `Frontent_SatSun/src/pages/WeekendPlannar.jsx`
- `Frontent_SatSun/public/sw.js`

## 🧪 Testing
- Vitest + jsdom
- Unit test: `src/__tests__/storage.test.js`
```bash
cd Frontent_SatSun
npm test
```

---
Built for the Atlan take-home — two days, infinite possibilities.
