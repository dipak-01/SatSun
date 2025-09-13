import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  getWeekendsCached,
  getActivitiesCached,
  createWeekend,
  updateWeekend,
  deleteWeekend,
  addActivityToDay,
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
import CreateWeekendModal from "../components/Planner/CreateWeekendModal";
import EditWeekendModal from "../components/Planner/EditWeekendModal";
import AddActivityModal from "../components/Planner/AddActivityModal";
import AddDayModal from "../components/Planner/AddDayModal";
import EditDayLabelModal from "../components/Planner/EditDayLabelModal";
import MoveInstanceModal from "../components/Planner/MoveInstanceModal";
import { WEEKEND_TEMPLATES, matchActivityId } from "../lib/templates";
import Spinner from "../components/ui/Spinner";
import Card from "../components/ui/Card";
// offline enqueue removed per request

function toISODate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toISOString();
}

export default function WeekendPlannar() {
  const [searchParams] = useSearchParams();
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
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Templates UI state (gallery inline; apply remains a modal)
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Serve cached weekends immediately, then refresh network.
        const weekendsCached = getWeekendsCached({ includeDays: true });
        const cached = await weekendsCached.initial;
        if (mounted && cached) setWeekends(cached || []);

        // Serve cached activities immediately too
        const activitiesCached = getActivitiesCached({ limit: 500 });
        const cachedActs = await activitiesCached.initial;
        if (mounted && cachedActs?.items) setActivities(cachedActs.items || []);

        const [freshWeekends, freshActivities] = await Promise.all([
          weekendsCached.refresh,
          activitiesCached.refresh,
        ]);
        if (!mounted) return;
        setWeekends(freshWeekends || []);
        setActivities(freshActivities?.items || []);
        // only set default selection on first load
        setSelectedId((prev) =>
          prev ? prev : (freshWeekends || [])?.[0]?.id || null
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const onUp = () => setIsOnline(true);
    const onDown = () => setIsOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    // no offline queue
    return () => {
      mounted = false;
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  // When weekendId is present in the URL, select that weekend after data loads
  useEffect(() => {
    const id = searchParams.get("weekendId");
    if (!id || !Array.isArray(weekends) || weekends.length === 0) return;
    const found = weekends.find((w) => String(w.id) === String(id));
    if (found) setSelectedId(found.id);
  }, [searchParams, weekends]);

  const selectedWeekend = useMemo(
    () => weekends.find((w) => w.id === selectedId) || null,
    [weekends, selectedId]
  );
  const activityMap = useMemo(() => {
    const m = new Map();
    for (const a of activities) m.set(a.id, a);
    return m;
  }, [activities]);

  // Lightweight memoized row for performance when there are 50+ items
  const ActivityRow = useMemo(
    () =>
      memo(function ActivityRow({
        inst,
        act,
        onToggle,
        onReorderUp,
        onReorderDown,
        onMove,
        onDelete,
        disabled = false,
      }) {
        return (
          <div className="p-2 rounded-box bg-base-200 flex items-center justify-between gap-3">
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
                onChange={onToggle}
                aria-label="Completed"
                disabled={disabled}
              />
              <div className="dropdown dropdown-end">
                <button
                  className="btn btn-xs"
                  aria-label="More actions"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      e.currentTarget.click();
                  }}
                >
                  <MoreVertical size={12} />
                </button>
                <ul
                  tabIndex={0}
                  role="menu"
                  className="dropdown-content menu menu-sm bg-base-100 rounded-box z-[1] mt-2 w-48 p-2 shadow"
                >
                  <li>
                    <button
                      role="menuitem"
                      onClick={onReorderUp}
                      disabled={disabled}
                    >
                      Move up
                    </button>
                  </li>
                  <li>
                    <button
                      role="menuitem"
                      onClick={onReorderDown}
                      disabled={disabled}
                    >
                      Move down
                    </button>
                  </li>
                  <li>
                    <button
                      role="menuitem"
                      onClick={onMove}
                      disabled={disabled}
                    >
                      Move activity
                    </button>
                  </li>
                  <li>
                    <button
                      role="menuitem"
                      className="text-error"
                      onClick={onDelete}
                      disabled={disabled}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      }),
    []
  );

  // Mutating handlers wrapped in useCallback to keep stable references
  const removeInstance = useCallback(
    async (inst) => {
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
    },
    [selectedWeekend?.id]
  );

  const toggleComplete = useCallback(async (inst) => {
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
  }, []);

  const reorderInstance = useCallback(async (day, inst, dir) => {
    const list = (day.activity_instances || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = list.findIndex((i) => i.id === inst.id);
    if (idx < 0) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx];
    const b = list[swapIdx];
    const aOrder = a.order ?? idx;
    const bOrder = b.order ?? swapIdx;
    await Promise.all([
      updateActivityInstance(a.id, { order: bOrder }),
      updateActivityInstance(b.id, { order: aOrder }),
    ]);
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
  }, []);

  const openMove = useCallback(
    (inst, fromDayId) => {
      const targetDefault =
        (selectedWeekend?.days || []).find((d) => d.id !== fromDayId)?.id ||
        fromDayId;
      setMoveInstance({ inst, fromDayId, targetDayId: targetDefault });
    },
    [selectedWeekend?.days]
  );

  // Stable callbacks for ActivityRow props that close over the above handlers
  const onToggleCb = useCallback(
    (inst) => () => toggleComplete(inst),
    [toggleComplete]
  );
  const onReorderUpCb = useCallback(
    (day, inst) => () => reorderInstance(day, inst, "up"),
    [reorderInstance]
  );
  const onReorderDownCb = useCallback(
    (day, inst) => () => reorderInstance(day, inst, "down"),
    [reorderInstance]
  );
  const onMoveCb = useCallback(
    (inst, dayId) => () => openMove(inst, dayId),
    [openMove]
  );
  const onDeleteCb = useCallback(
    (inst) => () => removeInstance(inst),
    [removeInstance]
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[40vh]">
          <div className="lg:col-span-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full"></div>
            ))}
          </div>
          <div className="lg:col-span-8 space-y-3">
            <div className="skeleton h-8 w-1/2"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Weekend list */}
          <div className="lg:col-span-4">
            <Card className="bg-base-200">
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
                      selectedId === w.id ? "border-primary" : "border-base-300"
                    }`}
                    role="button"
                    aria-pressed={selectedId === w.id}
                    aria-label={`Select weekend ${w.title}`}
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
                      {w.mood && <div className="text-xs">Mood: {w.mood}</div>}
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
            </Card>
          </div>

          {/* Weekend detail */}
          <div className="lg:col-span-8">
            {selectedWeekend ? (
              <Card className="bg-base-100">
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
                      {new Date(selectedWeekend.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isOnline && (
                      <span className="badge badge-warning badge-soft">
                        Offline
                      </span>
                    )}
                    <button
                      className="btn btn-ghost"
                      onClick={() => setShowAddDay(true)}
                      aria-label="Add day"
                      disabled={!isOnline}
                    >
                      <Plus size={16} /> Add Day
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => openEdit(selectedWeekend)}
                      aria-label="Edit weekend"
                      disabled={!isOnline}
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
                          filename: `${selectedWeekend.title || "weekend"}.png`,
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
                          {day?.day_label}
                          {/* {new Date(day.date).toLocaleDateString(undefined, {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })} */}
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
                            disabled={!isOnline}
                          >
                            <Edit3 size={14} /> Rename
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            aria-label="Clear completed"
                            onClick={() => clearCompleted(day)}
                            disabled={!isOnline}
                          >
                            <Trash2 size={14} /> Clear Completed
                          </button>
                          <button
                            className="btn btn-sm"
                            aria-label="Add activity"
                            onClick={() => setShowAddActivityForDay(day)}
                            disabled={!isOnline}
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
                              <ActivityRow
                                key={inst.id}
                                inst={inst}
                                act={act}
                                onToggle={onToggleCb(inst)}
                                onReorderUp={onReorderUpCb(day, inst)}
                                onReorderDown={onReorderDownCb(day, inst)}
                                onMove={onMoveCb(inst, day.id)}
                                onDelete={onDeleteCb(inst)}
                                disabled={!isOnline}
                              />
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="bg-base-200">
                <div className="text-sm opacity-70">
                  Select a weekend to view details, or create a new one.
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <CreateWeekendModal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          resetCreate();
        }}
        form={createForm}
        setForm={setCreateForm}
        onSubmit={handleCreateWeekend}
      />

      <EditWeekendModal
        open={showEdit && !!selectedWeekend}
        onClose={() => setShowEdit(false)}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleSaveEdit}
        weekendTitle={selectedWeekend?.title}
      />

      <AddActivityModal
        open={!!showAddActivityForDay}
        onClose={() => setShowAddActivityForDay(null)}
        day={showAddActivityForDay}
        activities={activities}
        selectedActivityId={selectedActivityId}
        setSelectedActivityId={setSelectedActivityId}
        orderHint={orderHint}
        setOrderHint={setOrderHint}
        onAdd={() => addActivity(showAddActivityForDay)}
      />

      <AddDayModal
        open={showAddDay && !!selectedWeekend}
        onClose={() => setShowAddDay(false)}
        form={newDayForm}
        setForm={setNewDayForm}
        onSubmit={handleAddDay}
      />

      <EditDayLabelModal
        open={!!showEditDay && !!selectedWeekend}
        onClose={() => setShowEditDay(null)}
        value={editDayLabel}
        setValue={setEditDayLabel}
        onSubmit={handleSaveDayLabel}
      />

      {/* Notes & custom mood modal removed */}

      <MoveInstanceModal
        open={!!moveInstance && !!selectedWeekend}
        onClose={() => setMoveInstance(null)}
        days={selectedWeekend?.days}
        moveState={moveInstance}
        setMoveState={setMoveInstance}
        onMove={handleMoveInstance}
      />

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

      {/* Inline templates section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Weekend templates</h2>
        <p className="text-sm opacity-70 mb-4">
          Pick a template to quickly plan a weekend. You can tweak details in
          the next step.
        </p>
        <TemplateGallery
          templates={WEEKEND_TEMPLATES}
          onSelect={(t) => {
            setSelectedTemplate(t);
            setApplyTemplateOpen(true);
          }}
        />
      </div>

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
