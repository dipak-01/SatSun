import { useRef } from "react";
import { Calendar, Clock, Share2 } from "lucide-react";
import { exportNodeToPng } from "../lib/exportImage";
import ExportWeekendCard from "./ExportWeekendCard";

export default function WeekendCard({ data, activityMap }) {
  const { start_date, end_date } = data || {};
  const exportRef = useRef(null);

  const formatPart = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

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
    <div className="card bg-base-100 min-w-80 w-96 shadow-sm hover:shadow transition-shadow">
      <div className="card-body">
        <h2 className="card-title">{data.title}</h2>

        <div className="flex flex-row justify-between items-center font-medium text-sm">
          <span className="flex items-center gap-2">
            <Calendar size={16} /> {rangeLabel}
          </span>
          <span className="flex items-center gap-2 opacity-80">
            <Clock size={16} /> {duration}
          </span>
        </div>

        <div className="card-actions flex justify-between items-center pt-3">
          {data?.mood && (
            <div className="badge badge-soft badge-secondary">{data.mood}</div>
          )}
          <div className="flex items-center gap-2">
            {data?.shared && (
              <div className="badge badge-soft badge-info">Shared</div>
            )}
            <button
              className="btn btn-ghost btn-sm"
              aria-label="Share / Export weekend PNG"
              onClick={async () => {
                const node = exportRef.current;
                if (!node) return;
                await exportNodeToPng(node, {
                  filename: `${data.title || "weekend"}.png`,
                  pixelRatio: 2,
                });
              }}
            >
              <Share2 size={18} />
            </button>
            <button className="btn btn-primary btn-sm">Open</button>
          </div>
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
