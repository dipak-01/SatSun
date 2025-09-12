import { useMemo, useState } from "react";

function toISODateOnly(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  // use local date parts to avoid TZ offset issues in backend that expects ISO
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return new Date(`${y}-${m}-${dd}T00:00:00`).toISOString();
}

export default function ApplyTemplateModal({
  open,
  onClose,
  template,
  activities,
  matchActivityId,
  onApply, // ({ title, startDateIso, endDateIso, dayActivities }) => Promise<void>
}) {
  const [title, setTitle] = useState(template?.title || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const preview = useMemo(() => {
    if (!template) return [];
    return template.days.map((d) => ({
      label: d.label,
      activities: (d.activities || []).map((q) => ({
        q,
        activityId: matchActivityId?.(activities, q),
      })),
    }));
  }, [template, activities, matchActivityId]);

  if (!open) return null;

  return (
    <dialog className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-xl relative">
        <button
          aria-label="Close"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-center">Use template</h3>
        <p className="text-sm opacity-70 text-center mt-1">{template?.title}</p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Weekend title</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={template?.title || "My Weekend"}
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Start date</span>
            </div>
            <input
              type="date"
              className="input input-bordered w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">End date</span>
            </div>
            <input
              type="date"
              className="input input-bordered w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Preview</div>
          <div className="space-y-2 max-h-60 overflow-auto pr-1">
            {preview.map((d, idx) => (
              <div key={idx} className="rounded-box bg-base-200 p-2">
                <div className="text-sm font-medium">{d.label}</div>
                <div className="text-xs opacity-70">
                  {(d.activities || []).map((a, i) => (
                    <span
                      key={i}
                      className={`mr-2 badge ${
                        a.activityId ? "badge-primary badge-soft" : ""
                      }`}
                    >
                      {a.q.titleIncludes || a.q.category}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-action mt-2">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              onApply?.({
                title: title || template?.title || "My Weekend",
                startDateIso: toISODateOnly(startDate),
                endDateIso: toISODateOnly(endDate),
                dayTemplates: template?.days || [],
              })
            }
          >
            Add to date
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
