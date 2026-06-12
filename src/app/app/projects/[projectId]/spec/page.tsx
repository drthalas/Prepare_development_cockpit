import Link from "next/link";
import { notFound } from "next/navigation";

import {
  generateSpecAction,
  saveSpecVersionAction,
} from "@/app/app/projects/[projectId]/spec/actions";
import { SpecEditor } from "@/components/spec-editor";
import { getProjectSpecWorkspace } from "@/lib/spec/spec-store";

export const dynamic = "force-dynamic";

type SpecPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    mode?: string | string[];
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
  const saveVersionAction = saveSpecVersionAction.bind(null, project.id);

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
                classification, and questionnaire answers. Quality checks are
                handled in the next Phase 3 task.
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

        {spec ? (
          <div className="mt-6 grid gap-6">
            <SpecEditor
              projectId={project.id}
              saveAction={saveVersionAction}
              spec={spec}
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

function getSpecErrorMessage(reason: string) {
  if (reason === "database") {
    return "Spec could not be saved because the database is not configured or reachable.";
  }

  if (reason === "not_found") {
    return "Project was not found.";
  }

  return "Spec generation failed. Check AI provider settings or use mock mode.";
}
