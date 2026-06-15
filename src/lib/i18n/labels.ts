export const taskCategoryLabels: Record<string, string> = {
  coding: "Разработка",
  documentation_recommendation: "Документация/рекомендация",
  manual_infrastructure: "Ручная инфраструктура",
  qa_checkpoint: "QA-проверка",
};

export const taskPriorityLabels: Record<string, string> = {
  high: "Высокий",
  low: "Низкий",
  medium: "Средний",
  urgent: "Срочный",
};

export const taskStatusLabels: Record<string, string> = {
  blocked: "Заблокировано",
  done: "Готово",
  in_progress: "В работе",
  todo: "К выполнению",
};

export const complexityLabels: Record<string, string> = {
  high: "Высокая",
  low: "Низкая",
  medium: "Средняя",
  unknown: "Неизвестно",
};

export const projectMetadataLabels = {
  created: "Создан",
  deployment: "Деплой",
  execution: "Исполнение",
  repository: "Репозиторий",
  type: "Тип проекта",
  updated: "Обновлён",
} as const;

export const workflowStepLabels = {
  classification: "Классификация",
  execution: "Настройки",
  export: "Экспорт",
  idea: "Идея",
  prompts: "Промпты",
  questionnaire: "Анкета",
  roadmap: "Дорожная карта",
  spec: "Спецификация",
} as const;

export const workflowActionLabels = {
  classify: "Классифицировать проект",
  export: "Открыть экспорт",
  generateRoadmap: "Сгенерировать дорожную карту",
  generateSpec: "Сгенерировать спецификацию",
  open: "Открыть",
  openExecution: "Настроить параметры",
  openQuestionnaire: "Ответить на вопросы",
  openSpec: "Открыть спецификацию",
  openTasks: "Открыть задачи",
} as const;

export const workflowStateLabels = {
  available: "Доступно",
  completed: "Готово",
  current: "Следующий шаг",
  disabled: "Недоступно",
  locked: "Заблокировано",
  needs_action: "Нужно действие",
  not_ready: "Не готово",
  upcoming: "Позже",
} as const;

export function displayLabel(
  labels: Record<string, string>,
  value?: string | null,
  fallback = "Пока не выбрано",
) {
  if (!value) {
    return fallback;
  }

  return labels[value] ?? value;
}
