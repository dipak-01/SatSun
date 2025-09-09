import { supabase } from "../db/supabaseClient.js";

export async function updateDay(req, res) {
  try {
    const { dayId } = req.params;
    const { dayLabel, notes, colorTheme } = req.body;
    const patch = {};
    if (dayLabel !== undefined) patch.day_label = dayLabel;
    if (notes !== undefined) patch.notes = notes;
    if (colorTheme !== undefined) patch.color_theme = colorTheme;
    const { data, error } = await supabase
      .from("day_instances")
      .update(patch)
      .eq("id", dayId)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "update day failed" });
  }
}

export async function deleteDay(req, res) {
  try {
    const { dayId } = req.params;
    const { error } = await supabase
      .from("day_instances")
      .delete()
      .eq("id", dayId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "delete day failed" });
  }
}
