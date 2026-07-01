import React from "react"
import { SettingsPageLayout } from "@/components/sections/shared/SettingsPageLayout"
import { useI18n } from "@/lib/i18n"
import { Icon } from "@/components/icon/Icon"
import { Switch } from "@/components/ui/Switch"
import { SecurityToolkitsDashboard } from "./SecurityToolkitsDashboard"
import { SdlcPipelineDashboard } from "./SdlcPipelineDashboard"
import { IntelligenceLayerDashboard } from "./IntelligenceLayerDashboard"

interface FeatureFlag {
  key: string
  title: string
  description: string
  icon: string
}

const FEATURES: FeatureFlag[] = [
  { key: "securityToolkits", title: "Security Toolkits", description: "Pentest, exploit, recon, forensics, and OSINT engines integrated into the agent workflow.", icon: "shield-keyhole" },
  { key: "sdlcPipeline", title: "SDLC Pipeline", description: "Plan → Build → Test → Review → Commit workflow with gate checks at each phase.", icon: "git-branch" },
  { key: "codingTools", title: "Coding Tools", description: "Quick-action buttons for code review, test generation, type checking, and convention scanning.", icon: "code-box" },
  { key: "modeSystem", title: "Mode & Persona System", description: "Switch between agent modes (training, security, coding) and customize personas.", icon: "robot-2" },
  { key: "intelligenceLayer", title: "Intelligence Layer", description: "Algorithmic reasoning, CS knowledge base, and documentation engine for advanced analysis.", icon: "brain-ai-3" },
]

type RokcodeTab = "features" | "security" | "sdlc" | "intelligence"

export const RokcodeSettings: React.FC = () => {
  const { t } = useI18n()
  const [enabledFeatures, setEnabledFeatures] = React.useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = React.useState<RokcodeTab>("features")

  React.useEffect(() => {
    fetch("/api/config/settings", { headers: { Accept: "application/json" } })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.rokcodeFeatures && typeof data.rokcodeFeatures === "object") {
          setEnabledFeatures(data.rokcodeFeatures)
        }
      })
      .catch(() => {})
  }, [])

  const handleToggle = React.useCallback(async (key: string, enabled: boolean) => {
    const next = { ...enabledFeatures, [key]: enabled }
    setEnabledFeatures(next)
    try {
      await fetch("/api/config/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rokcodeFeatures: next }),
      })
    } catch {
      setEnabledFeatures((prev) => ({ ...prev, [key]: !enabled }))
    }
  }, [enabledFeatures])

  return (
    <SettingsPageLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="typography-ui-header font-semibold text-foreground text-lg">
            {t("settings.page.rokcode.title")}
          </h2>
          <p className="typography-ui text-muted-foreground">
            Configure and explore rokcode-specific capabilities — security toolkits, SDLC pipeline, coding tools, and more.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border">
          {(["features", "security", "sdlc", "intelligence"] as RokcodeTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={
                tab === "features" ? "settings-3"
                : tab === "security" ? "shield-keyhole"
                : tab === "sdlc" ? "git-branch"
                : "brain-ai-3"
              } className="h-4 w-4" />
              {tab === "features" ? "Features"
                : tab === "security" ? "Security"
                : tab === "sdlc" ? "SDLC Pipeline"
                : "Intelligence"}
            </button>
          ))}
        </div>

        {activeTab === "features" ? (
          <div className="space-y-1">
            {FEATURES.map((feature) => {
              const enabled = enabledFeatures[feature.key] ?? false
              return (
                <div key={feature.key} className="flex items-center justify-between rounded-lg border border-border bg-[var(--surface-elevated)] p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon name={feature.icon as any} className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0">
                      <div className="typography-ui-label text-foreground">{feature.title}</div>
                      <div className="typography-micro text-muted-foreground/70">{feature.description}</div>
                    </div>
                  </div>
                  <Switch checked={enabled} onCheckedChange={(c: boolean) => handleToggle(feature.key, c)} />
                </div>
              )
            })}

            <div className="rounded-lg border border-border bg-[var(--surface-elevated)] p-4 mt-4">
              <div className="flex items-start gap-3">
                <Icon name="terminal-box" className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <div className="typography-ui-label text-foreground">Available Capabilities</div>
                  <div className="typography-micro text-muted-foreground/70">
                    13 coding tools, 8 security engines, 5 intelligence modules — activated features appear in the chat toolbar and agent workflows.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "security" ? (
          <SecurityToolkitsDashboard />
        ) : activeTab === "sdlc" ? (
          <SdlcPipelineDashboard />
        ) : (
          <IntelligenceLayerDashboard />
        )}
      </div>
    </SettingsPageLayout>
  )
}
