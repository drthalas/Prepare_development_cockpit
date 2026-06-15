import Link from "next/link";

import { ProjectIntakeWizard } from "@/components/project-intake-wizard";
import { InfoNotice, PageHeader, PageShell } from "@/components/ui/patterns";

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
      className="max-w-[940px]"
      maxWidth="none"
      surface="background"
    >
      <Link
        className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
        href="/"
      >
        ← Назад на главную
      </Link>

      <section className="pt-8 sm:pt-10">
        <PageHeader
          description="Опишите идею продукта. Мы соберём данные для спецификации, roadmap и задач."
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

        <div className="mt-7">
          <ProjectIntakeWizard />
        </div>
      </section>
    </PageShell>
  );
}
