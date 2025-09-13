// Lightweight storage helpers: IndexedDB (preferred) with localStorage fallback
// Stores JSON values under a simple key space.

const DB_NAME = "satsun-cache-v1";
const STORE = "weekends"; // simple store name; we key multiple lists inside

function openDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("no-indexeddb"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("idb-open-failed"));
  });
}

async function idbGet(key) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const get = tx.objectStore(STORE).get(key);
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => reject(get.error);
    });
  } catch {
    return undefined;
  }
}

async function idbSet(key, value) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

// LocalStorage JSON helpers as fallback/portable utilities
export function lsGetJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function lsSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Public API for weekends caching
const WEEKENDS_KEY = "weekends:list:v1";
const ACTIVITIES_KEY = (params) =>
  `activities:list:v1:${params?.limit ?? 200}:${params?.offset ?? 0}`;

export async function getCachedWeekends() {
  const fromIdb = await idbGet(WEEKENDS_KEY);
  if (fromIdb !== undefined) return fromIdb;
  return lsGetJSON(WEEKENDS_KEY);
}

export async function setCachedWeekends(value) {
  await idbSet(WEEKENDS_KEY, value);
  lsSetJSON(WEEKENDS_KEY, value);
}

// Generic cache helpers (optional reuse)
export const storage = {
  getJSON: lsGetJSON,
  setJSON: lsSetJSON,
};

// Offline mutation queue removed per request

// Activities cache helpers
export async function getCachedActivities(params) {
  const key = ACTIVITIES_KEY(params);
  const fromIdb = await idbGet(key);
  if (fromIdb !== undefined) return fromIdb;
  return lsGetJSON(key);
}

export async function setCachedActivities(params, value) {
  const key = ACTIVITIES_KEY(params);
  await idbSet(key, value);
  lsSetJSON(key, value);
}
