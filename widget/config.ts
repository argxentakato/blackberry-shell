// 設定値。環境変数 BLACKBERRY_SHELL_CONFIG が指す JSON (flake.nix が生成する) で
// 上書きでき、未指定やキー欠落のときは DEFAULTS を使う。
import GLib from "gi://GLib?version=2.0"

export interface Config {
  // Mopidy の接続先 (環境変数 MOPIDY_URL が最優先の既定値になる)
  mopidyUrl: string
  // 詳細設定を開く外部アプリ (PATH 上にあること)
  apps: { bluetooth: string; network: string }
  notifications: {
    // タイムアウト未指定の通知を自動で閉じるまでの時間 (ms)
    defaultTimeout: number
    maxHistory: number
  }
  // GLib.DateTime.format の書式
  clock: { format: string }
}

const DEFAULTS: Config = {
  mopidyUrl: GLib.getenv("MOPIDY_URL") ?? "http://localhost:6680",
  apps: { bluetooth: "overskride", network: "nm-connection-editor" },
  notifications: { defaultTimeout: 5000, maxHistory: 100 },
  clock: { format: "%H:%M" },
}

type Override = {
  [K in keyof Config]?: Config[K] extends object ? Partial<Config[K]> : Config[K]
}

function readOverride(): Override {
  const path = GLib.getenv("BLACKBERRY_SHELL_CONFIG")
  if (!path) return {}
  try {
    const [, bytes] = GLib.file_get_contents(path)
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch (e) {
    console.error(`設定ファイルを読めないため既定値を使います: ${path}`, e)
    return {}
  }
}

// セクション (apps など) は 1 階層だけマージする
function merge(base: Config, over: Override): Config {
  return {
    mopidyUrl: over.mopidyUrl ?? base.mopidyUrl,
    apps: { ...base.apps, ...over.apps },
    notifications: { ...base.notifications, ...over.notifications },
    clock: { ...base.clock, ...over.clock },
  }
}

export const config = merge(DEFAULTS, readOverride())
