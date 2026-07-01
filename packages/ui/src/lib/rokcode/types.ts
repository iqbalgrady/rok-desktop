// Re-export ALL types from the original OpenCode SDK for full compatibility
// The UI codebase was written against these exact types.
// Our runtime adapter provides the same API surface.

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

// Additional types we define (not in SDK)
export type { RokcodeClient, PromptInput, PromptDelivery, HistoryEvent, StreamEvent, SseEvent } from "./api-client"
