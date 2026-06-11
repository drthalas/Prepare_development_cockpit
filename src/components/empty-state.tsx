type EmptyStateProps = {
  actionLabel?: string;
  description: string;
  title: string;
};

export function EmptyState({ actionLabel, description, title }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-md bg-[var(--soft-accent)] text-sm font-semibold text-[var(--accent-strong)]">
        PDC
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
      {actionLabel ? (
        <div className="mt-5 inline-flex rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-medium text-[var(--muted)]">
          {actionLabel}
        </div>
      ) : null}
    </div>
  );
}
