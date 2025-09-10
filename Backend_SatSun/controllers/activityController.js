import { supabase } from "../db/supabaseClient.js";

// Utility: basic validator helpers
function toInt(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

async function ensureInstanceOwnership(instanceId, userId) {
  // Join through day_instances -> weekend_plans to ensure user owns the weekend
  const { data, error } = await supabase
    .from("activity_instances")
    .select(
      "id, day_id, day_instances!inner(weekend_plan_id, weekend_plans!inner(user_id))"
    )
    .eq("id", instanceId)
    .eq("day_instances.weekend_plans.user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureDayOwnership(dayId, userId) {
  const { data, error } = await supabase
    .from("day_instances")
    .select("id, weekend_plan_id, weekend_plans!inner(user_id)")
    .eq("id", dayId)
    .eq("weekend_plans.user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Instances on days
export async function addActivityToDay(req, res) {
  try {
    const userId = req.user?.id;
    const { dayId } = req.params;
    const { activityId, order, startTime, endTime, notes, customMood } =
      req.body;
    if (!activityId)
      return res.status(400).json({ error: "activityId required" });
    // Ownership check
    const day = await ensureDayOwnership(dayId, userId);
    if (!day) return res.status(404).json({ error: "day not found" });

    if (startTime && endTime && startTime > endTime)
      return res.status(400).json({ error: "startTime after endTime" });

    // Auto order if not provided
    let finalOrder = toInt(order);
    if (finalOrder === undefined) {
      const { data: maxRow, error: maxErr } = await supabase
        .from("activity_instances")
        .select("order")
        .eq("day_id", dayId)
        .order("order", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxErr) throw maxErr;
      finalOrder = maxRow ? (maxRow.order ?? 0) + 1 : 0;
    }

    const { data, error } = await supabase
      .from("activity_instances")
      .insert({
        activity_id: activityId,
        day_id: dayId,
        order: finalOrder,
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
    console.error("addActivityToDay", e);
    return res.status(500).json({ error: "add activity failed" });
  }
}

export async function updateActivityInstance(req, res) {
  try {
    const userId = req.user?.id;
    const { instanceId } = req.params;
    const { order, startTime, endTime, notes, customMood } = req.body;

    // Ownership check
    const inst = await ensureInstanceOwnership(instanceId, userId);
    if (!inst) return res.status(404).json({ error: "not found" });

    if (startTime && endTime && startTime > endTime)
      return res.status(400).json({ error: "startTime after endTime" });

    const patch = {};
    if (order !== undefined) patch.order = toInt(order);
    if (startTime !== undefined) patch.start_time = startTime;
    if (endTime !== undefined) patch.end_time = endTime;
    if (notes !== undefined) patch.notes = notes;
    if (customMood !== undefined) patch.custom_mood = customMood;
    if (Object.keys(patch).length === 0)
      return res.status(400).json({ error: "no fields to update" });

    const { data, error } = await supabase
      .from("activity_instances")
      .update(patch)
      .eq("id", instanceId)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    console.error("updateActivityInstance", e);
    return res.status(500).json({ error: "update activity failed" });
  }
}

export async function deleteActivityInstance(req, res) {
  try {
    const userId = req.user?.id;
    const { instanceId } = req.params;
    const inst = await ensureInstanceOwnership(instanceId, userId);
    if (!inst) return res.status(404).json({ error: "not found" });
    const { error } = await supabase
      .from("activity_instances")
      .delete()
      .eq("id", instanceId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteActivityInstance", e);
    return res.status(500).json({ error: "delete activity failed" });
  }
}

export async function toggleCompleteActivity(req, res) {
  try {
    const userId = req.user?.id;
    const { instanceId } = req.params;
    const inst = await ensureInstanceOwnership(instanceId, userId);
    if (!inst) return res.status(404).json({ error: "not found" });
    const { data, error } = await supabase
      .from("activity_instances")
      .update({ is_completed: !inst.is_completed })
      .eq("id", instanceId)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    console.error("toggleCompleteActivity", e);
    return res.status(500).json({ error: "toggle complete failed" });
  }
}

// Catalog endpoints (admin: for demo, still no role check)
export async function catalogList(req, res) {
  try {
    const limit = Math.min(toInt(req.query.limit) || 50, 200);
    const offset = toInt(req.query.offset) || 0;
    const { data, error, count } = await supabase
      .from("activities")
      .select("*", { count: "exact" })
      .order("title")
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return res.json({ items: data, total: count, limit, offset });
  } catch (e) {
    console.error("catalogList", e);
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
    console.error("catalogGet", e);
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
    if (tags && !Array.isArray(tags))
      return res.status(400).json({ error: "tags must be an array" });
    const durationNum = Number(durationMin);
    if (Number.isNaN(durationNum) || durationNum <= 0)
      return res.status(400).json({ error: "durationMin must be > 0" });
    const { data, error } = await supabase
      .from("activities")
      .insert({
        title,
        description,
        category,
        duration_min: durationNum,
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
    console.error("catalogCreate", e);
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
    if (durationMin !== undefined) {
      const d = Number(durationMin);
      if (Number.isNaN(d) || d <= 0)
        return res.status(400).json({ error: "durationMin must be > 0" });
      patch.duration_min = d;
    }
    if (icon !== undefined) patch.icon = icon;
    if (tags !== undefined) {
      if (!Array.isArray(tags))
        return res.status(400).json({ error: "tags must be an array" });
      patch.tags = tags;
    }
    if (isPremium !== undefined) patch.is_premium = !!isPremium;
    if (defaultMood !== undefined) patch.default_mood = defaultMood;
    if (Object.keys(patch).length === 0)
      return res.status(400).json({ error: "no fields to update" });
    const { data, error } = await supabase
      .from("activities")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "not found" });
    return res.json(data);
  } catch (e) {
    console.error("catalogUpdate", e);
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
    console.error("catalogDelete", e);
    return res.status(500).json({ error: "delete activity failed" });
  }
}
