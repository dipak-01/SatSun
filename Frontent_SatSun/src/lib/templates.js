// Built-in weekend templates
// Each template lists day labels and a list of activity queries to match user activities.
// We attempt best-effort matching by title substring or category.

export const WEEKEND_TEMPLATES = [
  {
    id: "chill-weekend",
    title: "Chill Weekend",
    description: "Relaxed, cozy plans with downtime and light activities.",
    days: [
      {
        label: "Saturday",
        activities: [
          { titleIncludes: "brunch" },
          { titleIncludes: "movie" },
          { titleIncludes: "walk" },
        ],
      },
      {
        label: "Sunday",
        activities: [
          { titleIncludes: "coffee" },
          { titleIncludes: "read" },
          { titleIncludes: "meal" },
        ],
      },
    ],
  },
  {
    id: "adventure-weekend",
    title: "Adventure Weekend",
    description: "Outdoorsy fun with hikes, picnics, and exploring.",
    days: [
      {
        label: "Saturday",
        activities: [
          { titleIncludes: "hike" },
          { titleIncludes: "picnic" },
          { titleIncludes: "photo" },
        ],
      },
      {
        label: "Sunday",
        activities: [
          { titleIncludes: "cycle" },
          { titleIncludes: "explore" },
          { titleIncludes: "dinner" },
        ],
      },
    ],
  },
  {
    id: "self-care-weekend",
    title: "Self-care Weekend",
    description: "Mindful activities to recharge and reset.",
    days: [
      {
        label: "Saturday",
        activities: [
          { titleIncludes: "yoga" },
          { titleIncludes: "spa" },
          { titleIncludes: "journal" },
        ],
      },
      {
        label: "Sunday",
        activities: [
          { titleIncludes: "garden" },
          { titleIncludes: "bake" },
          { titleIncludes: "sleep" },
        ],
      },
    ],
  },
  {
    id: "productive-fun",
    title: "Productive + Fun",
    description: "Get things done and unwind with something you enjoy.",
    days: [
      {
        label: "Saturday",
        activities: [
          { titleIncludes: "clean" },
          { titleIncludes: "plan" },
          { titleIncludes: "game" },
        ],
      },
      {
        label: "Sunday",
        activities: [
          { titleIncludes: "grocery" },
          { titleIncludes: "workout" },
          { titleIncludes: "code" },
        ],
      },
    ],
  },
];

export function matchActivityId(activities, query) {
  if (!Array.isArray(activities) || !activities.length || !query) return null;
  const norm = (s) => (s || "").toLowerCase();
  const titleInc = norm(query.titleIncludes);
  const category = norm(query.category);
  // score match: titleIncludes > category
  let best = null;
  let bestScore = -1;
  for (const a of activities) {
    const at = norm(a.title);
    const ac = norm(a.category);
    let score = 0;
    if (titleInc && at.includes(titleInc)) score += 2;
    if (category && ac === category) score += 1;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  if (bestScore <= 0) return null;
  return best?.id || null;
}
