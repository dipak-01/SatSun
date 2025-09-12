import { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, X, Search } from "lucide-react";
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../lib/api";

const categories = [
  "Outdoors",
  "Indoors",
  "Fitness",
  "Relax",
  "Food",
  "Social",
  "Learning",
  "Other",
];

export default function Activity() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [premiumFilter, setPremiumFilter] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    category: "",
    durationMin: 30,
    icon: "🎯",
    tags: "",
    isPremium: false,
    defaultMood: "",
  });

  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getActivities({ limit: 500 });
        if (!mounted) return;
        setItems(data?.items || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || [])
      .filter((a) =>
        !q
          ? true
          : [a.title, a.description, a.category, (a.tags || []).join(" ")]
              .join(" ")
              .toLowerCase()
              .includes(q)
      )
      .filter((a) => (catFilter ? a.category === catFilter : true))
      .filter((a) =>
        premiumFilter === ""
          ? true
          : premiumFilter === "yes"
          ? !!a.is_premium
          : !a.is_premium
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [items, query, catFilter, premiumFilter]);

  async function handleCreate(e) {
    e?.preventDefault?.();
    const payload = {
      ...createForm,
      tags: createForm.tags
        ? createForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
    const created = await createActivity(payload);
    setItems((prev) => [created, ...prev]);
    setShowCreate(false);
    setCreateForm({
      title: "",
      description: "",
      category: "",
      durationMin: 30,
      icon: "🎯",
      tags: "",
      isPremium: false,
      defaultMood: "",
    });
  }

  function openEdit(a) {
    setEditItem(a);
    setEditForm({
      title: a.title || "",
      description: a.description || "",
      category: a.category || "",
      durationMin: a.duration_min || 30,
      icon: a.icon || "🎯",
      tags: (a.tags || []).join(", "),
      isPremium: !!a.is_premium,
      defaultMood: a.default_mood || "",
    });
  }

  async function handleEdit(e) {
    e?.preventDefault?.();
    if (!editItem) return;
    const patch = {
      ...editForm,
      tags: editForm.tags
        ? editForm.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };
    const updated = await updateActivity(editItem.id, patch);
    setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setEditItem(null);
  }

  async function handleDelete(a) {
    await deleteActivity(a.id);
    setItems((prev) => prev.filter((x) => x.id !== a.id));
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4  ">
        <h1 className="text-2xl font-semibold">Activities</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Activity
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4">
        <label className="form-control md:max-w-xs">
          <div className="label flex justify-start ">
            <span className="label-text">Search</span>
          </div>
          <div className="input input-bordered flex items-center gap-2">
            <Search size={16} />
            <input
              className="grow"
              placeholder="Title, description, tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </label>
        <label className="form-control md:max-w-xs">
          <div className="label justify-start flex w-20">
            <span className="label-text">Category</span>
          </div>
          <select
            className="select select-bordered"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control md:max-w-xs">
          <div className="label justify-start flex w-20">
            <span className="label-text">Premium</span>
          </div>
          <select
            className="select select-bordered"
            value={premiumFilter}
            onChange={(e) => setPremiumFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="yes">Premium</option>
            <option value="no">Free</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[40vh]">
          <span className="loading loading-dots loading-lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="alert">No activities found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className="card bg-base-100">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">{a.icon}</span>
                    <div>
                      <div className="font-medium text-start">{a.title}</div>
                      <div className="text-xs text-start opacity-70">
                        {a.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.is_premium ? (
                      <span className="badge badge-warning badge-soft">
                        Premium
                      </span>
                    ) : (
                      <span className="badge badge-ghost">Free</span>
                    )}
                    <button className="btn btn-xs" onClick={() => openEdit(a)}>
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => handleDelete(a)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {a.description && (
                  <div className="text-sm mt-2 text-start">{a.description}</div>
                )}
                <div className="text-xs opacity-70 mt-2 flex  flex-wrap gap-2">
                  <div className="flex flex-row  justify-between">
                    <span className="badge badge-ghost">{a.duration_min}m</span>
                    {a.default_mood && (
                      <span className="badge badge-soft badge-primary">
                        Mood: {a.default_mood}
                      </span>
                    )}
                  </div>
                  <div>
                    {(a.tags || []).map((t, i) => (
                      <span
                        key={i}
                        className="badge badge-soft badge-secondary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-lg relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setShowCreate(false)}
            >
              <X size={16} />
            </button>
            <h3 className="font-bold text-lg text-center">New Activity</h3>
            <form className="mt-4 space-y-4" onSubmit={handleCreate}>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Title</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Description</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Category</span>
                </div>
                <select
                  className="select select-bordered w-full"
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, category: e.target.value }))
                  }
                  required
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
                  value={createForm.durationMin}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      durationMin: Number(e.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Icon</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={createForm.icon}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, icon: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Default Mood</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={createForm.defaultMood}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      defaultMood: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Tags (comma separated)</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={createForm.tags}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, tags: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Premium</span>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-accent"
                  checked={!!createForm.isPremium}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      isPremium: e.target.checked,
                    }))
                  }
                />
              </label>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Create
                </button>
              </div>
            </form>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setShowCreate(false)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}

      {editItem && (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box w-full max-w-lg relative">
            <button
              aria-label="Close"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setEditItem(null)}
            >
              <X size={16} />
            </button>
            <h3 className="font-bold text-lg text-center">Edit Activity</h3>
            <form className="mt-4 space-y-4" onSubmit={handleEdit}>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full ">
                  <span className="label-text">Title</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Description</span>
                </div>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Category</span>
                </div>
                <select
                  className="select select-bordered w-full"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, category: e.target.value }))
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
                  value={editForm.durationMin}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      durationMin: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Icon</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={editForm.icon}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, icon: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Default Mood</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={editForm.defaultMood}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      defaultMood: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Tags (comma separated)</span>
                </div>
                <input
                  className="input input-bordered w-full"
                  value={editForm.tags}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, tags: e.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full text-start">
                <div className="label justify-start text-left w-full">
                  <span className="label-text">Premium</span>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-accent"
                  checked={!!editForm.isPremium}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      isPremium: e.target.checked,
                    }))
                  }
                />
              </label>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
          <form
            method="dialog"
            className="modal-backdrop"
            onClick={() => setEditItem(null)}
          >
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}
