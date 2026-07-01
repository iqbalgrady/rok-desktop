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

  private url(path: string): string { return `${this.baseUrl}${path}` }

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
export interface RokcodeClient {
  session: {
    list(input?: { workspace?: string; limit?: number; directory?: string; cursor?: string }): Promise<SdkResult<Session[]>>
    create(input: SessionCreateInput): Promise<SdkResult<Session>>
    get(id: string): Promise<SdkResult<Session>>
    prompt(id: string, input: PromptInput): Promise<SdkResult<PromptDelivery>>
    abort(id: string): Promise<SdkResult<void>>
    fork(id: string, input?: { messageID?: string }): Promise<SdkResult<Session>>
    compact(id: string): Promise<SdkResult<void>>
    events(id: string, opts?: { signal?: AbortSignal }): Promise<SdkResult<{ stream: AsyncIterable<SseEvent> }>>
    history(id: string, opts?: { limit?: number; after?: string }): Promise<SdkResult<HistoryEvent[]>>
    context(id: string): Promise<SdkResult<unknown>>
    interrupt(id: string): Promise<SdkResult<void>>
    active(): Promise<SdkResult<Record<string, { type: string }>>>
    delete(id: string): Promise<SdkResult<void>>
    update(id: string, input: Record<string, unknown>): Promise<SdkResult<void>>
    stage(id: string, input: { messageID: string; files?: unknown[] }): Promise<SdkResult<void>>
    clear(id: string): Promise<SdkResult<void>>
    commit(id: string): Promise<SdkResult<void>>
    status(id: string): Promise<SdkResult<{ type: string }>>
    todo(id: string): Promise<SdkResult<unknown>>
    summarize(id: string, input?: unknown): Promise<SdkResult<unknown>>
    command(id: string, input: unknown): Promise<SdkResult<unknown>>
    shell(id: string, input: unknown): Promise<SdkResult<unknown>>
    revert(id: string, input: unknown): Promise<SdkResult<unknown>>
    unrevert(id: string): Promise<SdkResult<void>>
    messages(id: string, opts?: unknown): Promise<SdkResult<unknown>>
    message(id: string, messageID: string): Promise<SdkResult<unknown>>
    switchAgent(id: string, agent: string): Promise<SdkResult<void>>
    switchModel(id: string, model: string): Promise<SdkResult<void>>
  }
  global: {
    event(opts?: { signal?: AbortSignal }): Promise<SdkResult<{ stream: AsyncIterable<SseEvent> }>>
    config: { get(): Promise<SdkResult<unknown>> }
  }
  config: {
    get(): Promise<SdkResult<unknown>>
    update(input: unknown): Promise<SdkResult<void>>
    providers(): Promise<SdkResult<unknown>>
    reload(): Promise<SdkResult<void>>
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
  app: { agents(): Promise<SdkResult<unknown>> }
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
      events: async (id, opts) => { const r = await http.stream(`${API_PREFIX}/session/${id}/event`, { signal: opts?.signal }); return { data: { stream: sseStream(r) }, response: { status: r.status } } },
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
      event: async (opts) => { const r = await http.stream(`${API_PREFIX}/event`, { signal: opts?.signal }); return { data: { stream: sseStream(r) }, response: { status: r.status } } },
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
    tool: { ids: () => http.get<string[]>(`${API_PREFIX}/tool/ids`) },
    mcp: { status: () => http.get(`${API_PREFIX}/mcp/status`) },
    command: { list: () => http.get(`${API_PREFIX}/command/list`) },
    vcs: { get: () => http.get(`${API_PREFIX}/vcs`) },
    app: { agents: () => http.get(`${API_PREFIX}/agent`) },
    lsp: { status: () => http.get(`${API_PREFIX}/lsp/status`) },
    path: { get: () => http.get<{ home: string; worktree?: string; directory?: string; [key: string]: unknown }>(`${API_PREFIX}/path`) },
    experimental: { session: { list: (input: any) => http.get<any[]>(`${API_PREFIX}/session${buildQuery(input)}`) } },
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
