import type {
  AIProvider,
  ClassifiedProjectType,
  ProjectClassificationInput,
  ProjectClassificationResult,
  ProjectComplexity,
} from "@/lib/ai/types";

const typeRules: Array<{
  keywords: string[];
  modules: string[];
  questionBlocks: string[];
  type: ClassifiedProjectType;
}> = [
  {
    keywords: ["telegram", "bot", "chatbot"],
    modules: ["Команды бота", "Сценарии диалога", "Админ-настройки"],
    questionBlocks: ["Пользователи и роли", "Основной сценарий", "Интеграции"],
    type: "Telegram bot",
  },
  {
    keywords: ["mobile", "ios", "android", "react native", "app store"],
    modules: ["Мобильный onboarding", "Основные экраны", "Чеклист релиза"],
    questionBlocks: ["Пользователи и роли", "MVP-функции", "Ограничения и риски"],
    type: "mobile app",
  },
  {
    keywords: ["agent", "ai agent", "assistant", "automation with ai"],
    modules: ["Цикл работы агента", "Доступ к инструментам", "Проверки безопасности"],
    questionBlocks: ["Основной сценарий", "Интеграции", "QA-настройки"],
    type: "AI agent",
  },
  {
    keywords: ["marketplace", "buyers", "sellers", "vendor"],
    modules: ["Каталог/listings", "Транзакции", "Дашборды участников"],
    questionBlocks: ["Пользователи и роли", "MVP-функции", "Данные и хранение"],
    type: "marketplace",
  },
  {
    keywords: ["landing", "website", "product site", "marketing site"],
    modules: ["Лендинг", "Контентные секции", "Отслеживание конверсии"],
    questionBlocks: ["Основной сценарий", "MVP-функции", "План деплоя"],
    type: "landing/product site",
  },
  {
    keywords: ["script", "cron", "automation", "cli"],
    modules: ["Запуск автоматизации", "Входные и выходные данные", "Логирование"],
    questionBlocks: ["Основной сценарий", "Интеграции", "Ограничения и риски"],
    type: "automation script",
  },
  {
    keywords: ["existing", "refactor", "improve", "migration", "legacy"],
    modules: ["Аудит текущего состояния", "План изменений", "Регрессионные проверки"],
    questionBlocks: [
      "Готовность репозитория",
      "Ограничения и риски",
      "QA-настройки",
    ],
    type: "existing project improvement",
  },
  {
    keywords: ["internal", "dashboard", "admin", "backoffice", "ops"],
    modules: ["Рабочая область", "Операционный дашборд", "Представления данных"],
    questionBlocks: ["Пользователи и роли", "Основной сценарий", "Данные и хранение"],
    type: "internal tool",
  },
  {
    keywords: ["saas", "subscription", "workspace", "tenant", "b2b"],
    modules: ["Модель рабочих областей", "Дашборд проекта", "Настройки"],
    questionBlocks: ["Пользователи и роли", "MVP-функции", "План деплоя"],
    type: "SaaS",
  },
];

export function createMockAIProvider(): AIProvider {
  return {
    async classifyProjectIdea(input) {
      return classifyWithRules(input);
    },
    mode: "mock",
    name: "mock",
  };
}

function classifyWithRules(
  input: ProjectClassificationInput,
): ProjectClassificationResult {
  const source = [
    input.title,
    input.initialIdea,
    input.targetUser,
    input.projectType,
    input.repositoryMode,
    input.deploymentTarget,
    input.executionTarget,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchedRule = typeRules.find((rule) =>
    rule.keywords.some((keyword) => source.includes(keyword)),
  );
  const projectType = matchedRule?.type ?? "other/unknown";
  const suggestedModules =
    matchedRule?.modules ?? ["Сбор идеи", "Рабочая область", "Ручное планирование"];
  const recommendedQuestionBlocks = Array.from(
    new Set([
      ...(matchedRule?.questionBlocks ?? ["Пользователи и роли", "Основной сценарий"]),
      "Готовность репозитория",
      "План деплоя",
      "Целевой инструмент разработки",
    ]),
  );

  return {
    confidence: matchedRule ? 0.78 : 0.42,
    complexity: estimateComplexity(source, input),
    missingInformationAreas: findMissingInformation(input),
    mode: "mock",
    projectType,
    recommendedQuestionBlocks,
    suggestedModules,
    summary: buildSummary(projectType, input),
  };
}

function estimateComplexity(
  source: string,
  input: ProjectClassificationInput,
): ProjectComplexity {
  const highSignals = [
    "marketplace",
    "multi-tenant",
    "billing",
    "payments",
    "ai agent",
    "enterprise",
    "permissions",
  ];
  const mediumSignals = [
    "dashboard",
    "workflow",
    "integration",
    "database",
    "roadmap",
    "workspace",
  ];

  if (highSignals.some((signal) => source.includes(signal))) {
    return "high";
  }

  if (
    mediumSignals.some((signal) => source.includes(signal)) ||
    input.repositoryMode === "existing" ||
    input.deploymentTarget === "railway"
  ) {
    return "medium";
  }

  return source.length > 220 ? "medium" : "low";
}

function findMissingInformation(input: ProjectClassificationInput) {
  const missing: string[] = [];

  if (!input.targetUser) {
    missing.push("не описана целевая аудитория");
  }

  if (!input.repositoryUrl && input.repositoryMode === "existing") {
    missing.push("не указан URL существующего репозитория");
  }

  if (!input.defaultBranch) {
    missing.push("default branch не указана");
  }

  if (!input.deploymentTarget || input.deploymentTarget === "undecided") {
    missing.push("не хватает deployment target");
  }

  if (!input.executionTarget || input.executionTarget === "unknown") {
    missing.push("не выбран execution target");
  }

  if (!input.initialIdea || input.initialIdea.length < 80) {
    missing.push("нужно подробнее описать идею продукта");
  }

  return missing.length > 0 ? missing : ["критичных пробелов в intake не найдено"];
}

function buildSummary(
  projectType: ClassifiedProjectType,
  input: ProjectClassificationInput,
) {
  const audience = input.targetUser
    ? ` для аудитории: ${input.targetUser}`
    : ", но аудиторию ещё нужно уточнить";

  return `${input.title} классифицирован как ${projectType}${audience}.`;
}
