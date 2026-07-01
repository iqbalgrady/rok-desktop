// Self-contained type definitions — NO dependency on @opencode-ai/sdk/v2
// These match the exact shapes the UI codebase expects

export type {
  RokcodeClient,
  PromptInput,
  PromptDelivery,
  HistoryEvent,
  StreamEvent,
  SseEvent,
  SdkResult,
} from "./api-client"

// --- Session ---
export type Session = {
  id: string; slug: string; projectID: string; workspaceID?: string
  directory: string; path?: string; parentID?: string
  summary?: { additions: number; deletions: number; files: number; diffs?: unknown[] }
  cost?: number; tokens?: { input: number; output: number; reasoning: number; cache: { read: number; write: number } }
  share?: { url: string }; title: string; agent?: string
  model?: { id: string; providerID: string; modelID?: string; variant?: string; [key: string]: unknown }
  version: string; metadata?: Record<string, unknown>
  time: { created: number; updated: number; compacting?: number; archived?: number }
  permission?: unknown; revert?: { messageID: string; files?: unknown[] }
  location?: { directory?: string; workspaceID?: string; [key: string]: unknown }
  worktree?: string; sandbox?: string; status?: string
  subpath?: string; project?: unknown
  [key: string]: unknown
}

// --- Message ---
export type Message = {
  id: string; sessionID: string
  role: "user" | "assistant" | "system" | string
  parts: Part[]; timeCreated?: number; timeCompleted?: number
  status?: string; metadata?: Record<string, unknown>
  [key: string]: unknown
}

// --- Part ---
export type Part = {
  id: string; type: string; text?: string; tool?: string
  toolID?: string; state?: Record<string, unknown>
  metadata?: Record<string, unknown>
  [key: string]: unknown
}
export type TextPart = Part & { type: "text"; text: string }
export type ToolPart = Part & { type: "tool"; tool: string }
export type ReasoningPart = Part & { type: "reasoning"; text: string }
export type TextPartInput = { type: "text"; text: string }
export type FilePartInput = { type: "file"; uri: string; name?: string; description?: string; [key: string]: unknown }

// --- Provider ---
export type Provider = {
  id: string; name: string
  models: Array<{ id: string; name: string; [key: string]: unknown }>
  apiKey?: string; baseURL?: string
  [key: string]: unknown
}

// --- Agent ---
export type Agent = {
  name: string; description?: string
  model?: { id?: string; providerID?: string; modelID?: string; variant?: string; [key: string]: unknown } | string
  provider?: string; instructions?: string
  tools?: string[]; permissions?: Record<string, unknown>
  [key: string]: unknown
}

// --- Config / Project / Event ---
export type Config = Record<string, unknown>
export type Project = { id?: string; directory?: string; worktree?: string; sandboxes?: unknown[]; [key: string]: unknown }
export type Event = {
  id?: string; type: string; payload?: unknown; data?: unknown
  directory?: string; properties?: Record<string, unknown>
  [key: string]: unknown
}
export type SessionStatus = "idle" | "busy" | "done" | "error" | "running" | string

// --- Permission / Question / Todo ---
export type PermissionRequest = { id: string; sessionID?: string; tool?: string; args?: Record<string, unknown>; metadata?: Record<string, unknown>; [key: string]: unknown }
export type PermissionConfig = Record<string, unknown>
export type QuestionRequest = { id: string; sessionID?: string; question?: string; options?: Array<{ label: string; value: string }>; [key: string]: unknown }
export type Todo = { id: string; content: string; status: string; sessionID?: string; [key: string]: unknown }

// --- MCP / VCS ---
export type McpStatus = { servers?: Array<{ name: string; status: string; [key: string]: unknown }>; [key: string]: unknown }
export type VcsInfo = Record<string, unknown>

// --- OpencodeClient (compatibility) ---
export type OpencodeClient = import("./api-client").RokcodeClient
