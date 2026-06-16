import Link from "next/link";

import { ProjectIntakeWizard } from "@/components/project-intake-wizard";
import {
  DetailsDisclosure,
  InfoNotice,
  PageHeader,
  PageShell,
} from "@/components/ui/patterns";

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
    <PageShell
      className="max-w-[900px] pb-10"
      maxWidth="none"
      surface="background"
    >
      <Link
        className="inline-flex text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
        href="/"
      >
        ← Назад на главную
      </Link>

      <section className="pt-6 sm:pt-8">
        <PageHeader
          description="Опишите идею продукта. Мы соберём данные для спецификации, дорожной карты и задач."
          title="Мастер создания проекта"
          variant="plain"
        />

        {error ? (
          <div className="mt-6">
            <InfoNotice tone="warning">
              {error === "validation"
                ? "Название проекта и описание идеи обязательны."
                : "Проект не удалось сохранить. Проверьте подключение базы данных и попробуйте ещё раз."}
            </InfoNotice>
          </div>
        ) : null}

        <div className="mt-5">
          <DetailsDisclosure title="Как это работает">
            <ol className="grid gap-1">
              <li>1. Опишите идею и аудиторию.</li>
              <li>2. Укажите репозиторий, деплой и инструмент реализации.</li>
              <li>3. Создайте проект и перейдите к следующему шагу.</li>
            </ol>
          </DetailsDisclosure>
        </div>

        <div className="mt-5">
          <ProjectIntakeWizard />
        </div>
      </section>
    </PageShell>
  );
}
