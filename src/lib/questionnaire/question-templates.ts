import type { ProjectClassificationResult } from "@/lib/ai/types";

export type QuestionnaireQuestionType =
  | "text"
  | "textarea"
  | "single_select"
  | "multi_select"
  | "boolean";

export type QuestionTemplate = {
  block: string;
  key: string;
  label: string;
  options?: string[];
  type: QuestionnaireQuestionType;
};

export type QuestionnaireSelectionInput = {
  classification: ProjectClassificationResult | null;
  deploymentTarget?: string | null;
  executionTarget?: string | null;
  projectType?: string | null;
  repositoryMode?: string | null;
};

const sharedTemplates: QuestionTemplate[] = [
  {
    block: "Пользователи и роли",
    key: "primary_users",
    label: "Кто основные пользователи продукта и какие у них роли?",
    type: "textarea",
  },
  {
    block: "Основной сценарий",
    key: "core_success_path",
    label: "Какой главный путь пользователя от старта до полезного результата?",
    type: "textarea",
  },
  {
    block: "MVP-функции",
    key: "must_have_features",
    label: "Какие MVP-функции обязательны для первой рабочей версии?",
    type: "textarea",
  },
  {
    block: "Вне scope",
    key: "out_of_scope",
    label: "Что явно не входит в scope первой версии?",
    type: "textarea",
  },
];

const projectTypeTemplates: Record<string, QuestionTemplate[]> = {
  "AI agent": [
    {
      block: "Основной сценарий",
      key: "agent_goal",
      label: "Какую работу AI-агент должен выполнять автономно?",
      type: "textarea",
    },
    {
      block: "Интеграции",
      key: "agent_tools",
      label: "К каким инструментам, файлам, API или системам агент может иметь доступ?",
      type: "textarea",
    },
    {
      block: "QA-настройки",
      key: "agent_safety_checks",
      label: "Какие проверки безопасности нужны перед действиями агента?",
      type: "textarea",
    },
  ],
  "SaaS": [
    {
      block: "Пользователи и роли",
      key: "workspace_roles",
      label: "Какие роли и права доступа нужны в рабочей области SaaS?",
      type: "textarea",
    },
    {
      block: "Данные и хранение",
      key: "core_entities",
      label: "Какие основные сущности продукт должен хранить и показывать?",
      type: "textarea",
    },
    {
      block: "MVP-функции",
      key: "activation_event",
      label: "Какое действие пользователя доказывает, что SaaS дал ценность?",
      type: "textarea",
    },
  ],
  "Telegram bot": [
    {
      block: "Основной сценарий",
      key: "bot_commands",
      label: "Какие команды или сценарии диалога должен поддерживать бот?",
      type: "textarea",
    },
    {
      block: "Интеграции",
      key: "bot_integrations",
      label: "Из каких внешних сервисов бот должен читать данные или куда писать?",
      type: "textarea",
    },
    {
      block: "Ограничения и риски",
      key: "bot_admin_controls",
      label: "Какие admin controls или защита от злоупотреблений нужны боту?",
      type: "textarea",
    },
  ],
  "existing project improvement": [
    {
      block: "Готовность репозитория",
      key: "current_project_state",
      label: "В каком состоянии сейчас существующий репозиторий или продукт?",
      type: "textarea",
    },
    {
      block: "Ограничения и риски",
      key: "change_constraints",
      label: "Какие части существующего проекта нельзя сломать?",
      type: "textarea",
    },
    {
      block: "QA-настройки",
      key: "regression_checks",
      label: "Какие regression checks обязательны после изменений?",
      type: "textarea",
    },
  ],
  "internal tool": [
    {
      block: "Пользователи и роли",
      key: "internal_operators",
      label: "Кто будет пользоваться внутренним инструментом и как часто?",
      type: "textarea",
    },
    {
      block: "Данные и хранение",
      key: "operational_data",
      label: "Какие операционные данные нужно создавать, обновлять или проверять?",
      type: "textarea",
    },
    {
      block: "Ограничения и риски",
      key: "internal_risks",
      label: "Какие операционные риски должен снизить инструмент?",
      type: "textarea",
    },
  ],
  "other/unknown": [
    {
      block: "Основной сценарий",
      key: "product_category",
      label: "Какая категория продукта лучше всего описывает эту идею?",
      options: [
        "SaaS",
        "Telegram-бот",
        "Внутренний инструмент",
        "AI-агент",
        "Улучшение существующего проекта",
        "Другое",
      ],
      type: "single_select",
    },
    {
      block: "MVP-функции",
      key: "first_release_shape",
      label: "Что сделает первый релиз достаточно полезным для тестирования?",
      type: "textarea",
    },
  ],
};

const missingAreaTemplates: Record<string, QuestionTemplate> = {
  "default branch": {
    block: "Готовность репозитория",
    key: "default_branch",
    label: "На какую default branch должны ориентироваться промпты реализации?",
    type: "text",
  },
  "deployment target": {
    block: "План деплоя",
    key: "deployment_target_clarification",
    label: "Под какую платформу деплоя нужно планировать проект?",
    options: ["Railway", "Vercel", "Render", "Другое", "Пока не выбрано"],
    type: "single_select",
  },
  "execution target": {
    block: "Целевой инструмент разработки",
    key: "execution_target_clarification",
    label: "Кто или что будет выполнять сгенерированные задачи реализации?",
    options: ["Codex", "Claude Code", "Cursor", "Разработчик", "Несколько вариантов"],
    type: "single_select",
  },
  "existing repository URL": {
    block: "Готовность репозитория",
    key: "existing_repository_url",
    label: "Какой GitHub URL у существующего репозитория?",
    type: "text",
  },
  "more detailed product idea": {
    block: "Основной сценарий",
    key: "idea_detail_expansion",
    label: "Добавьте больше деталей об идее продукта, ограничениях и ожидаемом результате.",
    type: "textarea",
  },
  "target audience": {
    block: "Пользователи и роли",
    key: "target_audience_detail",
    label: "Опишите целевую аудиторию подробнее.",
    type: "textarea",
  },
};

missingAreaTemplates["default branch не указана"] =
  missingAreaTemplates["default branch"];
missingAreaTemplates["не хватает deployment target"] =
  missingAreaTemplates["deployment target"];
missingAreaTemplates["не выбран execution target"] =
  missingAreaTemplates["execution target"];
missingAreaTemplates["не указан URL существующего репозитория"] =
  missingAreaTemplates["existing repository URL"];
missingAreaTemplates["нужно подробнее описать идею продукта"] =
  missingAreaTemplates["more detailed product idea"];
missingAreaTemplates["не описана целевая аудитория"] =
  missingAreaTemplates["target audience"];

const infrastructureTemplates: QuestionTemplate[] = [
  {
    block: "Готовность репозитория",
    key: "github_repo_exists",
    label: "У вас уже есть GitHub-репозиторий?",
    options: ["Да", "Нет", "Неизвестно"],
    type: "single_select",
  },
  {
      block: "Готовность репозитория",
      key: "codex_push_access",
      label: "Может ли агент разработки пушить изменения в репозиторий?",
    options: ["Да", "Нет", "Неизвестно"],
    type: "single_select",
  },
  {
    block: "План деплоя",
    key: "manual_infrastructure_actions",
    label: "Какие инфраструктурные действия должны остаться ручными?",
    type: "textarea",
  },
  {
      block: "QA-настройки",
      key: "qa_depth",
      label: "Какую глубину QA должны учитывать сгенерированные задачи?",
    options: ["Без QA", "Минимальный QA", "Стандартный QA", "Строгий QA", "Настраиваемый QA"],
    type: "single_select",
  },
];

export function selectQuestionTemplates(input: QuestionnaireSelectionInput) {
  const projectType = normalizeProjectType(
    input.classification?.projectType ?? input.projectType,
  );
  const recommendedBlocks = new Set(
    input.classification?.recommendedQuestionBlocks ?? [],
  );
  const questions = [
    ...sharedTemplates,
    ...(projectTypeTemplates[projectType] ?? projectTypeTemplates["other/unknown"]),
    ...getMissingAreaQuestions(input.classification),
    ...infrastructureTemplates,
  ];

  return uniqueQuestions(questions).sort((left, right) => {
    const leftPriority = recommendedBlocks.has(left.block) ? 0 : 1;
    const rightPriority = recommendedBlocks.has(right.block) ? 0 : 1;

    return leftPriority - rightPriority;
  });
}

function getMissingAreaQuestions(
  classification: ProjectClassificationResult | null,
) {
  if (!classification) {
    return [];
  }

  return classification.missingInformationAreas
    .map((area) => missingAreaTemplates[area])
    .filter(Boolean);
}

function normalizeProjectType(projectType?: string | null) {
  if (!projectType) {
    return "other/unknown";
  }

  const normalized = projectType.toLowerCase();

  if (normalized.includes("saas")) {
    return "SaaS";
  }

  if (normalized.includes("telegram")) {
    return "Telegram bot";
  }

  if (normalized.includes("internal")) {
    return "internal tool";
  }

  if (normalized.includes("agent")) {
    return "AI agent";
  }

  if (normalized.includes("existing") || normalized.includes("improvement")) {
    return "existing project improvement";
  }

  return "other/unknown";
}

function uniqueQuestions(questions: QuestionTemplate[]) {
  const usedKeys = new Set<string>();

  return questions.filter((question) => {
    if (usedKeys.has(question.key)) {
      return false;
    }

    usedKeys.add(question.key);
    return true;
  });
}
