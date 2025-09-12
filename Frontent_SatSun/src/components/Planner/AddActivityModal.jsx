export default function AddActivityModal({
  open,
  onClose,
  day,
  activities,
  selectedActivityId,
  setSelectedActivityId,
  orderHint,
  setOrderHint,
  onAdd,
}) {
  if (!open || !day) return null;
  return (
    <dialog className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-md relative">
        <button
          aria-label="Close"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-center">Add Activity</h3>
        <p className="text-sm opacity-70 text-center mt-1">
          {new Date(day.date).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>
        <div className="mt-4 space-y-4">
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Activity</span>
            </div>
            <select
              className="select select-bordered w-full"
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
            >
              <option value="">Select an activity</option>
              {(activities || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.title}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Order (optional)</span>
            </div>
            <input
              type="number"
              min={0}
              className="input input-bordered w-full"
              value={orderHint}
              onChange={(e) => setOrderHint(e.target.value)}
            />
            <div className="label">
              <span className="label-text-alt opacity-70">
                Leave blank to add at the end.
              </span>
            </div>
          </label>
        </div>
        <div className="modal-action mt-2">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onAdd}>
            Add
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
