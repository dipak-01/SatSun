import { supabase } from "../db/supabaseClient.js";

export async function exportImage(req, res) {
  try {
    const { weekendId, format = "png", options } = req.body;
    if (!weekendId)
      return res.status(400).json({ error: "weekendId required" });
    const { data, error } = await supabase
      .from("export_jobs")
      .insert({
        user_id: req.user.id,
        weekend_plan_id: weekendId,
        format,
        status: "queued",
        options,
      })
      .select()
      .single();
    if (error) throw error;
    // In a real app, enqueue a worker job
    return res.status(202).json({ jobId: data.id, status: data.status });
  } catch (e) {
    return res.status(500).json({ error: "export failed" });
  }
}

export async function shareWeekend(req, res) {
  try {
    const { weekendId, expiresAt, password } = req.body;
    if (!weekendId)
      return res.status(400).json({ error: "weekendId required" });
    const { data, error } = await supabase
      .from("shared_weekends")
      .insert({
        weekend_id: weekendId,
        expires_at: expiresAt || null,
        password: password || null,
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ uuid: data.id });
  } catch (e) {
    return res.status(500).json({ error: "share failed" });
  }
}

export async function getSharedWeekend(req, res) {
  try {
    const { uuid } = req.params;
    const { data: shared, error } = await supabase
      .from("shared_weekends")
      .select("*")
      .eq("id", uuid)
      .maybeSingle();
    if (error) throw error;
    if (!shared) return res.status(404).json({ error: "not found" });
    if (shared.expires_at && new Date(shared.expires_at) < new Date())
      return res.status(410).json({ error: "expired" });
    // increment view
    await supabase
      .rpc("increment_view_count", { row_id: uuid })
      .catch(() => {});
    // fetch weekend public data
    const { data: plan } = await supabase
      .from("weekend_plans")
      .select("*")
      .eq("id", shared.weekend_id)
      .single();
    const { data: days } = await supabase
      .from("day_instances")
      .select("*, activity_instances(*)")
      .eq("weekend_plan_id", shared.weekend_id)
      .order("order");
    return res.json({ ...plan, days });
  } catch (e) {
    return res.status(500).json({ error: "get shared failed" });
  }
}
