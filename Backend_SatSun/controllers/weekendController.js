import { supabase } from "../db/supabaseClient.js";

function getUserId(req) {
  return req.user?.id;
}

function enumerateDays(startDate, endDate) {
  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let i = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const label = d.toLocaleDateString("en-US", { weekday: "long" });
    days.push({ date: d.toISOString(), day_label: label, order: i++ });
  }
  return days;
}

export async function createWeekend(req, res) {
  try {
    const userId = getUserId(req);
    const {
      startDate,
      endDate,
      title = "My Weekend",
      mood,
      isTemplate = false,
      days,
    } = req.body;
    if (!startDate || !endDate)
      return res.status(400).json({ error: "startDate and endDate required" });

    const { data: plan, error } = await supabase
      .from("weekend_plans")
      .insert({
        user_id: userId,
        title,
        mood,
        start_date: startDate,
        end_date: endDate,
        is_template: isTemplate,
      })
      .select()
      .single();
    if (error) throw error;

    // Auto-generate days if not provided
    let dayRows = [];
    const toInsert = days?.length
      ? days.map((d, idx) => ({
          weekend_plan_id: plan.id,
          date: d.date,
          day_label: d.dayLabel || d.day_label || "Day",
          order: d.order ?? idx,
          notes: d.notes || null,
          color_theme: d.colorTheme || d.color_theme || null,
        }))
      : enumerateDays(startDate, endDate).map((d) => ({
          weekend_plan_id: plan.id,
          date: d.date,
          day_label: d.day_label,
          order: d.order,
        }));

    if (toInsert.length) {
      const { data: inserted, error: dayErr } = await supabase
        .from("day_instances")
        .insert(toInsert)
        .select();
      if (dayErr) throw dayErr;
      dayRows = inserted;
    }

    return res.status(201).json({ ...plan, days: dayRows });
  } catch (e) {
    return res.status(500).json({ error: "create weekend failed" });
  }
}

export async function getWeekend(req, res) {
  try {
    const id = req.params.id;
    const { data: plan, error } = await supabase
      .from("weekend_plans")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!plan) return res.status(404).json({ error: "not found" });
    const { data: days, error: dayErr } = await supabase
      .from("day_instances")
      .select("*, activity_instances(*)")
      .eq("weekend_plan_id", id)
      .order("order", { ascending: true });
    if (dayErr) throw dayErr;
    return res.json({ ...plan, days });
  } catch (e) {
    return res.status(500).json({ error: "get weekend failed" });
  }
}

export async function updateWeekend(req, res) {
  try {
    const id = req.params.id;
    const { title, mood, startDate, endDate } = req.body;
    const patch = {};
    if (title !== undefined) patch.title = title;
    if (mood !== undefined) patch.mood = mood;
    if (startDate) patch.start_date = startDate;
    if (endDate) patch.end_date = endDate;
    if (!Object.keys(patch).length) return res.json({ ok: true });
    const { data, error } = await supabase
      .from("weekend_plans")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "update weekend failed" });
  }
}

export async function deleteWeekend(req, res) {
  try {
    const id = req.params.id;
    const { error } = await supabase
      .from("weekend_plans")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "delete weekend failed" });
  }
}

export async function duplicateWeekend(req, res) {
  try {
    const id = req.params.id;
    // Fetch plan and days
    const { data: plan, error } = await supabase
      .from("weekend_plans")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    const { data: days, error: dayErr } = await supabase
      .from("day_instances")
      .select("*")
      .eq("weekend_plan_id", id)
      .order("order");
    if (dayErr) throw dayErr;

    // Create new plan
    const { data: newPlan, error: insErr } = await supabase
      .from("weekend_plans")
      .insert({
        user_id: plan.user_id,
        title: plan.title + " (Copy)",
        mood: plan.mood,
        start_date: plan.start_date,
        end_date: plan.end_date,
        is_template: plan.is_template,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    // Clone days
    const toInsertDays = days.map((d) => ({
      weekend_plan_id: newPlan.id,
      date: d.date,
      day_label: d.day_label,
      order: d.order,
      notes: d.notes,
      color_theme: d.color_theme,
    }));
    const { data: newDays, error: insDaysErr } = await supabase
      .from("day_instances")
      .insert(toInsertDays)
      .select();
    if (insDaysErr) throw insDaysErr;

    return res.status(201).json({ ...newPlan, days: newDays });
  } catch (e) {
    return res.status(500).json({ error: "duplicate weekend failed" });
  }
}

export async function listDaysForWeekend(req, res) {
  try {
    const id = req.params.id;
    const { data, error } = await supabase
      .from("day_instances")
      .select("*")
      .eq("weekend_plan_id", id)
      .order("order", { ascending: true });
    if (error) throw error;
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "list days failed" });
  }
}

export async function addDayToWeekend(req, res) {
  try {
    const id = req.params.id;
  const { date, dayLabel, order, notes, colorTheme } = req.body;
    if (!date) return res.status(400).json({ error: "date required" });
    const { data, error } = await supabase
      .from("day_instances")
      .insert({
        weekend_plan_id: id,
        date,
        day_label: dayLabel || "Day",
        order: order ?? 0,
        notes: notes || null,
        color_theme: colorTheme || null,
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (e) {
    return res.status(500).json({ error: "add day failed" });
  }
}

export async function updateDayForWeekend(req, res) {
  try {
    const weekendId = req.params.id;
    const dayId = req.params.dayId;
    const { date, dayLabel, order, notes, colorTheme } = req.body;
    const patch = {};
    if (date !== undefined) patch.date = date;
    if (dayLabel !== undefined) patch.day_label = dayLabel;
    if (order !== undefined) patch.order = order;
    if (notes !== undefined) patch.notes = notes;
    if (colorTheme !== undefined) patch.color_theme = colorTheme;
    if (!Object.keys(patch).length)
      return res.status(400).json({ error: "no fields to update" });

    // Ensure the day belongs to the weekend
    const { data: dayRow, error: dayErr } = await supabase
      .from("day_instances")
      .select("id, weekend_plan_id")
      .eq("id", dayId)
      .eq("weekend_plan_id", weekendId)
      .maybeSingle();
    if (dayErr) throw dayErr;
    if (!dayRow) return res.status(404).json({ error: "not found" });

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
export async function listWeekends(req, res) {
  try {
    const userId = getUserId(req);
    const includeDays = req.query.includeDays === "true";
    let query = supabase.from("weekend_plans").select("*").order("created_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);
    let { data: plans, error } = await query;
    if (error) throw error;

    if (includeDays && plans.length) {
      const ids = plans.map(p => p.id);
      const { data: days, error: dayErr } = await supabase
        .from("day_instances")
        .select("*, activity_instances(*)")
        .in("weekend_plan_id", ids)
        .order("order", { ascending: true });
      if (dayErr) throw dayErr;
      const map = {};
      for (const d of days) {
        (map[d.weekend_plan_id] ||= []).push(d);
      }
      plans = plans.map(p => ({ ...p, days: map[p.id] || [] }));
    }

    return res.json(plans);
  } catch (e) {
    return res.status(500).json({ error: "list weekends failed" });
  }
}