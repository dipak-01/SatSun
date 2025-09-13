import { memo } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

function ActivityRowImpl({
  inst,
  act,
  onToggle,
  onReorderUp,
  onReorderDown,
  onMove,
  onDelete,
  disabled = false,
}) {
  return (
    <div className="p-2 rounded-box bg-base-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate">
          {act?.icon} {act?.title || "Activity"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="toggle toggle-sm"
          checked={!!inst.is_completed}
          onChange={onToggle}
          aria-label="Completed"
          disabled={disabled}
        />
        <div className="dropdown dropdown-end">
          <button
            className="btn btn-xs"
            aria-label="More actions"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
            }}
          >
            <MoreVertical size={12} />
          </button>
          <ul
            tabIndex={0}
            role="menu"
            className="dropdown-content menu menu-sm bg-base-100 rounded-box z-[1] mt-2 w-48 p-2 shadow"
          >
            <li>
              <button role="menuitem" onClick={onReorderUp} disabled={disabled}>
                Move up
              </button>
            </li>
            <li>
              <button
                role="menuitem"
                onClick={onReorderDown}
                disabled={disabled}
              >
                Move down
              </button>
            </li>
            <li>
              <button role="menuitem" onClick={onMove} disabled={disabled}>
                Move activity
              </button>
            </li>
            <li>
              <button
                role="menuitem"
                className="text-error"
                onClick={onDelete}
                disabled={disabled}
              >
                <Trash2 size={12} /> Delete
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const ActivityRow = memo(ActivityRowImpl);
export default ActivityRow;
