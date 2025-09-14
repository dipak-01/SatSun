export default function EditWeekendModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  weekendTitle,
}) {
  if (!open) return null;
  return (
    <dialog className="modal modal-open modal-middle sm:modal-middle">
      <div className="modal-box w-full max-w-lg max-h-[85vh] overflow-y-auto relative">
        <button
          aria-label="Close"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-center">Edit Weekend</h3>
        <p className="text-sm opacity-70 text-center mt-1">
          Update details for “{weekendTitle}”.
        </p>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Title</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Start date</span>
            </div>
            <input
              type="date"
              className="input input-bordered w-full"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">End date</span>
            </div>
            <input
              type="date"
              className="input input-bordered w-full"
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Mood (optional)</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={form.mood}
              onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
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
