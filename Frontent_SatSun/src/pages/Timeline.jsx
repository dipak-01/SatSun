import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { getActivitiesCached, getWeekendsCached } from "../lib/api";
import { holidaysBetween } from "../lib/holidays";

function formatLongDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function Timeline({
  weekends: weekendsProp,
  activities: activitiesProp,
}) {
  const [loading, setLoading] = useState(!weekendsProp || !activitiesProp);
  const [weekends, setWeekends] = useState(weekendsProp || []);
  const [activities, setActivities] = useState(activitiesProp || []);
  const navigate = useNavigate();

  useEffect(() => {
    if (weekendsProp && activitiesProp) {
      // Data provided by parent; no fetch needed
      setLoading(false);
      return;
    }
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const wCached = getWeekendsCached({ includeDays: true });
        const aCached = getActivitiesCached({ limit: 500 });
        const [wInit, aInit] = await Promise.all([
          wCached.initial,
          aCached.initial,
        ]);
        if (mounted) {
          if (Array.isArray(wInit)) setWeekends(wInit);
          if (aInit?.items) setActivities(aInit.items);
        }
        const [wFresh, aFresh] = await Promise.all([
          wCached.refresh,
          aCached.refresh,
        ]);
        if (!mounted) return;
        setWeekends(Array.isArray(wFresh) ? wFresh : []);
        setActivities(aFresh?.items || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [weekendsProp, activitiesProp]);

  const activityMap = useMemo(() => {
    const m = new Map();
    for (const a of activities) m.set(a.id, a);
    return m;
  }, [activities]);

  // Build date-wise entries from all weekends' days
  const entries = useMemo(() => {
    const list = [];
    let minIso = null;
    let maxIso = null;
    for (const w of weekends) {
      for (const d of w.days || []) {
        const iso = d.date;
        if (iso && (!minIso || iso < minIso)) minIso = iso;
        if (iso && (!maxIso || iso > maxIso)) maxIso = iso;
        list.push({
          kind: "day",
          date: iso,
          weekend: w,
          day: d,
          instances: (d.activity_instances || [])
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        });
      }
    }
    // Merge holidays in range
    if (minIso && maxIso) {
      const hols = holidaysBetween(minIso, maxIso);
      for (const h of hols) {
        list.push({
          kind: "holiday",
          date: h.dateObj.toISOString(),
          holiday: h,
        });
      }
    }
    list.sort((a, b) => new Date(a.date) - new Date(b.date));
    return list;
  }, [weekends]);

  return (
    <section className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarDays /> Timeline
        </h1>
        <div className="text-sm opacity-70">
          {entries.length} day{entries.length === 1 ? "" : "s"}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <span className="loading loading-dots loading-lg" />
        </div>
      ) : entries.length === 0 ? (
        <div className="alert">
          <span>No weekend plans yet. Create one in the Planner.</span>
        </div>
      ) : (
        <ol className="relative border-l-2 border-base-300 pl-4 sm:pl-6 space-y-6">
          {entries.map((e, idx) => {
            if (e.kind === "holiday") {
              const h = e.holiday;
              return (
                <li key={`hol-${idx}`} className="relative">
                  <span className="absolute -left-[11px] sm:-left-[13px] top-1 h-5 w-5 rounded-full bg-base-100 border-2 border-warning grid place-items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                  </span>
                  <div
                    className={`card ${
                      h.isGazetted ? "bg-error/10" : "bg-warning/10"
                    }`}
                  >
                    <div className="card-body py-4 sm:py-5">
                      <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                        <div className="min-w-0">
                          <div className="text-sm opacity-70">
                            {formatLongDate(e.date)}
                          </div>
                          <div className="text-lg font-medium break-words">
                            {h.name}
                          </div>
                          <div className="text-xs opacity-70">{h.type}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            }

            const weekendTitle = e.weekend?.title || "Weekend";
            const mood = e.weekend?.mood;
            return (
              <li
                key={`${e.weekend?.id}-${e.day?.id || e.date}`}
                className="relative"
              >
                <span className="absolute -left-[11px] sm:-left-[13px] top-1 h-5 w-5 rounded-full bg-base-100 border-2 border-primary grid place-items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <div className="card bg-base-100">
                  <div className="card-body py-4 sm:py-5">
                    <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                      <div className="min-w-0">
                        <div className="text-sm opacity-70">
                          {formatLongDate(e.date)}
                        </div>
                        <div className="text-lg font-medium break-words">
                          <button
                            type="button"
                            className="link link-primary"
                            aria-label={`Open planner for ${weekendTitle}`}
                            onClick={() =>
                              navigate(
                                e.weekend?.id
                                  ? `/weekend-planner?weekendId=${encodeURIComponent(
                                      e.weekend.id
                                    )}`
                                  : "/weekend-planner"
                              )
                            }
                          >
                            {weekendTitle}
                          </button>
                        </div>
                        {mood && (
                          <div className="text-xs opacity-70">Mood: {mood}</div>
                        )}
                      </div>
                      <div className="text-xs opacity-60 whitespace-nowrap">
                        {(e.instances || []).length} activit
                        {(e.instances || []).length === 1 ? "y" : "ies"}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {(e.instances || []).length === 0 ? (
                        <div className="text-sm opacity-70">
                          No activities planned.
                        </div>
                      ) : (
                        (e.instances || []).map((inst) => {
                          const a = activityMap.get(inst.activity_id);
                          const title = a?.title || "Activity";
                          const icon = a?.icon || "";
                          return (
                            <div
                              key={inst.id}
                              className="rounded-box bg-base-200 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <div className="text-sm break-words">
                                  {icon} {title}
                                </div>
                                {a?.category && (
                                  <div className="text-xs opacity-60">
                                    {a.category}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
