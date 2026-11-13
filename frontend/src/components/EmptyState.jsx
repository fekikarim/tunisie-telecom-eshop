export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="fade-in card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-tt-50 text-tt-600">
          <Icon className="size-7" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
