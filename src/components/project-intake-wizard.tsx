"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { createProjectAction } from "@/app/app/projects/actions";
import {
  deploymentTargetLabels,
  deploymentTargets,
  executionTargetLabels,
  executionTargets,
  qaModeLabels,
  qaModes,
} from "@/lib/projects/project-options";

const wizardSteps = [
  { title: "Идея", value: "Название, идея и аудитория" },
  { title: "Контекст", value: "GitHub, деплой и окружение" },
  { title: "Настройки", value: "Инструмент и QA" },
];

export function ProjectIntakeWizard() {
  return (
    <form
      action={createProjectAction}
      className="grid gap-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-3 gap-2 border-b border-[var(--panel-border)] pb-4">
        {wizardSteps.map((step, index) => (
          <StepIndicator
            index={index}
            key={step.title}
            title={step.title}
            value={step.value}
          />
        ))}
      </div>

      <div className="grid gap-1">
        <Field icon="edit" label="Название проекта">
          <input
            className={inputClassName}
            name="title"
            placeholder="Введите название проекта"
            required
          />
        </Field>

        <Field icon="idea" label="Идея продукта">
          <textarea
            className={`${inputClassName} min-h-24 resize-y py-3`}
            name="initialIdea"
            placeholder="Ключевая ценность и основные функции"
            required
          />
        </Field>

        <Field icon="users" label="Аудитория">
          <textarea
            className={`${inputClassName} min-h-16 resize-y py-3`}
            name="targetUser"
            placeholder="Кто будет пользоваться продуктом"
          />
        </Field>

        <Field icon="code" label="GitHub / репозиторий">
          <input
            className={inputClassName}
            name="repositoryUrl"
            placeholder="https://github.com/owner/repo"
            type="url"
          />
        </Field>

        <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
          <Field icon="cloud" label="Деплой">
            <select
              className={inputClassName}
              defaultValue="railway"
              name="deploymentTarget"
              required
            >
              {deploymentTargets.map((target) => (
                <option key={target} value={target}>
                  {deploymentTargetLabels[target]}
                </option>
              ))}
            </select>
          </Field>

          <Field icon="target" label="Инструмент реализации">
            <select
              className={inputClassName}
              defaultValue="codex"
              name="executionTarget"
              required
            >
              {executionTargets.map((target) => (
                <option key={target} value={target}>
                  {executionTargetLabels[target]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field icon="shield" label="QA-проверка">
          <select className={inputClassName} defaultValue="standard" name="qaPreference">
            {qaModes.map((mode) => (
              <option key={mode} value={mode}>
                {qaModeLabels[mode]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <input name="projectType" type="hidden" value="" />
      <input name="repositoryMode" type="hidden" value="undecided" />
      <input name="repositoryVisibility" type="hidden" value="unknown" />
      <input name="repositoryOwner" type="hidden" value="not_decided" />
      <input name="agentCanPush" type="hidden" value="unknown" />
      <input name="defaultBranch" type="hidden" value="" />
      <input name="deploymentMode" type="hidden" value="manual_instructions" />
      <input name="deploymentOwner" type="hidden" value="not_decided" />

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
          href="/"
        >
          Отмена
        </Link>
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--accent)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[var(--accent-strong)] sm:min-w-64"
          type="submit"
        >
          Создать проект
        </button>
      </div>
    </form>
  );
}

function StepIndicator({
  index,
  title,
  value,
}: {
  index: number;
  title: string;
  value: string;
}) {
  return (
    <div className="grid justify-items-center gap-1 text-center">
      <span
        className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${
          index === 0
            ? "bg-[var(--accent)] text-white"
            : "bg-[var(--section-surface)] text-[var(--muted)]"
        }`}
      >
        {index + 1}
      </span>
      <span
        className={`text-xs font-semibold ${
          index === 0 ? "text-[var(--accent-strong)]" : "text-[var(--muted)]"
        }`}
      >
        {title}
      </span>
      <span className="hidden max-w-32 text-xs leading-4 text-[var(--muted)] sm:block">
        {value}
      </span>
    </div>
  );
}

type FieldIconName =
  | "cloud"
  | "code"
  | "edit"
  | "idea"
  | "shield"
  | "target"
  | "users";

function Field({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: FieldIconName;
  label: string;
}) {
  return (
    <label className="grid gap-2 border-b border-[var(--panel-border)] py-3 text-sm font-semibold last:border-b-0">
      <span className="flex items-center gap-2 text-[var(--foreground)]">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--section-surface)] text-[var(--muted)]">
          <FieldIcon name={icon} />
        </span>
        {label}
      </span>
      {children}
    </label>
  );
}

function FieldIcon({ name }: { name: FieldIconName }) {
  const common = {
    "aria-hidden": true,
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }

  if (name === "idea") {
    return (
      <svg {...common}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "code") {
    return (
      <svg {...common}>
        <path d="m16 18 6-6-6-6" />
        <path d="m8 6-6 6 6 6" />
      </svg>
    );
  }

  if (name === "cloud") {
    return (
      <svg {...common}>
        <path d="M17.5 19H7a5 5 0 1 1 1-9.9 7 7 0 0 1 13 3.9 3.5 3.5 0 0 1-3.5 6Z" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3" />
        <path d="M12 19v3" />
        <path d="M2 12h3" />
        <path d="M19 12h3" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const inputClassName =
  "min-h-11 w-full rounded-lg border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)]";
