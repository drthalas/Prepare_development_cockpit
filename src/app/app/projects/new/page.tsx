import Link from "next/link";

import { ProjectIntakeWizard } from "@/components/project-intake-wizard";
import { InfoNotice } from "@/components/ui/patterns";

export const dynamic = "force-dynamic";

type NewProjectPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-6 text-[var(--foreground)] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[940px]">
        <Link
          className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
          href="/"
        >
          ← Назад на главную
        </Link>

        <section className="pt-8 sm:pt-10">
          <header className="text-center">
            <h1 className="text-3xl font-extrabold leading-tight text-[var(--foreground)] sm:text-4xl">
              Мастер создания проекта
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              Опишите идею продукта. Мы соберём данные для спецификации, roadmap
              и задач.
            </p>
          </header>

          {error ? (
            <div className="mt-6">
              <InfoNotice tone="warning">
                {error === "validation"
                  ? "Название проекта и описание идеи обязательны."
                  : "Проект не удалось сохранить. Проверьте подключение базы данных и попробуйте ещё раз."}
              </InfoNotice>
            </div>
          ) : null}

          <div className="mt-7">
            <ProjectIntakeWizard />
          </div>
        </section>
      </div>
    </main>
  );
}
