import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

export async function getActivities({ limit = 200, offset = 0 } = {}) {
  const { data } = await api.get(`/api/activities`, {
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
  const { data } = await api.post(`/api/activities`, payload);
  return data;
}

export async function updateActivity(id, patch = {}) {
  const { data } = await api.put(`/api/activities/${id}`, patch);
  return data;
}

export async function deleteActivity(id) {
  const { data } = await api.delete(`/api/activities/${id}`);
  return data;
}

export async function getWeekends({ includeDays = true } = {}) {
  const { data } = await api.get(`/api/weekends`, {
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
  const { data } = await api.post(`/api/weekends`, payload);
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
  const { data } = await api.put(`/api/weekends/${id}`, payload);
  return data;
}

export async function deleteWeekend(id) {
  const { data } = await api.delete(`/api/weekends/${id}`);
  return data;
}

export async function getWeekend(id) {
  const { data } = await api.get(`/api/weekends/${id}`);
  return data;
}

export async function listDaysForWeekend(weekendId) {
  const { data } = await api.get(`/api/weekends/${weekendId}/days`);
  return data;
}

export async function addActivityToDay(
  dayId,
  { activityId, order, notes, customMood } = {}
) {
  const payload = { activityId, order, notes, customMood };
  const { data } = await api.post(
    `/api/activities/day/${dayId}/instances`,
    payload
  );
  return data; // created activity_instance row
}

export async function createDayForWeekend(
  weekendId,
  { date, dayLabel, order, notes, colorTheme } = {}
) {
  const payload = { date, dayLabel, order, notes, colorTheme };
  const { data } = await api.post(`/api/weekends/${weekendId}/days`, payload);
  return data; // created day row
}

export async function updateDayForWeekend(weekendId, dayId, patch) {
  const { data } = await api.put(
    `/api/weekends/${weekendId}/days/${dayId}`,
    patch
  );
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
  const { data } = await api.put(`/api/activities/${instanceId}`, payload);
  return data;
}

export async function deleteActivityInstance(instanceId) {
  const { data } = await api.delete(`/api/activities/${instanceId}`);
  return data;
}

export async function toggleCompleteActivity(instanceId) {
  const { data } = await api.post(`/api/activities/${instanceId}/complete`);
  return data;
}

export default api;
