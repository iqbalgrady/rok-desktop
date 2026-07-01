// Type definitions replacing @opencode-ai/sdk/v2 types
// These match the interface shapes used throughout the UI

export type { RokcodeClient } from "./api-client"
export type { Session, SessionListResult, PromptInput, PromptDelivery, SseEvent } from "./api-client"

// Placeholder types for OpenCode SDK compatibility
// Replace with actual rokcode types when available
export type Message = {
  id: string
  sessionID: string
  role: "user" | "assistant" | "system"
  parts: Part[]
  timeCreated?: number
  timeCompleted?: number
  status?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export type Part = {
  id: string
  type: string
  text?: string
  tool?: string
  toolID?: string
  state?: Record<string, unknown>
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export type TextPart = Part & { type: "text"; text: string }
export type ToolPart = Part & { type: "tool"; tool: string }
export type ReasoningPart = Part & { type: "reasoning"; text: string }

export type TextPartInput = { type: "text"; text: string }
export type FilePartInput = { type: "file"; uri: string; name?: string; description?: string }

export type Provider = {
  id: string
  name: string
  models: Array<{ id: string; name: string }>
  apiKey?: string
  baseURL?: string
  [key: string]: unknown
}

export type Agent = {
  name: string
  description?: string
  model?: string
  provider?: string
  instructions?: string
  tools?: string[]
  [key: string]: unknown
}

export type PermissionConfig = Record<string, unknown>

export type Config = Record<string, unknown>

export type Project = Record<string, unknown>

export type Event = {
  id?: string
  type: string
  payload?: unknown
  data?: unknown
  directory?: string
  [key: string]: unknown
}

export type SessionStatus = "idle" | "busy" | "done" | "error" | string

export type PermissionRequest = {
  id: string
  sessionID?: string
  tool?: string
  args?: Record<string, unknown>
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export type QuestionRequest = {
  id: string
  sessionID?: string
  question?: string
  options?: Array<{ label: string; value: string }>
  [key: string]: unknown
}

export type Todo = {
  id: string
  content: string
  status: string
  sessionID?: string
  [key: string]: unknown
}

export type McpStatus = {
  servers?: Array<{ name: string; status: string }>
  [key: string]: unknown
}

export type VcsInfo = Record<string, unknown>

export type OpencodeClient = import("./api-client").RokcodeClient
