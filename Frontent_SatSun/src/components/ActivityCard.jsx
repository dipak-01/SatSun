import { Clock } from "lucide-react";

export default function ActivityCard({ data }) {
  // const { start_date, end_date } = data || {};

  // const formatPart = (d) => {
  //   if (!d) return "";
  //   const dt = new Date(d);
  //   if (isNaN(dt)) return "";
  //   return dt.toLocaleDateString("en-US", {
  //     weekday: "short",
  //     month: "short",
  //     day: "numeric",
  //   });
  // };

  // const startLabel = formatPart(start_date);
  // const endLabel = formatPart(end_date);
  // const rangeLabel =
  //   endLabel && startLabel !== endLabel
  //     ? `${startLabel} - ${endLabel}`
  //     : startLabel;

  // let duration = "";
  // if (start_date) {
  //   const s = new Date(start_date);
  //   const e = end_date ? new Date(end_date) : s;
  //   if (!isNaN(s) && !isNaN(e)) {
  //     const days = Math.max(1, Math.round((e - s) / 86400000) + 1);
  //     duration = `${days} day${days !== 1 ? "s" : ""}`;
  //   }
  // }

  return (
    <div className="card bg-base-100 w-full sm:min-w-72 sm:w-96 border border-base-300 hover:border-primary/40 transition-colors shadow-sm h-60">
      <div className="card-body gap-3 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-xl leading-none select-none">
              {data?.icon || "🎯"}
            </span>
            <div className="min-w-0">
              <h3 className="card-title text-base break-words leading-snug">
                {data?.title}
              </h3>
              {data?.description && (
                <p className="text-sm opacity-70 mt-1 line-clamp-2 text-left">
                  {data.description}
                </p>
              )}
            </div>
          </div>
          {data?.category && (
            <span className="badge badge-ghost whitespace-nowrap self-start">
              {data.category}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="badge badge-outline gap-1">
            <Clock size={12} /> {data?.duration_min}m
          </span>
          {data?.default_mood && (
            <span className="badge badge-soft badge-info">
              {data.default_mood}
            </span>
          )}
        </div>

        {(data?.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 max-h-10 overflow-hidden">
            {data.tags.map((tag, index) => (
              <span key={index} className="badge badge-soft badge-secondary">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
