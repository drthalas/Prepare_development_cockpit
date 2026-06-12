"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { createProjectAction } from "@/app/app/projects/actions";
import {
  agentPushAccessLabels,
  agentPushAccessValues,
  deploymentModeLabels,
  deploymentModes,
  deploymentOwnerLabels,
  deploymentOwners,
  deploymentTargetLabels,
  deploymentTargets,
  executionTargetLabels,
  executionTargets,
  qaModeLabels,
  qaModes,
  repositoryModeLabels,
  repositoryModes,
  repositoryOwnerLabels,
  repositoryOwners,
  repositoryVisibilityLabels,
  repositoryVisibilities,
} from "@/lib/projects/project-options";

const steps = [
  {
    id: "idea",
    title: "Идея продукта",
    helper: "Опишите продукт, аудиторию и первый полезный результат.",
  },
  {
    id: "repository",
    title: "GitHub",
    helper: "Укажите готовность репозитория до будущих Codex prompts.",
  },
  {
    id: "deployment",
    title: "Деплой",
    helper: "Зафиксируйте ожидания по деплою без создания инфраструктуры.",
  },
  {
    id: "execution",
    title: "Исполнение",
    helper: "Выберите инструмент разработки и начальные QA-настройки.",
  },
] as const;

type StepId = (typeof steps)[number]["id"];

export function ProjectIntakeWizard() {
  const [activeStep, setActiveStep] = useState<StepId>("idea");
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const currentStep = steps[activeIndex];
  const progress = useMemo(
    () => Math.round(((activeIndex + 1) / steps.length) * 100),
    [activeIndex],
  );

  function goToNextStep() {
    const nextStep = steps[Math.min(activeIndex + 1, steps.length - 1)];
    setActiveStep(nextStep.id);
  }

  function goToPreviousStep() {
    const previousStep = steps[Math.max(activeIndex - 1, 0)];
    setActiveStep(previousStep.id);
  }

  return (
    <form action={createProjectAction} className="grid gap-5">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--section-surface)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
              Шаг {activeIndex + 1} из {steps.length}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{currentStep.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {currentStep.helper}
            </p>
          </div>
          <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
            {progress}% готово
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel-border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {steps.map((step, index) => (
            <button
              className={`min-h-10 rounded-md border px-3 text-left text-xs font-semibold transition ${
                step.id === activeStep
                  ? "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                  : "border-[var(--panel-border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              type="button"
            >
              {index + 1}. {step.title}
            </button>
          ))}
        </div>
      </div>

      <WizardPanel isActive={activeStep === "idea"}>
        <Field label="Название проекта">
          <input
            className={inputClassName}
            name="title"
            placeholder="Cockpit для онбординга клиентов"
            required
          />
        </Field>

        <Field label="Идея проекта">
          <textarea
            className={`${inputClassName} min-h-32 py-3`}
            name="initialIdea"
            placeholder="Опишите идею продукта, пользователя, ограничения и первый ценный результат."
            required
          />
        </Field>

        <Field
          helper="Для кого продукт? Это повлияет на будущие вопросы анкеты."
          label="Целевая аудитория"
        >
          <textarea
            className={`${inputClassName} min-h-24 py-3`}
            name="targetUser"
            placeholder="Основатели, операционные команды, product managers..."
          />
        </Field>

        <Field
          helper="Можно оставить пустым. Классификатор уточнит тип проекта позже."
          label="Тип проекта"
        >
          <input
            className={inputClassName}
            name="projectType"
            placeholder="SaaS, internal tool, Telegram bot..."
          />
        </Field>
      </WizardPanel>

      <WizardPanel isActive={activeStep === "repository"}>
        <Field
          helper="Выберите текущее состояние, включая неизвестно."
          label="Состояние репозитория"
        >
          <select
            className={inputClassName}
            defaultValue="undecided"
            name="repositoryMode"
            required
          >
            {repositoryModes.map((mode) => (
              <option key={mode} value={mode}>
                {repositoryModeLabels[mode]}
              </option>
            ))}
          </select>
        </Field>

        <Field helper="Нужно только если репозиторий уже существует." label="URL репозитория">
          <input
            className={inputClassName}
            name="repositoryUrl"
            placeholder="https://github.com/org/repo"
            type="url"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Видимость репозитория">
            <select
              className={inputClassName}
              defaultValue="unknown"
              name="repositoryVisibility"
              required
            >
              {repositoryVisibilities.map((visibility) => (
                <option key={visibility} value={visibility}>
                  {repositoryVisibilityLabels[visibility]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Кто создаёт репозиторий?">
            <select
              className={inputClassName}
              defaultValue="not_decided"
              name="repositoryOwner"
              required
            >
              {repositoryOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {repositoryOwnerLabels[owner]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Может ли агент пушить в GitHub?">
            <select
              className={inputClassName}
              defaultValue="unknown"
              name="agentCanPush"
              required
            >
              {agentPushAccessValues.map((value) => (
                <option key={value} value={value}>
                  {agentPushAccessLabels[value]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Default branch">
            <input
              className={inputClassName}
              name="defaultBranch"
              placeholder="main"
            />
          </Field>
        </div>
      </WizardPanel>

      <WizardPanel isActive={activeStep === "deployment"}>
        <Field label="Предпочтительный деплой">
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

        <Field
          helper="Здесь фиксируется только намерение. Railway, Vercel и Render resources не создаются."
          label="Режим деплоя"
        >
          <select
            className={inputClassName}
            defaultValue="manual_instructions"
            name="deploymentMode"
            required
          >
            {deploymentModes.map((mode) => (
              <option key={mode} value={mode}>
                {deploymentModeLabels[mode]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Кто настраивает деплой?">
          <select
            className={inputClassName}
            defaultValue="not_decided"
            name="deploymentOwner"
            required
          >
            {deploymentOwners.map((owner) => (
              <option key={owner} value={owner}>
                {deploymentOwnerLabels[owner]}
              </option>
            ))}
          </select>
        </Field>
      </WizardPanel>

      <WizardPanel isActive={activeStep === "execution"}>
        <Field label="Инструмент разработки / execution target">
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

        <Field helper="Начальная настройка. QA checkpoint logic настраивается позже." label="QA-настройка">
          <select className={inputClassName} defaultValue="standard" name="qaPreference">
            {qaModes.map((mode) => (
              <option key={mode} value={mode}>
                {qaModeLabels[mode]}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-md border border-[var(--panel-border)] bg-[var(--section-surface)] p-4 text-sm leading-6 text-[var(--muted)]">
          После сохранения откроется страница проекта. Там будет показан
          следующий шаг: классификация, анкета, spec, roadmap, prompts, QA и
          export запускаются отдельными кнопками.
        </div>
      </WizardPanel>

      <div className="flex flex-col gap-3 border-t border-[var(--panel-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--panel-border)] px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={activeIndex === 0}
          onClick={goToPreviousStep}
          type="button"
        >
          Назад
        </button>
        {activeIndex < steps.length - 1 ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            onClick={goToNextStep}
            type="button"
          >
            Продолжить
          </button>
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            Сохранить и открыть проект
          </button>
        )}
      </div>
    </form>
  );
}

function WizardPanel({
  children,
  isActive,
}: {
  children: ReactNode;
  isActive: boolean;
}) {
  return (
    <section className={isActive ? "grid gap-4" : "hidden"}>{children}</section>
  );
}

function Field({
  children,
  helper,
  label,
}: {
  children: ReactNode;
  helper?: string;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
      {helper ? (
        <span className="text-xs leading-5 text-[var(--muted)]">{helper}</span>
      ) : null}
    </label>
  );
}

const inputClassName =
  "min-h-11 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]";
