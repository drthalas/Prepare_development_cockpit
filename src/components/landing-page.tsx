import Link from "next/link";

import { Button } from "@/components/ui/button";

const infoSteps = [
  "Создайте проект.",
  "Ответьте на вопросы.",
  "Получите спецификацию.",
  "Сгенерируйте roadmap.",
  "Подготовьте задачи и промпты.",
  "Скачайте результат или экспортируйте.",
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="mx-auto grid h-14 w-full max-w-5xl grid-cols-[1fr_minmax(0,1.1fr)_1fr] items-center gap-2 px-4 sm:h-16 sm:px-6">
        <p className="min-w-0 text-xs font-semibold text-[var(--foreground)] sm:text-sm">
          Николаев AI
        </p>
        <p className="min-w-0 text-center text-xs font-medium leading-tight text-[var(--muted)] sm:text-sm">
          Prepare Development Cockpit
        </p>
        <Link
          className="justify-self-end rounded-md border border-[var(--panel-border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] sm:px-4 sm:text-sm"
          href="/app/projects"
        >
          Проекты
        </Link>
      </header>

      <section className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center px-5 pt-14 pb-16 sm:min-h-[calc(100vh-4rem)] sm:px-8 sm:pt-20">
        <div className="mx-auto w-full max-w-2xl text-center">
          <h1 className="mx-auto max-w-[17rem] text-4xl font-semibold leading-[1.05] tracking-normal text-[var(--foreground)] sm:max-w-2xl sm:text-5xl md:text-6xl">
            Prepare Development Cockpit
          </h1>
          <p className="mx-auto mt-7 max-w-md text-lg leading-7 text-[var(--muted)] sm:mt-8 sm:max-w-xl sm:text-xl sm:leading-8">
            Создайте проект из идеи
            <br />и получите структуру разработки.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              className="min-h-12 w-full rounded-lg px-6 shadow-md shadow-emerald-900/10 sm:w-auto"
              href="/app/projects"
            >
              Создать проект
            </Button>
            <details className="group w-full sm:w-auto">
              <summary className="inline-flex h-12 w-full cursor-pointer list-none items-center justify-center rounded-lg border border-[var(--panel-border)] bg-transparent px-6 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[var(--panel)] hover:text-[var(--accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:w-auto [&::-webkit-details-marker]:hidden">
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
    </main>
  );
}
