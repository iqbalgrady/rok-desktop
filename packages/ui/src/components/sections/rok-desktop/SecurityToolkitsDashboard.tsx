import React from "react"
import { Icon } from "@/components/icon/Icon"

interface SecurityTool {
  id: string
  label: string
  icon: string
  description: string
  category: "pentest" | "exploit" | "recon" | "forensics" | "osint" | "wireless"
}

const TOOLS: SecurityTool[] = [
  { id: "portscan", label: "Port Scanner", icon: "radar", description: "TCP port scan with service detection", category: "recon" },
  { id: "service-probe", label: "Service Probe", icon: "fingerprint", description: "Deep-probe service versions and vulnerabilities", category: "recon" },
  { id: "subdomain-enum", label: "Subdomain Enum", icon: "global", description: "DNS subdomain enumeration and discovery", category: "recon" },
  { id: "dir-bruteforce", label: "Directory Bruteforce", icon: "folder-search", description: "Web directory and file bruteforce", category: "recon" },

  { id: "sqli", label: "SQL Injection", icon: "database-2", description: "SQLi payload delivery and exploitation", category: "exploit" },
  { id: "xss", label: "XSS Attack", icon: "code-sslash", description: "Cross-site scripting payload injection", category: "exploit" },
  { id: "rce", label: "Remote Code Exec", icon: "terminal-box", description: "RCE payload generation and delivery", category: "exploit" },
  { id: "ssrf", label: "SSRF Attack", icon: "server", description: "Server-side request forgery exploitation", category: "exploit" },

  { id: "privesc", label: "Privilege Escalation", icon: "arrow-up", description: "SUID, sudo, kernel exploit checks", category: "pentest" },
  { id: "persistence", label: "Persistence", icon: "history", description: "SSH keys, cron, systemd, registry backdoors", category: "pentest" },
  { id: "lateral", label: "Lateral Movement", icon: "arrow-left-right", description: "SSH pivot, SMB, pass-the-hash", category: "pentest" },

  { id: "metadata", label: "Metadata Extract", icon: "file-info", description: "EXIF, PDF, Office document metadata", category: "forensics" },
  { id: "carve", label: "File Carving", icon: "archive", description: "Recover files by magic byte signature", category: "forensics" },
  { id: "stegano", label: "Steganography", icon: "eye", description: "Detect and extract hidden data in files", category: "forensics" },

  { id: "domain-intel", label: "Domain Intel", icon: "search", description: "WHOIS, DNS records, SSL history", category: "osint" },
  { id: "email-breach", label: "Breach Check", icon: "mail", description: "Email credential leak detection", category: "osint" },
  { id: "social-lookup", label: "Social Lookup", icon: "user-smile", description: "Username check across 50+ platforms", category: "osint" },

  { id: "wifi-scan", label: "WiFi Scan", icon: "wifi", description: "Network discovery and AP enumeration", category: "wireless" },
  { id: "deauth", label: "Deauth Attack", icon: "wifi-off", description: "Client deauthentication attack", category: "wireless" },
  { id: "evil-twin", label: "Evil Twin", icon: "ghost", description: "Rogue AP with credential capture", category: "wireless" },
]

const CATEGORY_ICONS: Record<string, string> = {
  pentest: "shield-keyhole",
  exploit: "bug",
  recon: "radar",
  forensics: "search",
  osint: "global",
  wireless: "wifi",
}

const CATEGORY_LABELS: Record<string, string> = {
  pentest: "Pentest",
  exploit: "Exploit",
  recon: "Recon",
  forensics: "Forensics",
  osint: "OSINT",
  wireless: "Wireless",
}

export const SecurityToolkitsDashboard: React.FC = () => {
  const categories = [...new Set(TOOLS.map((t) => t.category))]

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-3 sm:p-6 sm:pt-8">
        <div className="space-y-2">
          <h2 className="typography-ui-header font-semibold text-foreground text-lg">
            Security Toolkits
          </h2>
          <p className="typography-ui text-muted-foreground">
            Integrated penetration testing, exploit, reconnaissance, forensics, and OSINT engines. Available as agent tools during sessions.
          </p>
        </div>

        {categories.map((category) => {
          const tools = TOOLS.filter((t) => t.category === category)
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name={CATEGORY_ICONS[category] as any} className="h-4 w-4" />
                <span className="typography-ui-label font-medium">{CATEGORY_LABELS[category]}</span>
                <span className="typography-micro text-muted-foreground/50">({tools.length} tools)</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-[var(--surface-elevated)] p-3 hover:bg-[var(--interactive-hover)] transition-colors cursor-pointer"
                  >
                    <Icon name={tool.icon as any} className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="min-w-0">
                      <div className="typography-micro font-medium text-foreground">{tool.label}</div>
                      <div className="typography-micro text-muted-foreground/50">{tool.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="rounded-lg border border-border bg-[var(--surface-elevated)] p-4">
          <div className="flex items-start gap-3">
            <Icon name="terminal-box" className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
            <div>
              <div className="typography-ui-label text-foreground">Usage in Sessions</div>
              <div className="typography-micro text-muted-foreground/70">
                All tools are available as agent commands during active sessions. Type <code className="text-xs bg-[var(--surface-raised)] px-1 py-0.5 rounded">/pentest</code>,{" "}
                <code className="text-xs bg-[var(--surface-raised)] px-1 py-0.5 rounded">/recon</code>, or{" "}
                <code className="text-xs bg-[var(--surface-raised)] px-1 py-0.5 rounded">/exploit</code> to invoke them. Results appear inline in the chat with structured output.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
