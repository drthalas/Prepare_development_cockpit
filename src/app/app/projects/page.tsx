import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { ProjectIntakeWizard } from "@/components/project-intake-wizard";
import {
  ActionLink,
  DetailsDisclosure,
  PageHeader,
} from "@/components/ui/patterns";
import {
  projectStatusLabels,
} from "@/lib/projects/project-options";
import { listProjects } from "@/lib/projects/project-store";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams: Promise<{
    deleted?: string | string[];
    error?: string | string[];
  }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const query = await searchParams;
  const projectsResult = await listProjects();
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  const deleted = Array.isArray(query.deleted) ? query.deleted[0] : query.deleted;

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <Link
          className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          href="/app"
        >
          Назад в рабочую область
        </Link>

        <div className="mt-6">
          <PageHeader
            actions={<ActionLink href="#create-project">Создать проект</ActionLink>}
            description="Создайте проект из идеи. Следующее действие появится на странице проекта."
            eyebrow="Проекты"
            title="Проекты"
          />
        </div>

        <div className="mt-6 grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section>
            <DetailsDisclosure title="Как пользоваться сервисом">
              <ol className="grid gap-2">
              {[
                "Создайте проект и опишите идею.",
                "Запустите классификацию и ответьте на вопросы.",
                "Сгенерируйте spec, roadmap, prompts и export.",
              ].map((step, index) => (
                <li key={step}>
                  <span className="font-semibold text-[var(--foreground)]">
                    {index + 1}.
                  </span>{" "}
                  {step}
                </li>
              ))}
            </ol>
            </DetailsDisclosure>

          {!projectsResult.databaseReady ? (
            <div className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">
                Нужно настроить базу данных
              </p>
              <p className="mt-2 leading-6">{projectsResult.message}</p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-[var(--soft-warning)] p-4 text-sm font-medium text-amber-900">
              {error === "validation"
                ? "Название и описание идеи обязательны."
                : "Проект не удалось сохранить: база данных не настроена или недоступна."}
            </div>
          ) : null}

          {deleted ? (
            <div className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--soft-accent)] p-4 text-sm font-medium text-[var(--accent-strong)]">
              Review/test проект удалён.
            </div>
          ) : null}

          <div className="mt-6 grid gap-4">
            {projectsResult.data.length === 0 ? (
              <EmptyState
                actionHref="#create-project"
                actionLabel="Создайте первый проект"
                description="Пока нет проектов. Начните с короткой формы справа."
                title="Пока нет проектов"
              />
            ) : (
              projectsResult.data.map((project) => (
                <article
                  className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
                  key={project.id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                        {project.shortId}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold">
                        {project.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                        {project.initialIdea}
                      </p>
                      {project.targetUser ? (
                        <p className="mt-2 line-clamp-1 text-xs font-medium text-[var(--muted)]">
                          Аудитория: {project.targetUser}
                        </p>
                      ) : null}
                    </div>
                    <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                      {projectStatusLabels[project.status]}
                    </span>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 border-t border-[var(--panel-border)] pt-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                    <p>Обновлено {formatDate(project.updatedAt)}</p>
                    <Link
                      className="font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                      href={`/app/projects/${project.id}`}
                    >
                      Открыть проект
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section
          className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
          id="create-project"
        >
          <h2 className="text-xl font-semibold">Мастер создания проекта</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Заполните основные данные. Остальные шаги запускаются после создания.
          </p>

          <div className="mt-6">
            <ProjectIntakeWizard />
          </div>
        </section>
      </div>
      </div>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
