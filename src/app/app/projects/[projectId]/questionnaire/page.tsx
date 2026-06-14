import Link from "next/link";
import { notFound } from "next/navigation";

import { completeQuestionnaireAction } from "@/app/app/projects/[projectId]/questionnaire/actions";
import { QuestionnaireWizard } from "@/components/questionnaire-wizard";
import { getOrCreateQuestionnaireWorkspace } from "@/lib/questionnaire/questionnaire-store";

export const dynamic = "force-dynamic";

type QuestionnairePageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ questionnaire?: string | string[] }>;
};

export default async function QuestionnairePage({
  params,
  searchParams,
}: QuestionnairePageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const state = Array.isArray(query.questionnaire)
    ? query.questionnaire[0]
    : query.questionnaire;
  const result = await getOrCreateQuestionnaireWorkspace(projectId);

  if (!result.databaseReady) {
    return (
      <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <BackLink projectId={projectId} />
          <div className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6">
            <h1 className="text-2xl font-semibold">Нужно настроить базу данных</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {result.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!result.data) {
    notFound();
  }

  const { project, session } = result.data;
  const submitAction = completeQuestionnaireAction.bind(
    null,
    project.id,
    session.id,
  );

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <BackLink projectId={project.id} />

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            Анкета
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{project.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Вопросы подбираются из intake-контекста и результата
                классификации. Ответы сохраняются структурно для будущей
                генерации спецификации.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              {session.status === "completed" ? "Завершена" : "В процессе"}
            </span>
          </div>
        </header>

        {state ? (
          <div
            className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
              state === "completed"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {state === "completed"
              ? "Анкета завершена, ответы сохранены."
              : getQuestionnaireErrorMessage(state)}
          </div>
        ) : null}

        <section className="mt-6">
          <QuestionnaireWizard action={submitAction} session={session} />
        </section>

        {session.status === "completed" ? (
          <section className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Сохранённые ответы</h2>
            <div className="mt-5 grid gap-4">
              {session.questions.map((question) => (
                <article
                  className="rounded-md bg-[var(--section-surface)] p-4"
                  key={question.id}
                >
                  <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                    {question.block}
                  </p>
                  <h3 className="mt-2 text-sm font-semibold">
                    {question.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {formatAnswer(question.answer)}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function BackLink({ projectId }: { projectId: string }) {
  return (
    <Link
      className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
      href={`/app/projects/${projectId}`}
    >
      Назад к проекту
    </Link>
  );
}

function formatAnswer(answer: boolean | string | string[] | null) {
  if (Array.isArray(answer)) {
    return answer.length > 0
      ? answer.map(localizeAnswerValue).join(", ")
      : "Ответ не сохранён";
  }

  if (typeof answer === "boolean") {
    return answer ? "Да" : "Нет";
  }

  return answer ? localizeAnswerValue(answer) : "Ответ не сохранён";
}

function localizeAnswerValue(value: string) {
  const labels: Record<string, string> = {
    Custom: "Настраиваемый QA",
    Minimal: "Минимальный QA",
    No: "Нет",
    Off: "Без QA",
    Standard: "Стандартный QA",
    Strict: "Строгий QA",
    Unknown: "Неизвестно",
    Yes: "Да",
  };

  return labels[value] ?? value;
}

function getQuestionnaireErrorMessage(reason: string) {
  if (reason === "database") {
    return "Анкету не удалось сохранить: база данных не настроена или недоступна.";
  }

  if (reason === "not_found") {
    return "Сессия анкеты не найдена.";
  }

  return "Ответы анкеты не удалось сохранить. Проверьте контекст и повторите попытку.";
}
