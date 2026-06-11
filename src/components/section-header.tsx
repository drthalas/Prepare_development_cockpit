type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function SectionHeader({
  description,
  eyebrow,
  title,
}: SectionHeaderProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase text-[var(--accent-strong)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-normal text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}
