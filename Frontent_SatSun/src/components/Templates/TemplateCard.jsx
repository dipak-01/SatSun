import { Plus } from "lucide-react";

export default function TemplateCard({ template, onSelect }) {
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3">
        <div>
          <h3 className="card-title text-base">{template.title}</h3>
          <p className="text-sm opacity-70">{template.description}</p>
        </div>
        <div className="text-xs opacity-60">
          {template.days.length} day{template.days.length === 1 ? "" : "s"}
        </div>
        <div className="card-actions justify-end">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onSelect?.(template)}
          >
            <Plus size={14} /> Use template
          </button>
        </div>
      </div>
    </div>
  );
}
