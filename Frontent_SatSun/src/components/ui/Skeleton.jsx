export function SkeletonLine({ className = "w-full h-4" }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard({ height = 40, className = "" }) {
  return <div className={`skeleton w-full ${className}`} style={{ height }} />;
}

export function SkeletonList({ count = 5, itemClass = "h-4 w-full" }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${itemClass}`} />
      ))}
    </div>
  );
}
