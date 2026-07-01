import React from "react"
import { Icon } from "@/components/icon/Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ModeDefinition {
  id: string
  label: string
  icon: string
  description: string
}

const MODES: ModeDefinition[] = [
  { id: "default", label: "Default", icon: "robot-2", description: "General-purpose coding assistant" },
  { id: "security", label: "Security", icon: "shield-keyhole", description: "Pentest, exploit, recon, and forensics focus" },
  { id: "sdlc", label: "SDLC", icon: "git-branch", description: "Plan → Build → Test → Review → Commit pipeline" },
  { id: "code-review", label: "Code Review", icon: "shield-check", description: "Deep code review and bug detection" },
  { id: "training", label: "Training", icon: "book-open", description: "AI training and documentation mode" },
  { id: "intelligence", label: "Intelligence", icon: "brain-ai-3", description: "Algorithmic reasoning and CS knowledge" },
]

interface ModeSelectorProps {
  footerIconButtonClass: string
  iconSizeClass: string
  currentMode: string | undefined
  onModeChange: (mode: string | undefined) => void
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  footerIconButtonClass,
  iconSizeClass,
  currentMode,
  onModeChange,
}) => {
  const [open, setOpen] = React.useState(false)
  const activeMode = MODES.find((m) => m.id === currentMode)
  const isDefault = !currentMode || currentMode === "default"

  const handleSelect = (modeId: string | undefined) => {
    onModeChange(modeId === "default" ? undefined : modeId)
    setOpen(false)
  }

  return (
    <Tooltip delayDuration={600}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(footerIconButtonClass, "gap-1 px-1.5 w-auto")}
              aria-label="Select mode"
            >
              <Icon
                name={activeMode?.icon as any || "robot-2"}
                className={cn(iconSizeClass, isDefault && "text-muted-foreground")}
              />
              {activeMode && !isDefault && (
                <span className="typography-micro font-medium text-foreground truncate max-w-[60px]">
                  {activeMode.label}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <DropdownMenuContent align="end" alignOffset={-40} className="w-[min(220px,calc(100vw-2rem))]">
          <DropdownMenuLabel className="typography-ui-header font-semibold text-foreground">
            Agent Mode
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="typography-meta"
            onSelect={() => handleSelect(undefined)}
          >
            <div className="flex items-center justify-between gap-2 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="robot-2" className="size-4 flex-shrink-0 text-muted-foreground" />
                <span className="typography-meta font-medium text-foreground truncate min-w-0">Default</span>
              </div>
              {isDefault && <Icon name="check" className="size-4 text-primary flex-shrink-0" />}
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {MODES.filter((m) => m.id !== "default").map((mode) => {
            const selected = currentMode === mode.id
            return (
              <DropdownMenuItem
                key={mode.id}
                className="typography-meta"
                onSelect={() => handleSelect(mode.id)}
              >
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name={mode.icon as any} className="size-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="typography-meta font-medium text-foreground truncate">{mode.label}</div>
                      <div className="typography-micro text-muted-foreground/50 truncate">{mode.description}</div>
                    </div>
                  </div>
                  {selected && <Icon name="check" className="size-4 text-primary flex-shrink-0" />}
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent side="top">
        <p className="typography-meta">
          Mode: {activeMode?.label || "Default"}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
