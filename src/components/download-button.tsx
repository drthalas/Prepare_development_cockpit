"use client";

export function DownloadButton({
  content,
  filename,
  label,
  mimeType,
}: {
  content: string;
  filename: string;
  label: string;
  mimeType: string;
}) {
  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
      onClick={() => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }}
      type="button"
    >
      {label}
    </button>
  );
}
