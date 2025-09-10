import { Calendar, Clock, Share2 } from "lucide-react";

export default function WeekendCard({ data }) {
  const { start_date, end_date } = data || {};

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
    <>
      <div className="card bg-base-100 w-96 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">
            {data.title}
            <img src="" alt="" />
          </h2>

          <div className="flex flex-row justify-between font-medium">
            <span className="flex items-center gap-2">
              <Calendar /> {rangeLabel}
            </span>
 
            <span className="flex items-center gap-2">
              <Clock /> {duration}
            </span>
          </div>

          <div className="card-actions flex justify-between items-center pt-2">
            <div className="badge badge-soft badge-secondary">{data.mood}</div>
            {data?.shared && <div className="badge badge-soft badge-info">shared</div>}
            <div className="justify-between flex gap-2 items-center">
              <span>{<Share2 size={24} />}</span>

              <span>
                <button className="btn btn-soft btn-info">Info</button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
