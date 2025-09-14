import { Clock } from "lucide-react";
import { memo } from "react";

function ActivityCardImpl({ data }) {

  return (
    <div className="card bg-base-100 w-[88vw] max-w-sm min-w-[16rem] sm:w-80 md:w-96 border border-base-300 hover:border-primary/40 transition-colors shadow-sm h-60">
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

export default memo(ActivityCardImpl);
