import { supabase } from "../db/supabaseClient.js";

// Instances on days
export async function addActivityToDay(req, res) {
  try {
    const { dayId } = req.params;
    const {
      activityId,
      order = 0,
      startTime,
      endTime,
      notes,
      customMood,
    } = req.body;
    if (!activityId)
      return res.status(400).json({ error: "activityId required" });
    const { data, error } = await supabase
      .from("activity_instances")
      .insert({
        activity_id: activityId,
        day_id: dayId,
        order,
        start_time: startTime || null,
        end_time: endTime || null,
        notes: notes || null,
        custom_mood: customMood || null,
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (e) {
    return res.status(500).json({ error: "add activity failed" });
  }
}

export async function updateActivityInstance(req, res) {
  try {
    const { instanceId } = req.params;
    const { order, startTime, endTime, notes, customMood } = req.body;
    const patch = {};
    if (order !== undefined) patch.order = order;
    if (startTime !== undefined) patch.start_time = startTime;
    if (endTime !== undefined) patch.end_time = endTime;
    if (notes !== undefined) patch.notes = notes;
    if (customMood !== undefined) patch.custom_mood = customMood;
    const { data, error } = await supabase
      .from("activity_instances")
      .update(patch)
      .eq("id", instanceId)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "update activity failed" });
  }
}

export async function deleteActivityInstance(req, res) {
  try {
    const { instanceId } = req.params;
    const { error } = await supabase
      .from("activity_instances")
      .delete()
      .eq("id", instanceId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "delete activity failed" });
  }
}

export async function toggleCompleteActivity(req, res) {
  try {
    const { instanceId } = req.params;
    const { data: existing, error: getErr } = await supabase
      .from("activity_instances")
      .select("is_completed")
      .eq("id", instanceId)
      .single();
    if (getErr) throw getErr;
    const { data, error } = await supabase
      .from("activity_instances")
      .update({ is_completed: !existing.is_completed })
      .eq("id", instanceId)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "toggle complete failed" });
  }
}

// Catalog endpoints (admin: for demo, no role check)
export async function catalogList(_req, res) {
  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("title");
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "list activities failed" });
  }
}

export async function catalogGet(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "not found" });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "get activity failed" });
  }
}

export async function catalogCreate(req, res) {
  try {
    const {
      title,
      description,
      category,
      durationMin,
      icon,
      tags,
      isPremium,
      defaultMood,
    } = req.body;
    if (!title || !category || durationMin == null)
      return res
        .status(400)
        .json({ error: "title, category, durationMin required" });
    const { data, error } = await supabase
      .from("activities")
      .insert({
        title,
        description,
        category,
        duration_min: durationMin,
        icon,
        tags: tags || [],
        is_premium: !!isPremium,
        default_mood: defaultMood || null,
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (e) {
    return res.status(500).json({ error: "create activity failed" });
  }
}

export async function catalogUpdate(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      durationMin,
      icon,
      tags,
      isPremium,
      defaultMood,
    } = req.body;
    const patch = {};
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (category !== undefined) patch.category = category;
    if (durationMin !== undefined) patch.duration_min = durationMin;
    if (icon !== undefined) patch.icon = icon;
    if (tags !== undefined) patch.tags = tags;
    if (isPremium !== undefined) patch.is_premium = !!isPremium;
    if (defaultMood !== undefined) patch.default_mood = defaultMood;
    const { data, error } = await supabase
      .from("activities")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "update activity failed" });
  }
}

export async function catalogDelete(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("activities").delete().eq("id", id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "delete activity failed" });
  }
}
