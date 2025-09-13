export default function EditDayLabelModal({
  open,
  onClose,
  value,
  setValue,
  onSubmit,
}) {
  if (!open) return null;
  return (
    <dialog className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-md max-h-[85vh] overflow-y-auto relative">
        <button
          aria-label="Close"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-center">Rename Day</h3>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Label</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <div className="modal-action mt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
