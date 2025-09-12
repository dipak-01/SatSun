import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Edit3, Trash2, Plus } from "lucide-react";
import {
  getWeekends,
  createWeekend,
  updateWeekend,
  deleteWeekend,
  addActivityToDay,
  getActivities,
  deleteActivityInstance,
  toggleCompleteActivity,
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
  const [orderHint, setOrderHint] = useState(0);

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
    const created = await addActivityToDay(day.id, {
      activityId: selectedActivityId,
      order: nextOrder,
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
    setOrderHint(0);
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
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
                <div className="space-y-2 max-h-[65vh] overflow-auto pr-1">
                  {(weekends || []).map((w) => (
                    <div
                      key={w.id}
                      className={`p-3 rounded-box border cursor-pointer flex items-start justify-between gap-3 ${
                        selectedId === w.id
                          ? "border-primary"
                          : "border-base-300"
                      }`}
                      onClick={() => setSelectedId(w.id)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(w);
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-xs btn-error"
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
                    <div className="text-sm opacity-70">
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
                    <button
                      className="btn btn-ghost"
                      onClick={() => openEdit(selectedWeekend)}
                    >
                      <Edit3 size={16} /> Edit
                    </button>
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
                            <button
                              className="btn btn-sm"
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
                                    <input
                                      type="checkbox"
                                      className="toggle toggle-sm"
                                      checked={!!inst.is_completed}
                                      onChange={() => toggleComplete(inst)}
                                    />
                                    <button
                                      className="btn btn-xs btn-error"
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
                  onChange={(e) => setOrderHint(Number(e.target.value) || 0)}
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
    </div>
  );
}
