import { useEffect, useMemo, useState } from "react";
import { Plus, Edit3, Trash2, Search } from "lucide-react";
import {
  getActivitiesCached,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../lib/api";
import { ACTIVITY_TEMPLATES } from "../lib/activityTemplates";
import ActivityTemplateGallery from "../components/ActivityTemplates/ActivityTemplateGallery";
import CreateActivityModal from "../components/Activities/CreateActivityModal";
import EditActivityModal from "../components/Activities/EditActivityModal";

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
        // Use cache-first for activities
        const cached = getActivitiesCached({ limit: 500 });
        const initial = await cached.initial;
        if (mounted && initial?.items) setItems(initial.items || []);
        const fresh = await cached.refresh;
        if (!mounted) return;
        setItems(fresh?.items || []);
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
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Activities</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Activity
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-end mb-4">
        <label
          className="form-control md:max-w-xs"
          aria-label="Search activities"
        >
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
        <label
          className="form-control md:max-w-xs"
          aria-label="Filter by category"
        >
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
        <label
          className="form-control md:max-w-xs"
          aria-label="Filter by premium"
        >
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[40vh]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-60 w-full"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="alert">
          <span>No activities match your filters.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="card bg-base-100 w-full border border-base-300 hover:border-primary/40 transition-colors shadow-sm h-60"
            >
              <div className="card-body h-full flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-xl leading-none select-none">
                      {a.icon || "🎯"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="card-title text-base break-words leading-snug">
                        {a.title}
                      </h3>
                      {a.category && (
                        <div className="text-xs opacity-70">{a.category}</div>
                      )}
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
                  </div>
                </div>

                {a.description && (
                  <p className="text-sm opacity-70 line-clamp-2 text-left">
                    {a.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="badge badge-outline">{a.duration_min}m</span>
                  {a.default_mood && (
                    <span className="badge badge-soft badge-primary">
                      {a.default_mood}
                    </span>
                  )}
                </div>

                {(a.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-10 overflow-hidden">
                    {a.tags.map((t, i) => (
                      <span
                        key={i}
                        className="badge badge-soft badge-secondary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex justify-end gap-2">
                  <button
                    className="btn btn-xs"
                    aria-label={`Edit ${a.title}`}
                    onClick={() => openEdit(a)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openEdit(a);
                      }
                    }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    className="btn btn-xs btn-error"
                    aria-label={`Delete ${a.title}`}
                    onClick={() => handleDelete(a)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleDelete(a);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateActivityModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        form={createForm}
        setForm={setCreateForm}
        onSubmit={handleCreate}
        categories={categories}
      />

      {/* Inline templates section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Activity templates</h2>
        <p className="text-sm opacity-70 mb-4">
          Pick a template to prefill the form. You can tweak before creating.
        </p>
        <ActivityTemplateGallery
          templates={ACTIVITY_TEMPLATES}
          onSelect={(t) => {
            setCreateForm({
              title: t.title,
              description: t.description,
              category: t.category,
              durationMin: t.durationMin,
              icon: t.icon,
              tags: (t.tags || []).join(", "),
              isPremium: !!t.isPremium,
              defaultMood: t.defaultMood || "",
            });
            setShowCreate(true);
          }}
        />
      </div>

      <EditActivityModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        form={editForm}
        setForm={setEditForm}
        onSubmit={handleEdit}
        categories={categories}
      />
    </section>
  );
}
