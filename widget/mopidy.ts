// Mopidy クライアント。HTTP の JSON-RPC (既定 http://localhost:6680/mopidy/rpc) を叩く。
// 接続先は環境変数 MOPIDY_URL で変えられる。
import GLib from "gi://GLib?version=2.0"
import { createPoll } from "ags/time"
import { fetch } from "ags/fetch"
import { config } from "./config"

export const MOPIDY_URL = config.mopidyUrl
// 応答が止まっても UI を巻き込まないための上限 (ms)
const TIMEOUT_MS = 2000

interface RpcCall {
  method: string
  params?: object
}

interface RpcResponse {
  id: number
  result?: unknown
  error?: { message: string }
}

function timeout(ms: number) {
  return new Promise<never>((_, reject) => {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
      reject(new Error(`Mopidy の応答が ${ms}ms 以内に返りませんでした`))
      return GLib.SOURCE_REMOVE
    })
  })
}

// 複数の呼び出しを 1 回の HTTP で送る (JSON-RPC バッチ)。結果は渡した順に返る
export async function rpc(calls: RpcCall[]): Promise<unknown[]> {
  const res = await Promise.race([
    fetch(`${MOPIDY_URL}/mopidy/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        calls.map((c, id) => ({ jsonrpc: "2.0", id, method: c.method, params: c.params })),
      ),
    }),
    timeout(TIMEOUT_MS),
  ])
  if (!res.ok) throw new Error(`Mopidy: HTTP ${res.status}`)

  const responses: RpcResponse[] = await Promise.race([res.json(), timeout(TIMEOUT_MS)])
  const results: unknown[] = new Array(calls.length).fill(null)
  for (const r of responses) {
    if (r.error) throw new Error(`Mopidy: ${calls[r.id]?.method}: ${r.error.message}`)
    results[r.id] = r.result
  }
  return results
}

interface Track {
  uri: string
  name?: string
  artists?: { name?: string }[]
  album?: { name?: string }
  length?: number
}

export interface MusicState {
  online: boolean
  state: "play" | "pause" | "stop"
  // 曲の URI (アルバムアートのキーに使う)
  uri: string
  title: string
  artist: string
  album: string
  elapsed: number
  duration: number
}

const OFFLINE: MusicState = {
  online: false,
  state: "stop",
  uri: "",
  title: "",
  artist: "",
  album: "",
  elapsed: 0,
  duration: 0,
}

const STATES = { playing: "play", paused: "pause", stopped: "stop" } as const

// 1 秒ごとに状態を取得する。接続できないときは OFFLINE (同一オブジェクト) を返す
export const music = createPoll<MusicState>(OFFLINE, 1000, async () => {
  try {
    const [state, track, position] = (await rpc([
      { method: "core.playback.get_state" },
      { method: "core.playback.get_current_track" },
      { method: "core.playback.get_time_position" },
    ])) as [keyof typeof STATES, Track | null, number | null]

    return {
      online: true,
      state: STATES[state] ?? "stop",
      uri: track?.uri ?? "",
      title: track?.name ?? "",
      artist: (track?.artists ?? []).map((a) => a.name).filter(Boolean).join(", "),
      album: track?.album?.name ?? "",
      elapsed: (position ?? 0) / 1000,
      duration: (track?.length ?? 0) / 1000,
    }
  } catch {
    return OFFLINE
  }
})

function call(method: string) {
  rpc([{ method }]).catch((e) => console.error(`${method} に失敗:`, e))
}

export function togglePlayback() {
  const { state } = music.peek()
  call(
    state === "play"
      ? "core.playback.pause"
      : state === "pause"
        ? "core.playback.resume"
        : "core.playback.play",
  )
}

export const next = () => call("core.playback.next")
export const previous = () => call("core.playback.previous")
