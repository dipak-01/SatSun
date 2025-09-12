import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { getActivities, getWeekends } from "../lib/api";
import Timeline from "./Timeline";

function startOfMonth(d) {
  const nd = new Date(d.getFullYear(), d.getMonth(), 1);
  return nd;
}
function addDays(d, n) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}
function addMonths(d, n) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + n);
  return nd;
}
function startOfWeekSun(d) {
  const nd = new Date(d);
  const day = nd.getDay(); // 0..6 Sun..Sat
  return addDays(nd, -day);
}
function localKey(d) {
  // yyyy-mm-dd in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function localKeyFromIso(iso) {
  const d = new Date(iso);
  return localKey(d);
}
function inRange(date, startIso, endIso) {
  const k = localKey(date);
  const s = localKeyFromIso(startIso);
  const e = localKeyFromIso(endIso);
  return k >= s && k <= e;
}

export default function Calender() {
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [loading, setLoading] = useState(true);
  const [weekends, setWeekends] = useState([]);
  const [activities, setActivities] = useState([]);
  const [modalDate, setModalDate] = useState(null);
  const [view, setView] = useState(() => {
    // Default to timeline on small screens
    if (typeof window !== "undefined") {
      return window.innerWidth < 640 ? "timeline" : "calendar";
    }
    return "calendar";
  });
  const navigate = useNavigate();

  // Weekend helpers
  const weekendEmoji = "🎉";
  const isWeekend = (d) => {
    const day = d.getDay();
    return day === 0 || day === 6; // Sun or Sat
  };

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

  const daysGrid = useMemo(() => {
    const som = startOfMonth(monthDate);
    const sow = startOfWeekSun(som);
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(sow, i);
      days.push(d);
    }
    return days;
  }, [monthDate]);

  const byDate = useMemo(() => {
    const map = new Map();
    // Map weekend spans per calendar day and day activity instances per date
    for (const w of weekends) {
      // span marker: we'll just check per day on render using inRange
      for (const day of w.days || []) {
        const key = localKeyFromIso(day.date);
        const entry = map.get(key) || { instances: [], weekends: [] };
        entry.instances.push(...(day.activity_instances || []));
        entry.weekends.push(w);
        map.set(key, entry);
      }
    }
    return map;
  }, [weekends]);

  const isSameMonth = (d) => d.getMonth() === monthDate.getMonth();

  const modalEntry = useMemo(() => {
    if (!modalDate) return null;
    const key = localKey(modalDate);
    return byDate.get(key) || { instances: [], weekends: [] };
  }, [modalDate, byDate]);

  return (
    <section className="space-y-6">
      <div
        className="flex items-center justify-between"
        role="region"
        aria-label="Calendar controls"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon />
          <h1 className="text-2xl font-semibold">
            {monthDate.toLocaleString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* View switch on desktop/tablet */}
          <div
            className="hidden sm:flex items-center gap-2"
            role="tablist"
            aria-label="View switch"
          >
            <button
              role="tab"
              aria-selected={view === "calendar"}
              className={`btn btn-sm ${
                view === "calendar" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setView("calendar")}
            >
              Calendar
            </button>
            <button
              role="tab"
              aria-selected={view === "timeline"}
              className={`btn btn-sm ${
                view === "timeline" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setView("timeline")}
            >
              Timeline
            </button>
          </div>
          <div className="join">
            <button
              className="btn btn-ghost join-item"
              aria-label="Previous month"
              onClick={() => setMonthDate((d) => addMonths(d, -1))}
            >
              <ChevronLeft />
            </button>
            <button
              className="btn btn-ghost join-item"
              aria-label="Go to current month"
              onClick={() =>
                setMonthDate(
                  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                )
              }
            >
              Today
            </button>
            <button
              className="btn btn-ghost join-item"
              aria-label="Next month"
              onClick={() => setMonthDate((d) => addMonths(d, 1))}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday header (hidden in timeline view and on mobile) */}
      {view === "calendar" && (
        <div className="hidden sm:grid grid-cols-7 text-sm opacity-70 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => {
            const isWknd = w === "Sun" || w === "Sat";
            return (
              <div key={w} className="px-2 py-1">
                {isWknd && (
                  <span role="img" aria-label="weekend" className="mr-1">
                    {weekendEmoji}
                  </span>
                )}
                {w}
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <span className="loading loading-dots loading-lg" />
        </div>
      ) : view === "timeline" ||
        (typeof window !== "undefined" && window.innerWidth < 640) ? (
        <Timeline weekends={weekends} activities={activities} />
      ) : (
        <div
          className="grid grid-cols-7 gap-px bg-base-300 rounded-box overflow-hidden"
          role="grid"
          aria-label="Monthly calendar"
        >
          {daysGrid.map((d, idx) => {
            const key = localKey(d);
            const entry = byDate.get(key);
            const instances = entry?.instances || [];
            const cellClass = isSameMonth(d) ? "bg-base-100" : "bg-base-200/60";
            return (
              <div
                key={idx}
                role="gridcell"
                aria-selected={false}
                tabIndex={0}
                className={`${cellClass} min-h-28 p-2 cursor-pointer hover:bg-base-200 transition-colors`}
                onClick={() => setModalDate(d)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setModalDate(d);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`text-sm ${
                      isSameMonth(d) ? "opacity-80" : "opacity-50"
                    }`}
                  >
                    {isWeekend(d) && (
                      <span role="img" aria-label="weekend" className="mr-1">
                        {weekendEmoji}
                      </span>
                    )}
                    {d.getDate()}
                  </div>
                </div>
                {/* Weekend chips if date is in any weekend span */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {weekends
                    .filter((w) => inRange(d, w.start_date, w.end_date))
                    .slice(0, 3)
                    .map((w) => (
                      <span
                        key={w.id}
                        className="badge badge-soft badge-primary whitespace-nowrap max-w-full overflow-hidden text-ellipsis"
                      >
                        {w.title}
                      </span>
                    ))}
                  {weekends.filter((w) => inRange(d, w.start_date, w.end_date))
                    .length > 3 && (
                    <span className="badge badge-ghost">
                      +
                      {weekends.filter((w) =>
                        inRange(d, w.start_date, w.end_date)
                      ).length - 3}
                    </span>
                  )}
                </div>
                {/* Activity instances list (ordered, no time) */}
                <div className="flex flex-col gap-1">
                  {instances
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .slice(0, 4)
                    .map((inst) => {
                      const a = activityMap.get(inst.activity_id);
                      const label = a?.title || `Activity`;
                      return (
                        <div
                          key={inst.id}
                          className="text-xs px-2 py-1 rounded-box bg-base-200 flex items-center gap-2"
                        >
                          <span className="truncate">
                            {a?.icon} {label}
                          </span>
                        </div>
                      );
                    })}
                  {instances.length > 4 && (
                    <div className="text-xs opacity-60">
                      +{instances.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalDate && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {modalDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>

            {/* Weekends covering this date */}
            <div className="mt-2 mb-4 flex flex-wrap gap-2">
              {weekends
                .filter((w) => inRange(modalDate, w.start_date, w.end_date))
                .map((w) => (
                  <span key={w.id} className="badge badge-primary badge-soft">
                    {w.title}
                  </span>
                ))}
              {weekends.filter((w) =>
                inRange(modalDate, w.start_date, w.end_date)
              ).length === 0 && <span className="badge">No weekend</span>}
            </div>

            {/* Activities planned for this date (ordered, no time) */}
            <div className="space-y-2 max-h-80 overflow-auto pr-1">
              {(modalEntry?.instances || [])
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((inst) => {
                  const act = activityMap.get(inst.activity_id);
                  return (
                    <div key={inst.id} className="card bg-base-200">
                      <div className="card-body py-3 px-4 text-sm gap-1">
                        <div className="truncate font-medium">
                          {act?.icon} {act?.title || "Activity"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {(modalEntry?.instances?.length || 0) === 0 && (
                <div className="text-sm opacity-70">No activities planned.</div>
              )}
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setModalDate(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setModalDate(null);
                  navigate("/weekend-planner");
                }}
              >
                Open Planner
              </button>
            </div>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setModalDate(null)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}
    </section>
  );
}
