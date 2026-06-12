import type { Metadata } from "next";

import { PrototypeFeedback } from "@/components/prototype-feedback";

import "./globals.css";

export const metadata: Metadata = {
  title: "Prepare Development Cockpit",
  description:
    "Railway-ready SaaS foundation for preparing development specifications, roadmaps, tasks, and Codex prompts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PrototypeFeedback />
      </body>
    </html>
  );
}
