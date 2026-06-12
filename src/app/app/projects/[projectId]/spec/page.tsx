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
            <h1 className="text-2xl font-semibold">Database setup required</h1>
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
                Editable spec
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{project.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Generate and edit the first specification from intake,
                classification, and questionnaire answers. Check readiness
                before roadmap planning and capture clarifications without
                generating roadmap artifacts.
              </p>
            </div>
            <form action={generateAction}>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                type="submit"
              >
                Generate spec
              </button>
            </form>
          </div>
        </header>

        {!project.questionnaireCompleted ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-[var(--soft-warning)] p-4 text-sm font-medium text-amber-900">
            Questionnaire is not completed. You can generate from available
            data, but the spec may be incomplete.
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
              ? `Spec generated and saved${mode ? ` in ${mode} mode` : ""}.`
              : state === "saved"
                ? `Spec version saved${firstQueryValue(query.version) ? ` as v${firstQueryValue(query.version)}` : ""}.`
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
              ? "Spec quality check saved."
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
              ? `Clarification applied${firstQueryValue(query.version) ? ` and saved as v${firstQueryValue(query.version)}` : ""}.`
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
              <h2 className="text-xl font-semibold">Spec status</h2>
              <dl className="mt-5 grid gap-4">
                <SpecMeta
                  label="Current version"
                  value={spec.currentVersion ? `v${spec.currentVersion}` : "Not set"}
                />
                <SpecMeta label="Mode" value={spec.mode} />
                <SpecMeta label="Last updated" value={formatDate(spec.updatedAt)} />
                <SpecMeta
                  label="Sections"
                  value={`${spec.sections.length} structured sections`}
                />
              </dl>

              <h3 className="mt-6 text-sm font-semibold">Sections summary</h3>
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
            <h2 className="text-xl font-semibold">No spec generated yet</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Generate the first spec from saved project context. The generated
              result will be stored as current markdown and version 1.
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
            Readiness check
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Spec quality and missing information
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Run a pre-roadmap readiness check for missing information, vague
            requirements, risks, and recommended follow-up questions. This does
            not create roadmap or task artifacts.
          </p>
        </div>
        <form action={qualityAction}>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            Run quality check
          </button>
        </form>
      </div>

      {qualityCheck ? (
        <div className="mt-5 grid gap-5">
          <div className="grid gap-4 md:grid-cols-4">
            <SpecMeta
              label="Readiness score"
              value={`${qualityCheck.readinessScore}/100`}
            />
            <SpecMeta
              label="Readiness level"
              value={capitalize(qualityCheck.readinessLevel)}
            />
            <SpecMeta
              label="Roadmap readiness"
              value={
                qualityCheck.canProceedToRoadmap
                  ? "Can proceed"
                  : "Should improve"
              }
            />
            <SpecMeta
              label="Mode"
              value={
                qualityCheck.mode === "mock" ? "Mock mode" : "Configured provider"
              }
            />
          </div>

          <p className="rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
            {qualityCheck.summary}
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <QualityList
              emptyLabel="No missing information detected."
              items={qualityCheck.missingInformation}
              title="Missing information"
            />
            <QualityList
              emptyLabel="No vague requirements detected."
              items={qualityCheck.vagueRequirements}
              title="Vague requirements"
            />
            <QualityList
              emptyLabel="No risk areas detected."
              items={qualityCheck.riskAreas}
              title="Risk areas"
            />
            <QualityList
              emptyLabel="No follow-up questions recommended."
              items={qualityCheck.recommendedFollowUpQuestions}
              title="Recommended follow-up questions"
            />
          </div>

          <form action={applyClarificationAction} className="grid gap-3">
            <label className="text-sm font-semibold" htmlFor="clarification">
              Add clarification
            </label>
            <textarea
              className="min-h-32 w-full resize-y rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              id="clarification"
              name="clarification"
              placeholder="Add a short answer to one of the follow-up questions. It will be appended to the spec and saved as a new version."
              required
            />
            <button
              className="w-fit min-h-10 rounded-md border border-[var(--accent)] bg-[var(--soft-accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)]"
              type="submit"
            >
              Apply clarification
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-5 rounded-md bg-[var(--section-surface)] px-3 py-3 text-sm text-[var(--muted)]">
          No quality check has been saved yet.
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
      Back to project
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
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getSpecErrorMessage(reason: string) {
  if (reason === "database") {
    return "Spec could not be saved because the database is not configured or reachable.";
  }

  if (reason === "not_found") {
    return "Project was not found.";
  }

  return "Spec generation failed. Check AI provider settings or use mock mode.";
}

function getQualityErrorMessage(reason: string) {
  if (reason === "database") {
    return "Quality check could not run because the database is not configured or reachable.";
  }

  if (reason === "not_found") {
    return "Generate a spec before running a quality check.";
  }

  return "Quality check failed. Check AI provider settings or use mock mode.";
}

function getClarificationErrorMessage(reason: string) {
  if (reason === "validation") {
    return "Clarification text is required.";
  }

  if (reason === "database") {
    return "Clarification could not be saved because the database is not configured or reachable.";
  }

  return "Spec was not found. Generate a spec before adding clarifications.";
}
