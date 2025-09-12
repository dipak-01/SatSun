import { Plus } from "lucide-react";

export default function ActivityTemplateCard({ template, onSelect }) {
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{template.icon}</span>
            <div>
              <h3 className="card-title text-base">{template.title}</h3>
              <p className="text-sm opacity-70">{template.category}</p>
            </div>
          </div>
          <span className="badge badge-ghost">{template.durationMin}m</span>
        </div>
        {template.description && (
          <p className="text-sm opacity-80">{template.description}</p>
        )}
        <div className="text-xs opacity-70 flex flex-wrap gap-2">
          {(template.tags || []).map((t, i) => (
            <span key={i} className="badge badge-soft badge-secondary">
              {t}
            </span>
          ))}
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onSelect?.(template)}
          >
            <Plus size={14} /> Use
          </button>
        </div>
      </div>
    </div>
  );
}
