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
    title: "Product Idea",
    helper: "Capture the product, audience, and starting intent.",
  },
  {
    id: "repository",
    title: "Repository",
    helper: "Record GitHub readiness before future Codex prompts are built.",
  },
  {
    id: "deployment",
    title: "Deployment",
    helper: "Set deployment expectations without creating infrastructure.",
  },
  {
    id: "execution",
    title: "Execution",
    helper: "Choose the implementation target and initial QA preference.",
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
              Step {activeIndex + 1} of {steps.length}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{currentStep.title}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {currentStep.helper}
            </p>
          </div>
          <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
            {progress}% complete
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
        <Field label="Project title">
          <input
            className={inputClassName}
            name="title"
            placeholder="Customer onboarding cockpit"
            required
          />
        </Field>

        <Field label="Initial idea">
          <textarea
            className={`${inputClassName} min-h-32 py-3`}
            name="initialIdea"
            placeholder="Describe the product idea, target user, constraints, and first valuable outcome."
            required
          />
        </Field>

        <Field
          helper="Who is this product for? This will shape future questionnaire blocks."
          label="Target user / audience"
        >
          <textarea
            className={`${inputClassName} min-h-24 py-3`}
            name="targetUser"
            placeholder="Founders, internal operations teams, product managers..."
          />
        </Field>

        <Field
          helper="Optional for now. PDC-007 can refine this with the classifier."
          label="Project type"
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
          helper="Choose the closest current state, including unknown."
          label="Repository mode"
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

        <Field helper="Required only when an existing repository is known." label="Repository URL">
          <input
            className={inputClassName}
            name="repositoryUrl"
            placeholder="https://github.com/org/repo"
            type="url"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Repository visibility">
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

          <Field label="Who creates the repository?">
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
          <Field label="Can the execution agent push to GitHub?">
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
        <Field label="Preferred deployment target">
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
          helper="Phase 2 records intent only. No Railway, Vercel, or Render resources are created."
          label="Deployment mode"
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

        <Field label="Who configures deployment?">
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
        <Field label="Preferred AI coding tool / execution target">
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

        <Field helper="Initial preference only. QA generation is a future phase." label="QA preference">
          <select className={inputClassName} defaultValue="standard" name="qaPreference">
            {qaModes.map((mode) => (
              <option key={mode} value={mode}>
                {qaModeLabels[mode]}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-md border border-[var(--panel-border)] bg-[var(--section-surface)] p-4 text-sm leading-6 text-[var(--muted)]">
          The next step after saving is questionnaire readiness. This task does
          not classify the project, generate questions, specs, roadmaps, tasks,
          prompts, QA content, or Linear exports.
        </div>
      </WizardPanel>

      <div className="flex flex-col gap-3 border-t border-[var(--panel-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--panel-border)] px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={activeIndex === 0}
          onClick={goToPreviousStep}
          type="button"
        >
          Previous
        </button>
        {activeIndex < steps.length - 1 ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            onClick={goToNextStep}
            type="button"
          >
            Continue
          </button>
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            Save intake and open project
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
