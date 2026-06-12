"use client";

import { useState } from "react";

export function CopyButton({
  copiedLabel = "Скопировано",
  label = "Скопировать",
  text,
}: {
  copiedLabel?: string;
  label?: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--panel-border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      type="button"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
