import Link from "next/link";
import { notFound } from "next/navigation";

import {
  applySpecClarificationAction,
  generateSpecAction,
  runSpecQualityCheckAction,
  saveSpecVersionAction,
} from "@/app/app/projects/[projectId]/spec/actions";
import { SpecEditor } from "@/components/spec-editor";
import type { SpecQualityCheckResult } from "@/lib/spec/quality-types";
import { getProjectSpecWorkspace } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

type SpecPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    clarification?: string | string[];
    mode?: string | string[];
    quality?: string | string[];
    spec?: string | string[];
    version?: string | string[];
  }>;
};

export default async function SpecPage({ params, searchParams }: SpecPageProps) {
  const { projectId } = await params;
  const query = await searchParams;
  const state = firstQueryValue(query.spec);
  const mode = firstQueryValue(query.mode);
  const result = await getProjectSpecWorkspace(projectId);

  if (!result.databaseReady) {
    return (
      <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
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

  const { project, spec } = result.data;
  const generateAction = generateSpecAction.bind(null, project.id);
  const qualityAction = runSpecQualityCheckAction.bind(null, project.id);
  const clarificationAction = applySpecClarificationAction.bind(
    null,
    project.id,
  );
  const saveVersionAction = saveSpecVersionAction.bind(null, project.id);
  const qualityState = firstQueryValue(query.quality);
  const clarificationState = firstQueryValue(query.clarification);

  return (
    <main className="min-h-screen bg-[var(--workspace-bg)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <BackLink projectId={project.id} />

        <header className="mt-6 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
                Редактируемая спецификация
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{project.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Сгенерируйте и отредактируйте спецификацию из intake,
                классификации и ответов анкеты. Перед roadmap проверьте
                полноту и добавьте уточнения.
              </p>
            </div>
            <form action={generateAction}>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                Сгенерировать спецификацию
              </button>
            </form>
          </div>
        </header>

        {!project.questionnaireCompleted ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-[var(--soft-warning)] p-4 text-sm font-medium text-amber-900">
            Анкета ещё не завершена. Можно сгенерировать spec из доступных
            данных, но она может быть неполной.
          </div>
        ) : null}

        {state ? (
          <div
            className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
              state === "generated"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {state === "generated"
              ? `Спецификация сгенерирована и сохранена${mode ? ` в режиме ${mode}` : ""}.`
              : state === "saved"
                ? `Версия спецификации сохранена${firstQueryValue(query.version) ? ` как v${firstQueryValue(query.version)}` : ""}.`
              : getSpecErrorMessage(state)}
          </div>
        ) : null}

        {qualityState ? (
          <div
            className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
              qualityState === "checked"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {qualityState === "checked"
              ? "Проверка качества spec сохранена."
              : getQualityErrorMessage(qualityState)}
          </div>
        ) : null}

        {clarificationState ? (
          <div
            className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
              clarificationState === "applied"
                ? "border-[var(--panel-border)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                : "border-amber-200 bg-[var(--soft-warning)] text-amber-900"
            }`}
          >
            {clarificationState === "applied"
              ? `Уточнение применено${firstQueryValue(query.version) ? ` и сохранено как v${firstQueryValue(query.version)}` : ""}.`
              : getClarificationErrorMessage(clarificationState)}
          </div>
        ) : null}

        {spec ? (
          <div className="mt-6 grid gap-6">
            <SpecEditor
              projectId={project.id}
              saveAction={saveVersionAction}
              spec={spec}
            />
            <SpecQualityPanel
              applyClarificationAction={clarificationAction}
              qualityAction={qualityAction}
              qualityCheck={spec.qualityCheck}
            />
            <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Статус спецификации</h2>
              <dl className="mt-5 grid gap-4">
                <SpecMeta
                  label="Текущая версия"
                  value={spec.currentVersion ? `v${spec.currentVersion}` : "Не выбрано"}
                />
                <SpecMeta label="Режим" value={spec.mode} />
                <SpecMeta label="Обновлено" value={formatDate(spec.updatedAt)} />
                <SpecMeta
                  label="Секции"
                  value={`${spec.sections.length} структурных секций`}
                />
              </dl>

              <h3 className="mt-6 text-sm font-semibold">Секции spec</h3>
              <div className="mt-3 grid gap-2">
                {spec.sections.map((section) => (
                  <a
                    className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
                    href={`#${section.id}`}
                    key={section.id}
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="mt-6 rounded-lg border border-dashed border-[var(--panel-border)] bg-[var(--panel)] p-8 text-center">
            <h2 className="text-xl font-semibold">Спецификация ещё не создана</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Сначала пройдите анкету, затем нажмите “Сгенерировать
              спецификацию”. Результат сохранится как текущий Markdown и
              версия 1.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function SpecQualityPanel({
  applyClarificationAction,
  qualityAction,
  qualityCheck,
}: {
  applyClarificationAction: (formData: FormData) => void;
  qualityAction: () => void;
  qualityCheck: SpecQualityCheckResult | null;
}) {
  return (
    <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            Проверка готовности
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Качество spec и недостающая информация
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Запустите проверку перед roadmap: недостающая информация, размытые
            требования, риски и уточняющие вопросы. Roadmap и tasks здесь не
            создаются.
          </p>
        </div>
        <form action={qualityAction}>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            Проверить spec
          </button>
        </form>
      </div>

      {qualityCheck ? (
        <div className="mt-5 grid gap-5">
          <div className="grid gap-4 md:grid-cols-4">
            <SpecMeta
              label="Готовность"
              value={`${qualityCheck.readinessScore}/100`}
            />
            <SpecMeta
              label="Уровень"
              value={formatReadinessLevel(qualityCheck.readinessLevel)}
            />
            <SpecMeta
              label="Roadmap readiness"
              value={
                qualityCheck.canProceedToRoadmap
                  ? "Можно продолжать"
                  : "Лучше улучшить"
              }
            />
            <SpecMeta
              label="Режим"
              value={
                qualityCheck.mode === "mock" ? "Mock mode" : "Настроенный provider"
              }
            />
          </div>

          <p className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
            {qualityCheck.summary}
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <QualityList
              emptyLabel="Недостающая информация не найдена."
              items={qualityCheck.missingInformation}
              title="Недостающая информация"
            />
            <QualityList
              emptyLabel="Размытые требования не найдены."
              items={qualityCheck.vagueRequirements}
              title="Размытые требования"
            />
            <QualityList
              emptyLabel="Риски не найдены."
              items={qualityCheck.riskAreas}
              title="Риски"
            />
            <QualityList
              emptyLabel="Уточняющие вопросы не предложены."
              items={qualityCheck.recommendedFollowUpQuestions}
              title="Рекомендуемые уточняющие вопросы"
            />
          </div>

          <form action={applyClarificationAction} className="grid gap-3">
            <label className="text-sm font-semibold" htmlFor="clarification">
              Добавить уточнение
            </label>
            <textarea
              className="min-h-32 w-full resize-y rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              id="clarification"
              name="clarification"
              placeholder="Добавьте короткий ответ на один из уточняющих вопросов. Он будет добавлен в spec и сохранён новой версией."
              required
            />
            <button
              className="w-fit min-h-10 rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
              type="submit"
            >
              Применить уточнение
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-5 rounded-md bg-[var(--section-surface)] px-3 py-3 text-sm text-[var(--muted)]">
          Проверка качества ещё не запускалась.
        </div>
      )}
    </section>
  );
}

function QualityList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: string[];
  title: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {items.map((item) => (
            <li
              className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)]"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm text-[var(--muted)]">
          {emptyLabel}
        </p>
      )}
    </div>
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

function SpecMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function firstQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatReadinessLevel(value: string) {
  const labels: Record<string, string> = {
    high: "Высокий",
    low: "Низкий",
    medium: "Средний",
  };

  return labels[value] ?? value;
}

function getSpecErrorMessage(reason: string) {
  if (reason === "database") {
    return "Spec не удалось сохранить: база данных не настроена или недоступна.";
  }

  if (reason === "not_found") {
    return "Проект не найден.";
  }

  return "Генерация spec не удалась. Проверьте AI provider или используйте mock mode.";
}

function getQualityErrorMessage(reason: string) {
  if (reason === "database") {
    return "Проверку качества не удалось запустить: база данных не настроена или недоступна.";
  }

  if (reason === "not_found") {
    return "Сначала сгенерируйте spec, затем запускайте проверку.";
  }

  return "Проверка качества не удалась. Проверьте AI provider или используйте mock mode.";
}

function getClarificationErrorMessage(reason: string) {
  if (reason === "validation") {
    return "Текст уточнения обязателен.";
  }

  if (reason === "database") {
    return "Уточнение не удалось сохранить: база данных не настроена или недоступна.";
  }

  return "Spec не найдена. Сначала сгенерируйте spec, затем добавляйте уточнения.";
}
