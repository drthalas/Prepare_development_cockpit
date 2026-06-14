import Link from "next/link";

import { appConfig } from "@/config/app";
import { EmptyState } from "@/components/empty-state";
import {
  ActionLink,
  DetailsDisclosure,
  PageHeader,
} from "@/components/ui/patterns";

const navItems = ["Проекты", "Spec", "Roadmap", "Задачи", "QA", "Экспорт"];

const placeholderRows = [
  "Создать проект",
  "Ответить на вопросы",
  "Скачать пакет",
];

const howToUseSteps = [
  "Создайте проект и опишите идею.",
  "Укажите GitHub, деплой, Codex/Claude/Cursor и QA-настройки.",
  "Запустите классификацию.",
  "Ответьте на уточняющие вопросы.",
  "Сгенерируйте и отредактируйте спецификацию.",
  "Настройте исполнение.",
  "Сгенерируйте roadmap.",
  "Откройте задачу и сгенерируйте Codex Prompt.",
  "Скачайте ZIP-пакет или экспортируйте в Linear.",
];

export function AppShell() {
  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] text-[var(--foreground)]">
      <div className="grid min-h-screen lg:grid-cols-[17rem_1fr]">
        <aside className="border-b border-[var(--panel-border)] bg-[var(--workspace-rail)] px-5 py-5 lg:border-b-0 lg:border-r">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">
              PDC
            </span>
            <span className="text-sm font-semibold">{appConfig.name}</span>
          </Link>

          <nav className="mt-8 flex gap-2 overflow-x-auto lg:grid lg:overflow-visible">
            {navItems.map((item, index) => (
              <Link
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium ${
                  index === 0
                    ? "bg-[var(--panel)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]"
                }`}
                href={index === 0 ? "/app/projects" : `#${index}`}
                key={item}
              >
                {item}
              </Link>
            ))}
          </nav>

          <p className="mt-8 hidden rounded-md bg-[var(--panel)] px-3 py-2 text-xs font-medium text-[var(--muted)] lg:block">
            Review-прототип без auth/billing.
          </p>
        </aside>

        <section className="px-5 py-6 sm:px-8 lg:px-10">
          <PageHeader
            actions={<ActionLink href="/app/projects">Создать проект</ActionLink>}
            description="Начните с проекта. Дальше страница проекта покажет одну главную кнопку для следующего шага."
            eyebrow="Рабочая область"
            title="Cockpit подготовки разработки"
          />

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
              id="projects"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Проекты</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Создайте новый проект или продолжите существующий
                  </p>
                </div>
                <span className="rounded-full bg-[var(--soft-warning)] px-3 py-1 text-xs font-semibold text-amber-800">
                  Пусто
                </span>
              </div>
              <div className="mt-5">
                <EmptyState
                  actionHref="/app/projects"
                  actionLabel="Открыть проекты"
                  description="Создайте первый проект из идеи."
                  title="Пока нет проектов"
                />
              </div>
            </section>

            <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Как пользоваться сервисом
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Основной путь от идеи до пакета артефактов
                  </p>
                </div>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--line-soft)]">
                  <div className="h-full w-1/3 bg-[var(--accent)]" />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {placeholderRows.map((row, index) => (
                  <div
                    className="rounded-md bg-[var(--section-surface)] px-4 py-3"
                    key={row}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{row}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Шаг {index + 1}
                        </p>
                      </div>
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <DetailsDisclosure title="Как пользоваться">
                  <ol className="grid gap-2">
                  {howToUseSteps.map((step, index) => (
                    <li key={step}>
                      <span className="font-semibold text-[var(--foreground)]">
                        {index + 1}.
                      </span>{" "}
                      {step}
                    </li>
                  ))}
                </ol>
                </DetailsDisclosure>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
