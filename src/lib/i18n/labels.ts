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
