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
    <main className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <header className="mx-auto grid h-[4.5rem] w-full max-w-5xl grid-cols-[8.5rem_1fr_auto] items-center gap-3 px-5 sm:h-20 sm:grid-cols-[10rem_1fr_auto] sm:px-8">
        <Link
          aria-label="Nikolaev Solutions AI Lab"
          className="flex min-w-0 items-center"
          href="/"
        >
          <Image
            alt="Nikolaev Solutions AI Lab"
            className="h-10 w-auto object-contain mix-blend-multiply sm:h-12"
            height={260}
            priority
            src="/brand/nikolaev-solutions-ai-lab-header.png"
            width={540}
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

      <section className="flex min-h-[calc(100svh-4.5rem)] items-center justify-center px-5 py-8 sm:min-h-[calc(100svh-5rem)] sm:px-8">
        <div className="mx-auto flex w-full max-w-[22.5rem] flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] shadow-[0_18px_55px_rgba(15,118,110,0.14)] sm:h-24 sm:w-24">
            <svg
              aria-hidden="true"
              className="h-10 w-10 text-[var(--accent)] sm:h-12 sm:w-12"
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

          <h1 className="mt-8 max-w-[21.25rem] text-[2.85rem] font-extrabold leading-[1.02] tracking-normal text-[var(--foreground)] sm:text-6xl">
            Prepare Development Cockpit
          </h1>
          <p className="mt-5 max-w-[21rem] text-xl leading-[1.35] text-[var(--muted)] sm:text-xl">
            Создайте проект из идеи
            <br />и получите структуру разработки.
          </p>

          <div className="mt-8 flex w-full max-w-[22.5rem] flex-col items-stretch justify-center gap-4">
            <Button
              className="min-h-14 w-full rounded-2xl px-7 text-lg shadow-lg shadow-emerald-900/15"
              href="/app/projects"
            >
              Создать проект
            </Button>
            <details className="group w-full">
              <summary className="inline-flex h-14 w-full cursor-pointer list-none items-center justify-center gap-3 rounded-2xl border border-[var(--accent)] bg-transparent px-7 text-lg font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--soft-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden">
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
