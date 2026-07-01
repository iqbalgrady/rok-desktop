import React from "react"
import { Icon } from "@/components/icon/Icon"

interface PipelinePhase {
  id: string
  label: string
  icon: string
  description: string
  commands: string[]
}

const PHASES: PipelinePhase[] = [
  {
    id: "plan",
    label: "Plan",
    icon: "book-open",
    description: "Define scope, architecture, and test strategy before writing code.",
    commands: ["/pipeline plan", "/plan-feature"],
  },
  {
    id: "build",
    label: "Build",
    icon: "code-box",
    description: "Implement features with automated code generation and refactoring.",
    commands: ["/pipeline build", "/catch-up"],
  },
  {
    id: "test",
    label: "Test",
    icon: "flask",
    description: "Auto-generate tests, run mutation testing, and verify coverage.",
    commands: ["/test-gen", "/typecheck"],
  },
  {
    id: "review",
    label: "Review",
    icon: "shield-check",
    description: "Deep code review, security scan, and convention checks.",
    commands: ["/review", "/workspace-review"],
  },
  {
    id: "commit",
    label: "Commit",
    icon: "git-branch",
    description: "Stage, commit with AI-generated messages, push, and create PR.",
    commands: ["/pr", "/handoff-review"],
  },
]

export const SdlcPipelineDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="typography-ui-header font-semibold text-foreground text-lg">
          SDLC Pipeline
        </h2>
        <p className="typography-ui text-muted-foreground">
          Structured software development lifecycle with gate checks at each phase. Trigger from chat or run end-to-end.
        </p>
      </div>

      {/* Pipeline visual */}
      <div className="space-y-0">
        {PHASES.map((phase, index) => {
          const isLast = index === PHASES.length - 1
          return (
            <div key={phase.id}>
              <div className="flex gap-3">
                {/* Connector line */}
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-2 ${
                    index === 0 ? "bg-primary/10 ring-1 ring-primary/20" : "bg-[var(--surface-elevated)]"
                  }`}>
                    <Icon name={phase.icon as any} className={`h-5 w-5 ${
                      index === 0 ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                </div>

                {/* Phase content */}
                <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
                  <div className="rounded-lg border border-border bg-[var(--surface-elevated)] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="typography-meta font-mono text-muted-foreground">
                          Phase {index + 1}
                        </span>
                        <h3 className="typography-ui-label font-semibold text-foreground">{phase.label}</h3>
                      </div>
                      <span className="typography-micro text-muted-foreground/50">
                        Gate {index + 1}/5
                      </span>
                    </div>
                    <p className="typography-micro text-muted-foreground/70 mb-3">{phase.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {phase.commands.map((cmd) => (
                        <code
                          key={cmd}
                          className="typography-micro text-xs bg-[var(--surface-raised)] text-muted-foreground px-2 py-0.5 rounded font-mono"
                        >
                          {cmd}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Run full pipeline */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Icon name="play-circle" className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div>
            <div className="typography-ui-label text-foreground flex items-center gap-2">
              Run Full Pipeline
              <code className="typography-micro font-mono bg-[var(--surface-raised)] text-primary px-1.5 py-0.5 rounded">
                /pipeline
              </code>
            </div>
            <div className="typography-micro text-muted-foreground/70 mt-1">
              Execute all 5 phases sequentially — plan, build, test, review, and create a PR. Each phase gates the next on success.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
