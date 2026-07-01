import React from "react"
import { Icon } from "@/components/icon/Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface CodingToolAction {
  id: string
  label: string
  icon: string
  description: string
  slashCommand: string
}

const CODING_TOOLS: CodingToolAction[] = [
  { id: "review", label: "Code Review", icon: "shield-check", description: "Review staged changes for bugs and code smells", slashCommand: "/review" },
  { id: "test-gen", label: "Generate Tests", icon: "flask", description: "Auto-generate unit tests for modified files", slashCommand: "/test-gen" },
  { id: "typecheck", label: "Type Check", icon: "code-box", description: "Run typecheck and show errors grouped by file", slashCommand: "/typecheck" },
  { id: "explain", label: "Explain Code", icon: "book-open", description: "Explain the selected file or function", slashCommand: "/explain" },
  { id: "pipeline", label: "SDLC Pipeline", icon: "git-branch", description: "Run plan → build → test → review → commit", slashCommand: "/pipeline" },
]

interface CodingToolsProps {
  footerIconButtonClass: string
  iconSizeClass: string
  onToolSelect: (slashCommand: string) => void
}

export const CodingTools: React.FC<CodingToolsProps> = ({
  footerIconButtonClass,
  iconSizeClass,
  onToolSelect,
}) => {
  const [open, setOpen] = React.useState(false)

  const handleSelect = React.useCallback(
    (tool: CodingToolAction) => {
      onToolSelect(tool.slashCommand)
      setOpen(false)
    },
    [onToolSelect],
  )

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={footerIconButtonClass}
          onClick={() => setOpen(!open)}
          aria-label="Coding tools"
        >
          <Icon name="code-ai" className={iconSizeClass} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" className="w-56 p-1">
        <div className="space-y-0.5">
          {CODING_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-[var(--interactive-hover)]"
              onClick={() => handleSelect(tool)}
            >
              <Icon name={tool.icon as any} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="typography-micro text-foreground">{tool.label}</div>
                <div className="typography-micro text-muted-foreground/50 truncate">{tool.description}</div>
              </div>
            </button>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
