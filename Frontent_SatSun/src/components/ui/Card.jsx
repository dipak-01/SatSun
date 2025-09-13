export default function Card({ title, actions, className = "", children }) {
  return (
    <div className={`card bg-base-100 ${className}`.trim()}>
      <div className="card-body">
        {(title || actions) && (
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            {title && <h3 className="card-title">{title}</h3>}
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
