type FeatureCardProps = {
  accent: string;
  description: string;
  title: string;
};

export function FeatureCard({ accent, description, title }: FeatureCardProps) {
  return (
    <article className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
      <div
        className="mb-5 h-2 w-12 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <h3 className="text-lg font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
    </article>
  );
}
