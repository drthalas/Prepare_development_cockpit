import type {
  GeneratedRoadmap,
  RoadmapGenerationInput,
  RoadmapPhaseDraft,
  RoadmapTaskDraft,
} from "@/lib/roadmap/types";
import { qaCheckpointFrequencyLabels } from "@/lib/execution/execution-options";
import {
  deploymentModeLabels,
  deploymentTargetLabels,
  qaModeLabels,
} from "@/lib/projects/project-options";

export function generateRoadmap(input: RoadmapGenerationInput): GeneratedRoadmap {
  const foundationTask = buildFoundationTask(input);
  const discoveryTasks = buildDiscoveryTasks(input);
  const buildTasks = buildBuildTasks(input);
  const deploymentTasks = buildDeploymentTasks(input);
  const qaTasks = buildQATasks(input);

  const phases: RoadmapPhaseDraft[] = [
    {
      description:
        "Выравнивание контекста проекта, готовности репозитория, предположений разработки и границ поставки.",
      tasks: [foundationTask, ...discoveryTasks],
      title: "Фаза 0 - Фундамент и выравнивание контекста",
    },
    {
      description:
        "Реализация основного продуктового сценария, описанного в утверждённой spec.",
      tasks: buildTasks,
      title: "Фаза 1 - Основной продуктовый сценарий",
    },
    {
      description:
        "Подготовка ручных инструкций по деплою, готовности окружения и операционных проверок.",
      tasks: deploymentTasks,
      title: "Фаза 2 - Готовность деплоя и эксплуатации",
    },
  ];

  if (qaTasks.length > 0) {
    phases.push({
      description:
        "Выполнить QA-проверки по выбранному QA-режиму перед последующим экспортом или запуском работ.",
      tasks: qaTasks,
      title: "Фаза 3 - QA и готовность к релизу",
    });
  }

  return {
    mode: "mock",
    phases,
    summary: `Сгенерировано ${phases.length} фаз из текущей spec и настроек исполнения.`,
    title: `Roadmap проекта ${input.project.title}`,
  };
}

function buildFoundationTask(input: RoadmapGenerationInput): RoadmapTaskDraft {
  const existingProject =
    input.executionSettings.projectMode === "existing_project";

  return {
    acceptanceCriteria: [
      "Контекст разработки задокументирован.",
      "Доступ к репозиторию и ограничения понятны.",
      "Будущие задачи можно выполнять выбранным инструментом разработки.",
    ],
    category: "coding",
    context: "Правило первой задачи roadmap из PDC-013.",
    dependencies: [],
    description: existingProject
      ? "Провести аудит существующего репозитория, подтвердить текущую архитектуру и выровнять контекст разработки до изменения поведения продукта."
      : "Создать фундамент разработки, контекст репозитория, структуру приложения и базовые проверки до начала работ над функциональностью.",
    implementationNotes: existingProject
      ? "Начать с аудита без изменений и избегать разрушительных рефакторингов."
      : "Держать фундамент компактным и готовым к деплою.",
    priority: "high",
    requirements: [
      "Подтвердить состояние репозитория.",
      "Задокументировать workflow разработки.",
      "Определить команды проверки.",
    ],
    title: existingProject
      ? "Аудит существующего проекта и выравнивание контекста разработки"
      : "Фундамент проекта / настройка контекста разработки",
  };
}

function buildDiscoveryTasks(input: RoadmapGenerationInput): RoadmapTaskDraft[] {
  const tasks: RoadmapTaskDraft[] = [];

  if (
    input.project.repositoryMode !== "existing" ||
    input.project.agentCanPush !== "yes"
  ) {
    tasks.push({
      acceptanceCriteria: [
        "Repository URL и default branch известны.",
        "Доступ агента разработки явно задокументирован.",
      ],
      category: "manual_infrastructure",
      context: "Готовность репозитория нужна до задач реализации.",
      dependencies: [],
      description:
        "Создать или подключить GitHub-репозиторий и подтвердить, кто может пушить изменения.",
      implementationNotes:
        "Это ручной предварительный шаг; автоматизация GitHub API не выполняется.",
      priority: "high",
      requirements: [
        "Выбрать владельца репозитория.",
        "Подтвердить видимость.",
        "Подтвердить push-доступ для агента разработки.",
      ],
      title: "Создать или подключить GitHub-репозиторий",
    });
  }

  return tasks;
}

function buildBuildTasks(input: RoadmapGenerationInput): RoadmapTaskDraft[] {
  const sections = input.spec.sections.filter((section) =>
    [
      "Functional requirements",
      "Функциональные требования",
      "User stories",
      "Пользовательские сценарии",
      "Data/storage assumptions",
      "Данные и хранение",
      "Integrations",
      "Интеграции",
      "MVP",
    ].some((title) => section.title.toLowerCase().includes(title.toLowerCase())),
  );
  const sourceSections = sections.length > 0 ? sections : input.spec.sections;
  const tasks = sourceSections.slice(0, 5).map((section, index) => ({
    acceptanceCriteria: [
      `Поведение из секции “${section.title}” реализовано или явно отложено.`,
      "Соответствующие lint/build проверки проходят.",
    ],
    category: "coding" as const,
    context: `Выведено из секции spec: ${section.title}.`,
    dependencies: index === 0 ? [] : ["Предыдущая задача основного workflow"],
    description: createTaskDescription(section.content, section.title),
    implementationNotes:
      "Использовать текущую SaaS-оболочку и существующую модель данных. Не генерировать prompts или экспорт в Linear в этой фазе.",
    priority: index < 2 ? ("high" as const) : ("medium" as const),
    requirements: section.content
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5),
    title: `Реализовать: ${section.title}`,
  }));

  return tasks.length > 0
    ? tasks
    : [
        {
          acceptanceCriteria: ["Core MVP behavior представлен в приложении."],
          category: "coding",
          context: "Fallback task из spec markdown.",
          dependencies: [],
          description:
            "Реализовать первый полезный продуктовый сценарий, описанный в текущей spec.",
          implementationNotes:
            "Держать scope узким и проверять через lint/build проверки.",
          priority: "high",
          requirements: ["Использовать текущую spec как source of truth."],
          title: "Реализовать основной MVP workflow",
        },
      ];
}

function buildDeploymentTasks(input: RoadmapGenerationInput): RoadmapTaskDraft[] {
  const target = input.executionSettings.deploymentTarget;
  const label =
    target === "undecided"
      ? "цель деплоя не выбрана"
      : formatKnownValue(deploymentTargetLabels, target);
  const deploymentMode = formatKnownValue(
    deploymentModeLabels,
    input.executionSettings.deploymentMode,
  );

  return [
    {
      acceptanceCriteria: [
        "Ручные шаги деплоя задокументированы.",
        "Environment variables перечислены.",
        "Путь health check указан.",
      ],
      category: "documentation_recommendation",
      context: `Цель деплоя: ${label}. Режим: ${deploymentMode}.`,
      dependencies: ["Основной продуктовый workflow реализован"],
      description:
        "Подготовить руководство по деплою и операционный checklist без создания инфраструктуры через API.",
      implementationNotes:
        "Ресурсы Railway/Vercel/Render настраиваются вручную выбранным владельцем.",
      priority: "medium",
      requirements: [
        "Задокументировать обязательные env vars.",
        "Задокументировать build/start команды.",
        "Задокументировать проверку /api/health.",
      ],
      title: `Подготовить руководство по деплою для ${label}`,
    },
  ];
}

function buildQATasks(input: RoadmapGenerationInput): RoadmapTaskDraft[] {
  if (input.executionSettings.qaMode === "off") {
    return [];
  }

  return [
    {
      acceptanceCriteria: [
        "Выбранный QA-режим учтён.",
        "Частота checkpoint задокументирована.",
        "Блокеры релиза зафиксированы до экспорта.",
      ],
      category: "qa_checkpoint",
      context: `QA-режим: ${formatKnownValue(qaModeLabels, input.executionSettings.qaMode)}; частота: ${formatKnownValue(qaCheckpointFrequencyLabels, input.executionSettings.qaCheckpointFrequency)}.`,
      dependencies: ["Основной workflow и задачи по руководству деплоя"],
      description:
        "Провести QA-проверку на уровне roadmap перед будущими prompts для задач и экспортом.",
      implementationNotes:
        "Это placeholder-задача; полноценный QA generator относится к будущей фазе.",
      priority:
        input.executionSettings.qaMode === "strict" ? "high" : "medium",
      requirements: [
        "Проверить критерии приемки.",
        "Подтвердить smoke checks.",
        "Подтвердить нерешённые риски.",
      ],
      title: "QA-проверка перед утверждением roadmap",
    },
  ];
}

function createTaskDescription(content: string, title: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return `Реализовать scope секции “${title}” из текущей спецификации.`;
  }

  return normalized.length > 360
    ? `${normalized.slice(0, 357).trim()}...`
    : normalized;
}

function formatKnownValue(
  labels: Record<string, string>,
  value?: string | null,
) {
  if (!value) {
    return "пока не выбрано";
  }

  return labels[value] ?? value;
}
