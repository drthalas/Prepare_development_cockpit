import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { ProjectIntakeWizard } from "@/components/project-intake-wizard";
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
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <section>
          <Link
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
            href="/app"
          >
            Назад в рабочую область
          </Link>
          <div className="mt-6">
            <p className="text-sm font-semibold text-[var(--accent-strong)]">
              Проекты
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Создание проекта из идеи
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Опишите продукт, аудиторию, GitHub, деплой, инструмент
              разработки и QA. После создания проекта страница проекта покажет,
              какую кнопку нажать дальше.
            </p>
          </div>

          <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Как пользоваться сервисом</h2>
            <ol className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)]">
              {[
                "Создайте проект и опишите идею.",
                "Укажите GitHub, деплой, Codex/Claude/Cursor и QA-настройки.",
                "Запустите классификацию.",
                "Ответьте на уточняющие вопросы.",
                "Сгенерируйте и отредактируйте спецификацию.",
                "Настройте исполнение и сгенерируйте roadmap.",
                "Откройте задачу, сгенерируйте Codex Prompt и скачайте ZIP/Linear export.",
              ].map((step, index) => (
                <li key={step}>
                  <span className="font-semibold text-[var(--foreground)]">
                    {index + 1}.
                  </span>{" "}
                  {step}
                </li>
              ))}
            </ol>
          </section>

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
                actionLabel="Создайте первый проект"
                description="Пока нет проектов. Создайте первый проект из идеи, затем следуйте подсказкам на странице проекта."
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

        <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Мастер создания проекта</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Заполните основные данные. Это первый шаг основного сценария;
            генерация spec, roadmap, prompts и export запускаются отдельно
            после создания проекта.
          </p>

          <div className="mt-6">
            <ProjectIntakeWizard />
          </div>
        </section>
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
