import ActivityTemplateCard from "./ActivityTemplateCard";

export default function ActivityTemplateGallery({ templates, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(templates || []).map((t) => (
        <ActivityTemplateCard key={t.id} template={t} onSelect={onSelect} />
      ))}
    </div>
  );
}
