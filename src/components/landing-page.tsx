import Link from "next/link";
import Image from "next/image";

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
      <header className="mx-auto grid h-24 w-full max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-3 px-5 sm:h-24 sm:px-8">
        <Link
          aria-label="Nikolaev Solutions AI Lab"
          className="flex min-w-0 items-center"
          href="/"
        >
          <Image
            alt="Nikolaev Solutions AI Lab"
            className="h-14 w-auto object-contain sm:h-16"
            height={330}
            priority
            src="/brand/nikolaev-solutions-ai-lab.png"
            width={560}
          />
        </Link>
        <p className="min-w-0 truncate text-center text-[10px] font-medium leading-none text-[var(--muted)] sm:text-xs">
          Prepare Development Cockpit
        </p>
        <Link
          className="justify-self-end rounded-lg border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--soft-accent)]"
          href="/app/projects"
        >
          Проекты
        </Link>
      </header>

      <section className="flex min-h-[calc(100svh-6rem)] items-center justify-center px-5 pb-16 pt-4 sm:px-8 sm:pb-20">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] shadow-[0_18px_55px_rgba(15,118,110,0.16)]">
            <svg
              aria-hidden="true"
              className="h-12 w-12 text-[var(--accent)]"
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                height="34"
                rx="5"
                stroke="currentColor"
                strokeWidth="3"
                width="36"
                x="6"
                y="7"
              />
              <path
                d="M6 17H42"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3"
              />
              <path
                d="M20 25L15 30L20 35"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <path
                d="M28 25L33 30L28 35"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <path
                d="M26 24L22 36"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
          </div>

          <h1 className="mx-auto mt-9 max-w-[21rem] text-[3.1rem] font-semibold leading-[1.08] tracking-normal text-[var(--foreground)] sm:max-w-2xl sm:text-6xl">
            Prepare Development Cockpit
          </h1>
          <p className="mx-auto mt-6 max-w-sm text-lg leading-8 text-[var(--muted)] sm:max-w-xl sm:text-xl">
            Создайте проект из идеи
            <br />и получите структуру разработки.
          </p>

          <div className="mx-auto mt-12 flex w-full max-w-[23rem] flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <Button
              className="min-h-14 w-full rounded-lg px-7 text-lg shadow-lg shadow-emerald-900/15 sm:w-auto"
              href="/app/projects"
            >
              Создать проект
            </Button>
            <details className="group w-full sm:w-auto">
              <summary className="inline-flex h-14 w-full cursor-pointer list-none items-center justify-center gap-3 rounded-lg border border-[var(--accent)] bg-transparent px-7 text-lg font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--soft-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:w-auto [&::-webkit-details-marker]:hidden">
                <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-current text-sm">
                  i
                </span>
                <span>Информация</span>
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
