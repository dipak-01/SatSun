export function byIdMap(items = [], key = "id") {
  const m = new Map();
  for (const it of items) m.set(it?.[key], it);
  return m;
}
