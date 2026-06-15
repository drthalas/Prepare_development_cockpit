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

const artifactChips = ["Спецификация", "Roadmap", "Промпты"];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--background)] p-4 text-[var(--foreground)] sm:p-8">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-[var(--panel-border)] bg-[rgba(255,255,255,0.72)] shadow-[0_24px_70px_rgba(23,32,38,0.08)] sm:min-h-[calc(100svh-4rem)] sm:rounded-[2rem]">
        <header className="flex h-16 items-center border-b border-[var(--panel-border)] px-5 sm:h-[4.5rem] sm:px-8">
          <Link
            aria-label="Nikolaev Solutions AI Lab"
            className="flex min-w-0 items-center"
            href="/"
          >
            <Image
              alt="Nikolaev Solutions AI Lab"
              className="h-9 w-auto object-contain mix-blend-multiply sm:h-10"
              height={260}
              priority
              src="/brand/nikolaev-solutions-ai-lab-header.png"
              width={540}
            />
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-12">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-[1.75rem] border border-[var(--panel-border)] bg-[rgba(255,255,255,0.86)] px-5 py-9 text-center shadow-[0_22px_70px_rgba(23,32,38,0.09)] sm:rounded-[2rem] sm:px-14 sm:py-14">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)] shadow-[0_20px_60px_rgba(15,118,110,0.16)] sm:h-24 sm:w-24">
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

            <h1 className="mt-8 max-w-[21rem] text-[2.65rem] font-extrabold leading-[1.04] tracking-normal text-[var(--foreground)] sm:max-w-xl sm:text-6xl">
              Prepare Development Cockpit
            </h1>
            <p className="mt-5 max-w-[22rem] text-lg leading-[1.45] text-[var(--muted)] sm:text-xl">
              Создайте проект из идеи
              <br />и получите структуру разработки.
            </p>

            <div className="mt-8 flex w-full max-w-[24.75rem] flex-col items-stretch justify-center gap-4">
              <Button
                className="min-h-14 w-full rounded-xl px-7 text-base shadow-lg shadow-emerald-900/15 sm:text-lg"
                href="/app/projects/new"
              >
                Создать проект
              </Button>
              <details className="group w-full">
                <summary className="inline-flex h-14 w-full cursor-pointer list-none items-center justify-center gap-3 rounded-xl border border-[var(--accent)] bg-transparent px-7 text-base font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--soft-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:text-lg [&::-webkit-details-marker]:hidden">
                  <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-current text-xs sm:h-6 sm:w-6 sm:text-sm">
                    i
                  </span>
                  <span>Информация</span>
                </summary>
                <div className="mx-auto mt-5 max-w-md rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-left shadow-sm">
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

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {artifactChips.map((chip) => (
                <span
                  className="rounded-full bg-[var(--section-surface)] px-4 py-2 text-sm font-medium text-[var(--muted)]"
                  key={chip}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
