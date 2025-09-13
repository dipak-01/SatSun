export default function Spinner({ size = "lg", className = "" }) {
  const cls = `loading loading-dots loading-${size} ${className}`.trim();
  return <span className={cls} aria-label="Loading" />;
}
