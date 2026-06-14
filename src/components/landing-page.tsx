import { appConfig } from "@/config/app";
import { Button } from "@/components/ui/button";

const infoSteps = [
  "Создайте проект.",
  "Ответьте на вопросы.",
  "Получите спецификацию.",
  "Сгенерируйте roadmap.",
  "Подготовьте задачи и промпты.",
  "Скачайте результат или экспортируйте.",
];

const outcomes = [
  "Редактируемая спецификация",
  "Roadmap и задачи",
  "Codex prompts и QA-план",
  "ZIP / Linear-ready export",
];

export function LandingPage() {
  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      <section className="flex min-h-screen items-center justify-center px-5 py-16 sm:px-8">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h1 className="text-5xl font-semibold leading-tight tracking-normal sm:text-6xl">
            Prepare Development Cockpit
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-2xl leading-snug text-[var(--muted)] sm:text-3xl">
            Создайте проект из идеи
            <br />и получите структуру разработки.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" href="/app/projects">
              Создать проект
            </Button>
            <details className="group w-full sm:w-auto">
              <summary className="inline-flex h-11 w-full cursor-pointer list-none items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--section-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:w-auto [&::-webkit-details-marker]:hidden">
                Информация
              </summary>
              <div className="mx-auto mt-5 max-w-md rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-left shadow-sm">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Как это работает
                </p>
                <ol className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
                  {infoSteps.map((step, index) => (
                    <li className="flex gap-3" key={step}>
                      <span className="text-[var(--accent-strong)]">
                        {index + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--panel-border)] bg-[var(--section-surface)] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                Результат
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal sm:text-4xl">
                Все артефакты для старта разработки в одном месте.
              </h2>
            </div>
            <Button href="/app/projects" variant="secondary">
              Перейти к проектам
            </Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((outcome) => (
              <div
                className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                key={outcome}
              >
                {outcome}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--panel-border)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>{appConfig.name}</p>
          <p>Railway-first SaaS-прототип.</p>
        </div>
      </footer>
    </main>
  );
}
