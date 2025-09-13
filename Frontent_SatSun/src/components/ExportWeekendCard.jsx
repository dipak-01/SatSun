import { forwardRef, useMemo } from "react";

// Export-friendly card: no interactive controls, compact and printable
// Accepts: weekend (with days and activity_instances) and activityMap (id -> activity)
const ExportWeekendCard = forwardRef(function ExportWeekendCard(
  { weekend, activityMap },
  ref
) {
  const dateRange = useMemo(() => {
    if (!weekend) return "";
    const s = weekend.start_date ? new Date(weekend.start_date) : null;
    const e = weekend.end_date ? new Date(weekend.end_date) : null;
    if (!s) return "";
    const sTxt = s.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!e || +e === +s) return sTxt;
    const eTxt = e.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${sTxt} – ${eTxt}`;
  }, [weekend]);

  if (!weekend) return null;

  return (
    <div
      ref={ref}
      className="w-[960px] bg-base-100 text-base-content"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 32px)",
        backgroundSize: "32px 32px",
      }}
    >
      {/* Banner */}
      <div className="relative overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />
        <div className="absolute inset-0 flex items-center justify-between px-6">
          <div>
            <div className="text-3xl font-bold tracking-tight">
              {weekend.title}
            </div>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-base-100/80 border border-base-300 text-sm">
              {dateRange}
            </div>
          </div>
          {/* QR placeholder */}
          <div className="hidden sm:flex items-center">
            <div className="w-16 h-16 rounded-box bg-base-100 border border-base-300 grid place-items-center text-[10px] opacity-70">
              QR
            </div>
          </div>
        </div>
      </div>

      {/* Mood chip */}
      {weekend.mood && (
        <div className="px-6 mt-3">
          <span className="badge badge-soft badge-primary">
            Mood: {weekend.mood}
          </span>
        </div>
      )}

      <div className="p-6 space-y-4">
        {(weekend.days || []).map((day) => (
          <div key={day.id} className="">
            <div className="font-medium mb-2">
              {new Date(day.date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="space-y-2">
              {(day.activity_instances || [])
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((inst) => {
                  const act = activityMap?.get?.(inst.activity_id);
                  return (
                    <div
                      key={inst.id}
                      className="p-3 rounded-box border border-base-300 flex items-start justify-between gap-3 bg-base-100/90"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {act?.icon} {act?.title || "Activity"}
                        </div>
                        {(inst.notes || inst.custom_mood) && (
                          <div className="text-xs opacity-80 mt-1 whitespace-pre-wrap break-words">
                            {inst.custom_mood && (
                              <span>
                                Mood: <b>{inst.custom_mood}</b>
                              </span>
                            )}
                            {inst.custom_mood && inst.notes ? " • " : ""}
                            {inst.notes || ""}
                          </div>
                        )}
                      </div>
                      <div className="text-xs opacity-70 shrink-0">
                        {inst.is_completed ? "Completed" : "Pending"}
                      </div>
                    </div>
                  );
                })}
              {(day.activity_instances || []).length === 0 && (
                <div className="text-sm opacity-70">No activities</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ExportWeekendCard;
