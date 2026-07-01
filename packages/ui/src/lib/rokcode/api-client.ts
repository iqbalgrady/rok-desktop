// Rokcode API client adapter — replaces @opencode-ai/sdk/v2
// Provides the same interface as OpencodeClient for seamless UI integration.

import { runtimeFetch } from "@/lib/runtime-fetch"
import { getRuntimeUrlResolver } from "@/lib/runtime-url"

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

// Session types — matched to rokcode server API response shapes
export interface Session {
  id: string
  projectID?: string
  title?: string
  directory?: string
  agent?: string
  model?: string
  location?: { directory?: string; workspaceID?: string }
  subpath?: string
  cost?: number
  tokens?: {
    input: number; output: number; reasoning: number
    cache?: { read: number; write: number }
  }
  time?: { created: number; updated: number }
  timeCreated?: number
  timeUpdated?: number
  worktree?: string
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface SessionListResult {
  data: Session[]
  nextCursor?: string
}

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

// Event types
export interface SseEvent {
  id?: string
  type: string
  data: Record<string, unknown>
}

export interface RokcodeClient {
  session: {
    list(input?: { workspace?: string; limit?: number; directory?: string; cursor?: string }): Promise<SessionListResult>
    create(input: SessionCreateInput): Promise<Session>
    get(id: string): Promise<Session>
    prompt(id: string, input: PromptInput): Promise<PromptDelivery>
    abort(id: string): Promise<void>
    fork(id: string, input?: { messageID?: string }): Promise<Session>
    compact(id: string): Promise<void>
    events(id: string, opts?: { signal?: AbortSignal; onEvent?: (e: SseEvent) => void }): Promise<{ stream: AsyncIterable<SseEvent> }>
    history(id: string, opts?: { limit?: number; after?: string }): Promise<unknown>
    context(id: string): Promise<unknown>
    interrupt(id: string): Promise<void>
    stage(id: string, input: { messageID: string; files?: unknown[] }): Promise<void>
    clear(id: string): Promise<void>
    commit(id: string): Promise<void>
    delete(id: string): Promise<void>
    update(id: string, input: Record<string, unknown>): Promise<void>
    status(): Promise<Record<string, unknown>>
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
    config: {
      get(): Promise<unknown>
    }
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
    read(path: string): Promise<unknown>
    list(path: string): Promise<unknown>
  }
  permission: {
    list(): Promise<unknown>
    reply(id: string, response: unknown): Promise<void>
  }
  question: {
    list(): Promise<unknown>
    reply(id: string, response: unknown): Promise<void>
    reject(id: string): Promise<void>
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
      list: (input) => http.get<SessionListResult>(`${API_PREFIX}/session${buildQuery(input)}`),
      create: (input) => http.post<Session>(`${API_PREFIX}/session`, input),
      get: (id) => http.get<Session>(`${API_PREFIX}/session/${id}`),
      prompt: (id, input) => http.post<PromptDelivery>(`${API_PREFIX}/session/${id}/prompt`, input),
      abort: (id) => http.post<void>(`${API_PREFIX}/session/${id}/interrupt`),
      fork: (id, input) => http.post<Session>(`${API_PREFIX}/session/${id}/fork`, input),
      compact: (id) => http.post<void>(`${API_PREFIX}/session/${id}/compact`),
      events: async (id, opts) => {
        const response = await http.stream(`${API_PREFIX}/session/${id}/event`, { signal: opts?.signal })
        const events = sseStream(response)
        return { stream: events }
      },
      history: (id, opts) => http.get(`${API_PREFIX}/session/${id}/history${buildQuery(opts)}`),
      context: (id) => http.get(`${API_PREFIX}/session/${id}/context`),
      interrupt: (id) => http.post<void>(`${API_PREFIX}/session/${id}/interrupt`),
      stage: (id, input) => http.post<void>(`${API_PREFIX}/session/${id}/revert/stage`, input),
      clear: (id) => http.post<void>(`${API_PREFIX}/session/${id}/revert/clear`),
      commit: (id) => http.post<void>(`${API_PREFIX}/session/${id}/revert/commit`),
      delete: (id) => http.delete<void>(`${API_PREFIX}/session/${id}`),
      update: (id, input) => http.patch<void>(`${API_PREFIX}/session/${id}`, input),
      status: () => http.get(`${API_PREFIX}/session/active`),
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
      read: (path) => http.get(`${API_PREFIX}/file?path=${encodeURIComponent(path)}`),
      list: (path) => http.get(`${API_PREFIX}/file/list?path=${encodeURIComponent(path)}`),
    },
    permission: {
      list: () => http.get(`${API_PREFIX}/permission`),
      reply: (id, response) => http.post<void>(`${API_PREFIX}/permission/${id}`, response),
    },
    question: {
      list: () => http.get(`${API_PREFIX}/question`),
      reply: (id, response) => http.post<void>(`${API_PREFIX}/question/${id}`, response),
      reject: (id) => http.post<void>(`${API_PREFIX}/question/${id}/reject`),
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
