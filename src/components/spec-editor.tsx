"use client";

import { useMemo, useState, useTransition } from "react";

import type { StoredSpecView } from "@/lib/spec/types";

type SpecEditorProps = {
  saveAction: (formData: FormData) => void;
  spec: StoredSpecView;
};

export function SpecEditor({ saveAction, spec }: SpecEditorProps) {
  const [text, setText] = useState(spec.markdown);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sections = useMemo(() => parseSpecText(text), [text]);
  const isDirty = text.trim() !== spec.markdown.trim();

  return (
    <form
      action={(formData) => {
        if (!isDirty) {
          return;
        }

        startTransition(() => saveAction(formData));
      }}
      className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-5"
    >
      <input name="markdown" type="hidden" value={text} />

      <div className="flex flex-col gap-4 border-b border-[var(--line-soft)] px-1 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Спецификация</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Редактируйте содержание спецификации. Изменения можно сохранить как
            новую версию.
          </p>
          <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
            {spec.currentVersion ? `Текущая версия: v${spec.currentVersion}` : "Версия ещё не выбрана"}
            {" · "}
            Обновлено: {formatDate(spec.updatedAt)}
            {isDirty ? " · Есть несохранённые изменения" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
                disabled={isPending}
                onClick={() => {
                  setText(spec.markdown);
                  setIsEditing(false);
                }}
                type="button"
              >
                Отменить
              </button>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={!isDirty || isPending}
                type="submit"
              >
                {isPending ? "Сохраняем..." : "Сохранить"}
              </button>
            </>
          ) : (
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              onClick={() => setIsEditing(true)}
              type="button"
            >
              Редактировать
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-[var(--panel-border)] bg-white p-4">
          <h3 className="text-sm font-semibold">Структура спецификации</h3>
          <nav aria-label="Структура спецификации" className="mt-4">
            <ol className="grid gap-1">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--section-surface)]"
                    href={`#${section.id}`}
                  >
                    <span className="text-xs font-semibold text-[var(--muted)]">
                      {index + 1}.
                    </span>
                    <span className="truncate">{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <section className="min-w-0 rounded-lg border border-[var(--panel-border)] bg-white p-4">
          <h3 className="text-sm font-semibold">Содержание спецификации</h3>
          {isEditing ? (
            <label className="mt-4 block">
              <span className="sr-only">Текст спецификации</span>
              <textarea
                className="min-h-[560px] w-full resize-y rounded-md border border-[var(--panel-border)] bg-[var(--background)] p-4 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                onChange={(event) => setText(event.target.value)}
                value={text}
              />
            </label>
          ) : (
            <div className="mt-4 grid max-h-[720px] gap-5 overflow-auto pr-1">
              {sections.map((section) => (
                <article className="scroll-mt-6" id={section.id} key={section.id}>
                  <h4 className="text-lg font-semibold">{section.title}</h4>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
                    {section.body || "Раздел пока не заполнен."}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {spec.versions.length > 0 ? (
        <details className="mt-5 rounded-lg border border-[var(--panel-border)] bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">
            История версий
          </summary>
          <div className="mt-4 grid gap-2">
            {spec.versions.map((version) => (
              <div
                className="flex items-center justify-between rounded-md bg-[var(--section-surface)] px-3 py-2 text-sm"
                key={version.id}
              >
                <span className="font-semibold">Версия {version.version}</span>
                <span className="text-[var(--muted)]">
                  {formatDate(version.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </form>
  );
}

function parseSpecText(value: string) {
  const chunks = value.split(/\n(?=## )/);
  const sections = chunks
    .map((chunk, index) => {
      const [heading = "", ...bodyLines] = chunk.split("\n");
      const title = heading.replace(/^#+\s+/, "").trim() || "Содержание";

      return {
        body: bodyLines.join("\n").trim(),
        id: `spec-section-${index + 1}-${slugify(title)}`,
        title,
      };
    })
    .filter((section) => section.title || section.body);

  return sections.length > 0
    ? sections
    : [{ body: value, id: "spec-section-1-content", title: "Содержание" }];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
