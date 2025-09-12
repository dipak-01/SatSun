import { Calendar, Clock, Share2 } from "lucide-react";

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
    <div className="card bg-base-100 min-w-80 w-96 shadow-sm hover:shadow transition-shadow">
      <div className="card-body">
        <div>
          <h2 className="card-title text-left">
            {data?.icon} {data?.title}
          </h2>
          {data?.description && (
            <p className="text-left mt-2 line-clamp-2 opacity-90">
              {data.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 font-medium pt-3 text-sm">
          <span className="flex items-center gap-2">
            <Clock size={16} />
            {data?.duration_min} min
          </span>
          {data?.category && (
            <span className="badge badge-ghost">{data.category}</span>
          )}
          {data?.default_mood && (
            <span className="badge badge-soft badge-info">
              {data.default_mood}
            </span>
          )}
        </div>
        {(data?.tags?.length ?? 0) > 0 && (
          <div className="card-actions justify-start flex flex-wrap gap-2 pt-3">
            {data.tags.map((tag, index) => (
              <div key={index} className="badge badge-soft badge-secondary">
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
