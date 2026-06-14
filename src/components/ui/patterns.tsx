import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/classnames";

type ActionVariant = "primary" | "secondary" | "danger";

const actionVariants: Record<ActionVariant, string> = {
  danger:
    "border border-red-300 bg-red-50 text-red-950 hover:bg-red-100",
  primary:
    "bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-strong)]",
  secondary:
    "border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground)] hover:border-[var(--accent)]",
};

export function ActionLink({
  children,
  className,
  href,
  variant = "primary",
}: {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: ActionVariant;
}) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition",
        actionVariants[variant],
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

export function PageHeader({
  actions,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className={eyebrow ? "mt-2 text-3xl font-semibold" : "text-3xl font-semibold"}>
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function InfoNotice({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
      : tone === "warning"
        ? "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
        : "border-[var(--panel-border)] bg-[var(--section-surface)] text-[var(--muted)]";

  return (
    <div className={cn("rounded-md border p-4 text-sm leading-6", toneClass)}>
      {children}
    </div>
  );
}

export function DetailsDisclosure({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <details className="rounded-md border border-[var(--panel-border)] bg-[var(--section-surface)] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">
        {title}
      </summary>
      <div className="mt-3 text-sm leading-6 text-[var(--foreground)]">
        {children}
      </div>
    </details>
  );
}
