"use client";

import { useMemo, useState } from "react";

import type {
  QuestionnaireAnswerValue,
  QuestionnaireQuestion,
  QuestionnaireSessionView,
} from "@/lib/questionnaire/questionnaire-store";

type QuestionnaireWizardProps = {
  action: (formData: FormData) => void;
  session: QuestionnaireSessionView;
};

export function QuestionnaireWizard({
  action,
  session,
}: QuestionnaireWizardProps) {
  const [activeIndex, setActiveIndex] = useState(
    Math.min(session.currentStep ?? 0, Math.max(session.questions.length - 1, 0)),
  );
  const activeQuestion = session.questions[activeIndex];
  const progress = useMemo(
    () => Math.round(((activeIndex + 1) / session.questions.length) * 100),
    [activeIndex, session.questions.length],
  );

  if (!activeQuestion) {
    return (
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-6 text-sm text-[var(--muted)]">
        No questions were generated for this project.
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
              Question {activeIndex + 1} of {session.questions.length}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Adaptive questionnaire
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Answer requirements questions selected from the project type,
              classification result, repository context, and missing
              information areas. This does not generate a specification.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[var(--soft-accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
            {session.status === "completed" ? "Completed" : `${progress}% complete`}
          </span>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--panel-border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {session.questions.map((question, index) => (
            <button
              className={`h-9 min-w-9 rounded-md border px-3 text-xs font-semibold transition ${
                index === activeIndex
                  ? "border-[var(--accent)] bg-[var(--soft-accent)] text-[var(--accent-strong)]"
                  : "border-[var(--panel-border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              key={question.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {session.questions.map((question, index) => (
        <div
          className={
            index === activeIndex
              ? "rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm"
              : "hidden"
          }
          key={question.id}
        >
          <p className="text-xs font-semibold uppercase text-[var(--accent-strong)]">
            {question.block}
          </p>
          <h3 className="mt-2 text-xl font-semibold">{question.label}</h3>
          <div className="mt-5">
            <input
              name={`question_present_${question.id}`}
              type="hidden"
              value="1"
            />
            <QuestionInput question={question} />
          </div>
        </div>
      ))}

      {session.status === "completed" ? (
        <div className="rounded-lg border border-[var(--panel-border)] bg-[var(--soft-accent)] p-4 text-sm font-medium text-[var(--accent-strong)]">
          Questionnaire is completed. You can still change answers and save
          again before spec generation exists.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--panel-border)] px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={activeIndex === 0}
          onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
          type="button"
        >
          Previous
        </button>

        {activeIndex < session.questions.length - 1 ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            onClick={() =>
              setActiveIndex((index) =>
                Math.min(index + 1, session.questions.length - 1),
              )
            }
            type="button"
          >
            Next
          </button>
        ) : (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            type="submit"
          >
            Finish questionnaire
          </button>
        )}
      </div>
    </form>
  );
}

function QuestionInput({ question }: { question: QuestionnaireQuestion }) {
  const name = `question_${question.id}`;

  if (question.type === "textarea") {
    return (
      <textarea
        className={`${inputClassName} min-h-36 py-3`}
        defaultValue={answerToString(question.answer)}
        name={name}
        placeholder="Write a clear answer for future spec generation."
      />
    );
  }

  if (question.type === "single_select") {
    return (
      <select
        className={inputClassName}
        defaultValue={answerToString(question.answer)}
        name={name}
      >
        <option value="">Select one</option>
        {question.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === "multi_select") {
    const selected = new Set(
      Array.isArray(question.answer) ? question.answer : [],
    );

    return (
      <div className="grid gap-2">
        {question.options.map((option) => (
          <label
            className="flex min-h-11 items-center gap-3 rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-sm"
            key={option}
          >
            <input
              defaultChecked={selected.has(option)}
              name={name}
              type="checkbox"
              value={option}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === "boolean") {
    return (
      <select
        className={inputClassName}
        defaultValue={answerToString(question.answer)}
        name={name}
      >
        <option value="">Select one</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  return (
    <input
      className={inputClassName}
      defaultValue={answerToString(question.answer)}
      name={name}
      placeholder="Answer"
    />
  );
}

function answerToString(answer: QuestionnaireAnswerValue | null) {
  if (typeof answer === "string") {
    return answer;
  }

  if (typeof answer === "boolean") {
    return String(answer);
  }

  return "";
}

const inputClassName =
  "min-h-11 w-full rounded-md border border-[var(--panel-border)] bg-[var(--background)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]";
