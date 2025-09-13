import axios from "axios";

function normalizeApiBase(raw) {
  if (!raw) return "";
  const trimmed = raw.replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "");
const API_BASE = normalizeApiBase(rawBase);

if (!API_BASE && !import.meta.env.DEV) {
  console.warn(
    "API base URL not set. Define VITE_API_BASE_URL (preferred) or VITE_BACKEND_URL in your environment. Falling back to same-origin /api."
  );
}

const api = axios.create({
  baseURL: API_BASE || "/api",
  withCredentials: true,
});

// --- Auth handling: auto-refresh & auto-logout on expiry ---
let refreshPromise = null; // gate concurrent 401s

async function performLogoutAndRedirect() {
  try {
    // Avoid looping interceptors on logout call
    await api.post(`auth/logout`, null, { __isLogout: true }).catch(() => {});
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem("user");
  } catch {
    /* ignore */
  }
  // Hard redirect to login
  if (typeof window !== "undefined") {
    const here = window.location?.pathname || "";
    if (here !== "/login") window.location.assign("/login");
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error || {};
    const status = response?.status;
    const isAuthEndpoint =
      config?.url?.includes("auth/refresh") ||
      config?.url?.includes("auth/login") ||
      config?.url?.includes("auth/register") ||
      config?.__isRefresh ||
      config?.__isLogout;

    // If unauthorized and not already retried, try refresh once
    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      if (!refreshPromise) {
        // Start a single refresh request all 401s will await
        refreshPromise = api
          .post(`auth/refresh`, null, { __isRefresh: true })
          .then(() => {
            refreshPromise = null;
          })
          .catch((e) => {
            refreshPromise = null;
            throw e;
          });
      }
      try {
        await refreshPromise;
        // Retry original request after successful refresh
        return api.request(config);
      } catch {
        // Refresh failed: logout and redirect
        await performLogoutAndRedirect();
        return Promise.reject(error);
      }
    }

    // If refresh itself failed with 401, force logout
    if (status === 401 && isAuthEndpoint) {
      await performLogoutAndRedirect();
    }
    return Promise.reject(error);
  }
);

export async function getActivities({ limit = 200, offset = 0 } = {}) {
  const { data } = await api.get(`activities`, {
    params: { limit, offset },
  });
  return data; // { items, total, limit, offset }
}

// Cached activities list similar to weekends
export function getActivitiesCached(params = {}) {
  const q = { limit: 200, offset: 0, ...params };
  return {
    initial: (async () => {
      const mod = await import("./storage.js");
      return (await mod.getCachedActivities(q)) ?? null;
    })(),
    refresh: (async () => {
      const { data } = await api.get(`activities`, { params: q });
      try {
        const mod = await import("./storage.js");
        await mod.setCachedActivities(q, data);
      } catch {
        // best-effort caching
      }
      return data;
    })(),
  };
}

export async function createActivity({
  title,
  description,
  category,
  durationMin,
  icon,
  tags,
  isPremium,
  defaultMood,
} = {}) {
  const payload = {
    title,
    description,
    category,
    durationMin,
    icon,
    tags,
    isPremium,
    defaultMood,
  };
  const { data } = await api.post(`activities`, payload);
  return data;
}

export async function updateActivity(id, patch = {}) {
  const { data } = await api.put(`activities/${id}`, patch);
  return data;
}

export async function deleteActivity(id) {
  const { data } = await api.delete(`activities/${id}`);
  return data;
}

export async function getWeekends({ includeDays = true } = {}) {
  const { data } = await api.get(`weekends`, {
    params: { includeDays },
  });
  return data; // array of weekend plans (optionally with days)
}

// Cached fetch: return cached weekends immediately (if present), then refresh in background.
// Returns { initial, refresh }: initial is cached or null, refresh is a Promise for network data.
export function getWeekendsCached({ includeDays = true } = {}) {
  // Lazy import to avoid cycle
  return {
    initial: (async () => {
      const mod = await import("./storage.js");
      return (await mod.getCachedWeekends()) ?? null;
    })(),
    refresh: (async () => {
      const { data } = await api.get(`weekends`, { params: { includeDays } });
      try {
        const mod = await import("./storage.js");
        await mod.setCachedWeekends(data);
      } catch {
        // caching is best-effort
      }
      return data;
    })(),
  };
}

export async function createWeekend({
  startDate,
  endDate,
  title,
  mood,
  isTemplate = false,
  days,
} = {}) {
  const payload = { startDate, endDate, title, mood, isTemplate, days };
  const { data } = await api.post(`weekends`, payload);
  return data;
}

export async function updateWeekend(
  id,
  { title, mood, startDate, endDate } = {}
) {
  const payload = {};
  if (title !== undefined) payload.title = title;
  if (mood !== undefined) payload.mood = mood;
  if (startDate !== undefined) payload.startDate = startDate;
  if (endDate !== undefined) payload.endDate = endDate;
  const { data } = await api.put(`weekends/${id}`, payload);
  return data;
}

export async function deleteWeekend(id) {
  const { data } = await api.delete(`weekends/${id}`);
  return data;
}

export async function getWeekend(id) {
  const { data } = await api.get(`weekends/${id}`);
  return data;
}

export async function listDaysForWeekend(weekendId) {
  const { data } = await api.get(`weekends/${weekendId}/days`);
  return data;
}

export async function addActivityToDay(
  dayId,
  { activityId, order, notes, customMood } = {}
) {
  const payload = { activityId, order, notes, customMood };
  const { data } = await api.post(`activities/day/${dayId}/instances`, payload);
  return data; // created activity_instance row
}

export async function createDayForWeekend(
  weekendId,
  { date, dayLabel, order, notes, colorTheme } = {}
) {
  const payload = { date, dayLabel, order, notes, colorTheme };
  const { data } = await api.post(`weekends/${weekendId}/days`, payload);
  return data; // created day row
}

export async function updateDayForWeekend(weekendId, dayId, patch) {
  const { data } = await api.put(`weekends/${weekendId}/days/${dayId}`, patch);
  return data; // updated day row
}

export async function updateActivityInstance(
  instanceId,
  { order, notes, customMood } = {}
) {
  const payload = {};
  if (order !== undefined) payload.order = order;
  if (notes !== undefined) payload.notes = notes;
  if (customMood !== undefined) payload.customMood = customMood;
  const { data } = await api.put(`activities/instances/${instanceId}`, payload);
  return data;
}

export async function deleteActivityInstance(instanceId) {
  const { data } = await api.delete(`activities/instances/${instanceId}`);
  return data;
}

export async function toggleCompleteActivity(instanceId) {
  const { data } = await api.post(
    `activities/instances/${instanceId}/complete`
  );
  return data;
}

export async function logout() {
  const { data } = await api.post(`auth/logout`);
  return data;
}

export default api;
