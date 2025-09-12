import { useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  Edit3,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  StickyNote,
  MoveRight,
} from "lucide-react";
import {
  getWeekends,
  createWeekend,
  updateWeekend,
  deleteWeekend,
  addActivityToDay,
  getActivities,
  deleteActivityInstance,
  toggleCompleteActivity,
  updateActivityInstance,
  createDayForWeekend,
  updateDayForWeekend,
} from "../lib/api";

function toISODate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString();
}

export default function WeekendPlannar() {
  const [loading, setLoading] = useState(true);
  const [weekends, setWeekends] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    mood: "",
  });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "My Weekend",
    startDate: "",
    endDate: "",
    mood: "",
  });
  const [showAddActivityForDay, setShowAddActivityForDay] = useState(null); // day row
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [orderHint, setOrderHint] = useState("");

  // New UI states
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayForm, setNewDayForm] = useState({ date: "", dayLabel: "" });
  const [showEditDay, setShowEditDay] = useState(null); // holds day to edit
  const [editDayLabel, setEditDayLabel] = useState("");
  const [editInstance, setEditInstance] = useState(null); // { inst, notes, customMood }
  const [moveInstance, setMoveInstance] = useState(null); // { inst, fromDayId, targetDayId }

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [w, a] = await Promise.all([
          getWeekends({ includeDays: true }),
          getActivities({ limit: 500 }),
        ]);
        if (!mounted) return;
        setWeekends(w || []);
        setActivities(a?.items || []);
        // only set default selection on first load
        setSelectedId((prev) => (prev ? prev : w?.[0]?.id || null));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  const activityMap = useMemo(() => {
    const m = new Map();
    for (const a of activities) m.set(a.id, a);
    return m;
  }, [activities]);

  const selectedWeekend = useMemo(
    () => weekends.find((w) => w.id === selectedId) || null,
    [weekends, selectedId]
  );

  function resetCreate() {
    setCreateForm({
      title: "My Weekend",
      startDate: "",
      endDate: "",
      mood: "",
    });
  }

  async function handleCreateWeekend(e) {
    e?.preventDefault?.();
    if (!createForm.startDate || !createForm.endDate) return;
    const data = await createWeekend({
      title: createForm.title,
      mood: createForm.mood,
      startDate: toISODate(createForm.startDate),
      endDate: toISODate(createForm.endDate),
    });
    setWeekends((prev) => [data, ...prev]);
    setSelectedId(data.id);
    setShowCreate(false);
    resetCreate();
  }

  function openEdit(weekend) {
    setEditForm({
      title: weekend.title || "",
      mood: weekend.mood || "",
      startDate: weekend.start_date?.slice(0, 10) || "",
      endDate: weekend.end_date?.slice(0, 10) || "",
    });
    setShowEdit(true);
  }

  async function handleSaveEdit(e) {
    e?.preventDefault?.();
    if (!selectedWeekend) return;
    const patch = {
      title: editForm.title,
      mood: editForm.mood,
      startDate: editForm.startDate ? toISODate(editForm.startDate) : undefined,
      endDate: editForm.endDate ? toISODate(editForm.endDate) : undefined,
    };
    const updated = await updateWeekend(selectedWeekend.id, patch);
    setWeekends((prev) =>
      prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w))
    );
    setShowEdit(false);
  }

  async function handleDeleteWeekend(id) {
    await deleteWeekend(id);
    setWeekends((prev) => prev.filter((w) => w.id !== id));
    if (selectedId === id)
      setSelectedId(weekends.find((w) => w.id !== id)?.id || null);
  }

  async function addActivity(day) {
    if (!selectedActivityId) return;
    const nextOrder = day.activity_instances?.length || 0;
    const parsed =
      typeof orderHint === "string" && orderHint.trim() !== ""
        ? parseInt(orderHint, 10)
        : NaN;
    const order = Number.isFinite(parsed) ? parsed : nextOrder;
    const created = await addActivityToDay(day.id, {
      activityId: selectedActivityId,
      order,
    });
    // Update local state
    setWeekends((prev) =>
      prev.map((w) =>
        w.id === day.weekend_plan_id
          ? {
              ...w,
              days: (w.days || []).map((d) =>
                d.id === day.id
                  ? {
                      ...d,
                      activity_instances: [
                        ...(d.activity_instances || []),
                        created,
                      ],
                    }
                  : d
              ),
            }
          : w
      )
    );
    setShowAddActivityForDay(null);
    setSelectedActivityId("");
    setOrderHint("");
  }

  async function removeInstance(inst) {
    await deleteActivityInstance(inst.id);
    setWeekends((prev) =>
      prev.map((w) =>
        w.id === (selectedWeekend?.id || w.id)
          ? {
              ...w,
              days: (w.days || []).map((d) => ({
                ...d,
                activity_instances: (d.activity_instances || []).filter(
                  (i) => i.id !== inst.id
                ),
              })),
            }
          : w
      )
    );
  }

  async function toggleComplete(inst) {
    const updated = await toggleCompleteActivity(inst.id);
    setWeekends((prev) =>
      prev.map((w) => ({
        ...w,
        days: (w.days || []).map((d) => ({
          ...d,
          activity_instances: (d.activity_instances || []).map((i) =>
            i.id === inst.id ? { ...i, is_completed: updated.is_completed } : i
          ),
        })),
      }))
    );
  }

  // Add a new day to the selected weekend
  async function handleAddDay(e) {
    e?.preventDefault?.();
    if (!selectedWeekend) return;
    if (!newDayForm.date) return;
    const created = await createDayForWeekend(selectedWeekend.id, {
      date: newDayForm.date,
      dayLabel: newDayForm.dayLabel || undefined,
    });
    setWeekends((prev) =>
      prev.map((w) =>
        w.id === selectedWeekend.id
          ? {
              ...w,
              days: [...(w.days || []), created].sort(
                (a, b) => new Date(a.date) - new Date(b.date)
              ),
            }
          : w
      )
    );
    setShowAddDay(false);
    setNewDayForm({ date: "", dayLabel: "" });
  }

  // Edit day label
  function openEditDay(day) {
    setShowEditDay(day);
    setEditDayLabel(day.day_label || "");
  }
  async function handleSaveDayLabel(e) {
    e?.preventDefault?.();
    if (!selectedWeekend || !showEditDay) return;
    const updated = await updateDayForWeekend(
      selectedWeekend.id,
      showEditDay.id,
      {
        dayLabel: editDayLabel,
      }
    );
    setWeekends((prev) =>
      prev.map((w) =>
        w.id === selectedWeekend.id
          ? {
              ...w,
              days: (w.days || []).map((d) =>
                d.id === showEditDay.id ? { ...d, ...updated } : d
              ),
            }
          : w
      )
    );
    setShowEditDay(null);
    setEditDayLabel("");
  }

  // Reorder an instance within a day (swap with neighbor)
  async function reorderInstance(day, inst, dir) {
    const list = (day.activity_instances || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = list.findIndex((i) => i.id === inst.id);
    if (idx < 0) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx];
    const b = list[swapIdx];
    // swap orders
    const aOrder = a.order ?? idx;
    const bOrder = b.order ?? swapIdx;
    await Promise.all([
      updateActivityInstance(a.id, { order: bOrder }),
      updateActivityInstance(b.id, { order: aOrder }),
    ]);
    // update local
    setWeekends((prev) =>
      prev.map((w) =>
        w.id === day.weekend_plan_id
          ? {
              ...w,
              days: (w.days || []).map((d) =>
                d.id === day.id
                  ? {
                      ...d,
                      activity_instances: (d.activity_instances || []).map(
                        (i) =>
                          i.id === a.id
                            ? { ...i, order: bOrder }
                            : i.id === b.id
                            ? { ...i, order: aOrder }
                            : i
                      ),
                    }
                  : d
              ),
            }
          : w
      )
    );
  }

  // Clear completed instances from a day
  async function clearCompleted(day) {
    const list = (day.activity_instances || []).filter((i) => !!i.is_completed);
    await Promise.all(list.map((i) => deleteActivityInstance(i.id)));
    setWeekends((prev) =>
      prev.map((w) =>
        w.id === day.weekend_plan_id
          ? {
              ...w,
              days: (w.days || []).map((d) =>
                d.id === day.id
                  ? {
                      ...d,
                      activity_instances: (d.activity_instances || []).filter(
                        (i) => !i.is_completed
                      ),
                    }
                  : d
              ),
            }
          : w
      )
    );
  }

  // Edit instance notes/mood
  function openEditInstance(inst) {
    setEditInstance({
      inst,
      notes: inst.notes || "",
      customMood: inst.custom_mood || "",
    });
  }
  async function handleSaveInstance() {
    if (!editInstance) return;
    const { inst, notes, customMood } = editInstance;
    const updated = await updateActivityInstance(inst.id, {
      notes,
      customMood,
    });
    setWeekends((prev) =>
      prev.map((w) => ({
        ...w,
        days: (w.days || []).map((d) => ({
          ...d,
          activity_instances: (d.activity_instances || []).map((i) =>
            i.id === inst.id ? { ...i, ...updated } : i
          ),
        })),
      }))
    );
    setEditInstance(null);
  }

  // Move instance to another day (create in target, delete from source)
  function openMove(inst, fromDayId) {
    const targetDefault =
      (selectedWeekend?.days || []).find((d) => d.id !== fromDayId)?.id ||
      fromDayId;
    setMoveInstance({ inst, fromDayId, targetDayId: targetDefault });
  }
  async function handleMoveInstance() {
    if (!moveInstance) return;
    const { inst, fromDayId, targetDayId } = moveInstance;
    if (!targetDayId || targetDayId === fromDayId) {
      setMoveInstance(null);
      return;
    }
    const targetDay = (selectedWeekend?.days || []).find(
      (d) => d.id === targetDayId
    );
    const nextOrder = targetDay?.activity_instances?.length || 0;
    const created = await addActivityToDay(targetDayId, {
      activityId: inst.activity_id,
      order: nextOrder,
    });
    await deleteActivityInstance(inst.id);
    setWeekends((prev) =>
      prev.map((w) =>
        w.id === selectedWeekend.id
          ? {
              ...w,
              days: (w.days || []).map((d) => {
                if (d.id === fromDayId) {
                  return {
                    ...d,
                    activity_instances: (d.activity_instances || []).filter(
                      (i) => i.id !== inst.id
                    ),
                  };
                }
                if (d.id === targetDayId) {
                  return {
                    ...d,
                    activity_instances: [
                      ...(d.activity_instances || []),
                      created,
                    ],
                  };
                }
                return d;
              }),
            }
          : w
      )
    );
    setMoveInstance(null);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarPlus /> Weekend Planner
        </h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Weekend
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <span className="loading loading-dots loading-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Weekend list */}
          <div className="lg:col-span-4">
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title">Your Weekends</h2>
                <div
                  className="space-y-2 max-h-[65vh] overflow-auto pr-1"
                  role="list"
                  aria-label="Your weekends"
                >
                  {(weekends || []).map((w) => (
                    <div
                      key={w.id}
                      className={`p-3 rounded-box border cursor-pointer flex items-start justify-between gap-3 ${
                        selectedId === w.id
                          ? "border-primary"
                          : "border-base-300"
                      }`}
                      role="button"
                      aria-pressed={selectedId === w.id}
                      tabIndex={0}
                      onClick={() => setSelectedId(w.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(w.id);
                        }
                      }}
                    >
                      <div>
                        <div className="font-medium">{w.title}</div>
                        <div className="text-xs opacity-70">
                          {new Date(w.start_date).toLocaleDateString()} –{" "}
                          {new Date(w.end_date).toLocaleDateString()}
                        </div>
                        {w.mood && (
                          <div className="text-xs">Mood: {w.mood}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-xs"
                          aria-label={`Edit ${w.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(w);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-xs btn-error"
                          aria-label={`Delete ${w.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWeekend(w.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!weekends || weekends.length === 0) && (
                    <div className="text-sm opacity-70 p-3 rounded-box bg-base-100">
                      No weekends yet. Create one to start planning.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Weekend detail */}
          <div className="lg:col-span-8">
            {selectedWeekend ? (
              <div className="card bg-base-100">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="card-title">{selectedWeekend.title}</h2>
                      <div className="text-sm opacity-70">
                        {new Date(
                          selectedWeekend.start_date
                        ).toLocaleDateString()}{" "}
                        –{" "}
                        {new Date(
                          selectedWeekend.end_date
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-ghost"
                        onClick={() => setShowAddDay(true)}
                        aria-label="Add day"
                      >
                        <Plus size={16} /> Add Day
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => openEdit(selectedWeekend)}
                        aria-label="Edit weekend"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                    </div>
                  </div>

                  <div className="divider my-2" />

                  <div className="space-y-4">
                    {(selectedWeekend.days || []).map((day) => (
                      <div
                        key={day.id}
                        className="rounded-box border border-base-300"
                      >
                        <div className="flex items-center justify-between p-3 bg-base-200 rounded-t-box">
                          <div className="font-medium">
                            {new Date(day.date).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs opacity-70 mr-2">
                              {`${
                                (day.activity_instances || []).filter(
                                  (i) => i.is_completed
                                ).length
                              } / ${
                                (day.activity_instances || []).length
                              } completed`}
                            </span>
                            <button
                              className="btn btn-ghost btn-sm"
                              aria-label="Rename day"
                              onClick={() => openEditDay(day)}
                            >
                              <Edit3 size={14} /> Rename
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              aria-label="Clear completed"
                              onClick={() => clearCompleted(day)}
                            >
                              <Trash2 size={14} /> Clear Completed
                            </button>
                            <button
                              className="btn btn-sm"
                              aria-label="Add activity"
                              onClick={() => setShowAddActivityForDay(day)}
                            >
                              <Plus size={14} /> Add Activity
                            </button>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          {(day.activity_instances || []).length === 0 && (
                            <div className="text-sm opacity-70">
                              No activities yet.
                            </div>
                          )}
                          {(day.activity_instances || [])
                            .slice()
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((inst) => {
                              const act = activityMap.get(inst.activity_id);
                              return (
                                <div
                                  key={inst.id}
                                  className="p-2 rounded-box bg-base-200 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate">
                                      {act?.icon} {act?.title || "Activity"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="btn btn-xs"
                                      aria-label="Move up"
                                      onClick={() =>
                                        reorderInstance(day, inst, "up")
                                      }
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      className="btn btn-xs"
                                      aria-label="Move down"
                                      onClick={() =>
                                        reorderInstance(day, inst, "down")
                                      }
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                    <button
                                      className="btn btn-xs"
                                      aria-label="Edit notes and mood"
                                      onClick={() => openEditInstance(inst)}
                                    >
                                      <StickyNote size={12} />
                                    </button>
                                    <button
                                      className="btn btn-xs"
                                      aria-label="Move to another day"
                                      onClick={() => openMove(inst, day.id)}
                                    >
                                      <MoveRight size={12} />
                                    </button>
                                    <input
                                      type="checkbox"
                                      className="toggle toggle-sm"
                                      checked={!!inst.is_completed}
                                      onChange={() => toggleComplete(inst)}
                                    />
                                    <button
                                      className="btn btn-xs btn-error"
                                      aria-label={`Remove ${
                                        activityMap.get(inst.activity_id)
                                          ?.title || "activity"
                                      }`}
                                      onClick={() => removeInstance(inst)}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-base-200">
                <div className="card-body">
                  <div className="text-sm opacity-70">
                    Select a weekend to view details, or create a new one.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-md relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => {
                setShowCreate(false);
                resetCreate();
              }}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center">New Weekend</h3>
            <p className="text-sm opacity-70 text-center mt-1">
              Set a title and date range for your weekend.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleCreateWeekend}>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Title</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Start date</span>
                </div>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={createForm.startDate}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">End date</span>
                </div>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={createForm.endDate}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Mood (optional)</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={createForm.mood}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, mood: e.target.value }))
                  }
                />
              </label>
              <div className="modal-action mt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCreate(false);
                    resetCreate();
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Create
                </button>
              </div>
            </form>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => {
              setShowCreate(false);
              resetCreate();
            }}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {showEdit && selectedWeekend && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-lg relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowEdit(false)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center">Edit Weekend</h3>
            <p className="text-sm opacity-70 text-center mt-1">
              Update details for “{selectedWeekend.title}”.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSaveEdit}>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Title</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Start date</span>
                </div>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">End date</span>
                </div>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Mood (optional)</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={editForm.mood}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, mood: e.target.value }))
                  }
                />
              </label>
              <div className="modal-action mt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowEdit(false)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {showAddActivityForDay && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-md relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowAddActivityForDay(null)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center">Add Activity</h3>
            <p className="text-sm opacity-70 text-center mt-1">
              {new Date(showAddActivityForDay.date).toLocaleDateString(
                undefined,
                { weekday: "long", month: "short", day: "numeric" }
              )}
            </p>
            <div className="mt-4 space-y-4">
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Activity</span>
                </div>
                <select
                  className="select select-bordered w-full"
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                >
                  <option value="">Select an activity</option>
                  {(activities || []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Order (optional)</span>
                </div>
                <input
                  type="number"
                  min={0}
                  className="input input-bordered w-full"
                  value={orderHint}
                  onChange={(e) => setOrderHint(e.target.value)}
                />
                <div className="label">
                  <span className="label-text-alt opacity-70">
                    Leave blank to add at the end.
                  </span>
                </div>
              </label>
            </div>
            <div className="modal-action mt-2">
              <button
                className="btn btn-ghost"
                onClick={() => setShowAddActivityForDay(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => addActivity(showAddActivityForDay)}
              >
                Add
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowAddActivityForDay(null)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {showAddDay && selectedWeekend && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-md relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowAddDay(false)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center">Add Day</h3>
            <form className="mt-4 space-y-4" onSubmit={handleAddDay}>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Date</span>
                </div>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={newDayForm.date}
                  onChange={(e) =>
                    setNewDayForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Label (optional)</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={newDayForm.dayLabel}
                  onChange={(e) =>
                    setNewDayForm((f) => ({ ...f, dayLabel: e.target.value }))
                  }
                />
              </label>
              <div className="modal-action mt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddDay(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Add Day
                </button>
              </div>
            </form>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowAddDay(false)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {showEditDay && selectedWeekend && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-md relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowEditDay(null)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center">Rename Day</h3>
            <form className="mt-4 space-y-4" onSubmit={handleSaveDayLabel}>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Label</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={editDayLabel}
                  onChange={(e) => setEditDayLabel(e.target.value)}
                />
              </label>
              <div className="modal-action mt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowEditDay(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowEditDay(null)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {editInstance && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-md relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setEditInstance(null)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center">Edit Notes & Mood</h3>
            <div className="mt-4 space-y-4">
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Notes</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={editInstance.notes}
                  onChange={(e) =>
                    setEditInstance((v) => ({ ...v, notes: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Custom Mood</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={editInstance.customMood}
                  onChange={(e) =>
                    setEditInstance((v) => ({
                      ...v,
                      customMood: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="modal-action mt-2">
              <button
                className="btn btn-ghost"
                onClick={() => setEditInstance(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveInstance}>
                Save
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setEditInstance(null)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {moveInstance && selectedWeekend && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-md relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setMoveInstance(null)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center">Move Activity</h3>
            <div className="mt-4 space-y-4">
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Target day</span>
                </div>
                <select
                  className="select select-bordered w-full"
                  value={moveInstance.targetDayId}
                  onChange={(e) =>
                    setMoveInstance((v) => ({
                      ...v,
                      targetDayId: e.target.value,
                    }))
                  }
                >
                  {(selectedWeekend.days || []).map((d) => (
                    <option
                      key={d.id}
                      value={d.id}
                      disabled={d.id === moveInstance.fromDayId}
                    >
                      {new Date(d.date).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-action mt-2">
              <button
                className="btn btn-ghost"
                onClick={() => setMoveInstance(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleMoveInstance}>
                Move
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setMoveInstance(null)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}
    </section>
  );
}
