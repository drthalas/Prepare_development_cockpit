import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/classnames";

export type ProjectSectionId =
  | "export"
  | "overview"
  | "roadmap"
  | "spec"
  | "status"
  | "tasks";

const projectSectionLabels: Record<ProjectSectionId, string> = {
  export: "Экспорт",
  overview: "Обзор",
  roadmap: "Дорожная карта",
  spec: "Спецификация",
  status: "Статус проекта",
  tasks: "Задачи",
};

export function ProjectSectionShell({
  active,
  children,
  contentClassName,
  projectId,
  projectTitle,
}: {
  active: ProjectSectionId;
  children: ReactNode;
  contentClassName?: string;
  projectId: string;
  projectTitle: string;
}) {
  const items = getProjectSectionItems(projectId);

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] text-[var(--foreground)]">
      <div className="mx-auto grid w-full max-w-[1480px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-5 lg:h-[calc(100svh-2.5rem)]">
          <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] lg:h-full">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--panel-border)] bg-white text-[var(--accent)]"
              >
                <ProjectMiniGlyph />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{projectTitle}</p>
                <p className="text-xs font-medium text-[var(--muted)]">Проект</p>
              </div>
            </div>

            <nav aria-label="Разделы проекта" className="mt-5">
              <p className="px-2 text-xs font-semibold uppercase text-[var(--muted)]">
                Обзор
              </p>
              <ul className="mt-2 grid gap-1">
                {items.map((item) => {
                  const isActive = item.id === active;

                  return (
                    <li key={item.id}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
                          isActive
                            ? "bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                            : "text-[var(--foreground)] hover:bg-[var(--section-surface)]",
                        )}
                        href={item.href}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex size-5 items-center justify-center rounded-md border text-[11px]",
                            isActive
                              ? "border-[var(--accent)] bg-white"
                              : "border-[var(--panel-border)] bg-white text-[var(--muted)]",
                          )}
                        >
                          {item.shortLabel}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        <div className={cn("min-w-0", contentClassName)}>{children}</div>
      </div>
    </main>
  );
}

function getProjectSectionItems(projectId: string) {
  return ([
    ["overview", `/app/projects/${projectId}`, "О"],
    ["spec", `/app/projects/${projectId}/spec`, "С"],
    ["roadmap", `/app/projects/${projectId}/roadmap`, "Д"],
    ["tasks", `/app/projects/${projectId}/roadmap#tasks`, "З"],
    ["export", `/app/projects/${projectId}/export`, "Э"],
    ["status", `/app/projects/${projectId}/status`, "✓"],
  ] as const).map(([id, href, shortLabel]) => ({
    href,
    id,
    label: projectSectionLabels[id],
    shortLabel,
  }));
}

function ProjectMiniGlyph() {
  return (
    <svg
      className="size-6"
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.8 3.5 8.3 17.7h7.9l-3 10.8 10.5-14.2h-7.9l3-10.8Z"
        fill="currentColor"
      />
    </svg>
  );
}
