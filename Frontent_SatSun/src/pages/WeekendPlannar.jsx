import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarPlus,
  Edit3,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  MoveRight,
  MoreVertical,
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
import { exportNodeToPng } from "../lib/exportImage";
import ExportWeekendCard from "../components/ExportWeekendCard";
import TemplateGallery from "../components/Templates/TemplateGallery";
import ApplyTemplateModal from "../components/Templates/ApplyTemplateModal";
import { WEEKEND_TEMPLATES, matchActivityId } from "../lib/templates";

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
  // Instance edit UI removed per request
  const [moveInstance, setMoveInstance] = useState(null); // { inst, fromDayId, targetDayId }
  const exportRef = useRef(null);

  // Templates UI state
  const [showTemplates, setShowTemplates] = useState(false);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

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

  const selectedWeekend = useMemo(
    () => weekends.find((w) => w.id === selectedId) || null,
    [weekends, selectedId]
  );
  const activityMap = useMemo(() => {
    const m = new Map();
    for (const a of activities) m.set(a.id, a);
    return m;
  }, [activities]);

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

  // Notes & custom mood editing removed

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
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <h1 className="text-2xl font-semibold flex items-center gap-2 break-words">
          <CalendarPlus /> Weekend Planner
        </h1>
        <button
          className="btn btn-primary w-full sm:w-auto"
          onClick={() => setShowCreate(true)}
        >
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
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                    <div className="min-w-0">
                      <h2 className="card-title break-words">
                        {selectedWeekend.title}
                      </h2>
                      <div className="text-sm opacity-70 break-words">
                        {new Date(
                          selectedWeekend.start_date
                        ).toLocaleDateString()}{" "}
                        –{" "}
                        {new Date(
                          selectedWeekend.end_date
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        className="btn btn-ghost"
                        onClick={() => setShowTemplates(true)}
                        aria-label="Templates"
                      >
                        Templates
                      </button>
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
                      <button
                        className="btn btn-primary"
                        aria-label="Export PNG"
                        onClick={async () => {
                          const node = exportRef.current;
                          if (!node) return;
                          await exportNodeToPng(node, {
                            filename: `${
                              selectedWeekend.title || "weekend"
                            }.png`,
                            pixelRatio: 2,
                          });
                        }}
                      >
                        Export PNG
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
                        <div className="flex items-start sm:items-center justify-between p-3 bg-base-200 rounded-t-box gap-2 flex-col sm:flex-row">
                          <div className="font-medium break-words">
                            {new Date(day.date).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
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
                                    <input
                                      type="checkbox"
                                      className="toggle toggle-sm"
                                      checked={!!inst.is_completed}
                                      onChange={() => toggleComplete(inst)}
                                      aria-label="Completed"
                                    />
                                    <div className="dropdown dropdown-end">
                                      <button
                                        className="btn btn-xs"
                                        aria-label="More actions"
                                        tabIndex={0}
                                      >
                                        <MoreVertical size={12} />
                                      </button>
                                      <ul
                                        tabIndex={0}
                                        className="dropdown-content menu menu-sm bg-base-100 rounded-box z-[1] mt-2 w-48 p-2 shadow"
                                      >
                                        <li>
                                          <button
                                            onClick={() =>
                                              reorderInstance(day, inst, "up")
                                            }
                                          >
                                            <ArrowUp size={12} /> Move up
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            onClick={() =>
                                              reorderInstance(day, inst, "down")
                                            }
                                          >
                                            <ArrowDown size={12} /> Move down
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            onClick={() =>
                                              openMove(inst, day.id)
                                            }
                                          >
                                            <MoveRight size={12} /> Move
                                            activity
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            className="text-error"
                                            onClick={() => removeInstance(inst)}
                                          >
                                            <Trash2 size={12} /> Delete
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
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

      {/* Notes & custom mood modal removed */}

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

      {/* Hidden export template */}
      {selectedWeekend && (
        <div
          className="fixed -left-[10000px] -top-[10000px] pointer-events-none"
          aria-hidden
        >
          <ExportWeekendCard
            ref={exportRef}
            weekend={selectedWeekend}
            activityMap={activityMap}
          />
        </div>
      )}

      {/* Templates gallery modal */}
      {showTemplates && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-2xl relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowTemplates(false)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center">Weekend templates</h3>
            <p className="text-sm opacity-70 text-center mt-1">
              Pick a template to quickly plan your weekend.
            </p>
            <div className="mt-4">
              <TemplateGallery
                templates={WEEKEND_TEMPLATES}
                onSelect={(t) => {
                  setSelectedTemplate(t);
                  setApplyTemplateOpen(true);
                  setShowTemplates(false);
                }}
              />
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowTemplates(false)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {/* Apply template modal */}
      {applyTemplateOpen && selectedTemplate && (
        <ApplyTemplateModal
          open={applyTemplateOpen}
          onClose={() => setApplyTemplateOpen(false)}
          template={selectedTemplate}
          activities={activities}
          matchActivityId={matchActivityId}
          onApply={async ({
            title,
            startDateIso,
            endDateIso,
            dayTemplates,
          }) => {
            // basic guard
            if (!startDateIso) return;
            // Helper to add days
            const addDays = (iso, n) => {
              const d = new Date(iso);
              d.setDate(d.getDate() + n);
              return d.toISOString();
            };
            // Build date list based on provided range
            const dates = [];
            if (endDateIso) {
              const start = new Date(startDateIso);
              const end = new Date(endDateIso);
              for (
                let d = new Date(start);
                d <= end;
                d.setDate(d.getDate() + 1)
              ) {
                dates.push(new Date(d).toISOString());
              }
            }
            let dateList = dates.length ? dates : [];
            if (!dateList.length) {
              // default to template length (min 1)
              const len = Math.max(1, dayTemplates?.length || 2);
              for (let i = 0; i < len; i++)
                dateList.push(addDays(startDateIso, i));
            }
            // If mismatch with template days, clamp to template length
            if (
              dayTemplates?.length &&
              dateList.length !== dayTemplates.length
            ) {
              dateList = dateList.slice(0, dayTemplates.length);
              while (dateList.length < dayTemplates.length) {
                dateList.push(addDays(startDateIso, dateList.length));
              }
            }

            // Prepare explicit days payload to ensure correct count/labels
            const daysPayload = (dayTemplates || []).map((dt, idx) => ({
              date: dateList[idx] || addDays(startDateIso, idx),
              dayLabel: dt.label || undefined,
              order: idx,
            }));

            // Compute final end date from dateList
            const finalEnd = dateList[dateList.length - 1] || startDateIso;

            // Create weekend with days
            const created = await createWeekend({
              title,
              startDate: startDateIso,
              endDate: finalEnd,
              days: daysPayload,
            });

            // Add activities to each day
            const newDays = (created.days || []).map((d) => ({
              ...d,
              activity_instances: [],
            }));
            for (let idx = 0; idx < (dayTemplates || []).length; idx++) {
              const dt = dayTemplates[idx];
              const dayRow = newDays[idx];
              if (!dayRow) continue;
              const queries = dt.activities || [];
              for (let i = 0; i < queries.length; i++) {
                const q = queries[i];
                const aId = matchActivityId(activities, q);
                if (!aId) continue;
                const inst = await addActivityToDay(dayRow.id, {
                  activityId: aId,
                  order: i,
                });
                dayRow.activity_instances.push(inst);
              }
            }

            const createdWithInstances = { ...created, days: newDays };
            setWeekends((prev) => [createdWithInstances, ...prev]);
            setSelectedId(created.id);
            setApplyTemplateOpen(false);
          }}
        />
      )}
    </section>
  );
}
