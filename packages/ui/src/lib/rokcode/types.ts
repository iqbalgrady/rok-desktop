// Re-export types from OpenCode SDK for full type compatibility
// @opencode-ai/sdk is a devDependency — used only for types at build time, never in runtime

export type {
  Session,
  Message,
  Part,
  TextPart,
  TextPartInput,
  FilePartInput,
  Provider,
  Agent,
  Config,
  Project,
  PermissionRequest,
  QuestionRequest,
  Todo,
  McpStatus,
  VcsInfo,
  PermissionConfig,
  OpencodeClient,
} from "@opencode-ai/sdk/v2"

export type { RokcodeClient, PromptInput, PromptDelivery, HistoryEvent, StreamEvent, SseEvent } from "./api-client"
