import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/classnames";
import type {
  ArtifactState,
  WorkflowStepState,
} from "@/lib/projects/project-workflow";

export type WorkflowStepperItem = {
  href?: string;
  id: string;
  label: string;
  state: WorkflowStepState;
};

export type NextStepBannerProps = {
  action: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
};

export type ArtifactListItem = {
  formAction?: (formData: FormData) => Promise<void> | void;
  href?: string;
  id: string;
  label: string;
  state: ArtifactState;
};

export function WorkflowStepper({ steps }: { steps: WorkflowStepperItem[] }) {
  return (
    <nav aria-label="Прогресс проекта" className="-mx-1 overflow-x-auto pb-2">
      <ol className="flex min-w-max items-center gap-2 px-1">
        {steps.map((step, index) => (
          <li className="flex items-center gap-2" key={step.id}>
            {step.href ? (
              <Link
                className={cn(
                  "group flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold transition",
                  getStepperTextClass(step.state),
                )}
                href={step.href}
              >
                <StepperMarker index={index} state={step.state} />
                <span className="whitespace-nowrap">{step.label}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-semibold",
                  getStepperTextClass(step.state),
                )}
              >
                <StepperMarker index={index} state={step.state} />
                <span className="whitespace-nowrap">{step.label}</span>
              </span>
            )}
            {index < steps.length - 1 ? (
              <span className="h-px w-8 bg-[var(--panel-border)]" />
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function NextStepBanner({
  action,
  description,
  icon = "✨",
  title,
}: NextStepBannerProps) {
  return (
    <section className="mt-5 rounded-2xl border border-[var(--accent)] bg-[var(--soft-accent)] p-5 text-[var(--accent-strong)] shadow-sm sm:p-7">
      <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-3xl text-white shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">Следующий шаг:</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--accent-strong)]">
            {description}
          </p>
        </div>
        {action}
      </div>
    </section>
  );
}

export function ArtifactList({ items }: { items: ArtifactListItem[] }) {
  return (
    <article className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-sm sm:p-5">
      <h2 className="flex items-center gap-3 px-2 pb-4 text-xl font-semibold">
        <RouteIcon />
        Маршрут проекта
      </h2>
      <div className="overflow-hidden rounded-lg border border-[var(--panel-border)]">
        {items.map((item, index) => (
          <ArtifactRow index={index + 1} item={item} key={item.id} />
        ))}
      </div>
    </article>
  );
}

export function ArtifactRow({
  index,
  item,
}: {
  index: number;
  item: ArtifactListItem;
}) {
  const isCurrent = item.state === "current" || item.state === "needs_action";
  const isDone = item.state === "done";
  const isClickable = Boolean(item.href || item.formAction);
  const rowClassName = cn(
    "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--panel-border)] bg-white px-3 py-3 text-left transition last:border-b-0 sm:px-4",
    isCurrent && "bg-[var(--soft-accent)]",
    isClickable && "cursor-pointer hover:bg-[var(--section-surface)]",
    isClickable && isCurrent && "hover:bg-[var(--soft-accent)]",
  );
  const content = (
    <>
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          isDone && "bg-[var(--accent)] text-white",
          isCurrent &&
            "border-2 border-[var(--accent)] bg-white text-[var(--accent-strong)]",
          !isDone &&
            !isCurrent &&
            "border border-[var(--panel-border)] bg-white text-[var(--muted)]",
        )}
      >
        {isDone ? "✓" : index}
      </span>
      <span
        className={cn(
          "min-w-0 text-base font-semibold text-[var(--foreground)] sm:text-lg",
          isCurrent && "text-[var(--accent-strong)]",
        )}
      >
        {item.label}
      </span>
      {isClickable ? (
        <span
          aria-hidden="true"
          className={cn(
            "text-3xl font-light leading-none text-[var(--muted)]",
            isCurrent && "text-[var(--accent-strong)]",
          )}
        >
          ›
        </span>
      ) : (
        <span aria-hidden="true" className="size-4" />
      )}
    </>
  );

  if (item.href) {
    return (
      <Link className={rowClassName} href={item.href}>
        {content}
      </Link>
    );
  }

  if (item.formAction) {
    return (
      <form action={item.formAction}>
        <button className={rowClassName} type="submit">
          {content}
        </button>
      </form>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}

function RouteIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5 text-[var(--foreground)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h4a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7" />
    </svg>
  );
}

export function StatusBadge({
  children,
  state,
}: {
  children: ReactNode;
  state: "completed" | "current" | "disabled" | "warning";
}) {
  return (
    <span
      className={cn(
        "w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
        state === "completed" &&
          "bg-[var(--soft-accent)] text-[var(--accent-strong)]",
        state === "current" && "bg-white text-[var(--accent-strong)]",
        state === "disabled" &&
          "bg-[var(--section-surface)] text-[var(--muted)]",
        state === "warning" && "bg-[var(--soft-warning)] text-amber-900",
      )}
    >
      {children}
    </span>
  );
}

export function MetadataGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{children}</dl>;
}

export function MetadataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--panel-border)] bg-white px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function StepperMarker({
  index,
  state,
}: {
  index: number;
  state: WorkflowStepState;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
        state === "completed" &&
          "border-[var(--accent)] bg-[var(--accent)] text-white",
        state === "current" &&
          "border-[var(--accent)] bg-white text-[var(--accent-strong)]",
        state === "available" &&
          "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]",
        (state === "upcoming" || state === "disabled") &&
          "border-[var(--panel-border)] bg-white text-[var(--muted)]",
      )}
    >
      {state === "completed" ? "✓" : index + 1}
    </span>
  );
}

function getStepperTextClass(state: WorkflowStepState) {
  if (state === "completed" || state === "available") {
    return "text-[var(--accent-strong)]";
  }

  if (state === "current") {
    return "bg-[var(--soft-accent)] text-[var(--accent-strong)]";
  }

  return "text-[var(--muted)]";
}
