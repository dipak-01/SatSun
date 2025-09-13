import { useRef } from "react";
import { Calendar, Clock, Share2 } from "lucide-react";
import { exportNodeToPng } from "../lib/exportImage";
import ExportWeekendCard from "./ExportWeekendCard";

export default function WeekendCard({ data, activityMap }) {
  const { start_date, end_date, title, mood, shared } = data || {};
  const exportRef = useRef(null);

  function formatPart(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const startLabel = formatPart(start_date);
  const endLabel = formatPart(end_date);
  const rangeLabel =
    endLabel && startLabel !== endLabel
      ? `${startLabel} - ${endLabel}`
      : startLabel;

  let duration = "";
  if (start_date) {
    const s = new Date(start_date);
    const e = end_date ? new Date(end_date) : s;
    if (!isNaN(s) && !isNaN(e)) {
      const days = Math.max(1, Math.round((e - s) / 86400000) + 1);
      duration = `${days} day${days !== 1 ? "s" : ""}`;
    }
  }

  return (
    <div className="card bg-base-100 w-[88vw] max-w-sm min-w-[16rem] sm:w-80 md:w-96 border border-base-300 hover:border-primary/40 transition-colors shadow-sm h-60">
      <div className="card-body gap-3 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="card-title text-base break-words leading-snug line-clamp-2">
              {title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="badge badge-outline gap-1">
                <Calendar size={12} /> {rangeLabel}
              </span>
              {duration && (
                <span className="badge badge-ghost gap-1">
                  <Clock size={12} /> {duration}
                </span>
              )}
              {mood && (
                <span className="badge badge-soft badge-secondary">{mood}</span>
              )}
            </div>
          </div>
          {shared && (
            <span className="badge badge-soft badge-info self-start">
              Shared
            </span>
          )}
        </div>

        <div className="card-actions justify-end items-center pt-1 mt-auto">
          <button
            className="btn btn-ghost btn-sm"
            aria-label="Share / Export weekend PNG"
            onClick={async () => {
              const node = exportRef.current;
              if (!node) return;
              await exportNodeToPng(node, {
                filename: `${title || "weekend"}.png`,
                pixelRatio: 2,
              });
            }}
          >
            <Share2 size={18} />
          </button>
          <button className="btn btn-primary btn-sm">Open</button>
        </div>
      </div>

      {/* Hidden export content for PNG capture */}
      <div
        className="fixed -left-[10000px] -top-[10000px] pointer-events-none"
        aria-hidden
      >
        <ExportWeekendCard
          ref={exportRef}
          weekend={data}
          activityMap={activityMap}
        />
      </div>
    </div>
  );
}
