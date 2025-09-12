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

export async function getActivities({ limit = 200, offset = 0 } = {}) {
  const { data } = await api.get(`activities`, {
    params: { limit, offset },
  });
  return data; // { items, total, limit, offset }
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

export default api;
