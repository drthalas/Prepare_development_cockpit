type StatusCardTone = "ready" | "planned" | "blocked";

type StatusCardProps = {
  label: string;
  metric: string;
  tone?: StatusCardTone;
};

const toneClass: Record<StatusCardTone, string> = {
  ready: "bg-emerald-500",
  planned: "bg-sky-500",
  blocked: "bg-amber-500",
};

export function StatusCard({ label, metric, tone = "planned" }: StatusCardProps) {
  return (
    <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${toneClass[tone]}`} />
      </div>
      <p className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
        {metric}
      </p>
    </article>
  );
}
