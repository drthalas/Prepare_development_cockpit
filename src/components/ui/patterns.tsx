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
  backHref,
  backLabel = "Назад",
  description,
  eyebrow,
  metadata,
  secondaryAction,
  title,
  variant = "panel",
}: {
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  description?: string;
  eyebrow?: string;
  metadata?: ReactNode;
  secondaryAction?: ReactNode;
  title: string;
  variant?: "panel" | "plain";
}) {
  return (
    <header
      className={cn(
        variant === "panel" &&
          "rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm sm:p-6",
      )}
    >
      {backHref ? (
        <Link
          className="mb-5 inline-flex text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
          href={backHref}
        >
          ← {backLabel}
        </Link>
      ) : null}
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
        {actions || secondaryAction ? (
          <div className="flex flex-wrap gap-2">
            {secondaryAction}
            {actions}
          </div>
        ) : null}
      </div>
      {metadata ? <div className="mt-5">{metadata}</div> : null}
    </header>
  );
}

export function PageShell({
  children,
  className,
  maxWidth = "7xl",
  surface = "workspace",
}: {
  children: ReactNode;
  className?: string;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "none";
  surface?: "background" | "workspace";
}) {
  const maxWidthClass = {
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    none: "max-w-none",
  }[maxWidth];

  return (
    <main
      className={cn(
        "min-h-screen px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8",
        surface === "workspace"
          ? "bg-[var(--workspace-bg)]"
          : "bg-[var(--background)]",
      )}
    >
      <div className={cn("mx-auto w-full", maxWidthClass, className)}>
        {children}
      </div>
    </main>
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
