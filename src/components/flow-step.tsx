type FlowStepProps = {
  description: string;
  index: number;
  title: string;
};

export function FlowStep({ description, index, title }: FlowStepProps) {
  return (
    <li className="grid gap-3 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 sm:grid-cols-[3rem_1fr]">
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[var(--soft-accent)] text-sm font-semibold text-[var(--accent-strong)]">
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      </div>
    </li>
  );
}
