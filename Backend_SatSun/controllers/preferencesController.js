import { supabase } from "../db/supabaseClient.js";

export async function getPreferences(req, res) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", req.user.id)
      .single();
    if (error) throw error;
    return res.json(data.preferences || {});
  } catch (e) {
    return res.status(500).json({ error: "get preferences failed" });
  }
}

export async function updatePreferences(req, res) {
  try {
    const prefs = req.body || {};
    const { data, error } = await supabase
      .from("users")
      .update({ preferences: prefs })
      .eq("id", req.user.id)
      .select("preferences")
      .single();
    if (error) throw error;
    return res.json(data.preferences || {});
  } catch (e) {
    return res.status(500).json({ error: "update preferences failed" });
  }
}
