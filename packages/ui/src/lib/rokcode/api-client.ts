// Rokcode API client adapter — self-contained, no external SDK dependency
// Provides the same interface as OpencodeClient for seamless UI integration.

import { runtimeFetch } from "@/lib/runtime-fetch"
import { getRuntimeUrlResolver } from "@/lib/runtime-url"
import type { Session } from "./types"

export { runtimeFetch }

const API_PREFIX = "/api"

export interface RokcodeClientOptions {
  baseUrl: string
  directory?: string
  fetch?: typeof fetch
  headers?: HeadersInit
}

type FetchFn = typeof fetch

function resolveBaseUrl(candidate: string): string {
  const trimmed = candidate?.trim() || `${API_PREFIX}`
  if (/^https?:\/\//.test(trimmed)) return trimmed
  if (typeof window === "undefined") return trimmed
  try {
    return new URL(trimmed, window.location.href).toString()
  } catch {
    return trimmed
  }
}

class RokcodeHttpClient {
  private baseUrl: string
  private fetch: FetchFn
  private headers: HeadersInit
  private directory: string | undefined

  constructor(options: RokcodeClientOptions) {
    this.baseUrl = resolveBaseUrl(options.baseUrl)
    this.fetch = options.fetch ?? runtimeFetch
    this.headers = options.headers ?? {}
    this.directory = options.directory
  }

  setDirectory(dir: string | undefined) {
    this.directory = dir
  }

  private buildHeaders(extra?: HeadersInit): HeadersInit {
    const result: Record<string, string> = { ...(this.headers as Record<string, string> || {}) }
    if (extra) Object.assign(result, extra as Record<string, string>)
    if (this.directory) result["x-rokcode-directory"] = this.directory
    return result
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await this.fetch(this.url(path), {
      ...init,
      headers: this.buildHeaders(init.headers),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Rokcode API error ${res.status}: ${text.slice(0, 200)}`)
    }
    const contentType = res.headers.get("content-type") || ""
    let json: any
    if (contentType.includes("application/json")) json = await res.json()
    else return res.text() as unknown as T
    return json?.data !== undefined ? json.data as T : json as T
  }

  async get<T>(path: string): Promise<T> { return this.request<T>(path) }
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined })
  }
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined })
  }
  async delete<T>(path: string): Promise<T> { return this.request<T>(path, { method: "DELETE" }) }

  stream(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetch(this.url(path), {
      ...init,
      headers: { ...this.headers, Accept: "text/event-stream", ...(init.headers as Record<string, string> || {}) },
    })
  }
}

// Session creation input (doesn't exist in SDK types)
export interface SessionCreateInput {
  id?: string
  agent?: string
  model?: string
  location?: { workspaceID?: string; directory?: string }
}

export interface PromptDelivery {
  id: string
  sessionID: string
  admittedSeq: number
  delivery: string
  timeCreated: number
  prompt: { text: string; files?: unknown[]; agents?: unknown[] }
}

export interface PromptInput {
  id?: string
  prompt: {
    text: string
    files?: Array<{ uri: string; name?: string; description?: string }>
    agents?: Array<{ name: string }>
  }
  delivery?: "steer" | "queue"
  resume?: boolean
}

export interface HistoryEvent {
  id: string
  type: string
  durable: { aggregateID: string; seq: number; version: number }
  data: { timestamp: number; sessionID: string; messageID?: string; prompt?: unknown; delivery?: string; [key: string]: unknown }
}

export interface StreamEvent {
  type: string
  properties?: Record<string, unknown>
  [key: string]: unknown
}

export interface SseEvent {
  id?: string
  type: string
  data: Record<string, unknown>
}

// --- Client interface (simplified — returns unwrapped data) ---
export interface RokcodeClient {
  session: {
    list(input?: { workspace?: string; limit?: number; directory?: string; cursor?: string }): Promise<Session[]>
    create(input: SessionCreateInput): Promise<Session>
    get(id: string): Promise<Session>
    prompt(id: string, input: PromptInput): Promise<PromptDelivery>
    abort(id: string): Promise<void>
    fork(id: string, input?: { messageID?: string }): Promise<Session>
    compact(id: string): Promise<void>
    events(id: string, opts?: { signal?: AbortSignal }): Promise<{ stream: AsyncIterable<SseEvent> }>
    history(id: string, opts?: { limit?: number; after?: string }): Promise<HistoryEvent[]>
    context(id: string): Promise<unknown>
    interrupt(id: string): Promise<void>
    active(): Promise<Record<string, { type: string }>>
    get(id: string): Promise<Session>
    delete(id: string): Promise<void>
    update(id: string, input: Record<string, unknown>): Promise<void>
    stage(id: string, input: { messageID: string; files?: unknown[] }): Promise<void>
    clear(id: string): Promise<void>
    commit(id: string): Promise<void>
    status(id: string): Promise<{ type: string }>
    todo(id: string): Promise<unknown>
    summarize(id: string, input?: unknown): Promise<unknown>
    command(id: string, input: unknown): Promise<unknown>
    shell(id: string, input: unknown): Promise<unknown>
    revert(id: string, input: unknown): Promise<unknown>
    unrevert(id: string): Promise<void>
    messages(id: string, opts?: unknown): Promise<unknown>
    message(id: string, messageID: string): Promise<unknown>
    switchAgent(id: string, agent: string): Promise<void>
    switchModel(id: string, model: string): Promise<void>
  }
  global: {
    event(opts?: { signal?: AbortSignal }): Promise<{ stream: AsyncIterable<SseEvent> }>
    config: { get(): Promise<unknown> }
  }
  config: {
    get(): Promise<unknown>
    update(input: unknown): Promise<void>
    providers(): Promise<unknown>
    reload(): Promise<void>
  }
  project: {
    current(): Promise<unknown>
    list(): Promise<unknown>
  }
  file: {
    read(input: { path: string }): Promise<unknown>
    list(input: { path: string }): Promise<unknown>
    write(input: { path: string; content: string }): Promise<void>
  }
  permission: {
    list(): Promise<unknown>
    reply(input: { id: string; response: unknown }): Promise<void>
  }
  question: {
    list(): Promise<unknown>
    reply(input: { id: string; response: unknown }): Promise<void>
    reject(input: { id: string }): Promise<void>
  }
  tool: {
    ids(): Promise<string[]>
  }
  mcp: {
    status(): Promise<unknown>
  }
  command: {
    list(): Promise<unknown>
  }
  vcs: {
    get(): Promise<unknown>
  }
  app: {
    agents(): Promise<unknown>
  }
    lsp: {
      status(): Promise<unknown>
    }
    path: {
      get(): Promise<{ home: string; [key: string]: unknown }>
    }
  }

// --- SSE stream helper ---
async function* sseStream(response: Response): AsyncIterable<SseEvent> {
  const reader = response.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  let buffer = ""
  let currentId = ""
  let currentType = ""
  let currentData = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("id:")) currentId = line.slice(3).trim()
        else if (line.startsWith("event:")) currentType = line.slice(6).trim()
        else if (line.startsWith("data:")) currentData += (currentData ? "\n" : "") + line.slice(5).trim()
        else if (line === "") {
          if (currentData) {
            try {
              yield {
                id: currentId || undefined,
                type: currentType || "message",
                data: JSON.parse(currentData),
              }
            } catch { /* skip malformed */ }
          }
          currentId = ""
          currentType = ""
          currentData = ""
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// --- Client factory ---
export function createRokcodeClient(options: RokcodeClientOptions): RokcodeClient {
  const http = new RokcodeHttpClient(options)

  return {
    session: {
      list: (input) => http.get<Session[]>(`${API_PREFIX}/session${buildQuery(input)}`),
      create: (input) => http.post<Session>(`${API_PREFIX}/session`, input),
      get: (id) => http.get<Session>(`${API_PREFIX}/session/${id}`),
      prompt: (id, input) => http.post<PromptDelivery>(`${API_PREFIX}/session/${id}/prompt`, input),
      abort: (id) => http.post<void>(`${API_PREFIX}/session/${id}/interrupt`),
      fork: (id, input) => http.post<Session>(`${API_PREFIX}/session/${id}/fork`, input),
      compact: (id) => http.post<void>(`${API_PREFIX}/session/${id}/compact`),
      events: async (id, opts) => {
        const response = await http.stream(`${API_PREFIX}/session/${id}/event`, { signal: opts?.signal })
        return { stream: sseStream(response) }
      },
      history: (id, opts) => http.get<HistoryEvent[]>(`${API_PREFIX}/session/${id}/history${buildQuery(opts)}`),
      context: (id) => http.get(`${API_PREFIX}/session/${id}/context`),
      interrupt: (id) => http.post<void>(`${API_PREFIX}/session/${id}/interrupt`),
      active: () => http.get<Record<string, { type: string }>>(`${API_PREFIX}/session/active`),
      status: (id) => http.get<{ type: string }>(`${API_PREFIX}/session/${id}/status`),
      stage: (id, input) => http.post<void>(`${API_PREFIX}/session/${id}/revert/stage`, input),
      clear: (id) => http.post<void>(`${API_PREFIX}/session/${id}/revert/clear`),
      commit: (id) => http.post<void>(`${API_PREFIX}/session/${id}/revert/commit`),
      delete: (id) => http.delete<void>(`${API_PREFIX}/session/${id}`),
      update: (id, input) => http.patch<void>(`${API_PREFIX}/session/${id}`, input),
      todo: (id) => http.get(`${API_PREFIX}/session/${id}/todo`),
      summarize: (id, input) => http.post(`${API_PREFIX}/session/${id}/summarize`, input),
      command: (id, input) => http.post(`${API_PREFIX}/session/${id}/command`, input),
      shell: (id, input) => http.post(`${API_PREFIX}/session/${id}/shell`, input),
      revert: (id, input) => http.post(`${API_PREFIX}/session/${id}/revert`, input),
      unrevert: (id) => http.post<void>(`${API_PREFIX}/session/${id}/unrevert`),
      messages: (id, opts) => http.get(`${API_PREFIX}/session/${id}/message${buildQuery(opts)}`),
      message: (id, msgID) => http.get(`${API_PREFIX}/session/${id}/message/${msgID}`),
      switchAgent: (id, agent) => http.post<void>(`${API_PREFIX}/session/${id}/agent`, { agent }),
      switchModel: (id, model) => http.post<void>(`${API_PREFIX}/session/${id}/model`, { model }),
    },
    global: {
      event: async (opts) => {
        const response = await http.stream(`${API_PREFIX}/event`, { signal: opts?.signal })
        return { stream: sseStream(response) }
      },
      config: { get: () => http.get(`${API_PREFIX}/global/config`) },
    },
    config: {
      get: () => http.get(`${API_PREFIX}/config`),
      update: (input) => http.patch(`${API_PREFIX}/config`, input),
      providers: () => http.get(`${API_PREFIX}/config/providers`),
      reload: () => http.post<void>(`${API_PREFIX}/config/reload`),
    },
    project: {
      current: () => http.get(`${API_PREFIX}/project/current`),
      list: () => http.get(`${API_PREFIX}/project/list`),
    },
    file: {
      read: (input) => http.get(`${API_PREFIX}/file?path=${encodeURIComponent(input.path)}`),
      list: (input) => http.get(`${API_PREFIX}/file/list?path=${encodeURIComponent(input.path)}`),
      write: (input) => http.post<void>(`${API_PREFIX}/file`, input),
    },
    permission: {
      list: () => http.get(`${API_PREFIX}/permission`),
      reply: (input) => http.post<void>(`${API_PREFIX}/permission/${input.id}`, input.response),
    },
    question: {
      list: () => http.get(`${API_PREFIX}/question`),
      reply: (input) => http.post<void>(`${API_PREFIX}/question/${input.id}`, input.response),
      reject: (input) => http.post<void>(`${API_PREFIX}/question/${input.id}/reject`),
    },
    tool: {
      ids: () => http.get<string[]>(`${API_PREFIX}/tool/ids`),
    },
    mcp: {
      status: () => http.get(`${API_PREFIX}/mcp/status`),
    },
    command: {
      list: () => http.get(`${API_PREFIX}/command/list`),
    },
    vcs: {
      get: () => http.get(`${API_PREFIX}/vcs`),
    },
    app: {
      agents: () => http.get(`${API_PREFIX}/agent`),
    },
    lsp: {
      status: () => http.get(`${API_PREFIX}/lsp/status`),
    },
    path: {
      get: () => http.get<{ home: string; [key: string]: unknown }>(`${API_PREFIX}/path`),
    },
  } satisfies RokcodeClient
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return ""
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  if (entries.length === 0) return ""
  const search = new URLSearchParams()
  for (const [k, v] of entries) search.set(k, String(v))
  return `?${search.toString()}`
}
