import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  getActivities,
  getWeekends,
  addActivityToDay as apiAddActivityToDay,
  updateActivityInstance as apiUpdateActivityInstance,
  deleteActivityInstance as apiDeleteActivityInstance,
} from "../lib/api";
// Local compact card showing only title, duration, and mood
function MiniActivityCard({ data }) {
  const title = data?.title || data?.activity?.title || "Activity";
  const duration = data?.duration_min ?? data?.activity?.duration_min;
  const mood =
    data?.default_mood ?? data?.activity?.default_mood ?? data?.customMood;
  const icon = data?.icon ?? data?.activity?.icon;
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300/50">
      <div className="card-body p-4 gap-2">
        <div className="font-semibold text-left flex items-center gap-2">
          {icon && <span className="text-xl leading-none">{icon}</span>}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {typeof duration === "number" && (
            <span className="badge badge-ghost">{duration} min</span>
          )}
          {mood && <span className="badge badge-soft badge-info">{mood}</span>}
        </div>
      </div>
    </div>
  );
}

// Small draggable wrapper for catalog items
function DraggableCatalogItem({ item }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: `catalog-${item.id}`,
      data: { type: "catalog", activity: item },
    });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <MiniActivityCard data={item} />
    </div>
  );
}

// Sortable instance for items within a day
function SortableInstance({ instance, index, dayId, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } =
    useSortable({ id: instance.id, data: { type: "instance", instance, dayId, index } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="relative">
        <MiniActivityCard
          data={{
            title: instance.activity?.title,
            duration_min: instance.activity?.duration_min,
            default_mood:
              instance.customMood ?? instance.activity?.default_mood,
            icon: instance.activity?.icon,
          }}
        />
        <button
          className="btn btn-ghost btn-xs absolute top-2 right-2"
          title="Delete activity"
          aria-label="Delete activity"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!window.confirm("Remove this activity from the day?")) return;
            onDelete?.(instance);
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// (DroppableDay presentational component defined later; see bottom)

export default function WeekendDragAndDropper() {
  // Catalog and weekend state
  const [catalog, setCatalog] = useState([]);
  const [days, setDays] = useState([]); // [{id, day_label, date, items: [{id, activity}]}]
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [weekends, setWeekends] = useState([]); // raw weekends from API
  const [selectedWeekendId, setSelectedWeekendId] = useState(null);

  // DnD State
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const [activeData, setActiveData] = useState(null); // {type, activity|instance}

  // Read only fetch to keep UI realistic, but we won't persist
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [acts, wends] = await Promise.all([
          getActivities({ limit: 100 }),
          getWeekends({ includeDays: true }),
        ]);
        if (!mounted) return;
        const actItems = acts.items || [];
        setCatalog(actItems);
        // If weekends exist, store list and select first; else fallback to default Sat/Sun
        if (Array.isArray(wends) && wends.length > 0) {
          setWeekends(wends);
          setSelectedWeekendId(wends[0].id);
        } else {
          const today = new Date();
          const sat = new Date(today);
          sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
          const sun = new Date(sat);
          sun.setDate(sat.getDate() + 1);
          const preparedDays = [
            {
              id: "sat",
              day_label: "Saturday",
              date: sat.toISOString(),
              items: [],
            },
            {
              id: "sun",
              day_label: "Sunday",
              date: sun.toISOString(),
              items: [],
            },
          ];
          setDays(preparedDays);
        }
      } catch {
        // Fallback to default days and empty catalog if API fails
        const today = new Date();
        const sat = new Date(today);
        sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        setDays([
          {
            id: "sat",
            day_label: "Saturday",
            date: sat.toISOString(),
            items: [],
          },
          {
            id: "sun",
            day_label: "Sunday",
            date: sun.toISOString(),
            items: [],
          },
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Derive days when selected weekend or catalog changes
  useEffect(() => {
    if (!selectedWeekendId) return;
    const w = weekends.find((x) => x.id == selectedWeekendId);
    if (!w) return;
    const byId = Object.fromEntries(catalog.map((a) => [a.id, a]));
    const preparedDays = (w.days || []).map((d) => ({
      ...d,
      items: (d.activity_instances || [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((row) => ({
          id: row.id,
          dayId: row.day_id,
          activityId: row.activity_id,
          order: row.order ?? 0,
          notes: row.notes ?? null,
          customMood: row.custom_mood ?? null,
          isCompleted: row.is_completed ?? false,
          activity: byId[row.activity_id] || {
            id: row.activity_id,
            title: "Activity",
          },
        })),
    }));
    setActiveData(null);
    setDays(preparedDays);
  }, [selectedWeekendId, weekends, catalog]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((a) => (a.title || "").toLowerCase().includes(q));
  }, [catalog, search]);

  function getWeekendLabel(w) {
    if (w?.title) return w.title;
    const start = w?.start_date ? new Date(w.start_date) : null;
    const end = w?.end_date ? new Date(w.end_date) : null;
    if (start && end) {
      return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
    }
    return `Weekend ${w?.id ?? ""}`;
  }

  // DnD handlers
  function handleDragStart(event) {
    const { active } = event;
    setActiveData(active.data?.current || null);
  }

  function handleDragOver() {}

  function handleDragEnd(event) {
    const { active, over } = event;
    const activePayload = active?.data?.current;
    const overPayload = over?.data?.current;
    if (!activePayload || !overPayload) {
      setActiveData(null);
      return;
    }

    // target day and insert index
    let targetDayId = null;
    let insertIndex = 0;
    if (overPayload.type === "day") {
      targetDayId = overPayload.dayId;
      const day = days.find((d) => d.id == targetDayId);
      insertIndex = day?.items?.length ?? 0;
    } else if (overPayload.type === "instance") {
      targetDayId = overPayload.dayId;
      const tDay = days.find((d) => d.id == targetDayId);
      const overIndex = (tDay?.items || []).findIndex((i) => i.id === over.id);
      insertIndex = overIndex >= 0 ? overIndex : (tDay?.items?.length ?? 0);
    }

    if (!targetDayId) {
      setActiveData(null);
      return;
    }

    if (activePayload.type === "catalog") {
      const activityId = activePayload.activity.id;
      apiAddActivityToDay(targetDayId, { activityId, order: insertIndex })
        .then((row) => {
          const details = catalog.find((a) => a.id === activityId) || {
            id: activityId,
            title: "Activity",
          };
          setDays((prev) => {
            const copy = prev.map((d) => ({ ...d, items: [...(d.items || [])] }));
            const dIdx = copy.findIndex((d) => d.id == targetDayId);
            if (dIdx === -1) return prev;
            const inst = {
              id: row.id,
              dayId: row.day_id,
              activityId: row.activity_id,
              order: row.order ?? insertIndex,
              notes: row.notes ?? null,
              customMood: row.custom_mood ?? null,
              isCompleted: row.is_completed ?? false,
              activity: details,
            };
            copy[dIdx].items.splice(insertIndex, 0, inst);
            return copy;
          });
        })
        .finally(() => setActiveData(null));
    } else if (activePayload.type === "instance") {
      setDays((prev) => {
        const copy = prev.map((d) => ({ ...d, items: [...(d.items || [])] }));
        const srcDayIdx = copy.findIndex((d) => (d.items || []).some((i) => i.id === active.id));
        if (srcDayIdx === -1) return prev;
        const srcItems = copy[srcDayIdx].items;
        const srcIndex = srcItems.findIndex((i) => i.id === active.id);
        if (srcIndex === -1) return prev;
        const moved = srcItems[srcIndex];
        const tgtDayIdx = copy.findIndex((d) => d.id == targetDayId);
        if (tgtDayIdx === -1) return prev;

        if (copy[srcDayIdx].id == targetDayId) {
          // Same day reorder
          copy[srcDayIdx].items = arrayMove(copy[srcDayIdx].items, srcIndex, insertIndex);
          apiUpdateActivityInstance(moved.id, { order: insertIndex }).catch(() => {});
        } else {
          // Cross-day move: delete + re-add
          const [removed] = copy[srcDayIdx].items.splice(srcIndex, 1);
          apiDeleteActivityInstance(removed.id)
            .then(() =>
              apiAddActivityToDay(targetDayId, {
                activityId: removed.activityId || removed.activity?.id,
                order: insertIndex,
              })
            )
            .then((row) => {
              const details =
                catalog.find((a) => a.id === (removed.activityId || removed.activity?.id)) ||
                removed.activity || { id: removed.activityId, title: "Activity" };
              setDays((curr) => {
                const next = curr.map((d) => ({ ...d, items: [...(d.items || [])] }));
                const dIdx = next.findIndex((d) => d.id == targetDayId);
                if (dIdx !== -1) {
                  next[dIdx].items.splice(insertIndex, 0, {
                    id: row.id,
                    dayId: row.day_id,
                    activityId: row.activity_id,
                    order: row.order ?? insertIndex,
                    notes: row.notes ?? null,
                    customMood: row.custom_mood ?? null,
                    isCompleted: row.is_completed ?? false,
                    activity: details,
                  });
                }
                return next;
              });
            })
            .catch(() => {
              // revert if needed
              setDays((curr) => {
                const next = curr.map((d) => ({ ...d, items: [...(d.items || [])] }));
                const sIdx = next.findIndex((d) => d.id == copy[srcDayIdx].id);
                if (sIdx !== -1) {
                  next[sIdx].items.splice(srcIndex, 0, removed);
                }
                return next;
              });
            });
        }
        return copy;
      });
      setActiveData(null);
    }
  }

  function handleDeleteInstance(instance) {
    apiDeleteActivityInstance(instance.id)
      .then(() => {
        setDays((prev) =>
          prev.map((d) => ({
            ...d,
            items: (d.items || []).filter((i) => i.id !== instance.id),
          }))
        );
      })
      .catch(() => {});
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Weekend Planner</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">Weekend</span>
          <select
            className="select select-bordered select-sm"
            value={selectedWeekendId ?? ""}
            onChange={(e) => setSelectedWeekendId(e.target.value)}
          >
            {weekends.map((w) => (
              <option key={w.id} value={w.id}>
                {getWeekendLabel(w)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Catalog */}
          <section className="col-span-5 xl:col-span-4">
            <div className="card bg-base-100 shadow-sm border border-base-300/60">
              <div className="card-body">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="card-title">Activities</h2>
                  <span className="badge badge-ghost">{filteredCatalog.length}</span>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search activities..."
                    className="input input-bordered input-sm w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="grid gap-4">
                  {loading && <div className="skeleton h-24 w-full" />}
                  {!loading && filteredCatalog.length === 0 && (
                    <div className="alert">
                      <span>No activities found.</span>
                    </div>
                  )}
                  {!loading &&
                    filteredCatalog.map((a) => (
                      <DraggableCatalogItem key={a.id} item={a} />
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right: Days grid */}
          <section className="col-span-7 xl:col-span-8">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 min-h-64">
              {days.map((day) => (
                <DayDroppableWrapper key={day.id} day={day}>
                  <SortableContext
                    items={(day.items || []).map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {(day.items || []).map((inst, idx) => (
                      <SortableInstance
                        key={inst.id}
                        instance={inst}
                        index={idx}
                        dayId={day.id}
                        onDelete={handleDeleteInstance}
                      />
                    ))}
                  </SortableContext>
                </DayDroppableWrapper>
              ))}
            </div>
          </section>
        </div>

        <DragOverlay>
          {activeData ? (
            <div className="opacity-90">
              {activeData.type === "catalog" ? (
                <MiniActivityCard data={activeData.activity} />
              ) : (
                <MiniActivityCard
                  data={{
                    title: activeData.instance.activity?.title,
                    duration_min: activeData.instance.activity?.duration_min,
                    default_mood:
                      activeData.instance.customMood ??
                      activeData.instance.activity?.default_mood,
                    icon: activeData.instance.activity?.icon,
                  }}
                />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Presentational day card with highlight when droppable is active
function DroppableDay({ day, isOver, children }) {
  return (
    <div
      className={`card bg-base-200/50 shadow-sm border transition-all ${
        isOver ? "border-primary ring-2 ring-primary/30" : "border-base-300/60"
      }`}
    >
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">{day.day_label || day.label}</div>
          <div className="badge badge-soft">
            {new Date(day.date).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 min-h-24">
          {children}
          {!children || (Array.isArray(children) && children.length === 0) ? (
            <div
              className={`rounded-box border-2 border-dashed text-sm grid place-items-center py-6 opacity-80 ${
                isOver ? "border-primary text-primary" : "border-base-300"
              }`}
            >
              Drop activities here
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Wrapper that registers the droppable area for a day
function DayDroppableWrapper({ day, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.id}`,
    data: { type: "day", dayId: day.id },
  });
  return (
    <div ref={setNodeRef}>
      <DroppableDay day={day} isOver={isOver}>
        {children}
      </DroppableDay>
    </div>
  );
}
