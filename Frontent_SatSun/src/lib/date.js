// Simple date helpers used across pages

export function toISODate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString();
}

export function formatDate(d, opts) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, opts);
}

export function formatDateRange(start, end, opts) {
  return `${formatDate(start, opts)} – ${formatDate(end, opts)}`;
}
