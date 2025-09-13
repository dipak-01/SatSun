import { X } from "lucide-react";

export default function EditActivityModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  categories = [],
}) {
  if (!open) return null;
  return (
    <dialog className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-lg max-h-[85vh] overflow-y-auto relative">
        <button
          aria-label="Close"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          <X size={16} />
        </button>
        <h3 className="font-bold text-lg text-center">Edit Activity</h3>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full ">
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
              <span className="label-text">Description</span>
            </div>
            <textarea
              className="textarea textarea-bordered w-full"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Category</span>
            </div>
            <select
              className="select select-bordered w-full"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Duration (min)</span>
            </div>
            <input
              type="number"
              min={1}
              className="input input-bordered w-full"
              value={form.durationMin}
              onChange={(e) =>
                setForm((f) => ({ ...f, durationMin: Number(e.target.value) }))
              }
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Icon</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Default Mood</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={form.defaultMood}
              onChange={(e) =>
                setForm((f) => ({ ...f, defaultMood: e.target.value }))
              }
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Tags (comma separated)</span>
            </div>
            <input
              className="input input-bordered w-full"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </label>
          <label className="form-control w-full text-start">
            <div className="label justify-start text-left w-full">
              <span className="label-text">Premium</span>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-accent"
              checked={!!form.isPremium}
              onChange={(e) =>
                setForm((f) => ({ ...f, isPremium: e.target.checked }))
              }
            />
          </label>
          <div className="modal-action">
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
