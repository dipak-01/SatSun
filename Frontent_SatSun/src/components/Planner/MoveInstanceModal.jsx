export default function MoveInstanceModal({
  open,
  onClose,
  days,
  moveState,
  setMoveState,
  onMove,
}) {
  if (!open || !moveState) return null;
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
        <h3 className="font-bold text-lg text-center">Move Activity</h3>
        <div className="mt-4 space-y-4">
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Target day</span>
            </div>
            <select
              className="select select-bordered w-full"
              value={moveState.targetDayId}
              onChange={(e) =>
                setMoveState((v) => ({ ...v, targetDayId: e.target.value }))
              }
            >
              {(days || []).map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                  disabled={d.id === moveState.fromDayId}
                >
                  {new Date(d.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="modal-action mt-2">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onMove}>
            Move
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
