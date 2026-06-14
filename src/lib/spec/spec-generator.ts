import { getAIProvider } from "@/lib/ai/provider";
import {
  agentPushAccessLabels,
  deploymentModeLabels,
  deploymentOwnerLabels,
  deploymentTargetLabels,
  executionTargetLabels,
  qaModeLabels,
  repositoryModeLabels,
  repositoryOwnerLabels,
  repositoryVisibilityLabels,
} from "@/lib/projects/project-options";
import type {
  GeneratedSpec,
  QuestionnaireAnswerSummary,
  SpecGenerationInput,
  SpecSection,
} from "@/lib/spec/types";

const sectionOrder = [
  "overview",
  "problem",
  "target-users",
  "goals",
  "non-goals",
  "user-stories",
  "functional-requirements",
  "non-functional-requirements",
  "integrations",
  "data-storage-assumptions",
  "repository-github-readiness",
  "deployment-planning",
  "execution-target",
  "qa-preference",
  "edge-cases",
  "mvp-scope",
  "out-of-scope",
  "open-questions",
] as const;

export async function generateSpec(
  input: SpecGenerationInput,
): Promise<GeneratedSpec> {
  const provider = getAIProvider();

  if (provider.mode !== "mock") {
    throw new Error(
      "Configured AI spec generation is not implemented yet. Use mock mode for PDC-009.",
    );
  }

  return generateMockSpec(input);
}

function generateMockSpec(input: SpecGenerationInput): GeneratedSpec {
  const sections = buildSections(input);
  const markdown = renderMarkdown(input.project.title, sections);

  return {
    markdown,
    mode: "mock",
    sections,
    summary: `Спецификация ${input.project.title} сгенерирована из intake, классификации и ответов анкеты.`,
  };
}

function buildSections(input: SpecGenerationInput): SpecSection[] {
  const answerLookup = createAnswerLookup(input.questionnaire.answers);
  const projectType =
    input.classification?.projectType ?? input.project.projectType ?? "unknown";
  const missing = input.classification?.missingInformationAreas ?? [];
  const modules = input.classification?.suggestedModules ?? [];

  const sections: Record<(typeof sectionOrder)[number], SpecSection> = {
    "data-storage-assumptions": {
      content: answerLookup.get("core_entities") ?? answerLookup.get("operational_data") ?? "Предположения по модели данных пока не описаны полностью.",
      id: "data-storage-assumptions",
      title: "Данные и хранение",
    },
    "deployment-planning": {
      content: [
        `Предпочтительная платформа: ${formatKnownValue(deploymentTargetLabels, input.project.deploymentTarget)}.`,
        `Режим деплоя: ${formatKnownValue(deploymentModeLabels, input.project.deploymentMode)}.`,
        `Кто настраивает деплой: ${formatKnownValue(deploymentOwnerLabels, input.project.deploymentOwner)}.`,
        getAnswerByBlock(input.questionnaire.answers, "План деплоя") ??
          getAnswerByBlock(input.questionnaire.answers, "deployment planning") ??
          "Ручные шаги деплоя нужно описать до реализации.",
      ].join(" "),
      id: "deployment-planning",
      title: "План деплоя",
    },
    "edge-cases": {
      content: answerLookup.get("internal_risks") ?? answerLookup.get("change_constraints") ?? "Граничные случаи нужно уточнить во время планирования реализации.",
      id: "edge-cases",
      title: "Граничные случаи",
    },
    "execution-target": {
      content: [
        `Предпочтительный инструмент разработки: ${formatKnownValue(executionTargetLabels, input.project.executionTarget)}.`,
        `Агент может пушить в репозиторий: ${formatKnownValue(agentPushAccessLabels, input.project.agentCanPush)}.`,
      ].join(" "),
      id: "execution-target",
      title: "Предположения по разработке",
    },
    "functional-requirements": {
      content: "Первая реализация должна сфокусироваться на функциональных требованиях ниже.",
      id: "functional-requirements",
      items: modules.length > 0 ? modules : splitAnswer(answerLookup.get("must_have_features")),
      title: "Функциональные требования",
    },
    goals: {
      content: "Проект должен достичь следующих результатов.",
      id: "goals",
      items: splitAnswer(answerLookup.get("core_success_path") ?? answerLookup.get("activation_event")),
      title: "Цели",
    },
    integrations: {
      content: answerLookup.get("bot_integrations") ?? answerLookup.get("agent_tools") ?? "Внешние интеграции пока не подтверждены.",
      id: "integrations",
      title: "Интеграции",
    },
    "mvp-scope": {
      content:
        answerLookup.get("must_have_features") ??
        answerLookup.get("first_release_shape") ??
        "MVP должен приоритизировать основной сценарий и сохранённый контекст проекта.",
      id: "mvp-scope",
      title: "MVP",
    },
    "non-functional-requirements": {
      content:
        "Продукт должен оставаться надёжным, поддерживаемым и проверяемым через lint/build checks и ручные smoke-проверки.",
      id: "non-functional-requirements",
      items: [
        "Сохранять данные проекта, анкеты и spec в PostgreSQL.",
        "Оставлять сгенерированные артефакты редактируемыми до генерации roadmap.",
        "Не выполнять автоматические изменения инфраструктуры или внешних сервисов без явного действия пользователя.",
      ],
      title: "Нефункциональные требования",
    },
    "non-goals": {
      content:
        answerLookup.get("out_of_scope") ??
        "Генерация roadmap, генерация задач, экспорт в Linear, auth и billing не входят в этот этап spec.",
      id: "non-goals",
      title: "Что не входит в scope",
    },
    "open-questions": {
      content:
        missing.length > 0 &&
        !missing.includes("критичных пробелов в intake не найдено") &&
        !missing.includes("none detected in intake")
          ? "Следующие области нужно уточнить перед генерацией roadmap."
          : "Текущий mock-классификатор не нашёл критичных пробелов.",
      id: "open-questions",
      items:
        missing.length > 0
          ? missing
          : ["Подтвердить финальный scope MVP перед генерацией roadmap."],
      title: "Открытые вопросы",
    },
    "out-of-scope": {
      content:
        answerLookup.get("out_of_scope") ??
        "Всё, что не нужно для первой редактируемой spec и будущего input для roadmap, остаётся вне scope.",
      id: "out-of-scope",
      title: "Вне scope",
    },
    overview: {
      content: [
        input.project.initialIdea,
        `Текущий тип проекта: ${projectType}.`,
        input.questionnaire.completed
          ? "Анкета завершена."
          : "Анкета не завершена, поэтому spec может быть неполной.",
      ].join(" "),
      id: "overview",
      title: "Обзор",
    },
    problem: {
      content:
        answerLookup.get("problem") ??
        answerLookup.get("current_project_state") ??
        "Продукту нужна понятная спецификация, готовая к реализации, перед генерацией roadmap и задач.",
      id: "problem",
      title: "Проблема",
    },
    "qa-preference": {
      content: [
        `Начальная QA-настройка: ${formatKnownValue(qaModeLabels, input.project.qaPreference)}.`,
        answerLookup.get("qa_depth") ??
          answerLookup.get("regression_checks") ??
          "QA-ожидания нужно подтвердить до генерации задач реализации.",
      ].join(" "),
      id: "qa-preference",
      title: "QA-настройки",
    },
    "repository-github-readiness": {
      content: [
        `Состояние репозитория: ${formatKnownValue(repositoryModeLabels, input.project.repositoryMode)}.`,
        `URL репозитория: ${formatValue(input.project.repositoryUrl)}.`,
        `Видимость: ${formatKnownValue(repositoryVisibilityLabels, input.project.repositoryVisibility)}.`,
        `Кто создаёт репозиторий: ${formatKnownValue(repositoryOwnerLabels, input.project.repositoryOwner)}.`,
        `Default branch: ${formatValue(input.project.defaultBranch)}.`,
      ].join(" "),
      id: "repository-github-readiness",
      title: "Готовность GitHub-репозитория",
    },
    "target-users": {
      content: input.project.targetUser ?? answerLookup.get("primary_users") ?? "Целевых пользователей нужно уточнить.",
      id: "target-users",
      title: "Целевые пользователи",
    },
    "user-stories": {
      content: "Начальные пользовательские сценарии, выведенные из сохранённого контекста проекта.",
      id: "user-stories",
      items: buildUserStories(input),
      title: "Пользовательские сценарии",
    },
  };

  return sectionOrder.map((sectionId) => sections[sectionId]);
}

function buildUserStories(input: SpecGenerationInput) {
  const targetUser = input.project.targetUser ?? "пользователь";

  return [
    `Как ${targetUser}, я могу описать идею продукта, чтобы система подготовила контекст реализации.`,
    `Как ${targetUser}, я могу ответить на уточняющие вопросы, чтобы недостающие требования были сохранены.`,
    `Как ${targetUser}, я могу проверить редактируемую спецификацию до генерации roadmap.`,
  ];
}

function renderMarkdown(title: string, sections: SpecSection[]) {
  const body = sections
    .map((section) => {
      const items =
        section.items && section.items.length > 0
          ? `\n\n${section.items.map((item) => `- ${item}`).join("\n")}`
          : "";

      return `## ${section.title}\n\n${section.content}${items}`;
    })
    .join("\n\n");

  return `# ${title} — продуктовая спецификация\n\n${body}\n`;
}

function createAnswerLookup(answers: QuestionnaireAnswerSummary[]) {
  const lookup = new Map<string, string>();

  for (const answer of answers) {
    const value = formatAnswer(answer.answer);

    if (value) {
      lookup.set(answer.key, value);
    }
  }

  return lookup;
}

function getAnswerByBlock(
  answers: QuestionnaireAnswerSummary[],
  block: string,
) {
  return answers.find((answer) => answer.block === block && answer.answer)
    ? formatAnswer(
        answers.find((answer) => answer.block === block && answer.answer)?.answer ??
          null,
      )
    : null;
}

function splitAnswer(answer?: string | null) {
  if (!answer) {
    return ["Уточнить детали перед генерацией roadmap."];
  }

  return answer
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function formatAnswer(answer: boolean | string | string[] | null) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }

  if (typeof answer === "boolean") {
    return answer ? "Да" : "Нет";
  }

  return answer;
}

function formatValue(value?: string | null) {
  return value?.trim() || "не указано";
}

function formatKnownValue(
  labels: Record<string, string>,
  value?: string | null,
) {
  if (!value) {
    return "не указано";
  }

  return labels[value] ?? value;
}
