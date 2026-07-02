// Rokcode API client adapter — self-contained, no external SDK dependency
// Returns { data: T } wrapper matching SdkResult pattern for OpencodeService compatibility

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

// SdkResult wrapper — matches pattern expected by OpencodeService
export type SdkResult<T> = { data?: T; error?: unknown; response?: { status?: number } }

type FetchFn = typeof fetch

function resolveBaseUrl(candidate: string): string {
  const trimmed = candidate?.trim() || `${API_PREFIX}`
  if (/^https?:\/\//.test(trimmed)) return trimmed
  if (typeof window === "undefined") return trimmed
  try { return new URL(trimmed, window.location.href).toString() } catch { return trimmed }
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

  setDirectory(dir: string | undefined) { this.directory = dir }

  private buildHeaders(extra?: HeadersInit): HeadersInit {
    const result: Record<string, string> = { ...(this.headers as Record<string, string> || {}) }
    if (extra) Object.assign(result, extra as Record<string, string>)
    if (this.directory) result["x-rokcode-directory"] = this.directory
    return result
  }

  private url(path: string): string {
    const base = this.baseUrl.replace(/\/api\/?$/, '')
    return `${base}${path}`
  }

  async get<T>(path: string): Promise<SdkResult<T>> { return this.request<T>(path) }
  async post<T>(path: string, body?: unknown): Promise<SdkResult<T>> {
    return this.request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined })
  }
  async patch<T>(path: string, body?: unknown): Promise<SdkResult<T>> {
    return this.request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined })
  }
  async delete<T>(path: string): Promise<SdkResult<T>> { return this.request<T>(path, { method: "DELETE" }) }

  async stream(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetch(this.url(path), {
      ...init,
      headers: { ...this.headers, Accept: "text/event-stream", ...(init.headers as Record<string, string> || {}) },
    })
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<SdkResult<T>> {
    try {
      const res = await this.fetch(this.url(path), { ...init, headers: this.buildHeaders(init.headers) })
      const status = res.status
      const contentType = res.headers.get("content-type") || ""
      let data: any
      if (contentType.includes("application/json")) data = await res.json()
      else data = await res.text()
      if (!res.ok) {
        return { error: data, response: { status } }
      }
      return { data: data?.data !== undefined ? data.data as T : data as T, response: { status } }
    } catch (err) {
      return { error: err, response: { status: 0 } }
    }
  }
}

// Types
export interface SessionCreateInput { id?: string; agent?: string; model?: string; location?: { workspaceID?: string; directory?: string }; title?: string; parentID?: string; directory?: string; metadata?: Record<string, unknown>; [key: string]: unknown }
export interface PromptDelivery { id: string; sessionID: string; admittedSeq: number; delivery: string; timeCreated: number; prompt: { text: string; files?: unknown[]; agents?: unknown[] } }
export interface PromptInput { id?: string; prompt: { text: string; files?: Array<{ uri: string; name?: string; description?: string }>; agents?: Array<{ name: string }> }; delivery?: "steer" | "queue"; resume?: boolean }
export interface HistoryEvent { id: string; type: string; durable: { aggregateID: string; seq: number; version: number }; data: { timestamp: number; sessionID: string; messageID?: string; prompt?: unknown; delivery?: string; [key: string]: unknown } }
export interface StreamEvent { type: string; properties?: Record<string, unknown>; [key: string]: unknown }
export interface SseEvent { id?: string; type: string; data: Record<string, unknown> }

// --- Client interface — all methods return SdkResult<T> ---
// Session methods accept old-SDK object format { sessionID, directory, ... }
export interface RokcodeClient {
  session: {
    list(input?: { workspace?: string; limit?: number; directory?: string; cursor?: string }): Promise<SdkResult<Session[]>>
    create(input: SessionCreateInput): Promise<SdkResult<Session>>
    get(input: { sessionID: string; directory?: string }): Promise<SdkResult<Session>>
    prompt(input: PromptInput & { sessionID: string; directory?: string }): Promise<SdkResult<PromptDelivery>>
    promptAsync(input: PromptInput & { sessionID: string; directory?: string }): Promise<SdkResult<PromptDelivery>>
    abort(input: { sessionID: string; directory?: string }): Promise<SdkResult<void>>
    fork(input: { sessionID: string; messageID?: string; directory?: string }): Promise<SdkResult<Session>>
    compact(input: { sessionID: string; directory?: string }): Promise<SdkResult<void>>
    events(input: { sessionID: string; directory?: string }, opts?: { signal?: AbortSignal }): Promise<SdkResult<{ stream: AsyncIterable<SseEvent> }>>
    history(input: { sessionID: string; directory?: string; limit?: number; after?: string }): Promise<SdkResult<HistoryEvent[]>>
    context(input: { sessionID: string; directory?: string }): Promise<SdkResult<unknown>>
    interrupt(input: { sessionID: string; directory?: string }): Promise<SdkResult<void>>
    active(): Promise<SdkResult<Record<string, { type: string }>>>
    delete(input: { sessionID: string; directory?: string }): Promise<SdkResult<void>>
    update(input: { sessionID: string; directory?: string } & Record<string, unknown>): Promise<SdkResult<void>>
    stage(input: { sessionID: string; directory?: string; messageID: string; files?: unknown[] }): Promise<SdkResult<void>>
    clear(input: { sessionID: string; directory?: string }): Promise<SdkResult<void>>
    commit(input: { sessionID: string; directory?: string }): Promise<SdkResult<void>>
    status(input: { sessionID: string; directory?: string }): Promise<SdkResult<{ type: string }>>
    todo(input: { sessionID: string; directory?: string }): Promise<SdkResult<unknown>>
    summarize(input: { sessionID: string; directory?: string; providerID: string; modelID: string; auto?: boolean }): Promise<SdkResult<unknown>>
    command(input: { sessionID: string; directory?: string } & Record<string, unknown>): Promise<SdkResult<unknown>>
    shell(input: { sessionID: string; directory?: string } & Record<string, unknown>): Promise<SdkResult<unknown>>
    revert(input: { sessionID: string; directory?: string; messageID: string; partID?: string }): Promise<SdkResult<unknown>>
    unrevert(input: { sessionID: string; directory?: string }): Promise<SdkResult<void>>
    messages(input: { sessionID: string; directory?: string; limit?: number; before?: string }): Promise<SdkResult<unknown>>
    message(input: { sessionID: string; directory?: string; messageID: string }): Promise<SdkResult<unknown>>
    share(input: { sessionID: string; directory?: string }): Promise<SdkResult<unknown>>
    unshare(input: { sessionID: string; directory?: string }): Promise<SdkResult<unknown>>
    switchAgent(input: { sessionID: string; directory?: string; agent: string }): Promise<SdkResult<void>>
    switchModel(input: { sessionID: string; directory?: string; model: string }): Promise<SdkResult<void>>
  }
  global: {
    event(opts?: { signal?: AbortSignal }): Promise<SdkResult<{ stream: AsyncIterable<SseEvent> }>>
    config: { get(): Promise<SdkResult<unknown>> }
  }
  provider: {
    auth(input?: { sessionID?: string }): Promise<SdkResult<unknown>>
    list(): Promise<SdkResult<unknown>>
    disconnect(input: { providerID: string; sessionID?: string }): Promise<SdkResult<unknown>>
    oauth: { authorize(input: { providerID: string; sessionID?: string }): Promise<SdkResult<unknown>>; callback(input: { providerID: string; sessionID?: string; code: string }): Promise<SdkResult<unknown>> }
    sources(): Promise<SdkResult<unknown>>
  }
  config: {
    get(): Promise<SdkResult<unknown>>
    update(input: unknown): Promise<SdkResult<void>>
    providers(input?: Record<string, unknown>): Promise<SdkResult<unknown>>
    reload(): Promise<SdkResult<void>>
  }
  auth: {
    set(input: { password: string; trustDevice?: boolean; issueClientToken?: boolean; clientLabel?: string; clientKind?: string; dedupeKey?: string }): Promise<SdkResult<unknown>>
  }
  project: {
    current(): Promise<SdkResult<{ worktree?: string; sandboxes?: unknown[]; directory?: string; [key: string]: unknown }>>
    list(): Promise<SdkResult<unknown>>
  }
  file: {
    read(input: { path: string }): Promise<SdkResult<unknown>>
    list(input: { path: string }): Promise<SdkResult<unknown>>
    write(input: { path: string; content: string }): Promise<SdkResult<void>>
  }
  permission: {
    list(): Promise<SdkResult<unknown>>
    reply(input: { id: string; response: unknown }): Promise<SdkResult<void>>
  }
  question: {
    list(): Promise<SdkResult<unknown>>
    reply(input: { id: string; response: unknown }): Promise<SdkResult<void>>
    reject(input: { id: string }): Promise<SdkResult<void>>
  }
  tool: { ids(): Promise<SdkResult<string[]>> }
  mcp: { status(): Promise<SdkResult<unknown>> }
  command: { list(): Promise<SdkResult<unknown>> }
  vcs: { get(): Promise<SdkResult<unknown>> }
  app: { agents(input?: Record<string, unknown>): Promise<SdkResult<unknown>> }
  lsp: { status(): Promise<SdkResult<unknown>> }
  path: { get(): Promise<SdkResult<{ home: string; worktree?: string; directory?: string; [key: string]: unknown }>> }
  experimental: { session: { list(input?: any): Promise<SdkResult<any[]>> } }
}

// --- SSE stream helper ---
async function* sseStream(response: Response): AsyncIterable<SseEvent> {
  const reader = response.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  let buffer = "", currentId = "", currentType = "", currentData = ""
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
        else if (line === "" && currentData) {
          try { yield { id: currentId || undefined, type: currentType || "message", data: JSON.parse(currentData) } } catch {}
          currentId = ""; currentType = ""; currentData = ""
        }
      }
    }
  } finally { reader.releaseLock() }
}

// Helper: extract sessionID from old-SDK input object, falling back to direct string ID
function sid(input?: unknown): string {
  if (!input) return ""
  if (typeof input === "string") return input
  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>
    if (typeof obj.sessionID === "string") return obj.sessionID
    if (typeof obj.id === "string") return obj.id
  }
  return String(input)
}

// Helper: extract directory from input object (if present) and return query string for it

// --- Client factory ---
export function createRokcodeClient(options: RokcodeClientOptions): RokcodeClient {
  const http = new RokcodeHttpClient(options)
  return {
    session: {
      list: (input) => http.get<Session[]>(`${API_PREFIX}/session${buildQuery(input)}`),
      create: (input) => http.post<Session>(`${API_PREFIX}/session`, input),
      get: (input) => http.get<Session>(`${API_PREFIX}/session/${sid(input)}${buildQuery(input)}`),
      prompt: (input) => http.post<PromptDelivery>(`${API_PREFIX}/session/${sid(input)}/prompt${buildQuery(input)}`, input),
      promptAsync: (input) => http.post<PromptDelivery>(`${API_PREFIX}/session/${sid(input)}/prompt_async${buildQuery(input)}`, input),
      abort: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/interrupt${buildQuery(input)}`),
      fork: (input) => http.post<Session>(`${API_PREFIX}/session/${sid(input)}/fork${buildQuery(input)}`, input),
      compact: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/compact${buildQuery(input)}`),
      events: async (input, opts) => { const r = await http.stream(`${API_PREFIX}/session/${sid(input)}/event${buildQuery(input)}`, { signal: opts?.signal }); return { data: { stream: sseStream(r) }, response: { status: r.status } } },
      history: (input) => http.get<HistoryEvent[]>(`${API_PREFIX}/session/${sid(input)}/history${buildQuery(input)}`),
      context: (input) => http.get(`${API_PREFIX}/session/${sid(input)}/context${buildQuery(input)}`),
      interrupt: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/interrupt${buildQuery(input)}`),
      active: () => http.get<Record<string, { type: string }>>(`${API_PREFIX}/session/active`),
      status: (input) => http.get<{ type: string }>(`${API_PREFIX}/session/${sid(input)}/status${buildQuery(input)}`),
      stage: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/revert/stage${buildQuery(input)}`, input),
      clear: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/revert/clear${buildQuery(input)}`),
      commit: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/revert/commit${buildQuery(input)}`),
      delete: (input) => http.delete<void>(`${API_PREFIX}/session/${sid(input)}${buildQuery(input)}`),
      update: (input) => http.patch<void>(`${API_PREFIX}/session/${sid(input)}${buildQuery(input)}`, input),
      todo: (input) => http.get(`${API_PREFIX}/session/${sid(input)}/todo${buildQuery(input)}`),
      summarize: (input) => http.post(`${API_PREFIX}/session/${sid(input)}/summarize${buildQuery(input)}`, input),
      command: (input) => http.post(`${API_PREFIX}/session/${sid(input)}/command${buildQuery(input)}`, input),
      shell: (input) => http.post(`${API_PREFIX}/session/${sid(input)}/shell${buildQuery(input)}`, input),
      revert: (input) => http.post(`${API_PREFIX}/session/${sid(input)}/revert${buildQuery(input)}`, input),
      unrevert: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/unrevert${buildQuery(input)}`),
      messages: (input) => http.get(`${API_PREFIX}/session/${sid(input)}/message${buildQuery(input)}`),
      message: (input) => http.get(`${API_PREFIX}/session/${sid(input)}/message/${(input as any)?.messageID || ""}${buildQuery(input)}`),
      share: (input) => http.post(`${API_PREFIX}/session/${sid(input)}/share${buildQuery(input)}`),
      unshare: (input) => http.post(`${API_PREFIX}/session/${sid(input)}/unshare${buildQuery(input)}`),
      switchAgent: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/agent${buildQuery(input)}`, { agent: (input as any)?.agent }),
      switchModel: (input) => http.post<void>(`${API_PREFIX}/session/${sid(input)}/model${buildQuery(input)}`, { model: (input as any)?.model }),
    },
    global: {
      event: async (opts) => { const r = await http.stream(`${API_PREFIX}/event`, { signal: opts?.signal }); return { data: { stream: sseStream(r) }, response: { status: r.status } } },
      config: { get: () => http.get(`${API_PREFIX}/global/config`) },
    },
    provider: {
      auth: (input?) => http.get(`${API_PREFIX}/provider/auth${buildQuery(input)}`),
      list: () => http.get(`${API_PREFIX}/provider/list`),
      disconnect: (input) => http.post(`${API_PREFIX}/provider/${(input as any)?.providerID}/auth${buildQuery({ sessionID: (input as any)?.sessionID })}`),
      oauth: {
        authorize: (input) => http.post(`${API_PREFIX}/provider/oauth/authorize`, input),
        callback: (input) => http.post(`${API_PREFIX}/provider/oauth/callback`, input),
      },
      sources: () => http.get(`${API_PREFIX}/provider/sources`),
    },
    config: {
      get: () => http.get(`${API_PREFIX}/config`),
      update: (input) => http.patch(`${API_PREFIX}/config`, input),
      providers: (input?) => http.get(`${API_PREFIX}/config/providers${buildQuery(input)}`),
      reload: () => http.post<void>(`${API_PREFIX}/config/reload`),
    },
    auth: {
      set: (input) => http.post(`/auth/session`, input),
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
    tool: { ids: () => http.get<string[]>(`${API_PREFIX}/tool/ids`) },
    mcp: { status: () => http.get(`${API_PREFIX}/mcp/status`) },
    command: { list: () => http.get(`${API_PREFIX}/command/list`) },
    vcs: { get: () => http.get(`${API_PREFIX}/vcs`) },
    app: { agents: (input?) => http.get(`${API_PREFIX}/agent${buildQuery(input)}`) },
    lsp: { status: () => http.get(`${API_PREFIX}/lsp/status`) },
    path: { get: () => http.get<{ home: string; worktree?: string; directory?: string; [key: string]: unknown }>(`${API_PREFIX}/path`) },
    experimental: { session: { list: (input: any) => http.get<any[]>(`${API_PREFIX}/session${buildQuery(input)}`) } },
  } satisfies RokcodeClient
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return ""
  const EXCLUDE_QUERY = new Set(["sessionID", "id"])
  const entries = Object.entries(params).filter(([k, v]) => !EXCLUDE_QUERY.has(k) && v !== undefined && v !== null && v !== "" && typeof v !== "object")
  if (entries.length === 0) return ""
  const search = new URLSearchParams()
  for (const [k, v] of entries) search.set(k, String(v))
  return `?${search.toString()}`
}
