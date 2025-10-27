export default function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <div className="empty-body">{children}</div>
    </div>
  );
}