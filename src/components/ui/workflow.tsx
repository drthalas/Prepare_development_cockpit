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
  action?: ReactNode;
  description: string;
  id: string;
  label: string;
  state: ArtifactState;
  statusLabel: string;
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
    <article className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Созданные артефакты</h2>
      <div className="mt-4 grid gap-2">
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

  return (
    <div
      className={cn(
        "grid gap-3 rounded-xl border p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center",
        isCurrent
          ? "border-[var(--accent)] bg-[var(--soft-accent)]"
          : "border-[var(--panel-border)] bg-white",
      )}
    >
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full text-sm font-bold",
          item.state === "done"
            ? "bg-[var(--accent)] text-white"
            : isCurrent
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--panel-border)] text-[var(--muted)]",
        )}
      >
        {item.state === "done" ? "✓" : index}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{item.label}</h3>
          <StatusBadge
            state={item.state === "done" ? "completed" : isCurrent ? "current" : "disabled"}
          >
            {item.statusLabel}
          </StatusBadge>
        </div>
        <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
          {item.description}
        </p>
      </div>
      {item.action ? (
        item.action
      ) : (
        <span className="text-sm font-semibold text-[var(--muted)]">
          Недоступно
        </span>
      )}
    </div>
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
