import Link from "next/link";

import { appConfig } from "@/config/app";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/feature-card";
import { FlowStep } from "@/components/flow-step";
import { SectionHeader } from "@/components/section-header";

const flow = [
  "Idea",
  "Smart Questions",
  "Editable Spec",
  "Roadmap",
  "Tasks",
  "Codex Prompts",
  "QA Options",
  "Linear Export",
];

const features = [
  {
    accent: "#0f766e",
    title: "Spec-first planning",
    description:
      "Keep the editable specification as the working source of truth before roadmap and task generation begin.",
  },
  {
    accent: "#2563eb",
    title: "Implementation-ready tasks",
    description:
      "Shape future task output around scope, acceptance criteria, repository readiness, and Codex handoff prompts.",
  },
  {
    accent: "#c2410c",
    title: "QA choices up front",
    description:
      "Make quality expectations explicit with planned Off, Minimal, Standard, Strict, and Custom QA modes.",
  },
];

const howItWorks = [
  {
    title: "Clarify the idea",
    description:
      "The future workflow starts with a plain-language product idea and focused clarification questions.",
  },
  {
    title: "Review the spec",
    description:
      "The user edits and approves the specification before any roadmap or implementation task is created.",
  },
  {
    title: "Package the work",
    description:
      "Roadmap, tasks, Codex prompts, QA guidance, and Linear-ready exports become a connected artifact bundle.",
  },
];

export function LandingPage() {
  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--panel-border)] bg-[var(--nav-surface)] backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">
              PDC
            </span>
            <span className="text-sm font-semibold">{appConfig.name}</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-[var(--muted)] md:flex">
            <a href="#flow">Flow</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <Button href="/app" variant="secondary">
            Open workspace
          </Button>
        </nav>
      </header>

      <section className="relative isolate min-h-[760px] overflow-hidden border-b border-[var(--panel-border)]">
        <div className="absolute inset-0 bg-[var(--hero-surface)]" />
        <div className="absolute inset-x-4 top-28 bottom-10 hidden rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-2xl lg:block">
          <div className="grid h-full grid-cols-[17rem_1fr]">
            <aside className="border-r border-[var(--panel-border)] bg-[var(--workspace-rail)] p-5">
              <div className="h-9 w-28 rounded-md bg-[var(--foreground)]" />
              <div className="mt-8 grid gap-3">
                {["Workspace", "Spec", "Roadmap", "Tasks", "QA"].map((item) => (
                  <div
                    className="flex items-center gap-3 rounded-md bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)]"
                    key={item}
                  >
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    {item}
                  </div>
                ))}
              </div>
            </aside>
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-5">
                <div>
                  <div className="h-3 w-32 rounded bg-[var(--soft-accent)]" />
                  <div className="mt-3 h-7 w-72 rounded bg-[var(--foreground)]" />
                </div>
                <div className="h-10 w-36 rounded-md bg-[var(--accent)]" />
              </div>
              <div className="grid gap-5 pt-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-[var(--panel-border)] p-5">
                  <div className="h-4 w-40 rounded bg-[var(--foreground)]" />
                  <div className="mt-5 grid gap-3">
                    {flow.slice(0, 5).map((item, index) => (
                      <div
                        className="flex items-center gap-3 rounded-md border border-[var(--panel-border)] p-3"
                        key={item}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--soft-accent)] text-xs font-semibold text-[var(--accent-strong)]">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-5">
                  <div className="rounded-lg border border-[var(--panel-border)] p-5">
                    <div className="h-4 w-28 rounded bg-[var(--foreground)]" />
                    <div className="mt-5 space-y-3">
                      <div className="h-3 rounded bg-[var(--line-soft)]" />
                      <div className="h-3 rounded bg-[var(--line-soft)]" />
                      <div className="h-3 w-2/3 rounded bg-[var(--line-soft)]" />
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--panel-border)] p-5">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 rounded bg-[var(--foreground)]" />
                      <div className="h-7 w-20 rounded-full bg-[var(--soft-warning)]" />
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="h-16 rounded-md bg-[var(--soft-accent)]" />
                      <div className="h-16 rounded-md bg-[var(--soft-blue)]" />
                      <div className="h-16 rounded-md bg-[var(--soft-warning)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-center px-5 py-20 sm:px-8">
          <div className="max-w-4xl pt-12">
            <p className="w-fit rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              Phase 0 SaaS shell
            </p>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-tight tracking-normal sm:text-6xl lg:text-7xl">
              Prepare Development Cockpit
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-[var(--muted)]">
              From idea to editable spec, roadmap, tasks, Codex prompts and
              Linear-ready exports.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/app">View workspace shell</Button>
              <Button href="#flow" variant="secondary">
                Explore product flow
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8" id="flow">
        <SectionHeader
          description="The planned experience keeps each artifact connected to the previous decision, so implementation work starts from reviewed context."
          eyebrow="Product flow"
          title="One connected path from idea to execution"
        />
        <div className="mt-10 grid gap-3 md:grid-cols-4">
          {flow.map((item, index) => (
            <div
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] p-4"
              key={item}
            >
              <p className="text-sm font-semibold text-[var(--accent-strong)]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="border-y border-[var(--panel-border)] bg-[var(--section-surface)]"
        id="features"
      >
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <SectionHeader
            description="PDC-002 is a UI foundation only, but it presents the product promises that later phases will implement."
            eyebrow="Key features"
            title="Built for development preparation, not generic documents"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8" id="how-it-works">
        <SectionHeader
          description="The shell shows where the future workflow will live while keeping implementation logic out of Phase 0."
          eyebrow="How it works"
          title="Clarify, approve, then package the work"
        />
        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
          {howItWorks.map((step, index) => (
            <FlowStep
              description={step.description}
              index={index + 1}
              key={step.title}
              title={step.title}
            />
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--foreground)] p-8 text-[var(--background)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-[var(--cta-muted)]">
                Ready for the next Phase 0 task
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold sm:text-4xl">
                The visual shell is ready to support Railway deployment baseline
                work.
              </h2>
            </div>
            <Button
              className="bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--panel-border)]"
              href="/app"
            >
              Open workspace shell
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--panel-border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>{appConfig.name}</p>
          <p>Railway-first SaaS foundation. No generation logic in PDC-002.</p>
        </div>
      </footer>
    </main>
  );
}
