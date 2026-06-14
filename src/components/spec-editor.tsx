"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { DetailsDisclosure } from "@/components/ui/patterns";
import type { StoredSpecView } from "@/lib/spec/types";

type SpecEditorProps = {
  projectId: string;
  saveAction: (formData: FormData) => void;
  spec: StoredSpecView;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function SpecEditor({ projectId, saveAction, spec }: SpecEditorProps) {
  const [markdown, setMarkdown] = useState(spec.markdown);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isPending, startTransition] = useTransition();
  const previewSections = useMemo(() => parseMarkdown(markdown), [markdown]);

  useEffect(() => {
    if (markdown === spec.markdown) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/spec/autosave`,
          {
            body: JSON.stringify({ markdown }),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
          },
        );

        setSaveState(response.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [markdown, projectId, spec.markdown]);

  return (
    <form
      action={(formData) => {
        startTransition(() => saveAction(formData));
      }}
      className="grid gap-6"
    >
      <input name="markdown" type="hidden" value={markdown} />

      <section className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Редактор spec</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Отредактируйте Markdown и сохраните версию.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`min-h-10 rounded-md border px-4 text-sm font-semibold ${
                activeTab === "edit"
                  ? "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                  : "border-[var(--panel-border)] text-[var(--muted)]"
              }`}
              onClick={() => setActiveTab("edit")}
              type="button"
            >
              Редактировать
            </button>
            <button
              className={`min-h-10 rounded-md border px-4 text-sm font-semibold ${
                activeTab === "preview"
                  ? "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                  : "border-[var(--panel-border)] text-[var(--muted)]"
              }`}
              onClick={() => setActiveTab("preview")}
              type="button"
            >
              Preview
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Сохранение..." : "Сохранить версию"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[var(--section-surface)] px-3 py-1 text-[var(--muted)]">
            Текущая версия: {spec.currentVersion ? `v${spec.currentVersion}` : "нет"}
          </span>
          <span className="rounded-full bg-[var(--section-surface)] px-3 py-1 text-[var(--muted)]">
            Autosave: {formatSaveState(saveState)}
          </span>
          <span className="rounded-full bg-[var(--section-surface)] px-3 py-1 text-[var(--muted)]">
            Обновлено: {formatDate(spec.updatedAt)}
          </span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div
          className={
            activeTab === "edit"
              ? "rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
              : "hidden lg:block rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
          }
        >
          <label className="text-sm font-semibold">Markdown</label>
          <textarea
            className="mt-3 min-h-[440px] w-full resize-y rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-4 font-mono text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)] lg:min-h-[560px]"
            onChange={(event) => {
              setMarkdown(event.target.value);
              setSaveState("saving");
            }}
            value={markdown}
          />
        </div>

        <div
          className={
            activeTab === "preview"
              ? "rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
              : "hidden lg:block rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
          }
        >
          <h3 className="text-sm font-semibold">Markdown preview</h3>
          <div className="mt-4 grid max-h-[680px] gap-4 overflow-auto">
            {previewSections.map((section) => (
              <article
                className="rounded-md bg-[var(--section-surface)] p-4"
                key={section.title}
              >
                <h4 className="text-lg font-semibold">{section.title}</h4>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                  {section.body}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <DetailsDisclosure title="История версий">
          <div className="grid gap-2">
            {spec.versions.length > 0 ? (
              spec.versions.map((version) => (
                <div
                  className="flex items-center justify-between rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm"
                  key={version.id}
                >
                  <span className="font-semibold">v{version.version}</span>
                  <span className="text-[var(--muted)]">
                    {formatDate(version.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Версии ещё не сохранены.
              </p>
            )}
          </div>
        </DetailsDisclosure>

        <DetailsDisclosure title="Будущие действия с секциями">
          <div className="grid gap-2 sm:grid-cols-3">
            {["Улучшить секцию", "Перегенерировать секцию", "Добавить детали"].map(
              (action) => (
                <button
                  className="min-h-10 cursor-not-allowed rounded-md border border-[var(--panel-border)] px-3 text-sm font-semibold text-[var(--muted)] opacity-65"
                  disabled
                  key={action}
                  type="button"
                >
                  {action}
                </button>
              ),
            )}
          </div>
        </DetailsDisclosure>
      </section>
    </form>
  );
}

function parseMarkdown(markdown: string) {
  const chunks = markdown.split(/\n(?=## )/);
  const sections = chunks
    .map((chunk) => {
      const [heading = "", ...bodyLines] = chunk.split("\n");
      const title = heading.replace(/^#+\s+/, "").trim();

      return {
        body: bodyLines.join("\n").trim(),
        title,
      };
    })
    .filter((section) => section.title);

  return sections.length > 0
    ? sections
    : [{ body: markdown, title: "Preview" }];
}

function formatSaveState(state: SaveState) {
  if (state === "saving") {
    return "сохраняется";
  }

  if (state === "saved") {
    return "сохранено";
  }

  if (state === "error") {
    return "ошибка";
  }

  return "ожидание";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
