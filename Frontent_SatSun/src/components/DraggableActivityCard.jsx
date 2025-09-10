import { Clock } from "lucide-react";

export default function DraggableActivityCard({ data }) {
  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("application/json", JSON.stringify(data));
          e.dataTransfer.effectAllowed = "move";
          e.currentTarget.classList.add("dragging");
        }}
        onDragEnd={(e) => {
          e.currentTarget.classList.remove("dragging");
        }}
        className="cursor-move  card bg-base-100  w-80  shadow-sm hover:scale-[1.01] transition-transform hover:shadow-md"
      >
        <div className="card-body">
          <div>
            <h2 className="card-title  text-start">
              {data?.icon} {data?.title}
            </h2>
            {/* <p className="text-start pt-2 line-clamp-2">{data?.description}</p> */}
          </div>
          <div className="flex flex-row justify-between font-medium pt-4">
            <span className="flex items-center gap-2">
              {<Clock size={16} />}
              {data?.duration_min} min
            </span>
            <span className="badge badge-dash badge-ghost">
              {data?.category}
            </span>
            <span className="badge badge-soft badge-info">
              {" "}
              {data?.default_mood}
            </span>
          </div>
          <div className="card-actions justify-start flex flex-wrap gap-2 pt-4">
            {data?.tags.map((tag, index) => (
              <div key={index} className="badge badge-soft badge-secondary">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
