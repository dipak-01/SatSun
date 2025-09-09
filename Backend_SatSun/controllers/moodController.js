import { supabase } from "../db/supabaseClient.js";

const MOODS = [
  "chill",
  "adventurous",
  "productive",
  "romantic",
  "family",
  "outdoors",
  "rainy-day",
];

export function getMoods(_req, res) {
  return res.json(MOODS);
}

export async function setWeekendMood(req, res) {
  try {
    const { weekendId, mood } = req.body;
    if (!weekendId || !mood)
      return res.status(400).json({ error: "weekendId and mood required" });
    const { data, error } = await supabase
      .from("weekend_plans")
      .update({ mood })
      .eq("id", weekendId)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "set mood failed" });
  }
}

export async function getSuggestions(req, res) {
  try {
    const { mood } = req.query;
    const moodFilter = mood ? { default_mood: mood } : {};
    let query = supabase.from("activities").select("*");
    if (mood) query = query.eq("default_mood", mood);
    const { data, error } = await query.limit(10);
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "suggestions failed" });
  }
}
