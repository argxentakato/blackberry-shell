// タスクトレイ (Hyprland のウィンドウ一覧をアイコンで表示。クリックでフォーカス)
import AstalHyprland from "gi://AstalHyprland?version=0.1"
import Gio from "gi://Gio?version=2.0"
import GioUnix from "gi://GioUnix?version=2.0"
import { createBinding, For } from "ags"
import { focusWindow } from "../hyprland"

// インストール済みアプリ (初回アクセス時に一度だけ取得する)
let apps: Gio.AppInfo[] | null = null

// ウィンドウクラスから .desktop を探す。StartupWMClass、無ければ desktop ID で照合する
function findApp(cls: string): Gio.AppInfo | null {
  apps ??= Gio.AppInfo.get_all()
  const key = cls.toLowerCase()
  return (
    apps.find((a) => {
      const wmClass = (a as unknown as GioUnix.DesktopAppInfo).get_startup_wm_class?.()
      const id = a.get_id()?.replace(/\.desktop$/, "").toLowerCase() ?? ""
      return wmClass?.toLowerCase() === key || id === key || id.endsWith(`.${key}`)
    }) ?? null
  )
}

// 見つからないときはクラス名そのものをアイコン名として試し、最後に汎用アイコンにする
function iconFor(cls: string): Gio.Icon {
  const names = ["application-x-executable"]
  if (cls) names.unshift(cls.toLowerCase())
  return findApp(cls)?.get_icon() ?? Gio.ThemedIcon.new_from_names(names)
}

export default function TaskTray() {
  const hyprland = AstalHyprland.get_default()

  // マップ済み (実際に表示されている) ウィンドウのみを対象にする
  const clients = createBinding(hyprland, "clients")((list) =>
    list.filter((c) => c.mapped),
  )

  // 現在フォーカス中のクライアント (アクティブ表示用)
  const focused = createBinding(hyprland, "focusedClient")

  return (
    <box spacing={4} class="task-tray">
      <For each={clients}>
        {(client) => (
          <button
            class={focused((f) =>
              f && f.address === client.address ? "task focused" : "task",
            )}
            tooltipText={createBinding(client, "title")}
            onClicked={() => focusWindow(client.address)}
          >
            <image pixelSize={20} gicon={createBinding(client, "class")(iconFor)} />
          </button>
        )}
      </For>
    </box>
  )
}
