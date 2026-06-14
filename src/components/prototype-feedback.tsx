"use client";

import { usePathname } from "next/navigation";

export function PrototypeFeedback() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <a
      aria-label="Отправить feedback по прототипу"
      className="fixed right-3 top-20 z-30 inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-lg transition hover:border-[var(--accent)] sm:bottom-4 sm:right-4 sm:top-auto sm:px-4"
      href="mailto:feedback@example.com?subject=Prepare%20Development%20Cockpit%20feedback"
    >
      Обратная связь
    </a>
  );
}
