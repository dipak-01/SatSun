import { useEffect, useMemo, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import {
  addActivityToDay,
  getActivities,
  getWeekends,
  createDayForWeekend,
} from "../lib/api";

// Native HTML5 drag helpers
function useDnD() {
  const [dragData, setDragData] = useState(null);
  const onDragStart = (e, data) => {
    setDragData(data);
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "copy";
  };
  const readData = (e) => {
    try {
      const t = e.dataTransfer.getData("application/json");
      return t ? JSON.parse(t) : dragData;
    } catch (err) {
      console.log(err);
      return dragData;
    }
  };
  return { onDragStart, readData };
}

export default function Weekend() {
  const [weekends, setWeekends] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewDay, setShowNewDay] = useState(false);
  const [newDayDate, setNewDayDate] = useState("");
  // time removed; no day start tracking in simplified model
  const [hoveredDayId, setHoveredDayId] = useState(null);
  const { onDragStart, readData } = useDnD();

  // Fetch weekends and activities
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [w, a] = await Promise.all([
          getWeekends({ includeDays: true }),
          getActivities({ limit: 200 }),
        ]);
        if (!mounted) return;
        setWeekends(w || []);
        setActivities(a?.items || []);
        if (w?.length && !selectedId) setSelectedId(String(w[0].id));
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [selectedId]);

  const currentWeekend = useMemo(
    () => weekends.find((w) => String(w.id) === String(selectedId)),
    [weekends, selectedId]
  );

  const activityMap = useMemo(() => {
    const m = new Map();
    for (const a of activities) m.set(a.id, a);
    return m;
  }, [activities]);

  const sortedDays = useMemo(() => {
    const ds = currentWeekend?.days || [];
    return [...ds].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [currentWeekend]);

  // no default start time in simplified model

  const handleDropOnDay = async (e, day) => {
    e.preventDefault();
    const payload = readData(e);
    if (!payload?.activityId) return;
    try {
      setSaving(true);
      const created = await addActivityToDay(day.id, {
        activityId: payload.activityId,
        order: day.activity_instances?.length || 0,
      });
      // update UI: append into the day
      setWeekends((prev) =>
        prev.map((w) => {
          if (String(w.id) !== String(currentWeekend.id)) return w;
          return {
            ...w,
            days: w.days.map((d) =>
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
          };
        })
      );
    } catch (err) {
      console.error("Failed to add activity to day", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-dots loading-lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Calendar />
          <h1 className="text-2xl font-semibold">Weekend Planner</h1>
        </div>

        <div className="join">
          <select
            className="select select-bordered join-item"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {weekends.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
          <button
            className="btn btn-accent join-item"
            onClick={() => setShowNewDay(true)}
          >
            <Plus size={16} /> New Day
          </button>
        </div>
      </div>

      {/* Layout: Activities | Days */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Activities list */}
        <aside className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">Activities</h2>
              <div className="divider my-2" />
              <div className="flex flex-col gap-3 max-h-[70vh] overflow-auto pr-1">
                {activities.map((a) => (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) =>
                      onDragStart(e, {
                        activityId: a.id,
                        durationMin: a.duration_min,
                      })
                    }
                    className="card bg-base-200 hover:bg-base-300 transition-colors cursor-grab active:cursor-grabbing"
                    title="Drag to a day"
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-left flex items-center gap-2">
                          <span>{a.icon}</span>
                          <span>{a.title}</span>
                        </div>
                        <div className="badge badge-ghost">
                          {a.duration_min}m
                        </div>
                      </div>
                      {a.tags?.length ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {a.tags.map((t, i) => (
                            <span
                              key={i}
                              className="badge badge-soft badge-secondary"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Days board (2 columns on lg for more space) */}
        <section className="lg:col-span-2">
          {!currentWeekend ? (
            <div className="alert alert-info">Select a weekend to plan.</div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedDays.map((day) => (
                <div key={day.id} className="card bg-base-100 shadow-sm">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <h3 className="card-title text-left text-base">
                        {day.day_label}
                      </h3>
                      <span className="badge badge-ghost">
                        {new Date(day.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* No day-level time in simplified model */}

                    <div className="divider my-2" />

                    {/* Drop zone */}
                    <div
                      className={`min-h-28 rounded-box border border-dashed p-3 transition-colors ${
                        hoveredDayId === day.id
                          ? "border-primary bg-primary/10 ring ring-primary ring-offset-1"
                          : "border-base-300 bg-base-200/40"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setHoveredDayId(day.id);
                      }}
                      onDragLeave={(e) => {
                        // If leaving the drop zone (not entering a child), clear highlight
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setHoveredDayId(null);
                        }
                      }}
                      onDrop={(e) => handleDropOnDay(e, day)}
                    >
                      {(day.activity_instances || []).length === 0 ? (
                        <div
                          className={`text-sm text-left ${
                            hoveredDayId === day.id
                              ? "text-primary font-medium"
                              : "opacity-60"
                          }`}
                        >
                          {hoveredDayId === day.id
                            ? "Release to add"
                            : "Drag activities here"}
                        </div>
                      ) : (
                        <ul className="list mt-1">
                          {(day.activity_instances || [])
                            .slice()
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((inst) => (
                              <li key={inst.id} className="list-row">
                                <div className="card bg-base-200">
                                  <div className="card-body p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="text-left">
                                        <div className="font-medium flex items-center gap-2">
                                          <span>
                                            {
                                              activityMap.get(inst.activity_id)
                                                ?.icon
                                            }
                                          </span>
                                          <span>
                                            {activityMap.get(inst.activity_id)
                                              ?.title ||
                                              `Activity #${inst.activity_id}`}
                                          </span>
                                        </div>
                                        {/* No time display in simplified model */}
                                        {inst.notes ? (
                                          <div className="text-xs opacity-60 mt-1">
                                            {inst.notes}
                                          </div>
                                        ) : null}
                                      </div>
                                      {inst.is_completed ? (
                                        <span className="badge badge-success badge-soft">
                                          done
                                        </span>
                                      ) : (
                                        <span className="badge badge-ghost">
                                          pending
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>

                    {saving && (
                      <span className="loading loading-dots loading-sm mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {showNewDay && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-center">Add New Day</h3>
            <form
              className="mt-4 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!currentWeekend) return;
                try {
                  setSaving(true);
                  const dateISO = newDayDate
                    ? new Date(newDayDate).toISOString()
                    : new Date(currentWeekend.start_date).toISOString();
                  const created = await createDayForWeekend(currentWeekend.id, {
                    date: dateISO,
                    dayLabel: new Date(dateISO).toLocaleDateString("en-US", {
                      weekday: "long",
                    }),
                    order: currentWeekend.days?.length || 0,
                  });
                  setWeekends((prev) =>
                    prev.map((w) =>
                      String(w.id) === String(currentWeekend.id)
                        ? {
                            ...w,
                            days: [
                              ...(w.days || []),
                              { ...created, activity_instances: [] },
                            ],
                          }
                        : w
                    )
                  );
                  setShowNewDay(false);
                  setNewDayDate("");
                } catch (err) {
                  console.error("create day", err);
                } finally {
                  setSaving(false);
                }
              }}
            >
              <label className="form-control">
                <span className="label-text">Date</span>
                <input
                  type="date"
                  className="input input-bordered"
                  value={newDayDate}
                  onChange={(e) => setNewDayDate(e.target.value)}
                  required
                />
              </label>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowNewDay(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-accent" disabled={saving}>
                  {saving ? (
                    <span className="loading loading-dots loading-sm" />
                  ) : (
                    "Add Day"
                  )}
                </button>
              </div>
            </form>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onSubmit={() => setShowNewDay(false)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
