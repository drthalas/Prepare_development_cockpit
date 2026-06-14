import Link from "next/link";

import { ProjectIntakeWizard } from "@/components/project-intake-wizard";
import {
  DetailsDisclosure,
  InfoNotice,
  PageHeader,
} from "@/components/ui/patterns";

export const dynamic = "force-dynamic";

type NewProjectPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

const setupSteps = [
  "Опишите идею и аудиторию.",
  "Укажите GitHub, деплой и инструмент разработки.",
  "Создайте проект и откройте следующий шаг.",
];

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-4xl px-5 py-6 sm:px-8 lg:px-10">
        <Link
          className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
          href="/"
        >
          На главную
        </Link>

        <div className="mt-6">
          <PageHeader
            description="Опишите идею продукта. Мы соберём данные для спецификации, roadmap и задач."
            eyebrow="Новый проект"
            title="Мастер создания проекта"
          />
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

        <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
          <ProjectIntakeWizard />
        </section>

        <div className="mt-4">
          <DetailsDisclosure title="Как это работает">
            <ol className="grid gap-2">
              {setupSteps.map((step, index) => (
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
      </div>
    </main>
  );
}
