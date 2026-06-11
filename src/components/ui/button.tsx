import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/classnames";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-strong)]",
  secondary:
    "border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]",
  ghost:
    "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]",
};

export function Button({
  children,
  className,
  href,
  variant = "primary",
}: ButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition",
        variants[variant],
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
