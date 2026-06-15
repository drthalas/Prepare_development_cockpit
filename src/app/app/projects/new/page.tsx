import Link from "next/link";
import Image from "next/image";

import { ProjectIntakeWizard } from "@/components/project-intake-wizard";
import { InfoNotice } from "@/components/ui/patterns";

export const dynamic = "force-dynamic";

type NewProjectPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

const infoSteps = [
  "Опишите идею и аудиторию.",
  "Укажите контекст GitHub, деплоя и разработки.",
  "Создайте проект и продолжите со следующим шагом.",
];

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <main className="min-h-screen bg-[var(--background)] p-4 text-[var(--foreground)] sm:p-8">
      <div className="mx-auto min-h-[calc(100svh-2rem)] w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-[var(--panel-border)] bg-[rgba(255,255,255,0.78)] shadow-[0_24px_70px_rgba(23,32,38,0.08)] sm:min-h-[calc(100svh-4rem)] sm:rounded-[2rem]">
        <header className="flex h-16 items-center justify-between border-b border-[var(--panel-border)] px-5 sm:h-[4.5rem] sm:px-8">
          <Link aria-label="На главную" className="flex items-center" href="/">
            <Image
              alt="Nikolaev Solutions AI Lab"
              className="h-9 w-auto object-contain mix-blend-multiply sm:h-10"
              height={260}
              priority
              src="/brand/nikolaev-solutions-ai-lab-header.png"
              width={540}
            />
          </Link>
          <details className="group relative">
            <summary className="inline-flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] [&::-webkit-details-marker]:hidden">
              <span className="grid h-5 w-5 place-items-center rounded-full border border-current text-xs">
                i
              </span>
              <span className="hidden sm:inline">Информация</span>
            </summary>
            <div className="absolute right-0 z-20 mt-3 w-72 rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--muted)] shadow-xl">
              <p className="font-semibold text-[var(--foreground)]">
                Как это работает
              </p>
              <ol className="mt-2 grid gap-1">
                {infoSteps.map((step, index) => (
                  <li key={step}>
                    <span className="font-semibold text-[var(--accent-strong)]">
                      {index + 1}.
                    </span>{" "}
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </details>
        </header>

        <section className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 sm:py-9">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold leading-tight text-[var(--foreground)] sm:text-4xl">
              Мастер создания проекта
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              Опишите идею продукта. Мы соберём данные для спецификации, roadmap
              и задач.
            </p>
          </div>

        {error ? (
          <div className="mt-6">
            <InfoNotice tone="warning">
              {error === "validation"
                ? "Название проекта и описание идеи обязательны."
                : "Проект не удалось сохранить. Проверьте подключение базы данных и попробуйте ещё раз."}
            </InfoNotice>
          </div>
        ) : null}

          <div className="mt-7 rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-sm sm:p-8">
            <ProjectIntakeWizard />
          </div>
        </section>
      </div>
    </main>
  );
}
