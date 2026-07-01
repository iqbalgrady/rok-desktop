import React from "react"
import { Icon } from "@/components/icon/Icon"

interface IntelligenceModule {
  id: string
  label: string
  icon: string
  description: string
}

const MODULES: IntelligenceModule[] = [
  { id: "algorithmic-reasoning", label: "Algorithmic Reasoning", icon: "brain-ai-3", description: "Multi-step reasoning, problem decomposition, and algorithmic solution design for complex engineering tasks." },
  { id: "cs-knowledge", label: "CS Knowledge Base", icon: "book-open", description: "Curated computer science knowledge — data structures, algorithms, design patterns, and system design principles." },
  { id: "documentation-engine", label: "Documentation Engine", icon: "file-text", description: "Auto-generate comprehensive docs, API references, architecture diagrams, and changelogs from code." },
  { id: "code-explain", label: "Code Explanation", icon: "code-box", description: "Deep-dive code analysis — trace execution paths, explain design decisions, and map dependency graphs." },
  { id: "convention-learning", label: "Convention Learning", icon: "booklet", description: "Learn project conventions from codebase patterns — naming, error handling, imports, and file structure." },
]

export const IntelligenceLayerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="typography-ui-header font-semibold text-foreground text-lg">
          Intelligence Layer
        </h2>
        <p className="typography-ui text-muted-foreground">
          Advanced reasoning, knowledge integration, and analysis capabilities that power the agent's understanding of complex codebases.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((mod) => (
          <div
            key={mod.id}
            className="rounded-lg border border-border bg-[var(--surface-elevated)] p-4 hover:bg-[var(--interactive-hover)] transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon name={mod.icon as any} className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="typography-ui-label text-foreground">{mod.label}</div>
                <div className="typography-micro text-muted-foreground/70 mt-1">{mod.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Token Economy */}
      <div className="rounded-lg border border-border bg-[var(--surface-elevated)] p-4">
        <div className="flex items-start gap-3">
          <Icon name="coins" className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
          <div>
            <div className="typography-ui-label text-foreground">Token Economy</div>
            <div className="typography-micro text-muted-foreground/70 mt-1">
              The intelligence layer optimizes token usage by caching reasoning results, sharing context across sessions, and prioritizing high-value analysis. Token budgets are managed per-session with cost tracking.
            </div>
          </div>
        </div>
      </div>

      {/* Training Mode */}
      <div className="rounded-lg border border-border bg-[var(--surface-elevated)] p-4">
        <div className="flex items-start gap-3">
          <Icon name="graduation-cap" className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
          <div>
            <div className="typography-ui-label text-foreground">Training & Persona System</div>
            <div className="typography-micro text-muted-foreground/70 mt-1">
              Customize agent behavior through persona profiles. Training mode enables the agent to learn from interactions and improve over time. Switch modes to match your workflow — coding, security, or documentation.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
